import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { CATEGORIES } from "@/lib/baby";
import { useIsPremium } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/aprender/")({
  head: () => ({ meta: [{ title: "Tudo sobre o bebé — BabyCare" }] }),
  component: Learn,
});

function Learn() {
  const [cat, setCat] = useState("amamentacao");
  const { data: premium } = useIsPremium();
  const idx = useQuery({ queryKey: ["article-index"], queryFn: async () => (await supabase.rpc("article_index")).data ?? [] });
  const list = (idx.data ?? []).filter((a) => a.category === cat);
  return (
    <AppShell title="Aprender">
      <h1 className="mt-2 text-2xl">Tudo sobre o bebé</h1>
      <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-2">
        {CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)} className={`shrink-0 rounded-full px-4 py-2 text-sm ${cat === c.id ? "bg-primary text-primary-foreground" : "bg-card border"}`}>{c.emoji} {c.name}</button>
        ))}
      </div>
      <ul className="mt-3 space-y-2">
        {list.map((a) => {
          const locked = a.premium && !premium;
          return (
            <li key={a.id}>
              <Link to={locked ? "/planos" : "/aprender/$id"} params={{ id: a.id }} className="flex items-start justify-between gap-3 rounded-2xl border bg-card p-4">
                <div><p className="font-semibold">{a.title}</p><p className="text-sm text-muted-foreground">{a.summary}</p></div>
                {locked && <span className="flex shrink-0 items-center gap-1 rounded-full bg-secondary px-2 py-1 text-[11px] text-secondary-foreground"><Lock className="size-3" />Premium</span>}
              </Link>
            </li>
          );
        })}
        {list.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Em breve novos conteúdos.</p>}
      </ul>
    </AppShell>
  );
}
