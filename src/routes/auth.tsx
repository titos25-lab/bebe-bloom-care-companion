import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Bebê Saudável" },
      { name: "description", content: "Entre ou crie a sua conta Bebê Saudável." },
      { property: "og:title", content: "Entrar — Bebê Saudável" },
      { property: "og:description", content: "Entre ou crie a sua conta Bebê Saudável." },
    ],
  }),
  component: AuthPage,
});

const GoogleG = () => (
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
);

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up" | "forgot">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav({ to: "/inicio" });
      } else if (mode === "up") {
        if (!consent) throw new Error("Aceite a política de privacidade para continuar.");
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/inicio" } });
        if (error) throw error;
        toast.success("Enviámos um email de confirmação. Abra-o para activar a conta.");
        setMode("in");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
        if (error) throw error;
        toast.success("Enviámos um link para redefinir a palavra-passe.");
        setMode("in");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function social(provider: "google" | "apple") {
    const r = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin + "/auth" });
    if (r.error) { toast.error(String(r.error.message ?? r.error)); return; }
    if (r.redirected) return;
    nav({ to: "/inicio" });
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-gradient-soft px-6 py-8">
      <Link to="/" className="font-display text-2xl text-primary">Bebê Saudável</Link>
      <h1 className="mt-8 text-3xl">{mode === "up" ? "Criar conta" : mode === "forgot" ? "Recuperar palavra-passe" : "Bem-vinda de volta"}</h1>
      <div className="mt-6 rounded-3xl bg-card p-5 shadow-soft">
        {mode !== "forgot" && (
          <div className="space-y-2">
            <Button type="button" onClick={() => social("google")} className="h-11 w-full rounded-full border border-[#747775] bg-[#FFFFFF] text-[#1F1F1F] hover:bg-[#FFFFFF]">
              <GoogleG /> Continuar com Google
            </Button>
            <Button type="button" onClick={() => social("apple")} className="h-11 w-full rounded-full bg-[#000000] text-[#FFFFFF] hover:bg-[#000000]">
              Continuar com Apple
            </Button>
            <p className="py-2 text-center text-xs text-muted-foreground">ou com email</p>
          </div>
        )}
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {mode !== "forgot" && (
            <div>
              <Label htmlFor="pw">Palavra-passe</Label>
              <Input id="pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          )}
          {mode === "up" && (
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
              <span>Sou responsável pelo bebé e aceito a <Link to="/privacidade" className="underline">política de privacidade</Link>.</span>
            </label>
          )}
          <Button disabled={busy} className="h-11 w-full rounded-full">
            {mode === "up" ? "Criar conta" : mode === "forgot" ? "Enviar link" : "Entrar"}
          </Button>
        </form>
        <div className="mt-4 flex justify-between text-sm">
          <button onClick={() => setMode(mode === "up" ? "in" : "up")} className="text-primary">
            {mode === "up" ? "Já tenho conta" : "Criar conta"}
          </button>
          {mode === "in" && <button onClick={() => setMode("forgot")} className="text-muted-foreground">Esqueci-me da palavra-passe</button>}
          {mode === "forgot" && <button onClick={() => setMode("in")} className="text-muted-foreground">Voltar</button>}
        </div>
      </div>
    </div>
  );
}
