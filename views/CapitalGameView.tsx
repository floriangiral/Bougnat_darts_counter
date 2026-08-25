import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { BarChart3, LogOut } from 'lucide-react';
import { Player, CapitalPlayerState, CapitalDart, GameConfig } from '../types';
import { CAPITAL_TARGETS, CAPITAL_TARGET_NAMES, evaluateCapitalRound, shouldResolveCapitalRound } from '../utils/capitalLogic';
import { CapitalKeypad } from '../components/game/CapitalKeypad';
import { Button } from '../components/ui/Button';
import { StartingPlayerOverlay } from '../components/game/StartingPlayerOverlay';
import { formatDuration, getOrderedPlayersAndStarter } from '../src/application/scoring/matchLifecycle';
import {
  capitalGameReducer,
  createInitialCapitalGameState,
  isCapitalGameOver,
  sortCapitalResults,
} from '../src/features/capital/capitalGameModel';

interface CapitalGameViewProps {
  players: Player[];
  config: GameConfig;
  onExit: () => void;
  onFinish: (results: CapitalPlayerState[]) => void;
  skipStartingPlayerPrompt?: boolean;
}

export const CapitalGameView: React.FC<CapitalGameViewProps> = ({ players, config, onExit, onFinish, skipStartingPlayerPrompt = false }) => {
  const initialRotation = useMemo(() => getOrderedPlayersAndStarter(players, config), [players, config]);
  const [gameState, dispatch] = useReducer(
    capitalGameReducer,
    createInitialCapitalGameState(initialRotation.orderedPlayers, initialRotation.startingPlayerIndex)
  );
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [hasGameStarted, setHasGameStarted] = useState(skipStartingPlayerPrompt);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }));
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
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

  const handleDartInput = (dart: CapitalDart) => {
    if (isGameOver || currentDarts.length >= 3 || !hasGameStarted) return;
    if (currentTarget === 'CAPITAL' && dart.value > 180) return;
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
    dispatch({ type: 'set_starter', currentPlayerIdx: parseInt(starterId, 10) || 0 });
    setHasGameStarted(true);
  };

  if (isGameOver) {
    const sortedPlayers = sortCapitalResults(states);
    const winner = sortedPlayers[0];
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center bg-black p-4 text-white animate-in fade-in duration-500 sm:p-6">
        <h1 className="mb-4 text-center text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 drop-shadow-[0_0_15px_rgba(234,88,12,0.5)] sm:text-6xl">
          VAINQUEUR
        </h1>
        <div className="mb-2 text-center text-2xl font-bold uppercase text-white sm:text-4xl">
          {winner.name}
        </div>
        <div className="mb-12 text-center text-base font-mono uppercase tracking-[0.18em] text-gray-400 sm:text-xl sm:tracking-widest">
          Score Final: {winner.score}
        </div>
        <Button onClick={() => onFinish(sortedPlayers)} size="lg" data-testid="winner-view-stats" className="w-full max-w-xs h-20 text-2xl uppercase shadow-lg shadow-orange-900/40">
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

  return (
    <div className="tablet-capital-root flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Header */}
      <div className="tablet-capital-header z-20 flex min-h-[78px] shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900 px-3 py-3 sm:min-h-[88px] sm:px-4 sm:py-4">
        <div className="flex flex-col gap-1">
          <div className="font-black italic text-base sm:text-lg md:text-xl"><span className="text-white">BOUGNAT</span> <span className="text-orange-500">DARTS</span></div>
        </div>
        <div className="flex min-w-[92px] flex-col items-center justify-center sm:min-w-[112px]">
          <div className="mb-1 text-[11px] leading-none text-gray-500 font-mono md:text-xs">{currentTime}</div>
          <div className="text-base font-bold leading-none tracking-[0.18em] text-orange-500 font-mono sm:text-lg md:text-xl">{formatDuration(elapsedSeconds)}</div>
        </div>
        <div className="flex gap-1.5 sm:gap-2">
          <button
            onClick={() => setShowStats(true)}
            className="inline-flex h-[38px] w-[38px] items-center justify-center rounded border border-gray-700 bg-gray-800 text-[11px] font-bold uppercase text-white transition-colors hover:bg-gray-700 sm:h-[40px] sm:w-[40px] sm:text-xs"
            aria-label="Statistiques"
            title="Statistiques"
          >
            <BarChart3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowExitConfirm(true)}
            className="inline-flex h-[38px] w-[38px] items-center justify-center rounded border border-red-900/30 text-red-500 transition-colors hover:bg-red-950/30 sm:h-[40px] sm:w-[40px]"
            aria-label="Quitter"
            title="Quitter"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="tablet-capital-scoreboard flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 sm:gap-4 sm:p-4">
        {/* Current Target Info */}
        <div className="rounded-xl border border-orange-900/30 bg-gray-800/50 p-3 text-center shadow-lg sm:p-4">
          <div className="flex items-center justify-center gap-3 text-center">
            <div className="flex h-full items-center whitespace-nowrap text-lg font-black italic leading-none text-orange-400 sm:text-xl">
              Objectif Actuel :
            </div>
            <div className="flex h-full items-center whitespace-nowrap text-lg font-black italic leading-none text-white sm:text-xl">
              {CAPITAL_TARGET_NAMES[currentTarget]}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 sm:text-xs">
            <span>Challenge</span>
            <span className="text-white">{currentChallengeNumber}/{CAPITAL_TARGETS.length}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-orange-400 transition-all duration-300"
              style={{ width: `${currentChallengeProgress}%` }}
            />
          </div>
        </div>

        {/* Players List */}
        <div className="flex min-h-0 flex-col gap-2">
          {states.map((p, idx) => (
            <div 
              key={p.id} 
              className={`flex items-center justify-between rounded-lg border p-2.5 transition-all sm:p-3 ${
                p.id === currentPlayer.id
                  ? 'bg-orange-900/20 border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.2)]' 
                  : 'bg-gray-900/50 border-gray-800 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                {p.id === currentPlayer.id && <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />}
                <span className={`max-w-[48vw] truncate font-bold ${p.id === currentPlayer.id ? 'text-white text-base sm:text-lg' : 'text-gray-400'}`}>
                  {p.name}
                </span>
              </div>
              <div className={`font-mono font-black ${p.id === currentPlayer.id ? 'text-2xl text-orange-400' : 'text-xl text-gray-500'}`}>
                {p.score}
              </div>
            </div>
          ))}
        </div>

        {/* Current Darts */}
        <div
          className={`mt-auto flex justify-center ${
            currentTarget === 'SUITE' || currentTarget === 'COTE_A_COTE' || currentTarget === '57' || currentTarget === 'COULEUR' || currentTarget === '21_OU_MOINS'
              ? 'mb-0.5 sm:mb-1'
              : 'mb-1 sm:mb-2'
          }`}
        >
          {currentTarget === 'CAPITAL' ? (
            <div
              className={`flex h-12 min-w-[72px] items-center justify-center rounded-full border-2 px-4 text-sm font-black sm:h-16 sm:min-w-[96px] sm:text-xl ${
                currentDarts[0]
                  ? 'bg-gray-800 border-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.3)]'
                  : 'bg-gray-900 border-gray-700 text-gray-600'
              }`}
            >
              {currentDarts[0] ? currentDarts[0].value : '-'}
            </div>
          ) : (
            <div className="flex gap-2.5 sm:gap-4">
              {[0, 1, 2].map(i => {
                const dart = currentDarts[i];
                return (
                  <div
                    key={i}
                    className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-black sm:h-16 sm:w-16 sm:text-xl ${
                      dart
                        ? 'bg-gray-800 border-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.3)]'
                        : 'bg-gray-900 border-gray-700 text-gray-600'
                    }`}
                  >
                    {dart ? (
                      dart.value === 0 ? 'MISS' :
                      dart.value === 25 ? (dart.multiplier === 2 ? 'DB' : 'B') :
                      `${dart.multiplier === 1 ? '' : dart.multiplier === 2 ? 'D' : 'T'}${dart.value}`
                    ) : '-'}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Keypad */}
      <div
        className={`tablet-capital-control-area legacy-capital-keypad-area z-30 shrink-0 pb-safe ${
          currentTarget === 'SUITE' || currentTarget === 'COTE_A_COTE' || currentTarget === '57' || currentTarget === 'COULEUR' || currentTarget === '21_OU_MOINS'
            ? 'legacy-capital-keypad-area--long h-[clamp(21.5rem,46svh,32rem)] md:h-[clamp(22.5rem,47svh,34rem)]'
            : 'h-[clamp(18rem,40svh,28rem)] md:h-[clamp(20rem,42svh,30rem)]'
        }`}
      >
        <div className={`mx-auto h-full w-full ${currentTarget === 'SUITE' || currentTarget === 'COTE_A_COTE' || currentTarget === '57' || currentTarget === 'COULEUR' || currentTarget === '21_OU_MOINS' ? 'max-w-[26rem] px-3 sm:max-w-[40rem] sm:px-4 lg:max-w-[64rem]' : ''}`}>
          <CapitalKeypad 
            target={currentTarget}
            onDartInput={handleDartInput} 
            onUndo={handleUndo} 
            canUndo={history.length > 0} 
          />
        </div>
      </div>

      {/* Exit Confirmation */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-sm text-center border border-gray-700 shadow-2xl">
            <h3 className="text-2xl font-black text-white mb-2 italic uppercase">Quitter ?</h3>
            <div className="grid grid-cols-2 gap-3 mt-8">
              <Button variant="secondary" onClick={() => setShowExitConfirm(false)}>NON</Button>
              <Button variant="danger" onClick={onExit}>OUI</Button>
            </div>
          </div>
        </div>
      )}
      {showStats && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
          <div className="flex h-[min(90vh,760px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 bg-gray-950 px-4 py-4 sm:px-6">
              <h3 className="text-lg font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 sm:text-2xl">
                Statistiques Capital
              </h3>
              <button onClick={() => setShowStats(false)} className="rounded border border-gray-700 bg-gray-800 px-3 py-2 text-[11px] font-bold uppercase text-white sm:text-xs">
                Fermer
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-3">
                {[...states].sort((a, b) => b.score - a.score).map((player) => (
                  <div key={player.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <div className="truncate text-lg font-black uppercase text-white">{player.name}</div>
                      <div className="text-2xl font-black text-orange-500">{player.score}</div>
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                      Objectifs validés : {player.history.filter((entry) => entry.isSuccess).length}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {!skipStartingPlayerPrompt && !hasGameStarted && !isGameOver && <StartingPlayerOverlay options={starterOptions} onSelect={handleStarterSelect} onCancel={onExit} />}
    </div>
  );
};
