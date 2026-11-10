import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Milk, Moon, Baby, Trash2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Card, Section } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useBaby, useIsPremium } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/registos")({
  head: () => ({ meta: [{ title: "Registos — BabyCare" }] }),
  component: Logs,
});

type Kind = "feed" | "sleep" | "diaper";
const nowLocal = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };

function Logs() {
  const { data: baby } = useBaby();
  const { data: premium } = useIsPremium();
  const qc = useQueryClient();
  const [kind, setKind] = useState<Kind>("sleep");
  const [at, setAt] = useState(nowLocal());
  const [end, setEnd] = useState("");
  const [feedType, setFeedType] = useState("peito esquerdo");
  const [minutes, setMinutes] = useState("15");
  const [wet, setWet] = useState(true);
  const [poop, setPoop] = useState(false);
  const [color, setColor] = useState("amarelo");

  const logs = useQuery({
    queryKey: ["logs", baby?.id],
    enabled: !!baby,
    queryFn: async () => (await supabase.from("care_logs").select("*").eq("baby_id", baby!.id).order("started_at", { ascending: false }).limit(50)).data ?? [],
  });

  async function add() {
    if (!baby) return;
    if (kind === "feed" && !premium) { toast.error("O registo detalhado de mamadas é uma funcionalidade Premium."); return; }
    const details = kind === "feed" ? { type: feedType, minutes: Number(minutes) } : kind === "diaper" ? { wet, poop, color: poop ? color : null } : {};
    const { error } = await supabase.from("care_logs").insert({
      user_id: baby.user_id, baby_id: baby.id, kind, started_at: new Date(at).toISOString(),
      ended_at: kind === "sleep" && end ? new Date(end).toISOString() : null, details,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Registado 💗");
    if (kind === "diaper" && poop && ["branco", "preto", "vermelho"].includes(color)) toast.warning("Fezes desta cor exigem avaliação médica. Consulte o seu profissional de saúde.", { duration: 8000 });
    qc.invalidateQueries();
  }
  async function del(id: string) { await supabase.from("care_logs").delete().eq("id", id); qc.invalidateQueries(); }

  const tab = (k: Kind, label: string, Icon: typeof Milk) => (
    <button onClick={() => setKind(k)} className={`flex flex-1 flex-col items-center gap-1 rounded-2xl py-3 text-sm ${kind === k ? "bg-primary text-primary-foreground" : "bg-card"}`}><Icon className="size-5" />{label}{k === "feed" && !premium && <Lock className="size-3" />}</button>
  );
  const input = "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm";
  const today = (logs.data ?? []).filter((x) => new Date(x.started_at).toDateString() === new Date().toDateString());

  return (
    <AppShell title="Registos">
      <div className="mt-2 flex gap-2">{tab("feed", "Mamada", Milk)}{tab("sleep", "Sono", Moon)}{tab("diaper", "Fralda", Baby)}</div>
      {kind === "feed" && !premium ? (
        <Card className="mt-3 border-primary/20 text-center">
          <Lock className="mx-auto size-8 text-primary" />
          <h2 className="mt-2 font-semibold">Registo de mamadas Premium</h2>
          <p className="mt-1 text-sm text-muted-foreground">Registe o peito utilizado, duração, biberões e acompanhe o histórico das mamadas do seu bebé.</p>
          <Button asChild className="mt-3 rounded-full"><Link to="/planos">Desbloquear Premium</Link></Button>
        </Card>
      ) : (
        <Card className="mt-3 space-y-3">
          <label className="block text-sm">{kind === "sleep" ? "Adormeceu às" : "Hora"}<input type="datetime-local" className={input} value={at} onChange={(e) => setAt(e.target.value)} /></label>
          {kind === "feed" && (<div className="grid grid-cols-2 gap-2">
            <select className={input} value={feedType} onChange={(e) => setFeedType(e.target.value)}><option>peito esquerdo</option><option>peito direito</option><option>biberão</option><option>refeição</option></select>
            <input className={input} type="number" min={1} value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="minutos" />
          </div>)}
          {kind === "sleep" && <label className="block text-sm">Acordou às (opcional)<input type="datetime-local" className={input} value={end} onChange={(e) => setEnd(e.target.value)} /></label>}
          {kind === "diaper" && (<div className="space-y-2 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={wet} onChange={(e) => setWet(e.target.checked)} /> Molhada</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={poop} onChange={(e) => setPoop(e.target.checked)} /> Evacuação</label>
            {poop && <select className={input} value={color} onChange={(e) => setColor(e.target.value)}>{["amarelo", "castanho", "verde", "preto", "branco", "vermelho"].map((c) => <option key={c}>{c}</option>)}</select>}
          </div>)}
          <Button onClick={add} className="h-11 w-full rounded-full">Guardar registo</Button>
        </Card>
      )}

      <Section title={`Hoje: ${today.filter((x) => x.kind === "diaper" && (x.details as { wet?: boolean }).wet).length} fraldas molhadas`}>
        <p className="mb-3 text-xs text-muted-foreground">A partir do 5.º dia de vida, espera-se 6 ou mais fraldas molhadas por dia. Menos do que isso pode indicar desidratação.</p>
        <ul className="space-y-2">
          {(logs.data ?? []).filter((x) => x.kind !== "feed" || premium).map((x) => {
            const d = x.details as Record<string, string | number | boolean | null>;
            const desc = x.kind === "feed" ? `Mamada · ${d["type"]} · ${d["minutes"]} min` : x.kind === "sleep" ? `Sono${x.ended_at ? ` · ${Math.round((new Date(x.ended_at).getTime() - new Date(x.started_at).getTime()) / 60000)} min` : " · em curso"}` : `Fralda · ${[d["wet"] && "molhada", d["poop"] && `fezes ${d["color"]}`].filter(Boolean).join(", ") || "seca"}`;
            return (
              <li key={x.id} className="flex items-center justify-between rounded-xl bg-card px-3 py-2 text-sm">
                <div><p>{desc}</p><p className="text-xs text-muted-foreground">{new Date(x.started_at).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" })}</p></div>
                <button onClick={() => del(x.id)} aria-label="Apagar"><Trash2 className="size-4 text-muted-foreground" /></button>
              </li>
            );
          })}
        </ul>
      </Section>
    </AppShell>
  );
}
