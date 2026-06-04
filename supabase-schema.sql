-- New Vision Community Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run

-- ── PROFILES ────────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid references auth.users on delete cascade primary key,
  display_name text,
  country    text,
  whatsapp   text,
  bio        text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Profiles viewable by all"   on public.profiles for select using (true);
create policy "Users update own profile"   on public.profiles for update using (auth.uid() = id);
create policy "Users insert own profile"   on public.profiles for insert with check (auth.uid() = id);

-- ── FOLLOWS ─────────────────────────────────────────────────
create table if not exists public.follows (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id)
);
alter table public.follows enable row level security;
create policy "Follows viewable by all"    on public.follows for select using (true);
create policy "Users can follow"           on public.follows for insert with check (auth.uid() = user_id);
create policy "Users can unfollow"         on public.follows for delete using (auth.uid() = user_id);

-- ── POSTS ───────────────────────────────────────────────────
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  content     text not null,
  category    text default 'news',
  author_name text default 'New Vision Team',
  cover_url   text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table public.posts enable row level security;
create policy "Posts viewable by all"      on public.posts for select using (true);
drop policy if exists "Service can insert posts" on public.posts;
drop policy if exists "Service can update posts" on public.posts;
create policy "Authenticated admins can insert posts" on public.posts
  for insert
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "Authenticated admins can update posts" on public.posts
  for update
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ── COMMENTS ────────────────────────────────────────────────
create table if not exists public.comments (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid references public.posts on delete cascade not null,
  user_id      uuid references auth.users on delete cascade not null,
  display_name text not null,
  content      text not null,
  created_at   timestamptz default now()
);
alter table public.comments enable row level security;
create policy "Comments viewable by all"       on public.comments for select using (true);
create policy "Auth users can comment"         on public.comments for insert with check (auth.uid() = user_id);
create policy "Users delete own comments"      on public.comments for delete using (auth.uid() = user_id);

-- ── AUTO-CREATE PROFILE ON SIGNUP ───────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name, country)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'country', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── SEED: WELCOME POST ──────────────────────────────────────
insert into public.posts (title, content, category, author_name)
values (
  'Welcome to New Vision Community',
  'Welcome to the New Vision buyer community. Here you can follow us for updates, ask questions, read market news, and connect with other importers across Africa, the Middle East, and beyond. We export 3,200+ vehicles from China to 50+ countries — ask us anything about EVs, SUVs, pricing, or shipping.',
  'news',
  'New Vision Team'
) on conflict do nothing;
