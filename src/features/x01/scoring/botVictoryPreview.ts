import type { MatchState } from '../../../../types';

type ResolveBotVictoryPreviewParams = {
  previousMatch: MatchState;
  nextMatch: MatchState;
  currentPlayerTeamId: string;
  showWinnerScreen: boolean;
};

type BotVictoryPreviewResolution = {
  hasBotWonLeg: boolean;
  hasBotWonMatch: boolean;
  previewKind: 'leg' | 'match' | null;
};

export const resolveBotVictoryPreview = ({
  previousMatch,
  nextMatch,
  currentPlayerTeamId,
  showWinnerScreen,
}: ResolveBotVictoryPreviewParams): BotVictoryPreviewResolution => {
  const advancedToNextLeg =
    !showWinnerScreen
    && nextMatch.completedLegs.length > previousMatch.completedLegs.length
    && nextMatch.currentLeg.history.length === 0;
  const completedLeg = advancedToNextLeg
    ? nextMatch.completedLegs[nextMatch.completedLegs.length - 1]
    : null;
  const hasBotWonMatch = showWinnerScreen && nextMatch.matchWinnerId === currentPlayerTeamId;
  const hasBotWonLeg = advancedToNextLeg && completedLeg?.winnerId === currentPlayerTeamId;

  return {
    hasBotWonLeg,
    hasBotWonMatch,
    previewKind: hasBotWonMatch ? 'match' : hasBotWonLeg ? 'leg' : null,
  };
};