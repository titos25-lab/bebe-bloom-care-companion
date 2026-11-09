import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { categoryName } from "@/lib/baby";

export const Route = createFileRoute("/_authenticated/aprender/$id")({
  head: () => ({ meta: [{ title: "Artigo — BabyCare" }] }),
  component: Article,
});

function Article() {
  const { id } = Route.useParams();
  const q = useQuery({ queryKey: ["article", id], queryFn: async () => (await supabase.from("articles").select("*").eq("id", id).maybeSingle()).data });
  const a = q.data;
  return (
    <AppShell>
      <Link to="/aprender" className="text-sm text-muted-foreground">← Voltar</Link>
      {q.isLoading ? <p className="py-10 text-center">A carregar…</p> : !a ? (
        <div className="py-10 text-center"><p>Este conteúdo é exclusivo Premium.</p><Link to="/planos" className="text-primary underline">Ver planos</Link></div>
      ) : (
        <article className="mt-3">
          <p className="text-xs uppercase tracking-wide text-primary">{categoryName(a.category)}</p>
          <h1 className="mt-1 text-2xl">{a.title}</h1>
          <p className="mt-4 whitespace-pre-line leading-relaxed">{a.body}</p>
          <div className="mt-6 flex items-center gap-2 rounded-xl bg-accent p-3 text-xs text-accent-foreground">
            <ShieldCheck className="size-4" /> Revisto por: {a.reviewed_by ?? "a aguardar revisão"}. Informação educativa — não substitui o seu médico.
          </div>
        </article>
      )}
    </AppShell>
  );
}
