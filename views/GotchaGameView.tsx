import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Calculator, Crosshair, LogOut, Trophy } from 'lucide-react';
import type { GameConfig, GotchaMatchSummary, Player } from '../types';
import { Button, IconButton } from '../components/ui/Button';
import { GameScreenLayout } from '../components/layout/GameScreenLayout';
import { formatDuration, getOrderedPlayersAndStarter } from '../src/application/scoring/matchLifecycle';
import {
  GOTCHA_MAX_VISIT_SCORE,
  createGotchaState,
  isGotchaVisitScoreReachable,
  recordGotchaTurn,
  type GotchaState,
} from '../src/domain/gotcha/gotcha';
import { captureGameTiming } from '../src/features/game-session/gameTiming';
import type { GotchaRuntimeSnapshot } from '../src/shared/session/persistedAppSession';

interface GotchaGameViewProps {
  players: Player[];
  config: GameConfig;
  onExit: () => void;
  onFinish: (summary: GotchaMatchSummary) => void;
  /** Game restored after a reload (spec 010). */
  restoredState?: GotchaRuntimeSnapshot | null;
  /** Called after each validated action, never on a clock tick (spec 010). */
  onStateChange?: (snapshot: GotchaRuntimeSnapshot) => void;
}

const cloneGotchaState = (state: GotchaState): GotchaState => ({
  ...state,
  players: state.players.map((player) => ({
    ...player,
    history: player.history.map((turn) => ({ ...turn, gotchaVictimIds: [...turn.gotchaVictimIds] })),
  })),
  log: [...state.log],
});

type VisitPreviewState = 'idle' | 'impossible' | 'win' | 'bust' | 'gotcha';

// Spec 066 : bust projeté → game-bust (+ libellé), victoire → game-win ; un total impossible est une erreur de saisie.
const PREVIEW_TONES: Record<VisitPreviewState, { panel: string; projected: string }> = {
  idle: { panel: 'border-border-subtle bg-surface-inset', projected: 'text-game-score' },
  impossible: { panel: 'border-danger-border bg-danger-subtle', projected: 'text-danger-fg' },
  win: { panel: 'border-game-win bg-game-win/10', projected: 'text-game-win' },
  bust: { panel: 'border-game-bust bg-game-bust/10', projected: 'text-game-bust-fg' },
  gotcha: { panel: 'border-brand-border bg-brand-subtle', projected: 'text-game-score' },
};

const getVisitPreview = ({
  input,
  isImpossible,
  wouldWin,
  wouldBust,
  projectedScore,
  currentScore,
  targetNames,
}: {
  input: string;
  isImpossible: boolean;
  wouldWin: boolean;
  wouldBust: boolean;
  projectedScore: number;
  currentScore: number | undefined;
  targetNames: string[];
}) => {
  let state: VisitPreviewState = 'idle';
  let message = 'Saisis le total de tes 3 fléchettes.';
  if (isImpossible) {
    state = 'impossible';
    message = 'Score impossible : ce total ne se fait pas en 3 fléchettes.';
  } else if (wouldWin) {
    state = 'win';
    message = 'Score exact : victoire.';
  } else if (wouldBust) {
    state = 'bust';
    message = 'Bust : ton score restera identique.';
  } else if (targetNames.length > 0) {
    state = 'gotcha';
    message = `Gotcha possible sur ${targetNames.join(', ')}.`;
  }

  return {
    state,
    message,
    displayedProjectedScore: wouldBust || isImpossible ? currentScore : projectedScore,
    input: input || '0',
  };
};

type GotchaCardState = 'active' | 'idle';

const CARD_TONES: Record<GotchaCardState, string> = {
  active: 'border-game-active border-l-4 bg-game-active/10 text-fg',
  idle: 'border-border-subtle bg-surface-tint text-fg-soft',
};

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export const GotchaGameView: React.FC<GotchaGameViewProps> = ({ players, config, onExit, onFinish, restoredState = null, onStateChange }) => {
  const initialRotation = useMemo(() => getOrderedPlayersAndStarter(players, config), [players, config]);
  const targetScore = config.startingScore > 0 ? config.startingScore : 301;
  const [state, setState] = useState<GotchaState>(() =>
    restoredState?.state ?? createGotchaState(initialRotation.orderedPlayers, targetScore, initialRotation.startingPlayerIndex)
  );
  const [history, setHistory] = useState<GotchaState[]>(() => restoredState?.history ?? []);
  const [input, setInput] = useState('');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(() => restoredState?.timing.elapsedSeconds ?? 0);
  // A game restored on its result screen was already reported before the reload.
  const [hasReportedFinish, setHasReportedFinish] = useState(() => Boolean(restoredState?.state.winnerId));
  const elapsedSecondsRef = useRef(elapsedSeconds);

  const currentPlayer = state.players[state.currentPlayerIndex] ?? state.players[0];
  const winner = state.players.find((player) => player.id === state.winnerId) ?? null;
  const inputValue = Number.parseInt(input || '0', 10);
  const isImpossible = !isGotchaVisitScoreReachable(inputValue);
  const projectedScore = currentPlayer ? currentPlayer.score + inputValue : 0;
  const remainingToTarget = currentPlayer ? Math.max(0, state.targetScore - currentPlayer.score) : state.targetScore;
  const wouldBust = !isImpossible && input.length > 0 && projectedScore > state.targetScore;
  const wouldWin = !isImpossible && input.length > 0 && projectedScore === state.targetScore;
  const gotchaTargets = !isImpossible && input.length > 0 && projectedScore > 0
    ? state.players.filter((player) => player.id !== currentPlayer?.id && player.score === projectedScore)
    : [];
  const preview = getVisitPreview({
    input,
    isImpossible,
    wouldWin,
    wouldBust,
    projectedScore,
    currentScore: currentPlayer?.score,
    targetNames: gotchaTargets.map((player) => player.name),
  });

  useEffect(() => {
    if (state.winnerId) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [state.winnerId]);

  useEffect(() => {
    elapsedSecondsRef.current = elapsedSeconds;
  }, [elapsedSeconds]);

  useEffect(() => {
    onStateChange?.({
      gameType: 'GOTCHA',
      state,
      history,
      timing: captureGameTiming(elapsedSecondsRef.current, !state.winnerId),
    });
  }, [history, onStateChange, state]);

  useEffect(() => {
    if (!winner || hasReportedFinish) return;
    setHasReportedFinish(true);
    onFinish({
      players: state.players,
      winnerId: winner.id,
      targetScore: state.targetScore,
      duration: elapsedSeconds,
    });
  }, [elapsedSeconds, hasReportedFinish, onFinish, state.players, state.targetScore, winner]);

  const updateState = (nextState: GotchaState) => {
    setHistory((previous) => [cloneGotchaState(state), ...previous].slice(0, 30));
    setState(nextState);
    setInput('');
  };

  const handleDigit = (digit: string) => {
    setInput((current) => {
      const nextValue = `${current}${digit}`.replace(/^0+(?=\d)/, '').slice(0, 3);
      const parsed = Number.parseInt(nextValue || '0', 10);
      return parsed > GOTCHA_MAX_VISIT_SCORE ? current : nextValue;
    });
  };

  const handleSubmit = () => {
    if (isImpossible) return;
    updateState(recordGotchaTurn(state, inputValue));
  };

  const handleUndo = () => {
    const previous = history[0];
    if (!previous) return;
    setState(previous);
    setHistory((items) => items.slice(1));
    setInput('');
  };

  if (winner) {
    return (
      <div data-testid="gotcha-winner" data-state="win" className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-canvas bg-ambient px-4 text-fg">
        <div className="relative z-10 w-full max-w-2xl text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border-2 border-game-win bg-surface-raised">
            <Trophy aria-hidden="true" className="h-10 w-10 text-game-win" />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-game-win">Score exact</p>
          <h1 className="mt-3 text-5xl font-black uppercase text-fg sm:text-7xl">{winner.name}</h1>
          <p className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-fg-subtle">
            {state.targetScore} points · {formatDuration(elapsedSeconds)}
          </p>
          <div className="mt-10">
            <Button onClick={onExit} variant="primary">Retour aux jeux</Button>
          </div>
        </div>
      </div>
    );
  }

  const previewTone = PREVIEW_TONES[preview.state];
  const gotchaTargetIds = new Set(gotchaTargets.map((player) => player.id));

  const header = (
    <div className="flex items-center justify-between gap-2">
      <IconButton label="Quitter" tone="danger" onClick={() => setShowExitConfirm(true)}>
        <LogOut aria-hidden="true" className="h-5 w-5" />
      </IconButton>
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-fg-subtle sm:text-xs">
        <span className="font-mono">{formatDuration(elapsedSeconds)}</span>
        <span className="rounded-full border border-border-subtle bg-surface-tint px-3 py-1 text-game-gotcha-fg">
          Cible {state.targetScore}
        </span>
      </div>
    </div>
  );

  const playersZone = (
    <div className="flex min-h-0 flex-col gap-2 sm:gap-3">
      <section
        data-testid="gotcha-active-player"
        data-state="active"
        aria-live="polite"
        className="gotcha-active flex shrink-0 items-start justify-between gap-2 rounded-2xl border border-l-4 border-game-active bg-game-active/10 p-2.5 sm:gap-3 sm:p-4"
      >
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-fg-subtle sm:text-xs">
            Tour {state.turnNumber}
          </p>
          <div className="mt-1 flex min-w-0 items-center gap-2">
            <span aria-hidden="true" className="gotcha-active-marker shrink-0 text-xl text-game-active sm:text-3xl">▶</span>
            <h1 className="gotcha-active-name truncate text-2xl font-black uppercase leading-tight text-fg sm:text-5xl">
              {currentPlayer?.name}
            </h1>
          </div>
          <p className="mt-1 text-xs font-bold text-fg-muted sm:text-sm">
            Score <span className="gotcha-active-score font-black tabular-nums text-game-score">{currentPlayer?.score ?? 0}</span>
          </p>
        </div>
        <div className="shrink-0 rounded-xl border border-border-subtle bg-surface-inset px-3 py-2 text-right sm:rounded-2xl sm:px-4 sm:py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-fg-faint">Reste</p>
          <p className="gotcha-active-remaining text-2xl font-black tabular-nums text-game-score sm:text-3xl">{remainingToTarget}</p>
        </div>
      </section>

      <section aria-labelledby="gotcha-board-title" className="gotcha-board-panel flex min-h-0 flex-1 flex-col rounded-2xl border border-border-subtle bg-surface-tint p-2 sm:p-4">
        <div className="mb-2 flex shrink-0 items-center gap-2">
          <Crosshair aria-hidden="true" className="h-4 w-4 text-game-gotcha-fg sm:h-5 sm:w-5" />
          <h2 id="gotcha-board-title" className="text-xs font-black uppercase tracking-[0.18em] text-fg sm:text-sm">Tableau</h2>
        </div>
        <div aria-hidden="true" className="gotcha-board-head gotcha-card-columns grid shrink-0 px-2 pb-1 text-[9px] font-black uppercase tracking-[0.12em] text-fg-subtle sm:px-3 sm:text-[10px]">
          <span>Joueur</span>
          <span>Score</span>
          <span>Reste</span>
        </div>
        <ul className="gotcha-board grid min-h-0 flex-1 auto-rows-fr gap-1 text-[15px] sm:text-base">
          {state.players.map((player, index) => {
            const cardState: GotchaCardState = player.id === currentPlayer?.id ? 'active' : 'idle';
            const isTarget = gotchaTargetIds.has(player.id);
            return (
              <li
                key={player.id}
                data-testid={`gotcha-player-${player.id}`}
                data-state={cardState}
                data-gotcha-target={isTarget ? 'true' : 'false'}
                className={`gotcha-card grid min-h-9 items-center rounded-lg border px-2 sm:px-3 ${CARD_TONES[cardState]} ${isTarget ? 'ring-2 ring-brand-border' : ''}`}
              >
                <span className="gotcha-card-name flex min-w-0 items-center gap-1 pr-1 font-black">
                  {cardState === 'active' && <span aria-hidden="true" className="shrink-0 text-game-active">▶</span>}
                  <span className="truncate">{index + 1}. {player.name}</span>
                  {isTarget && <Crosshair aria-label="Cible du Gotcha" className="h-4 w-4 shrink-0 text-brand-fg" />}
                </span>
                <span className={`gotcha-card-score font-black tabular-nums ${cardState === 'active' ? 'text-game-score' : 'text-game-score-inactive'}`}>
                  {player.score}
                </span>
                <span className="gotcha-card-remaining font-black tabular-nums text-fg-muted">
                  <span className="gotcha-card-caption sr-only">Reste </span>
                  {state.targetScore - player.score}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );

  const inputZone = (
    <div className="gotcha-input-panel flex h-full min-h-0 flex-col gap-2 rounded-2xl border border-border-subtle bg-surface-tint p-2 sm:gap-3 sm:p-4">
      <div data-testid="gotcha-visit-preview" data-state={preview.state} className={`gotcha-preview shrink-0 rounded-xl border p-2 sm:rounded-2xl sm:p-4 ${previewTone.panel}`}>
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-fg-subtle">Visite</p>
            <p className="gotcha-preview-value mt-1 text-4xl font-black tabular-nums text-fg sm:text-5xl">{preview.input}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-fg-subtle">
              Après le tour
              {preview.state === 'bust' && (
                <span className="ml-2 rounded-full border border-game-bust px-2 py-0.5 text-game-bust-fg">Trop !</span>
              )}
            </p>
            <p data-testid="gotcha-projected-score" className={`gotcha-preview-value mt-1 text-3xl font-black tabular-nums sm:text-4xl ${previewTone.projected}`}>
              {preview.displayedProjectedScore}
            </p>
          </div>
        </div>
        <p className="mt-1 min-h-5 text-sm font-bold text-fg-muted sm:mt-3">{preview.message}</p>
      </div>

      <div role="group" aria-label="Total de la visite" className="gotcha-keys grid flex-1 grid-cols-3 gap-1.5 sm:gap-2">
        {DIGITS.map((digit) => (
          <Button key={digit} variant="keypad" tone="neutral" onClick={() => handleDigit(digit)} className="gotcha-key h-full rounded-xl text-2xl">
            {digit}
          </Button>
        ))}
        <Button variant="keypad" tone="danger" title="Effacer la saisie" onClick={() => setInput('')} className="gotcha-key h-full rounded-xl text-base">
          C
        </Button>
        <Button variant="keypad" tone="neutral" onClick={() => handleDigit('0')} className="gotcha-key col-span-2 h-full rounded-xl text-2xl">
          0
        </Button>
      </div>

      <div className="gotcha-actions grid shrink-0 grid-cols-2 gap-1.5 sm:gap-2">
        <Button onClick={handleUndo} variant="secondary" disabled={history.length === 0} className="gotcha-action rounded-xl">
          <ArrowLeft aria-hidden="true" className="mr-2 h-4 w-4" />
          <span className="sr-only">Retour au tour précédent : </span>
          Annuler
        </Button>
        <Button onClick={handleSubmit} disabled={isImpossible} variant="primary" className="gotcha-action rounded-xl">
          <Calculator aria-hidden="true" className="mr-2 h-5 w-5" />
          Valider
        </Button>
      </div>
    </div>
  );

  return (
    <GameScreenLayout
      game="gotcha"
      className="gap-2 bg-ambient p-2 pb-safe sm:gap-3 sm:p-4"
      header={header}
      players={playersZone}
      input={inputZone}
      headerProps={{ className: 'gotcha-header' }}
      playersProps={{ className: 'gotcha-players' }}
      inputProps={{ className: 'gotcha-input', 'data-preview': preview.state }}
    >
      {showExitConfirm && (
        <dialog open aria-label="Quitter la partie ?" className="app-modal tablet-modal fixed inset-0 z-[80] m-0 flex h-full w-full max-h-none max-w-none items-center justify-center border-0 bg-scrim p-4 text-fg backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border-strong bg-surface p-6 text-center shadow-elevated">
            <h2 className="mb-2 text-2xl font-black uppercase italic text-fg">Quitter ?</h2>
            <p className="text-sm text-fg-muted">La partie en cours sera abandonnée.</p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => setShowExitConfirm(false)}>Non</Button>
              <Button variant="danger" onClick={onExit}>Oui</Button>
            </div>
          </div>
        </dialog>
      )}
    </GameScreenLayout>
  );
};
