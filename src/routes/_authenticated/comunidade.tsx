import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Card } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useProfile, useUser } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/comunidade")({
  head: () => ({ meta: [{ title: "Comunidade das mães — BabyCare" }] }),
  component: Community,
});

const TOPICS = { experiencia: "Experiência", pergunta: "Pergunta", conselho: "Conselho", desafio: "Desafio" } as const;

function Community() {
  const qc = useQueryClient();
  const { data: user } = useUser();
  const { data: profile } = useProfile();
  const [content, setContent] = useState("");
  const [topic, setTopic] = useState<keyof typeof TOPICS>("experiencia");
  const posts = useQuery({ queryKey: ["posts"], queryFn: async () => (await supabase.from("community_posts").select("*").order("created_at", { ascending: false }).limit(50)).data ?? [] });

  async function post() {
    if (!user || content.trim().length < 3) return;
    const { data, error } = await supabase.from("community_posts").insert({ user_id: user.id, content: content.trim(), topic, author_name: profile?.mother_name?.split(" ")[0] ?? "Mãe" }).select().single();
    if (error) { toast.error(error.message); return; }
    if (data.hidden) toast.warning("A sua publicação ficou em revisão: parece conter dados pessoais ou um conselho de risco.");
    else toast.success("Publicado 💗");
    setContent(""); qc.invalidateQueries({ queryKey: ["posts"] });
  }
  async function del(id: string) { await supabase.from("community_posts").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["posts"] }); }

  return (
    <AppShell title="Comunidade">
      <div className="mt-2 rounded-2xl bg-secondary p-3 text-xs text-secondary-foreground">
        <p className="flex items-center gap-1 font-bold"><ShieldAlert className="size-4" />Regras da comunidade</p>
        Seja gentil. Não partilhe nomes completos, contactos, moradas ou fotos de bebés. Não dê conselhos médicos — em caso de dúvida, consulte um profissional.
      </div>
      <Card className="mt-3 space-y-2">
        <div className="flex flex-wrap gap-1">{Object.entries(TOPICS).map(([k, v]) => <button key={k} onClick={() => setTopic(k as keyof typeof TOPICS)} className={`rounded-full px-3 py-1 text-xs ${topic === k ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{v}</button>)}</div>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} maxLength={2000} placeholder="Partilhe uma experiência ou faça uma pergunta…" />
        <Button onClick={post} className="w-full rounded-full">Publicar</Button>
      </Card>
      <ul className="mt-4 space-y-3">
        {(posts.data ?? []).map((p) => (
          <li key={p.id}>
            <Card>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span><b className="text-foreground">{p.author_name}</b> · {TOPICS[p.topic as keyof typeof TOPICS] ?? p.topic} · {new Date(p.created_at).toLocaleDateString("pt-PT")}</span>
                {p.user_id === user?.id && <button onClick={() => del(p.id)} aria-label="Apagar"><Trash2 className="size-4" /></button>}
              </div>
              {p.hidden && <p className="mt-1 text-xs text-destructive">Em revisão pela moderação</p>}
              <p className="mt-2 whitespace-pre-line text-sm">{p.content}</p>
            </Card>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
