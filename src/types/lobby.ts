export type LobbyGameMode = 'X01' | 'Cricket' | 'Capital' | 'Triathlon';

export interface PlayerProfile {
  id: string;
  username: string;
  avatarUrl: string;
  countryCode: string;
  countryFlag: string;
  rank: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  favoriteMode: LobbyGameMode;
  lastResult: 'win' | 'loss';
}

export interface PlayerStats {
  globalAverage: number;
  bestAverage: number;
  checkoutRate: number;
  totalWins: number;
  total180s: number;
  bestCheckout: number;
  globalWinRate: number;
  winsByMode: Record<LobbyGameMode, number>;
}

export interface MatchHistoryItem {
  id: string;
  mode: LobbyGameMode;
  opponentLabel: string;
  scoreLabel: string;
  playedAt: string;
  result: 'win' | 'loss';
}

export interface FriendStatus {
  id: string;
  username: string;
  avatarUrl: string;
  status: 'online' | 'in_match' | 'idle';
  activity: string;
}

export interface LobbyInvite {
  id: string;
  type: 'incoming' | 'outgoing';
  username: string;
  mode: LobbyGameMode;
  createdAt: string;
}

export interface JoinableLobby {
  id: string;
  host: string;
  mode: LobbyGameMode;
  stakes: string;
  players: string;
  lobbyCode?: string;
  gameConfig?: Record<string, unknown>;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  reward: string;
}

export interface QuickReplaySuggestion {
  title: string;
  description: string;
  cta: string;
}

export interface LobbyData {
  profile: PlayerProfile;
  stats: PlayerStats;
  recentMatches: MatchHistoryItem[];
  friends: FriendStatus[];
  invites: LobbyInvite[];
  joinableLobbies: JoinableLobby[];
  achievements: Achievement[];
  challenges: Challenge[];
  quickReplay: QuickReplaySuggestion;
}
