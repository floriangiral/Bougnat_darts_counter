
import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Player, ClockPlayerState, GameConfig } from '../types';
import { StartingPlayerOverlay } from '../components/game/StartingPlayerOverlay';
import { formatDuration } from '../utils/gameLogic';

interface ClockGameViewProps {
  players: Player[];
  config: GameConfig;
  mode?: 'STANDARD' | '180';
  onExit: () => void;
  onFinish: (results: ClockPlayerState[]) => void;
}

const TARGETS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25];

export const ClockGameView: React.FC<ClockGameViewProps> = ({ players, config, onExit, onFinish, mode = 'STANDARD' }) => {
  // Init state based on players
  const [playerStates, setPlayerStates] = useState<ClockPlayerState[]>(() => 
     players.map(p => ({
         id: p.id,
         name: p.name,
         score: 0,
         totalDarts: 0,
         targetIndex: 0,
         history: []
     }))
  );

  const [globalRoundIndex, setGlobalRoundIndex] = useState(0); // For 180 mode
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(() => Math.max(0, Math.min(players.length - 1, config.initialStartingPlayerIndex ?? 0)));
  const [turnDartsThrown, setTurnDartsThrown] = useState(0);
  
  // Transition state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [hasGameStarted, setHasGameStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }));
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  const currentPlayerState = playerStates[currentPlayerIdx];
  const starterOptions = players.map((player, index) => ({ id: String(index), label: player.name }));
  
  // Target logic
  const currentTargetIndex = mode === '180' ? globalRoundIndex : currentPlayerState.targetIndex;
  const currentTarget = TARGETS[currentTargetIndex];
  const isBull = currentTarget === 25;

  // Auto-transition effect
  useEffect(() => {
      let timer: ReturnType<typeof setTimeout>;
      if (isTransitioning) {
          timer = setTimeout(() => {
              nextStep();
          }, 3000); // 3 seconds transition
      }
      return () => clearTimeout(timer);
  }, [isTransitioning]);

  useEffect(() => {
      const timer = setInterval(() => {
          setCurrentTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }));
          if (hasGameStarted && !isGameOver) {
              setElapsedSeconds((prev) => prev + 1);
          }
      }, 1000);
      return () => clearInterval(timer);
  }, [hasGameStarted, isGameOver]);

  const handleHit = (type: 'MISS' | 'SINGLE' | 'DOUBLE' | 'TRIPLE') => {
    if (isGameOver || isTransitioning || showExitConfirm || !hasGameStarted) return;

    let points = 0;
    let hitSuccess = false;

    if (mode === '180') {
        // 180 Mode: Accumulate points based on multiplier (face value 1, 2, 3)
        if (type === 'SINGLE') points = 1;
        if (type === 'DOUBLE') points = 2;
        if (type === 'TRIPLE') points = 3;
    } else {
        // Standard Mode: Binary success, move to next number
        if (type !== 'MISS') {
            hitSuccess = true;
        }
    }

    // Update Player State
    setPlayerStates(prevStates => {
        const newStates = [...prevStates];
        const p = { ...newStates[currentPlayerIdx] };
        
        p.totalDarts += 1;
        p.score += points;
        p.history.push({ target: currentTarget, points: points, hitType: type });
        
        if (mode === 'STANDARD' && hitSuccess) {
            if (p.targetIndex < TARGETS.length - 1) {
                p.targetIndex += 1;
            } else {
                setIsGameOver(true);
            }
        }
        
        newStates[currentPlayerIdx] = p;
        return newStates;
    });

    const newDartsThrown = turnDartsThrown + 1;
    setTurnDartsThrown(newDartsThrown);

    // End of turn (3 darts fixed)
    if (newDartsThrown >= 3) {
        setTimeout(() => {
            handleTurnEnd();
        }, 300);
    }
  };

  const handleTurnEnd = () => {
      setIsTransitioning(true);
  };

  const nextStep = () => {
      setIsTransitioning(false);
      setTurnDartsThrown(0);
      
      if (isGameOver) return; 

      if (currentPlayerIdx < players.length - 1) {
          setCurrentPlayerIdx(prev => prev + 1);
      } else {
          setCurrentPlayerIdx(0);
          if (mode === '180') {
              if (globalRoundIndex < TARGETS.length - 1) {
                  setGlobalRoundIndex(prev => prev + 1);
              } else {
                  setIsGameOver(true);
              }
          }
      }
  };

  // --- RENDER ---

  // Game Over Screen (Victory Style)
  if (isGameOver) {
      const rankedPlayers = [...playerStates].sort((a, b) => {
          if (mode === '180') return b.score - a.score;
          // Standard: First sort by progress (targetIndex), then by darts thrown
          if (b.targetIndex !== a.targetIndex) return b.targetIndex - a.targetIndex;
          return a.totalDarts - b.totalDarts; 
      });

      const winner = rankedPlayers[0];

      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-black p-4 text-white animate-in fade-in duration-500 sm:p-6">
             <h1 className="mb-4 text-center text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 drop-shadow-[0_0_15px_rgba(234,88,12,0.5)] sm:text-6xl">
                 VAINQUEUR
             </h1>
             <div className="mb-2 text-center text-2xl font-bold uppercase text-white sm:text-4xl">
                 {winner.name}
             </div>
             <div className="mb-12 text-center text-base font-mono uppercase tracking-[0.18em] text-gray-400 sm:text-xl sm:tracking-widest">
                 {mode === '180' ? `${winner.score} Points` : `${winner.totalDarts} Fléchettes`}
             </div>
             
             <div className="w-full max-w-xs space-y-4">
                 <Button onClick={() => onFinish(rankedPlayers)} size="lg" className="w-full h-20 text-2xl uppercase shadow-lg shadow-orange-900/40">
                     Voir les Stats ➔
                 </Button>
             </div>
        </div>
      );
  }

  // Transition Screen
  if (isTransitioning) {
      // Lookahead logic
      let nextPIdx = currentPlayerIdx;
      let nextTargetDisplay = 0;

      if (currentPlayerIdx < players.length - 1) {
          nextPIdx++;
          if (mode === '180') nextTargetDisplay = TARGETS[globalRoundIndex]; 
          else nextTargetDisplay = TARGETS[playerStates[nextPIdx].targetIndex];
      } else {
          nextPIdx = 0;
          if (mode === '180') {
               if (globalRoundIndex < TARGETS.length - 1) nextTargetDisplay = TARGETS[globalRoundIndex + 1];
               else nextTargetDisplay = 999; 
          } else {
               nextTargetDisplay = TARGETS[playerStates[0].targetIndex];
          }
      }
      
      const nextPlayerName = playerStates[nextPIdx].name;
      const displayTgt = nextTargetDisplay === 25 ? 'BULL' : nextTargetDisplay;

      return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900/95 p-4 backdrop-blur-md transition-all duration-300 sm:p-6">
            <style>{`
                @keyframes progress { from { width: 0%; } to { width: 100%; } }
            `}</style>
            
            <div className="relative z-10 w-full max-w-md space-y-6 text-center sm:space-y-8">
                
                {/* Next Player Title */}
                <div className="space-y-2 animate-in slide-in-from-bottom-4 duration-500">
                    <p className="text-gray-400 text-sm uppercase font-bold tracking-[0.2em]">Next Player</p>
                    <h3 className="text-4xl font-black italic text-white sm:text-5xl md:text-6xl">{nextPlayerName}</h3>
                </div>

                {/* Target Circle */}
                {nextTargetDisplay !== 999 && (
                    <div className="relative py-4 animate-in zoom-in duration-300 delay-100">
                        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-gray-700 bg-gray-800 shadow-[0_0_30px_rgba(234,88,12,0.3)] sm:h-32 sm:w-32">
                            <div className="text-center">
                                <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Aim For</div>
                                <div className="text-3xl font-black text-orange-500 sm:text-4xl">{displayTgt}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Score Summary */}
                <div className="bg-black/40 rounded-xl p-4 border border-white/10 animate-in fade-in duration-700">
                    <div className="text-xs text-gray-500 uppercase font-bold mb-3 tracking-wider text-left border-b border-gray-700 pb-2">Classement Provisoire</div>
                    <div className="space-y-2">
                         {playerStates.sort((a,b) => mode === '180' ? b.score - a.score : a.totalDarts - b.totalDarts).map((p, idx) => (
                             <div key={p.id} className="flex justify-between items-center">
                                 <div className={`text-sm font-bold ${p.id === playerStates[nextPIdx].id ? 'text-orange-500' : 'text-gray-500'}`}>
                                     {p.id === playerStates[nextPIdx].id && <span className="mr-2">▶</span>}
                                     {p.name}
                                 </div>
                                 <div className="font-mono font-bold text-gray-300">
                                     {mode === '180' ? `${p.score} pts` : `Target: ${TARGETS[p.targetIndex] === 25 ? 'B' : TARGETS[p.targetIndex]}`}
                                 </div>
                             </div>
                         ))}
                    </div>
                </div>
            </div>

            {/* Bottom Progress Bar */}
            <div className="absolute bottom-0 left-0 w-full h-2 bg-gray-800">
                <div className="h-full bg-gradient-to-r from-orange-600 to-red-600" style={{ animation: 'progress 3s linear forwards' }}></div>
            </div>
        </div>
      );
  }

  // Main Game UI
  const displayTarget = currentTarget === 25 ? 'BULL' : currentTarget;
  const handleStarterSelect = (starterId: string) => {
    setCurrentPlayerIdx(parseInt(starterId, 10) || 0);
    setHasGameStarted(true);
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-black text-white">
      {/* HEADER */}
      <div className="z-20 flex min-h-[78px] shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900 px-3 py-3 sm:min-h-[88px] sm:px-4 sm:py-4">
        <div className="font-black italic text-sm sm:text-lg">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
                {mode === '180' ? '180 ATTACK' : 'CLOCK'}
            </span> 
            {mode === '180' && <span className="ml-2 text-[10px] text-gray-500 sm:text-xs">Round {globalRoundIndex + 1} / {TARGETS.length}</span>}
        </div>
        <div className="flex min-w-[92px] flex-col items-center justify-center sm:min-w-[112px]">
            <div className="mb-1 text-[11px] leading-none text-gray-500 font-mono md:text-xs">{currentTime}</div>
            <div className="text-base font-bold leading-none tracking-[0.18em] text-orange-500 font-mono sm:text-lg md:text-xl">{formatDuration(elapsedSeconds)}</div>
        </div>
        <button onClick={() => setShowExitConfirm(true)} className="text-gray-500 hover:text-white px-2">✕</button>
      </div>

      {/* PLAYER INFO BAR */}
      <div className="flex items-center justify-between border-b border-gray-700/50 bg-gray-800/50 p-2">
          <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Player</span>
              <span className="max-w-[60vw] truncate text-lg font-black text-white sm:text-xl">{currentPlayerState.name}</span>
          </div>
          <div className="flex gap-1">
               {/* Turn Darts Indicators */}
               {[1, 2, 3].map(i => (
                   <div key={i} className={`w-3 h-3 rounded-full ${i <= turnDartsThrown ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'bg-gray-700'}`}></div>
               ))}
          </div>
      </div>

      {/* MAIN TARGET DISPLAY */}
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-3">
          <div className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-gray-600 sm:mb-4 sm:text-sm sm:tracking-[0.5em]">SHOOT AT</div>
          
          <div className="relative flex items-center justify-center">
              {/* Target Number */}
              <div className="z-10 select-none text-[clamp(4.75rem,26vw,14rem)] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 drop-shadow-[0_0_30px_rgba(234,88,12,0.3)]">
                  {displayTarget}
              </div>
          </div>
          
          {/* Current Stats Mini-Display */}
          <div className="absolute right-3 top-3 flex flex-col items-end opacity-60 sm:right-4 sm:top-4">
               <div className="text-[10px] text-gray-400 uppercase font-bold">{mode === '180' ? 'Total Score' : 'Darts Used'}</div>
               <div className="text-2xl font-black text-orange-500 font-mono sm:text-3xl">
                   {mode === '180' ? currentPlayerState.score : currentPlayerState.totalDarts}
               </div>
          </div>
      </div>

      {/* SCOREBOARD STRIP */}
      <div className="shrink-0 overflow-x-auto border-t border-gray-800/50 bg-gray-900/30 p-2">
          <div className="flex gap-2">
              {playerStates.map((p, i) => (
                  <div key={p.id} className={`min-w-[78px] flex-shrink-0 rounded border p-2 sm:min-w-[88px] ${i === currentPlayerIdx ? 'bg-orange-900/20 border-orange-500/50' : 'bg-gray-800/40 border-gray-700'}`}>
                      <div className={`text-[10px] font-bold uppercase truncate ${i === currentPlayerIdx ? 'text-orange-500' : 'text-gray-500'}`}>{p.name}</div>
                      <div className="text-lg font-black text-white mt-1">
                          {mode === '180' ? p.score : (TARGETS[p.targetIndex] || '✓')}
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {/* CONTROLS */}
      <div className="shrink-0 border-t border-gray-800 bg-gray-900 p-2 pb-safe">
          <div className="grid h-auto grid-cols-2 gap-2 md:grid-cols-4 md:h-32">
              <Button 
                variant="danger" 
                onClick={() => handleHit('MISS')} 
                className="h-full min-h-16 bg-red-900/20 text-xl font-black text-red-200 border-red-900/50 hover:bg-red-900/40 sm:text-2xl"
              >
                  MISS
                  <span className="block text-[10px] font-normal text-red-400 mt-1">
                      {mode === '180' ? '0 Pts' : 'Next Dart'}
                  </span>
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => handleHit('SINGLE')} 
                className="h-full min-h-16 bg-gray-800 text-xl font-black text-gray-200 border-gray-700 hover:bg-gray-700 sm:text-2xl"
              >
                  SINGLE
                  <span className="block text-[10px] font-normal text-gray-500 mt-1">
                      {mode === '180' ? '1 Pt' : 'Hit'}
                  </span>
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => handleHit('DOUBLE')} 
                className="h-full min-h-16 bg-gray-800 text-xl font-black text-gray-200 border-gray-700 hover:bg-gray-700 sm:text-2xl"
              >
                  DOUBLE
                  <span className="block text-[10px] font-normal text-gray-500 mt-1">
                      {mode === '180' ? '2 Pts' : 'Hit'}
                  </span>
              </Button>
              
              {!isBull ? (
                 <Button 
                    variant="secondary" 
                    onClick={() => handleHit('TRIPLE')} 
                    className="h-full min-h-16 bg-gray-800 text-xl font-black text-gray-200 border-gray-700 hover:bg-gray-700 sm:text-2xl"
                >
                    TRIPLE
                    <span className="block text-[10px] font-normal text-gray-500 mt-1">
                        {mode === '180' ? '3 Pts' : 'Hit'}
                    </span>
                </Button>
              ) : (
                  <div className="flex min-h-16 items-center justify-center rounded border border-gray-800 bg-gray-900/50 p-2 text-center text-xs font-bold uppercase text-gray-600">
                      No Triple<br/>on Bull
                  </div>
              )}
          </div>
      </div>

      {/* EXIT CONFIRMATION MODAL */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-xl p-6 w-full max-w-sm text-center border border-gray-700 shadow-[0_0_30px_rgba(234,88,12,0.2)]">
                <h3 className="text-2xl font-black text-white mb-2 italic uppercase">Quitter le jeu ?</h3>
                <p className="text-gray-500 text-xs mb-8">La progression sera perdue.</p>
                <div className="grid grid-cols-2 gap-3">
                    <Button variant="secondary" onClick={() => setShowExitConfirm(false)}>NON</Button>
                    <Button variant="danger" onClick={onExit}>OUI</Button>
                </div>
            </div>
        </div>
      )}
      {!hasGameStarted && !isGameOver && <StartingPlayerOverlay options={starterOptions} onSelect={handleStarterSelect} onCancel={onExit} />}
    </div>
  );
};
