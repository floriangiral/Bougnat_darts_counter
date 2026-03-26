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
