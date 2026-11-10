import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Copy, Smartphone, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Card } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { PLANS, PREMIUM_FEATURES, type PlanId, planById } from "@/lib/plans";
import { useIsPremium } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/planos")({
  head: () => ({ meta: [{ title: "Planos Premium — BabyCare" }] }),
  component: Plans,
});

const EMOLA_NUMBER = "875414048";

function Plans() {
  const qc = useQueryClient();
  const { data: premium } = useIsPremium();
  const [selected, setSelected] = useState<PlanId | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);

  async function choose(id: PlanId) {
    const u = (await supabase.auth.getUser()).data.user;
    if (!u) { toast.error("Inicie sessão para continuar."); return; }
    setBusy(true);
    const { data, error } = await supabase.from("subscriptions").insert({
      user_id: u.id, plan: id, amount_mt: planById(id).price, status: "pending",
    }).select("id").single();
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setSelected(id);
    setRequestId(data.id);
    setReference("");
    toast.success("Pedido criado. Faça a transferência e guarde o comprovativo.");
  }

  async function saveReference() {
    if (!requestId || !reference.trim()) {
      toast.error("Introduza a referência da transacção.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("subscriptions")
      .update({ payment_ref: reference.trim() })
      .eq("id", requestId);
    setBusy(false);
    if (error) { toast.error("Não foi possível guardar a referência. Contacte o suporte e apresente o comprovativo."); return; }
    toast.success("Referência registada. A activação será feita após confirmação do pagamento.");
    qc.invalidateQueries();
  }

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(EMOLA_NUMBER);
      toast.success("Número e-Mola copiado.");
    } catch {
      toast.info("Número e-Mola: " + EMOLA_NUMBER);
    }
  }

  const chosenPlan = selected ? planById(selected) : null;

  return (
    <AppShell title="Planos">
      <h1 className="mt-2 text-2xl">BabyCare Premium</h1>
      {premium && <p className="mt-1 text-sm text-sage-foreground">✓ A sua subscrição está activa.</p>}
      <ul className="mt-3 space-y-2 text-sm">{PREMIUM_FEATURES.map((f) => <li key={f} className="flex gap-2"><Check className="size-4 shrink-0 text-primary" />{f}</li>)}</ul>

      <div className="mt-5 space-y-3">
        {PLANS.map((p) => (
          <Card key={p.id} className="flex items-center justify-between gap-3">
            <div><p className="font-semibold">{p.name} {p.highlight && <span className="ml-1 rounded-full bg-accent px-2 py-0.5 text-[11px] text-accent-foreground">{p.highlight}</span>}</p><p className="font-display text-2xl">{p.price} MT <span className="text-sm text-muted-foreground">{p.period}</span></p></div>
            <Button disabled={busy} onClick={() => choose(p.id)} className="rounded-full">{busy && selected === p.id ? "A processar…" : "Escolher"}</Button>
          </Card>
        ))}
      </div>

      {chosenPlan && requestId && (
        <section className="mt-5 space-y-3" aria-live="polite">
          <Card className="border-primary/30 bg-gradient-soft">
            <div className="flex items-center gap-2"><Smartphone className="size-5 text-primary" /><h2 className="font-semibold">Pagamento por e-Mola</h2></div>
            <p className="mt-3 text-sm">Plano seleccionado: <b>{chosenPlan.name}</b></p>
            <p className="text-2xl font-bold text-primary">{chosenPlan.price} MT</p>
            <p className="mt-3 text-sm">Faça uma transferência e-Mola para o seguinte número:</p>
            <div className="mt-2 flex items-center justify-between rounded-xl bg-card p-3">
              <span className="text-xl font-bold tracking-wider">{EMOLA_NUMBER}</span>
              <Button type="button" variant="outline" size="sm" onClick={copyNumber}><Copy className="mr-1 size-4" />Copiar</Button>
            </div>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
              <li>Abra o e-Mola no seu telemóvel.</li>
              <li>Transfira exactamente {chosenPlan.price} MT para o número indicado.</li>
              <li>Guarde o comprovativo e a referência da transacção.</li>
              <li>Registe a referência abaixo para associar o pagamento ao seu pedido.</li>
            </ol>
            <label className="mt-4 block text-sm font-medium" htmlFor="payment-reference">Referência da transacção</label>
            <input id="payment-reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Introduza a referência do e-Mola" className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" />
            <Button className="mt-3 w-full rounded-full" onClick={saveReference} disabled={busy || !reference.trim()}>{busy ? "A guardar…" : "Registar referência"}</Button>
            <div className="mt-3 flex gap-2 rounded-xl bg-card/80 p-3 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 shrink-0 text-primary" />
              <p>O Premium só será activado depois de o pagamento ser confirmado. Registar a referência não confirma automaticamente a transferência.</p>
            </div>
          </Card>
        </section>
      )}

      <p className="mt-4 text-xs text-muted-foreground">Gratuito: conteúdos básicos, registos e alerta médico — sempre disponíveis.</p>
    </AppShell>
  );
}
