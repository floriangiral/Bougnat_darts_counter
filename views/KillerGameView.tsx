import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Heart, LogOut, Skull, Target, Trophy } from 'lucide-react';
import type { GameConfig, KillerMatchSummary, Player } from '../types';
import { Button, IconButton } from '../components/ui/Button';
import { GameScreenLayout } from '../components/layout/GameScreenLayout';
import { formatDuration, getOrderedPlayersAndStarter } from '../src/application/scoring/matchLifecycle';
import {
  KILLER_STARTING_LIVES,
  KILLER_TARGETS,
  assignKillerTarget,
  createKillerState,
  formatKillerTarget,
  recordKillerDart,
  type KillerPlayerState,
  type KillerState,
  type KillerTarget,
} from '../src/domain/killer/killer';
import { captureGameTiming } from '../src/features/game-session/gameTiming';
import type { KillerRuntimeSnapshot } from '../src/shared/session/persistedAppSession';

interface KillerGameViewProps {
  players: Player[];
  config: GameConfig;
  onExit: () => void;
  onFinish: (summary: KillerMatchSummary) => void;
  /** Game restored after a reload (spec 010). */
  restoredState?: KillerRuntimeSnapshot | null;
  /** Called after each validated action, never on a clock tick (spec 010). */
  onStateChange?: (snapshot: KillerRuntimeSnapshot) => void;
}

type KillerCardState = 'active' | 'eliminated' | 'idle';

const cloneKillerState = (state: KillerState): KillerState => ({
  ...state,
  players: state.players.map((player) => ({ ...player })),
  log: [...state.log],
});

const getCardState = (player: KillerPlayerState, currentPlayerId: string | undefined): KillerCardState => {
  if (player.isEliminated) return 'eliminated';
  return player.id === currentPlayerId ? 'active' : 'idle';
};

// Spec 066 : joueur actif = barre + fond + ▶ ; éliminé = atténué + barré + icône.
const CARD_TONES: Record<KillerCardState, string> = {
  active: 'border-game-active border-l-4 bg-game-active/10 text-fg',
  eliminated: 'border-border-subtle bg-surface-sunken text-game-eliminated',
  idle: 'border-border-subtle bg-surface-tint text-fg',
};

const KillerLives: React.FC<{ lives: number }> = ({ lives }) => (
  <span className="killer-lives flex items-center gap-1" data-lives={lives} aria-label={`${lives} vie${lives > 1 ? 's' : ''} sur ${KILLER_STARTING_LIVES}`}>
    {Array.from({ length: KILLER_STARTING_LIVES }, (_, index) => (
      <Heart
        key={index}
        aria-hidden="true"
        data-state={index < lives ? 'full' : 'lost'}
        className={`h-4 w-4 shrink-0 ${index < lives ? 'fill-current text-danger-fg' : 'text-fg-disabled'}`}
      />
    ))}
  </span>
);

const KillerPlayerCard: React.FC<{ player: KillerPlayerState; state: KillerCardState }> = ({ player, state }) => (
  <li
    data-testid={`killer-player-${player.id}`}
    data-state={state}
    data-killer={player.isKiller ? 'true' : 'false'}
    className={`killer-card grid min-h-9 items-center rounded-lg border px-2 sm:px-3 ${CARD_TONES[state]}`}
  >
    <span className="killer-card-name flex min-w-0 items-center gap-1 pr-1 font-black">
      {state === 'active' && <span aria-hidden="true" className="shrink-0 text-game-active">▶</span>}
      {state === 'eliminated' && <Skull aria-hidden="true" className="h-4 w-4 shrink-0" />}
      <span className={`truncate ${state === 'eliminated' ? 'line-through' : ''}`}>{player.name}</span>
      {state === 'eliminated' && <span className="sr-only"> (éliminé)</span>}
    </span>
    <span className={`killer-card-number font-black tabular-nums ${state === 'eliminated' ? 'line-through' : ''}`}>
      <span className="killer-card-caption sr-only">N° </span>
      {formatKillerTarget(player.target)}
    </span>
    <span className="killer-card-rank font-black text-danger-fg" title={player.isKiller ? 'Killer' : undefined}>
      {player.isKiller ? 'K' : '-'}
    </span>
    <KillerLives lives={player.lives} />
  </li>
);

export const KillerGameView: React.FC<KillerGameViewProps> = ({ players, config, onExit, onFinish, restoredState = null, onStateChange }) => {
  const initialRotation = useMemo(() => getOrderedPlayersAndStarter(players, config), [players, config]);
  const [state, setState] = useState<KillerState>(() =>
    restoredState?.state ?? createKillerState(initialRotation.orderedPlayers, initialRotation.startingPlayerIndex)
  );
  const [history, setHistory] = useState<KillerState[]>(() => restoredState?.history ?? []);
  const [elapsedSeconds, setElapsedSeconds] = useState(() => restoredState?.timing.elapsedSeconds ?? 0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  // A game restored on its result screen was already reported before the reload.
  const [hasReportedFinish, setHasReportedFinish] = useState(() => restoredState?.state.phase === 'FINISHED');
  const elapsedSecondsRef = useRef(elapsedSeconds);

  const currentPlayer = state.players[state.currentPlayerIndex] ?? state.players[0];
  const assignedTargets = new Set(state.players.map((player) => player.target).filter((target): target is KillerTarget => target !== null));
  const winner = state.players.find((player) => player.id === state.winnerId) ?? null;
  const remainingDarts = Math.max(0, 3 - state.dartsInTurn);
  const isAssigning = state.phase === 'ASSIGN_TARGETS';

  useEffect(() => {
    if (state.phase === 'FINISHED') return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [state.phase]);

  useEffect(() => {
    elapsedSecondsRef.current = elapsedSeconds;
  }, [elapsedSeconds]);

  useEffect(() => {
    onStateChange?.({
      gameType: 'KILLER',
      state,
      history,
      timing: captureGameTiming(elapsedSecondsRef.current, state.phase !== 'FINISHED'),
    });
  }, [history, onStateChange, state]);

  useEffect(() => {
    if (state.phase !== 'FINISHED' || hasReportedFinish) return;
    setHasReportedFinish(true);
    onFinish({
      players: state.players,
      winnerId: state.winnerId,
      duration: elapsedSeconds,
    });
  }, [elapsedSeconds, hasReportedFinish, onFinish, state]);

  const updateState = (nextState: KillerState) => {
    setHistory((previous) => [cloneKillerState(state), ...previous].slice(0, 20));
    setState(nextState);
  };

  const handleAssignTarget = (target: KillerTarget) => {
    if (!currentPlayer) return;
    updateState(assignKillerTarget(state, currentPlayer.id, target));
  };

  const handleDoubleHit = (targetPlayerId: string) => {
    updateState(recordKillerDart(state, { type: 'DOUBLE_HIT', targetPlayerId }));
  };

  const handleMiss = () => {
    updateState(recordKillerDart(state, { type: 'MISS' }));
  };

  const handlePassTurn = () => {
    let nextState = state;
    for (let dart = remainingDarts; dart > 0; dart -= 1) {
      nextState = recordKillerDart(nextState, { type: 'MISS' });
    }
    updateState(nextState);
  };

  const handleUndo = () => {
    const previousState = history[0];
    if (!previousState) return;
    setState(previousState);
    setHistory((previous) => previous.slice(1));
  };

  if (winner) {
    return (
      <div data-testid="killer-winner" data-state="win" className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-canvas bg-ambient px-4 text-fg">
        <div className="relative z-10 w-full max-w-2xl text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border-2 border-game-win bg-surface-raised">
            <Trophy aria-hidden="true" className="h-10 w-10 text-game-win" />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-game-win">Dernier survivant</p>
          <h1 className="mt-3 text-5xl font-black uppercase text-fg sm:text-7xl">{winner.name}</h1>
          <p className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-fg-subtle">{formatDuration(elapsedSeconds)}</p>
          <div className="mt-10">
            <Button onClick={onExit} variant="primary">Retour aux jeux</Button>
          </div>
        </div>
      </div>
    );
  }

  const header = (
    <div className="flex items-center justify-between gap-2">
      <IconButton label="Quitter" tone="danger" onClick={() => setShowExitConfirm(true)}>
        <LogOut aria-hidden="true" className="h-5 w-5" />
      </IconButton>
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-fg-subtle sm:gap-3 sm:text-xs sm:tracking-[0.22em]">
        <span className="font-mono">{formatDuration(elapsedSeconds)}</span>
        <span className="rounded-full border border-border-subtle bg-surface-tint px-3 py-1 text-game-killer-fg">Killer</span>
      </div>
    </div>
  );

  const playersZone = (
    <div className="flex min-h-0 flex-col gap-2 sm:gap-3">
      <section
        data-testid="killer-active-player"
        data-state="active"
        aria-live="polite"
        className="killer-active shrink-0 rounded-2xl border border-l-4 border-game-active bg-game-active/10 p-2.5 sm:p-4"
      >
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-fg-subtle sm:text-xs sm:tracking-[0.28em]">
              {isAssigning ? 'Phase 1 · Attribution' : 'Phase 2 · Élimination'}
            </p>
            <div className="mt-0.5 flex min-w-0 items-center gap-2 sm:mt-1">
              <span aria-hidden="true" className="killer-active-marker shrink-0 text-xl text-game-active sm:text-3xl">▶</span>
              <h1 className="killer-active-name truncate text-[clamp(1.3rem,6vw,1.9rem)] font-black uppercase leading-none text-fg sm:text-5xl">
                {isAssigning ? 'Attribuer les numéros' : `${currentPlayer.name} joue`}
              </h1>
            </div>
          </div>
          {!isAssigning && (
            <div className="shrink-0 rounded-xl border border-border-subtle bg-surface-inset px-3 py-1.5 text-right sm:rounded-2xl sm:px-4 sm:py-2">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-fg-faint">Fléchettes</p>
              <p className="killer-active-darts text-2xl font-black tabular-nums text-fg sm:text-3xl">{remainingDarts}</p>
            </div>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
          {isAssigning ? (
            <div className="min-w-0">
              <p className="text-lg font-black text-fg">{currentPlayer.name}</p>
              <p className="text-xs font-semibold text-fg-muted sm:text-sm">Main faible. Choisis le numéro touché.</p>
            </div>
          ) : (
            <>
              <div className="min-w-0">
                <p className="text-base font-black text-fg sm:text-lg">
                  {currentPlayer.isKiller ? 'Vise un double adverse.' : 'Vise ton propre double.'}
                </p>
                <p className="text-xs font-semibold text-fg-muted sm:text-sm">
                  {currentPlayer.isKiller ? 'Attention : ton propre double te retire une vie.' : 'Ton double te donne le rang Killer.'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="killer-active-number font-black tabular-nums text-fg">D{formatKillerTarget(currentPlayer.target)}</span>
                <KillerLives lives={currentPlayer.lives} />
              </div>
            </>
          )}
        </div>
      </section>

      <section aria-labelledby="killer-board-title" className="killer-board-panel flex min-h-0 flex-1 flex-col rounded-2xl border border-border-subtle bg-surface-tint p-2 sm:p-4">
        <div className="mb-2 flex shrink-0 items-center gap-2">
          <Target aria-hidden="true" className="h-4 w-4 text-game-killer-fg sm:h-5 sm:w-5" />
          <h2 id="killer-board-title" className="text-xs font-black uppercase tracking-[0.18em] text-fg sm:text-sm sm:tracking-[0.22em]">Tableau</h2>
        </div>
        <div aria-hidden="true" className="killer-board-head killer-card-columns grid shrink-0 px-2 pb-1 text-[9px] font-black uppercase tracking-[0.12em] text-fg-subtle sm:px-3 sm:text-[10px] sm:tracking-[0.18em]">
          <span>Joueur</span>
          <span>Numéro</span>
          <span>Rang</span>
          <span>Vies</span>
        </div>
        <ul className="killer-board grid min-h-0 flex-1 auto-rows-fr gap-1 text-[15px] sm:text-base">
          {state.players.map((player) => (
            <KillerPlayerCard key={player.id} player={player} state={getCardState(player, currentPlayer?.id)} />
          ))}
        </ul>
      </section>
    </div>
  );

  const inputZone = (
    <div className="killer-input-panel flex h-full min-h-0 flex-col gap-2 rounded-2xl border border-border-subtle bg-surface-tint p-2 sm:gap-3 sm:p-4">
      {isAssigning ? (
        <div role="group" aria-label="Numéro touché" className="killer-keys grid flex-1">
          {KILLER_TARGETS.map((target) => {
            const taken = assignedTargets.has(target);
            return (
              <Button
                key={target}
                variant="keypad"
                tone={target === 25 ? 'bull' : 'neutral'}
                size="sm"
                disabled={taken}
                data-state={taken ? 'taken' : 'free'}
                onClick={() => handleAssignTarget(target)}
                className={`killer-key h-full rounded-xl px-0.5 text-sm sm:text-base ${taken ? 'line-through' : ''}`}
              >
                {formatKillerTarget(target)}
              </Button>
            );
          })}
        </div>
      ) : (
        <div role="group" aria-label="Double touché" className="killer-targets grid flex-1 grid-cols-2 gap-1.5 sm:gap-2">
          {state.players.filter((player) => !player.isEliminated).map((player) => {
            const isOwn = player.id === currentPlayer.id;
            return (
              <Button
                key={player.id}
                variant="keypad"
                tone="double"
                size="sm"
                data-multiplier="2"
                data-state={isOwn ? 'own' : 'opponent'}
                onClick={() => handleDoubleHit(player.id)}
                className="killer-target h-full min-h-14 rounded-xl px-2 py-1.5 sm:px-3"
              >
                <span className="flex w-full min-w-0 flex-col gap-0.5 text-left">
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-sm sm:text-lg">{player.name}</span>
                    <span className="killer-target-number shrink-0 text-base tabular-nums sm:text-xl">D{formatKillerTarget(player.target)}</span>
                  </span>
                  <span className="text-[10px] font-bold tracking-[0.12em] text-fg-subtle sm:text-xs">
                    {isOwn ? 'Double personnel' : 'Double adverse'}
                  </span>
                </span>
              </Button>
            );
          })}
          <Button variant="keypad" tone="neutral" size="sm" onClick={handleMiss} className="killer-key col-span-2 h-full min-h-11 rounded-xl">
            Raté
          </Button>
        </div>
      )}

      <div className={`killer-actions grid shrink-0 gap-1.5 sm:gap-2 ${isAssigning ? 'grid-cols-1' : 'grid-cols-2'}`}>
        <Button onClick={handleUndo} variant="secondary" disabled={history.length === 0} className="killer-action rounded-xl">
          <ArrowLeft aria-hidden="true" className="mr-2 h-4 w-4" />
          Annuler
        </Button>
        {!isAssigning && (
          <Button onClick={handlePassTurn} variant="primary" className="killer-action rounded-xl">
            Passer
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <GameScreenLayout
      game="killer"
      className="gap-2 bg-ambient p-2 pb-safe sm:gap-3 sm:p-4"
      header={header}
      players={playersZone}
      input={inputZone}
      headerProps={{ className: 'killer-header' }}
      playersProps={{ className: 'killer-players', 'data-phase': state.phase }}
      inputProps={{ className: 'killer-input', 'data-phase': state.phase }}
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
