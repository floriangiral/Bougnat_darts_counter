import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Clock, Crown, Trophy } from 'lucide-react';
import type { Atc180MatchSummary, GameConfig, Player } from '../types';
import { Button } from '../components/ui/Button';
import type { KeypadTone } from '../components/ui/buttonStyles';
import {
  ConfirmExitDialog,
  GameActionButton,
  GameHeader,
  KeypadActionRow,
  KeypadGrid,
  KeypadKey,
  KeypadPanel,
  useExitConfirmation,
} from '../components/game/controls';
import { StartingPlayerOverlay } from '../components/game/StartingPlayerOverlay';
import { ThrowOrderOverlay } from '../components/game/ThrowOrderOverlay';
import { orderPlayers } from '../src/features/game-setup/throwOrder';
import { FitText } from '../components/ui/FitText';
import { GameScreenLayout } from '../components/layout/GameScreenLayout';
import { formatDuration, getOrderedPlayersAndStarter } from '../src/application/scoring/matchLifecycle';
import {
  ATC180_BENCHMARKS,
  ATC180_DARTS_PER_TURN,
  ATC180_HIT_POINTS,
  ATC180_MAX_TOTAL,
  ATC180_ROUNDS,
  canUndoAtc180,
  createAtc180State,
  getAtc180Benchmark,
  getAtc180CurrentSlot,
  getAtc180PlayerStats,
  getAtc180PlayerTotal,
  getAtc180Points,
  getAtc180Ranking,
  getAtc180WinnerIds,
  isAtc180Finished,
  recordAtc180Dart,
  setAtc180Starter,
  undoAtc180,
  type Atc180Hit,
  type Atc180State,
} from '../src/domain/atc180/atc180';
import { captureGameTiming } from '../src/features/game-session/gameTiming';
import type { Atc180RuntimeSnapshot } from '../src/shared/session/persistedAppSession';

// Spec ref: specs/130-counter-180-around-the-clock (FR-03 à FR-09).

interface Atc180GameViewProps {
  players: Player[];
  config: GameConfig;
  onExit: () => void;
  onFinish: (summary: Atc180MatchSummary) => void;
  /** Nouvelle partie avec les mêmes joueurs (écran de fin). */
  onRematch?: () => void;
  /** Partie restaurée après un rechargement (spec 010). */
  restoredState?: Atc180RuntimeSnapshot | null;
  /** Appelé après chaque action validée, jamais sur un tic du chronomètre (spec 010). */
  onStateChange?: (snapshot: Atc180RuntimeSnapshot) => void;
}

type HitKey = {
  hit: Atc180Hit;
  label: string;
  prefix: string;
  tone: KeypadTone;
  multiplier?: 1 | 2 | 3;
};

// Convention de la cible (spec 066) : triple orange, double cyan, simple neutre ; MISS en danger.
const HIT_KEYS: HitKey[] = [
  { hit: 'TRIPLE', label: 'Triple', prefix: 'T', tone: 'triple', multiplier: 3 },
  { hit: 'DOUBLE', label: 'Double', prefix: 'D', tone: 'double', multiplier: 2 },
  { hit: 'SINGLE', label: 'Simple', prefix: 'S', tone: 'neutral', multiplier: 1 },
  { hit: 'MISS', label: 'Miss', prefix: '', tone: 'danger' },
];

const HIT_BY_ID = Object.fromEntries(HIT_KEYS.map((key) => [key.hit, key])) as Record<Atc180Hit, HitKey>;

const formatPoints = (points: number) => `${points} pt${points > 1 ? 's' : ''}`;

const formatHit = (hit: Atc180Hit, round: number) => (hit === 'MISS' ? 'MISS' : `${HIT_BY_ID[hit].prefix}${round}`);

type SlotState = 'filled' | 'next' | 'empty';

const SLOT_TONES: Record<KeypadTone | 'next' | 'empty', string> = {
  triple: 'border-game-triple bg-game-triple-subtle text-game-triple-fg',
  double: 'border-game-double bg-game-double-subtle text-game-double-fg',
  neutral: 'border-border-strong bg-surface-raised text-fg',
  danger: 'border-danger-border bg-danger-subtle text-danger-fg',
  bull: 'border-game-bull bg-game-bull-subtle text-game-bull-fg',
  dbull: 'border-game-dbull bg-game-dbull-subtle text-game-dbull-fg',
  success: 'border-success-border bg-success-subtle text-success-fg',
  next: 'border-game-active bg-surface text-fg-subtle',
  empty: 'border-dashed border-border-subtle bg-surface text-fg-faint',
};

type CardState = 'active' | 'idle';

const CARD_TONES: Record<CardState, string> = {
  active: 'border-game-active border-l-4 bg-game-active/10 text-fg',
  idle: 'border-border-subtle bg-surface-tint text-fg-soft',
};

const BENCHMARK_TEXT = ATC180_BENCHMARKS
  .map((benchmark, index) => {
    const score = index === ATC180_BENCHMARKS.length - 1 ? `${benchmark.score}+` : `~${benchmark.score}`;
    return `${benchmark.level.toLowerCase()} ${score}`;
  })
  .join(' · ');

/** Numéros des tours (1 à ATC180_ROUNDS) : identité stable des colonnes du tableau des tours. */
const ROUND_NUMBERS = Array.from({ length: ATC180_ROUNDS }, (_, index) => index + 1);

const buildSummary = (state: Atc180State, duration: number): Atc180MatchSummary => ({
  ranking: getAtc180Ranking(state).map(({ player, total, rank }) => ({ id: player.id, name: player.name, total, rank })),
  winnerIds: getAtc180WinnerIds(state),
  duration,
});

interface Atc180ResultsProps {
  state: Atc180State;
  elapsedSeconds: number;
  onExit: () => void;
  onRematch?: () => void;
  onUndo: () => void;
}

const Atc180Results: React.FC<Atc180ResultsProps> = ({ state, elapsedSeconds, onExit, onRematch, onUndo }) => {
  const ranking = getAtc180Ranking(state);
  const winners = ranking.filter((entry) => entry.isWinner);
  const isTraining = state.players.length === 1;
  const isTie = winners.length > 1;
  const bestTotal = winners[0]?.total ?? 0;
  const benchmark = isTraining ? getAtc180Benchmark(bestTotal) : null;
  let kicker = 'Vainqueur';
  if (isTraining) kicker = 'Entraînement terminé';
  else if (isTie) kicker = 'Vainqueurs ex aequo';

  return (
    <div
      data-testid="atc180-results"
      data-state="win"
      data-tie={isTie ? 'true' : 'false'}
      className="atc180-results relative min-h-[100dvh] overflow-y-auto bg-canvas bg-ambient px-4 py-6 text-fg sm:px-8 sm:py-10"
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 sm:gap-8">
        <header className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-game-win bg-surface-raised sm:h-20 sm:w-20">
            <Trophy aria-hidden="true" className="h-8 w-8 text-game-win sm:h-10 sm:w-10" />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-game-win sm:text-sm">{kicker}</p>
          <FitText as="h1" className="atc180-results-title mt-2 text-4xl font-black uppercase text-fg sm:text-6xl">
            {winners.map((entry) => entry.player.name).join(' & ')}
          </FitText>
          <p className="mt-3 text-sm font-bold uppercase tracking-[0.2em] text-fg-subtle sm:text-base">
            {bestTotal} / {ATC180_MAX_TOTAL} points · {formatDuration(elapsedSeconds)}
          </p>
          {isTraining && (
            <p data-testid="atc180-benchmark" className="mt-2 text-sm font-bold text-fg-muted sm:text-lg">
              {benchmark ? `Niveau atteint : ${benchmark.level.toLowerCase()} (${benchmark.score} et plus).` : 'Repère débutant : environ 60 points.'}
            </p>
          )}
        </header>

        <section aria-labelledby="atc180-ranking-title" className="rounded-2xl border border-border-subtle bg-surface-tint p-3 sm:p-5">
          <h2 id="atc180-ranking-title" className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-fg sm:text-sm">Classement</h2>
          <ol className="grid gap-2">
            {ranking.map((entry) => {
              const stats = getAtc180PlayerStats(state, entry.player.id);
              return (
                <li
                  key={entry.player.id}
                  data-testid={`atc180-rank-${entry.player.id}`}
                  data-rank={entry.rank}
                  data-winner={entry.isWinner ? 'true' : 'false'}
                  className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-xl border px-3 py-2 sm:px-4 sm:py-3 ${
                    entry.isWinner ? 'border-game-win bg-surface-raised' : 'border-border-subtle bg-surface'
                  }`}
                >
                  <span className={`text-2xl font-black tabular-nums sm:text-3xl ${entry.isWinner ? 'text-game-win' : 'text-fg-subtle'}`}>{entry.rank}</span>
                  <FitText className="text-lg font-black uppercase text-fg sm:text-2xl">{entry.player.name}</FitText>
                  <span className="text-right text-2xl font-black tabular-nums text-game-score sm:text-4xl">
                    {entry.total}
                    <span className="ml-1 text-xs font-bold text-fg-subtle sm:text-sm">/ {ATC180_MAX_TOTAL}</span>
                  </span>
                  <span className="col-span-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-fg-muted sm:col-start-2 sm:text-sm">
                    <span>Triples : <span className="text-game-triple-fg">{Math.round(stats.tripleRate * 100)} %</span> ({stats.triples}/{stats.dartsThrown})</span>
                    <span>Meilleur tour : {stats.bestRound ? `${stats.bestRound.round} (${formatPoints(stats.bestRound.points)})` : '–'}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </section>

        <section aria-labelledby="atc180-rounds-title" className="rounded-2xl border border-border-subtle bg-surface-tint p-3 sm:p-5">
          <h2 id="atc180-rounds-title" className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-fg sm:text-sm">Score par tour</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] border-separate border-spacing-0.5 text-center text-sm tabular-nums">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-[0.1em] text-fg-subtle sm:text-xs">
                  <th scope="col" className="px-2 py-1 text-left">Joueur</th>
                  {ROUND_NUMBERS.map((roundNumber) => (
                    <th key={roundNumber} scope="col" className="px-1 py-1">{roundNumber}</th>
                  ))}
                  <th scope="col" className="px-2 py-1">Total</th>
                </tr>
              </thead>
              <tbody>
                {state.players.map((player) => {
                  const stats = getAtc180PlayerStats(state, player.id);
                  return (
                    <tr key={player.id} data-testid={`atc180-rounds-${player.id}`}>
                      <th scope="row" className="max-w-32 truncate rounded-md bg-surface px-2 py-1 text-left font-black text-fg">{player.name}</th>
                      {ROUND_NUMBERS.map((roundNumber) => {
                        const points = stats.roundPoints[roundNumber - 1] ?? null;
                        return (
                          <td
                            key={roundNumber}
                            data-points={points ?? undefined}
                            className={`rounded-md bg-surface px-1 py-1 font-bold ${points === 9 ? 'text-game-triple-fg' : 'text-fg-muted'}`}
                          >
                            {points ?? '–'}
                          </td>
                        );
                      })}
                      <td className="rounded-md bg-surface-raised px-2 py-1 font-black text-game-score">{stats.total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs font-semibold text-fg-subtle sm:text-sm">Repères : {BENCHMARK_TEXT}.</p>
        </section>

        <div className="grid gap-3 sm:grid-cols-3">
          {onRematch && (
            <Button onClick={onRematch} variant="primary" data-testid="atc180-rematch" className="h-14 text-lg sm:order-3">Revanche</Button>
          )}
          <Button onClick={onUndo} variant="secondary" data-testid="atc180-results-undo" className="h-14 text-base sm:order-1">
            Annuler la dernière fléchette
          </Button>
          <Button onClick={onExit} variant="secondary" data-testid="atc180-results-exit" className="h-14 text-lg sm:order-2">Retour aux jeux</Button>
        </div>
      </div>
    </div>
  );
};

export const Atc180GameView: React.FC<Atc180GameViewProps> = ({
  players,
  config,
  onExit,
  onFinish,
  onRematch,
  restoredState = null,
  onStateChange,
}) => {
  const initialRotation = useMemo(() => getOrderedPlayersAndStarter(players, config), [players, config]);
  const [state, setState] = useState<Atc180State>(() =>
    restoredState?.state ?? createAtc180State(initialRotation.orderedPlayers, initialRotation.startingPlayerIndex)
  );
  // « Qui commence ? » n'a de sens qu'à plusieurs : seul, la partie démarre aussitôt.
  const [hasGameStarted, setHasGameStarted] = useState(() => restoredState?.hasGameStarted ?? state.players.length === 1);
  const [elapsedSeconds, setElapsedSeconds] = useState(() => restoredState?.timing.elapsedSeconds ?? 0);
  const exitConfirmation = useExitConfirmation(onExit);
  const isFinished = isAtc180Finished(state);
  // Une partie restaurée sur son écran de fin a déjà été signalée avant le rechargement.
  const [hasReportedFinish, setHasReportedFinish] = useState(() => isFinished);
  const elapsedSecondsRef = useRef(elapsedSeconds);

  useEffect(() => {
    if (!hasGameStarted || isFinished) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((value) => value + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [hasGameStarted, isFinished]);

  useEffect(() => {
    elapsedSecondsRef.current = elapsedSeconds;
  }, [elapsedSeconds]);

  useEffect(() => {
    onStateChange?.({
      gameType: 'ATC180',
      state,
      hasGameStarted,
      timing: captureGameTiming(elapsedSecondsRef.current, hasGameStarted && !isAtc180Finished(state)),
    });
  }, [hasGameStarted, onStateChange, state]);

  useEffect(() => {
    if (!isFinished || hasReportedFinish) return;
    setHasReportedFinish(true);
    onFinish(buildSummary(state, elapsedSeconds));
  }, [elapsedSeconds, hasReportedFinish, isFinished, onFinish, state]);

  const handleHit = (hit: Atc180Hit) => {
    if (!hasGameStarted) return;
    setState((current) => recordAtc180Dart(current, hit));
  };

  const handleUndo = () => setState((current) => undoAtc180(current));

  const handleStarterSelect = (starterId: string) => {
    setState((current) => setAtc180Starter(current, Number.parseInt(starterId, 10) || 0));
    setHasGameStarted(true);
  };

  const handleOrderConfirm = (ids: string[]) => {
    setState((current) => createAtc180State(orderPlayers(current.players, ids)));
    setHasGameStarted(true);
  };

  if (isFinished) {
    return <Atc180Results state={state} elapsedSeconds={elapsedSeconds} onExit={onExit} onRematch={onRematch} onUndo={handleUndo} />;
  }

  const slot = getAtc180CurrentSlot(state)!;
  const round = slot.round;
  const currentPlayer = state.players[slot.playerIndex];
  const isTraining = state.players.length === 1;
  const currentTotal = getAtc180PlayerTotal(state, currentPlayer.id);
  const volleyPoints = getAtc180Points(state.currentDarts);
  const completedPointsByRound = new Map<number, number>(
    state.turns
      .filter((turn) => turn.playerId === currentPlayer.id)
      .map((turn) => [turn.round, turn.points] as const),
  );
  const dartNumber = state.currentDarts.length + 1;
  const lastTurn = state.turns.at(-1);
  const lastTurnPlayer = lastTurn ? state.players.find((player) => player.id === lastTurn.playerId) : undefined;
  const totals = new Map(state.players.map((player) => [player.id, getAtc180PlayerTotal(state, player.id)]));
  const leaderTotal = Math.max(...totals.values());
  const starterOptions = state.players.map((player, index) => ({ id: String(index), label: player.name }));

  const header = (
    <GameHeader
      game="atc180"
      badge={`180 · Tour ${round}/${ATC180_ROUNDS}`}
      compactBadge={`Tour ${round}/${ATC180_ROUNDS}`}
      clock={{ elapsed: formatDuration(elapsedSeconds) }}
      onExit={exitConfirmation.requestExit}
    />
  );

  const playersZone = (
    <div className="flex min-h-0 flex-col gap-2 sm:gap-3">
      <section
        data-testid="atc180-active-player"
        data-state="active"
        aria-live="polite"
        className="atc180-active flex shrink-0 items-stretch justify-between gap-2 rounded-2xl border border-l-4 border-game-active bg-game-active/10 p-2.5 sm:gap-3 sm:p-4"
      >
        <div className="atc180-active-main flex min-w-0 flex-1 flex-col justify-center">
          <p className="atc180-active-turn text-[10px] font-black uppercase tracking-[0.22em] text-fg-subtle sm:text-xs">
            Tour {round}/{ATC180_ROUNDS} · Fléchette {dartNumber}/{ATC180_DARTS_PER_TURN}
          </p>
          <div className="atc180-active-title mt-1 flex min-w-0 items-center gap-2">
            <span aria-hidden="true" className="atc180-active-marker shrink-0 text-xl text-game-active sm:text-3xl">▶</span>
            <FitText as="h1" className="atc180-active-name flex-1 text-2xl font-black uppercase leading-tight text-fg sm:text-5xl">
              {currentPlayer.name}
            </FitText>
          </div>
          <p className="atc180-active-total-line mt-1 text-xs font-bold text-fg-muted sm:text-sm">
            Total{' '}
            <span data-testid="atc180-active-total" className="atc180-active-total font-black tabular-nums text-game-score">{currentTotal}</span>
            {volleyPoints > 0 && <span className="atc180-active-pending ml-2 font-black tabular-nums text-fg">+{volleyPoints}</span>}
          </p>
        </div>
        <div className="atc180-target-box flex shrink-0 flex-col items-center justify-center rounded-xl border-2 border-border-strong bg-surface-inset px-3 py-1 sm:rounded-2xl sm:px-5 sm:py-2">
          <p className="atc180-target-label text-[10px] font-black uppercase tracking-[0.22em] text-fg-faint sm:text-xs">Numéro</p>
          <p data-testid="atc180-target" className="atc180-target text-4xl font-black leading-none tabular-nums text-fg sm:text-6xl">{round}</p>
        </div>
      </section>

      {isTraining ? (
        <section
          aria-labelledby="atc180-training-title"
          data-testid="atc180-training-panel"
          className="atc180-training-panel flex min-h-0 flex-1 flex-col rounded-2xl border border-border-subtle bg-surface-tint p-2 sm:p-4"
        >
          <div className="mb-2 flex shrink-0 items-center gap-2">
            <Clock aria-hidden="true" className="h-4 w-4 text-game-atc180-fg sm:h-5 sm:w-5" />
            <h2 id="atc180-training-title" className="text-xs font-black uppercase tracking-[0.18em] text-fg sm:text-sm">Progression</h2>
            <span className="ml-auto text-[10px] font-black uppercase tracking-[0.1em] text-fg-subtle sm:text-xs">
              Tour {round} / {ATC180_ROUNDS}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Tours terminés"
            aria-valuemin={0}
            aria-valuemax={ATC180_ROUNDS}
            aria-valuenow={round - 1}
            className="atc180-training-progress mb-2 h-1.5 shrink-0 overflow-hidden rounded-full bg-surface-inset"
          >
            <div className="h-full rounded-full bg-game-active transition-[width]" style={{ width: `${((round - 1) / ATC180_ROUNDS) * 100}%` }} />
          </div>
          <ol aria-label="Points obtenus à chaque numéro" data-testid="atc180-training-grid" className="atc180-training-grid grid min-h-0 flex-1 gap-1.5">
            {ROUND_NUMBERS.map((number) => {
              const points = completedPointsByRound.get(number);
              const isCurrent = number === round;
              const tileState = points !== undefined ? 'complete' : isCurrent ? 'current' : 'upcoming';
              const scoreLabel = points !== undefined ? `+${points}` : isCurrent ? `+${volleyPoints}` : '–';
              const description = points !== undefined
                ? `Tour ${number} : ${points} points`
                : isCurrent
                  ? `Tour ${number} en cours : ${volleyPoints} points dans la volée`
                  : `Tour ${number} à venir`;
              return (
                <li
                  key={number}
                  data-testid={`atc180-training-round-${number}`}
                  data-state={tileState}
                  data-points={points ?? (isCurrent ? volleyPoints : '')}
                  aria-label={description}
                  className={`atc180-training-round flex min-h-0 flex-col items-center justify-center gap-1 rounded-xl border text-center tabular-nums ${
                    tileState === 'complete'
                      ? 'border-success-border bg-success-subtle text-success-fg'
                      : tileState === 'current'
                        ? 'border-2 border-game-active bg-game-active/10 text-fg'
                        : 'border-border-subtle bg-surface-inset text-fg-faint'
                  }`}
                >
                  <span className="atc180-training-number text-xs font-black sm:text-sm">{number}</span>
                  <span className="atc180-training-points text-[10px] font-bold sm:text-xs">{scoreLabel}</span>
                </li>
              );
            })}
          </ol>
          <p className="atc180-benchmarks mt-2 shrink-0 text-center text-[9px] font-semibold text-fg-subtle sm:text-xs">
            Repères : {BENCHMARK_TEXT}
          </p>
        </section>
      ) : (
        <section aria-labelledby="atc180-board-title" className="atc180-board-panel flex min-h-0 flex-1 flex-col rounded-2xl border border-border-subtle bg-surface-tint p-2 sm:p-4">
          <div className="mb-2 flex shrink-0 items-center gap-2">
            <Clock aria-hidden="true" className="h-4 w-4 text-game-atc180-fg sm:h-5 sm:w-5" />
            <h2 id="atc180-board-title" className="text-xs font-black uppercase tracking-[0.18em] text-fg sm:text-sm">Tableau</h2>
            <span className="ml-auto text-[10px] font-black uppercase tracking-[0.14em] text-fg-subtle sm:text-xs">Max {ATC180_MAX_TOTAL}</span>
          </div>
          <div aria-hidden="true" className="atc180-board-head atc180-card-columns grid shrink-0 px-2 pb-1 text-[9px] font-black uppercase tracking-[0.12em] text-fg-subtle sm:px-3 sm:text-[10px]">
            <span>Joueur</span>
            <span>Total</span>
            <span>Dernier tour</span>
          </div>
          <ul className="atc180-board grid min-h-0 flex-1 auto-rows-fr gap-1 text-[15px] sm:text-base">
            {state.players.map((player) => {
              const cardState: CardState = player.id === currentPlayer.id ? 'active' : 'idle';
              const total = totals.get(player.id) ?? 0;
              const isLeader = total > 0 && total === leaderTotal;
              const playerTurns = state.turns.filter((turn) => turn.playerId === player.id);
              const lastPoints = playerTurns.at(-1)?.points;
              return (
                <li
                  key={player.id}
                  data-testid={`atc180-player-${player.id}`}
                  data-state={cardState}
                  data-leader={isLeader ? 'true' : 'false'}
                  className={`atc180-card grid min-h-9 items-center rounded-lg border px-2 sm:px-3 ${CARD_TONES[cardState]}`}
                >
                  <span className="atc180-card-name flex min-w-0 items-center gap-1 pr-1 font-black">
                    {cardState === 'active' && <span aria-hidden="true" className="shrink-0 text-game-active">▶</span>}
                    <FitText className="flex-1">{player.name}</FitText>
                    {isLeader && <Crown aria-label="En tête" className="atc180-card-icon h-4 w-4 shrink-0 text-game-win" />}
                  </span>
                  <span className={`atc180-card-total font-black tabular-nums ${cardState === 'active' ? 'text-game-score' : 'text-game-score-inactive'}`}>
                    {total}
                  </span>
                  <span className="atc180-card-last font-black tabular-nums text-fg-muted">
                    <span className="atc180-card-caption sr-only">Dernier tour </span>
                    {lastPoints === undefined ? '–' : `+${lastPoints}`}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="atc180-benchmarks mt-2 shrink-0 text-[11px] font-semibold text-fg-subtle sm:text-xs">Repères : {BENCHMARK_TEXT}</p>
        </section>
      )}
    </div>
  );

  const inputZone = (
    <KeypadPanel className="atc180-input-panel rounded-2xl border border-border-subtle bg-surface-tint">
      <div data-testid="atc180-volley" data-darts={state.currentDarts.length} className="atc180-volley shrink-0 rounded-xl border border-border-subtle bg-surface-inset p-2 sm:rounded-2xl sm:p-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="atc180-volley-label text-xs font-black uppercase tracking-[0.18em] text-fg-subtle">
            Volée sur le <span className="atc180-volley-target text-fg">{round}</span>
          </p>
          <p data-testid="atc180-volley-points" className="atc180-volley-points text-2xl font-black tabular-nums text-fg sm:text-3xl">+{volleyPoints}</p>
        </div>
        <ol aria-label="Fléchettes de la volée" className="atc180-slots mt-1 grid grid-cols-3 gap-2 sm:mt-2">
          {Array.from({ length: ATC180_DARTS_PER_TURN }, (_, index) => {
            const hit = state.currentDarts[index];
            let slotState: SlotState = 'empty';
            if (hit) slotState = 'filled';
            else if (index === state.currentDarts.length) slotState = 'next';
            const tone = hit ? HIT_BY_ID[hit].tone : undefined;
            return (
              <li
                key={index}
                data-testid={`atc180-slot-${index}`}
                data-state={slotState}
                data-tone={tone}
                className={`atc180-slot flex min-h-10 items-center justify-center rounded-lg border-2 text-lg font-black tabular-nums sm:min-h-12 sm:text-2xl ${SLOT_TONES[tone ?? (slotState === 'next' ? 'next' : 'empty')]}`}
              >
                {hit ? formatHit(hit, round) : index + 1}
              </li>
            );
          })}
        </ol>
        <p className="atc180-volley-last mt-1 min-h-5 truncate text-xs font-bold text-fg-muted sm:mt-2 sm:text-sm">
          {lastTurn && lastTurnPlayer
            ? `Volée précédente : ${lastTurnPlayer.name} sur le ${lastTurn.round}, +${formatPoints(lastTurn.points)}`
            : 'Saisis chaque fléchette sur le numéro du tour.'}
        </p>
      </div>

      <KeypadGrid columns={2} label={`Fléchette sur le ${round}`} className="atc180-keys">
        {HIT_KEYS.map((key) => (
          <KeypadKey
            key={key.hit}
            keyId={key.hit.toLowerCase()}
            tone={key.tone}
            multiplier={key.multiplier}
            size="label"
            aria-label={`${key.label} : ${formatPoints(ATC180_HIT_POINTS[key.hit])}`}
            onClick={() => handleHit(key.hit)}
            className="atc180-key flex-col gap-1"
          >
            <span className="atc180-key-label">{key.label}</span>
            <span className="atc180-key-detail text-[0.7em] font-bold normal-case tracking-normal opacity-80">
              {key.hit === 'MISS' ? 'Hors numéro' : `${key.prefix}${round}`} · {formatPoints(ATC180_HIT_POINTS[key.hit])}
            </span>
          </KeypadKey>
        ))}
      </KeypadGrid>

      <KeypadActionRow
        className="atc180-actions"
        columns={1}
        undo={<GameActionButton action="undo" onClick={handleUndo} disabled={!canUndoAtc180(state)} className="atc180-action" />}
      />
    </KeypadPanel>
  );

  return (
    <GameScreenLayout
      game="atc180"
      className="gap-2 bg-ambient p-2 pb-safe sm:gap-3 sm:p-4"
      header={header}
      players={playersZone}
      input={inputZone}
      headerProps={{ className: 'atc180-header' }}
      playersProps={{ className: 'atc180-players', 'data-players': state.players.length }}
      inputProps={{ className: 'atc180-input', 'data-darts': state.currentDarts.length }}
    >
      <ConfirmExitDialog {...exitConfirmation.dialogProps} />
      {!hasGameStarted && (state.players.length > 2
        ? <ThrowOrderOverlay options={state.players.map((player) => ({ id: player.id, label: player.name }))} onConfirm={handleOrderConfirm} onCancel={onExit} />
        : <StartingPlayerOverlay options={starterOptions} onSelect={handleStarterSelect} onCancel={onExit} />
      )}
    </GameScreenLayout>
  );
};
