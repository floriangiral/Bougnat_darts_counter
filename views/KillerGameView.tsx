import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Heart, Skull, Target, Trophy } from 'lucide-react';
import type { GameConfig, KillerMatchSummary, Player } from '../types';
import { Button } from '../components/ui/Button';
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
import { FitText } from '../components/ui/FitText';
import { GameScreenLayout } from '../components/layout/GameScreenLayout';
import { ThrowOrderOverlay } from '../components/game/ThrowOrderOverlay';
import { orderPlayers } from '../src/features/game-setup/throwOrder';
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
import { getKillerFinalRanking } from '../src/features/killer/killerRanking';
import { shouldShowFullRanking } from '../src/features/rankings/finalRanking';
import { FinalRankingList } from '../components/game/FinalRankingList';
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

const formatLives = (lives: number) => `${lives} vie${lives > 1 ? 's' : ''}`;

const KillerLives: React.FC<{ lives: number }> = ({ lives }) => (
  <span className="killer-lives flex items-center gap-1" data-lives={lives} aria-label={`${formatLives(lives)} sur ${KILLER_STARTING_LIVES}`}>
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
      {state === 'eliminated' && <Skull aria-hidden="true" className="killer-card-icon h-4 w-4 shrink-0" />}
      <FitText className={`flex-1 ${state === 'eliminated' ? 'line-through' : ''}`}>{player.name}</FitText>
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

/** Phase 2 : consignes, numéro, vies et statut Killer du joueur actif. */
const KillerEliminationDetail: React.FC<{ player: KillerPlayerState }> = ({ player }) => (
  <>
    <div className="min-w-0">
      <p className="killer-active-hint text-base font-black text-fg sm:text-lg">
        {player.isKiller ? 'Vise un double adverse.' : 'Vise ton propre double.'}
      </p>
      <p className="killer-active-hint text-xs font-semibold text-fg-muted sm:text-sm">
        {player.isKiller ? 'Attention : ton propre double te retire une vie.' : 'Ton double te donne le rang Killer.'}
      </p>
    </div>
    <div className="killer-active-stats flex flex-wrap items-center gap-3">
      <span className="killer-active-number font-black tabular-nums text-fg">D{formatKillerTarget(player.target)}</span>
      <KillerLives lives={player.lives} />
      {/* Statut lisible de loin, affiché en tablette portrait (killer.css). */}
      <span
        data-testid="killer-active-status"
        data-killer={player.isKiller ? 'true' : 'false'}
        className={`killer-active-status items-center rounded-xl border px-3 font-black uppercase leading-tight ${
          player.isKiller ? 'border-danger-border bg-danger-subtle text-danger-fg' : 'border-border-subtle bg-surface-inset text-fg-muted'
        }`}
      >
        {player.isKiller ? 'Killer' : 'Pas Killer'}
      </span>
    </div>
  </>
);

/** Phase 1 : numéros attribuables, les numéros déjà pris restent visibles mais désactivés. */
const KillerAssignKeys: React.FC<{ assignedTargets: ReadonlySet<KillerTarget>; onAssign: (target: KillerTarget) => void }> = ({ assignedTargets, onAssign }) => (
  <KeypadGrid columns="auto" maxColumns={7} label="Numéro touché" className="killer-keys">
    {KILLER_TARGETS.map((target) => {
      const taken = assignedTargets.has(target);
      return (
        <KeypadKey
          key={target}
          tone={target === 25 ? 'bull' : 'neutral'}
          keyId={`k${target}`}
          disabled={taken}
          state={taken ? 'taken' : 'free'}
          onClick={() => onAssign(target)}
          className={`killer-key ${taken ? 'line-through' : ''}`}
        >
          {formatKillerTarget(target)}
        </KeypadKey>
      );
    })}
  </KeypadGrid>
);

export const KillerGameView: React.FC<KillerGameViewProps> = ({ players, config, onExit, onFinish, restoredState = null, onStateChange }) => {
  const initialRotation = useMemo(() => getOrderedPlayersAndStarter(players, config), [players, config]);
  const [state, setState] = useState<KillerState>(() =>
    restoredState?.state ?? createKillerState(initialRotation.orderedPlayers, initialRotation.startingPlayerIndex)
  );
  const [history, setHistory] = useState<KillerState[]>(() => restoredState?.history ?? []);
  const [hasGameStarted, setHasGameStarted] = useState(() => restoredState?.hasGameStarted ?? (restoredState !== null || players.length <= 2));
  const [elapsedSeconds, setElapsedSeconds] = useState(() => restoredState?.timing.elapsedSeconds ?? 0);
  const exitConfirmation = useExitConfirmation(onExit);
  // A game restored on its result screen was already reported before the reload.
  const [hasReportedFinish, setHasReportedFinish] = useState(() => restoredState?.state.phase === 'FINISHED');
  const elapsedSecondsRef = useRef(elapsedSeconds);

  const currentPlayer = state.players[state.currentPlayerIndex] ?? state.players[0];
  const assignedTargets = new Set(state.players.map((player) => player.target).filter((target): target is KillerTarget => target !== null));
  const winner = state.players.find((player) => player.id === state.winnerId) ?? null;
  const remainingDarts = Math.max(0, 3 - state.dartsInTurn);
  const isAssigning = state.phase === 'ASSIGN_TARGETS';
  const alivePlayers = state.players.filter((player) => !player.isEliminated);

  useEffect(() => {
    if (!hasGameStarted || state.phase === 'FINISHED') return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [hasGameStarted, state.phase]);

  useEffect(() => {
    elapsedSecondsRef.current = elapsedSeconds;
  }, [elapsedSeconds]);

  useEffect(() => {
    onStateChange?.({
      gameType: 'KILLER',
      state,
      history,
      hasGameStarted,
      timing: captureGameTiming(elapsedSecondsRef.current, hasGameStarted && state.phase !== 'FINISHED'),
    });
  }, [hasGameStarted, history, onStateChange, state]);

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
    if (!hasGameStarted) return;
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

  const handleOrderConfirm = (ids: string[]) => {
    setState((current) => ({ ...current, players: orderPlayers(current.players, ids), currentPlayerIndex: 0 }));
    setHasGameStarted(true);
  };

  if (winner) {
    const showRanking = shouldShowFullRanking(state.players.length);
    const rankingRows = showRanking
      ? getKillerFinalRanking(state).map(({ item, rank, played }) => ({
        id: item.id,
        name: item.name,
        rank,
        played,
        detail: item.isEliminated ? 'Éliminé' : formatLives(item.lives),
      }))
      : [];
    return (
      <div data-testid="killer-winner" data-state="win" className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-canvas bg-ambient px-4 text-fg">
        <div className="relative z-10 w-full max-w-2xl text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border-2 border-game-win bg-surface-raised">
            <Trophy aria-hidden="true" className="h-10 w-10 text-game-win" />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-game-win">Dernier survivant</p>
          <FitText as="h1" className="mt-3 text-5xl font-black uppercase text-fg sm:text-7xl">{winner.name}</FitText>
          <p className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-fg-subtle">{formatDuration(elapsedSeconds)}</p>
          {showRanking && <FinalRankingList rows={rankingRows} className="mx-auto mt-6" />}
          <div className="mt-10">
            <Button onClick={onExit} variant="primary">Retour aux jeux</Button>
          </div>
        </div>
      </div>
    );
  }

  const header = (
    <GameHeader
      game="killer"
      badge={isAssigning ? 'Killer · Attribution' : 'Killer · Élimination'}
      compactBadge="Killer"
      clock={{ elapsed: formatDuration(elapsedSeconds) }}
      onExit={exitConfirmation.requestExit}
    />
  );

  const playersZone = (
    <div className="flex min-h-0 flex-col gap-2 sm:gap-3">
      <section
        data-testid="killer-active-player"
        data-state="active"
        aria-live="polite"
        className="killer-active shrink-0 rounded-2xl border border-l-4 border-game-active bg-game-active/10 p-2.5 sm:p-4"
      >
        <div className="killer-active-head flex items-start justify-between gap-2 sm:gap-4">
          <div className="min-w-0 flex-1">
            <p className="killer-active-phase text-[10px] font-black uppercase tracking-[0.22em] text-fg-subtle sm:text-xs sm:tracking-[0.28em]">
              {isAssigning ? 'Phase 1 · Attribution' : 'Phase 2 · Élimination'}
            </p>
            <div className="mt-0.5 flex min-w-0 items-center gap-2 sm:mt-1">
              <span aria-hidden="true" className="killer-active-marker shrink-0 text-xl text-game-active sm:text-3xl">▶</span>
              <FitText as="h1" className="killer-active-name flex-1 text-[clamp(1.3rem,6vw,1.9rem)] font-black uppercase leading-none text-fg sm:text-5xl">
                {isAssigning ? 'Attribuer les numéros' : `${currentPlayer.name} joue`}
              </FitText>
            </div>
          </div>
          {!isAssigning && (
            <div className="killer-active-darts-box shrink-0 rounded-xl border border-border-subtle bg-surface-inset px-3 py-1.5 text-right sm:rounded-2xl sm:px-4 sm:py-2">
              <p className="killer-active-darts-label text-[10px] font-black uppercase tracking-[0.22em] text-fg-faint">Fléchettes</p>
              <p className="killer-active-darts text-2xl font-black tabular-nums text-fg sm:text-3xl">{remainingDarts}</p>
            </div>
          )}
        </div>
        <div className="killer-active-detail mt-2 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
          {isAssigning ? (
            <div className="min-w-0 flex-1">
              <FitText as="p" className="killer-assign-name text-lg font-black text-fg">{currentPlayer.name}</FitText>
              <p className="killer-active-hint text-xs font-semibold text-fg-muted sm:text-sm">Main faible. Choisis le numéro touché.</p>
            </div>
          ) : (
            <KillerEliminationDetail player={currentPlayer} />
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
    <KeypadPanel className="killer-input-panel rounded-2xl border border-border-subtle bg-surface-tint">
      {isAssigning ? (
        <KillerAssignKeys assignedTargets={assignedTargets} onAssign={handleAssignTarget} />
      ) : (
        <KeypadGrid columns={2} label="Double touché" data-count={alivePlayers.length} className="killer-targets">
          {alivePlayers.map((player) => {
            const isOwn = player.id === currentPlayer.id;
            return (
              <KeypadKey
                key={player.id}
                tone="double"
                multiplier={2}
                state={isOwn ? 'own' : 'opponent'}
                onClick={() => handleDoubleHit(player.id)}
                className="killer-target px-2 py-1.5 sm:px-3"
              >
                <span className="flex w-full min-w-0 flex-col gap-0.5 text-left">
                  <span className="flex w-full items-center justify-between gap-2">
                    <FitText className="killer-target-name flex-1 text-sm sm:text-lg">{player.name}</FitText>
                    <span className="killer-target-number shrink-0 text-base tabular-nums sm:text-xl">D{formatKillerTarget(player.target)}</span>
                  </span>
                  <span className="killer-target-caption text-[10px] font-bold tracking-[0.12em] text-fg-subtle sm:text-xs">
                    {isOwn ? 'Double personnel' : 'Double adverse'}
                  </span>
                </span>
              </KeypadKey>
            );
          })}
          <GameActionButton action="miss" onClick={handleMiss} className="killer-key killer-miss col-span-2" />
        </KeypadGrid>
      )}

      <KeypadActionRow
        className="killer-actions"
        undo={<GameActionButton action="undo" onClick={handleUndo} disabled={history.length === 0} className="killer-action" />}
        validate={isAssigning ? undefined : <GameActionButton action="pass" onClick={handlePassTurn} className="killer-action" />}
      />
    </KeypadPanel>
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
      <ConfirmExitDialog {...exitConfirmation.dialogProps} />
      {!hasGameStarted && (
        <ThrowOrderOverlay options={state.players.map((player) => ({ id: player.id, label: player.name }))} onConfirm={handleOrderConfirm} onCancel={onExit} />
      )}
    </GameScreenLayout>
  );
};
