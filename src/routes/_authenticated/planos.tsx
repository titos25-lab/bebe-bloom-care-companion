import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Card } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { PLANS, PREMIUM_FEATURES, type PlanId, planById } from "@/lib/plans";
import { useIsPremium } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/planos")({
  head: () => ({ meta: [{ title: "Planos Premium — BabyCare" }] }),
  component: Plans,
});

function Plans() {
  const qc = useQueryClient();
  const { data: premium } = useIsPremium();
  async function choose(id: PlanId) {
    const u = (await supabase.auth.getUser()).data.user;
    if (!u) return;
    const { error } = await supabase.from("subscriptions").insert({ user_id: u.id, plan: id, amount_mt: planById(id).price });
    if (error) { toast.error(error.message); return; }
    toast.success("Pedido registado! A sua subscrição será activada após confirmação do pagamento.");
    qc.invalidateQueries();
  }
  return (
    <AppShell title="Planos">
      <h1 className="mt-2 text-2xl">BabyCare Premium</h1>
      {premium && <p className="mt-1 text-sm text-sage-foreground">✓ A sua subscrição está activa.</p>}
      <ul className="mt-3 space-y-1 text-sm">{PREMIUM_FEATURES.map((f) => <li key={f} className="flex gap-2"><Check className="size-4 text-primary" />{f}</li>)}</ul>
      <div className="mt-4 space-y-3">
        {PLANS.map((p) => (
          <Card key={p.id} className="flex items-center justify-between">
            <div><p className="font-semibold">{p.name} {p.highlight && <span className="ml-1 rounded-full bg-accent px-2 py-0.5 text-[11px] text-accent-foreground">{p.highlight}</span>}</p><p className="font-display text-2xl">{p.price} MT <span className="text-sm text-muted-foreground">{p.period}</span></p></div>
            <Button onClick={() => choose(p.id)} className="rounded-full">Escolher</Button>
          </Card>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Gratuito: conteúdos básicos, registos e alerta médico — sempre disponíveis.</p>
    </AppShell>
  );
}
