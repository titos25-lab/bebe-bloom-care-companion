import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Milk, Moon, Baby, Syringe, Stethoscope, Sparkles, Siren, Lock, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Card, Section } from "@/components/AppShell";
import { useBaby, useProfile, useIsPremium } from "@/lib/session";
import { ageLabel, babyAge, dailyGuidance, milestonesFor, tipOfDay, vaccineSchedule } from "@/lib/baby";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({ meta: [{ title: "Meu Bebé — BabyCare" }] }),
  component: Home,
});

function Home() {
  const { data: baby, isLoading } = useBaby();
  const { data: profile } = useProfile();
  const { data: premium } = useIsPremium();
  const [tipOffset, setTipOffset] = useState(0);
  const since = new Date(Date.now() - 86400000).toISOString();
  const logs = useQuery({
    queryKey: ["logs24", baby?.id],
    enabled: !!baby,
    queryFn: async () => (await supabase.from("care_logs").select("*").eq("baby_id", baby!.id).gte("started_at", since).order("started_at", { ascending: false })).data ?? [],
  });
  const events = useQuery({
    queryKey: ["events-upcoming"],
    queryFn: async () => (await supabase.from("events").select("*").eq("done", false).gte("due_at", new Date().toISOString()).order("due_at").limit(3)).data ?? [],
  });

  if (isLoading) return <AppShell><p className="py-10 text-center text-muted-foreground">A carregar…</p></AppShell>;
  if (!baby) return <Navigate to="/onboarding" />;

  const age = babyAge(baby.birth_date);
  const ms = milestonesFor(age.months);
  const tip = tipOfDay(new Date(), age.months, tipOffset);
  const l = logs.data ?? [];
  const feeds = l.filter((x) => x.kind === "feed");
  const diapers = l.filter((x) => x.kind === "diaper");
  const sleepMin = l.filter((x) => x.kind === "sleep" && x.ended_at).reduce((a, x) => a + (new Date(x.ended_at!).getTime() - new Date(x.started_at).getTime()) / 60000, 0);
  const nextVaccine = vaccineSchedule(baby.birth_date).find((v) => v.date >= new Date(Date.now() - 86400000));

  return (
    <AppShell>
      <div className="mt-2 rounded-3xl bg-gradient-soft p-5 shadow-soft">
        <p className="text-sm text-muted-foreground">Olá, {profile?.mother_name?.split(" ")[0] ?? "mamã"} 💗</p>
        <h1 className="mt-1 text-3xl">{baby.name}</h1>
        <div className="mt-3 flex gap-3">
          <div className="rounded-2xl bg-card/80 px-4 py-2"><p className="text-xs text-muted-foreground">Idade</p><p className="font-display text-xl">{ageLabel(baby.birth_date)}</p></div>
          <div className="rounded-2xl bg-card/80 px-4 py-2"><p className="text-xs text-muted-foreground">Dias de vida</p><p className="font-display text-xl">{age.days}</p></div>
        </div>
      </div>

      <Link to="/emergencia" className="mt-4 flex items-center gap-3 rounded-2xl bg-emergency-soft p-4 text-destructive">
        <Siren className="size-6" /><div><p className="font-bold">Alerta médico</p><p className="text-xs">Sinais para ir ao hospital — sempre gratuito</p></div>
      </Link>

      <Section title="Dica dinâmica do dia">
        <Card className="border-primary/20 bg-gradient-soft">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary"><Sparkles className="size-4" />{tip.title}</p>
            <span className="text-[10px] text-muted-foreground">Adaptada à idade</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed">{tip.text}</p>
          <div className="mt-3 rounded-xl bg-card/80 p-3">
            <p className="text-xs font-bold text-primary">Pequena tarefa de hoje</p>
            <p className="mt-1 text-sm">{tip.action}</p>
          </div>
          <button onClick={() => setTipOffset((n) => n + 1)} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <RefreshCw className="size-4" /> Ver outra dica
          </button>
        </Card>
      </Section>

      <Section title="Últimas 24 horas" action={<Link to="/registos" className="text-sm text-primary">Registar</Link>}>
        <div className="grid grid-cols-3 gap-2">
          <Stat icon={Milk} label="Mamadas" value={feeds.length} />
          <Stat icon={Moon} label="Sono" value={`${Math.floor(sleepMin / 60)}h${String(Math.round(sleepMin % 60)).padStart(2, "0")}`} />
          <Stat icon={Baby} label="Fraldas" value={diapers.length} />
        </div>
      </Section>

      <Section title="Plano de cuidados de hoje">
        {premium ? (
          <Card>
            <p className="mb-3 text-xs text-muted-foreground">Sugestões gerais adequadas à fase de desenvolvimento do bebé.</p>
            <ul className="space-y-2 text-sm">
              {dailyGuidance(age.months).map((g) => <li key={g} className="flex gap-2"><span className="text-sage-foreground">✓</span>{g}</li>)}
            </ul>
          </Card>
        ) : (
          <Link to="/planos" className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-card p-4">
            <Lock className="size-5 text-primary" />
            <div className="flex-1"><p className="font-semibold">Desbloqueie o plano diário Premium</p><p className="text-xs text-muted-foreground">Receba uma lista de cuidados e actividades ajustada à fase do seu bebé.</p></div>
            <span className="text-sm font-bold text-primary">Ver planos</span>
          </Link>
        )}
      </Section>

      <Section title={`Desenvolvimento · ${ms.title}`}>
        {premium ? (
          <Card className="bg-accent">
            <ul className="space-y-1.5 text-sm text-accent-foreground">{ms.items.map((i) => <li key={i}>🌱 {i}</li>)}</ul>
          </Card>
        ) : (
          <Link to="/planos" className="flex items-center gap-3 rounded-2xl border bg-card p-4">
            <Lock className="size-5 text-primary" />
            <div className="flex-1"><p className="font-semibold">Acompanhe cada etapa do desenvolvimento</p><p className="text-xs text-muted-foreground">Marcos de crescimento e orientações por faixa etária.</p></div>
            <span className="text-sm font-bold text-primary">Premium</span>
          </Link>
        )}
      </Section>

      <Section title="Próximas vacinas e consultas" action={<Link to="/calendario" className="text-sm text-primary">Calendário</Link>}>
        <div className="space-y-2">
          {nextVaccine && (
            <Card className="flex items-center gap-3"><Syringe className="size-5 text-primary" /><div><p className="text-sm font-semibold">{nextVaccine.name}</p><p className="text-xs text-muted-foreground">{nextVaccine.date.toLocaleDateString("pt-PT")}</p></div></Card>
          )}
          {(events.data ?? []).map((e) => (
            <Card key={e.id} className="flex items-center gap-3"><Stethoscope className="size-5 text-sage-foreground" /><div><p className="text-sm font-semibold">{e.title}</p><p className="text-xs text-muted-foreground">{new Date(e.due_at).toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short" })}</p></div></Card>
          ))}
        </div>
      </Section>

      {!premium && (
        <Link to="/planos" className="mt-6 flex items-center gap-3 rounded-2xl bg-secondary p-4 text-secondary-foreground">
          <Lock className="size-5" /><div><p className="font-semibold">Desbloqueie o Premium</p><p className="text-xs">Assistente, biblioteca completa e acompanhamento personalizado</p></div>
        </Link>
      )}
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Milk; label: string; value: string | number }) {
  return (
    <Card className="p-3 text-center">
      <Icon className="mx-auto size-5 text-primary" />
      <p className="mt-1 font-display text-xl">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </Card>
  );
}
