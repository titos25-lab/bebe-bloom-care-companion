import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, ShieldAlert, Lock, Users, Baby, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Card } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useProfile, useUser, useIsPremium, useBaby } from "@/lib/session";
import { babyAge } from "@/lib/baby";

export const Route = createFileRoute("/_authenticated/comunidade")({
  head: () => ({ meta: [{ title: "Comunidade das mães — BabyCare" }] }),
  component: Community,
});

const TOPICS = { experiencia: "Experiência", pergunta: "Pergunta", conselho: "Conselho", desafio: "Desafio" } as const;
const COHORTS = [
  { id: "0-2", label: "0–2 meses", min: 0, max: 2 },
  { id: "3-5", label: "3–5 meses", min: 3, max: 5 },
  { id: "6-8", label: "6–8 meses", min: 6, max: 8 },
  { id: "9-11", label: "9–11 meses", min: 9, max: 11 },
  { id: "12-17", label: "12–17 meses", min: 12, max: 17 },
  { id: "18-24", label: "18–24 meses", min: 18, max: 24 },
  { id: "25+", label: "Mais de 2 anos", min: 25, max: 60 },
];
const cohortFor = (months: number) => COHORTS.find((group) => months >= group.min && months <= group.max) ?? COHORTS[0]!;

function Community() {
  const qc = useQueryClient();
  const { data: user } = useUser();
  const { data: profile } = useProfile();
  const { data: baby } = useBaby();
  const { data: premium } = useIsPremium();
  const [content, setContent] = useState("");
  const [topic, setTopic] = useState<keyof typeof TOPICS>("experiencia");
  const [selectedGroup, setSelectedGroup] = useState("same");
  const posts = useQuery({
    queryKey: ["posts"],
    enabled: !!premium,
    queryFn: async () => {
      const { data, error } = await supabase.from("community_posts").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const ageMonths = baby ? babyAge(baby.birth_date).months : null;
  const ownGroup = ageMonths === null ? null : cohortFor(ageMonths);
  const activeGroup = selectedGroup === "same" ? ownGroup : COHORTS.find((group) => group.id === selectedGroup) ?? null;
  const visiblePosts = (posts.data ?? []).filter((post) => {
    if (selectedGroup === "all") return true;
    if (!activeGroup || post.baby_age_months === null) return false;
    return post.baby_age_months >= activeGroup.min && post.baby_age_months <= activeGroup.max;
  });

  async function post() {
    if (!premium) return;
    if (!user || !baby || content.trim().length < 3) return;
    const currentAge = babyAge(baby.birth_date).months;
    const { data, error } = await supabase.from("community_posts").insert({
      user_id: user.id,
      content: content.trim(),
      topic,
      author_name: profile?.mother_name?.split(" ")[0] ?? "Mãe",
      baby_age_months: currentAge,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    if (data.hidden) toast.warning("A sua publicação ficou em revisão: parece conter dados pessoais ou um conselho de risco.");
    else toast.success("Publicado no círculo da fase do seu bebé 💗");
    setContent("");
    qc.invalidateQueries({ queryKey: ["posts"] });
  }
  async function del(id: string) {
    const { error } = await supabase.from("community_posts").delete().eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["posts"] });
  }

  return (
    <AppShell title="Comunidade">
      {!premium ? (
        <div className="mt-10 text-center">
          <Lock className="mx-auto size-9 text-primary" />
          <h1 className="mt-3 text-xl">Comunidade BabyCare Premium</h1>
          <p className="mt-2 text-sm text-muted-foreground">Partilhe experiências e encontre mães cujos bebés estão a viver uma fase semelhante.</p>
          <Button asChild className="mt-4 rounded-full"><Link to="/planos">Desbloquear comunidade</Link></Button>
        </div>
      ) : (
        <>
          <div className="mt-2 rounded-2xl bg-secondary p-3 text-xs text-secondary-foreground">
            <p className="flex items-center gap-1 font-bold"><ShieldAlert className="size-4" />Um espaço seguro para mães</p>
            Partilhe experiências com respeito. Não publique nomes completos, contactos, moradas, fotografias ou dados médicos identificáveis dos bebés. A comunidade não substitui aconselhamento clínico.
          </div>

          <Card className="mt-3 border-primary/20 bg-gradient-soft">
            <div className="flex items-center gap-2 text-primary"><Users className="size-5" /><p className="font-semibold">Mães na mesma fase</p></div>
            <p className="mt-1 text-sm text-muted-foreground">Encontre conversas de mães cujos bebés têm aproximadamente a mesma idade. A idade é partilhada apenas por faixa, sem mostrar a data de nascimento nem o nome do bebé.</p>
            {ownGroup && <div className="mt-3 rounded-xl bg-card/80 p-3"><p className="text-xs text-muted-foreground">O seu círculo recomendado</p><p className="font-semibold">{ownGroup.label}</p><p className="text-xs text-muted-foreground">Bebés com idade semelhante à de {baby?.name}.</p></div>}
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => setSelectedGroup("same")} className={`rounded-full px-3 py-2 text-xs font-semibold ${selectedGroup === "same" ? "bg-primary text-primary-foreground" : "bg-card text-foreground"}`}>A minha fase</button>
              {COHORTS.map((group) => <button key={group.id} onClick={() => setSelectedGroup(group.id)} className={`rounded-full px-3 py-2 text-xs ${selectedGroup === group.id ? "bg-primary text-primary-foreground" : "bg-card text-foreground"}`}>{group.label}</button>)}
              <button onClick={() => setSelectedGroup("all")} className={`rounded-full px-3 py-2 text-xs ${selectedGroup === "all" ? "bg-primary text-primary-foreground" : "bg-card text-foreground"}`}>Todas</button>
            </div>
          </Card>

          <Card className="mt-3 space-y-2">
            <div className="flex items-center gap-2"><MessageCircle className="size-5 text-primary" /><h2 className="font-semibold">Partilhe com outras mães</h2></div>
            <div className="flex flex-wrap gap-1">{Object.entries(TOPICS).map(([k, v]) => <button key={k} onClick={() => setTopic(k as keyof typeof TOPICS)} className={`rounded-full px-3 py-1 text-xs ${topic === k ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{v}</button>)}</div>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} maxLength={2000} placeholder="Como está a correr esta fase? Partilhe uma experiência ou faça uma pergunta…" />
            <p className="text-right text-[10px] text-muted-foreground">{content.length}/2000</p>
            <Button onClick={post} disabled={!baby || content.trim().length < 3} className="w-full rounded-full">Publicar no meu círculo</Button>
            {!baby && <p className="text-xs text-destructive">Complete primeiro o perfil do bebé para encontrar o círculo certo.</p>}
          </Card>

          <div className="mt-5 flex items-center justify-between">
            <h2 className="text-lg">{selectedGroup === "all" ? "Todas as conversas" : activeGroup ? `Círculo · ${activeGroup.label}` : "Conversas do seu círculo"}</h2>
            <span className="text-xs text-muted-foreground">{visiblePosts.length} publicações</span>
          </div>
          {posts.isLoading ? <p className="py-6 text-center text-sm text-muted-foreground">A carregar conversas…</p> : visiblePosts.length === 0 ? (
            <Card className="mt-3 text-center"><Baby className="mx-auto size-7 text-primary" /><p className="mt-2 font-semibold">Seja a primeira a iniciar a conversa</p><p className="mt-1 text-sm text-muted-foreground">Ainda não há publicações nesta faixa etária. Partilhe uma experiência para dar início ao círculo.</p></Card>
          ) : (
            <ul className="mt-3 space-y-3">
              {visiblePosts.map((p) => {
                const group = p.baby_age_months === null ? null : cohortFor(p.baby_age_months);
                return <li key={p.id}>
                  <Card>
                    <div className="flex items-start justify-between gap-2 text-xs text-muted-foreground">
                      <div><b className="text-foreground">{p.author_name}</b>{group && <span> · Bebé: {group.label}</span>}<p>{TOPICS[p.topic as keyof typeof TOPICS] ?? p.topic} · {new Date(p.created_at).toLocaleDateString("pt-PT")}</p></div>
                      {p.user_id === user?.id && <button onClick={() => del(p.id)} aria-label="Apagar publicação"><Trash2 className="size-4" /></button>}
                    </div>
                    {p.hidden && <p className="mt-1 text-xs text-destructive">Em revisão pela moderação</p>}
                    <p className="mt-2 whitespace-pre-line text-sm">{p.content}</p>
                  </Card>
                </li>;
              })}
            </ul>
          )}
        </>
      )}
    </AppShell>
  );
}
