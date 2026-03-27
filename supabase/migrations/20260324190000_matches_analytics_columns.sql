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
