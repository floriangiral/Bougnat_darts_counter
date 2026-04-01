import { GameConfig, MatchState, Player } from '../types';
import type { LobbyGameMode } from '../src/types/lobby';

export type GameType = 'X01' | 'X01_501_BO5' | 'CRICKET' | 'CAPITAL' | 'TRIATHLON';
export type ArenaGameScreen = 'MATCH' | 'CRICKET_GAME' | 'CAPITAL_GAME' | 'TRIATHLON_GAME';

export type ArenaLobbyConfig = Partial<{
  startingScore: number;
  matchMode: GameConfig['matchMode'];
  legsToWin: number;
  setsToWin: number;
  cricketRounds: NonNullable<GameConfig['cricketRounds']>;
  isDoubles: boolean;
  checkIn: GameConfig['checkIn'];
  checkOut: GameConfig['checkOut'];
  initialStartingPlayerIndex: number;
  initialStartingTeamId: string;
  teamStarterIds: Record<string, string>;
}>;

export interface ArenaEntryPayload {
  mode: LobbyGameMode;
  title?: string;
  stakes?: string;
  players?: string[];
  config?: ArenaLobbyConfig;
}

export interface SharedArenaParticipant {
  id: string;
  username: string;
  role: 'host' | 'guest';
}

const buildArenaTextSource = (title?: string, stakes?: string) =>
  `${title || ''} ${stakes || ''}`.toLowerCase();

export const inferX01ArenaConfig = (
  title?: string,
  stakes?: string,
  fallbackConfig?: ArenaLobbyConfig,
  participantsCount?: number
): ArenaLobbyConfig => {
  if (fallbackConfig && Object.keys(fallbackConfig).length > 0) {
    return fallbackConfig;
  }

  const source = buildArenaTextSource(title, stakes);
  const config: ArenaLobbyConfig = {};

  if (source.includes('170')) config.startingScore = 170;
  else if (source.includes('701')) config.startingScore = 701;
  else if (source.includes('301')) config.startingScore = 301;
  else if (source.includes('1001')) config.startingScore = 1001;
  else config.startingScore = 501;

  config.checkIn = source.includes('double in') ? 'Double' : 'Open';
  config.checkOut = source.includes('master out') ? 'Master' : source.includes('double out') ? 'Double' : 'Open';

  if (source.includes('best of 5') || source.includes('bo5') || source.includes('premier a 3')) {
    config.matchMode = 'LEGS';
    config.legsToWin = 3;
    config.setsToWin = 1;
  }

  if (typeof participantsCount === 'number') {
    config.isDoubles = participantsCount === 4;
  }

  return config;
};

export const resolveArenaGameType = (payload: ArenaEntryPayload): GameType => {
  if (payload.mode === 'Cricket') return 'CRICKET';
  if (payload.mode === 'Capital') return 'CAPITAL';
  if (payload.mode === 'Triathlon') return 'TRIATHLON';

  const config = inferX01ArenaConfig(payload.title, payload.stakes, payload.config);
  const title = buildArenaTextSource(payload.title, payload.stakes);
  const is501Bo5 =
    (config.startingScore === 501 &&
      config.matchMode === 'LEGS' &&
      config.legsToWin === 3 &&
      config.checkOut === 'Double') ||
    (title.includes('501') && (title.includes('best of 5') || title.includes('bo5') || title.includes('premier a 3')));

  return is501Bo5 ? 'X01_501_BO5' : 'X01';
};

export const buildArenaSelectionFromEntry = (payload: ArenaEntryPayload) => ({
  gameType: resolveArenaGameType(payload),
  players: payload.players || [],
  config: payload.mode === 'X01'
    ? inferX01ArenaConfig(payload.title, payload.stakes, payload.config)
    : payload.config,
});

export const getScreenForGameType = (gameType: GameType): ArenaGameScreen =>
  gameType === 'CRICKET'
    ? 'CRICKET_GAME'
    : gameType === 'CAPITAL'
      ? 'CAPITAL_GAME'
      : gameType === 'TRIATHLON'
        ? 'TRIATHLON_GAME'
        : 'MATCH';

export const normalizeSharedArenaConfig = (
  partial?: ArenaLobbyConfig,
  participantsCount?: number
): GameConfig => {
  const inferredDoubles = partial?.isDoubles ?? participantsCount === 4;

  return {
    startingScore: partial?.startingScore ?? 501,
    checkIn: partial?.checkIn ?? 'Open',
    checkOut: partial?.checkOut ?? 'Double',
    matchMode: partial?.matchMode ?? 'LEGS',
    setsToWin: partial?.setsToWin ?? 1,
    legsToWin: partial?.legsToWin ?? 3,
    cricketRounds: partial?.cricketRounds ?? 20,
    isDoubles: inferredDoubles,
    initialStartingPlayerIndex: partial?.initialStartingPlayerIndex,
    initialStartingTeamId: partial?.initialStartingTeamId,
    teamStarterIds: partial?.teamStarterIds,
  };
};

export const buildSharedArenaPlayers = (
  participants: SharedArenaParticipant[],
  config: GameConfig
): Player[] => {
  if (config.isDoubles && participants.length >= 4) {
    return participants.slice(0, 4).map((participant, index) => ({
      id: participant.id,
      name: participant.username,
      teamId: index < 2 ? 'team1' : 'team2',
    }));
  }

  return participants.slice(0, Math.max(2, participants.length)).map((participant) => ({
    id: participant.id,
    name: participant.username,
    teamId: participant.id,
  }));
};

export const buildArenaEntryFromSharedMatch = (
  matchState: MatchState,
  gameType: LobbyGameMode
): ArenaEntryPayload => ({
  mode: gameType,
  players: matchState.players?.map((player) => player.name) || [],
  config: matchState.config,
});
