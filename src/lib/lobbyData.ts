import {
  ensurePlayerProfile,
  fetchActiveChallengesWithProgress,
  fetchJoinableLobbies,
  fetchLobbyFriends,
  fetchLobbyInvites,
  fetchPlayerAchievements,
  fetchPlayerProfileRow,
  fetchUserMatches,
  syncPlayerLobbyProfile,
  upsertPlayerPresence,
} from '../../lib/supabase';
import type { MatchState } from '../../types';
import type {
  Achievement,
  Challenge,
  LobbyData,
  LobbyGameMode,
  MatchHistoryItem,
  PlayerProfile,
  PlayerStats,
  QuickReplaySuggestion,
} from '../types/lobby';
import { getUserProfile } from './userProfile';

interface MatchRecord {
  id: string;
  created_at: string;
  game_type: string;
  winner_id: string;
  game_name?: string;
  is_win?: boolean;
  average?: number;
  checkout_rate?: number;
  highest_checkout?: number;
  count_180?: number;
  total_points?: number;
  total_darts?: number;
  score_for?: number;
  score_against?: number;
  opponent_label?: string;
  game_data: MatchState & { gameName?: string };
}

const LOBBY_MODES: LobbyGameMode[] = ['X01', 'Cricket', 'Capital', 'Triathlon'];

export async function fetchLobbyData(user: any): Promise<LobbyData> {
  await ensurePlayerProfile(user);

  const [profileRow, matches, friends, invites, joinableLobbies, achievementRows, activeChallenges] = await Promise.all([
    fetchPlayerProfileRow(user?.id),
    fetchUserMatches(user?.id),
    fetchLobbyFriends(user?.id),
    fetchLobbyInvites(user?.id),
    fetchJoinableLobbies(),
    fetchPlayerAchievements(user?.id),
    fetchActiveChallengesWithProgress(user?.id),
  ]);

  void upsertPlayerPresence(user?.id, {
    availability: 'online',
    activity_text: 'Dans le lobby',
    current_mode: null,
  });

  const records = (matches as MatchRecord[]) || [];
  const currentProfile = getUserProfile({
    ...user,
    user_metadata: {
      ...(user?.user_metadata || {}),
      username: profileRow?.username || user?.user_metadata?.username,
      avatar_seed: profileRow?.avatar_seed || user?.user_metadata?.avatar_seed,
      country_code: profileRow?.country_code || user?.user_metadata?.country_code,
    },
  });
  const { username, avatarUrl, countryCode, countryFlag } = currentProfile;

  const statsAccumulator = createStatsAccumulator();
  const modeTotals = createModeRecord(0);
  const modeWins = createModeRecord(0);

  records.forEach((record) => {
    const mode = resolveLobbyMode(record);
    modeTotals[mode] += 1;

    const didWin = didUserWin(record);
    if (didWin) {
      modeWins[mode] += 1;
      statsAccumulator.totalWins += 1;
    }

    if (typeof record.total_points === 'number') statsAccumulator.totalScore += record.total_points;
    if (typeof record.total_darts === 'number') statsAccumulator.totalDarts += record.total_darts;

    if (typeof record.average === 'number' && record.average > statsAccumulator.bestAverage) {
      statsAccumulator.bestAverage = record.average;
    }

    statsAccumulator.total180s += record.count_180 || 0;
    statsAccumulator.bestCheckout = Math.max(statsAccumulator.bestCheckout, record.highest_checkout || 0);
    if (typeof record.checkout_rate === 'number') {
      statsAccumulator.totalCheckoutAttempts += 100;
      statsAccumulator.totalCheckoutMinimum += record.checkout_rate;
    }
  });

  const totalMatches = records.length;
  const globalAverage = statsAccumulator.totalDarts > 0 ? (statsAccumulator.totalScore / statsAccumulator.totalDarts) * 3 : 0;
  const checkoutRate =
    statsAccumulator.totalCheckoutAttempts > 0
      ? Math.round((statsAccumulator.totalCheckoutMinimum / statsAccumulator.totalCheckoutAttempts) * 100)
      : 0;
  const globalWinRate = totalMatches > 0 ? Math.round((statsAccumulator.totalWins / totalMatches) * 100) : 0;

  const stats: PlayerStats = {
    globalAverage,
    bestAverage: statsAccumulator.bestAverage,
    checkoutRate,
    totalWins: statsAccumulator.totalWins,
    total180s: statsAccumulator.total180s,
    bestCheckout: statsAccumulator.bestCheckout,
    globalWinRate,
    winsByMode: createModeRecord(0),
  };

  LOBBY_MODES.forEach((mode) => {
    stats.winsByMode[mode] = modeTotals[mode] > 0 ? Math.round((modeWins[mode] / modeTotals[mode]) * 100) : 0;
  });

  const xp = totalMatches * 35 + stats.totalWins * 55 + stats.total180s * 25 + stats.bestCheckout * 2;
  const level = Math.max(1, Math.floor(xp / 250) + 1);
  const previousThreshold = (level - 1) * 250;
  const nextThreshold = level * 250;
  const xpIntoLevel = xp - previousThreshold;
  const xpToNextLevel = nextThreshold - previousThreshold;
  const favoriteMode = getFavoriteMode(modeTotals);
  const lastResult: 'win' | 'loss' = records.length === 0 ? 'win' : didUserWin(records[0]) ? 'win' : 'loss';

  const derivedProfile: PlayerProfile = {
    id: user?.id || 'local-player',
    username,
    avatarUrl,
    countryCode,
    countryFlag,
    rank: getRankFromLevel(level),
    level,
    xp: xpIntoLevel,
    xpToNextLevel,
    favoriteMode,
    lastResult,
  };

  const recentMatches = records.slice(0, 6).map(toRecentMatchItem);
  const achievements = achievementRows.length > 0 ? mapAchievementRows(achievementRows) : buildAchievements(stats, totalMatches);
  const challenges = activeChallenges.length > 0 ? mapChallengeRows(activeChallenges) : buildChallenges(records, stats);
  const quickReplay = buildQuickReplay(records, favoriteMode);

  void syncPlayerLobbyProfile(user?.id, {
    rank: derivedProfile.rank,
    level: derivedProfile.level,
    xp: xp,
    favorite_mode: derivedProfile.favoriteMode,
  });

  return {
    profile: derivedProfile,
    stats,
    recentMatches,
    friends,
    invites: invites.map((invite: any) => ({
      ...invite,
      createdAt: formatRelativeDate(invite.createdAt),
    })),
    joinableLobbies,
    achievements,
    challenges,
    quickReplay,
  };
}

function createStatsAccumulator() {
  return {
    totalWins: 0,
    totalScore: 0,
    totalDarts: 0,
    bestAverage: 0,
    total180s: 0,
    bestCheckout: 0,
    totalCheckoutAttempts: 0,
    totalCheckoutMinimum: 0,
  };
}

function createModeRecord(value: number): Record<LobbyGameMode, number> {
  return {
    X01: value,
    Cricket: value,
    Capital: value,
    Triathlon: value,
  };
}

function resolveLobbyMode(record: MatchRecord): LobbyGameMode {
  const raw = String(record.game_name || record.game_data?.gameName || record.game_type || '').toLowerCase();
  if (raw.includes('cricket')) return 'Cricket';
  if (raw.includes('capital')) return 'Capital';
  if (raw.includes('triathlon')) return 'Triathlon';
  return 'X01';
}

function didUserWin(record: MatchRecord): boolean {
  if (typeof record.is_win === 'boolean') return record.is_win;
  return record.game_data?.players?.[0]?.teamId === record.winner_id;
}

function getFavoriteMode(modeTotals: Record<LobbyGameMode, number>): LobbyGameMode {
  return LOBBY_MODES.reduce((best, mode) => (modeTotals[mode] > modeTotals[best] ? mode : best), 'X01');
}

function getRankFromLevel(level: number) {
  if (level >= 30) return 'Maitre de l\'Arena';
  if (level >= 22) return 'Specialiste du Board';
  if (level >= 15) return 'Elite Regionale';
  if (level >= 8) return 'Pretendant de Ligue';
  return 'Escouade d\'Entrainement';
}

function toRecentMatchItem(record: MatchRecord): MatchHistoryItem {
  const match = record.game_data;
  const players = match?.players || [];
  const playerNames = players.map((player) => player.name);
  const opponentLabel =
    record.opponent_label ||
    (playerNames.length <= 1
      ? 'Session solo'
      : playerNames.length === 2
        ? `vs ${playerNames[1]}`
        : `Table de ${playerNames.length} joueurs`);

  const scoreLabel =
    typeof record.score_for === 'number' || typeof record.score_against === 'number'
      ? `${record.score_for ?? '-'} - ${record.score_against ?? '-'}`
      : buildLegacyScoreLabel(record);

  return {
    id: record.id,
    mode: resolveLobbyMode(record),
    opponentLabel,
    scoreLabel,
    playedAt: formatRelativeDate(record.created_at),
    result: didUserWin(record) ? 'win' : 'loss',
  };
}

function buildLegacyScoreLabel(record: MatchRecord) {
  const match = record.game_data;
  if (!match?.players?.length) return 'Session';
  const teamOne = match.players[0]?.teamId;
  const teamTwo = match.players.find((player) => player.teamId !== teamOne)?.teamId;
  return match.config?.matchMode === 'SETS'
    ? `${match.setsWon?.[teamOne] ?? 0} - ${teamTwo ? match.setsWon?.[teamTwo] ?? 0 : 0}`
    : `${match.legsWon?.[teamOne] ?? 0} - ${teamTwo ? match.legsWon?.[teamTwo] ?? 0 : 0}`;
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'A l\'instant';
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return 'Hier';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function buildAchievements(stats: PlayerStats, totalMatches: number): Achievement[] {
  return [
    {
      id: 'highest-checkout',
      title: 'Gros Checkout',
      description: 'Pousse ton meilleur finish vers le plafond mythique de 170.',
      progress: stats.bestCheckout,
      maxProgress: 170,
      unlocked: stats.bestCheckout >= 100,
    },
    {
      id: 'match-winner',
      title: 'Gagne-Match',
      description: 'Construis ton total de victoires sur tous les matchs enregistres.',
      progress: stats.totalWins,
      maxProgress: 50,
      unlocked: stats.totalWins >= 50,
    },
    {
      id: 'maximum-hunter',
      title: 'Chasseur de 180',
      description: 'Enchaine les scores max pour entrer dans une vraie forme d\'elite.',
      progress: stats.total180s,
      maxProgress: 25,
      unlocked: stats.total180s >= 25,
    },
    {
      id: 'grind-setter',
      title: 'Habitude du Board',
      description: 'Continue d\'enregistrer des matchs pour construire un vrai volume.',
      progress: totalMatches,
      maxProgress: 30,
      unlocked: totalMatches >= 30,
    },
  ];
}

function mapAchievementRows(rows: any[]): Achievement[] {
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    progress: row.progress,
    maxProgress: row.max_progress,
    unlocked: Boolean(row.unlocked_at),
  }));
}

function buildChallenges(records: MatchRecord[], stats: PlayerStats): Challenge[] {
  const todayMatches = records.filter((record) => isSameLocalDay(record.created_at, new Date())).length;
  const hasCheckout80 = stats.bestCheckout >= 80 ? 1 : 0;
  const cricketWin = records.some((record) => resolveLobbyMode(record) === 'Cricket' && didUserWin(record)) ? 1 : 0;

  return [
    {
      id: 'play-three-today',
      title: 'Echauffement en 3 Matchs',
      description: 'Joue 3 matchs enregistres aujourd\'hui.',
      progress: todayMatches,
      target: 3,
      reward: '+120 XP',
    },
    {
      id: 'checkout-80',
      title: 'Gros Finish',
      description: 'Reussis un checkout au-dessus de 80 dans ton historique suivi.',
      progress: hasCheckout80,
      target: 1,
      reward: 'Finisher badge',
    },
    {
      id: 'cricket-win',
      title: 'Chasseur de Cricket',
      description: 'Gagne un match de Cricket.',
      progress: cricketWin,
      target: 1,
      reward: '+1 streak',
    },
  ];
}

function mapChallengeRows(rows: Array<{ challenge: any; progress: any }>): Challenge[] {
  return rows.map(({ challenge, progress }) => ({
    id: challenge.id,
    title: challenge.title,
    description: challenge.description,
    progress: progress?.progress || 0,
    target: challenge.target,
    reward: challenge.reward,
  }));
}

function buildQuickReplay(records: MatchRecord[], favoriteMode: LobbyGameMode): QuickReplaySuggestion {
  const latestMode = records[0] ? resolveLobbyMode(records[0]) : favoriteMode;

  if (latestMode === 'Cricket') {
    return {
      title: 'Relancer un Cricket',
      description: 'Ton dernier match enregistre etait un Cricket. Replonge directement dans les marques et le scoring sous pression.',
      cta: 'Relancer un Cricket',
    };
  }

  return {
    title: 'Relancer un 501',
    description: 'Reviens au format competitif le plus rapide et reprends sur le rythme de score de tes dernieres parties.',
    cta: 'Relancer un 501',
  };
}

function isSameLocalDay(value: string, now: Date) {
  const date = new Date(value);
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}
