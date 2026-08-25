import type { MatchState } from '../../types';
import type { RemainingPreview } from '../../src/features/x01/scoring/matchPreview';
import { buildPlayerScoreViewModel } from '../../src/features/x01/scoring/matchPlayerScore';
import { PlayerScore } from './PlayerScore';

type MatchPlayerAreaProps = Readonly<{
  match: MatchState;
  teamId: string;
  remainingPreview: RemainingPreview | null;
  compactMobileBrowser: boolean;
}>;

export function MatchPlayerArea({
  match,
  teamId,
  remainingPreview,
  compactMobileBrowser,
}: MatchPlayerAreaProps) {
  const playerScore = buildPlayerScoreViewModel(match, teamId, remainingPreview);

  return (
    <PlayerScore
      name={playerScore.name}
      subtitle={playerScore.subtitle}
      showMatchStarterBadge={playerScore.showMatchStarterBadge}
      compactMobileBrowser={compactMobileBrowser}
      isActive={playerScore.isActive}
      score={playerScore.score}
      legsWon={playerScore.legsWon}
      setsWon={playerScore.setsWon}
      stats={playerScore.stats}
    />
  );
}
