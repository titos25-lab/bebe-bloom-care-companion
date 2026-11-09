import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Nova palavra-passe — BabyCare" }, { name: "description", content: "Defina uma nova palavra-passe." }, { property: "og:title", content: "Nova palavra-passe — BabyCare" }, { property: "og:description", content: "Defina uma nova palavra-passe." }] }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const nav = useNavigate();
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return toast.error(error.message);
    toast.success("Palavra-passe actualizada.");
    nav({ to: "/inicio" });
  }
  return (
    <form onSubmit={save} className="mx-auto max-w-md space-y-4 px-6 py-16">
      <h1 className="text-2xl">Nova palavra-passe</h1>
      <Input type="password" minLength={6} required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Nova palavra-passe" />
      <Button className="w-full rounded-full">Guardar</Button>
    </form>
  );
}
