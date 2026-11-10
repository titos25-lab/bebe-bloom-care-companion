import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookHeart, CalendarDays, Lock, Milk, Moon, Baby, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Card, Section } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useBaby, useIsPremium } from "@/lib/session";
import { ageLabel, babyAge, milestonesFor } from "@/lib/baby";

export const Route = createFileRoute("/_authenticated/diario")({
  head: () => ({ meta: [{ title: "Diário do Meu Bebé — BabyCare" }] }),
  component: BabyDiary,
});

function BabyDiary() {
  const { data: baby, isLoading: babyLoading } = useBaby();
  const { data: premium } = useIsPremium();
  const logs = useQuery({
    queryKey: ["baby-diary", baby?.id],
    enabled: !!baby && !!premium,
    queryFn: async () => {
      const { data, error } = await supabase.from("care_logs").select("*")
        .eq("baby_id", baby!.id).order("started_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (babyLoading) return <AppShell title="Diário"><p className="py-10 text-center text-muted-foreground">A carregar o diário…</p></AppShell>;
  if (!baby) return <AppShell title="Diário"><Card className="mt-4 text-center"><p>Primeiro, complete o perfil do seu bebé.</p><Button asChild className="mt-3 rounded-full"><Link to="/onboarding">Criar perfil</Link></Button></Card></AppShell>;

  const age = babyAge(baby.birth_date);
  const milestone = milestonesFor(age.months);
  const entries = logs.data ?? [];
  const today = entries.filter((entry) => new Date(entry.started_at).toDateString() === new Date().toDateString());
  const feeds = today.filter((entry) => entry.kind === "feed").length;
  const sleeps = today.filter((entry) => entry.kind === "sleep").length;
  const diapers = today.filter((entry) => entry.kind === "diaper").length;

  const describe = (entry: (typeof entries)[number]) => {
    const details = (entry.details ?? {}) as Record<string, string | number | boolean | null>;
    if (entry.kind === "feed") return { label: "Mamada", detail: [details.type, details.minutes ? `${details.minutes} min` : null].filter(Boolean).join(" · "), Icon: Milk };
    if (entry.kind === "sleep") {
      const duration = entry.ended_at ? Math.max(0, Math.round((new Date(entry.ended_at).getTime() - new Date(entry.started_at).getTime()) / 60000)) : null;
      return { label: "Sono", detail: duration === null ? "Duração não registada" : `${Math.floor(duration / 60)}h ${duration % 60}min`, Icon: Moon };
    }
    const diaper = [details.wet ? "molhada" : null, details.poop ? `fezes ${details.color ?? ""}` : null].filter(Boolean).join(" · ");
    return { label: "Fralda", detail: diaper || "Registo de fralda", Icon: Baby };
  };

  return (
    <AppShell title="Diário do Meu Bebé">
      <div className="mt-2 rounded-3xl bg-gradient-soft p-5">
        <div className="flex items-center gap-2 text-primary"><BookHeart className="size-5" /><span className="text-xs font-bold uppercase tracking-wide">A nossa história</span></div>
        <h1 className="mt-2 text-2xl">O diário de {baby.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{ageLabel(baby.birth_date)} de descobertas, carinho e crescimento.</p>
        <p className="mt-3 text-xs text-muted-foreground">Cada pequeno registo ajuda a acompanhar a rotina. Celebre os progressos sem comparar o seu bebé com outras crianças.</p>
      </div>

      {!premium ? (
        <Card className="mt-4 text-center">
          <Lock className="mx-auto size-8 text-primary" />
          <h2 className="mt-2 text-lg font-semibold">O Diário do Meu Bebé é Premium</h2>
          <p className="mt-1 text-sm text-muted-foreground">Guarde e reveja os registos de mamadas, sono e fraldas num só lugar, acompanhando a rotina ao longo do tempo.</p>
          <Button asChild className="mt-4 rounded-full"><Link to="/planos">Desbloquear Premium</Link></Button>
        </Card>
      ) : (
        <>
          <Section title="Resumo de hoje">
            <div className="grid grid-cols-3 gap-2">
              <Card className="p-3 text-center"><Milk className="mx-auto size-5 text-primary" /><p className="mt-1 text-xl font-semibold">{feeds}</p><p className="text-xs text-muted-foreground">Mamadas</p></Card>
              <Card className="p-3 text-center"><Moon className="mx-auto size-5 text-primary" /><p className="mt-1 text-xl font-semibold">{sleeps}</p><p className="text-xs text-muted-foreground">Sono</p></Card>
              <Card className="p-3 text-center"><Baby className="mx-auto size-5 text-primary" /><p className="mt-1 text-xl font-semibold">{diapers}</p><p className="text-xs text-muted-foreground">Fraldas</p></Card>
            </div>
            <Button asChild variant="outline" className="mt-3 w-full rounded-full"><Link to="/registos">Adicionar um registo</Link></Button>
          </Section>

          <Section title="Uma etapa de cada vez">
            <Card className="bg-accent">
              <div className="flex items-center gap-2 text-accent-foreground"><Sparkles className="size-4" /><span className="text-xs font-bold uppercase">Fase actual · {milestone.title}</span></div>
              <ul className="mt-3 space-y-2 text-sm text-accent-foreground">{milestone.items.map((item) => <li key={item}>🌱 {item}</li>)}</ul>
              <p className="mt-3 text-xs text-accent-foreground/80">Os marcos variam de bebé para bebé. Esta lista é educativa e não substitui a avaliação do profissional de saúde.</p>
            </Card>
          </Section>

          <Section title="Memórias recentes" action={<span className="text-xs text-muted-foreground">{entries.length} registos</span>}>
            {logs.isLoading ? <p className="text-sm text-muted-foreground">A carregar memórias…</p> : entries.length === 0 ? (
              <Card className="text-center"><CalendarDays className="mx-auto size-7 text-primary" /><p className="mt-2 font-semibold">A primeira memória começa hoje</p><p className="mt-1 text-sm text-muted-foreground">Registe uma mamada, uma sesta ou uma fralda para começar a construir o diário.</p><Button asChild className="mt-3 rounded-full"><Link to="/registos">Fazer primeiro registo</Link></Button></Card>
            ) : (
              <div className="space-y-2">
                {entries.map((entry) => {
                  const item = describe(entry);
                  const Icon = item.Icon;
                  return <Card key={entry.id} className="flex items-center gap-3 p-3"><div className="rounded-xl bg-accent p-2 text-primary"><Icon className="size-5" /></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{item.label}</p><p className="truncate text-xs text-muted-foreground">{item.detail}</p></div><div className="text-right text-xs text-muted-foreground">{new Date(entry.started_at).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })}<br />{new Date(entry.started_at).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}</div></Card>;
                })}
              </div>
            )}
          </Section>
        </>
      )}
    </AppShell>
  );
}
