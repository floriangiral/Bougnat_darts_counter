create unique index if not exists player_profiles_username_unique_idx
on public.player_profiles (lower(username));
