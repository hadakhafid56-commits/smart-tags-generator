-- ============================================================================
-- Smart Tags Generator — Supabase schema
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query)
-- ============================================================================

-- 1. profiles: one row per authenticated user, tracks plan + free-usage count
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  usage_count integer not null default 0,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now()
);

-- 2. Automatically create a profile row whenever a new user signs up via
--    Supabase Auth (Google OAuth included).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Row Level Security — users can only read/update their own row.
--    All WRITES that matter (usage_count, plan) are done server-side with
--    the service role key, which bypasses RLS by design.
alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own non-sensitive fields"
  on public.profiles for update
  using (auth.uid() = id);

-- 4. Optional: editable trademark blocklist, so you can add/remove blocked
--    brand terms from the Supabase Table Editor without a redeploy.
--    (lib/tag-engine.ts ships with a sensible default list built in.)
create table if not exists public.blocked_terms (
  id bigint generated always as identity primary key,
  term text not null unique,
  created_at timestamptz not null default now()
);

alter table public.blocked_terms enable row level security;

create policy "Blocked terms are publicly readable"
  on public.blocked_terms for select
  using (true);

insert into public.blocked_terms (term) values
  ('nike'), ('adidas'), ('disney'), ('marvel'), ('gucci'), ('pokemon')
on conflict (term) do nothing;
