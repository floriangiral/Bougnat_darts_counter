export type PlayerAccount = {
  id?: string;
  email?: string;
  name?: string;
  display_name?: string;
  displayName?: string;
  nickname?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  club_name?: string;
  darts_category?: PlayerProfileDartsCategory;
  dominant_hand?: PlayerProfileDominantHand;
  is_public?: boolean;
};

export type PlayerAccountAuthMe = {
  id?: string;
  email?: string;
  name?: string;
  provider?: string;
};

export type PlayerAccountStatsSummary = {
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  average: number;
  bestAverage: number;
  score180: number;
  score140Plus: number;
  score100Plus: number;
  bestCheckout: number;
  checkoutRate: number;
  hasActivity: boolean;
};

export type PlayerScoringProfile = Record<string, unknown> | null;

export type PlayerAccountSearchResult = {
  player_id: string;
  display_name: string;
  nickname?: string;
  public_slug?: string;
  club_name?: string;
  avatar_url?: string;
};

export type PlayerRecentMatch = {
  id?: string;
  label: string;
  date?: string;
  result?: string;
  score?: string;
};

export type PlayerRecentTournament = {
  id?: string;
  name: string;
  date?: string;
  status?: string;
  rank?: string;
};

export type PlayerAccountBootstrap = {
  player?: PlayerAccount | null;
  stats?: PlayerAccountStatsSummary | null;
  raw_stats?: unknown;
  scoring_profile?: PlayerScoringProfile;
  scoring_settings?: PlayerScoringProfile;
  recent_matches?: PlayerRecentMatch[];
  raw_recent_matches?: unknown[];
  tournaments?: PlayerRecentTournament[];
  raw_tournaments?: unknown[];
  capabilities?: unknown;
  endpoints?: Record<string, string>;
};

export type PlayerAccountAuthMode = 'login' | 'register';

export type PlayerAccountProfileStatus = 'ready' | 'incomplete';

export type PlayerAccountSession = {
  auth: PlayerAccountAuthMe;
  bootstrap: PlayerAccountBootstrap;
  profileStatus: PlayerAccountProfileStatus;
};

export type PlayerProfileGender = 'male' | 'female' | 'other' | 'undisclosed' | '';
export type PlayerProfileDominantHand = 'right' | 'left' | '';
export type PlayerProfileDartsCategory =
  | 'debutant'
  | 'reserve'
  | 'promotion'
  | 'honneur'
  | 'excellence'
  | 'national'
  | 'elite';
export type PlayerProfileEditableDartsCategory = PlayerProfileDartsCategory | '';

export type PlayerProfile = {
  id: string;
  public_slug: string;
  first_name: string;
  last_name: string;
  display_name: string;
  nickname?: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  gender: PlayerProfileGender;
  country?: string;
  city?: string;
  address?: string;
  postal_code?: string;
  nationality?: string;
  photo_url?: string;
  dominant_hand: PlayerProfileDominantHand;
  darts_category?: PlayerProfileDartsCategory;
  federation?: string;
  license_number?: string;
  club_name?: string;
  season_label?: string;
  is_active: boolean;
  is_public: boolean;
  created_at: string;
};

export type UpdatePlayerProfilePayload = {
  first_name: string;
  last_name: string;
  display_name: string;
  nickname: string;
  phone: string;
  birth_date: string;
  gender: PlayerProfileGender;
  country: string;
  city: string;
  address: string;
  postal_code: string;
  nationality: string;
  dominant_hand: PlayerProfileDominantHand;
  darts_category: PlayerProfileEditableDartsCategory;
  federation: string;
  license_number: string;
  is_public: boolean;
};

export type UpdatePlayerProfilePhotoPayload = {
  photo_url: string;
};

export type PlayerStats = {
  matches_played: number;
  wins: number;
  losses: number;
  win_rate: number;
  general_average: number;
  best_average: number;
  recent_average: number;
  count_180: number;
  count_140_plus: number;
  count_100_plus: number;
  best_checkout: number;
  checkout_rate: number;
  recent_form_rate: number;
  last_calculated_at: string;
};

export type X01Stats = PlayerStats;

export type CricketStatsDetail = {
  mpr: number;
  best_mpr: number;
  recent_mpr: number;
  total_marks: number;
  darts_thrown: number;
  visits_count: number;
  count_9_marks: number;
  count_8_marks: number;
  count_7_marks: number;
  count_6_plus_marks: number;
  points_scored: number;
  points_allowed: number;
  point_differential: number;
  bull_marks: number;
  marks_20: number;
  marks_19: number;
  marks_18: number;
  marks_17: number;
  marks_16: number;
  marks_15: number;
  close_rate: number;
};

export type CricketStats = {
  game_mode?: 'cricket' | string;
  matches_played: number;
  wins: number;
  losses: number;
  draws: number;
  win_rate: number;
  recent_form_rate: number;
  last_calculated_at: string;
  cricket: CricketStatsDetail;
};

export type MatchHistory = {
  id: string;
  source?: 'tournament' | 'personal' | string;
  client_match_id?: string;
  game_mode?: 'x01' | string;
  opponent_id?: string | null;
  tournament_name: string;
  stage_name: string;
  round: string;
  opponent_name: string;
  player_score: number;
  opponent_score: number;
  result: 'win' | 'loss' | 'draw' | string;
  target: number;
  board_label?: string;
  started_at?: string;
  completed_at?: string;
  duration_sec?: number;
  match_average: number;
  count_180: number;
  count_140_plus: number;
  count_100_plus: number;
  best_checkout: number;
  checkout_rate: number;
  variant?: string;
  cricket?: {
    match_mpr?: number;
    total_marks?: number;
    count_9_marks?: number;
    count_8_marks?: number;
    count_7_marks?: number;
    count_6_plus_marks?: number;
    points_scored?: number;
    points_allowed?: number;
    bull_marks?: number;
  };
};

export type X01Match = MatchHistory & {
  game_mode?: 'x01' | string;
};

export type CricketMatch = MatchHistory & {
  game_mode?: 'cricket' | string;
  variant?: string;
  cricket: NonNullable<MatchHistory['cricket']>;
};

export type MatchHistoryPage = {
  items: MatchHistory[];
  total: number;
  limit: number;
  offset: number;
};

export type MatchDetail = {
  summary: MatchHistory;
  turns: Array<{
    id?: string;
    participant_name: string;
    is_player: boolean;
    set_number: number;
    leg_number: number;
    visit_number: number;
    points_scored: number;
    remaining_points?: number;
    checkout_attempt: boolean;
    dart_count: number;
    dart_summary: string;
    cricket?: {
      marks_scored?: number;
      points_scored?: number;
      segment_hits?: Record<string, number>;
      closed_segments_after?: string[];
    };
    scored_at: string;
  }>;
};

export type PersonalX01MatchPayload = {
  client_match_id: string;
  participant_key?: string;
  target_player_id?: string;
  confirmation_policy?: 'player_confirmation_required';
  game_mode: 'x01';
  target: number;
  started_at: string;
  completed_at: string;
  duration_sec: number;
  opponent: {
    type: 'local';
    name: string;
  };
  result: 'win' | 'loss' | 'draw';
  player_score: number;
  opponent_score: number;
  stats: {
    match_average: number;
    count_180: number;
    count_140_plus: number;
    count_100_plus: number;
    best_checkout: number;
    checkout_rate: number;
  };
  turns: Array<{
    visit_index: number;
    participant: 'player' | 'opponent';
    set_number: number;
    leg_number: number;
    points_scored: number;
    remaining_points: number;
    checkout_attempt: boolean;
    dart_count: number;
    dart_summary: string;
    scored_at: string;
  }>;
};

export type CricketTurnPayload = {
  visit_index: number;
  participant: 'player' | 'opponent';
  dart_count: number;
  points_scored: number;
  dart_summary: string;
  cricket: {
    marks_scored: number;
    points_scored: number;
    segment_hits: {
      '20': number;
      '19': number;
      '18': number;
      '17': number;
      '16': number;
      '15': number;
      bull: number;
    };
    closed_segments_after: string[];
  };
  scored_at: string;
};

export type PersonalCricketMatchPayload = {
  client_match_id: string;
  participant_key?: string;
  target_player_id?: string;
  confirmation_policy?: 'player_confirmation_required';
  game_mode: 'cricket';
  variant: 'standard' | string;
  started_at: string;
  completed_at: string;
  duration_sec: number;
  opponent: {
    type: 'local';
    name: string;
  };
  result: 'win' | 'loss' | 'draw';
  player_score: number;
  opponent_score: number;
  stats: {
    cricket: {
      match_mpr: number;
      total_marks: number;
      count_9_marks: number;
      count_8_marks: number;
      count_7_marks: number;
      count_6_plus_marks: number;
      points_scored: number;
      points_allowed: number;
      bull_marks: number;
      marks_20: number;
      marks_19: number;
      marks_18: number;
      marks_17: number;
      marks_16: number;
      marks_15: number;
      close_rate: number;
      darts_thrown: number;
      visits_count: number;
    };
  };
  turns: CricketTurnPayload[];
};

export type PersonalScoringMatchPayload = PersonalX01MatchPayload | PersonalCricketMatchPayload;

export type PersonalX01MatchResponse = {
  match?: MatchHistory;
  stats?: PlayerStats | CricketStats;
  item?: MatchHistory;
  summary?: MatchHistory;
  data?: unknown;
};

export type PersonalScoringMatchResponse = PersonalX01MatchResponse;

export type TournamentHistory = {
  id: string;
  tournament_name: string;
  tournament_slug: string;
  tournament_date?: string;
  category_name?: string;
  final_ranking?: number;
  total_matches: number;
  wins: number;
  losses: number;
  structure_name?: string;
  ranking_points?: number;
};

export type ScoringProfile = {
  player_id: string;
  external_player_id?: string;
  provider_source: string;
  sync_state: 'none' | 'pending' | 'synced' | 'failed' | string;
  last_sync_at?: string;
  sync_error?: string;
  default_target: number;
  preferred_format: 'x01' | 'cricket' | 'around_the_clock';
  sound_enabled: boolean;
  voice_enabled: boolean;
  theme_preference: 'system' | 'light' | 'dark';
};

export type UpdateScoringProfilePayload = {
  default_target: number;
  preferred_format: ScoringProfile['preferred_format'];
  sound_enabled: boolean;
  voice_enabled: boolean;
  theme_preference: ScoringProfile['theme_preference'];
};
