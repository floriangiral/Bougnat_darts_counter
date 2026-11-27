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
  /** X01 simple à 3 ou 4 joueurs : repère « D » du joueur qui a lancé le match, à côté du n° d'ordre. */
  showStarterMark?: boolean;
  /** Réserve la place du finish conseillé sur toutes les cartes (places fixes : rien ne saute au changement de joueur). */
  reserveBelowScore?: boolean;
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
  showStarterMark = false,
  reserveBelowScore = false,
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
      starterMark={showStarterMark && playerScore.isMatchStarter}
      reserveBelowScore={reserveBelowScore}
      stats={playerScore.stats}
    />
  );
}
