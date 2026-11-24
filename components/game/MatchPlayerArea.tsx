import type { ReactNode } from 'react';
import type { MatchState } from '../../types';
import type { RemainingPreview } from '../../src/features/x01/scoring/matchPreview';
import { buildPlayerScoreViewModel } from '../../src/features/x01/scoring/matchPlayerScore';
import { PlayerScore } from './PlayerScore';

type MatchPlayerAreaProps = Readonly<{
  match: MatchState;
  teamId: string;
  remainingPreview: RemainingPreview | null;
  compactMobileBrowser: boolean;
  showMatchCounters?: boolean;
  reserveStatusPillSpace?: boolean;
  nameMaxFontPx?: number;
  fitNameToRow?: boolean;
  belowScore?: ReactNode;
}>;

export function MatchPlayerArea({
  match,
  teamId,
  remainingPreview,
  compactMobileBrowser,
  showMatchCounters,
  reserveStatusPillSpace,
  nameMaxFontPx,
  fitNameToRow,
  belowScore,
}: MatchPlayerAreaProps) {
  const playerScore = buildPlayerScoreViewModel(match, teamId, remainingPreview);

  return (
    <PlayerScore
      name={playerScore.name}
      subtitle={playerScore.subtitle}
      showMatchStarterBadge={playerScore.showMatchStarterBadge}
      badgeLabel={playerScore.badgeLabel}
      badgeTitle={playerScore.badgeTitle}
      openingStatus={playerScore.openingStatus}
      compactMobileBrowser={compactMobileBrowser}
      isActive={playerScore.isActive}
      score={playerScore.score}
      legsWon={playerScore.legsWon}
      setsWon={playerScore.setsWon}
      isSetsMode={match.config.matchMode === 'SETS'}
      showMatchCounters={showMatchCounters}
      reserveStatusPillSpace={reserveStatusPillSpace}
      nameMaxFontPx={nameMaxFontPx}
      fitNameToRow={fitNameToRow}
      belowScore={playerScore.isActive ? belowScore : undefined}
      stats={playerScore.stats}
    />
  );
}
