create table if not exists public.shared_match_sessions (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid references public.open_lobbies (id) on delete cascade,
  lobby_code text not null,
  host_user_id uuid not null references auth.users (id) on delete cascade,
  game_type text not null,
  participant_user_ids uuid[] not null default '{}'::uuid[],
  match_state jsonb not null,
  status text not null default 'active' check (status in ('active', 'finished', 'abandoned')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists shared_match_sessions_lobby_code_idx
  on public.shared_match_sessions (lobby_code, status, created_at desc);

create unique index if not exists shared_match_sessions_active_lobby_idx
  on public.shared_match_sessions (lobby_id)
  where status = 'active';

alter table public.shared_match_sessions enable row level security;

drop policy if exists "Participants can read shared match sessions" on public.shared_match_sessions;
create policy "Participants can read shared match sessions"
  on public.shared_match_sessions
  for select
  to authenticated
  using (auth.uid() = host_user_id or auth.uid() = any(participant_user_ids));

drop policy if exists "Hosts can create shared match sessions" on public.shared_match_sessions;
create policy "Hosts can create shared match sessions"
  on public.shared_match_sessions
  for insert
  to authenticated
  with check (auth.uid() = host_user_id);

drop policy if exists "Participants can update shared match sessions" on public.shared_match_sessions;
create policy "Participants can update shared match sessions"
  on public.shared_match_sessions
  for update
  to authenticated
  using (auth.uid() = host_user_id or auth.uid() = any(participant_user_ids))
  with check (auth.uid() = host_user_id or auth.uid() = any(participant_user_ids));

drop trigger if exists set_shared_match_sessions_updated_at on public.shared_match_sessions;
create trigger set_shared_match_sessions_updated_at
before update on public.shared_match_sessions
for each row
execute function public.set_updated_at();

do $$
begin
  alter publication supabase_realtime add table public.shared_match_sessions;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
