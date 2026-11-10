import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, RefreshCw, ShieldAlert, Clock3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Card } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/lib/session";
import { addMonths, PLANS } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Administração — BabyCare" }] }),
  component: AdminDashboard,
});

type Subscription = {
  id: string; user_id: string; plan: string; amount_mt: number;
  status: string; payment_ref: string | null; created_at: string;
  starts_at: string | null; expires_at: string | null;
};

function AdminDashboard() {
  const { data: isAdmin, isLoading: checkingAdmin } = useIsAdmin();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: rows = [], isLoading, error, refetch } = useQuery({
    queryKey: ["admin-subscriptions"],
    enabled: isAdmin === true,
    queryFn: async () => {
      const { data, error } = await supabase.from("subscriptions")
        .select("id,user_id,plan,amount_mt,status,payment_ref,created_at,starts_at,expires_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Subscription[];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles", rows.map((r) => r.user_id).join(",")],
    enabled: isAdmin === true && rows.length > 0,
    queryFn: async () => {
      const ids = [...new Set(rows.map((r) => r.user_id))];
      const { data, error } = await supabase.from("profiles").select("id,mother_name").in("id", ids);
      if (error) throw error;
      return data ?? [];
    },
  });

  const profileById = useMemo(() => new Map(profiles.map((p) => [p.id, p.mother_name])), [profiles]);
  const pendingCount = rows.filter((r) => r.status === "pending").length;
  const visibleRows = filter === "pending" ? rows.filter((r) => r.status === "pending") : rows;

  async function decide(row: Subscription, approve: boolean) {
    if (busyId) return;
    setBusyId(row.id);
    const now = new Date();
    const plan = PLANS.find((p) => p.id === row.plan);
    const patch = approve
      ? { status: "active", starts_at: now.toISOString(), expires_at: addMonths(now, plan?.months ?? 1).toISOString() }
      : { status: "rejected", starts_at: null, expires_at: null };
    const { error } = await supabase.from("subscriptions").update(patch)
      .eq("id", row.id).eq("status", "pending");
    setBusyId(null);
    if (error) { toast.error("Não foi possível actualizar. Verifique as permissões da tabela subscriptions."); return; }
    toast.success(approve ? "Pagamento aprovado. Premium activado." : "Pedido rejeitado.");
    await qc.invalidateQueries({ queryKey: ["admin-subscriptions"] });
    await qc.invalidateQueries({ queryKey: ["premium"] });
  }

  if (checkingAdmin) return <AppShell title="Administração"><p className="mt-8 text-sm">A verificar permissões…</p></AppShell>;
  if (!isAdmin) return <AppShell title="Acesso restrito"><Card className="mt-5"><ShieldAlert className="mb-2 size-8 text-destructive" /><h1 className="font-semibold">Acesso não autorizado</h1><p className="mt-1 text-sm text-muted-foreground">Esta área está disponível apenas para administradores.</p></Card></AppShell>;

  return (
    <AppShell title="Administração">
      <div className="mt-3 flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Painel administrativo</h1><p className="text-sm text-muted-foreground">Gestão de pagamentos e subscrições</p></div>
        <Button size="icon" variant="outline" aria-label="Actualizar" onClick={() => refetch()}><RefreshCw className="size-4" /></Button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Card><p className="text-sm text-muted-foreground">Por confirmar</p><p className="mt-1 text-3xl font-bold">{pendingCount}</p></Card>
        <Card><p className="text-sm text-muted-foreground">Total de pedidos</p><p className="mt-1 text-3xl font-bold">{rows.length}</p></Card>
      </div>
      <div className="mt-5 flex gap-2">
        <Button size="sm" variant={filter === "pending" ? "default" : "outline"} onClick={() => setFilter("pending")}>Pendentes ({pendingCount})</Button>
        <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>Todos</Button>
      </div>
      {isLoading && <p className="mt-5 text-sm">A carregar pagamentos…</p>}
      {error && <Card className="mt-4 border-destructive/40"><p className="text-sm text-destructive">Erro ao carregar pedidos: {(error as Error).message}</p></Card>}
      {!isLoading && !error && visibleRows.length === 0 && <Card className="mt-4"><p className="text-sm text-muted-foreground">Não existem pagamentos {filter === "pending" ? "pendentes" : "registados"}.</p></Card>}
      <div className="mt-3 space-y-3">
        {visibleRows.map((row) => {
          const plan = PLANS.find((p) => p.id === row.plan);
          const pending = row.status === "pending";
          return <Card key={row.id}>
            <div className="flex items-start justify-between gap-2">
              <div><p className="font-semibold">{profileById.get(row.user_id) || "Cliente BabyCare"}</p><p className="break-all text-xs text-muted-foreground">ID: {row.user_id}</p></div>
              <span className={`rounded-full px-2 py-1 text-xs ${pending ? "bg-amber-100 text-amber-800" : row.status === "active" ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}`}>{row.status === "pending" ? "Pendente" : row.status === "active" ? "Activo" : row.status}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div><p className="text-muted-foreground">Plano</p><p className="font-medium">{plan?.name ?? row.plan}</p></div>
              <div><p className="text-muted-foreground">Valor</p><p className="font-medium">{row.amount_mt} MT</p></div>
              <div><p className="text-muted-foreground">Referência</p><p className="break-all font-medium">{row.payment_ref || "Ainda não indicada"}</p></div>
              <div><p className="text-muted-foreground">Pedido em</p><p>{new Date(row.created_at).toLocaleString("pt-MZ")}</p></div>
            </div>
            {row.expires_at && <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3" /> Válido até {new Date(row.expires_at).toLocaleDateString("pt-MZ")}</p>}
            {pending && <div className="mt-4 grid grid-cols-2 gap-2">
              <Button className="rounded-full" disabled={!!busyId} onClick={() => decide(row, true)}><CheckCircle2 className="mr-1 size-4" />{busyId === row.id ? "A guardar…" : "Aprovar"}</Button>
              <Button className="rounded-full" variant="outline" disabled={!!busyId} onClick={() => decide(row, false)}><XCircle className="mr-1 size-4" />Rejeitar</Button>
            </div>}
          </Card>;
        })}
      </div>
      <p className="mb-5 mt-5 text-xs text-muted-foreground">Confirma sempre o recebimento no M-Pesa/e-Mola antes de aprovar. A aprovação activa o Premium e define a validade conforme o plano.</p>
    </AppShell>
  );
}
