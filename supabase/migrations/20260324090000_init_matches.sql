create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.matches (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  game_type text not null,
  winner_id text,
  game_data jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists matches_user_id_created_at_idx
  on public.matches (user_id, created_at desc);

alter table public.matches enable row level security;

drop policy if exists "Users can read their own matches" on public.matches;
create policy "Users can read their own matches"
  on public.matches
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own matches" on public.matches;
create policy "Users can insert their own matches"
  on public.matches
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own matches" on public.matches;
create policy "Users can update their own matches"
  on public.matches
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own matches" on public.matches;
create policy "Users can delete their own matches"
  on public.matches
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop trigger if exists set_matches_updated_at on public.matches;
create trigger set_matches_updated_at
before update on public.matches
for each row
execute function public.set_updated_at();

