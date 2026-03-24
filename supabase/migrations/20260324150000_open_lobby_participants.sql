create table if not exists public.open_lobby_participants (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid not null references public.open_lobbies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'joined' check (status in ('joined', 'left')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint open_lobby_participants_unique unique (lobby_id, user_id)
);

create index if not exists open_lobby_participants_lobby_idx
  on public.open_lobby_participants (lobby_id, status, created_at desc);

create index if not exists open_lobby_participants_user_idx
  on public.open_lobby_participants (user_id, status, created_at desc);

alter table public.open_lobby_participants enable row level security;

drop policy if exists "Participants can read their lobby slots" on public.open_lobby_participants;
create policy "Participants can read their lobby slots"
  on public.open_lobby_participants
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.open_lobbies
      where open_lobbies.id = open_lobby_participants.lobby_id
        and open_lobbies.host_user_id = auth.uid()
    )
  );

drop policy if exists "Users can create their lobby slots" on public.open_lobby_participants;
create policy "Users can create their lobby slots"
  on public.open_lobby_participants
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their lobby slots" on public.open_lobby_participants;
create policy "Users can update their lobby slots"
  on public.open_lobby_participants
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists set_open_lobby_participants_updated_at on public.open_lobby_participants;
create trigger set_open_lobby_participants_updated_at
before update on public.open_lobby_participants
for each row
execute function public.set_updated_at();

create or replace function public.join_open_lobby_by_code(p_lobby_code text)
returns public.open_lobbies
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lobby public.open_lobbies;
  v_existing public.open_lobby_participants;
begin
  select *
  into v_lobby
  from public.open_lobbies
  where upper(lobby_code) = upper(trim(p_lobby_code))
    and status = 'open'
  for update;

  if not found then
    raise exception 'No open lobby found for this code.';
  end if;

  if v_lobby.host_user_id = auth.uid() then
    return v_lobby;
  end if;

  select *
  into v_existing
  from public.open_lobby_participants
  where lobby_id = v_lobby.id
    and user_id = auth.uid()
    and status = 'joined';

  if found then
    return v_lobby;
  end if;

  if v_lobby.current_players >= v_lobby.max_players then
    raise exception 'Lobby is full.';
  end if;

  insert into public.open_lobby_participants (lobby_id, user_id, status)
  values (v_lobby.id, auth.uid(), 'joined')
  on conflict (lobby_id, user_id) do update
  set
    status = 'joined',
    updated_at = timezone('utc', now());

  update public.open_lobbies
  set
    current_players = least(max_players, current_players + 1),
    updated_at = timezone('utc', now())
  where id = v_lobby.id
  returning *
  into v_lobby;

  return v_lobby;
end;
$$;

grant execute on function public.join_open_lobby_by_code(text) to authenticated;
