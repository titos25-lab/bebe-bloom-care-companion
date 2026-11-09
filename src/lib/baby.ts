export function babyAge(birth: string | Date, now: Date = new Date()) {
  const b = typeof birth === "string" ? new Date(birth + "T00:00:00") : birth;
  const days = Math.max(0, Math.floor((now.getTime() - b.getTime()) / 86400000));
  let months = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
  if (now.getDate() < b.getDate()) months -= 1;
  months = Math.max(0, months);
  const weeks = Math.floor(days / 7);
  return { days, weeks, months };
}

export function ageLabel(birth: string) {
  const { days, weeks, months } = babyAge(birth);
  if (days < 14) return `${days} ${days === 1 ? "dia" : "dias"}`;
  if (months < 2) return `${weeks} semanas`;
  if (months < 24) return `${months} meses`;
  return `${Math.floor(months / 12)} anos`;
}

const MILESTONES: { upTo: number; title: string; items: string[] }[] = [
  { upTo: 1, title: "Recém-nascido", items: ["Reconhece a sua voz e cheiro", "Foca rostos a 20–30 cm", "Mama 8 a 12 vezes por dia"] },
  { upTo: 3, title: "1 a 3 meses", items: ["Primeiros sorrisos sociais", "Segue objectos com o olhar", "Começa a segurar a cabeça"] },
  { upTo: 6, title: "3 a 6 meses", items: ["Ri e palra", "Rola de barriga para baixo", "Leva objectos à boca"] },
  { upTo: 9, title: "6 a 9 meses", items: ["Senta-se com pouco apoio", "Início da alimentação complementar", "Reage ao próprio nome"] },
  { upTo: 12, title: "9 a 12 meses", items: ["Gatinha e põe-se de pé", "Diz “mamã” ou “papá”", "Faz pinça com os dedos"] },
  { upTo: 18, title: "12 a 18 meses", items: ["Primeiros passos", "Aponta para o que quer", "Imita gestos e sons"] },
  { upTo: 25, title: "18 a 24 meses", items: ["Corre e sobe degraus", "Junta duas palavras", "Brinca ao faz-de-conta"] },
];
export function milestonesFor(months: number) {
  return MILESTONES.find((m) => months < m.upTo) ?? MILESTONES[MILESTONES.length - 1];
}

const TIPS = [
  "Faça contacto pele a pele hoje — acalma o bebé e ajuda a produção de leite.",
  "Deite o bebé sempre de barriga para cima para dormir.",
  "Converse e cante para o bebé: a sua voz estimula a linguagem.",
  "Beba água sempre que amamentar.",
  "Momentos de barriga para baixo (acordado e vigiado) fortalecem o pescoço.",
  "Descanse quando o bebé dorme. Cuidar de si é cuidar dele.",
  "Lave as mãos antes de pegar no bebé e de preparar refeições.",
  "Leia uma história curta — nunca é cedo demais.",
];
export function tipOfDay(date = new Date()) {
  const n = Math.floor(date.getTime() / 86400000);
  return TIPS[n % TIPS.length];
}

export function dailyGuidance(months: number) {
  if (months < 1) return ["Amamente em livre demanda", "Limpe o coto umbilical e mantenha-o seco", "Conte as fraldas molhadas (6+ a partir do 5.º dia)"];
  if (months < 4) return ["Ofereça tempo de barriga para baixo 3–5 minutos, várias vezes", "Observe os sinais de sono e evite cansaço excessivo", "Sorria e converse olhos nos olhos"];
  if (months < 6) return ["Brinque com chocalhos e objectos coloridos", "Mantenha a amamentação exclusiva até aos 6 meses", "Comece um ritual de sono nocturno"];
  if (months < 12) return ["Ofereça novos alimentos um de cada vez", "Proteja tomadas e escadas — o bebé vai mexer-se!", "Nomeie objectos e partes do corpo"];
  return ["Ofereça refeições em família, sem sal nem açúcar", "Leia e cante todos os dias", "Incentive-o a explorar com segurança ao ar livre"];
}

// Calendário de vacinação de referência (PAV Moçambique). Confirme sempre com a unidade sanitária.
export const VACCINES: { weeks: number; name: string }[] = [
  { weeks: 0, name: "BCG + Pólio 0" },
  { weeks: 6, name: "Pentavalente 1, Pólio 1, Pneumo 1, Rotavírus 1" },
  { weeks: 10, name: "Pentavalente 2, Pólio 2, Pneumo 2, Rotavírus 2" },
  { weeks: 14, name: "Pentavalente 3, Pólio 3, Pneumo 3, IPV" },
  { weeks: 39, name: "Sarampo/Rubéola 1 (9 meses)" },
  { weeks: 78, name: "Sarampo/Rubéola 2 (18 meses)" },
];
export function vaccineSchedule(birth: string) {
  const b = new Date(birth + "T09:00:00");
  return VACCINES.map((v) => ({ ...v, date: new Date(b.getTime() + v.weeks * 7 * 86400000) }));
}

export const CATEGORIES: { id: string; name: string; emoji: string }[] = [
  { id: "amamentacao", name: "Amamentação e leite", emoji: "🤱" },
  { id: "sono", name: "Sono do bebé", emoji: "🌙" },
  { id: "cuidados", name: "Cuidados diários", emoji: "🛁" },
  { id: "colicas", name: "Arrotar e cólicas", emoji: "🫧" },
  { id: "fraldas", name: "Fraldas e eliminação", emoji: "🧷" },
  { id: "alimentacao", name: "Alimentação complementar", emoji: "🥕" },
  { id: "desenvolvimento", name: "Desenvolvimento", emoji: "🌱" },
];
export const categoryName = (id: string) => CATEGORIES.find((c) => c.id === id)?.name ?? id;
