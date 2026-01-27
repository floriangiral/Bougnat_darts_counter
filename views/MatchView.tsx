import React, { useState, useEffect } from 'react';
import { MatchState } from '../types';
import { submitTurn, undoTurn, switchStartPlayer, getMinDartsForScore, reorderPlayersForDoubles } from '../utils/gameLogic';
import { PlayerScore } from '../components/game/PlayerScore';
import { Keypad } from '../components/game/Keypad';
import { Button } from '../components/ui/Button';
import { CheckoutHint } from '../components/game/CheckoutHint';
import { StatsModal } from '../components/stats/StatsModal';

interface MatchViewProps {
  initialMatch: MatchState;
  onFinish: (winnerId: string) => void;
  onExit: () => void;
}

export const MatchView: React.FC<MatchViewProps> = ({ initialMatch, onFinish, onExit }) => {
  const [match, setMatch] = useState<MatchState>(initialMatch);
  const [inputBuffer, setInputBuffer] = useState<string>('');
  
  // UI States
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [pendingCheckoutScore, setPendingCheckoutScore] = useState<number | null>(null);
  
  // Doubles Starter Selection State
  const [showStarterSelection, setShowStarterSelection] = useState<boolean>(initialMatch.config.isDoubles);
  
  const team1Players = match.players.filter(p => p.teamId === 'team1');
  const team2Players = match.players.filter(p => p.teamId === 'team2');

  const [selectedT1StarterId, setSelectedT1StarterId] = useState<string>(team1Players[0]?.id || '');
  const [selectedT2StarterId, setSelectedT2StarterId] = useState<string>(team2Players[0]?.id || '');

  const [showCheckoutHints, setShowCheckoutHints] = useState(true);
  
  const currentPlayer = match.players[match.currentPlayerIndex];
  const currentScore = match.currentLeg.scores[currentPlayer.teamId];

  useEffect(() => {
    if (match.status === 'finished' && match.matchWinnerId) {
      onFinish(match.matchWinnerId);
    }
  }, [match.status, match.matchWinnerId, onFinish]);

  const handleInput = (val: number) => {
    if (inputBuffer.length >= 3) return;
    const newVal = inputBuffer + val.toString();
    if (parseInt(newVal) > 180) return;
    setInputBuffer(newVal);
  };

  const handleClear = () => {
    setInputBuffer('');
  };

  const getMaxCheckout = (rule: 'Open' | 'Double' | 'Master') => {
      if (rule === 'Double') return 170;
      return 180;
  };

  const handleSubmitScore = () => {
    if (!inputBuffer) return;
    const score = parseInt(inputBuffer);
    if (score > 180) return;

    const maxCheckout = getMaxCheckout(match.config.checkOut);
    
    if (score === currentScore && score <= maxCheckout) {
         setPendingCheckoutScore(score);
         return;
    }

    const nextState = submitTurn(match, score, 3);
    setMatch(nextState);
    setInputBuffer('');
  };

  const handleCheckoutConfirm = (dartsUsed: number) => {
     if (pendingCheckoutScore === null) return;
     const nextState = submitTurn(match, pendingCheckoutScore, dartsUsed);
     setMatch(nextState);
     setInputBuffer('');
     setPendingCheckoutScore(null);
  }

  const handleUndo = () => {
    setMatch(undoTurn(match));
    setInputBuffer('');
  };

  const handleSwitchStart = () => {
     setMatch(switchStartPlayer(match));
  };
  
  const handleConfirmDoublesStart = (startingTeamId: string) => {
      const updatedMatch = reorderPlayersForDoubles(
          match, 
          selectedT1StarterId, 
          selectedT2StarterId, 
          startingTeamId
      );
      setMatch(updatedMatch);
      setShowStarterSelection(false);
  }

  const isCheckoutPossible = () => {
      const rule = match.config.checkOut;
      if (rule === 'Double') {
          return currentScore <= 170 && currentScore > 1 && ![169, 168, 166, 165, 163, 162, 159].includes(currentScore);
      }
      return currentScore <= 180 && currentScore > 0;
  };

  const canCheckoutNow = isCheckoutPossible();
  const isLegStart = match.currentLeg.history.length === 0;
  const teams = Array.from(new Set(match.players.map(p => p.teamId)));

  return (
    <div className="h-screen w-full bg-black text-white flex flex-col overflow-hidden">
      
      {/* 1. COMPACT HEADER */}
      <div className="h-12 shrink-0 bg-gray-900 border-b border-gray-800 flex justify-between items-center px-4 z-20">
        <div className="flex items-center gap-2">
           <span className="font-black italic text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
               BOUGNAT
           </span>
           <div className="hidden md:flex gap-2 text-[9px] font-mono text-gray-500 px-2 py-0.5 rounded border border-gray-800">
               <span>IN: {match.config.checkIn}</span>
               <span>OUT: {match.config.checkOut}</span>
           </div>
        </div>
        <div className="flex gap-3">
            <button onClick={() => setShowSettings(true)} className="text-gray-400 hover:text-white">⚙️</button>
            <button onClick={() => setShowStats(true)} className="text-gray-400 hover:text-white text-xs font-bold uppercase">Stats</button>
            <button onClick={() => setShowExitConfirm(true)} className="text-red-500 hover:text-red-400 text-xs font-bold uppercase">Exit</button>
        </div>
      </div>

      {/* 2. MAIN SCORE AREA (Flex Grow) */}
      <div className="flex-1 relative flex items-stretch">
        
        {/* Player 1 Area */}
        <div className="flex-1 border-r border-gray-800/50">
            {renderPlayerArea(teams[0])}
        </div>

        {/* Player 2 Area */}
        <div className="flex-1">
            {renderPlayerArea(teams[1])}
        </div>

        {/* FLOATING MATCH SCORE PILL (Moved to Bottom Center) */}
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none w-full flex flex-col items-center justify-end pb-2 bg-gradient-to-t from-black/80 to-transparent pt-12">
            
            {/* Score Badge */}
            <div className="bg-gray-900/90 backdrop-blur-md border border-gray-700 px-4 py-1 rounded-full shadow-2xl flex items-center space-x-3 mb-1">
                 <span className="text-orange-500 font-black text-xl md:text-2xl font-mono">
                    {match.config.matchMode === 'SETS' ? match.setsWon[teams[0]] : match.legsWon[teams[0]]}
                 </span>
                 <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                    {match.config.matchMode === 'SETS' ? 'SETS' : 'LEGS'}
                 </span>
                 <span className="text-orange-500 font-black text-xl md:text-2xl font-mono">
                    {match.config.matchMode === 'SETS' ? match.setsWon[teams[1]] : match.legsWon[teams[1]]}
                 </span>
            </div>
            
             {/* Target (Goal) */}
            <div className="text-[9px] text-gray-400 font-bold bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
                First to {match.config.matchMode === 'SETS' ? match.config.setsToWin : match.config.legsToWin}
            </div>
        </div>

        {/* Checkout Hint Overlay (Bottom Center of Score Area - BELOW the Pill) */}
        {showCheckoutHints && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center z-10 pointer-events-none">
                 <CheckoutHint score={currentScore} />
            </div>
        )}
      </div>

      {/* 3. INPUT AREA (Fixed Bottom) */}
      <div className="shrink-0 bg-gray-900 border-t border-gray-800 pb-safe pt-2">
         {/* Buffer Display & Actions Bar */}
         <div className="flex justify-between items-center px-4 mb-2 h-10">
             {!showStarterSelection && isLegStart ? (
                <button onClick={handleSwitchStart} className="text-[10px] text-gray-500 uppercase font-bold border border-gray-700 rounded-full px-3 py-1 hover:text-orange-500">
                    Swap Start
                </button>
             ) : (
                <div className="w-20"></div> // Spacer
             )}

             <div className="flex items-center justify-center">
                 <span className="text-3xl font-mono font-bold text-orange-500 tracking-widest min-w-[3ch] text-center drop-shadow-md">
                     {inputBuffer || <span className="text-gray-800 opacity-20">0</span>}
                 </span>
             </div>

             <Button variant="ghost" size="sm" onClick={handleUndo} disabled={match.currentLeg.history.length === 0} className="text-xs font-bold text-gray-400 hover:text-white w-20 justify-end">
                UNDO ↶
             </Button>
         </div>

         {/* Keypad Layout */}
         <div className="flex px-2 pb-2 h-48 md:h-56 gap-2">
            <div className="flex-1">
               <Keypad 
                 currentInput={inputBuffer}
                 onInput={handleInput}
                 onClear={handleClear}
                 onEnter={handleSubmitScore}
                 isCheckoutPossible={canCheckoutNow}
               />
            </div>
            <div className="w-[22%]">
               <Button 
                 className={`h-full w-full text-xl md:text-3xl font-black rounded-xl transition-all duration-200 ${canCheckoutNow && parseInt(inputBuffer || '0') === currentScore ? 'bg-gradient-to-b from-orange-500 to-red-600 shadow-lg shadow-orange-900/50' : 'bg-gray-800 text-gray-400'}`}
                 onClick={handleSubmitScore}
               >
                 {canCheckoutNow && parseInt(inputBuffer || '0') === currentScore ? 'OUT' : 'OK'}
               </Button>
            </div>
         </div>
      </div>

      {/* --- MODALS --- */}
      {renderModals()}
    </div>
  );

  function renderPlayerArea(teamId: string) {
      const teamPlayersLocal = match.players.filter(p => p.teamId === teamId);
      const displayName = match.config.isDoubles 
        ? (teamId === 'team1' ? 'TEAM 1' : 'TEAM 2') 
        : teamPlayersLocal[0]?.name || 'Player';

      const isTeamActive = currentPlayer.teamId === teamId;
      const throwerName = isTeamActive && match.config.isDoubles ? currentPlayer.name : undefined;

      // --- STATS CALCULATION (Separated Leg vs Match) ---
      
      const calculateAvg = (turns: any[]) => {
          const score = turns.reduce((acc, t) => acc + (t.isBust ? 0 : t.score), 0);
          const darts = turns.reduce((acc, t) => acc + t.dartsThrown, 0);
          return darts > 0 ? ((score / darts) * 3).toFixed(1) : "0.0";
      };

      // 1. Current Leg Stats
      const legTurns = match.currentLeg.history.filter(t => {
          const p = match.players.find(pl => pl.id === t.playerId);
          return p?.teamId === teamId;
      });
      const legAvg = calculateAvg(legTurns);
      const legDarts = legTurns.reduce((acc, t) => acc + t.dartsThrown, 0);

      // 2. Match Stats (All Legs)
      const allTurns = [...match.completedLegs, match.currentLeg].flatMap(l => l.history).filter(t => {
          const p = match.players.find(pl => pl.id === t.playerId);
          return p?.teamId === teamId;
      });
      const matchAvg = calculateAvg(allTurns);
      
      const lastTurn = match.currentLeg.history.slice().reverse().find(t => {
          const p = match.players.find(pl => pl.id === t.playerId);
          return p?.teamId === teamId;
      });

      return (
        <PlayerScore 
            name={displayName}
            currentThrowerName={throwerName}
            score={match.currentLeg.scores[teamId]}
            isActive={isTeamActive}
            legsWon={match.legsWon[teamId]}
            setsWon={match.config.matchMode === 'SETS' ? match.setsWon[teamId] : undefined}
            stats={{
                matchAvg: matchAvg,
                legAvg: legAvg,
                legDarts: legDarts,
                lastScore: lastTurn?.score || null
            }}
        />
      );
  }

  function renderModals() {
      return (
          <>
            {showStarterSelection && (
                <div className="absolute inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6">
                    <h2 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 mb-6 uppercase">Bull Up</h2>
                    <div className="grid grid-cols-2 gap-4 w-full max-w-lg mb-8">
                        {/* Team 1 */}
                        <div className="space-y-2">
                            <div className="text-center text-orange-500 font-bold uppercase text-xs">Team 1 First</div>
                            {team1Players.map(p => (
                                <Button key={p.id} variant={selectedT1StarterId === p.id ? "primary" : "secondary"} onClick={() => setSelectedT1StarterId(p.id)} className="w-full py-3 text-sm">{p.name}</Button>
                            ))}
                        </div>
                        {/* Team 2 */}
                        <div className="space-y-2">
                            <div className="text-center text-orange-500 font-bold uppercase text-xs">Team 2 First</div>
                            {team2Players.map(p => (
                                <Button key={p.id} variant={selectedT2StarterId === p.id ? "primary" : "secondary"} onClick={() => setSelectedT2StarterId(p.id)} className="w-full py-3 text-sm">{p.name}</Button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                        <Button variant="ghost" onClick={() => handleConfirmDoublesStart('team1')} className="border border-orange-600 text-orange-500">T1 STARTS</Button>
                        <Button variant="ghost" onClick={() => handleConfirmDoublesStart('team2')} className="border border-orange-600 text-orange-500">T2 STARTS</Button>
                    </div>
                </div>
            )}

            {pendingCheckoutScore !== null && (
                <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6">
                    <h2 className="text-3xl font-black italic text-white mb-8 uppercase">Game Shot!</h2>
                    <p className="text-gray-500 mb-4 text-xs font-bold uppercase tracking-widest">Darts Used</p>
                    <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
                        {[1, 2, 3].map(d => {
                            const minDarts = getMinDartsForScore(pendingCheckoutScore, match.config.checkOut);
                            const disabled = d < minDarts;
                            return (
                                <Button key={d} variant={disabled ? "secondary" : "primary"} onClick={() => !disabled && handleCheckoutConfirm(d)} className={`h-20 text-4xl ${disabled ? 'opacity-20' : ''}`} disabled={disabled}>{d}</Button>
                            )
                        })}
                    </div>
                    <div className="mt-8"><Button variant="ghost" onClick={() => setPendingCheckoutScore(null)}>Cancel</Button></div>
                </div>
            )}

            {showSettings && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-gray-900 rounded-xl p-6 w-full max-w-sm border border-gray-700">
                    <h2 className="text-xl font-black text-white mb-6 text-center uppercase">Settings</h2>
                    <div className="flex justify-between items-center p-4 bg-gray-800 rounded-lg mb-6">
                        <span className="text-gray-300 font-bold text-sm">Checkout Hints</span>
                        <button onClick={() => setShowCheckoutHints(!showCheckoutHints)} className={`w-12 h-6 rounded-full relative transition-colors ${showCheckoutHints ? 'bg-orange-600' : 'bg-gray-600'}`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showCheckoutHints ? 'left-7' : 'left-1'}`}></div>
                        </button>
                    </div>
                    <Button className="w-full" onClick={() => setShowSettings(false)}>Close</Button>
                </div>
                </div>
            )}

            {showExitConfirm && (
                <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-gray-900 rounded-xl p-6 w-full max-w-sm text-center border border-gray-700">
                    <h3 className="text-2xl font-black text-white mb-2 italic">QUIT MATCH?</h3>
                    <div className="grid grid-cols-2 gap-3 mt-8">
                        <Button variant="secondary" onClick={() => setShowExitConfirm(false)}>No</Button>
                        <Button variant="danger" onClick={onExit}>Yes</Button>
                    </div>
                </div>
                </div>
            )}

            {showStats && <StatsModal match={match} onClose={() => setShowStats(false)} title="Match Stats" />}
          </>
      );
  }
};
