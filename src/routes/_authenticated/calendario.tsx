import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Syringe, Check, Trash2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Card, Section } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useBaby, useIsPremium } from "@/lib/session";
import { vaccineSchedule } from "@/lib/baby";

export const Route = createFileRoute("/_authenticated/calendario")({
  head: () => ({ meta: [{ title: "Calendário e lembretes — BabyCare" }] }),
  component: Cal,
});

const LABEL = { vaccine: "Vacina", appointment: "Consulta", reminder: "Lembrete" } as const;

function Cal() {
  const { data: baby } = useBaby();
  const { data: premium } = useIsPremium();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<"appointment" | "reminder" | "vaccine">("appointment");
  const [when, setWhen] = useState("");
  const ev = useQuery({ queryKey: ["events"], queryFn: async () => (await supabase.from("events").select("*").order("due_at")).data ?? [] });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!baby || !premium) return;
    const { error } = await supabase.from("events").insert({ user_id: baby.user_id, baby_id: baby.id, kind, title, due_at: new Date(when).toISOString() });
    if (error) { toast.error(error.message); return; }
    setTitle(""); setWhen(""); qc.invalidateQueries();
  }
  async function toggle(id: string, done: boolean) { await supabase.from("events").update({ done: !done }).eq("id", id); qc.invalidateQueries(); }
  async function del(id: string) { await supabase.from("events").delete().eq("id", id); qc.invalidateQueries(); }
  const input = "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm";

  return (
    <AppShell title="Calendário">
      <Section title="Consultas e lembretes pessoais">
        {premium ? (
          <Card>
            <form onSubmit={add} className="space-y-2">
              <select className={input} value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
                <option value="appointment">Consulta pediátrica</option><option value="reminder">Lembrete</option><option value="vaccine">Vacina</option>
              </select>
              <input className={input} required placeholder="Ex.: Consulta dos 2 meses" value={title} onChange={(e) => setTitle(e.target.value)} />
              <input className={input} required type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
              <Button className="w-full rounded-full">Adicionar</Button>
            </form>
          </Card>
        ) : (
          <Link to="/planos" className="flex items-center gap-3 rounded-2xl border bg-card p-4">
            <Lock className="size-5 text-primary" /><div><p className="font-semibold">Lembretes personalizados Premium</p><p className="text-xs text-muted-foreground">Organize consultas, vacinas e tarefas importantes num só lugar.</p></div>
          </Link>
        )}
      </Section>
      {premium && (
        <Section title="Os meus eventos">
          <ul className="space-y-2">
            {(ev.data ?? []).map((e) => (
              <li key={e.id} className={`flex items-center justify-between rounded-xl bg-card px-3 py-2 text-sm ${e.done ? "opacity-50" : ""}`}>
                <div><p className="font-semibold">{LABEL[e.kind as keyof typeof LABEL]} · {e.title}</p><p className="text-xs text-muted-foreground">{new Date(e.due_at).toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short" })}</p></div>
                <div className="flex gap-3"><button onClick={() => toggle(e.id, e.done)} aria-label="Concluir"><Check className="size-4 text-sage-foreground" /></button><button onClick={() => del(e.id)} aria-label="Apagar"><Trash2 className="size-4 text-muted-foreground" /></button></div>
              </li>
            ))}
            {(ev.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">Ainda sem eventos.</p>}
          </ul>
        </Section>
      )}
      {baby && (
        <Section title="Calendário de vacinação">
          <p className="mb-2 text-xs text-muted-foreground">Referência do Programa Alargado de Vacinação. Confirme sempre com a sua unidade sanitária.</p>
          <ul className="space-y-2">
            {vaccineSchedule(baby.birth_date).map((v) => {
              const past = v.date < new Date();
              return (
                <li key={v.weeks} className="flex items-center gap-3 rounded-xl bg-card px-3 py-2 text-sm">
                  <Syringe className={`size-4 ${past ? "text-muted-foreground" : "text-primary"}`} />
                  <div><p className={past ? "text-muted-foreground" : "font-semibold"}>{v.name}</p><p className="text-xs text-muted-foreground">{v.date.toLocaleDateString("pt-PT")}</p></div>
                </li>
              );
            })}
          </ul>
        </Section>
      )}
    </AppShell>
  );
}
