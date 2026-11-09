import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, ShieldCheck, Moon, BookOpen, Siren } from "lucide-react";
import hero from "@/assets/hero-mother.jpg";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/plans";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BabyCare — Crescer com o seu bebé, cuidar com confiança" },
      { name: "description", content: "Guia, registos e apoio para mães e cuidadores de bebés dos 0 aos 24 meses." },
      { property: "og:title", content: "BabyCare — Meu Bebé" },
      { property: "og:description", content: "Guia, registos e apoio para mães dos 0 aos 24 meses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-gradient-soft">
      <div className="flex items-center justify-between px-5 pt-5">
        <span className="font-display text-2xl text-primary">BabyCare</span>
        <Link to="/auth" className="text-sm font-semibold text-secondary-foreground">Entrar</Link>
      </div>
      <img src={hero} alt="Mãe a abraçar o seu bebé recém-nascido" width={1024} height={1024} className="mx-auto mt-2 w-4/5 rounded-full mix-blend-multiply" />
      <div className="px-6 text-center">
        <h1 className="text-3xl leading-tight">Crescer com o seu bebé, cuidar com confiança.</h1>
        <p className="mt-3 text-muted-foreground">Orientações validadas, registos do dia-a-dia e apoio para os primeiros 1.000 dias.</p>
        <Button asChild size="lg" className="mt-6 w-full rounded-full text-base">
          <Link to="/auth">Começar gratuitamente</Link>
        </Button>
        <Link to="/emergencia" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-destructive">
          <Siren className="size-4" /> Quando levar o bebé ao hospital?
        </Link>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 px-5">
        {[
          { icon: BookOpen, t: "Tudo sobre o bebé", d: "Amamentação, sono, cuidados e mais" },
          { icon: Moon, t: "Registos", d: "Mamadas, sono e fraldas" },
          { icon: Heart, t: "Comunidade", d: "Partilhe com outras mães" },
          { icon: ShieldCheck, t: "Credível", d: "Revisto por profissionais de saúde" },
        ].map(({ icon: Icon, t, d }) => (
          <div key={t} className="rounded-2xl bg-card/80 p-4">
            <Icon className="size-5 text-primary" />
            <p className="mt-2 font-semibold">{t}</p>
            <p className="text-xs text-muted-foreground">{d}</p>
          </div>
        ))}
      </div>
      <div className="px-5 py-8">
        <h2 className="text-center text-xl">Planos Premium</h2>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {PLANS.map((p) => (
            <div key={p.id} className="rounded-2xl bg-card p-3">
              <p className="text-xs text-muted-foreground">{p.name}</p>
              <p className="font-display text-xl">{p.price} MT</p>
              <p className="text-[11px] text-muted-foreground">{p.period}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          A informação educativa não substitui o seu médico. <Link to="/privacidade" className="underline">Privacidade</Link>
        </p>
      </div>
    </div>
  );
}
