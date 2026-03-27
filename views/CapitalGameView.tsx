import React, { useEffect, useState } from 'react';
import { Player, CapitalPlayerState, CapitalDart, GameConfig } from '../types';
import { CAPITAL_TARGETS, CAPITAL_TARGET_NAMES, evaluateCapitalRound, shouldResolveCapitalRound } from '../utils/capitalLogic';
import { CapitalKeypad } from '../components/game/CapitalKeypad';
import { Button } from '../components/ui/Button';
import { StartingPlayerOverlay } from '../components/game/StartingPlayerOverlay';
import { formatDuration } from '../utils/gameLogic';

interface CapitalGameViewProps {
  players: Player[];
  config: GameConfig;
  onExit: () => void;
  onFinish: (results: CapitalPlayerState[]) => void;
  skipStartingPlayerPrompt?: boolean;
}

export const CapitalGameView: React.FC<CapitalGameViewProps> = ({ players, config, onExit, onFinish, skipStartingPlayerPrompt = false }) => {
  const [states, setStates] = useState<CapitalPlayerState[]>(() => 
    players.map(p => ({
      id: p.id,
      name: p.name,
      score: 0,
      targetIndex: 0,
      history: []
    }))
  );
  
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(() => Math.max(0, Math.min(players.length - 1, config.initialStartingPlayerIndex ?? 0)));
  const [currentDarts, setCurrentDarts] = useState<CapitalDart[]>([]);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [hasGameStarted, setHasGameStarted] = useState(skipStartingPlayerPrompt);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }));
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showStats, setShowStats] = useState(false);

  const currentPlayer = states[currentPlayerIdx];
  const currentTarget = currentPlayer?.targetIndex < CAPITAL_TARGETS.length ? CAPITAL_TARGETS[currentPlayer.targetIndex] : 'CAPITAL';
  const isGameOver = states.every(s => s.targetIndex >= CAPITAL_TARGETS.length);
  const starterOptions = players.map((player, index) => ({ id: String(index), label: player.name }));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }));
      if (hasGameStarted && !isGameOver) {
        setElapsedSeconds((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [hasGameStarted, isGameOver]);

  const handleDartInput = (dart: CapitalDart) => {
    if (isGameOver || currentDarts.length >= 3 || !hasGameStarted) return;

    const newDarts = [...currentDarts, dart];
    setCurrentDarts(newDarts);

    if (shouldResolveCapitalRound(currentTarget, newDarts)) {
      setTimeout(() => {
        const { newScore, pointsScored, isSuccess } = evaluateCapitalRound(currentTarget, newDarts, currentPlayer.score);
        
        setStates(prev => {
          const copy = [...prev];
          const playerState = { ...copy[currentPlayerIdx] };
          
          playerState.history = [...playerState.history, {
            target: currentTarget,
            darts: newDarts,
            pointsScored,
            isSuccess
          }];
          
          playerState.score = newScore;
          playerState.targetIndex += 1;
          
          copy[currentPlayerIdx] = playerState;
          return copy;
        });

        setCurrentDarts([]);
        setCurrentPlayerIdx(prev => (prev + 1) % players.length);
      }, 500);
    }
  };

  const handleUndo = () => {
    if (!hasGameStarted) return;
    if (currentDarts.length > 0) {
      setCurrentDarts(prev => prev.slice(0, -1));
    } else {
      // Undo last player's turn if possible
      // This is complex in a multiplayer game, skipping for simplicity or implementing basic undo
      // Let's just allow undoing darts in the current turn
    }
  };
  const handleStarterSelect = (starterId: string) => {
    setCurrentPlayerIdx(parseInt(starterId, 10) || 0);
    setHasGameStarted(true);
  };

  if (isGameOver) {
    const sortedPlayers = [...states].sort((a, b) => b.score - a.score);
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
        <Button onClick={() => onFinish(sortedPlayers)} size="lg" className="w-full max-w-xs h-20 text-2xl uppercase shadow-lg shadow-orange-900/40">
          Voir les Stats ➔
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Header */}
      <div className="z-20 flex min-h-[78px] shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900 px-3 py-3 sm:min-h-[88px] sm:px-4 sm:py-4">
        <div className="flex flex-col gap-1">
          <div className="font-black italic text-base sm:text-lg md:text-xl"><span className="text-white">BOUGNAT</span> <span className="text-orange-500">DARTS</span></div>
        </div>
        <div className="flex min-w-[92px] flex-col items-center justify-center sm:min-w-[112px]">
          <div className="mb-1 text-[11px] leading-none text-gray-500 font-mono md:text-xs">{currentTime}</div>
          <div className="text-base font-bold leading-none tracking-[0.18em] text-orange-500 font-mono sm:text-lg md:text-xl">{formatDuration(elapsedSeconds)}</div>
        </div>
        <div className="flex gap-1.5 sm:gap-2">
          <button onClick={() => setShowStats(true)} className="rounded border border-gray-700 bg-gray-800 px-3 py-2 text-[11px] font-bold uppercase text-white sm:px-3.5 sm:py-2 sm:text-xs">Stats</button>
          <button onClick={() => setShowExitConfirm(true)} className="rounded border border-red-900/30 px-3 py-2 text-[11px] font-bold uppercase text-red-500 sm:px-3.5 sm:py-2 sm:text-xs">Quitter</button>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 sm:gap-4 sm:p-4">
        {/* Current Target Info */}
        <div className="rounded-xl border border-orange-900/30 bg-gray-800/50 p-3 text-center shadow-lg sm:p-4">
          <div className="text-sm text-orange-400 font-bold uppercase tracking-widest mb-1">Objectif Actuel</div>
          <div className="text-2xl font-black italic text-white sm:text-3xl">{CAPITAL_TARGET_NAMES[currentTarget]}</div>
        </div>

        {/* Players List */}
        <div className="flex min-h-0 flex-col gap-2">
          {states.map((p, idx) => (
            <div 
              key={p.id} 
              className={`flex items-center justify-between rounded-lg border p-2.5 transition-all sm:p-3 ${
                idx === currentPlayerIdx 
                  ? 'bg-orange-900/20 border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.2)]' 
                  : 'bg-gray-900/50 border-gray-800 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                {idx === currentPlayerIdx && <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />}
                <span className={`max-w-[48vw] truncate font-bold ${idx === currentPlayerIdx ? 'text-white text-base sm:text-lg' : 'text-gray-400'}`}>
                  {p.name}
                </span>
              </div>
              <div className={`font-mono font-black ${idx === currentPlayerIdx ? 'text-2xl text-orange-400' : 'text-xl text-gray-500'}`}>
                {p.score}
              </div>
            </div>
          ))}
        </div>

        {/* Current Darts */}
        <div className="mb-1 mt-auto flex justify-center gap-2.5 sm:mb-2 sm:gap-4">
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
      </div>

      {/* Keypad */}
      <div className="z-30 h-[clamp(17rem,38svh,26rem)] shrink-0 pb-safe md:h-[clamp(18rem,40svh,28rem)]">
        <CapitalKeypad 
          target={currentTarget}
          onDartInput={handleDartInput} 
          onUndo={handleUndo} 
          canUndo={currentDarts.length > 0} 
        />
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
