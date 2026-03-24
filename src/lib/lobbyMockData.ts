import { getUserProfile } from './userProfile';
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
    rank: 'County Elite',
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
    { id: 'm1', mode: 'X01', opponentLabel: 'vs zedart', scoreLabel: '3 - 1', playedAt: 'Today, 21:12', result: 'win' },
    { id: 'm2', mode: 'Cricket', opponentLabel: 'vs bullforge', scoreLabel: '112 - 96', playedAt: 'Today, 19:48', result: 'loss' },
    { id: 'm3', mode: 'Capital', opponentLabel: 'vs maya_d16', scoreLabel: '142 - 138', playedAt: 'Yesterday, 23:05', result: 'win' },
    { id: 'm4', mode: 'Triathlon', opponentLabel: '3-player lobby', scoreLabel: '2nd place', playedAt: 'Yesterday, 20:31', result: 'loss' },
  ];

  const friends: FriendStatus[] = [
    { id: 'f1', username: 'bullforge', avatarUrl: avatar(1), status: 'online', activity: 'Ready for a 501 set' },
    { id: 'f2', username: 'maya_d16', avatarUrl: avatar(2), status: 'in_match', activity: 'Playing Cricket' },
    { id: 'f3', username: 'triple20tom', avatarUrl: avatar(3), status: 'idle', activity: 'Last seen 12 min ago' },
  ];

  const invites: LobbyInvite[] = [
    { id: 'i1', type: 'incoming', username: 'bullforge', mode: 'Cricket', createdAt: '2 min ago' },
    { id: 'i2', type: 'outgoing', username: 'maya_d16', mode: 'X01', createdAt: '8 min ago' },
  ];

  const joinableLobbies: JoinableLobby[] = [
    { id: 'l1', host: 'zedart', mode: 'X01', stakes: 'Best of 5 · Double Out', players: '1 / 2' },
    { id: 'l2', host: 'club_night', mode: 'Triathlon', stakes: 'Mixed ladder', players: '2 / 4' },
  ];

  const achievements: Achievement[] = [
    { id: 'a1', title: 'Ton Plus Haut Checkout', description: 'Close a leg above 100', progress: 126, maxProgress: 170, unlocked: true },
    { id: 'a2', title: 'Pressure Finisher', description: 'Win 10 matches with 30%+ checkout', progress: 7, maxProgress: 10, unlocked: false },
    { id: 'a3', title: '180 Collector', description: 'Hit 50 maximums in total', progress: 47, maxProgress: 50, unlocked: false },
  ];

  const challenges: Challenge[] = [
    { id: 'c1', title: 'Three Match Warmup', description: 'Play 3 matches today', progress: 1, target: 3, reward: '+120 XP' },
    { id: 'c2', title: 'Big Finish', description: 'Hit a checkout above 80', progress: 0, target: 1, reward: 'Gold badge shard' },
    { id: 'c3', title: 'Cricket Hunter', description: 'Win one Cricket match', progress: 0, target: 1, reward: '+1 daily streak' },
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
      cta: 'Start 501 Rematch',
    },
  };
}

function avatar(seed: number) {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=friend-${seed}&backgroundColor=b6e3f4`;
}
