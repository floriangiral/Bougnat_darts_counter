import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { BarChart3, LogOut } from 'lucide-react';
import { Player, CapitalPlayerState, CapitalDart, GameConfig } from '../types';
import { CAPITAL_TARGETS, CAPITAL_TARGET_NAMES } from '../utils/capitalLogic';
import { CapitalKeypad } from '../components/game/CapitalKeypad';
import { Button, IconButton } from '../components/ui/Button';
import { GameScreenLayout } from '../components/layout/GameScreenLayout';
import { StartingPlayerOverlay } from '../components/game/StartingPlayerOverlay';
import { formatDuration, getOrderedPlayersAndStarter } from '../src/application/scoring/matchLifecycle';
import {
  capitalGameReducer,
  createInitialCapitalGameState,
  isCapitalGameOver,
  sortCapitalResults,
} from '../src/features/capital/capitalGameModel';
import { captureGameTiming } from '../src/features/game-session/gameTiming';
import type { CapitalRuntimeSnapshot } from '../src/shared/session/persistedAppSession';

interface CapitalGameViewProps {
  players: Player[];
  config: GameConfig;
  onExit: () => void;
  onFinish: (results: CapitalPlayerState[]) => void;
  skipStartingPlayerPrompt?: boolean;
  /** Game restored after a reload (spec 010). */
  restoredState?: CapitalRuntimeSnapshot | null;
  /** Called after each validated action, never on a clock tick (spec 010). */
  onStateChange?: (snapshot: CapitalRuntimeSnapshot) => void;
  /** Bandeau optionnel sous l'en-tête (progression de phase du Triathlon, spec 072 FR-06). */
  band?: React.ReactNode;
}

const CAPITAL_DART_SLOT_IDS = ['dart-slot-1', 'dart-slot-2', 'dart-slot-3'];

const getCapitalDartLabel = (dart: CapitalDart): string => {
  if (dart.value === 0) return 'MISS';
  if (dart.value === 25) return dart.multiplier === 2 ? 'DB' : 'B';

  let multiplierPrefix = '';
  if (dart.multiplier === 2) multiplierPrefix = 'D';
  if (dart.multiplier === 3) multiplierPrefix = 'T';
  return `${multiplierPrefix}${dart.value}`;
};

const isLongKeypadTarget = (target: string): boolean => (
  target === 'SUITE' || target === 'COTE_A_COTE' || target === '57' || target === 'COULEUR' || target === '21_OU_MOINS'
);

const CapitalDartSlot: React.FC<{ dart?: CapitalDart }> = ({ dart }) => (
  <div
    data-state={dart ? 'filled' : 'empty'}
    className={`capital-dart-slot flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-black sm:h-16 sm:w-16 sm:text-xl ${
      dart
        ? 'bg-surface-raised border-brand text-fg shadow-glow-brand'
        : 'bg-surface border-border-strong text-fg-disabled'
    }`}
  >
    {dart ? getCapitalDartLabel(dart) : '-'}
  </div>
);

export const CapitalGameView: React.FC<CapitalGameViewProps> = ({
  players,
  config,
  onExit,
  onFinish,
  skipStartingPlayerPrompt = false,
  restoredState = null,
  onStateChange,
  band,
}) => {
  const initialRotation = useMemo(() => getOrderedPlayersAndStarter(players, config), [players, config]);
  const [gameState, dispatch] = useReducer(
    capitalGameReducer,
    null,
    () => restoredState?.state ?? createInitialCapitalGameState(initialRotation.orderedPlayers, initialRotation.startingPlayerIndex)
  );
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [hasGameStarted, setHasGameStarted] = useState(() => restoredState?.hasGameStarted ?? skipStartingPlayerPrompt);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }));
  const [elapsedSeconds, setElapsedSeconds] = useState(() => restoredState?.timing.elapsedSeconds ?? 0);
  const elapsedSecondsRef = useRef(elapsedSeconds);
  const [showStats, setShowStats] = useState(false);
  const hasGameStartedRef = useRef(hasGameStarted);
  const resolutionTimeoutRef = useRef<number | null>(null);

  const { orderedPlayers, states, currentPlayerIdx, currentDarts, history, pendingResolution } = gameState;
  const currentPlayerId = orderedPlayers[currentPlayerIdx]?.id ?? states[0]?.id;
  const currentPlayer = states.find((state) => state.id === currentPlayerId) ?? states[0];
  const currentTarget = currentPlayer?.targetIndex < CAPITAL_TARGETS.length ? CAPITAL_TARGETS[currentPlayer.targetIndex] : 'CAPITAL';
  const currentChallengeNumber = Math.min((currentPlayer?.targetIndex ?? 0) + 1, CAPITAL_TARGETS.length);
  const currentChallengeProgress = Math.min(((currentChallengeNumber - 1) / CAPITAL_TARGETS.length) * 100, 100);
  const isGameOver = isCapitalGameOver(states);
  const starterOptions = orderedPlayers.map((player, index) => ({ id: String(index), label: player.name }));

  useEffect(() => {
    if (hasGameStartedRef.current) return;
    dispatch({
      type: 'sync_rotation',
      orderedPlayers: initialRotation.orderedPlayers,
      currentPlayerIdx: initialRotation.startingPlayerIndex,
    });
  }, [initialRotation]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }));
      if (hasGameStarted && !isGameOver) {
        setElapsedSeconds((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [hasGameStarted, isGameOver]);

  useEffect(() => {
    hasGameStartedRef.current = hasGameStarted;
  }, [hasGameStarted]);

  useEffect(() => {
    elapsedSecondsRef.current = elapsedSeconds;
  }, [elapsedSeconds]);

  useEffect(() => {
    onStateChange?.({
      gameType: 'CAPITAL',
      state: gameState,
      hasGameStarted,
      timing: captureGameTiming(elapsedSecondsRef.current, hasGameStarted && !isCapitalGameOver(gameState.states)),
    });
  }, [gameState, hasGameStarted, onStateChange]);

  const handleDartInput = (dart: CapitalDart) => {
    if (isGameOver || currentDarts.length >= 3 || !hasGameStarted) return;
    dispatch({ type: 'add_dart', dart });
  };

  const handleUndo = () => {
    if (!hasGameStarted) return;
    if (history.length === 0) return;
    if (resolutionTimeoutRef.current !== null) {
      window.clearTimeout(resolutionTimeoutRef.current);
      resolutionTimeoutRef.current = null;
    }
    dispatch({ type: 'undo' });
  };

  useEffect(() => () => {
    if (resolutionTimeoutRef.current !== null) {
      window.clearTimeout(resolutionTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (!pendingResolution) {
      return undefined;
    }

    resolutionTimeoutRef.current = window.setTimeout(() => {
      dispatch({ type: 'resolve_round' });
      resolutionTimeoutRef.current = null;
    }, 500);

    return () => {
      if (resolutionTimeoutRef.current !== null) {
        window.clearTimeout(resolutionTimeoutRef.current);
        resolutionTimeoutRef.current = null;
      }
    };
  }, [pendingResolution]);

  const handleStarterSelect = (starterId: string) => {
    dispatch({ type: 'set_starter', currentPlayerIdx: Number.parseInt(starterId, 10) || 0 });
    setHasGameStarted(true);
  };

  if (isGameOver) {
    const sortedPlayers = sortCapitalResults(states);
    const winner = sortedPlayers[0];
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center bg-canvas p-4 text-fg animate-in fade-in duration-500 sm:p-6">
        <h1 className="mb-4 text-center text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-2 drop-shadow-glow-brand sm:text-6xl">
          VAINQUEUR
        </h1>
        <div className="mb-2 text-center text-2xl font-bold uppercase text-fg sm:text-4xl">
          {winner.name}
        </div>
        <div className="mb-12 text-center text-base font-mono uppercase tracking-[0.18em] text-fg-subtle sm:text-xl sm:tracking-widest">
          Score Final: {winner.score}
        </div>
        <Button onClick={() => onFinish(sortedPlayers)} size="lg" data-testid="winner-view-stats" className="w-full max-w-xs h-20 text-2xl uppercase shadow-brand">
          Voir les Stats ➔
        </Button>
        {history.length > 0 && (
          <Button variant="secondary" onClick={handleUndo} className="mt-3 h-12 w-full max-w-xs text-base uppercase">
            Retour
          </Button>
        )}
      </div>
    );
  }

  const longKeypad = isLongKeypadTarget(currentTarget);

  return (
    <GameScreenLayout
      game="capital"
      className="bg-gradient-to-br from-surface to-canvas"
      band={band}
      headerProps={{ className: 'z-20 flex min-h-[78px] items-center justify-between gap-2 border-b border-border bg-surface px-3 py-3 sm:min-h-[88px] sm:px-4 sm:py-4' }}
      playersProps={{
        className: 'capital-players-zone flex flex-col gap-3 overflow-y-auto p-3 sm:gap-4 sm:p-4',
        'data-player-count': states.length,
      }}
      inputProps={{
        className: `legacy-capital-keypad-area z-30 pb-safe ${
          longKeypad
            ? 'legacy-capital-keypad-area--long h-[clamp(21.5rem,46svh,32rem)] md:h-[clamp(22.5rem,47svh,34rem)]'
            : 'h-[clamp(18rem,40svh,28rem)] md:h-[clamp(20rem,42svh,30rem)]'
        }`,
      }}
      header={(
        <>
          <div className="flex flex-col gap-1">
            <div className="font-black italic text-base sm:text-lg md:text-xl"><span className="text-fg">BOUGNAT</span> <span className="text-brand-fg">DARTS</span></div>
          </div>
          <div className="flex min-w-[92px] flex-col items-center justify-center sm:min-w-[112px]">
            <div className="mb-1 text-[11px] leading-none text-fg-faint font-mono md:text-xs">{currentTime}</div>
            <div className="text-base font-bold leading-none tracking-[0.18em] text-brand-fg font-mono sm:text-lg md:text-xl">{formatDuration(elapsedSeconds)}</div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <IconButton label="Statistiques" onClick={() => setShowStats(true)} className="h-10 w-10">
              <BarChart3 className="h-4 w-4" />
            </IconButton>
            <IconButton label="Quitter" tone="danger" onClick={() => setShowExitConfirm(true)} className="game-header-exit ml-2 h-10 w-10 sm:ml-3">
              <LogOut className="h-4 w-4" />
            </IconButton>
          </div>
        </>
      )}
      players={(
        <>
          {/* Objectif courant */}
          <div className="capital-objective rounded-xl border border-brand-border bg-surface-inset p-3 text-center shadow-panel sm:p-4" data-testid="capital-objective">
            <div className="capital-objective-heading flex items-center justify-center gap-3 text-center">
              <div className="capital-objective-label flex h-full items-center whitespace-nowrap text-lg font-black italic leading-none text-brand-fg-soft sm:text-xl">
                Objectif Actuel :
              </div>
              <div className="capital-objective-name flex h-full items-center whitespace-nowrap text-lg font-black italic leading-none text-fg sm:text-xl">
                {CAPITAL_TARGET_NAMES[currentTarget]}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.18em] text-fg-subtle sm:text-xs">
              <span>Challenge</span>
              <span className="text-fg">{currentChallengeNumber}/{CAPITAL_TARGETS.length}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-tint-strong">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand via-brand-2 to-brand transition-all duration-300"
                style={{ width: `${currentChallengeProgress}%` }}
              />
            </div>
          </div>

          {/* Joueurs */}
          <div className="capital-players flex min-h-0 flex-col gap-2" data-player-count={states.length}>
            {states.map((p) => {
              const isCurrent = p.id === currentPlayer.id;
              return (
                <div
                  key={p.id}
                  data-state={isCurrent ? 'active' : 'idle'}
                  aria-current={isCurrent ? 'true' : undefined}
                  className={`capital-player flex items-center justify-between rounded-lg border p-2.5 transition-all sm:p-3 ${
                    isCurrent
                      ? 'border-game-active bg-brand-muted shadow-glow-brand'
                      : 'border-border bg-surface-inset'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {isCurrent && <span aria-hidden="true" className="text-xs text-game-active">▶</span>}
                    <span className={`capital-player-name max-w-[48vw] truncate font-bold ${isCurrent ? 'text-base text-fg sm:text-lg' : 'text-fg-subtle'}`} title={p.name}>
                      {p.name}
                    </span>
                  </div>
                  <div className={`capital-player-score font-mono font-black ${isCurrent ? 'text-2xl text-game-score' : 'text-xl text-game-score-inactive'}`}>
                    {p.score}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Fléchettes du tour */}
          <div className={`capital-darts mt-auto flex justify-center ${longKeypad ? 'mb-0.5 sm:mb-1' : 'mb-1 sm:mb-2'}`}>
            {currentTarget === 'CAPITAL' ? (
              <div
                data-state={currentDarts[0] ? 'filled' : 'empty'}
                className={`capital-dart-slot flex h-12 min-w-[72px] items-center justify-center rounded-full border-2 px-4 text-sm font-black sm:h-16 sm:min-w-[96px] sm:text-xl ${
                  currentDarts[0]
                    ? 'bg-surface-raised border-brand text-fg shadow-glow-brand'
                    : 'bg-surface border-border-strong text-fg-disabled'
                }`}
              >
                {currentDarts[0] ? currentDarts[0].value : '-'}
              </div>
            ) : (
              <div className="flex gap-2.5 sm:gap-4">
                {CAPITAL_DART_SLOT_IDS.map((slotId, index) => (
                  <CapitalDartSlot key={slotId} dart={currentDarts[index]} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
      input={(
        <div className={`capital-keypad-frame mx-auto h-full w-full ${longKeypad ? 'max-w-[26rem] px-3 sm:max-w-[40rem] sm:px-4 lg:max-w-[64rem]' : ''}`}>
          <CapitalKeypad
            target={currentTarget}
            onDartInput={handleDartInput}
            onUndo={handleUndo}
            canUndo={history.length > 0}
          />
        </div>
      )}
    >
      {showExitConfirm && (
        <dialog open aria-label="Quitter ?" className="app-modal fixed inset-0 z-[60] m-0 flex h-full w-full max-h-none max-w-none items-center justify-center border-0 bg-scrim p-4 text-fg backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border-strong bg-surface p-6 text-center shadow-elevated">
            <h3 className="mb-2 text-2xl font-black italic uppercase text-fg">Quitter ?</h3>
            <p className="text-sm text-fg-muted">La partie en cours sera abandonnée.</p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => setShowExitConfirm(false)}>NON</Button>
              <Button variant="danger" onClick={onExit}>OUI</Button>
            </div>
          </div>
        </dialog>
      )}
      {showStats && (
        <dialog open aria-label="Statistiques Capital" className="app-modal fixed inset-0 z-[70] m-0 flex h-full w-full max-h-none max-w-none items-center justify-center border-0 bg-scrim p-4 text-fg backdrop-blur-sm">
          <div className="flex h-[min(90vh,760px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border-strong bg-surface shadow-elevated">
            <div className="flex items-center justify-between border-b border-border bg-surface-sunken px-4 py-4 sm:px-6">
              <h3 className="text-lg font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-2 sm:text-2xl">
                Statistiques Capital
              </h3>
              <Button variant="secondary" size="sm" onClick={() => setShowStats(false)} className="text-[11px] sm:text-xs">
                Fermer
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-3">
                {[...states].sort((a, b) => b.score - a.score).map((player) => (
                  <div key={player.id} className="rounded-2xl border border-border-subtle bg-surface-tint p-4">
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <div className="truncate text-lg font-black uppercase text-fg">{player.name}</div>
                      <div className="text-2xl font-black text-brand-fg">{player.score}</div>
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-fg-faint">
                      Objectifs validés : {player.history.filter((entry) => entry.isSuccess).length}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </dialog>
      )}
      {!skipStartingPlayerPrompt && !hasGameStarted && !isGameOver && <StartingPlayerOverlay options={starterOptions} onSelect={handleStarterSelect} onCancel={onExit} />}
    </GameScreenLayout>
  );
};
