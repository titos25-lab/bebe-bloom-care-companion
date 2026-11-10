export type PlanId = "monthly" | "quarterly" | "yearly";
export const PLANS: { id: PlanId; name: string; price: number; period: string; months: number; highlight?: string }[] = [
  { id: "monthly", name: "Mensal", price: 147, period: "/ mês", months: 1 },
  { id: "quarterly", name: "Trimestral", price: 276, period: "/ 3 meses", months: 3, highlight: "Poupa 37%" },
  { id: "yearly", name: "Anual", price: 512, period: "/ ano", months: 12, highlight: "Melhor valor" },
];
export const PREMIUM_FEATURES = [
  "Assistente BabyCare para esclarecer dúvidas educativas 24h",
  "Biblioteca completa com guias detalhados por tema",
  "Plano diário de cuidados e actividades adaptado à idade",
  "Acompanhamento dos marcos de desenvolvimento",
  "Calendário pessoal de consultas e lembretes",
  "Comunidade privada de mães",
  "Conteúdos e recomendações exclusivas",
];
export function planById(id: PlanId) {
  return PLANS.find((p) => p.id === id)!;
}
export function addMonths(d: Date, months: number) {
  const r = new Date(d);
  r.setMonth(r.getMonth() + months);
  return r;
}
