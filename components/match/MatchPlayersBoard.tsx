import type { CSSProperties } from 'react';
import type { MatchState } from '../../types';
import type { RemainingPreview } from '../../src/features/x01/scoring/matchPreview';
import { CheckoutHint } from '../game/CheckoutHint';
import { MatchPlayerArea } from '../game/MatchPlayerArea';
import { MatchStatusPill } from './MatchStatusPill';

type MatchPlayersBoardProps = Readonly<{
  match: MatchState;
  remainingPreview: RemainingPreview | null;
  compactMobileBrowser: boolean;
  /** Arène, téléphone paysage et tablette portrait tactiles : joueur actif dominant, compteurs par carte (spec 072). */
  splitLayout: boolean;
  /** Arène et tablette portrait : nom du joueur actif 40-56 px ; le téléphone paysage reste plus compact. */
  largeActive?: boolean;
  /** Tablette portrait : noms et scores grandissent avec l'écran (rangée du nom dimensionnée en CSS). */
  scaleWithScreen?: boolean;
  showHints: boolean;
}>;

/** Emplacements fixes du duel (gauche, droite) : clés stables même quand un camp manque. */
const DUEL_SLOT_KEYS = ['left', 'right'] as const;

type PlayerCell = Readonly<{ slotKey: string; teamId: string | null }>;

const getCellSeparator = (isDuel: boolean, index: number) => {
  if (isDuel) return index === 0 ? 'border-r border-border/50' : '';
  return `${index % 2 === 0 ? 'border-r' : ''} ${index < 2 ? 'border-b' : ''} border-border/50`;
};

const getNameMaxFontPx = (splitLayout: boolean, largeActive: boolean, isActive: boolean, scaleWithScreen: boolean) => {
  // Plafonds hauts : la rangée du nom (clamp sur la hauteur d'écran, x01.css) borne la taille réelle.
  if (scaleWithScreen) return isActive ? 112 : 72;
  if (!splitLayout) return 44;
  if (isActive) return largeActive ? 56 : 32;
  return largeActive ? 32 : 24;
};

const getMatchTeamIds = (match: MatchState): string[] =>
  Array.from(new Set(match.players.map((player) => player.teamId)));

/**
 * Place visuelle (propriété CSS `order`) d'une carte de la grille (3 ou 4 joueurs, ordre de passage = ordre
 * des équipes) selon son écart `offset` au joueur actif (0 = actif, 1 = suivant, count − 1 = précédent).
 * Le jeu tourne dans le sens anti-horaire. Joueur actif en haut : rangée du bas de gauche à droite du suivant
 * au précédent. Grille 2 × 2 depuis l'actif en haut à gauche : suivant en bas à gauche, puis en bas à droite,
 * précédent en haut à droite.
 */
const getGridSeatOrder = (offset: number, count: number, splitLayout: boolean): number => {
  if (offset === 0 || splitLayout) return offset;
  if (offset === count - 1) return 1;
  return offset === 1 ? 2 : 3;
};

/**
 * Zone des scores X01 : une carte par équipe (1 à 4). En duel, rendu historique inchangé (deux colonnes,
 * pastille Manches/Sets centrale en empilé) ; au-delà de deux équipes, les cartes tournent avec le tour
 * (getGridSeatOrder) sans changer l'ordre DOM, et la CSS place la carte active (data-active) en haut
 * (arène, téléphone paysage, tablette portrait : x01.css).
 */
export function MatchPlayersBoard({
  match,
  remainingPreview,
  compactMobileBrowser,
  splitLayout,
  largeActive = false,
  scaleWithScreen = false,
  showHints,
}: MatchPlayersBoardProps) {
  const teamIds = getMatchTeamIds(match);
  const teamCount = teamIds.length;
  const isDuel = teamCount <= 2;
  const showStatusPill = isDuel && !splitLayout;
  const currentPlayer = match.players[match.currentPlayerIndex];
  const currentTeamId = currentPlayer?.teamId;
  const currentScore = currentTeamId ? match.currentLeg.scores[currentTeamId] : 0;
  const activeTeamIndex = Math.max(0, teamIds.indexOf(currentTeamId ?? ''));
  const cells: PlayerCell[] = isDuel
    ? DUEL_SLOT_KEYS.map((slotKey, slot) => ({ slotKey, teamId: teamIds[slot] ?? null }))
    : teamIds.map((teamId) => ({ slotKey: teamId, teamId }));
  const style = { '--x01-opponents': Math.max(1, teamCount - 1) } as CSSProperties;
  const hint = showHints && !showStatusPill
    ? <CheckoutHint score={currentScore} rule={match.config.checkOut} />
    : null;

  return (
    <div
      data-testid="x01-players"
      data-team-count={teamCount}
      data-variant={isDuel ? 'duel' : 'grid'}
      style={style}
      className={`x01-players relative h-full min-h-0 w-full ${isDuel ? 'flex items-stretch' : 'grid grid-cols-2 grid-rows-2'}`}
    >
      {cells.map(({ slotKey, teamId }, index) => {
        if (!teamId) {
          return <div key={`empty-${slotKey}`} data-empty="true" className="x01-player-cell min-w-0 flex-1 overflow-hidden" />;
        }
        const isActive = teamId === currentTeamId;
        const seat = isDuel ? index : getGridSeatOrder((index - activeTeamIndex + teamCount) % teamCount, teamCount, splitLayout);
        const separator = getCellSeparator(isDuel, seat);
        return (
          <div
            key={teamId}
            data-team-id={teamId}
            data-active={isActive}
            data-seat={isDuel ? undefined : seat}
            style={isDuel ? undefined : { order: seat }}
            className={`x01-player-cell min-h-0 min-w-0 overflow-hidden ${isDuel ? 'flex-1' : ''} ${separator}`}
          >
            <MatchPlayerArea
              match={match}
              teamId={teamId}
              remainingPreview={remainingPreview}
              compactMobileBrowser={compactMobileBrowser}
              showMatchCounters={!showStatusPill}
              reserveStatusPillSpace={showStatusPill}
              nameMaxFontPx={getNameMaxFontPx(splitLayout, largeActive, isActive, scaleWithScreen)}
              fitNameToRow={scaleWithScreen}
              belowScore={hint}
            />
          </div>
        );
      })}

      {showStatusPill && (
        <MatchStatusPill
          checkoutRule={match.config.checkOut}
          currentScore={currentScore}
          isSetsMode={match.config.matchMode === 'SETS'}
          leftLegsWon={teamIds[0] ? match.legsWon[teamIds[0]] : 0}
          leftSetsWon={teamIds[0] ? match.setsWon[teamIds[0]] : 0}
          rightLegsWon={teamIds[1] ? match.legsWon[teamIds[1]] : 0}
          rightSetsWon={teamIds[1] ? match.setsWon[teamIds[1]] : 0}
          showHints={showHints}
        />
      )}
    </div>
  );
}
