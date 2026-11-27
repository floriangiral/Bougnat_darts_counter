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
  /** Présentations tactiles adaptées : compteurs par carte (spec 072). */
  splitLayout: boolean;
  /** Ancien plafond de nom actif, conservé pour le rendu duel. */
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
 * Zone des scores X01 : une carte par équipe (1 à 4). En duel, rendu historique inchangé (deux colonnes,
 * pastille Manches/Sets centrale en empilé). À 3 ou 4 joueurs, les places suivent l'ordre de passage sur tous
 * les écrans ; seul le cadre actif change de carte.
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
  const isFixed = !isDuel;
  const showStatusPill = isDuel && !splitLayout;
  const currentPlayer = match.players[match.currentPlayerIndex];
  const currentTeamId = currentPlayer?.teamId;
  const currentScore = currentTeamId ? match.currentLeg.scores[currentTeamId] : 0;
  const cells: PlayerCell[] = isDuel
    ? DUEL_SLOT_KEYS.map((slotKey, slot) => ({ slotKey, teamId: teamIds[slot] ?? null }))
    : teamIds.map((teamId) => ({ slotKey: teamId, teamId }));
  // Places fixes à 3 joueurs : la case du n° 4 (en bas à droite) reste vide.
  if (isFixed && teamCount === 3) cells.push({ slotKey: 'seat-4', teamId: null });
  const style = { '--x01-opponents': Math.max(1, teamCount - 1) } as CSSProperties;
  const hint = showHints && !showStatusPill
    ? <CheckoutHint score={currentScore} rule={match.config.checkOut} />
    : null;

  return (
    <div
      data-testid="x01-players"
      data-team-count={teamCount}
      data-variant={isDuel ? 'duel' : 'grid'}
      data-seating={isFixed ? 'fixed' : undefined}
      style={style}
      className={`x01-players relative h-full min-h-0 w-full ${isDuel ? 'flex items-stretch' : 'grid grid-cols-2 grid-rows-2'}`}
    >
      {cells.map(({ slotKey, teamId }, index) => {
        if (!teamId) {
          return <div key={`empty-${slotKey}`} data-empty="true" className="x01-player-cell min-w-0 flex-1 overflow-hidden" />;
        }
        const isActive = teamId === currentTeamId;
        if (isFixed) {
          return (
            <div
              key={teamId}
              data-team-id={teamId}
              data-active={isActive}
              data-seat={index}
              className="x01-player-cell min-h-0 min-w-0 overflow-hidden"
            >
              <MatchPlayerArea
                match={match}
                teamId={teamId}
                remainingPreview={remainingPreview}
                compactMobileBrowser={compactMobileBrowser}
                showMatchCounters
                reserveStatusPillSpace={false}
                nameMaxFontPx={getNameMaxFontPx(splitLayout, largeActive, false, scaleWithScreen)}
                fitNameToRow={scaleWithScreen}
                belowScore={hint}
                showStarterMark
                reserveBelowScore={showHints}
              />
            </div>
          );
        }
        const seat = index;
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
