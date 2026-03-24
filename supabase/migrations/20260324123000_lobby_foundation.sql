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
  (
    'play_three_matches',
    'Three Match Warmup',
    'Play 3 registered matches today.',
    3,
    '+120 XP',
    null,
    current_date,
    current_date + 30,
    10
  ),
  (
    'big_finish',
    'Big Finish',
    'Land a checkout above 80 in your tracked matches.',
    1,
    'Finisher badge',
    'X01',
    current_date,
    current_date + 30,
    20
  ),
  (
    'cricket_hunter',
    'Cricket Hunter',
    'Win one Cricket match.',
    1,
    '+1 streak',
    'Cricket',
    current_date,
    current_date + 30,
    30
  )
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
