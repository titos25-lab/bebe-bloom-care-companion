
drop policy "read published" on public.articles;
create policy "read published free or premium" on public.articles for select to anon, authenticated
using ((published and (not premium or public.is_premium(auth.uid()))) or public.has_role(auth.uid(),'admin'));

create or replace function public.article_index()
returns table (id uuid, category text, title text, summary text, premium boolean)
language sql stable security definer set search_path = public as $$
  select id, category, title, summary, premium from public.articles where published order by created_at
$$;
grant execute on function public.article_index() to anon, authenticated;
