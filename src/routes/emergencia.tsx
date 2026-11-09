import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Siren, Phone, ArrowLeft, AlertTriangle } from "lucide-react";
import { EMERGENCY_SIGNS } from "@/lib/emergency";

export const Route = createFileRoute("/emergencia")({
  head: () => ({
    meta: [
      { title: "Alerta médico — Quando levar o bebé ao hospital | BabyCare" },
      { name: "description", content: "Sinais de alerta que exigem assistência médica imediata para bebés." },
      { property: "og:title", content: "Quando levar o bebé ao hospital?" },
      { property: "og:description", content: "Sinais de alerta que exigem assistência médica imediata." },
    ],
  }),
  component: Emergency,
});

function Emergency() {
  const [sel, setSel] = useState<string | null>(null);
  const sign = EMERGENCY_SIGNS.find((s) => s.id === sel);
  return (
    <div className="mx-auto min-h-screen max-w-md bg-emergency-soft px-5 pb-10 pt-4">
      <button onClick={() => history.back()} className="flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="size-4" /> Voltar</button>
      <div className="mt-4 flex items-center gap-2 text-destructive">
        <Siren className="size-7" />
        <h1 className="text-2xl">Quando levar o bebé ao hospital?</h1>
      </div>
      <p className="mt-2 text-sm">Toque num sinal se o observar no seu bebé. Esta informação é gratuita e não substitui um profissional de saúde.</p>

      {sign && (
        <div role="alert" className="mt-4 rounded-2xl bg-destructive p-5 text-destructive-foreground shadow-soft">
          <p className="flex items-center gap-2 font-bold"><AlertTriangle className="size-5" /> {sign.title}</p>
          <p className="mt-2 text-lg font-bold">Procure assistência médica IMEDIATAMENTE.</p>
          <p className="mt-1 text-sm">Dirija-se à unidade sanitária ou hospital mais próximo ou ligue para os serviços de emergência. Não espere para ver se melhora.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <a href="tel:117" className="flex items-center justify-center gap-2 rounded-full bg-card py-3 font-bold text-destructive"><Phone className="size-4" /> Ligar 117</a>
            <a href="tel:112" className="flex items-center justify-center gap-2 rounded-full bg-card py-3 font-bold text-destructive"><Phone className="size-4" /> Ligar 112</a>
          </div>
        </div>
      )}

      <ul className="mt-5 space-y-2">
        {EMERGENCY_SIGNS.map((s) => (
          <li key={s.id}>
            <button onClick={() => { setSel(s.id); window.scrollTo({ top: 0, behavior: "smooth" }); }} className={`w-full rounded-2xl border-2 bg-card p-4 text-left ${sel === s.id ? "border-destructive" : "border-transparent"}`}>
              <p className="font-semibold text-destructive">{s.title}</p>
              <p className="text-sm text-muted-foreground">{s.detail}</p>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs text-muted-foreground">Números de emergência podem variar por país. Confirme o número local. <Link to="/" className="underline">BabyCare</Link></p>
    </div>
  );
}
