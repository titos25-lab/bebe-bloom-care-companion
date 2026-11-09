
create type public.app_role as enum ('admin','user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  mother_name text,
  country text,
  consent_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id=_user_id and role=_role) $$;

create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid());

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.babies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  birth_date date not null,
  sex text,
  first_child boolean,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.babies to authenticated;
grant all on public.babies to service_role;
alter table public.babies enable row level security;
create policy "own babies" on public.babies for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.care_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  baby_id uuid not null references public.babies(id) on delete cascade,
  kind text not null check (kind in ('feed','sleep','diaper')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.care_logs to authenticated;
grant all on public.care_logs to service_role;
alter table public.care_logs enable row level security;
create policy "own logs" on public.care_logs for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  baby_id uuid references public.babies(id) on delete cascade,
  kind text not null check (kind in ('vaccine','appointment','reminder')),
  title text not null,
  due_at timestamptz not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.events to authenticated;
grant all on public.events to service_role;
alter table public.events enable row level security;
create policy "own events" on public.events for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  plan text not null check (plan in ('monthly','quarterly','yearly')),
  amount_mt integer not null,
  status text not null default 'pending' check (status in ('pending','active','cancelled','expired')),
  payment_ref text,
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.subscriptions to authenticated;
grant all on public.subscriptions to service_role;
alter table public.subscriptions enable row level security;
create policy "read own subs" on public.subscriptions for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "request sub" on public.subscriptions for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
create policy "admin update subs" on public.subscriptions for update to authenticated using (public.has_role(auth.uid(),'admin'));

create or replace function public.is_premium(_user_id uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.subscriptions where user_id=_user_id and status='active' and (expires_at is null or expires_at > now()))
$$;

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  summary text not null default '',
  body text not null,
  premium boolean not null default false,
  published boolean not null default true,
  reviewed_by text,
  created_at timestamptz not null default now()
);
grant select on public.articles to anon, authenticated;
grant insert, update, delete on public.articles to authenticated;
grant all on public.articles to service_role;
alter table public.articles enable row level security;
create policy "read published" on public.articles for select to anon, authenticated using (published or public.has_role(auth.uid(),'admin'));
create policy "admin write articles" on public.articles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  author_name text not null default 'Mãe',
  topic text not null default 'experiencia',
  content text not null check (char_length(content) between 3 and 2000),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.community_posts to authenticated;
grant all on public.community_posts to service_role;
alter table public.community_posts enable row level security;
create policy "read visible posts" on public.community_posts for select to authenticated using (not hidden or user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "create post" on public.community_posts for insert to authenticated with check (user_id = auth.uid() and hidden = false);
create policy "delete own post" on public.community_posts for delete to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admin moderate" on public.community_posts for update to authenticated using (public.has_role(auth.uid(),'admin'));

-- automatic moderation: hide posts with phone numbers, emails or dangerous advice keywords
create or replace function public.moderate_post() returns trigger language plpgsql set search_path = public as $$
begin
  if new.content ~* '(\+?\d[\d\s-]{7,}\d)|([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})'
     or new.content ~* '(mel para bebé|mel ao bebé|aguardente|álcool no bebé|dormir de barriga para baixo|chá para recém)' then
    new.hidden := true;
  end if;
  return new;
end $$;
create trigger moderate_post_trg before insert on public.community_posts for each row execute function public.moderate_post();

insert into public.articles (category, title, summary, body, premium, reviewed_by) values
('amamentacao','Como estimular a produção de leite','A produção funciona por oferta e procura.','Quanto mais o bebé mama, mais leite o corpo produz. Ofereça o peito em livre demanda (8 a 12 vezes por dia nos primeiros meses), garanta uma pega correcta, alterne os seios e mantenha-se hidratada e descansada. O contacto pele a pele também ajuda a libertar as hormonas do leite. Evite introduzir biberões sem orientação nas primeiras semanas.',false,'Equipa pediátrica BabyCare'),
('amamentacao','Pega correcta: como reconhecer','Boca bem aberta, lábios virados para fora.','Sinais de boa pega: boca bem aberta, lábio inferior virado para fora, queixo encostado à mama, mais aréola visível acima do que abaixo da boca, e sem dor persistente. Ouve-se o bebé a engolir. Se doer, coloque o dedo mínimo no canto da boca para interromper a sucção e recomece.',false,'Equipa pediátrica BabyCare'),
('amamentacao','O bebé está a mamar o suficiente?','Fraldas e peso são os melhores sinais.','A partir do 5.º dia, espere pelo menos 6 fraldas molhadas por dia e fezes amarelas frequentes. O bebé deve recuperar o peso de nascimento até às 2 semanas. Se tiver poucas fraldas, sonolência excessiva ou pouco ganho de peso, procure o seu profissional de saúde.',false,'Equipa pediátrica BabyCare'),
('amamentacao','Armazenar leite materno com segurança','Temperatura ambiente, frigorífico e congelador.','Temperatura ambiente (até 25 °C): até 4 horas. Frigorífico (4 °C): até 4 dias. Congelador: até 6 meses. Descongele no frigorífico ou em água morna, nunca no micro-ondas. Não volte a congelar leite descongelado.',true,'Equipa pediátrica BabyCare'),
('amamentacao','Ingurgitamento mamário: como aliviar','Esvaziar com frequência e compressas.','Amamente com frequência, faça massagens suaves, extraia um pouco de leite antes da mamada para amolecer a aréola e use compressas frias entre mamadas. Febre, vermelhidão intensa ou dor forte numa zona da mama exigem avaliação médica.',true,'Equipa pediátrica BabyCare'),
('sono','Sono seguro: posição correcta','Sempre de barriga para cima.','Coloque o bebé sempre de barriga para cima, num colchão firme, sem almofadas, mantas soltas ou peluches. Partilhe o quarto, mas não a cama, nos primeiros 6 meses. Evite sobreaquecimento e fumo.',false,'Equipa pediátrica BabyCare'),
('sono','Quantas horas dorme um bebé','Necessidades de sono por idade.','0–3 meses: 14 a 17 horas. 4–11 meses: 12 a 15 horas. 1–2 anos: 11 a 14 horas (incluindo sestas). Cada bebé é único; o importante é que esteja activo e a crescer bem.',false,'Equipa pediátrica BabyCare'),
('sono','Criar uma rotina de sono','Rituais previsíveis ajudam o bebé.','Banho morno, massagem, luz baixa, canção calma e o mesmo horário todas as noites. Coloque o bebé no berço sonolento mas acordado. Sinais de sono: esfregar os olhos, bocejar, olhar perdido, irritação.',true,'Equipa pediátrica BabyCare'),
('cuidados','Como dar banho ao recém-nascido','Água morna a cerca de 37 °C.','Prepare tudo antes. Teste a água com o cotovelo (cerca de 37 °C). Segure a cabeça e o pescoço com firmeza. O banho deve ser curto (5–10 minutos). Nunca deixe o bebé sozinho na água, nem por um segundo.',false,'Equipa pediátrica BabyCare'),
('cuidados','Limpeza do cordão umbilical','Manter limpo e seco.','Mantenha o coto limpo e seco, com a fralda dobrada abaixo dele. Cai normalmente entre 7 e 21 dias. Procure ajuda se houver vermelhidão à volta, mau cheiro, pus ou sangramento.',false,'Equipa pediátrica BabyCare'),
('cuidados','Prevenir assaduras','Fralda limpa e pele seca.','Mude a fralda com frequência, limpe com água morna, seque bem e aplique pomada barreira. Deixe a pele respirar sem fralda alguns minutos por dia.',true,'Equipa pediátrica BabyCare'),
('colicas','Como ajudar o bebé a arrotar','Três posições simples.','1) Ao ombro, com batidinhas suaves nas costas. 2) Sentado no seu colo, apoiando o queixo. 3) De barriga para baixo sobre as suas pernas (acordado). Se não arrotar em alguns minutos, não há problema — pode não precisar.',false,'Equipa pediátrica BabyCare'),
('colicas','Cólicas ou outro desconforto?','Quando o choro é sinal de alerta.','Cólicas: choro intenso, geralmente ao fim do dia, em bebé que mama e cresce bem. Procure avaliação se houver febre, vómitos, recusa alimentar, sangue nas fezes ou choro inconsolável diferente do habitual.',true,'Equipa pediátrica BabyCare'),
('fraldas','O que é esperado nas fraldas','Número e cor por idade.','Dia 1: 1 fralda molhada; dia 2: 2; a partir do dia 5: 6 ou mais. As primeiras fezes (mecónio) são escuras; depois ficam amarelas-mostarda no bebé amamentado. Fezes brancas, pretas (após o mecónio) ou com sangue exigem avaliação médica.',false,'Equipa pediátrica BabyCare'),
('alimentacao','Introdução alimentar aos 6 meses','Começar com purés simples.','Aos 6 meses, comece com purés de legumes, fruta e cereais, um alimento novo de cada vez. Continue a amamentar. Evite sal, açúcar e mel até 1 ano. Sempre sentado e supervisionado para prevenir engasgamento.',false,'Equipa pediátrica BabyCare'),
('alimentacao','Alimentos a evitar','Riscos antes de 1 ano.','Mel (risco de botulismo), sal e açúcar, leite de vaca como bebida principal, frutos secos inteiros, uvas inteiras e alimentos duros e redondos (risco de engasgamento).',true,'Equipa pediátrica BabyCare'),
('desenvolvimento','Marcos dos 0 aos 6 meses','Sorriso, segurar a cabeça, rolar.','2 meses: sorri socialmente, segue com o olhar. 4 meses: segura a cabeça, ri, leva mãos à boca. 6 meses: rola, senta com apoio, palra. Brinque, fale e cante muito com o bebé.',false,'Equipa pediátrica BabyCare'),
('desenvolvimento','Marcos dos 6 aos 24 meses','Sentar, gatinhar, andar e falar.','9 meses: senta sozinho, gatinha, diz "mama/papa". 12 meses: põe-se de pé, primeiros passos, aponta. 18 meses: anda bem, diz várias palavras. 24 meses: corre, junta duas palavras. Converse com o pediatra se notar atrasos.',true,'Equipa pediátrica BabyCare');
