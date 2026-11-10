import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Card } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useBaby, useProfile, useUser, useIsAdmin } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({ meta: [{ title: "Perfil — BabyCare" }] }),
  component: Profile,
});

function Profile() {
  const { data: user } = useUser();\n  const { data: isAdmin } = useIsAdmin();
  const { data: profile } = useProfile();
  const { data: baby } = useBaby();
  const qc = useQueryClient();
  const nav = useNavigate();
  async function out() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  }
  const links = [["/calendario", "Calendário e lembretes"], ["/comunidade", "Comunidade das mães"], ["/planos", "Planos Premium"], ["/privacidade", "Privacidade"]] as const;
  return (
    <AppShell title="Perfil">
      <Card className="mt-2"><p className="font-display text-xl">{profile?.mother_name}</p><p className="text-sm text-muted-foreground">{user?.email} · {profile?.country}</p>{baby && <p className="mt-1 text-sm">Bebé: {baby.name} ({new Date(baby.birth_date).toLocaleDateString("pt-PT")})</p>}</Card>
      <ul className="mt-4 space-y-2">{links.map(([to, l]) => <li key={to}><Link to={to} className="block rounded-xl bg-card p-4 text-sm">{l}</Link></li>)}{isAdmin && <li><Link to="/admin" className="block rounded-xl border border-primary/30 bg-card p-4 text-sm font-semibold text-primary">Painel de administração</Link></li>}</ul>
      <Button variant="outline" onClick={out} className="mt-6 w-full rounded-full">Terminar sessão</Button>
    </AppShell>
  );
}
