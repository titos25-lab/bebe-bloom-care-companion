-- BabyCare: group community discussions by approximate baby age.
-- This deliberately stores only the age in months, never the baby's name or birth date.
alter table public.community_posts
  add column if not exists baby_age_months integer
  check (baby_age_months is null or baby_age_months between 0 and 60);

create index if not exists community_posts_baby_age_created_idx
  on public.community_posts (baby_age_months, created_at desc)
  where hidden = false;
