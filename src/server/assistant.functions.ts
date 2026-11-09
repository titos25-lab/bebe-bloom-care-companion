import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DANGER = /(n[aã]o respira|respira(r)? mal|dificuldade (em|para) respirar|convuls|azul|roxo|febre|38|sangue|v[oó]mito verde|n[aã]o acorda|mole|desidrat|n[aã]o mama|recusa mamar|amarel|icter)/i;

type Msg = { role: "user" | "assistant"; content: string };

export const askAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { messages: Msg[] }) => {
    const messages = (input.messages ?? []).slice(-10).map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content).slice(0, 2000) })) as Msg[];
    if (!messages.length) throw new Error("Pergunta vazia");
    return { messages };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: premium } = await supabase.rpc("is_premium", { _user_id: userId });
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!premium && !isAdmin) return { premiumRequired: true as const, reply: "" };

    const { data: baby } = await supabase.from("babies").select("name, birth_date").order("created_at").limit(1).maybeSingle();
    const ageMonths = baby ? Math.floor((Date.now() - new Date(baby.birth_date).getTime()) / (30.44 * 86400000)) : null;
    const last = data.messages[data.messages.length - 1]?.content ?? "";
    const danger = DANGER.test(last);

    const { generateResponse } = await import("@lovable.dev/ai-gateway");
    const res = await generateResponse({
      model: "openai/gpt-6-astra",
      instructions: `És o Assistente BabyCare, um guia educativo em português (variante de Moçambique/Portugal) para mães de bebés dos 0 aos 24 meses.
${baby ? `O bebé chama-se ${baby.name} e tem cerca de ${ageMonths} meses.` : ""}
Regras:
- Responde de forma calorosa, clara e curta (máx. ~180 palavras), com passos práticos adequados à idade.
- Baseia-te em orientações da OMS, UNICEF e sociedades de pediatria. Não inventes.
- NUNCA faças diagnósticos nem receites medicamentos ou doses.
- Se houver qualquer sinal de perigo (dificuldade respiratória, febre ≥38 °C em menores de 3 meses, convulsões, lábios azulados, recusa alimentar, sonolência extrema, desidratação, vómitos verdes/com sangue, sangue nas fezes, icterícia), começa por recomendar avaliação médica IMEDIATA e não tranquilizes a mãe.
- Em dúvidas sobre crescimento ou peso, recomenda o acompanhamento com o profissional de saúde.
- Termina, quando relevante, lembrando que a informação é educativa.`,
      input: data.messages.map((m) => ({ role: m.role, content: m.content })),
    });

    let reply = "";
    for (const item of res.output ?? []) {
      if (item.type === "message") {
        for (const c of item.content ?? []) if (c.type === "output_text") reply += c.text;
      }
    }
    if (danger) reply = "⚠️ O que descreve pode ser um sinal de alerta. Procure avaliação médica imediatamente ou contacte os serviços de emergência.\n\n" + reply;
    return { premiumRequired: false as const, reply: reply || "Desculpe, não consegui responder agora. Tente novamente.", danger };
  });
