import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Milk, Moon, Baby, Syringe, Stethoscope, Sparkles, Siren, Lock, RefreshCw, BookHeart } from "lucide-react";
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
  const [activeSlide, setActiveSlide] = useState(0);
  useEffect(() => { const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % 3), 5000); return () => window.clearInterval(timer); }, []);
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
  const hour = new Date().getHours();
  const greeting = hour >= 5 && hour < 12 ? "Bom dia, Mamãe" : hour >= 12 && hour < 18 ? "Boa tarde, Mamãe" : "Boa noite, Mamãe";
  const l = logs.data ?? [];
  const feeds = l.filter((x) => x.kind === "feed");
  const diapers = l.filter((x) => x.kind === "diaper");
  const sleepMin = l.filter((x) => x.kind === "sleep" && x.ended_at).reduce((a, x) => a + (new Date(x.ended_at!).getTime() - new Date(x.started_at).getTime()) / 60000, 0);
  const nextVaccine = vaccineSchedule(baby.birth_date).find((v) => v.date >= new Date(Date.now() - 86400000));

  return (
    <AppShell>
      <div className="mt-2 rounded-3xl bg-gradient-soft p-5 shadow-soft">
        <p className="text-sm text-muted-foreground">{greeting}, {profile?.mother_name?.split(" ")[0] ?? "mamã"} 💗</p>
        <h1 className="mt-1 text-3xl">{baby.name}</h1>
        <div className="mt-3 flex gap-3">
          <div className="rounded-2xl bg-card/80 px-4 py-2"><p className="text-xs text-muted-foreground">Idade</p><p className="font-display text-xl">{ageLabel(baby.birth_date)}</p></div>
          <div className="rounded-2xl bg-card/80 px-4 py-2"><p className="text-xs text-muted-foreground">Dias de vida</p><p className="font-display text-xl">{age.days}</p></div>
        </div>
      </div>

      <section aria-label="Famílias BabyCare" className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg">Cada família é única 💗</h2>
          <span className="text-xs text-muted-foreground">BabyCare</span>
        </div>
        <div className="relative h-44 overflow-hidden rounded-3xl bg-muted">
          {[
            { image: "https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?auto=format&fit=crop&w=900&q=85", title: "Amor que acolhe", subtitle: "Mães e bebés de todas as cores e histórias." },
            { image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=85", title: "Crescemos juntos", subtitle: "Cada etapa merece ser celebrada." },
            { image: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=85", title: "Uma comunidade para si", subtitle: "Partilhe a jornada com outras mães." },
          ].map((slide, index) => (
            <article key={slide.title} aria-hidden={activeSlide !== index} className={`absolute inset-0 transition-opacity duration-700 ${activeSlide === index ? "opacity-100" : "pointer-events-none opacity-0"}`}>
              <img src={slide.image} alt={slide.title} loading="lazy" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.src = "/favicon.ico"; }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <h3 className="text-xl font-semibold">{slide.title}</h3>
                <p className="mt-1 text-xs text-white/90">{slide.subtitle}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-2 flex justify-center gap-2" aria-label="Escolher imagem">
          {[0, 1, 2].map((index) => <button key={index} onClick={() => setActiveSlide(index)} aria-label={`Ver imagem ${index + 1}`} className={`h-2 rounded-full transition-all ${activeSlide === index ? "w-6 bg-primary" : "w-2 bg-muted-foreground/40"}`} />)}
        </div>
      </section>

      <Link to="/comunidade" className="mt-4 flex items-center gap-3 rounded-2xl border border-primary/20 bg-card p-4 shadow-soft">
        <div className="rounded-xl bg-accent p-3 text-primary"><Baby className="size-6" /></div>
        <div className="min-w-0 flex-1"><p className="font-semibold">Encontre mães na mesma fase</p><p className="text-xs text-muted-foreground">Partilhe experiências com mães cujos bebés têm idade semelhante.</p></div>
        <span className="text-sm font-bold text-primary">Entrar</span>
      </Link>

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

      <Link to="/diario" className="mt-5 flex items-center gap-3 rounded-2xl border border-primary/20 bg-card p-4 shadow-soft">
        <div className="rounded-xl bg-accent p-3 text-primary"><BookHeart className="size-6" /></div>
        <div className="min-w-0 flex-1"><p className="font-semibold">Diário do Meu Bebé</p><p className="text-xs text-muted-foreground">Acompanhe memórias, rotina e crescimento num só lugar.</p></div>
        <span className="text-sm font-bold text-primary">Abrir</span>
      </Link>

      <Section title="Últimas 24 horas" action={<Link to="/registos" className="text-sm text-primary">Registar</Link>}>
        <div className="grid grid-cols-3 gap-2">
          {premium ? <Stat icon={Milk} label="Mamadas" value={feeds.length} /> : <LockedStat icon={Milk} label="Mamadas" />}
          {premium ? <Stat icon={Moon} label="Sono" value={`${Math.floor(sleepMin / 60)}h${String(Math.round(sleepMin % 60)).padStart(2, "0")}`} /> : <LockedStat icon={Moon} label="Sono" />}
          {premium ? <Stat icon={Baby} label="Fraldas" value={diapers.length} /> : <LockedStat icon={Baby} label="Fraldas" />}
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

function LockedStat({ icon: Icon, label }: { icon: typeof Milk; label: string }) {
  return <Link to="/planos" className="flex flex-col items-center justify-center rounded-2xl border border-primary/20 bg-card p-3 text-center"><Lock className="size-5 text-primary" /><Icon className="mt-1 size-4 text-primary" /><p className="mt-1 text-sm font-semibold">{label}</p><p className="text-[11px] text-primary">Premium</p></Link>;
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
