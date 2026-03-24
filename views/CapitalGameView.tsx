import React, { useState } from 'react';
import { Player, CapitalPlayerState, CapitalDart } from '../types';
import { CAPITAL_TARGETS, CAPITAL_TARGET_NAMES, evaluateCapitalRound } from '../utils/capitalLogic';
import { CapitalKeypad } from '../components/game/CapitalKeypad';
import { Button } from '../components/ui/Button';

interface CapitalGameViewProps {
  players: Player[];
  onExit: () => void;
  onFinish: (results: CapitalPlayerState[]) => void;
}

export const CapitalGameView: React.FC<CapitalGameViewProps> = ({ players, onExit, onFinish }) => {
  const [states, setStates] = useState<CapitalPlayerState[]>(() => 
    players.map(p => ({
      id: p.id,
      name: p.name,
      score: 0,
      targetIndex: 0,
      history: []
    }))
  );
  
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [currentDarts, setCurrentDarts] = useState<CapitalDart[]>([]);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const currentPlayer = states[currentPlayerIdx];
  const currentTarget = currentPlayer?.targetIndex < CAPITAL_TARGETS.length ? CAPITAL_TARGETS[currentPlayer.targetIndex] : 'CAPITAL';
  const isGameOver = states.every(s => s.targetIndex >= CAPITAL_TARGETS.length);

  const handleDartInput = (dart: CapitalDart) => {
    if (isGameOver || currentDarts.length >= 3) return;

    const newDarts = [...currentDarts, dart];
    setCurrentDarts(newDarts);

    if (newDarts.length === 3) {
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
    if (currentDarts.length > 0) {
      setCurrentDarts(prev => prev.slice(0, -1));
    } else {
      // Undo last player's turn if possible
      // This is complex in a multiplayer game, skipping for simplicity or implementing basic undo
      // Let's just allow undoing darts in the current turn
    }
  };

  if (isGameOver) {
    const sortedPlayers = [...states].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];
    return (
      <div className="h-[100dvh] bg-black text-white flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
        <h1 className="text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 mb-4 text-center drop-shadow-[0_0_15px_rgba(234,88,12,0.5)]">
          VAINQUEUR
        </h1>
        <div className="text-4xl font-bold text-white mb-2 uppercase text-center">
          {winner.name}
        </div>
        <div className="text-xl text-gray-400 font-mono mb-12 uppercase tracking-widest">
          Score Final: {winner.score}
        </div>
        <Button onClick={() => onFinish(sortedPlayers)} size="lg" className="w-full max-w-xs h-20 text-2xl uppercase shadow-lg shadow-orange-900/40">
          Voir les Stats ➔
        </Button>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-gradient-to-br from-gray-900 to-black text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-12 shrink-0 bg-gray-900 border-b border-gray-800 flex justify-between items-center px-4 z-20">
        <div className="font-black italic text-lg">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500 uppercase">
            CAPITAL
          </span>
        </div>
        <button onClick={() => setShowExitConfirm(true)} className="text-gray-500 hover:text-white px-2">✕</button>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Current Target Info */}
        <div className="bg-gray-800/50 border border-orange-900/30 rounded-xl p-4 text-center shadow-lg">
          <div className="text-sm text-orange-400 font-bold uppercase tracking-widest mb-1">Objectif Actuel</div>
          <div className="text-3xl font-black italic text-white">{CAPITAL_TARGET_NAMES[currentTarget]}</div>
        </div>

        {/* Players List */}
        <div className="flex flex-col gap-2">
          {states.map((p, idx) => (
            <div 
              key={p.id} 
              className={`flex justify-between items-center p-3 rounded-lg border transition-all ${
                idx === currentPlayerIdx 
                  ? 'bg-orange-900/20 border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.2)]' 
                  : 'bg-gray-900/50 border-gray-800 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                {idx === currentPlayerIdx && <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />}
                <span className={`font-bold ${idx === currentPlayerIdx ? 'text-white text-lg' : 'text-gray-400'}`}>
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
        <div className="mt-auto flex justify-center gap-4 mb-2">
          {[0, 1, 2].map(i => {
            const dart = currentDarts[i];
            return (
              <div 
                key={i} 
                className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-black border-2 ${
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
      <div className="h-[45vh] shrink-0 z-30 pb-safe">
        <CapitalKeypad 
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
    </div>
  );
};
