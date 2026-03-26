-- Bougnat Darts - preprod manual sync
-- Apply this whole script in the Supabase SQL editor for preprod.
-- It includes a compatibility patch for partially existing tables,
-- then replays the current schema and hardening in a safe order.

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

-- Compatibility patch for partially existing tables
alter table if exists public.matches
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table if exists public.player_profiles
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table if exists public.player_presence
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table if exists public.friendships
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table if exists public.lobby_invites
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table if exists public.open_lobbies
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table if exists public.player_achievements
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table if exists public.daily_challenges
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table if exists public.player_challenge_progress
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table if exists public.friend_email_invites
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table if exists public.open_lobby_participants
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table if exists public.shared_match_sessions
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

-- 20260324090000_init_matches.sql
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

-- 20260324123000_lobby_foundation.sql
create table if not exists public.player_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null default 'player',
  avatar_seed text not null default 'player',
  country_code text not null default 'FR',
  rank text not null default 'Practice Squad',
  level integer not null default 1 check (level >= 1),
  xp integer not null default 0 check (xp >= 0),
  favorite_mode text not null default 'X01' check (favorite_mode in ('X01', 'Cricket', 'Capital', 'Triathlon', 'Randomizer')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists player_profiles_username_idx on public.player_profiles (username);

alter table public.player_profiles enable row level security;

drop policy if exists "Authenticated users can read player profiles" on public.player_profiles;
create policy "Authenticated users can read player profiles"
  on public.player_profiles
  for select
  to authenticated
  using (true);

drop policy if exists "Users can insert their own player profile" on public.player_profiles;
create policy "Users can insert their own player profile"
  on public.player_profiles
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own player profile" on public.player_profiles;
create policy "Users can update their own player profile"
  on public.player_profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists set_player_profiles_updated_at on public.player_profiles;
create trigger set_player_profiles_updated_at
before update on public.player_profiles
for each row
execute function public.set_updated_at();

create or replace function public.sync_player_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.player_profiles (
    user_id,
    username,
    avatar_seed,
    country_code
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1), 'player'),
    coalesce(new.raw_user_meta_data ->> 'avatar_seed', new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1), 'player'),
    coalesce(new.raw_user_meta_data ->> 'country_code', 'FR')
  )
  on conflict (user_id) do update
  set
    username = excluded.username,
    avatar_seed = excluded.avatar_seed,
    country_code = excluded.country_code,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_player_profile_sync on auth.users;
create trigger on_auth_user_player_profile_sync
after insert or update of raw_user_meta_data, email on auth.users
for each row
execute function public.sync_player_profile_from_auth_user();

insert into public.player_profiles (user_id, username, avatar_seed, country_code)
select
  users.id,
  coalesce(users.raw_user_meta_data ->> 'username', split_part(users.email, '@', 1), 'player'),
  coalesce(users.raw_user_meta_data ->> 'avatar_seed', users.raw_user_meta_data ->> 'username', split_part(users.email, '@', 1), 'player'),
  coalesce(users.raw_user_meta_data ->> 'country_code', 'FR')
from auth.users as users
on conflict (user_id) do nothing;

create table if not exists public.player_presence (
  user_id uuid primary key references auth.users (id) on delete cascade,
  availability text not null default 'idle' check (availability in ('online', 'in_match', 'idle', 'offline')),
  activity_text text,
  current_mode text check (current_mode in ('X01', 'Cricket', 'Capital', 'Triathlon', 'Randomizer')),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.player_presence enable row level security;

drop policy if exists "Authenticated users can read player presence" on public.player_presence;
create policy "Authenticated users can read player presence"
  on public.player_presence
  for select
  to authenticated
  using (true);

drop policy if exists "Users can insert their own presence" on public.player_presence;
create policy "Users can insert their own presence"
  on public.player_presence
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own presence" on public.player_presence;
create policy "Users can update their own presence"
  on public.player_presence
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid not null references auth.users (id) on delete cascade,
  addressee_user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'blocked', 'declined')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint friendships_distinct_users check (requester_user_id <> addressee_user_id),
  constraint friendships_unique_pair unique (requester_user_id, addressee_user_id)
);

create index if not exists friendships_requester_idx on public.friendships (requester_user_id);
create index if not exists friendships_addressee_idx on public.friendships (addressee_user_id);

alter table public.friendships enable row level security;

drop policy if exists "Users can read their friendship rows" on public.friendships;
create policy "Users can read their friendship rows"
  on public.friendships
  for select
  to authenticated
  using (auth.uid() = requester_user_id or auth.uid() = addressee_user_id);

drop policy if exists "Users can create friendship requests" on public.friendships;
create policy "Users can create friendship requests"
  on public.friendships
  for insert
  to authenticated
  with check (auth.uid() = requester_user_id);

drop policy if exists "Participants can update friendship rows" on public.friendships;
create policy "Participants can update friendship rows"
  on public.friendships
  for update
  to authenticated
  using (auth.uid() = requester_user_id or auth.uid() = addressee_user_id)
  with check (auth.uid() = requester_user_id or auth.uid() = addressee_user_id);

drop trigger if exists set_friendships_updated_at on public.friendships;
create trigger set_friendships_updated_at
before update on public.friendships
for each row
execute function public.set_updated_at();

create table if not exists public.lobby_invites (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid not null references auth.users (id) on delete cascade,
  recipient_user_id uuid not null references auth.users (id) on delete cascade,
  mode text not null check (mode in ('X01', 'Cricket', 'Capital', 'Triathlon', 'Randomizer')),
  lobby_code text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint lobby_invites_distinct_users check (sender_user_id <> recipient_user_id)
);

create index if not exists lobby_invites_sender_idx on public.lobby_invites (sender_user_id, created_at desc);
create index if not exists lobby_invites_recipient_idx on public.lobby_invites (recipient_user_id, created_at desc);

alter table public.lobby_invites enable row level security;

drop policy if exists "Users can read their lobby invites" on public.lobby_invites;
create policy "Users can read their lobby invites"
  on public.lobby_invites
  for select
  to authenticated
  using (auth.uid() = sender_user_id or auth.uid() = recipient_user_id);

drop policy if exists "Users can create lobby invites" on public.lobby_invites;
create policy "Users can create lobby invites"
  on public.lobby_invites
  for insert
  to authenticated
  with check (auth.uid() = sender_user_id);

drop policy if exists "Users can update their lobby invites" on public.lobby_invites;
create policy "Users can update their lobby invites"
  on public.lobby_invites
  for update
  to authenticated
  using (auth.uid() = sender_user_id or auth.uid() = recipient_user_id)
  with check (auth.uid() = sender_user_id or auth.uid() = recipient_user_id);

drop trigger if exists set_lobby_invites_updated_at on public.lobby_invites;
create trigger set_lobby_invites_updated_at
before update on public.lobby_invites
for each row
execute function public.set_updated_at();

create table if not exists public.open_lobbies (
  id uuid primary key default gen_random_uuid(),
  host_user_id uuid not null references auth.users (id) on delete cascade,
  mode text not null check (mode in ('X01', 'Cricket', 'Capital', 'Triathlon', 'Randomizer')),
  title text not null default 'Open Match',
  stakes text,
  current_players integer not null default 1 check (current_players >= 1),
  max_players integer not null default 2 check (max_players >= 1),
  lobby_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
  status text not null default 'open' check (status in ('open', 'locked', 'in_progress', 'closed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists open_lobbies_status_created_idx on public.open_lobbies (status, created_at desc);

alter table public.open_lobbies enable row level security;

drop policy if exists "Authenticated users can read open lobbies" on public.open_lobbies;
create policy "Authenticated users can read open lobbies"
  on public.open_lobbies
  for select
  to authenticated
  using (true);

drop policy if exists "Users can create their own open lobbies" on public.open_lobbies;
create policy "Users can create their own open lobbies"
  on public.open_lobbies
  for insert
  to authenticated
  with check (auth.uid() = host_user_id);

drop policy if exists "Hosts can update their open lobbies" on public.open_lobbies;
create policy "Hosts can update their open lobbies"
  on public.open_lobbies
  for update
  to authenticated
  using (auth.uid() = host_user_id)
  with check (auth.uid() = host_user_id);

drop policy if exists "Hosts can delete their open lobbies" on public.open_lobbies;
create policy "Hosts can delete their open lobbies"
  on public.open_lobbies
  for delete
  to authenticated
  using (auth.uid() = host_user_id);

drop trigger if exists set_open_lobbies_updated_at on public.open_lobbies;
create trigger set_open_lobbies_updated_at
before update on public.open_lobbies
for each row
execute function public.set_updated_at();

create table if not exists public.player_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  achievement_key text not null,
  title text not null,
  description text not null,
  progress integer not null default 0 check (progress >= 0),
  max_progress integer not null default 1 check (max_progress >= 1),
  unlocked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint player_achievements_unique_key unique (user_id, achievement_key)
);

create index if not exists player_achievements_user_idx on public.player_achievements (user_id, updated_at desc);

alter table public.player_achievements enable row level security;

drop policy if exists "Users can read their achievements" on public.player_achievements;
create policy "Users can read their achievements"
  on public.player_achievements
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their achievements" on public.player_achievements;
create policy "Users can insert their achievements"
  on public.player_achievements
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their achievements" on public.player_achievements;
create policy "Users can update their achievements"
  on public.player_achievements
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists set_player_achievements_updated_at on public.player_achievements;
create trigger set_player_achievements_updated_at
before update on public.player_achievements
for each row
execute function public.set_updated_at();

create table if not exists public.daily_challenges (
  id uuid primary key default gen_random_uuid(),
  challenge_key text not null unique,
  title text not null,
  description text not null,
  target integer not null check (target >= 1),
  reward text not null,
  mode text check (mode in ('X01', 'Cricket', 'Capital', 'Triathlon', 'Randomizer')),
  active_from date not null,
  active_to date not null,
  sort_order integer not null default 100,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.daily_challenges enable row level security;

drop policy if exists "Authenticated users can read daily challenges" on public.daily_challenges;
create policy "Authenticated users can read daily challenges"
  on public.daily_challenges
  for select
  to authenticated
  using (true);

drop trigger if exists set_daily_challenges_updated_at on public.daily_challenges;
create trigger set_daily_challenges_updated_at
before update on public.daily_challenges
for each row
execute function public.set_updated_at();

create table if not exists public.player_challenge_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  challenge_id uuid not null references public.daily_challenges (id) on delete cascade,
  progress integer not null default 0 check (progress >= 0),
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint player_challenge_progress_unique unique (user_id, challenge_id)
);

create index if not exists player_challenge_progress_user_idx on public.player_challenge_progress (user_id, updated_at desc);

alter table public.player_challenge_progress enable row level security;

drop policy if exists "Users can read their challenge progress" on public.player_challenge_progress;
create policy "Users can read their challenge progress"
  on public.player_challenge_progress
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their challenge progress" on public.player_challenge_progress;
create policy "Users can insert their challenge progress"
  on public.player_challenge_progress
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their challenge progress" on public.player_challenge_progress;
create policy "Users can update their challenge progress"
  on public.player_challenge_progress
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists set_player_challenge_progress_updated_at on public.player_challenge_progress;
create trigger set_player_challenge_progress_updated_at
before update on public.player_challenge_progress
for each row
execute function public.set_updated_at();

insert into public.daily_challenges (challenge_key, title, description, target, reward, mode, active_from, active_to, sort_order)
values
  ('play_three_matches', 'Three Match Warmup', 'Play 3 registered matches today.', 3, '+120 XP', null, current_date, current_date + 30, 10),
  ('big_finish', 'Big Finish', 'Land a checkout above 80 in your tracked matches.', 1, 'Finisher badge', 'X01', current_date, current_date + 30, 20),
  ('cricket_hunter', 'Cricket Hunter', 'Win one Cricket match.', 1, '+1 streak', 'Cricket', current_date, current_date + 30, 30)
on conflict (challenge_key) do update
set
  title = excluded.title,
  description = excluded.description,
  target = excluded.target,
  reward = excluded.reward,
  mode = excluded.mode,
  active_from = excluded.active_from,
  active_to = excluded.active_to,
  sort_order = excluded.sort_order,
  updated_at = timezone('utc', now());

-- 20260324142000_friend_email_invites.sql
create table if not exists public.friend_email_invites (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid not null references auth.users (id) on delete cascade,
  recipient_email text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'accepted', 'expired', 'cancelled')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists friend_email_invites_sender_idx
  on public.friend_email_invites (sender_user_id, created_at desc);

create index if not exists friend_email_invites_recipient_email_idx
  on public.friend_email_invites (recipient_email);

alter table public.friend_email_invites enable row level security;

drop policy if exists "Users can read their email invites" on public.friend_email_invites;
create policy "Users can read their email invites"
  on public.friend_email_invites
  for select
  to authenticated
  using (auth.uid() = sender_user_id);

drop policy if exists "Users can create their email invites" on public.friend_email_invites;
create policy "Users can create their email invites"
  on public.friend_email_invites
  for insert
  to authenticated
  with check (auth.uid() = sender_user_id);

drop policy if exists "Users can update their email invites" on public.friend_email_invites;
create policy "Users can update their email invites"
  on public.friend_email_invites
  for update
  to authenticated
  using (auth.uid() = sender_user_id)
  with check (auth.uid() = sender_user_id);

drop trigger if exists set_friend_email_invites_updated_at on public.friend_email_invites;
create trigger set_friend_email_invites_updated_at
before update on public.friend_email_invites
for each row
execute function public.set_updated_at();

-- 20260324150000_open_lobby_participants.sql
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

-- 20260324162000_open_lobbies_game_config.sql
alter table public.open_lobbies
add column if not exists game_config jsonb not null default '{}'::jsonb;

update public.open_lobbies
set game_config = case
  when mode = 'X01' then jsonb_strip_nulls(
    jsonb_build_object(
      'startingScore',
      case
        when lower(coalesce(title, '') || ' ' || coalesce(stakes, '')) like '%170%' then 170
        when lower(coalesce(title, '') || ' ' || coalesce(stakes, '')) like '%701%' then 701
        when lower(coalesce(title, '') || ' ' || coalesce(stakes, '')) like '%301%' then 301
        when lower(coalesce(title, '') || ' ' || coalesce(stakes, '')) like '%1001%' then 1001
        else 501
      end,
      'matchMode',
      'LEGS',
      'legsToWin',
      case
        when lower(coalesce(title, '') || ' ' || coalesce(stakes, '')) like '%best of 5%'
          or lower(coalesce(title, '') || ' ' || coalesce(stakes, '')) like '%bo5%'
          or lower(coalesce(title, '') || ' ' || coalesce(stakes, '')) like '%premier a 3%'
        then 3
        else null
      end,
      'setsToWin',
      case
        when lower(coalesce(title, '') || ' ' || coalesce(stakes, '')) like '%best of 5%'
          or lower(coalesce(title, '') || ' ' || coalesce(stakes, '')) like '%bo5%'
          or lower(coalesce(title, '') || ' ' || coalesce(stakes, '')) like '%premier a 3%'
        then 1
        else null
      end,
      'checkIn',
      case
        when lower(coalesce(title, '') || ' ' || coalesce(stakes, '')) like '%double in%' then 'Double'
        else 'Open'
      end,
      'checkOut',
      case
        when lower(coalesce(title, '') || ' ' || coalesce(stakes, '')) like '%master out%' then 'Master'
        when lower(coalesce(title, '') || ' ' || coalesce(stakes, '')) like '%double out%' then 'Double'
        else 'Open'
      end
    )
  )
  else '{}'::jsonb
end
where game_config = '{}'::jsonb;

-- 20260324173000_shared_match_sessions.sql
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

-- 20260324190000_matches_analytics_columns.sql
alter table public.matches
  add column if not exists game_name text,
  add column if not exists mode_variant text,
  add column if not exists status text not null default 'finished',
  add column if not exists finished_at timestamptz,
  add column if not exists players_count integer,
  add column if not exists player_names text[] not null default '{}',
  add column if not exists opponent_label text,
  add column if not exists is_win boolean,
  add column if not exists starting_score integer,
  add column if not exists check_in text,
  add column if not exists check_out text,
  add column if not exists match_mode text,
  add column if not exists legs_to_win integer,
  add column if not exists sets_to_win integer,
  add column if not exists duration_seconds integer,
  add column if not exists score_for numeric,
  add column if not exists score_against numeric,
  add column if not exists total_darts integer,
  add column if not exists total_points integer,
  add column if not exists average numeric,
  add column if not exists first9_average numeric,
  add column if not exists checkout_rate numeric,
  add column if not exists highest_checkout integer,
  add column if not exists highest_score integer,
  add column if not exists count_180 integer not null default 0,
  add column if not exists count_140_plus integer not null default 0,
  add column if not exists count_100_plus integer not null default 0,
  add column if not exists best_leg_darts integer,
  add column if not exists summary jsonb not null default '{}'::jsonb;

update public.matches
set
  game_name = coalesce(game_name, game_data->>'gameName', game_type),
  finished_at = coalesce(finished_at, created_at),
  players_count = coalesce(players_count, jsonb_array_length(coalesce(game_data->'players', '[]'::jsonb))),
  player_names = case
    when coalesce(array_length(player_names, 1), 0) > 0 then player_names
    else coalesce(
      (
        select array_agg(player_name)
        from (
          select jsonb_array_elements(coalesce(game_data->'players', '[]'::jsonb))->>'name' as player_name
        ) players
        where player_name is not null and player_name <> ''
      ),
      '{}'::text[]
    )
  end,
  starting_score = coalesce(starting_score, nullif(game_data #>> '{config,startingScore}', '')::integer),
  check_in = coalesce(check_in, game_data #>> '{config,checkIn}'),
  check_out = coalesce(check_out, game_data #>> '{config,checkOut}'),
  match_mode = coalesce(match_mode, game_data #>> '{config,matchMode}'),
  legs_to_win = coalesce(legs_to_win, nullif(game_data #>> '{config,legsToWin}', '')::integer),
  sets_to_win = coalesce(sets_to_win, nullif(game_data #>> '{config,setsToWin}', '')::integer),
  duration_seconds = coalesce(duration_seconds, nullif(game_data->>'duration', '')::integer),
  status = coalesce(status, game_data->>'status', 'finished');

create index if not exists matches_user_game_name_created_at_idx
  on public.matches (user_id, game_name, created_at desc);

create index if not exists matches_user_is_win_created_at_idx
  on public.matches (user_id, is_win, created_at desc);

create index if not exists matches_user_finished_at_idx
  on public.matches (user_id, finished_at desc);

-- 20260326100813_profile_identity_fields.sql
alter table public.player_profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists birth_date date,
  add column if not exists club_name text,
  add column if not exists committee_name text,
  add column if not exists league_name text;

create or replace function public.sync_player_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.player_profiles (
    user_id,
    username,
    avatar_seed,
    country_code,
    first_name,
    last_name,
    birth_date,
    club_name,
    committee_name,
    league_name
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1), 'player'),
    coalesce(new.raw_user_meta_data ->> 'avatar_seed', new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1), 'player'),
    coalesce(new.raw_user_meta_data ->> 'country_code', 'FR'),
    nullif(new.raw_user_meta_data ->> 'first_name', ''),
    nullif(new.raw_user_meta_data ->> 'last_name', ''),
    nullif(new.raw_user_meta_data ->> 'birth_date', '')::date,
    nullif(new.raw_user_meta_data ->> 'club_name', ''),
    nullif(new.raw_user_meta_data ->> 'committee_name', ''),
    nullif(new.raw_user_meta_data ->> 'league_name', '')
  )
  on conflict (user_id) do update
  set
    username = excluded.username,
    avatar_seed = excluded.avatar_seed,
    country_code = excluded.country_code,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    birth_date = excluded.birth_date,
    club_name = excluded.club_name,
    committee_name = excluded.committee_name,
    league_name = excluded.league_name,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

update public.player_profiles as profiles
set
  first_name = nullif(users.raw_user_meta_data ->> 'first_name', ''),
  last_name = nullif(users.raw_user_meta_data ->> 'last_name', ''),
  birth_date = nullif(users.raw_user_meta_data ->> 'birth_date', '')::date,
  club_name = nullif(users.raw_user_meta_data ->> 'club_name', ''),
  committee_name = nullif(users.raw_user_meta_data ->> 'committee_name', ''),
  league_name = nullif(users.raw_user_meta_data ->> 'league_name', ''),
  updated_at = timezone('utc', now())
from auth.users as users
where profiles.user_id = users.id;

-- 20260326103608_delete_my_account.sql
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Utilisateur non authentifie.';
  end if;

  delete from auth.users
  where id = current_user_id;
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

-- 20260326112200_unique_player_profile_username.sql
create unique index if not exists player_profiles_username_unique_idx
on public.player_profiles (lower(username));

-- 20260326155502_security_hardening.sql
create or replace function public.prevent_friendships_identity_change()
returns trigger
language plpgsql
as $$
begin
  if new.requester_user_id <> old.requester_user_id
    or new.addressee_user_id <> old.addressee_user_id
    or new.created_at <> old.created_at then
    raise exception 'Les identifiants d une relation d amitie sont immuables.';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_friendships_identity on public.friendships;
create trigger protect_friendships_identity
before update on public.friendships
for each row
execute function public.prevent_friendships_identity_change();

create or replace function public.prevent_lobby_invites_identity_change()
returns trigger
language plpgsql
as $$
begin
  if new.sender_user_id <> old.sender_user_id
    or new.recipient_user_id <> old.recipient_user_id
    or new.mode <> old.mode
    or coalesce(new.lobby_code, '') <> coalesce(old.lobby_code, '')
    or new.created_at <> old.created_at then
    raise exception 'Les identifiants d une invitation lobby sont immuables.';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_lobby_invites_identity on public.lobby_invites;
create trigger protect_lobby_invites_identity
before update on public.lobby_invites
for each row
execute function public.prevent_lobby_invites_identity_change();

create or replace function public.prevent_friend_email_invites_identity_change()
returns trigger
language plpgsql
as $$
begin
  if new.sender_user_id <> old.sender_user_id
    or lower(new.recipient_email) <> lower(old.recipient_email)
    or new.created_at <> old.created_at then
    raise exception 'Les identifiants d une invitation email sont immuables.';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_friend_email_invites_identity on public.friend_email_invites;
create trigger protect_friend_email_invites_identity
before update on public.friend_email_invites
for each row
execute function public.prevent_friend_email_invites_identity_change();

create or replace function public.prevent_open_lobbies_identity_change()
returns trigger
language plpgsql
as $$
begin
  if new.host_user_id <> old.host_user_id
    or new.lobby_code <> old.lobby_code
    or new.created_at <> old.created_at then
    raise exception 'Les identifiants d un lobby sont immuables.';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_open_lobbies_identity on public.open_lobbies;
create trigger protect_open_lobbies_identity
before update on public.open_lobbies
for each row
execute function public.prevent_open_lobbies_identity_change();

create or replace function public.prevent_shared_match_session_identity_change()
returns trigger
language plpgsql
as $$
begin
  if coalesce(new.lobby_id, '00000000-0000-0000-0000-000000000000'::uuid) <> coalesce(old.lobby_id, '00000000-0000-0000-0000-000000000000'::uuid)
    or new.lobby_code <> old.lobby_code
    or new.host_user_id <> old.host_user_id
    or new.game_type <> old.game_type
    or new.participant_user_ids <> old.participant_user_ids
    or new.created_at <> old.created_at then
    raise exception 'Les identifiants d une session partagee sont immuables.';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_shared_match_sessions_identity on public.shared_match_sessions;
create trigger protect_shared_match_sessions_identity
before update on public.shared_match_sessions
for each row
execute function public.prevent_shared_match_session_identity_change();

drop policy if exists "Authenticated users can read player profiles" on public.player_profiles;
drop policy if exists "Users can read their own player profile" on public.player_profiles;
create policy "Users can read their own player profile"
  on public.player_profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

create or replace view public.public_player_profiles as
select
  user_id,
  username,
  avatar_seed,
  country_code,
  rank,
  level,
  xp,
  favorite_mode,
  created_at,
  updated_at
from public.player_profiles;

grant select on public.public_player_profiles to anon;
grant select on public.public_player_profiles to authenticated;
