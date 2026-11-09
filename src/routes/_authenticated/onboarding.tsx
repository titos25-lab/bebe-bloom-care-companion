import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Conte-nos sobre o seu bebé — BabyCare" }] }),
  component: Onboarding,
});

function Onboarding() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [f, setF] = useState({ mother: "", baby: "", birth: "", sex: "", first: "sim", country: "Moçambique" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const u = (await supabase.auth.getUser()).data.user!;
    const p = await supabase.from("profiles").upsert({ id: u.id, mother_name: f.mother, country: f.country, consent_at: new Date().toISOString() });
    if (p.error) { toast.error(p.error.message); return; }
    const b = await supabase.from("babies").insert({ user_id: u.id, name: f.baby, birth_date: f.birth, sex: f.sex || null, first_child: f.first === "sim" });
    if (b.error) { toast.error(b.error.message); return; }
    await qc.invalidateQueries();
    nav({ to: "/inicio" });
  }
  const sel = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm";
  return (
    <div className="mx-auto min-h-screen max-w-md bg-gradient-soft px-6 py-10">
      <h1 className="text-3xl">Olá! 💗</h1>
      <p className="mt-1 text-muted-foreground">Vamos personalizar a BabyCare para si e o seu bebé.</p>
      <form onSubmit={save} className="mt-6 space-y-4 rounded-3xl bg-card p-5 shadow-soft">
        <div><Label>O seu nome</Label><Input required value={f.mother} onChange={set("mother")} /></div>
        <div><Label>Nome do bebé</Label><Input required value={f.baby} onChange={set("baby")} /></div>
        <div><Label>Data de nascimento do bebé</Label><Input required type="date" max={new Date().toISOString().slice(0, 10)} value={f.birth} onChange={set("birth")} /></div>
        <div><Label>Sexo do bebé (opcional)</Label>
          <select className={sel} value={f.sex} onChange={set("sex")}><option value="">Prefiro não dizer</option><option value="F">Menina</option><option value="M">Menino</option></select></div>
        <div><Label>É o primeiro filho?</Label>
          <select className={sel} value={f.first} onChange={set("first")}><option value="sim">Sim</option><option value="nao">Não</option></select></div>
        <div><Label>País de residência</Label><Input required value={f.country} onChange={set("country")} /></div>
        <Button className="h-11 w-full rounded-full">Começar</Button>
      </form>
    </div>
  );
}
