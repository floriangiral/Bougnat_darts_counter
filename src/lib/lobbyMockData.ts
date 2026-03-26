import { getAvatarUrl, getUserProfile } from './userProfile';
import type {
  Achievement,
  Challenge,
  FriendStatus,
  JoinableLobby,
  LobbyData,
  LobbyInvite,
  MatchHistoryItem,
  PlayerProfile,
  PlayerStats,
} from '../types/lobby';

export function buildLobbyData(user: any): LobbyData {
  const { username, avatarUrl, countryCode, countryFlag } = getUserProfile(user);

  const profile: PlayerProfile = {
    id: user?.id || 'local-player',
    username,
    avatarUrl,
    countryCode,
    countryFlag,
    rank: 'Elite Regionale',
    level: 18,
    xp: 1460,
    xpToNextLevel: 1800,
    favoriteMode: 'X01',
    lastResult: 'win',
  };

  const stats: PlayerStats = {
    globalAverage: 58.7,
    bestAverage: 72.3,
    checkoutRate: 34,
    totalWins: 128,
    total180s: 47,
    bestCheckout: 126,
    globalWinRate: 61,
    winsByMode: {
      X01: 74,
      Cricket: 31,
      Capital: 11,
      Triathlon: 5,
      Randomizer: 7,
    },
  };

  const recentMatches: MatchHistoryItem[] = [
    { id: 'm1', mode: 'X01', opponentLabel: 'vs zedart', scoreLabel: '3 - 1', playedAt: 'Aujourd\'hui, 21:12', result: 'win' },
    { id: 'm2', mode: 'Cricket', opponentLabel: 'vs bullforge', scoreLabel: '112 - 96', playedAt: 'Aujourd\'hui, 19:48', result: 'loss' },
    { id: 'm3', mode: 'Capital', opponentLabel: 'vs maya_d16', scoreLabel: '142 - 138', playedAt: 'Hier, 23:05', result: 'win' },
    { id: 'm4', mode: 'Triathlon', opponentLabel: 'Lobby a 3 joueurs', scoreLabel: '2e place', playedAt: 'Hier, 20:31', result: 'loss' },
  ];

  const friends: FriendStatus[] = [
    { id: 'f1', username: 'bullforge', avatarUrl: avatar(1), status: 'online', activity: 'Pret pour un 501' },
    { id: 'f2', username: 'maya_d16', avatarUrl: avatar(2), status: 'in_match', activity: 'Joue en Cricket' },
    { id: 'f3', username: 'triple20tom', avatarUrl: avatar(3), status: 'idle', activity: 'Vu il y a 12 min' },
  ];

  const invites: LobbyInvite[] = [
    { id: 'i1', type: 'incoming', username: 'bullforge', mode: 'Cricket', createdAt: '2 min ago' },
    { id: 'i2', type: 'outgoing', username: 'maya_d16', mode: 'X01', createdAt: '8 min ago' },
  ];

  const joinableLobbies: JoinableLobby[] = [
    { id: 'l1', host: 'zedart', mode: 'X01', stakes: 'BO5 · Double Out', players: '1 / 2' },
    { id: 'l2', host: 'club_night', mode: 'Triathlon', stakes: 'Ladder mixte', players: '2 / 4' },
  ];

  const achievements: Achievement[] = [
    { id: 'a1', title: 'Ton Plus Haut Checkout', description: 'Finir une manche au-dessus de 100', progress: 126, maxProgress: 170, unlocked: true },
    { id: 'a2', title: 'Finisseur Sous Pression', description: 'Gagner 10 matchs avec 30%+ de checkout', progress: 7, maxProgress: 10, unlocked: false },
    { id: 'a3', title: 'Collectionneur de 180', description: 'Atteindre 50 scores max au total', progress: 47, maxProgress: 50, unlocked: false },
  ];

  const challenges: Challenge[] = [
    { id: 'c1', title: 'Echauffement en 3 Matchs', description: 'Jouer 3 matchs aujourd\'hui', progress: 1, target: 3, reward: '+120 XP' },
    { id: 'c2', title: 'Gros Finish', description: 'Reussir un checkout au-dessus de 80', progress: 0, target: 1, reward: 'Eclat de badge or' },
    { id: 'c3', title: 'Chasseur de Cricket', description: 'Gagner un match de Cricket', progress: 0, target: 1, reward: '+1 serie quotidienne' },
  ];

  return {
    profile,
    stats,
    recentMatches,
    friends,
    invites,
    joinableLobbies,
    achievements,
    challenges,
    quickReplay: {
      title: 'Relancer un 501',
      description: 'Ton dernier mode joue et ton meilleur ratio de victoire cette semaine.',
      cta: 'Relancer un 501',
    },
  };
}

function avatar(seed: number) {
  return getAvatarUrl(`toon-head-${String(seed).padStart(3, '0')}`);
}
