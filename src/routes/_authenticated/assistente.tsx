import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Send, Lock, Siren } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { askAssistant } from "@/server/assistant.functions";
import { useIsPremium, useIsAdmin } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/assistente")({
  head: () => ({ meta: [{ title: "Assistente BabyCare" }] }),
  component: Assistant,
});

const EXAMPLES = [
  "O meu bebé não consegue dormir, o que posso fazer?",
  "Como sei se estou a produzir leite suficiente?",
  "O meu bebé chora muito depois de mamar.",
  "Quantas fraldas deve molhar por dia?",
  "O meu bebé tem soluços, é normal?",
];

type Msg = { role: "user" | "assistant"; content: string; danger?: boolean };

function Assistant() {
  const ask = useServerFn(askAssistant);
  const { data: premium } = useIsPremium();
  const { data: admin } = useIsAdmin();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const allowed = premium || admin;

  async function send(q: string) {
    if (!q.trim() || busy) return;
    const next = [...msgs, { role: "user" as const, content: q }];
    setMsgs(next); setText(""); setBusy(true);
    try {
      const r = await ask({ data: { messages: next.map(({ role, content }) => ({ role, content })) } });
      setMsgs([...next, r.premiumRequired ? { role: "assistant", content: "O assistente é uma funcionalidade Premium." } : { role: "assistant", content: r.reply, danger: r.danger }]);
    } catch {
      setMsgs([...next, { role: "assistant", content: "Ocorreu um erro. Tente novamente dentro de momentos." }]);
    } finally { setBusy(false); }
  }

  return (
    <AppShell title="Assistente">
      <div className="mt-2 rounded-2xl bg-accent p-3 text-xs text-accent-foreground">Respostas educativas. O assistente não faz diagnósticos nem substitui o seu médico.</div>
      {!allowed ? (
        <div className="mt-8 text-center">
          <Lock className="mx-auto size-8 text-primary" />
          <h1 className="mt-2 text-xl">Assistente Premium</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tire dúvidas 24h por dia com respostas adaptadas à idade do seu bebé.</p>
          <Button asChild className="mt-4 rounded-full"><Link to="/planos">Ver planos</Link></Button>
        </div>
      ) : (
        <>
          <div className="mt-4 space-y-3">
            {msgs.length === 0 && EXAMPLES.map((e) => <button key={e} onClick={() => send(e)} className="block w-full rounded-2xl border bg-card p-3 text-left text-sm">{e}</button>)}
            {msgs.map((m, i) => (
              <div key={i} className={`max-w-[85%] whitespace-pre-line rounded-2xl p-3 text-sm ${m.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-card border"}`}>
                {m.content}
                {m.danger && <Link to="/emergencia" className="mt-2 flex items-center gap-1 font-bold text-destructive"><Siren className="size-4" />Ver sinais de alerta</Link>}
              </div>
            ))}
            {busy && <p className="text-sm text-muted-foreground">A escrever…</p>}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="fixed inset-x-0 bottom-16 z-10 mx-auto flex max-w-md gap-2 bg-background px-5 py-2">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escreva a sua pergunta…" className="h-11 flex-1 rounded-full border border-input bg-card px-4 text-sm" />
            <Button size="icon" className="size-11 rounded-full" disabled={busy} aria-label="Enviar"><Send /></Button>
          </form>
          <div className="h-16" />
        </>
      )}
    </AppShell>
  );
}
