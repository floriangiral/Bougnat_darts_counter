import { GameType } from '../../../utils/arenaFlow';

export type AnalyticsPayloadValue = string | number | boolean | null | undefined;
export type AnalyticsPayload = Record<string, AnalyticsPayloadValue>;
export type FeatureFlags = Record<string, boolean | string>;

export interface AnalyticsPageView {
  route: string;
  path: string;
}

export const ANALYTICS_EVENT = {
  ScreenView: 'screen_view',
  GameSelected: 'game_selected',
  GameStarted: 'game_started',
  GameFinished: 'game_finished',
} as const;

export const ANALYTICS_FLAG = {
  GameX01: 'game-x01',
  GameCricket: 'game-cricket',
  GameCapital: 'game-capital',
  GameGotcha: 'game-gotcha',
  GameKiller: 'game-killer',
  GameTriathlon: 'game-triathlon',
} as const;

export const flagNameForGameType = (gameType: GameType): string => {
  switch (gameType) {
    case 'CRICKET':
      return ANALYTICS_FLAG.GameCricket;
    case 'CAPITAL':
      return ANALYTICS_FLAG.GameCapital;
    case 'GOTCHA':
      return ANALYTICS_FLAG.GameGotcha;
    case 'KILLER':
      return ANALYTICS_FLAG.GameKiller;
    case 'TRIATHLON':
      return ANALYTICS_FLAG.GameTriathlon;
    case 'X01':
    default:
      return ANALYTICS_FLAG.GameX01;
  }
};

export interface BuildFeatureFlagsInput {
  selectedGameType: GameType;
  screen: string;
  isDoubles: boolean;
  voiceScoringEnabled: boolean;
  appAccessMode: string;
}

export const buildGameFeatureFlags = (input: BuildFeatureFlagsInput): FeatureFlags => ({
  [ANALYTICS_FLAG.GameX01]: input.selectedGameType === 'X01',
  [ANALYTICS_FLAG.GameCricket]: input.selectedGameType === 'CRICKET',
  [ANALYTICS_FLAG.GameCapital]: input.selectedGameType === 'CAPITAL',
  [ANALYTICS_FLAG.GameGotcha]: input.selectedGameType === 'GOTCHA',
  [ANALYTICS_FLAG.GameKiller]: input.selectedGameType === 'KILLER',
  [ANALYTICS_FLAG.GameTriathlon]: input.selectedGameType === 'TRIATHLON',
  screen: input.screen,
  'mode-doubles': input.isDoubles,
  'voice-scoring-enabled': input.voiceScoringEnabled,
  'app-access-mode': input.appAccessMode,
});

const gamePathSegment = (gameType: GameType): string => {
  switch (gameType) {
    case 'CRICKET':
      return 'cricket';
    case 'CAPITAL':
      return 'capital';
    case 'GOTCHA':
      return 'gotcha';
    case 'KILLER':
      return 'killer';
    case 'TRIATHLON':
      return 'triathlon';
    case 'X01':
    default:
      return 'x01';
  }
};

const pageViewForGamePhase = (
  gameType: GameType,
  phase: 'setup' | 'match' | 'stats',
): AnalyticsPageView => {
  const path = `/app/${gamePathSegment(gameType)}/${phase}`;
  return { route: path, path };
};

export const buildAnalyticsPageView = (
  screen: string,
  selectedGameType: GameType,
): AnalyticsPageView => {
  switch (screen) {
    case 'HOME':
      return { route: '/app/home', path: '/app/home' };
    case 'GAME_SELECTION':
      return { route: '/app/games', path: '/app/games' };
    case 'SETUP':
      return pageViewForGamePhase(selectedGameType, 'setup');
    case 'MATCH':
      return pageViewForGamePhase('X01', 'match');
    case 'STATS':
      return pageViewForGamePhase('X01', 'stats');
    case 'CRICKET_GAME':
      return pageViewForGamePhase('CRICKET', 'match');
    case 'CRICKET_STATS':
      return pageViewForGamePhase('CRICKET', 'stats');
    case 'CAPITAL_GAME':
      return pageViewForGamePhase('CAPITAL', 'match');
    case 'CAPITAL_STATS':
      return pageViewForGamePhase('CAPITAL', 'stats');
    case 'KILLER_GAME':
      return pageViewForGamePhase('KILLER', 'match');
    case 'KILLER_STATS':
      return pageViewForGamePhase('KILLER', 'stats');
    case 'GOTCHA_GAME':
      return pageViewForGamePhase('GOTCHA', 'match');
    case 'GOTCHA_STATS':
      return pageViewForGamePhase('GOTCHA', 'stats');
    case 'TRIATHLON_GAME':
      return pageViewForGamePhase('TRIATHLON', 'match');
    case 'TRIATHLON_STATS':
      return pageViewForGamePhase('TRIATHLON', 'stats');
    default: {
      const path = `/app/${screen.toLowerCase()}`;
      return { route: path, path };
    }
  }
};
