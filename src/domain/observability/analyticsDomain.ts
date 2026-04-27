import { GameType } from '../../../utils/arenaFlow';

export type AnalyticsPayloadValue = string | number | boolean | null | undefined;
export type AnalyticsPayload = Record<string, AnalyticsPayloadValue>;
export type FeatureFlags = Record<string, boolean | string>;

export const ANALYTICS_EVENT = {
  ScreenView: 'screen_view',
  GameSelected: 'game_selected',
  GameStarted: 'game_started',
  GameFinished: 'game_finished',
} as const;

export const ANALYTICS_FLAG = {
  GameX01: 'game-x01',
  GameX01501BO5: 'game-x01-501-bo5',
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
    case 'X01_501_BO5':
      return ANALYTICS_FLAG.GameX01501BO5;
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
  [ANALYTICS_FLAG.GameX01501BO5]: input.selectedGameType === 'X01_501_BO5',
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
