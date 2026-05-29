// Specs: spec:counter/release-v1.1-stabilization, spec:counter/hub-auth-tournament-scoring
import { useAuth, useSignIn, useSignUp, useUser } from '@clerk/clerk-react';
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Apple, BarChart3, CalendarDays, ChevronRight, ExternalLink, Globe2, Home, IdCard, Loader2, LogIn, Mail, Mic, QrCode, RefreshCcw, Settings, Target, Trophy, User, UserPlus, Volume2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ChangelogModal } from '../components/ui/ChangelogModal';
import { InstallAppButton } from '../components/ui/InstallAppButton';
import {
  fetchPlayerMatchDetail,
  fetchPlayerMatches,
  fetchPlayerProfile,
  fetchPlayerScoringProfile,
  fetchPlayerStats,
  fetchPlayerTournaments,
  getFriendlyPlayerAccountErrorMessage,
  playerAccountUnavailableMessage,
  updatePlayerProfile,
  updatePlayerProfilePhoto,
  updatePlayerScoringProfile,
} from '../src/features/player-account/playerAccountApi';
import type {
  MatchHistory,
  MatchDetail,
  CricketStats,
  PlayerAccountBootstrap,
  PlayerProfile,
  PlayerStats,
  ScoringProfile,
  TournamentHistory,
  UpdatePlayerProfilePayload,
  UpdateScoringProfilePayload,
} from '../src/features/player-account/playerAccountTypes';
import { usePlayerAccountSession } from '../src/features/player-account/usePlayerAccountSession';
import { env } from '../src/lib/env';
import type { TournamentMatchDetail, TournamentMatchSummary } from '../src/application/scoring/tournamentScoring';
import { createMockTournamentScoringClient } from '../src/features/tournament-scoring/tournamentScoringApi';
import { LocalTournamentSubmissionRepository, submitTournamentResultWithLocalDraft } from '../src/features/tournament-scoring/localTournamentSubmissions';
import type { TournamentSubmissionRecord } from '../src/application/scoring/tournamentScoring';

interface HomeViewProps {
  onQuickGame: () => void;
  onOpenAccount: (mode: AuthPanelMode) => void;
  onOpenUserInfo: () => void;
}

export type AuthPanelMode = 'login' | 'register' | 'profile';

const homePillButtonClassName =
  "inline-flex h-14 w-[18.5rem] max-w-[92vw] items-center justify-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-5 text-[11px] font-black uppercase tracking-[0.34em] text-gray-300 transition-all hover:border-orange-400/30 hover:bg-white/[0.07] hover:text-white";

const accountTopActionsClassName =
  "absolute right-4 top-4 z-20 flex items-center gap-2 sm:right-6 sm:top-6";

const accountTopButtonClassName =
  "inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/25 text-gray-300 shadow-[0_12px_28px_rgba(0,0,0,0.2)] backdrop-blur-sm transition-all hover:border-orange-300/30 hover:bg-white/[0.06] hover:text-white focus:outline-none focus:ring-2 focus:ring-orange-300/35";

const authInputClassName =
  "h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm font-semibold text-white outline-none transition-colors placeholder:text-gray-600 focus:border-orange-300/45 focus:bg-black/35";

const authPrimaryButtonClassName =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 text-[11px] font-black uppercase tracking-[0.16em] text-white shadow-[0_14px_32px_rgba(234,88,12,0.26)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60";

const authSecondaryButtonClassName =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-3 text-[11px] font-black uppercase tracking-[0.14em] text-gray-200 transition-all hover:border-orange-300/30 hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-60";

const profileInputClassName =
  "h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm font-semibold text-white outline-none transition-colors placeholder:text-gray-600 focus:border-orange-300/45 focus:bg-black/35 disabled:cursor-not-allowed disabled:opacity-55";

const profileReadonlyClassName =
  "flex min-h-11 w-full items-center rounded-xl border border-white/10 bg-white/[0.035] px-3 text-sm font-semibold text-gray-300";

const tournamentSubmissionStatusLabel: Record<TournamentSubmissionRecord['status'], string> = {
  draft: 'Brouillon',
  pending: 'En attente',
  submitted: 'Envoye',
  rejected: 'Rejete',
  conflict: 'Conflit',
  unauthorized: 'Session expiree',
  network_error: 'Erreur reseau',
  error: 'Erreur',
};

const getTournamentSubmissionStatusClassName = (status: TournamentSubmissionRecord['status']) => {
  if (status === 'submitted') return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100';
  if (status === 'draft' || status === 'pending') return 'border-cyan-300/25 bg-cyan-500/10 text-cyan-100';
  if (status === 'network_error') return 'border-orange-300/30 bg-orange-500/10 text-orange-100';
  if (status === 'conflict') return 'border-violet-300/30 bg-violet-500/10 text-violet-100';
  if (status === 'rejected') return 'border-red-300/30 bg-red-500/10 text-red-100';
  if (status === 'unauthorized') return 'border-amber-300/30 bg-amber-500/10 text-amber-100';

  return 'border-red-300/30 bg-red-500/10 text-red-100';
};

const isTournamentSubmissionRetryable = (status: TournamentSubmissionRecord['status']) =>
  status !== 'submitted';

const profileLabelClassName =
  "text-[10px] font-black uppercase tracking-[0.14em] text-gray-500";

const emptyProfileForm: UpdatePlayerProfilePayload = {
  first_name: '',
  last_name: '',
  display_name: '',
  nickname: '',
  phone: '',
  birth_date: '',
  gender: '',
  country: '',
  city: '',
  address: '',
  postal_code: '',
  nationality: '',
  dominant_hand: '',
  darts_category: '',
  federation: '',
  license_number: '',
  is_public: false,
};

const genderOptions: Array<{ value: UpdatePlayerProfilePayload['gender']; label: string }> = [
  { value: '', label: 'Non renseigne' },
  { value: 'male', label: 'Homme' },
  { value: 'female', label: 'Femme' },
  { value: 'other', label: 'Autre' },
  { value: 'undisclosed', label: 'Non communique' },
];

const dominantHandOptions: Array<{ value: UpdatePlayerProfilePayload['dominant_hand']; label: string }> = [
  { value: '', label: 'Non renseignee' },
  { value: 'right', label: 'Droite' },
  { value: 'left', label: 'Gauche' },
];

const dartsCategoryOptions: Array<{ value: UpdatePlayerProfilePayload['darts_category']; label: string }> = [
  { value: '', label: 'Non renseignee' },
  { value: 'debutant', label: 'Debutant' },
  { value: 'reserve', label: 'Reserve' },
  { value: 'promotion', label: 'Promotion' },
  { value: 'honneur', label: 'Honneur' },
  { value: 'excellence', label: 'Excellence' },
  { value: 'national', label: 'National' },
  { value: 'elite', label: 'Elite' },
];

const getOptionalProfileString = (value: string | undefined): string => value ?? '';

const toProfileForm = (profile: PlayerProfile): UpdatePlayerProfilePayload => ({
  first_name: getOptionalProfileString(profile.first_name),
  last_name: getOptionalProfileString(profile.last_name),
  display_name: getOptionalProfileString(profile.display_name),
  nickname: getOptionalProfileString(profile.nickname),
  phone: getOptionalProfileString(profile.phone),
  birth_date: getOptionalProfileString(profile.birth_date),
  gender: profile.gender ?? '',
  country: getOptionalProfileString(profile.country),
  city: getOptionalProfileString(profile.city),
  address: getOptionalProfileString(profile.address),
  postal_code: getOptionalProfileString(profile.postal_code),
  nationality: getOptionalProfileString(profile.nationality),
  dominant_hand: profile.dominant_hand ?? '',
  darts_category: profile.darts_category ?? '',
  federation: getOptionalProfileString(profile.federation),
  license_number: getOptionalProfileString(profile.license_number),
  is_public: Boolean(profile.is_public),
});

const buildProfilePayload = (form: UpdatePlayerProfilePayload): UpdatePlayerProfilePayload => ({
  first_name: form.first_name.trim(),
  last_name: form.last_name.trim(),
  display_name: form.display_name.trim(),
  nickname: form.nickname.trim(),
  phone: form.phone.trim(),
  birth_date: form.birth_date.trim(),
  gender: form.gender,
  country: form.country.trim(),
  city: form.city.trim(),
  address: form.address.trim(),
  postal_code: form.postal_code.trim(),
  nationality: form.nationality.trim(),
  dominant_hand: form.dominant_hand,
  darts_category: form.darts_category,
  federation: form.federation.trim(),
  license_number: form.license_number.trim(),
  is_public: form.is_public,
});

const resolveProfileDisplayName = (profile: PlayerProfile | null, fallback: string): string =>
  profile?.display_name || profile?.nickname || `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() || fallback;

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  return getFriendlyPlayerAccountErrorMessage(error, fallback);
};

type PlayerSpaceTab = 'overview' | 'stats' | 'matches' | 'tournaments' | 'settings';
type PlayerStatsMode = 'x01' | 'cricket';

const playerSpaceTabs: Array<{ id: PlayerSpaceTab; label: string }> = [
  { id: 'overview', label: 'Vue' },
  { id: 'stats', label: 'Stats X01' },
  { id: 'matches', label: 'Matchs X01' },
  { id: 'tournaments', label: 'Tournois' },
  { id: 'settings', label: 'Reglages' },
];

const scoringFormatOptions: Array<{ value: UpdateScoringProfilePayload['preferred_format']; label: string }> = [
  { value: 'x01', label: 'X01' },
  { value: 'cricket', label: 'Cricket' },
  { value: 'around_the_clock', label: 'Around' },
];

const themeOptions: Array<{ value: UpdateScoringProfilePayload['theme_preference']; label: string }> = [
  { value: 'system', label: 'Systeme' },
  { value: 'dark', label: 'Sombre' },
  { value: 'light', label: 'Clair' },
];

const scoringFormatLabels: Record<string, string> = {
  x01: 'X01',
  cricket: 'Cricket',
  around_the_clock: 'Around the clock',
};

const syncStateLabels: Record<string, string> = {
  none: 'Non synchronise',
  pending: 'En attente',
  synced: 'Synchronise',
  failed: 'Erreur sync',
};

const emptyScoringForm: UpdateScoringProfilePayload = {
  default_target: 501,
  preferred_format: 'x01',
  sound_enabled: true,
  voice_enabled: false,
  theme_preference: 'system',
};

const getRecordValue = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' ? value as Record<string, unknown> : null;

const readDisplayString = (record: Record<string, unknown> | null, keys: string[], fallback = ''): string => {
  if (!record) return fallback;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }

  return fallback;
};

const readDisplayNumber = (record: Record<string, unknown> | null, keys: string[], fallback = 0): number => {
  if (!record) return fallback;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const normalized = Number(value.replace('%', '').replace(',', '.').trim());
      if (Number.isFinite(normalized)) return normalized;
    }
  }

  return fallback;
};

const readDisplayBoolean = (record: Record<string, unknown> | null, keys: string[], fallback = false): boolean => {
  if (!record) return fallback;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      if (value === 'true') return true;
      if (value === 'false') return false;
    }
  }

  return fallback;
};

const normalizePercentValue = (value: number): number =>
  value > 0 && value <= 1 ? value * 100 : value;

const formatNumber = (value: number | undefined, suffix = ''): string => {
  const safeValue = Number.isFinite(value) ? Number(value) : 0;
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(safeValue)}${suffix}`;
};

const formatPercent = (value: number | undefined): string =>
  `${formatNumber(normalizePercentValue(Number.isFinite(value) ? Number(value) : 0))} %`;

const formatDateLabel = (value: string | undefined): string => {
  if (!value) return 'Date inconnue';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const formatDuration = (seconds: number | undefined): string | null => {
  if (!seconds || seconds <= 0) return null;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return minutes > 0 ? `${minutes} min ${remainingSeconds}s` : `${remainingSeconds}s`;
};

const toPlayerStats = (stats: unknown): PlayerStats => {
  const record = getRecordValue(stats);

  return {
    matches_played: readDisplayNumber(record, ['matches_played', 'matchesPlayed']),
    wins: readDisplayNumber(record, ['wins']),
    losses: readDisplayNumber(record, ['losses']),
    win_rate: normalizePercentValue(readDisplayNumber(record, ['win_rate', 'winRate'])),
    general_average: readDisplayNumber(record, ['general_average', 'generalAverage', 'average']),
    best_average: readDisplayNumber(record, ['best_average', 'bestAverage']),
    recent_average: readDisplayNumber(record, ['recent_average', 'recentAverage']),
    count_180: readDisplayNumber(record, ['count_180', 'score180', 'scores_180']),
    count_140_plus: readDisplayNumber(record, ['count_140_plus', 'score140Plus', 'scores_140_plus']),
    count_100_plus: readDisplayNumber(record, ['count_100_plus', 'score100Plus', 'scores_100_plus']),
    best_checkout: readDisplayNumber(record, ['best_checkout', 'bestCheckout']),
    checkout_rate: normalizePercentValue(readDisplayNumber(record, ['checkout_rate', 'checkoutRate'])),
    recent_form_rate: normalizePercentValue(readDisplayNumber(record, ['recent_form_rate', 'recentFormRate'])),
    last_calculated_at: readDisplayString(record, ['last_calculated_at', 'lastCalculatedAt']),
  };
};

const toCricketStats = (stats: unknown): CricketStats => {
  const record = getRecordValue(stats);
  const cricket = getRecordValue(record?.cricket);

  return {
    game_mode: readDisplayString(record, ['game_mode', 'gameMode'], 'cricket'),
    matches_played: readDisplayNumber(record, ['matches_played', 'matchesPlayed']),
    wins: readDisplayNumber(record, ['wins']),
    losses: readDisplayNumber(record, ['losses']),
    draws: readDisplayNumber(record, ['draws']),
    win_rate: normalizePercentValue(readDisplayNumber(record, ['win_rate', 'winRate'])),
    recent_form_rate: normalizePercentValue(readDisplayNumber(record, ['recent_form_rate', 'recentFormRate'])),
    last_calculated_at: readDisplayString(record, ['last_calculated_at', 'lastCalculatedAt']),
    cricket: {
      mpr: readDisplayNumber(cricket, ['mpr']),
      best_mpr: readDisplayNumber(cricket, ['best_mpr', 'bestMpr']),
      recent_mpr: readDisplayNumber(cricket, ['recent_mpr', 'recentMpr']),
      total_marks: readDisplayNumber(cricket, ['total_marks', 'totalMarks']),
      darts_thrown: readDisplayNumber(cricket, ['darts_thrown', 'dartsThrown']),
      visits_count: readDisplayNumber(cricket, ['visits_count', 'visitsCount']),
      count_9_marks: readDisplayNumber(cricket, ['count_9_marks', 'count9Marks']),
      count_8_marks: readDisplayNumber(cricket, ['count_8_marks', 'count8Marks']),
      count_7_marks: readDisplayNumber(cricket, ['count_7_marks', 'count7Marks']),
      count_6_plus_marks: readDisplayNumber(cricket, ['count_6_plus_marks', 'count6PlusMarks']),
      points_scored: readDisplayNumber(cricket, ['points_scored', 'pointsScored']),
      points_allowed: readDisplayNumber(cricket, ['points_allowed', 'pointsAllowed']),
      point_differential: readDisplayNumber(cricket, ['point_differential', 'pointDifferential']),
      bull_marks: readDisplayNumber(cricket, ['bull_marks', 'bullMarks']),
      marks_20: readDisplayNumber(cricket, ['marks_20', 'marks20']),
      marks_19: readDisplayNumber(cricket, ['marks_19', 'marks19']),
      marks_18: readDisplayNumber(cricket, ['marks_18', 'marks18']),
      marks_17: readDisplayNumber(cricket, ['marks_17', 'marks17']),
      marks_16: readDisplayNumber(cricket, ['marks_16', 'marks16']),
      marks_15: readDisplayNumber(cricket, ['marks_15', 'marks15']),
      close_rate: normalizePercentValue(readDisplayNumber(cricket, ['close_rate', 'closeRate'])),
    },
  };
};

const hasStatsActivity = (stats: PlayerStats): boolean =>
  stats.matches_played > 0 || stats.wins > 0 || stats.losses > 0;

const hasCricketStatsActivity = (stats: CricketStats): boolean =>
  stats.matches_played > 0 || stats.wins > 0 || stats.losses > 0 || stats.draws > 0;

const toMatchHistory = (value: unknown, index: number): MatchHistory => {
  const record = getRecordValue(value);
  const id = readDisplayString(record, ['id', 'match_id', 'matchId'], `match-${index}`);
  const result = readDisplayString(record, ['result', 'outcome'], '').toLowerCase();
  const gameMode = readDisplayString(record, ['game_mode', 'gameMode'], 'x01').toLowerCase();
  const cricket = getRecordValue(record?.cricket);

  return {
    id,
    source: readDisplayString(record, ['source']) || undefined,
    client_match_id: readDisplayString(record, ['client_match_id', 'clientMatchId']) || undefined,
    game_mode: gameMode,
    opponent_id: readDisplayString(record, ['opponent_id', 'opponentId']) || null,
    tournament_name: readDisplayString(record, ['tournament_name', 'tournamentName', 'tournament', 'competition']),
    stage_name: readDisplayString(record, ['stage_name', 'stageName', 'stage']),
    round: readDisplayString(record, ['round']),
    opponent_name: readDisplayString(record, ['opponent_name', 'opponentName', 'opponent', 'player_name', 'playerName'], 'Adversaire inconnu'),
    player_score: readDisplayNumber(record, ['player_score', 'playerScore']),
    opponent_score: readDisplayNumber(record, ['opponent_score', 'opponentScore']),
    result,
    target: readDisplayNumber(record, ['target'], 501),
    board_label: readDisplayString(record, ['board_label', 'boardLabel']) || undefined,
    started_at: readDisplayString(record, ['started_at', 'startedAt']) || undefined,
    completed_at: readDisplayString(record, ['completed_at', 'completedAt', 'played_at', 'playedAt', 'date']) || undefined,
    duration_sec: readDisplayNumber(record, ['duration_sec', 'durationSec']) || undefined,
    match_average: readDisplayNumber(record, ['match_average', 'matchAverage', 'average']),
    count_180: readDisplayNumber(record, ['count_180', 'count180', 'score180']),
    count_140_plus: readDisplayNumber(record, ['count_140_plus', 'count140Plus', 'score140Plus']),
    count_100_plus: readDisplayNumber(record, ['count_100_plus', 'count100Plus', 'score100Plus']),
    best_checkout: readDisplayNumber(record, ['best_checkout', 'bestCheckout']),
    checkout_rate: normalizePercentValue(readDisplayNumber(record, ['checkout_rate', 'checkoutRate'])),
    variant: readDisplayString(record, ['variant']) || undefined,
    cricket: cricket ? {
      match_mpr: readDisplayNumber(cricket, ['match_mpr', 'matchMpr']),
      total_marks: readDisplayNumber(cricket, ['total_marks', 'totalMarks']),
      count_9_marks: readDisplayNumber(cricket, ['count_9_marks', 'count9Marks']),
      count_8_marks: readDisplayNumber(cricket, ['count_8_marks', 'count8Marks']),
      count_7_marks: readDisplayNumber(cricket, ['count_7_marks', 'count7Marks']),
      count_6_plus_marks: readDisplayNumber(cricket, ['count_6_plus_marks', 'count6PlusMarks']),
      points_scored: readDisplayNumber(cricket, ['points_scored', 'pointsScored']),
      points_allowed: readDisplayNumber(cricket, ['points_allowed', 'pointsAllowed']),
      bull_marks: readDisplayNumber(cricket, ['bull_marks', 'bullMarks']),
    } : undefined,
  };
};

const toMatchDetail = (value: unknown): MatchDetail => {
  const record = getRecordValue(value);
  const rawSummary = record?.summary ?? record?.match ?? value;
  const rawTurns = Array.isArray(record?.turns) ? record.turns : [];

  return {
    summary: toMatchHistory(rawSummary, 0),
    turns: rawTurns.map((turnValue, index) => {
      const turn = getRecordValue(turnValue);
      const cricket = getRecordValue(turn?.cricket);
      const rawSegmentHits = getRecordValue(cricket?.segment_hits) ?? getRecordValue(cricket?.segmentHits);
      const closedSegmentsAfter = cricket?.closed_segments_after ?? cricket?.closedSegmentsAfter;
      return {
        id: readDisplayString(turn, ['id', 'turn_id', 'turnId']) || `turn-${index}`,
        participant_name: readDisplayString(turn, ['participant_name', 'participantName', 'name'], readDisplayBoolean(turn, ['is_player', 'isPlayer']) ? 'Joueur' : 'Adversaire'),
        is_player: readDisplayBoolean(turn, ['is_player', 'isPlayer']),
        set_number: readDisplayNumber(turn, ['set_number', 'setNumber'], 1),
        leg_number: readDisplayNumber(turn, ['leg_number', 'legNumber'], 1),
        visit_number: readDisplayNumber(turn, ['visit_number', 'visitNumber', 'visit_index', 'visitIndex'], index + 1),
        points_scored: readDisplayNumber(turn, ['points_scored', 'pointsScored', 'score']),
        remaining_points: readDisplayNumber(turn, ['remaining_points', 'remainingPoints', 'remaining_after', 'remainingAfter']) || undefined,
        checkout_attempt: readDisplayBoolean(turn, ['checkout_attempt', 'checkoutAttempt']),
        dart_count: readDisplayNumber(turn, ['dart_count', 'dartCount', 'darts_thrown', 'dartsThrown'], 3),
        dart_summary: readDisplayString(turn, ['dart_summary', 'dartSummary'], ''),
        cricket: cricket ? {
          marks_scored: readDisplayNumber(cricket, ['marks_scored', 'marksScored']),
          points_scored: readDisplayNumber(cricket, ['points_scored', 'pointsScored']),
          segment_hits: rawSegmentHits ? Object.fromEntries(Object.entries(rawSegmentHits).map(([key, value]) => [key, Number(value) || 0])) : undefined,
          closed_segments_after: Array.isArray(closedSegmentsAfter) ? closedSegmentsAfter.map(String) : undefined,
        } : undefined,
        scored_at: readDisplayString(turn, ['scored_at', 'scoredAt', 'created_at', 'createdAt']),
      };
    }).sort((a, b) =>
      a.set_number - b.set_number
      || a.leg_number - b.leg_number
      || a.visit_number - b.visit_number,
    ),
  };
};

const toTournamentHistory = (value: unknown, index: number): TournamentHistory => {
  const record = getRecordValue(value);

  return {
    id: readDisplayString(record, ['id', 'tournament_id', 'tournamentId'], `tournament-${index}`),
    tournament_name: readDisplayString(record, ['tournament_name', 'tournamentName', 'name'], `Tournoi ${index + 1}`),
    tournament_slug: readDisplayString(record, ['tournament_slug', 'tournamentSlug', 'slug']),
    tournament_date: readDisplayString(record, ['tournament_date', 'tournamentDate', 'date', 'started_at', 'startedAt']) || undefined,
    category_name: readDisplayString(record, ['category_name', 'categoryName', 'category']) || undefined,
    final_ranking: readDisplayNumber(record, ['final_ranking', 'finalRanking', 'rank']) || undefined,
    total_matches: readDisplayNumber(record, ['total_matches', 'totalMatches', 'matches']),
    wins: readDisplayNumber(record, ['wins']),
    losses: readDisplayNumber(record, ['losses']),
    structure_name: readDisplayString(record, ['structure_name', 'structureName', 'structure']) || undefined,
    ranking_points: readDisplayNumber(record, ['ranking_points', 'rankingPoints', 'points']) || undefined,
  };
};

const toScoringProfile = (value: unknown): ScoringProfile | null => {
  const record = getRecordValue(value);
  if (!record || Object.keys(record).length === 0) return null;

  const preferredFormat = readDisplayString(record, ['preferred_format', 'preferredFormat'], 'x01') as ScoringProfile['preferred_format'];
  const themePreference = readDisplayString(record, ['theme_preference', 'themePreference'], 'system') as ScoringProfile['theme_preference'];

  return {
    player_id: readDisplayString(record, ['player_id', 'playerId']),
    external_player_id: readDisplayString(record, ['external_player_id', 'externalPlayerId']) || undefined,
    provider_source: readDisplayString(record, ['provider_source', 'providerSource']),
    sync_state: readDisplayString(record, ['sync_state', 'syncState'], 'none'),
    last_sync_at: readDisplayString(record, ['last_sync_at', 'lastSyncAt']) || undefined,
    sync_error: readDisplayString(record, ['sync_error', 'syncError']) || undefined,
    default_target: readDisplayNumber(record, ['default_target', 'defaultTarget'], 501),
    preferred_format: scoringFormatLabels[preferredFormat] ? preferredFormat : 'x01',
    sound_enabled: readDisplayBoolean(record, ['sound_enabled', 'soundEnabled'], true),
    voice_enabled: readDisplayBoolean(record, ['voice_enabled', 'voiceEnabled'], false),
    theme_preference: themePreference === 'light' || themePreference === 'dark' || themePreference === 'system' ? themePreference : 'system',
  };
};

const toScoringForm = (scoring: ScoringProfile | null): UpdateScoringProfilePayload => scoring
  ? {
      default_target: scoring.default_target,
      preferred_format: scoring.preferred_format,
      sound_enabled: scoring.sound_enabled,
      voice_enabled: scoring.voice_enabled,
      theme_preference: scoring.theme_preference,
    }
  : emptyScoringForm;

const toHistoryList = <T,>(values: unknown, mapper: (value: unknown, index: number) => T): T[] =>
  Array.isArray(values)
    ? values.map(mapper)
    : Array.isArray(getRecordValue(values)?.items)
      ? (getRecordValue(values)?.items as unknown[]).map(mapper)
      : Array.isArray(getRecordValue(values)?.matches)
        ? (getRecordValue(values)?.matches as unknown[]).map(mapper)
        : [];

const upsertMatchHistory = (matches: MatchHistory[], match: MatchHistory): MatchHistory[] => {
  const next = matches.filter((item) => {
    if (match.client_match_id && item.client_match_id === match.client_match_id) return false;
    return item.id !== match.id;
  });
  return [match, ...next].slice(0, 20);
};

const formatMatchGameLabel = (match: MatchHistory): string => {
  const mode = match.game_mode?.toLowerCase();
  if (mode === 'x01' && match.target) {
    return `X01 ${match.target}`;
  }
  if (mode === 'cricket') {
    return match.variant ? `Cricket ${match.variant}` : 'Cricket';
  }
  return match.game_mode || 'Match';
};

const getMatchResultLabel = (result: string): string => {
  if (result === 'win') return 'Victoire';
  if (result === 'loss') return 'Defaite';
  if (result === 'draw') return 'Nul';
  return result || 'Resultat';
};

export const HomeView: React.FC<HomeViewProps> = ({ onQuickGame, onOpenAccount, onOpenUserInfo }) => {
  const [showQr, setShowQr] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [localQrDataUrl, setLocalQrDataUrl] = useState('');
  const qrCloseButtonRef = useRef<HTMLButtonElement | null>(null);
  const qrDialogId = useId();

  const appUrl = env.VITE_APP_URL?.replace(/\/$/, '') || window.location.origin;
  const githubRepositoryUrl = 'https://github.com/floriangiral/Bougnat_darts_counter';
  const shareUrl = appUrl;
  const qrUrl = `/app-qr.svg?appUrl=${encodeURIComponent(shareUrl)}`;
  const normalizedAppEnv = env.VITE_APP_ENV.trim().toLowerCase();
  const isConnectedModeEnabled = env.VITE_TOURNAMENT_BACKEND_ENABLED;
  const shouldUseRuntimeQr =
    normalizedAppEnv === 'local' ||
    normalizedAppEnv === 'dev' ||
    normalizedAppEnv === 'development' ||
    /localhost|127\.0\.0\.1/.test(shareUrl);
  const apiBaseUrl = env.VITE_TOURNAMENT_API_BASE_URL || env.VITE_BOUGNAT_API_URL;
  const isClerkConfigured = Boolean(env.VITE_CLERK_PUBLISHABLE_KEY.trim());
  const isMockConnected = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('auth') === 'mock'
    && isConnectedModeEnabled;

  const buildLabel =
    env.VITE_APP_VERSION && env.VITE_APP_VERSION !== 'dev'
      ? ` · build ${env.VITE_APP_VERSION.slice(0, 7)}`
      : '';
  const releaseLabel = isConnectedModeEnabled && env.VITE_APP_VERSION.startsWith('2.0') ? 'v2.0' : 'v1.1';
  const environmentBadgeLabel =
    normalizedAppEnv === 'preprod' || normalizedAppEnv === 'preview' || normalizedAppEnv === 'staging'
      ? 'PREPROD'
      : normalizedAppEnv === 'local' || normalizedAppEnv === 'dev' || normalizedAppEnv === 'development'
        ? 'DEV'
        : '';
  const showEnvironmentBadge = Boolean(environmentBadgeLabel);

  useEffect(() => {
    if (!showQr) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowQr(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    window.setTimeout(() => qrCloseButtonRef.current?.focus(), 0);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showQr]);

  useEffect(() => {
    if (!showQr || !shouldUseRuntimeQr) {
      return;
    }

    let cancelled = false;

    import('qrcode')
      .then(({ default: QRCode }) =>
        QRCode.toDataURL(shareUrl, {
          errorCorrectionLevel: 'M',
          margin: 1,
          width: 192,
        }),
      )
      .then((dataUrl) => {
        if (!cancelled) {
          setLocalQrDataUrl(dataUrl);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLocalQrDataUrl('');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [shareUrl, shouldUseRuntimeQr, showQr]);

  const openAuthPanel = (mode: AuthPanelMode) => {
    setShowQr(false);
    onOpenAccount(mode);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05070b] text-white">
      {showEnvironmentBadge && (
        <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex justify-center px-4">
          {/* The badge normalizes common deployment aliases so preprod/dev stays visible across build systems. */}
          <div className={`inline-flex max-w-[calc(100vw-2rem)] items-center rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] shadow-[0_10px_30px_rgba(0,0,0,0.28)] ${
            normalizedAppEnv === 'preprod' || normalizedAppEnv === 'preview' || normalizedAppEnv === 'staging'
              ? 'border-orange-400/40 bg-orange-500/15 text-orange-200'
              : 'border-cyan-400/40 bg-cyan-500/15 text-cyan-200'
          }`}>
            <span className="mr-2 h-2 w-2 rounded-full bg-current" />
            {environmentBadgeLabel}
          </div>
        </div>
      )}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.22),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(220,38,38,0.18),transparent_22%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.05),transparent_35%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:28px_28px]" />

      {isConnectedModeEnabled ? (
        isMockConnected ? (
          <div className={accountTopActionsClassName}>
            <button
              type="button"
              onClick={onOpenUserInfo}
              className={accountTopButtonClassName}
              aria-label="Ouvrir l'espace joueur"
              title="Espace joueur"
            >
              <IdCard className="h-4 w-4 text-orange-200" />
            </button>
          </div>
        ) : isClerkConfigured ? (
          <PlayerAccountTopButton
            apiBaseUrl={apiBaseUrl}
            jwtTemplateName={env.VITE_CLERK_JWT_TEMPLATE_NAME}
            openAuthPanel={openAuthPanel}
            openUserInfo={onOpenUserInfo}
          />
        ) : (
          <PlayerAccountTopButtonFallback openAuthPanel={openAuthPanel} />
        )
      ) : (
        <div className="absolute right-4 top-14 z-20 rounded-full border border-gray-700/60 bg-black/50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-gray-400">
          <span className="mr-2 h-2 w-2 rounded-full bg-gray-500" />
          Espace joueur : version 1.1 hors backend
        </div>
      )}

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-10 sm:px-6 sm:py-16 lg:py-20">
        <div className="flex flex-1 items-center justify-center">
          <section className="space-y-8">
            <div className="space-y-5">
              <div className="relative">
                <div className="absolute -left-2 top-2 h-20 w-20 rounded-full bg-orange-500/20 blur-3xl sm:-left-6 sm:top-4 sm:h-24 sm:w-24" />
                <div className="relative flex flex-col items-center">
                  <div className="flex w-full flex-col items-center leading-none">
                    <h1 className="legacy-home-logo-top whitespace-nowrap text-[clamp(2.65rem,14vw,6.1rem)] font-black italic text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-300 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] transform -skew-x-6">
                      BOUGNAT
                    </h1>
                    <h2 className="legacy-home-logo-bottom mt-1 block whitespace-nowrap overflow-visible pb-2 pr-1 text-[clamp(2.25rem,12vw,5.15rem)] leading-[0.95] font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 tracking-tight transform -skew-x-12 drop-shadow-[0_0_25px_rgba(234,88,12,0.6)] sm:mt-2 sm:pb-3 sm:pr-2">
                      DARTS
                    </h2>
                  </div>
                  <div className="mt-3 flex w-full flex-wrap items-center justify-center gap-3 sm:flex-nowrap sm:gap-4">
                    <div className="h-[2px] w-8 rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-transparent sm:w-12" />
                    <p className="bg-gradient-to-r from-orange-100 via-white to-orange-300 bg-clip-text text-[10px] font-black uppercase tracking-[0.22em] text-transparent sm:text-[12px] sm:tracking-[0.38em]">
                      Application de scoring
                    </p>
                    <div className="h-[2px] w-8 rounded-full bg-gradient-to-l from-orange-500 via-red-500 to-transparent sm:w-12" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-[20%] flex justify-center sm:mt-[18%]">
              <div className="flex w-full flex-col items-center gap-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={onQuickGame}
                  className="group h-14 w-full rounded-2xl px-5 text-base shadow-[0_16px_40px_rgba(234,88,12,0.3)] sm:h-16 sm:min-w-[230px] sm:px-6 sm:text-lg"
                >
                  <span className="inline-flex items-center gap-3">
                    <span>Lancer une partie</span>
                    <ChevronRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                  </span>
                </Button>
              </div>
            </div>
          </section>
        </div>

        <footer className="mt-10 flex flex-col items-center gap-5 text-center">
          <button
            onClick={() => setShowQr(!showQr)}
            className={homePillButtonClassName}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 text-orange-300">
              <QrCode className="h-4 w-4" />
            </div>
            Partager L'App
          </button>
          <InstallAppButton buttonClassName={homePillButtonClassName} />

          <div className="space-y-2 text-xs sm:text-sm">
            <p className="text-gray-500">Application officielle Bougnat Darts</p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setShowChangelog(true)}
                className="font-black text-orange-400 underline decoration-orange-400/50 underline-offset-4 transition-colors hover:text-orange-300"
              >
                {`${releaseLabel}${buildLabel} (Nouveautes)`}
              </button>
              <a
                href={githubRepositoryUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Ouvrir le repository GitHub"
                title="Ouvrir le repository GitHub"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-gray-200 transition-all hover:scale-105 hover:border-white/30 hover:bg-white/10 hover:text-white"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </footer>
      </div>

      {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}

      {showQr && (
        <QrDialog
          localQrDataUrl={localQrDataUrl}
          qrCloseButtonRef={qrCloseButtonRef}
          qrDialogId={qrDialogId}
          qrUrl={qrUrl}
          shareUrl={shareUrl}
          shouldUseRuntimeQr={shouldUseRuntimeQr}
          onClose={() => setShowQr(false)}
        />
      )}
    </div>
  );
};

type PlayerAccountTopButtonProps = {
  apiBaseUrl: string;
  jwtTemplateName: string;
  openAuthPanel: (mode: AuthPanelMode) => void;
  openUserInfo: () => void;
};

const PlayerAccountTopButton: React.FC<PlayerAccountTopButtonProps> = ({ apiBaseUrl, jwtTemplateName, openAuthPanel, openUserInfo }) => {
  const playerAccount = usePlayerAccountSession(apiBaseUrl, jwtTemplateName);

  if (playerAccount.isClerkSignedIn) {
    const buttonTitle = playerAccount.displayName ? `Ouvrir le profil de ${playerAccount.displayName}` : 'Ouvrir le profil';

    return (
      <div className={accountTopActionsClassName}>
        <button
          type="button"
          onClick={openUserInfo}
          className={accountTopButtonClassName}
          aria-label="Ouvrir l'espace joueur"
          title="Espace joueur"
        >
          <IdCard className="h-4 w-4 text-orange-200" />
        </button>
        <button
          type="button"
          onClick={() => openAuthPanel('profile')}
          className={accountTopButtonClassName}
          aria-label={buttonTitle}
          title={buttonTitle}
        >
          <User className="h-4 w-4 text-orange-200" />
        </button>
      </div>
    );
  }

  return (
    <div className={accountTopActionsClassName}>
      <button
        type="button"
        onClick={() => openAuthPanel('login')}
        className={accountTopButtonClassName}
        aria-label="Se connecter"
        title="Se connecter"
      >
        <LogIn className="h-4 w-4 text-orange-200" />
      </button>
      <button
        type="button"
        onClick={() => openAuthPanel('register')}
        className={accountTopButtonClassName}
        aria-label="S'inscrire"
        title="S'inscrire"
      >
        <UserPlus className="h-4 w-4 text-orange-200" />
      </button>
    </div>
  );
};

const PlayerAccountTopButtonFallback: React.FC<{ openAuthPanel: (mode: AuthPanelMode) => void }> = ({ openAuthPanel }) => (
  <div className={accountTopActionsClassName}>
    <button
      type="button"
      onClick={() => openAuthPanel('login')}
      className={accountTopButtonClassName}
      aria-label="Se connecter"
      title="Se connecter"
    >
      <LogIn className="h-4 w-4 text-orange-200" />
    </button>
    <button
      type="button"
      onClick={() => openAuthPanel('register')}
      className={accountTopButtonClassName}
      aria-label="S'inscrire"
      title="S'inscrire"
    >
      <UserPlus className="h-4 w-4 text-orange-200" />
    </button>
  </div>
);

type PlayerAccountViewProps = {
  initialMode: AuthPanelMode;
  onBack: () => void;
};

export const PlayerAccountView: React.FC<PlayerAccountViewProps> = ({ initialMode, onBack }) => {
  const [mode, setMode] = useState<AuthPanelMode>(initialMode);
  const authTitleId = useId();
  const apiBaseUrl = env.VITE_TOURNAMENT_API_BASE_URL || env.VITE_BOUGNAT_API_URL;
  const isClerkConfigured = Boolean(env.VITE_CLERK_PUBLISHABLE_KEY.trim());
  const isConnectedModeEnabled = env.VITE_TOURNAMENT_BACKEND_ENABLED;

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#05070b] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.18),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(220,38,38,0.14),transparent_22%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.05),transparent_35%)]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-4 sm:px-6 sm:py-10">
        <div className="mb-6 flex shrink-0 items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-gray-300 transition-all hover:border-orange-400/40 hover:bg-white/10 hover:text-white"
          >
            <Home className="h-4 w-4" />
            Accueil
          </button>
        </div>

        <main className={`mx-auto w-full text-left ${mode === 'profile' ? 'max-w-3xl' : 'max-w-sm'}`}>
          <div>
            <h1 id={authTitleId} className="text-2xl font-black uppercase tracking-wide text-white">
              {mode === 'profile' ? 'Profil' : mode === 'register' ? "S'inscrire" : 'Se connecter'}
            </h1>
          </div>

          {!isConnectedModeEnabled ? (
            <div className="mt-5 rounded-2xl border border-white/20 bg-white/5 px-4 py-4 text-sm leading-6 text-gray-300">
              Espace joueur non disponible sur la release 1.1.
            </div>
          ) : !isClerkConfigured ? (
            <div className="mt-5 rounded-2xl border border-orange-300/20 bg-orange-500/10 px-4 py-4 text-sm leading-6 text-orange-100">
              Connexion indisponible ici: ajoute `VITE_CLERK_PUBLISHABLE_KEY` pour activer la creation de compte dans l'app.
            </div>
          ) : (
            <ClerkAccountPanel apiBaseUrl={apiBaseUrl} jwtTemplateName={env.VITE_CLERK_JWT_TEMPLATE_NAME} mode={mode} setMode={setMode} />
          )}
        </main>
      </div>
    </div>
  );
};

type UserInfoViewProps = {
  onBack: () => void;
  onLaunchTournamentMatch: (detail: TournamentMatchDetail, bearerToken: string) => void;
};

export const UserInfoView: React.FC<UserInfoViewProps> = ({ onBack, onLaunchTournamentMatch }) => {
  const titleId = useId();
  const apiBaseUrl = env.VITE_TOURNAMENT_API_BASE_URL || env.VITE_BOUGNAT_API_URL;
  const isClerkConfigured = Boolean(env.VITE_CLERK_PUBLISHABLE_KEY.trim());
  const isConnectedModeEnabled = env.VITE_TOURNAMENT_BACKEND_ENABLED;
  const isMockConnected = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('auth') === 'mock'
    && isConnectedModeEnabled;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#05070b] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.18),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(220,38,38,0.14),transparent_22%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.05),transparent_35%)]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-4 sm:px-6 sm:py-10">
        <div className="mb-6 flex shrink-0 items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-gray-300 transition-all hover:border-orange-400/40 hover:bg-white/10 hover:text-white"
          >
            <Home className="h-4 w-4" />
            Accueil
          </button>
        </div>

        <main className="mx-auto w-full max-w-3xl text-left">
          <h1 id={titleId} className="text-2xl font-black uppercase tracking-wide text-white">
            Espace joueur
          </h1>
          {!isConnectedModeEnabled ? (
            <div className="mt-5 rounded-2xl border border-white/20 bg-white/5 px-4 py-4 text-sm leading-6 text-gray-300">
              Espace joueur non disponible sur la release 1.1.
            </div>
          ) : !isClerkConfigured && !isMockConnected ? (
            <div className="mt-5 rounded-2xl border border-orange-300/20 bg-orange-500/10 px-4 py-4 text-sm leading-6 text-orange-100">
              Connexion indisponible ici: ajoute `VITE_CLERK_PUBLISHABLE_KEY` pour activer l'espace joueur.
            </div>
          ) : isMockConnected ? (
            <MockPlayerSpacePanel onLaunchTournamentMatch={onLaunchTournamentMatch} />
          ) : (
            <PlayerSpacePanel apiBaseUrl={apiBaseUrl} jwtTemplateName={env.VITE_CLERK_JWT_TEMPLATE_NAME} />
          )}
        </main>
      </div>
    </div>
  );
};

type PlayerSpacePanelProps = {
  apiBaseUrl: string;
  jwtTemplateName: string;
};

type PlayerSpaceSection = 'stats' | 'matches' | 'tournaments' | 'scoring';

const PlayerSpacePanel: React.FC<PlayerSpacePanelProps> = ({ apiBaseUrl, jwtTemplateName }) => {
  const playerAccount = usePlayerAccountSession(apiBaseUrl, jwtTemplateName);
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<PlayerSpaceTab>('overview');
  const [statsMode, setStatsMode] = useState<PlayerStatsMode>('x01');
  const [stats, setStats] = useState<PlayerStats>(() => toPlayerStats(null));
  const [cricketStats, setCricketStats] = useState<CricketStats>(() => toCricketStats(null));
  const [matches, setMatches] = useState<MatchHistory[]>([]);
  const [cricketMatches, setCricketMatches] = useState<MatchHistory[]>([]);
  const [selectedMatchDetail, setSelectedMatchDetail] = useState<MatchDetail | null>(null);
  const [tournaments, setTournaments] = useState<TournamentHistory[]>([]);
  const [scoring, setScoring] = useState<ScoringProfile | null>(null);
  const [scoringForm, setScoringForm] = useState<UpdateScoringProfilePayload>(emptyScoringForm);
  const [sectionErrors, setSectionErrors] = useState<Partial<Record<PlayerSpaceSection, string>>>({});
  const [loadingSections, setLoadingSections] = useState<Partial<Record<PlayerSpaceSection, boolean>>>({});
  const [scoringMessage, setScoringMessage] = useState<string | null>(null);
  const [isMatchDetailLoading, setIsMatchDetailLoading] = useState(false);

  useEffect(() => {
    if (!playerAccount.bootstrap) return;

    const bootstrapStats = toPlayerStats(playerAccount.bootstrap.raw_stats ?? playerAccount.bootstrap.stats);
    const bootstrapMatches = toHistoryList(playerAccount.bootstrap.raw_recent_matches ?? playerAccount.bootstrap.recent_matches, toMatchHistory);
    const bootstrapTournaments = toHistoryList(playerAccount.bootstrap.raw_tournaments ?? playerAccount.bootstrap.tournaments, toTournamentHistory);
    const bootstrapScoring = toScoringProfile(playerAccount.bootstrap.scoring_profile ?? playerAccount.bootstrap.scoring_settings);

    setStats(bootstrapStats);
    setMatches(bootstrapMatches.filter((match) => (match.game_mode ?? 'x01') === 'x01'));
    setCricketMatches(bootstrapMatches.filter((match) => match.game_mode === 'cricket'));
    setTournaments(bootstrapTournaments);
    setScoring(bootstrapScoring);
    setScoringForm(toScoringForm(bootstrapScoring));
  }, [playerAccount.bootstrap]);

  const getApiToken = useCallback(async (options: { skipCache?: boolean } = {}) => {
    const bearerToken = await getToken({ template: jwtTemplateName, skipCache: options.skipCache });
    if (!bearerToken) {
      throw new Error('Session compte active, mais aucun token API disponible.');
    }

    return bearerToken;
  }, [getToken, jwtTemplateName]);

  const markSectionLoading = useCallback((section: PlayerSpaceSection, value: boolean) => {
    setLoadingSections((current) => ({
      ...current,
      [section]: value,
    }));
  }, []);

  const setSectionError = useCallback((section: PlayerSpaceSection, message: string | null) => {
    setSectionErrors((current) => {
      const next = { ...current };
      if (message) {
        next[section] = message;
      } else {
        delete next[section];
      }
      return next;
    });
  }, []);

  const refreshSection = useCallback(async (section: PlayerSpaceSection) => {
    markSectionLoading(section, true);
    setSectionError(section, null);

    try {
      const bearerToken = await getApiToken();

      if (section === 'stats') {
        if (statsMode === 'cricket') {
          setCricketStats(toCricketStats(await fetchPlayerStats(apiBaseUrl, bearerToken, { gameMode: 'cricket' })));
        } else {
          setStats(toPlayerStats(await fetchPlayerStats(apiBaseUrl, bearerToken, { gameMode: 'x01' })));
        }
      } else if (section === 'matches') {
        const page = await fetchPlayerMatches(apiBaseUrl, bearerToken, { limit: 20, offset: 0, gameMode: statsMode });
        const nextMatches = toHistoryList(page.items, toMatchHistory);
        if (statsMode === 'cricket') {
          setCricketMatches(nextMatches);
        } else {
          setMatches(nextMatches);
        }
      } else if (section === 'tournaments') {
        setTournaments(toHistoryList(await fetchPlayerTournaments(apiBaseUrl, bearerToken, { limit: 20, offset: 0 }), toTournamentHistory));
      } else {
        const nextScoring = await fetchPlayerScoringProfile(apiBaseUrl, bearerToken);
        setScoring(nextScoring);
        setScoringForm(toScoringForm(nextScoring));
      }
    } catch (error) {
      setSectionError(section, getApiErrorMessage(error, playerAccountUnavailableMessage));
    } finally {
      markSectionLoading(section, false);
    }
  }, [apiBaseUrl, getApiToken, markSectionLoading, setSectionError, statsMode]);

  const fetchPlayerStatsAndMatchesForMode = useCallback(async (mode: PlayerStatsMode) => {
    const bearerToken = await getApiToken();
    const [statsResult, matchesResult] = await Promise.allSettled([
      fetchPlayerStats(apiBaseUrl, bearerToken, { gameMode: mode }),
      fetchPlayerMatches(apiBaseUrl, bearerToken, { limit: 20, offset: 0, gameMode: mode }),
    ]);

    if (statsResult.status === 'fulfilled') {
      if (mode === 'cricket') {
        setCricketStats(toCricketStats(statsResult.value));
      } else {
        setStats(toPlayerStats(statsResult.value));
      }
    }

    if (matchesResult.status === 'fulfilled') {
      const nextMatches = toHistoryList(matchesResult.value.items, toMatchHistory);
      if (mode === 'cricket') {
        setCricketMatches(nextMatches);
      } else {
        setMatches(nextMatches);
      }
    }
  }, [apiBaseUrl, getApiToken]);

  useEffect(() => {
    if (!playerAccount.isConnected) return;
    void Promise.allSettled([
      fetchPlayerStatsAndMatchesForMode('x01'),
      fetchPlayerStatsAndMatchesForMode('cricket'),
    ]);
  }, [fetchPlayerStatsAndMatchesForMode, playerAccount.isConnected]);

  useEffect(() => {
    if (!playerAccount.isConnected) return;

    const handlePersonalX01Sync = (event: Event) => {
      const records = Array.isArray((event as CustomEvent<unknown>).detail)
        ? (event as CustomEvent<unknown[]>).detail
        : [];
      let consumedBackendStats = false;

      records.forEach((recordValue) => {
        const record = getRecordValue(recordValue);
        if (record?.status !== 'synced') return;

        const response = getRecordValue(record.response);
        const responseStats = response?.stats;
        const responseMatch = response?.match ?? response?.item ?? response?.summary;

        if (responseStats) {
          const statsRecord = getRecordValue(responseStats);
          if (readDisplayString(statsRecord, ['game_mode', 'gameMode']) === 'cricket' || getRecordValue(statsRecord?.cricket)) {
            setCricketStats(toCricketStats(responseStats));
          } else {
            setStats(toPlayerStats(responseStats));
          }
          consumedBackendStats = true;
        }

        if (responseMatch) {
          const match = toMatchHistory(responseMatch, 0);
          if (match.game_mode === 'cricket') {
            setCricketMatches((current) => upsertMatchHistory(current, match));
          } else {
            setMatches((current) => upsertMatchHistory(current, match));
          }
        }
      });

      const refreshes: Array<Promise<void>> = [];
      if (!consumedBackendStats) {
        refreshes.push(fetchPlayerStatsAndMatchesForMode('x01'));
        refreshes.push(fetchPlayerStatsAndMatchesForMode('cricket'));
      }
      if (refreshes.length) {
        void Promise.allSettled(refreshes);
      }
    };

    window.addEventListener('bougnat:personal-x01-sync', handlePersonalX01Sync);
    return () => {
      window.removeEventListener('bougnat:personal-x01-sync', handlePersonalX01Sync);
    };
  }, [fetchPlayerStatsAndMatchesForMode, playerAccount.isConnected]);

  const openMatchDetail = async (match: MatchHistory) => {
    setSectionError('matches', null);
    setIsMatchDetailLoading(true);
    try {
      const bearerToken = await getApiToken();
      const detail = await fetchPlayerMatchDetail(apiBaseUrl, bearerToken, match.id);
      setSelectedMatchDetail(toMatchDetail(detail));
    } catch (error) {
      setSectionError('matches', getApiErrorMessage(error, "On n'arrive pas a charger le detail de ce match pour le moment. Reessaie dans un instant."));
    } finally {
      setIsMatchDetailLoading(false);
    }
  };

  const refreshActiveTab = async () => {
    if (activeTab === 'overview') {
      await playerAccount.refresh();
      return;
    }

    if (activeTab === 'settings') {
      await refreshSection('scoring');
      return;
    }

    await refreshSection(activeTab === 'stats' ? 'stats' : activeTab === 'matches' ? 'matches' : 'tournaments');
  };

  const setScoringField = <K extends keyof UpdateScoringProfilePayload>(field: K, value: UpdateScoringProfilePayload[K]) => {
    setScoringForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const saveScoring = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setScoringMessage(null);
    setSectionError('scoring', null);

    const payload: UpdateScoringProfilePayload = {
      ...scoringForm,
      default_target: Number(scoringForm.default_target),
    };

    if (!Number.isFinite(payload.default_target) || payload.default_target <= 0) {
      setSectionError('scoring', 'La cible par defaut doit etre un nombre positif.');
      return;
    }

    markSectionLoading('scoring', true);

    try {
      const bearerToken = await getApiToken();
      const nextScoring = await updatePlayerScoringProfile(apiBaseUrl, bearerToken, payload);
      setScoring(nextScoring);
      setScoringForm(toScoringForm(nextScoring));
      setScoringMessage('Preferences scoring mises a jour.');
    } catch (error) {
      setSectionError('scoring', getApiErrorMessage(error, "On n'arrive pas a enregistrer tes preferences pour le moment. Reessaie dans un instant."));
    } finally {
      markSectionLoading('scoring', false);
    }
  };

  if (!playerAccount.isClerkLoaded || playerAccount.status === 'loading') {
    return (
      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-6 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-orange-200" />
        <div className="mt-3 text-[11px] font-black uppercase tracking-[0.18em] text-gray-300">Chargement joueur</div>
      </div>
    );
  }

  if (!playerAccount.isClerkSignedIn) {
    return (
      <div className="mt-5 rounded-2xl border border-orange-300/20 bg-orange-500/10 px-4 py-4 text-sm leading-6 text-orange-100">
        Connecte-toi pour ouvrir ton espace joueur.
      </div>
    );
  }

  if (playerAccount.status === 'error') {
    return (
      <div className="mt-5 space-y-3">
        <div className="rounded-2xl border border-orange-300/20 bg-orange-500/10 px-4 py-4 text-sm leading-6 text-orange-100">
          {playerAccount.error || playerAccountUnavailableMessage}
        </div>
        <button type="button" onClick={() => void playerAccount.refresh()} className={authSecondaryButtonClassName}>
          Reessayer
        </button>
      </div>
    );
  }

  const isScoringSaving = Boolean(loadingSections.scoring);
  const displayedMatches = statsMode === 'cricket' ? cricketMatches : matches;
  const recentMatches = displayedMatches.slice(0, 5);
  const recentTournaments = tournaments.slice(0, 3);

  return (
    <div className="mt-5 space-y-4">
      <PlayerSpaceSummary stats={stats} scoring={scoring} />

      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/20 p-1">
        {(['x01', 'cricket'] as PlayerStatsMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setStatsMode(mode)}
            className={`h-10 rounded-xl text-[10px] font-black uppercase tracking-[0.16em] transition-all ${statsMode === mode ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
          >
            {mode === 'x01' ? 'X01' : 'Cricket'}
          </button>
        ))}
      </div>

      {playerAccount.error ? (
        <div className="rounded-2xl border border-orange-300/20 bg-orange-500/10 px-4 py-3 text-sm leading-6 text-orange-100">
          {playerAccount.error}
        </div>
      ) : null}

      <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-black/20 p-1">
        {playerSpaceTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`h-10 shrink-0 rounded-xl px-3 text-[10px] font-black uppercase tracking-[0.14em] transition-all ${
              activeTab === tab.id ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => void refreshActiveTab()}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 text-[10px] font-black uppercase tracking-[0.14em] text-gray-300 transition-colors hover:border-orange-300/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={playerAccount.status === 'submitting'}
      >
        {playerAccount.status === 'submitting' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5 text-orange-200" />}
        Actualiser
      </button>

      {activeTab === 'overview' ? (
        <PlayerOverview
          stats={stats}
          cricketStats={cricketStats}
          mode={statsMode}
          matches={recentMatches}
          tournaments={recentTournaments}
          scoring={scoring}
          onOpenMatchDetail={(match) => void openMatchDetail(match)}
        />
      ) : null}

      {activeTab === 'stats' ? (
        statsMode === 'cricket'
          ? <PlayerCricketStatsPanel stats={cricketStats} error={sectionErrors.stats} isLoading={Boolean(loadingSections.stats)} onRefresh={() => void refreshSection('stats')} />
          : <PlayerStatsPanel stats={stats} error={sectionErrors.stats} isLoading={Boolean(loadingSections.stats)} onRefresh={() => void refreshSection('stats')} />
      ) : null}

      {activeTab === 'matches' ? (
        <PlayerMatchesPanel
          mode={statsMode}
          matches={displayedMatches}
          error={sectionErrors.matches}
          isLoading={Boolean(loadingSections.matches) || isMatchDetailLoading}
          onOpenDetail={(match) => void openMatchDetail(match)}
          onRefresh={() => void refreshSection('matches')}
        />
      ) : null}

      {activeTab === 'tournaments' ? (
        <PlayerTournamentsPanel tournaments={tournaments} error={sectionErrors.tournaments} isLoading={Boolean(loadingSections.tournaments)} onRefresh={() => void refreshSection('tournaments')} />
      ) : null}

      {activeTab === 'settings' ? (
        <div className="space-y-4">
          <ScoringSettingsForm
            scoring={scoring}
            form={scoringForm}
            error={sectionErrors.scoring}
            message={scoringMessage}
            isSaving={isScoringSaving}
            onChange={setScoringField}
            onRefresh={() => void refreshSection('scoring')}
            onSubmit={saveScoring}
          />
        </div>
      ) : null}

      {selectedMatchDetail ? (
        <PlayerMatchDetailModal detail={selectedMatchDetail} onClose={() => setSelectedMatchDetail(null)} />
      ) : null}
    </div>
  );
};

const MockPlayerSpacePanel: React.FC<{
  onLaunchTournamentMatch: (detail: TournamentMatchDetail, bearerToken: string) => void;
}> = ({ onLaunchTournamentMatch }) => {
  const [matches, setMatches] = useState<TournamentMatchSummary[]>([]);
  const [drafts, setDrafts] = useState<TournamentSubmissionRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [nextMatches, nextDrafts] = await Promise.all([
        createMockTournamentScoringClient().listAssignedMatches(),
        new LocalTournamentSubmissionRepository().listDrafts(),
      ]);
      setMatches(nextMatches);
      setDrafts(nextDrafts);
    } catch (refreshError) {
      setError(getApiErrorMessage(refreshError, 'Mock tournoi indisponible.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const launch = async (match: TournamentMatchSummary) => {
    setIsLoading(true);
    setError(null);
    try {
      const detail = await createMockTournamentScoringClient().loadMatch(match.tournamentId, match.matchId);
      onLaunchTournamentMatch(detail, '__mock__');
    } catch (launchError) {
      setError(getApiErrorMessage(launchError, 'Chargement mock impossible.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-5 space-y-4">
      <section className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Session mock dev</div>
        <div className="mt-1 text-xl font-black uppercase tracking-[0.08em] text-white">Joueur connecte mock</div>
        <div className="mt-2 text-sm leading-6 text-gray-400">Parcours connecte prepare pour dev/preprod et smoke E2E.</div>
      </section>
      <TournamentScoringPanel
        matches={matches}
        drafts={drafts}
        error={error}
        isLoading={isLoading}
        onRefresh={() => void refresh()}
        onLaunch={(match) => void launch(match)}
        onRetry={async (draft) => {
          await submitTournamentResultWithLocalDraft(createMockTournamentScoringClient(), new LocalTournamentSubmissionRepository(), draft);
          setDrafts(await new LocalTournamentSubmissionRepository().listDrafts());
        }}
      />
    </div>
  );
};

const TournamentScoringPanel: React.FC<{
  matches: TournamentMatchSummary[];
  drafts: TournamentSubmissionRecord[];
  error: string | null;
  isLoading: boolean;
  onRefresh: () => void;
  onLaunch: (match: TournamentMatchSummary) => void;
  onRetry?: (draft: TournamentSubmissionRecord) => void | Promise<void>;
}> = ({ matches, drafts, error, isLoading, onRefresh, onLaunch, onRetry }) => (
  <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-orange-100">
        <Target className="h-4 w-4" />
        Matchs tournoi a scorer
      </div>
      <button type="button" onClick={onRefresh} className="text-gray-300 transition-colors hover:text-white" aria-label="Rafraichir les matchs tournoi" title="Rafraichir les matchs tournoi">
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
      </button>
    </div>
    {error ? <SectionLocalError message={error} isLoading={isLoading} onRefresh={onRefresh} /> : null}
    {matches.length ? (
      <div className="space-y-3">
        {matches.map((match) => (
          <article key={`${match.tournamentId}:${match.matchId}`} className="rounded-2xl border border-white/10 bg-black/25 px-3 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="break-words text-sm font-black text-white">{match.label}</div>
                <div className="mt-1 break-words text-xs leading-5 text-gray-400">
                  {[match.tournamentName, match.boardLabel, match.formatLabel].filter(Boolean).join(' · ')}
                </div>
                <div className="mt-2 text-xs font-semibold text-gray-300">{match.players.join(' vs ')}</div>
              </div>
              <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.05] px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-gray-300">
                {match.status}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onLaunch(match)}
              disabled={!match.rights.canScore || isLoading}
              className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-3 text-[10px] font-black uppercase tracking-[0.14em] text-white transition-all hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <ChevronRight className="h-4 w-4" />
              Lancer le match
            </button>
          </article>
        ))}
      </div>
    ) : (
      <EmptyPanel title="Aucun match tournoi" body="Les matchs assignes apparaitront ici quand le backend les expose." />
    )}
      {drafts.length ? (
        <div className="space-y-2">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">Soumissions locales</div>
          {drafts.slice(0, 3).map((draft) => (
          <div
            key={draft.idempotencyKey}
            className={`rounded-xl border px-3 py-2 text-xs leading-5 ${getTournamentSubmissionStatusClassName(draft.status)}`}
          >
            <div>
              <span className="font-black uppercase">{tournamentSubmissionStatusLabel[draft.status]}</span>
              {' · '}
              {draft.context.tournamentName || draft.tournamentId}
              {draft.errorMessage ? ` · ${draft.errorMessage}` : ''}
            </div>
            {isTournamentSubmissionRetryable(draft.status) && onRetry ? (
              <button
                type="button"
                onClick={() => void onRetry(draft)}
                disabled={isLoading}
                className="mt-2 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-orange-100 disabled:opacity-60"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                Retry
              </button>
            ) : null}
          </div>
        ))}
      </div>
    ) : null}
  </section>
);

type PlayerSpaceSummaryProps = {
  stats: PlayerStats;
  scoring: ScoringProfile | null;
};

const PlayerSpaceSummary: React.FC<PlayerSpaceSummaryProps> = ({ stats, scoring }) => (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
      <div className="grid grid-cols-2 gap-2">
        <StatTile label="Matchs" value={formatNumber(stats.matches_played)} icon={<BarChart3 className="h-4 w-4" />} />
        <StatTile label="Win rate" value={formatPercent(stats.win_rate)} icon={<Trophy className="h-4 w-4" />} />
        <StatTile label="Moyenne" value={formatNumber(stats.general_average)} icon={<Target className="h-4 w-4" />} />
        <StatTile label="Scoring" value={scoringFormatLabels[scoring?.preferred_format ?? ''] ?? 'Non regle'} icon={<Settings className="h-4 w-4" />} />
      </div>
    </section>
);

const StatTile: React.FC<{ label: string; value: string; icon?: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="min-h-20 rounded-2xl border border-white/10 bg-black/25 px-3 py-3">
    <div className="flex items-center justify-between gap-2 text-orange-200">
      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">{label}</span>
      {icon}
    </div>
    <div className="mt-2 break-words text-lg font-black text-white">{value}</div>
  </div>
);

const EmptyPanel: React.FC<{ title: string; body: string }> = ({ title, body }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-5 text-sm leading-6 text-gray-300">
    <div className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">{title}</div>
    <p className="mt-2 text-gray-400">{body}</p>
  </div>
);

const SectionLocalError: React.FC<{ message?: string; isLoading?: boolean; onRefresh?: () => void }> = ({ message, isLoading, onRefresh }) => (
  <div className="rounded-2xl border border-orange-300/20 bg-orange-500/10 px-4 py-3">
    <div className="text-sm leading-6 text-orange-100">{message}</div>
    {onRefresh ? (
      <button type="button" onClick={onRefresh} className="mt-3 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-orange-100" disabled={isLoading}>
        {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
        Reessayer
      </button>
    ) : null}
  </div>
);

type PlayerOverviewProps = {
  stats: PlayerStats;
  cricketStats: CricketStats;
  mode: PlayerStatsMode;
  matches: MatchHistory[];
  tournaments: TournamentHistory[];
  scoring: ScoringProfile | null;
  onOpenMatchDetail: (match: MatchHistory) => void;
};

const PlayerOverview: React.FC<PlayerOverviewProps> = ({ stats, cricketStats, mode, matches, tournaments, scoring, onOpenMatchDetail }) => (
  <div className="space-y-4">
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-orange-100">
        <BarChart3 className="h-4 w-4" />
        Stats cles
      </div>
      {mode === 'cricket' ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <StatTile label="Matchs" value={formatNumber(cricketStats.matches_played)} />
          <StatTile label="Victoires" value={formatNumber(cricketStats.wins)} />
          <StatTile label="Nuls" value={formatNumber(cricketStats.draws)} />
          <StatTile label="Win rate" value={formatPercent(cricketStats.win_rate)} />
          <StatTile label="MPR" value={formatNumber(cricketStats.cricket.mpr)} />
          <StatTile label="Best MPR" value={formatNumber(cricketStats.cricket.best_mpr)} />
        </div>
      ) : hasStatsActivity(stats) ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <StatTile label="Matchs" value={formatNumber(stats.matches_played)} />
          <StatTile label="Victoires" value={formatNumber(stats.wins)} />
          <StatTile label="Defaites" value={formatNumber(stats.losses)} />
          <StatTile label="Win rate" value={formatPercent(stats.win_rate)} />
          <StatTile label="Moyenne" value={formatNumber(stats.general_average)} />
          <StatTile label="Best avg" value={formatNumber(stats.best_average)} />
          <StatTile label="Checkout" value={formatNumber(stats.best_checkout)} />
        </div>
      ) : (
        <EmptyPanel title="Aucune stat" body="Les statistiques apparaitront apres tes premiers matchs synchronises." />
      )}
    </section>

    <section className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-orange-100">
        <CalendarDays className="h-4 w-4" />
        Activite recente
      </div>
      <div className="mt-4 space-y-3">
        {matches.length ? matches.map((match) => <MatchCard key={match.id} match={match} compact onOpenDetail={onOpenMatchDetail} />) : <EmptyPanel title="Aucun match" body="Tes derniers matchs seront listes ici." />}
        {tournaments.length ? tournaments.map((tournament) => <TournamentCard key={tournament.id} tournament={tournament} compact />) : null}
      </div>
    </section>

    <section className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-orange-100">
        <Settings className="h-4 w-4" />
        Etat scoring
      </div>
      <div className="mt-3 grid gap-2 text-sm text-gray-300">
        <InfoLine label="Format" value={scoringFormatLabels[scoring?.preferred_format ?? ''] ?? 'Non renseigne'} />
        <InfoLine label="Cible" value={scoring?.default_target ? String(scoring.default_target) : 'Non renseignee'} />
        <InfoLine label="Sync" value={syncStateLabels[scoring?.sync_state ?? ''] ?? scoring?.sync_state ?? 'Non renseignee'} />
      </div>
    </section>
  </div>
);

const InfoLine: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-3 rounded-xl bg-black/20 px-3 py-2">
    <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">{label}</span>
    <span className="min-w-0 break-words text-right font-semibold text-gray-200">{value}</span>
  </div>
);

const PlayerStatsPanel: React.FC<{ stats: PlayerStats; error?: string; isLoading: boolean; onRefresh: () => void }> = ({ stats, error, isLoading, onRefresh }) => (
  <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-orange-100">
        <BarChart3 className="h-4 w-4" />
        Stats X01
      </div>
      <button type="button" onClick={onRefresh} className="text-gray-300 transition-colors hover:text-white" aria-label="Rafraichir les stats" title="Rafraichir les stats">
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
      </button>
    </div>
    {error ? <SectionLocalError message={error} isLoading={isLoading} onRefresh={onRefresh} /> : null}
    {hasStatsActivity(stats) ? (
      <>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <StatTile label="Moyenne" value={formatNumber(stats.general_average)} />
          <StatTile label="Best avg" value={formatNumber(stats.best_average)} />
          <StatTile label="Matchs" value={formatNumber(stats.matches_played)} />
          <StatTile label="Win rate" value={formatPercent(stats.win_rate)} />
          <StatTile label="180" value={formatNumber(stats.count_180)} />
          <StatTile label="Best checkout" value={formatNumber(stats.best_checkout)} />
        </div>
        <section className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">Forme recente</div>
              <div className="mt-1 text-xl font-black text-white">{formatPercent(stats.recent_form_rate)}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">Avg 10 derniers</div>
              <div className="mt-1 text-lg font-black text-orange-100">{formatNumber(stats.recent_average)}</div>
            </div>
          </div>
        </section>
        <details className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
          <summary className="cursor-pointer text-[11px] font-black uppercase tracking-[0.16em] text-gray-300">Details</summary>
          <div className="mt-3 grid gap-2 text-sm text-gray-300">
            <InfoLine label="Victoires" value={formatNumber(stats.wins)} />
            <InfoLine label="Defaites" value={formatNumber(stats.losses)} />
            <InfoLine label="Best avg" value={formatNumber(stats.best_average)} />
            <InfoLine label="Avg recent" value={formatNumber(stats.recent_average)} />
            <InfoLine label="180" value={formatNumber(stats.count_180)} />
            <InfoLine label="140+" value={formatNumber(stats.count_140_plus)} />
            <InfoLine label="100+" value={formatNumber(stats.count_100_plus)} />
            <InfoLine label="Checkout %" value={formatPercent(stats.checkout_rate)} />
            <InfoLine label="Forme" value={formatPercent(stats.recent_form_rate)} />
            <InfoLine label="Calcul" value={formatDateLabel(stats.last_calculated_at)} />
          </div>
        </details>
      </>
    ) : (
      <EmptyPanel title="Stats vides" body="Aucune statistique joueur n'est disponible pour le moment." />
    )}
  </section>
);

const PlayerCricketStatsPanel: React.FC<{ stats: CricketStats; error?: string; isLoading: boolean; onRefresh: () => void }> = ({ stats, error, isLoading, onRefresh }) => (
  <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-orange-100">
        <BarChart3 className="h-4 w-4" />
        Stats Cricket
      </div>
      <button type="button" onClick={onRefresh} className="text-gray-300 transition-colors hover:text-white" aria-label="Rafraichir les stats Cricket" title="Rafraichir les stats Cricket">
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
      </button>
    </div>
    {error ? <SectionLocalError message={error} isLoading={isLoading} onRefresh={onRefresh} /> : null}
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <StatTile label="Matchs" value={formatNumber(stats.matches_played)} />
      <StatTile label="Victoires" value={formatNumber(stats.wins)} />
      <StatTile label="Defaites" value={formatNumber(stats.losses)} />
      <StatTile label="Nuls" value={formatNumber(stats.draws)} />
      <StatTile label="Win rate" value={formatPercent(stats.win_rate)} />
      <StatTile label="MPR" value={formatNumber(stats.cricket.mpr)} />
      <StatTile label="Best MPR" value={formatNumber(stats.cricket.best_mpr)} />
      <StatTile label="Recent MPR" value={formatNumber(stats.cricket.recent_mpr)} />
      <StatTile label="Total marks" value={formatNumber(stats.cricket.total_marks)} />
      <StatTile label="Darts" value={formatNumber(stats.cricket.darts_thrown)} />
      <StatTile label="Visits" value={formatNumber(stats.cricket.visits_count)} />
      <StatTile label="Close rate" value={formatPercent(stats.cricket.close_rate)} />
    </div>
    <details className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3" open={hasCricketStatsActivity(stats)}>
      <summary className="cursor-pointer text-[11px] font-black uppercase tracking-[0.16em] text-gray-300">Details Cricket</summary>
      <div className="mt-3 grid gap-2 text-sm text-gray-300">
        <InfoLine label="9 marks" value={formatNumber(stats.cricket.count_9_marks)} />
        <InfoLine label="8 marks" value={formatNumber(stats.cricket.count_8_marks)} />
        <InfoLine label="7 marks" value={formatNumber(stats.cricket.count_7_marks)} />
        <InfoLine label="6+ marks" value={formatNumber(stats.cricket.count_6_plus_marks)} />
        <InfoLine label="Points +" value={formatNumber(stats.cricket.points_scored)} />
        <InfoLine label="Points -" value={formatNumber(stats.cricket.points_allowed)} />
        <InfoLine label="Diff" value={formatNumber(stats.cricket.point_differential)} />
        <InfoLine label="Bull" value={formatNumber(stats.cricket.bull_marks)} />
        <InfoLine label="20 / 19 / 18" value={`${formatNumber(stats.cricket.marks_20)} / ${formatNumber(stats.cricket.marks_19)} / ${formatNumber(stats.cricket.marks_18)}`} />
        <InfoLine label="17 / 16 / 15" value={`${formatNumber(stats.cricket.marks_17)} / ${formatNumber(stats.cricket.marks_16)} / ${formatNumber(stats.cricket.marks_15)}`} />
        <InfoLine label="Forme" value={formatPercent(stats.recent_form_rate)} />
        <InfoLine label="Calcul" value={formatDateLabel(stats.last_calculated_at)} />
      </div>
    </details>
  </section>
);

const PlayerMatchesPanel: React.FC<{
  mode: PlayerStatsMode;
  matches: MatchHistory[];
  error?: string;
  isLoading: boolean;
  onOpenDetail: (match: MatchHistory) => void;
  onRefresh: () => void;
}> = ({ mode, matches, error, isLoading, onOpenDetail, onRefresh }) => (
  <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-orange-100">
        <Target className="h-4 w-4" />
        {mode === 'cricket' ? 'Matchs Cricket recents' : 'Matchs X01 recents'}
      </div>
      <button type="button" onClick={onRefresh} className="text-gray-300 transition-colors hover:text-white" aria-label="Rafraichir les matchs" title="Rafraichir les matchs">
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
      </button>
    </div>
    {error ? <SectionLocalError message={error} isLoading={isLoading} onRefresh={onRefresh} /> : null}
    {!error && (matches.length ? matches.map((match) => <MatchCard key={match.id} match={match} onOpenDetail={onOpenDetail} />) : <EmptyPanel title={mode === 'cricket' ? 'Aucun match Cricket' : 'Aucun match'} body={mode === 'cricket' ? "Aucun match Cricket n'a encore ete synchronise." : "Aucun match recent n'a encore ete synchronise."} />)}
  </section>
);

const MatchCard: React.FC<{ match: MatchHistory; compact?: boolean; onOpenDetail?: (match: MatchHistory) => void }> = ({ match, compact = false, onOpenDetail }) => {
  const isWin = match.result === 'win';
  const isDraw = match.result === 'draw';
  const duration = formatDuration(match.duration_sec);
  const source = match.source === 'personal' ? 'Perso' : match.source === 'tournament' ? 'Tournoi' : '';
  const meta = [source, match.tournament_name, match.stage_name, match.round, formatDateLabel(match.completed_at)].filter(Boolean).join(' · ');
  const isCricket = match.game_mode === 'cricket';
  const resultClassName = isWin
    ? 'bg-emerald-500/15 text-emerald-100'
    : isDraw
      ? 'bg-amber-500/15 text-amber-100'
      : 'bg-red-500/15 text-red-100';

  return (
    <article className="rounded-2xl border border-white/10 bg-black/25 px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${resultClassName}`}>
              {getMatchResultLabel(match.result)}
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">{formatMatchGameLabel(match)}</span>
          </div>
          <div className="mt-2 break-words text-sm font-black text-white">vs {match.opponent_name || 'Adversaire inconnu'}</div>
          <div className="mt-1 break-words text-xs leading-5 text-gray-400">{meta}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xl font-black text-white">{match.player_score}-{match.opponent_score}</div>
          {duration ? <div className="mt-1 text-[10px] font-semibold text-gray-500">{duration}</div> : null}
        </div>
      </div>
      {!compact ? (
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          {isCricket ? (
            <>
              <MiniMetric label="MPR" value={formatNumber(match.cricket?.match_mpr)} />
              <MiniMetric label="Marks" value={formatNumber(match.cricket?.total_marks)} />
              <MiniMetric label="Bull" value={formatNumber(match.cricket?.bull_marks)} />
              <MiniMetric label="9M" value={formatNumber(match.cricket?.count_9_marks)} />
              <MiniMetric label="Pts +" value={formatNumber(match.cricket?.points_scored)} />
              <MiniMetric label="Pts -" value={formatNumber(match.cricket?.points_allowed)} />
            </>
          ) : (
            <>
              <MiniMetric label="Avg" value={formatNumber(match.match_average)} />
              <MiniMetric label="CO" value={formatPercent(match.checkout_rate)} />
              <MiniMetric label="Best" value={formatNumber(match.best_checkout)} />
            </>
          )}
        </div>
      ) : null}
      {onOpenDetail ? (
        <button
          type="button"
          onClick={() => onOpenDetail(match)}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-[10px] font-black uppercase tracking-[0.14em] text-gray-200 transition-all hover:border-orange-300/30 hover:bg-white/[0.07] hover:text-white sm:w-auto"
        >
          <ChevronRight className="h-4 w-4" />
          Detail
        </button>
      ) : null}
    </article>
  );
};

const PlayerMatchDetailModal: React.FC<{ detail: MatchDetail; onClose: () => void }> = ({ detail, onClose }) => {
  const summary = detail.summary;
  const isWin = summary.result === 'win';
  const isCricket = summary.game_mode === 'cricket';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 px-3 py-3 backdrop-blur-sm sm:items-center sm:px-6 sm:py-8" role="dialog" aria-modal="true" aria-labelledby="match-detail-title">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Fermer le detail match" onClick={onClose} />
      <section className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-orange-300/20 bg-[#090b10] shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <div className="border-b border-white/10 bg-orange-500/10 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-100">Detail match</div>
              <h2 id="match-detail-title" className="mt-1 break-words text-lg font-black text-white">vs {summary.opponent_name || 'Adversaire inconnu'}</h2>
              <div className="mt-1 text-xs leading-5 text-orange-100/80">
                {[formatMatchGameLabel(summary), summary.board_label, formatDateLabel(summary.completed_at)].filter(Boolean).join(' · ')}
              </div>
            </div>
            <button type="button" onClick={onClose} className="shrink-0 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-orange-100 transition-colors hover:border-orange-300/30 hover:text-white">
              Fermer
            </button>
          </div>
        </div>
        <div className="min-h-0 overflow-y-auto px-4 py-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatTile label="Resultat" value={isWin ? 'Victoire' : summary.result === 'loss' ? 'Defaite' : summary.result === 'draw' ? 'Nul' : summary.result || 'N/A'} />
            <StatTile label="Score" value={`${summary.player_score}-${summary.opponent_score}`} />
            {isCricket ? (
              <>
                <StatTile label="MPR" value={formatNumber(summary.cricket?.match_mpr)} />
                <StatTile label="Marks" value={formatNumber(summary.cricket?.total_marks)} />
              </>
            ) : (
              <>
                <StatTile label="Avg" value={formatNumber(summary.match_average)} />
                <StatTile label="Checkout" value={formatPercent(summary.checkout_rate)} />
              </>
            )}
          </div>
          <div className="mt-3 overflow-auto rounded-2xl border border-white/10 bg-black/25">
            <table className="w-full min-w-[42rem] border-collapse text-left text-xs">
              <thead className="sticky top-0 bg-black/90 text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">
                {isCricket ? (
                  <tr>
                    <th className="px-3 py-2">Visite</th>
                    <th className="px-3 py-2">Joueur</th>
                    <th className="px-3 py-2">Darts</th>
                    <th className="px-3 py-2">Marks</th>
                    <th className="px-3 py-2">Points</th>
                    <th className="px-3 py-2">Segments</th>
                    <th className="px-3 py-2">Fermes</th>
                    <th className="px-3 py-2">Resume</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-3 py-2">Visite</th>
                    <th className="px-3 py-2">Joueur</th>
                    <th className="px-3 py-2">Score</th>
                    <th className="px-3 py-2">Restant</th>
                    <th className="px-3 py-2">Darts</th>
                    <th className="px-3 py-2">Resume</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {detail.turns.length ? detail.turns.map((turn) => (
                  isCricket ? (
                    <tr key={turn.id ?? `${turn.visit_number}-${turn.participant_name}`} className="border-t border-white/8 text-gray-200">
                      <td className="px-3 py-2 font-black text-gray-100">V{turn.visit_number}</td>
                      <td className="px-3 py-2">{turn.is_player ? 'Moi' : turn.participant_name}</td>
                      <td className="px-3 py-2">{turn.dart_count}</td>
                      <td className="px-3 py-2 font-black">{formatNumber(turn.cricket?.marks_scored)}</td>
                      <td className="px-3 py-2">{formatNumber(turn.cricket?.points_scored ?? turn.points_scored)}</td>
                      <td className="px-3 py-2">{turn.cricket?.segment_hits ? Object.entries(turn.cricket.segment_hits).filter(([, value]) => value > 0).map(([key, value]) => `${key}:${value}`).join(' / ') || '-' : '-'}</td>
                      <td className="px-3 py-2">{turn.cricket?.closed_segments_after?.join(', ') || '-'}</td>
                      <td className="px-3 py-2">{turn.dart_summary || '-'}</td>
                    </tr>
                  ) : (
                    <tr key={turn.id ?? `${turn.set_number}-${turn.leg_number}-${turn.visit_number}-${turn.participant_name}`} className="border-t border-white/8 text-gray-200">
                      <td className="px-3 py-2 font-black text-gray-100">S{turn.set_number} L{turn.leg_number} V{turn.visit_number}</td>
                      <td className="px-3 py-2">{turn.is_player ? 'Moi' : turn.participant_name}</td>
                      <td className="px-3 py-2 font-black">{formatNumber(turn.points_scored)}</td>
                      <td className="px-3 py-2">{turn.remaining_points ?? '-'}</td>
                      <td className="px-3 py-2">{turn.dart_count}</td>
                      <td className="px-3 py-2">
                        {turn.dart_summary || '-'}
                        {turn.checkout_attempt ? <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-100">CO</span> : null}
                      </td>
                    </tr>
                  )
                )) : (
                  <tr>
                    <td className="px-3 py-5 text-center text-gray-400" colSpan={isCricket ? 8 : 6}>Aucune visite disponible pour ce match.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

const MiniMetric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl bg-white/[0.04] px-2 py-2">
    <div className="text-[9px] font-black uppercase tracking-[0.12em] text-gray-500">{label}</div>
    <div className="mt-1 font-black text-gray-100">{value}</div>
  </div>
);

const PlayerTournamentsPanel: React.FC<{ tournaments: TournamentHistory[]; error?: string; isLoading: boolean; onRefresh: () => void }> = ({ tournaments, error, isLoading, onRefresh }) => (
  <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-orange-100">
        <Trophy className="h-4 w-4" />
        Tournois
      </div>
      <button type="button" onClick={onRefresh} className="text-gray-300 transition-colors hover:text-white" aria-label="Rafraichir les tournois" title="Rafraichir les tournois">
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
      </button>
    </div>
    {error ? <SectionLocalError message={error} isLoading={isLoading} onRefresh={onRefresh} /> : null}
    {tournaments.length ? tournaments.map((tournament) => <TournamentCard key={tournament.id} tournament={tournament} />) : <EmptyPanel title="Aucun tournoi" body="Tes tournois apparaitront ici apres synchronisation." />}
  </section>
);

const TournamentCard: React.FC<{ tournament: TournamentHistory; compact?: boolean }> = ({ tournament, compact = false }) => (
  <article className="rounded-2xl border border-white/10 bg-black/25 px-3 py-3">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="break-words text-sm font-black text-white">{tournament.tournament_name}</div>
        <div className="mt-1 break-words text-xs leading-5 text-gray-400">
          {[formatDateLabel(tournament.tournament_date), tournament.category_name, tournament.structure_name].filter(Boolean).join(' · ')}
        </div>
      </div>
      {tournament.final_ranking ? (
        <div className="shrink-0 rounded-xl border border-orange-300/20 bg-orange-500/10 px-3 py-2 text-center">
          <div className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-100">Rang</div>
          <div className="font-black text-white">{tournament.final_ranking}</div>
        </div>
      ) : null}
    </div>
    {!compact ? (
      <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
        <MiniMetric label="Matchs" value={formatNumber(tournament.total_matches)} />
        <MiniMetric label="Wins" value={formatNumber(tournament.wins)} />
        <MiniMetric label="Loss" value={formatNumber(tournament.losses)} />
        <MiniMetric label="Pts" value={formatNumber(tournament.ranking_points)} />
      </div>
    ) : null}
  </article>
);

type ScoringSettingsFormProps = {
  scoring: ScoringProfile | null;
  form: UpdateScoringProfilePayload;
  error?: string;
  message: string | null;
  isSaving: boolean;
  onChange: <K extends keyof UpdateScoringProfilePayload>(field: K, value: UpdateScoringProfilePayload[K]) => void;
  onRefresh: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

const ScoringSettingsForm: React.FC<ScoringSettingsFormProps> = ({ scoring, form, error, message, isSaving, onChange, onRefresh, onSubmit }) => (
  <form className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4" onSubmit={onSubmit}>
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-orange-100">
        <Settings className="h-4 w-4" />
        Preferences scoring
      </div>
      <button type="button" onClick={onRefresh} className="text-gray-300 transition-colors hover:text-white" aria-label="Rafraichir les reglages scoring" title="Rafraichir les reglages scoring">
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
      </button>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      <ProfileTextField label="Cible defaut" value={String(form.default_target)} onChange={(value) => onChange('default_target', Number(value))} disabled={isSaving} inputMode="numeric" />
      <ProfileSelectField label="Format" value={form.preferred_format} options={scoringFormatOptions} onChange={(value) => onChange('preferred_format', value)} disabled={isSaving} />
      <ProfileSelectField label="Theme" value={form.theme_preference} options={themeOptions} onChange={(value) => onChange('theme_preference', value)} disabled={isSaving} />
      <ToggleField label="Son" checked={form.sound_enabled} onChange={(value) => onChange('sound_enabled', value)} disabled={isSaving} icon={<Volume2 className="h-4 w-4" />} />
      <ToggleField label="Voix" checked={form.voice_enabled} onChange={(value) => onChange('voice_enabled', value)} disabled={isSaving} icon={<Mic className="h-4 w-4" />} />
    </div>
    <div className="grid gap-2 text-sm text-gray-300">
      <InfoLine label="Sync" value={syncStateLabels[scoring?.sync_state ?? ''] ?? scoring?.sync_state ?? 'Non renseignee'} />
      <InfoLine label="Derniere" value={formatDateLabel(scoring?.last_sync_at)} />
      {scoring?.sync_error ? <InfoLine label="Erreur" value={scoring.sync_error} /> : null}
    </div>
    {error ? <SectionLocalError message={error} /> : null}
    {message ? <div className="rounded-xl border border-emerald-300/20 bg-emerald-500/10 px-3 py-2 text-xs leading-5 text-emerald-100">{message}</div> : null}
    <button type="submit" className={authPrimaryButtonClassName} disabled={isSaving}>
      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      Enregistrer scoring
    </button>
  </form>
);

const ToggleField: React.FC<{ label: string; checked: boolean; onChange: (value: boolean) => void; disabled: boolean; icon?: React.ReactNode }> = ({ label, checked, onChange, disabled, icon }) => (
  <label className="flex min-h-11 items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/25 px-3">
    <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-200">
      <span className="text-orange-200">{icon}</span>
      {label}
    </span>
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="h-5 w-5 accent-orange-500"
      disabled={disabled}
    />
  </label>
);

type ClerkAccountPanelProps = {
  apiBaseUrl: string;
  jwtTemplateName: string;
  mode: AuthPanelMode;
  setMode: (mode: AuthPanelMode) => void;
};

type AuthFlowStep = 'form' | 'password' | 'verify';
type OAuthStrategyName = 'oauth_google' | 'oauth_apple';

type ClerkFactor = {
  strategy?: string;
  emailAddressId?: string;
  safeIdentifier?: string;
};

type ClerkErrorPayload = {
  errors?: Array<{
    code?: string;
    longMessage?: string;
    message?: string;
  }>;
  message?: string;
};

const getClerkErrorMessage = (error: unknown): string => {
  const payload = error as ClerkErrorPayload;
  const firstError = payload.errors?.[0];
  const code = firstError?.code;

  if (code === 'form_identifier_not_found') return 'Aucun compte trouve avec cet identifiant.';
  if (code === 'form_password_incorrect') return 'Mot de passe incorrect.';
  if (code === 'form_code_incorrect') return 'Code de verification invalide.';
  if (code === 'form_identifier_exists') return 'Cet email ou ce pseudo est deja utilise.';
  if (code === 'form_password_length_too_short') return 'Le mot de passe est trop court.';
  if (code === 'form_password_pwned') return 'Ce mot de passe est trop courant. Choisis-en un autre.';

  return firstError?.longMessage || firstError?.message || payload.message || 'Connexion impossible pour le moment.';
};

const getOAuthRedirectUrls = () => ({
  redirectUrl: `${window.location.origin}/sso-callback`,
  redirectUrlComplete: window.location.origin,
});

const findEmailCodeFactor = (factors: ClerkFactor[] | null | undefined): ClerkFactor | null =>
  factors?.find((factor) => factor.strategy === 'email_code' && factor.emailAddressId) ?? null;

const hasPasswordFactor = (factors: ClerkFactor[] | null | undefined): boolean =>
  Boolean(factors?.some((factor) => factor.strategy === 'password'));

type PlayerAccountSessionHook = ReturnType<typeof usePlayerAccountSession>;

type ConnectedPlayerProfilePanelProps = {
  apiBaseUrl: string;
  jwtTemplateName: string;
  playerAccount: PlayerAccountSessionHook;
};

type ProfileSectionProps = {
  title: string;
  children: React.ReactNode;
};

const ProfileSection: React.FC<ProfileSectionProps> = ({ title, children }) => (
  <section className="border-t border-white/10 pt-5 first:border-t-0 first:pt-0">
    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-100">{title}</h2>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">{children}</div>
  </section>
);

type ProfileTextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  pattern?: string;
  required?: boolean;
};

const ProfileTextField: React.FC<ProfileTextFieldProps> = ({
  label,
  value,
  onChange,
  disabled,
  autoComplete,
  inputMode,
  pattern,
  required,
}) => (
  <label className="space-y-1.5">
    <span className={profileLabelClassName}>{label}</span>
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={profileInputClassName}
      autoComplete={autoComplete}
      inputMode={inputMode}
      pattern={pattern}
      required={required}
      disabled={disabled}
    />
  </label>
);

type ProfileSelectFieldProps<T extends string> = {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  disabled: boolean;
};

const ProfileSelectField = <T extends string,>({
  label,
  value,
  options,
  onChange,
  disabled,
}: ProfileSelectFieldProps<T>) => (
  <label className="space-y-1.5">
    <span className={profileLabelClassName}>{label}</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
      className={profileInputClassName}
      disabled={disabled}
    >
      {options.map((option) => (
        <option key={option.value || 'empty'} value={option.value} className="bg-[#10131a] text-white">
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

const ConnectedPlayerProfilePanel: React.FC<ConnectedPlayerProfilePanelProps> = ({ apiBaseUrl, jwtTemplateName, playerAccount }) => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const profilePhotoInputRef = useRef<HTMLInputElement | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [form, setForm] = useState<UpdatePlayerProfilePayload>(emptyProfileForm);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPhotoSaving, setIsPhotoSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const getApiToken = useCallback(async (options: { skipCache?: boolean } = {}) => {
    const bearerToken = await getToken({ template: jwtTemplateName, skipCache: options.skipCache });
    if (!bearerToken) {
      throw new Error('Session compte active, mais aucun token API disponible.');
    }

    return bearerToken;
  }, [getToken, jwtTemplateName]);

  const requestProfile = useCallback(async (signal?: AbortSignal) => {
    const bearerToken = await getApiToken();
    return fetchPlayerProfile(apiBaseUrl, bearerToken, signal);
  }, [apiBaseUrl, getApiToken]);

  const applyProfile = useCallback((nextProfile: PlayerProfile) => {
    setProfile(nextProfile);
    setForm(toProfileForm(nextProfile));
  }, []);

  const loadProfile = useCallback(async (signal?: AbortSignal) => {
    setIsProfileLoading(true);
    setProfileError(null);
    setProfileMessage(null);

    try {
      const nextProfile = await requestProfile(signal);
      if (!signal?.aborted) {
        applyProfile(nextProfile);
      }
    } catch (error) {
      if (!signal?.aborted) {
        setProfileError(getApiErrorMessage(error, "On n'arrive pas a charger ton profil joueur pour le moment. Tes infos sont conservees, reessaie dans un instant."));
      }
    } finally {
      if (!signal?.aborted) {
        setIsProfileLoading(false);
      }
    }
  }, [applyProfile, requestProfile]);

  useEffect(() => {
    const abortController = new AbortController();
    void loadProfile(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [loadProfile]);

  const setField = <K extends keyof UpdatePlayerProfilePayload>(field: K, value: UpdatePlayerProfilePayload[K]) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const resetForm = () => {
    if (!profile) {
      return;
    }

    setForm(toProfileForm(profile));
    setProfileError(null);
    setProfileMessage(null);
  };

  const submitPlayerProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError(null);
    setProfileMessage(null);

    const payload = buildProfilePayload(form);
    if (!payload.first_name || !payload.last_name) {
      setProfileError('Prenom et nom sont obligatoires.');
      return;
    }

    if (payload.birth_date && !/^\d{2}-\d{2}-\d{4}$/.test(payload.birth_date)) {
      setProfileError('La date de naissance doit rester au format DD-MM-AAAA.');
      return;
    }

    setIsSaving(true);

    try {
      const bearerToken = await getApiToken();
      await updatePlayerProfile(apiBaseUrl, bearerToken, payload);
      const nextProfile = await fetchPlayerProfile(apiBaseUrl, bearerToken);
      applyProfile(nextProfile);
      setProfileMessage('Profil joueur mis a jour.');
    } catch (error) {
      setProfileError(getApiErrorMessage(error, "On n'arrive pas a enregistrer ton profil pour le moment. Tes changements n ont pas ete envoyes."));
    } finally {
      setIsSaving(false);
    }
  };

  const saveProfilePhoto = async (file: File) => {
    setProfileMessage(null);
    setProfileError(null);
    setIsPhotoSaving(true);

    try {
      if (!user) {
        throw new Error('Profil Clerk indisponible pour le moment.');
      }

      await user.setProfileImage({ file });
      const reloadedUser = await user.reload();
      const photoUrl = reloadedUser.imageUrl || user.imageUrl;
      if (!photoUrl) {
        throw new Error('Clerk n a pas retourne de photo de profil.');
      }

      const bearerToken = await getApiToken({ skipCache: true });
      await updatePlayerProfilePhoto(apiBaseUrl, bearerToken, { photo_url: photoUrl });
      const nextProfile = await fetchPlayerProfile(apiBaseUrl, bearerToken);
      applyProfile(nextProfile);
      await playerAccount.refresh({ skipTokenCache: true, keepCurrentStatus: true });
      setProfileMessage('Photo joueur mise a jour.');
    } catch (error) {
      setProfileError(getApiErrorMessage(error, "On n'arrive pas a mettre a jour ta photo pour le moment. Reessaie dans un instant."));
    } finally {
      setIsPhotoSaving(false);
    }
  };

  const handleProfilePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await saveProfilePhoto(file);
    event.target.value = '';
  };

  const isBusy = isProfileLoading || isSaving || isPhotoSaving;
  const displayName = resolveProfileDisplayName(profile, playerAccount.displayName);
  const email = profile?.email || playerAccount.email || '';
  const photoUrl = profile?.photo_url || null;

  if (isProfileLoading && !profile) {
    return (
      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-6 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-orange-200" />
        <div className="mt-3 text-[11px] font-black uppercase tracking-[0.18em] text-gray-300">
          Chargement du profil
        </div>
      </div>
    );
  }

  if (profileError && !profile) {
    return (
      <div className="mt-5 space-y-3">
        <div className="rounded-2xl border border-orange-300/20 bg-orange-500/10 px-4 py-4 text-sm leading-6 text-orange-100">
          {profileError}
        </div>
        <button type="button" onClick={() => void loadProfile()} className={authSecondaryButtonClassName}>
          Reessayer
        </button>
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-4">
      <input
        ref={profilePhotoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => void handleProfilePhotoChange(event)}
      />
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/30 text-orange-200">
              {photoUrl ? (
                <img src={photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="h-8 w-8" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Profil joueur</div>
              <div className="mt-1 truncate text-lg font-black uppercase tracking-[0.1em] text-white">{displayName}</div>
              {email ? <div className="mt-1 break-all text-xs text-gray-400">{email}</div> : null}
              {profile?.club_name ? <div className="mt-1 truncate text-xs text-orange-100">{profile.club_name}</div> : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() => profilePhotoInputRef.current?.click()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-3 text-[10px] font-black uppercase tracking-[0.14em] text-gray-200 transition-all hover:border-orange-300/30 hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto"
            disabled={isBusy}
          >
            {isPhotoSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4 text-orange-200" />}
            Modifier la photo
          </button>
        </div>
      </div>

      <form className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-5" onSubmit={submitPlayerProfile}>
        <ProfileSection title="Identite">
          <ProfileTextField label="Prenom" value={form.first_name} onChange={(value) => setField('first_name', value)} disabled={isBusy} autoComplete="given-name" required />
          <ProfileTextField label="Nom" value={form.last_name} onChange={(value) => setField('last_name', value)} disabled={isBusy} autoComplete="family-name" required />
          <ProfileTextField label="Pseudo" value={form.nickname} onChange={(value) => setField('nickname', value)} disabled={isBusy} autoComplete="nickname" />
          <ProfileTextField label="Nom affiche" value={form.display_name} onChange={(value) => setField('display_name', value)} disabled={isBusy} autoComplete="name" />
          <ProfileTextField label="Date de naissance" value={form.birth_date} onChange={(value) => setField('birth_date', value)} disabled={isBusy} inputMode="numeric" pattern="\\d{2}-\\d{2}-\\d{4}" />
          <ProfileSelectField label="Genre" value={form.gender} options={genderOptions} onChange={(value) => setField('gender', value)} disabled={isBusy} />
        </ProfileSection>

        <ProfileSection title="Contact">
          <label className="space-y-1.5">
            <span className={profileLabelClassName}>Email</span>
            <span className={`${profileReadonlyClassName} break-all`}>{email || 'Non renseigne'}</span>
          </label>
          <ProfileTextField label="Telephone" value={form.phone} onChange={(value) => setField('phone', value)} disabled={isBusy} autoComplete="tel" />
        </ProfileSection>

        <ProfileSection title="Localisation">
          <ProfileTextField label="Pays" value={form.country} onChange={(value) => setField('country', value)} disabled={isBusy} autoComplete="country-name" />
          <ProfileTextField label="Ville" value={form.city} onChange={(value) => setField('city', value)} disabled={isBusy} autoComplete="address-level2" />
          <ProfileTextField label="Adresse" value={form.address} onChange={(value) => setField('address', value)} disabled={isBusy} autoComplete="street-address" />
          <ProfileTextField label="Code postal" value={form.postal_code} onChange={(value) => setField('postal_code', value)} disabled={isBusy} autoComplete="postal-code" />
          <ProfileTextField label="Nationalite" value={form.nationality} onChange={(value) => setField('nationality', value)} disabled={isBusy} autoComplete="country-name" />
        </ProfileSection>

        <ProfileSection title="Darts">
          <ProfileSelectField label="Main dominante" value={form.dominant_hand} options={dominantHandOptions} onChange={(value) => setField('dominant_hand', value)} disabled={isBusy} />
          <ProfileSelectField label="Categorie" value={form.darts_category} options={dartsCategoryOptions} onChange={(value) => setField('darts_category', value)} disabled={isBusy} />
          <ProfileTextField label="Federation" value={form.federation} onChange={(value) => setField('federation', value)} disabled={isBusy} />
          <ProfileTextField label="Numero de licence" value={form.license_number} onChange={(value) => setField('license_number', value)} disabled={isBusy} />
          <label className="space-y-1.5 sm:col-span-2">
            <span className={profileLabelClassName}>Club</span>
            <span className={profileReadonlyClassName}>{profile?.club_name || 'Non renseigne'}</span>
          </label>
        </ProfileSection>

        <ProfileSection title="Confidentialite">
          <label className="flex min-h-11 items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/25 px-3 sm:col-span-2">
            <span className="text-sm font-semibold text-gray-200">Profil public</span>
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={(event) => setField('is_public', event.target.checked)}
              className="h-5 w-5 accent-orange-500"
              disabled={isBusy}
            />
          </label>
        </ProfileSection>

        {profileMessage || profileError ? (
          <div className={`rounded-xl border px-3 py-2 text-xs leading-5 ${
            profileError
              ? 'border-orange-300/20 bg-orange-500/10 text-orange-100'
              : 'border-emerald-300/20 bg-emerald-500/10 text-emerald-100'
          }`}>
            {profileError || profileMessage}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <button type="submit" className={authPrimaryButtonClassName} disabled={isBusy}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Enregistrer
          </button>
          <button type="button" onClick={resetForm} className={authSecondaryButtonClassName} disabled={isBusy || !profile}>
            Annuler
          </button>
        </div>
      </form>

      <Button type="button" variant="secondary" onClick={() => void playerAccount.logout()} className="h-11 w-full rounded-xl">
        Deconnexion
      </Button>
    </div>
  );
};

const ClerkAccountPanel: React.FC<ClerkAccountPanelProps> = ({ apiBaseUrl, jwtTemplateName, mode, setMode }) => {
  const playerAccount = usePlayerAccountSession(apiBaseUrl, jwtTemplateName);
  const signInState = useSignIn();
  const signUpState = useSignUp();
  const [flowStep, setFlowStep] = useState<AuthFlowStep>('form');
  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingEmailAddressId, setPendingEmailAddressId] = useState<string | null>(null);
  const [registerFields, setRegisterFields] = useState({
    firstName: '',
    lastName: '',
    username: '',
    emailAddress: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const authMode = mode === 'register' ? 'register' : 'login';

  useEffect(() => {
    setFlowStep('form');
    setVerificationCode('');
    setPendingEmailAddressId(null);
    setAuthError(null);
  }, [mode]);

  const switchMode = (nextMode: AuthPanelMode) => {
    setMode(nextMode);
  };

  const finalizeSignIn = async (createdSessionId: string | null) => {
    if (!createdSessionId || !signInState.isLoaded) {
      throw new Error('Session Clerk introuvable.');
    }

    await signInState.setActive({ session: createdSessionId });
    await playerAccount.refresh();
  };

  const finalizeSignUp = async (createdSessionId: string | null) => {
    if (!createdSessionId || !signUpState.isLoaded) {
      throw new Error('Session Clerk introuvable.');
    }

    await signUpState.setActive({ session: createdSessionId });
    await playerAccount.refresh();
  };

  const startOAuth = async (strategy: OAuthStrategyName) => {
    setAuthError(null);
    setIsSubmitting(true);

    try {
      const redirectUrls = getOAuthRedirectUrls();
      if (authMode === 'register') {
        if (!signUpState.isLoaded) throw new Error('Clerk charge encore.');
        await signUpState.signUp.authenticateWithRedirect({
          strategy,
          ...redirectUrls,
        });
      } else {
        if (!signInState.isLoaded) throw new Error('Clerk charge encore.');
        await signInState.signIn.authenticateWithRedirect({
          strategy,
          ...redirectUrls,
        });
      }
    } catch (error) {
      setAuthError(getClerkErrorMessage(error));
      setIsSubmitting(false);
    }
  };

  const startLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);

    if (!identifier.trim()) {
      setAuthError('Renseigne ton email ou ton pseudo.');
      return;
    }

    if (!signInState.isLoaded) {
      setAuthError('Clerk charge encore, reessaie dans un instant.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signInState.signIn.create({ identifier: identifier.trim() });

      if (result.status === 'complete') {
        await finalizeSignIn(result.createdSessionId);
        return;
      }

      const firstFactors = result.supportedFirstFactors as ClerkFactor[] | null;
      const emailCodeFactor = findEmailCodeFactor(firstFactors);

      if (emailCodeFactor?.emailAddressId) {
        await signInState.signIn.prepareFirstFactor({
          strategy: 'email_code',
          emailAddressId: emailCodeFactor.emailAddressId,
        });
        setPendingEmailAddressId(emailCodeFactor.emailAddressId);
        setFlowStep('verify');
        return;
      }

      if (hasPasswordFactor(firstFactors)) {
        setFlowStep('password');
        return;
      }

      setAuthError('Cette methode de connexion n est pas encore disponible ici.');
    } catch (error) {
      setAuthError(getClerkErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitLoginPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);

    if (!loginPassword) {
      setAuthError('Renseigne ton mot de passe.');
      return;
    }

    if (!signInState.isLoaded) {
      setAuthError('Clerk charge encore, reessaie dans un instant.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signInState.signIn.attemptFirstFactor({
        strategy: 'password',
        password: loginPassword,
      });

      if (result.status === 'complete') {
        await finalizeSignIn(result.createdSessionId);
        return;
      }

      setAuthError('Verification supplementaire requise. Ce flux arrive bientot dans Bougnat Darts.');
    } catch (error) {
      setAuthError(getClerkErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitLoginCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);

    if (!verificationCode.trim()) {
      setAuthError('Renseigne le code recu par email.');
      return;
    }

    if (!pendingEmailAddressId || !signInState.isLoaded) {
      setAuthError('Verification email indisponible. Recommence la connexion.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signInState.signIn.attemptFirstFactor({
        strategy: 'email_code',
        code: verificationCode.trim(),
      });

      if (result.status === 'complete') {
        await finalizeSignIn(result.createdSessionId);
        return;
      }

      setAuthError('Verification supplementaire requise. Ce flux arrive bientot dans Bougnat Darts.');
    } catch (error) {
      setAuthError(getClerkErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);

    if (!registerFields.username.trim() || !registerFields.emailAddress.trim() || !registerFields.password) {
      setAuthError('Pseudo, email et mot de passe sont obligatoires.');
      return;
    }

    if (!signUpState.isLoaded) {
      setAuthError('Clerk charge encore, reessaie dans un instant.');
      return;
    }

    setIsSubmitting(true);

    try {
      await signUpState.signUp.create({
        username: registerFields.username.trim(),
        emailAddress: registerFields.emailAddress.trim(),
        password: registerFields.password,
        ...(registerFields.firstName.trim() ? { firstName: registerFields.firstName.trim() } : {}),
        ...(registerFields.lastName.trim() ? { lastName: registerFields.lastName.trim() } : {}),
      });
      await signUpState.signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setFlowStep('verify');
    } catch (error) {
      setAuthError(getClerkErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitRegisterCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);

    if (!verificationCode.trim()) {
      setAuthError('Renseigne le code recu par email.');
      return;
    }

    if (!signUpState.isLoaded) {
      setAuthError('Clerk charge encore, reessaie dans un instant.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signUpState.signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      });

      if (result.status === 'complete') {
        await finalizeSignUp(result.createdSessionId);
        return;
      }

      setAuthError('Inscription incomplete. Verifie les champs demandes.');
    } catch (error) {
      setAuthError(getClerkErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (playerAccount.isClerkSignedIn && (playerAccount.status === 'loading' || playerAccount.status === 'submitting')) {
    return (
      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-6 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-orange-200" />
        <div className="mt-3 text-[11px] font-black uppercase tracking-[0.18em] text-gray-300">
          Synchronisation joueur
        </div>
      </div>
    );
  }

  if (playerAccount.isClerkSignedIn && playerAccount.status === 'error') {
    return (
      <div className="mt-5 space-y-3">
        <div className="rounded-2xl border border-orange-300/20 bg-orange-500/10 px-4 py-4">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-100">Espace indisponible</div>
          <div className="mt-2 text-sm leading-6 text-orange-100">
            {playerAccount.error || playerAccountUnavailableMessage}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => void playerAccount.refresh()}
            className={authSecondaryButtonClassName}
          >
            Reessayer
          </button>
          <button
            type="button"
            onClick={() => void playerAccount.logout()}
            className={authSecondaryButtonClassName}
          >
            Deconnexion
          </button>
        </div>
      </div>
    );
  }

  if (playerAccount.isConnected) {
    return (
      <ConnectedPlayerProfilePanel
        apiBaseUrl={apiBaseUrl}
        jwtTemplateName={jwtTemplateName}
        playerAccount={playerAccount}
      />
    );
  }

  const isLoadingClerk = !signInState.isLoaded || !signUpState.isLoaded || playerAccount.status === 'loading';
  const submitLabel = isSubmitting ? 'Patiente...' : flowStep === 'verify' ? 'Verifier' : authMode === 'register' ? 'Creer le compte' : 'Continuer';

  return (
    <div className="mt-5 space-y-4">
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/20 p-1">
        <button
          type="button"
          onClick={() => switchMode('login')}
          className={`h-10 rounded-xl text-[10px] font-black uppercase tracking-[0.16em] transition-all ${authMode === 'login' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
        >
          Connexion
        </button>
        <button
          type="button"
          onClick={() => switchMode('register')}
          className={`h-10 rounded-xl text-[10px] font-black uppercase tracking-[0.16em] transition-all ${authMode === 'register' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
        >
          Inscription
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => void startOAuth('oauth_google')}
          className={authSecondaryButtonClassName}
          disabled={isSubmitting || isLoadingClerk}
        >
          <Globe2 className="h-4 w-4 text-orange-200" />
          Google
        </button>
        <button
          type="button"
          onClick={() => void startOAuth('oauth_apple')}
          className={authSecondaryButtonClassName}
          disabled={isSubmitting || isLoadingClerk}
        >
          <Apple className="h-4 w-4 text-orange-200" />
          Apple
        </button>
      </div>

      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.16em] text-gray-600">
        <span className="h-px flex-1 bg-white/10" />
        <Mail className="h-3.5 w-3.5" />
        Email
        <span className="h-px flex-1 bg-white/10" />
      </div>

      {authMode === 'register' && flowStep === 'form' ? (
        <form className="space-y-3" onSubmit={submitRegister}>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">Prenom</span>
              <input
                value={registerFields.firstName}
                onChange={(event) => setRegisterFields((current) => ({ ...current, firstName: event.target.value }))}
                className={authInputClassName}
                autoComplete="given-name"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">Nom</span>
              <input
                value={registerFields.lastName}
                onChange={(event) => setRegisterFields((current) => ({ ...current, lastName: event.target.value }))}
                className={authInputClassName}
                autoComplete="family-name"
              />
            </label>
          </div>
          <label className="block space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">Pseudo</span>
            <input
              value={registerFields.username}
              onChange={(event) => setRegisterFields((current) => ({ ...current, username: event.target.value }))}
              className={authInputClassName}
              autoComplete="username"
              required
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">Email</span>
            <input
              type="email"
              value={registerFields.emailAddress}
              onChange={(event) => setRegisterFields((current) => ({ ...current, emailAddress: event.target.value }))}
              className={authInputClassName}
              autoComplete="email"
              required
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">Mot de passe</span>
            <input
              type="password"
              value={registerFields.password}
              onChange={(event) => setRegisterFields((current) => ({ ...current, password: event.target.value }))}
              className={authInputClassName}
              autoComplete="new-password"
              required
            />
          </label>
          <div
            id="clerk-captcha"
            data-cl-theme="dark"
            data-cl-size="flexible"
            data-cl-language="fr-FR"
          />
          <button type="submit" className={authPrimaryButtonClassName} disabled={isSubmitting || isLoadingClerk}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitLabel}
          </button>
        </form>
      ) : null}

      {authMode === 'login' && flowStep === 'form' ? (
        <form className="space-y-3" onSubmit={startLogin}>
          <label className="block space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">Email ou pseudo</span>
            <input
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className={authInputClassName}
              autoComplete="username"
              required
            />
          </label>
          <button type="submit" className={authPrimaryButtonClassName} disabled={isSubmitting || isLoadingClerk}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitLabel}
          </button>
        </form>
      ) : null}

      {authMode === 'login' && flowStep === 'password' ? (
        <form className="space-y-3" onSubmit={submitLoginPassword}>
          <label className="block space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">Mot de passe</span>
            <input
              type="password"
              value={loginPassword}
              onChange={(event) => setLoginPassword(event.target.value)}
              className={authInputClassName}
              autoComplete="current-password"
              required
            />
          </label>
          <div className="grid grid-cols-[auto_1fr] gap-3">
            <button type="button" className={authSecondaryButtonClassName} onClick={() => setFlowStep('form')}>
              Retour
            </button>
            <button type="submit" className={authPrimaryButtonClassName} disabled={isSubmitting || isLoadingClerk}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Se connecter
            </button>
          </div>
        </form>
      ) : null}

      {flowStep === 'verify' ? (
        <form className="space-y-3" onSubmit={authMode === 'register' ? submitRegisterCode : submitLoginCode}>
          <label className="block space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">Code email</span>
            <input
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value)}
              className={authInputClassName}
              inputMode="numeric"
              autoComplete="one-time-code"
              required
            />
          </label>
          <div className="grid grid-cols-[auto_1fr] gap-3">
            <button type="button" className={authSecondaryButtonClassName} onClick={() => setFlowStep('form')}>
              Retour
            </button>
            <button type="submit" className={authPrimaryButtonClassName} disabled={isSubmitting || isLoadingClerk}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitLabel}
            </button>
          </div>
        </form>
      ) : null}

      {authError || playerAccount.error ? (
        <div className="rounded-2xl border border-orange-300/20 bg-orange-500/10 px-4 py-3 text-xs leading-5 text-orange-100">
          {authError || playerAccount.error}
        </div>
      ) : null}
    </div>
  );
};

type QrDialogProps = {
  localQrDataUrl: string;
  qrCloseButtonRef: React.RefObject<HTMLButtonElement | null>;
  qrDialogId: string;
  qrUrl: string;
  shareUrl: string;
  shouldUseRuntimeQr: boolean;
  onClose: () => void;
};

const QrDialog: React.FC<QrDialogProps> = ({
  localQrDataUrl,
  qrCloseButtonRef,
  qrDialogId,
  qrUrl,
  shareUrl,
  shouldUseRuntimeQr,
  onClose,
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    }}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={qrDialogId}
      className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-[#0f141d] p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
    >
      <div className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Partager L'App</div>
      <p id={qrDialogId} className="mt-3 text-sm text-gray-300">
        Scanne ce QR code pour ouvrir Bougnat Darts sur ton appareil.
      </p>
      <div className="mt-5 flex justify-center rounded-[1.6rem] bg-white p-4 shadow-[0_18px_40px_rgba(255,255,255,0.08)]">
        <img
          src={shouldUseRuntimeQr && localQrDataUrl ? localQrDataUrl : qrUrl}
          alt="QR code pour ouvrir l'application"
          className="h-48 w-48"
          loading="lazy"
        />
      </div>
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs text-gray-300">
        <a
          href={shareUrl}
          target="_blank"
          rel="noreferrer"
          className="break-all text-orange-300 underline decoration-orange-400/30 underline-offset-4 transition-colors hover:text-orange-200"
        >
          {shareUrl}
        </a>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button
          type="button"
          variant="secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(shareUrl);
            } catch {
              window.open(shareUrl, '_blank', 'noopener,noreferrer');
            }
          }}
          className="h-12 rounded-2xl"
        >
          Copier Le Lien
        </Button>
        <Button
          type="button"
          onClick={() => window.open(shareUrl, '_blank', 'noopener,noreferrer')}
          className="h-12 rounded-2xl"
        >
          Ouvrir
        </Button>
      </div>
      <button
        ref={qrCloseButtonRef}
        type="button"
        onClick={onClose}
        className="mt-5 inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-[11px] font-black uppercase tracking-[0.24em] text-gray-300 transition-colors hover:border-white/20 hover:text-white"
      >
        Fermer
      </button>
    </div>
  </div>
);
