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
