import React, { useState, useEffect } from 'react';
import { MatchState } from '../types';
import { submitTurn, undoTurn, calculatePlayerStats, switchStartPlayer, getMinDartsForScore } from '../utils/gameLogic';
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
  
  // Settings States
  const [showCheckoutHints, setShowCheckoutHints] = useState(true);
  
  const currentPlayer = match.players[match.currentPlayerIndex];
  const currentScore = match.currentLeg.scores[currentPlayer.id];

  useEffect(() => {
    if (match.status === 'finished' && match.matchWinnerId) {
      onFinish(match.matchWinnerId);
    }
  }, [match.status, match.matchWinnerId, onFinish]);

  const handleInput = (val: number) => {
    if (inputBuffer.length >= 3) return;
    const newVal = inputBuffer + val.toString();
    if (parseInt(newVal) > 180) return; // Basic sanitization
    setInputBuffer(newVal);
  };

  const handleClear = () => {
    setInputBuffer('');
  };

  const handleSubmitScore = () => {
    if (!inputBuffer) return;
    const score = parseInt(inputBuffer);
    
    // Safety check
    if (score > 180) return;

    // Check if this is a winning shot
    if (score === currentScore && score <= 170) {
         // Intercept for dart count input
         setPendingCheckoutScore(score);
         return;
    }

    const nextState = submitTurn(match, score, 3); // Default 3 darts for normal turn
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

  // Check if checkout is mathematically possible this turn
  const isCheckoutPossible = currentScore <= 170 && currentScore > 1 && ![169, 168, 166, 165, 163, 162, 159].includes(currentScore);
  
  // Is it the start of a leg? (For allowing player switch)
  const isLegStart = match.currentLeg.history.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col md:flex-row relative overflow-hidden">
      
      {/* Top Bar (Mobile) / Side Bar (Desktop) */}
      <div className="bg-gray-900/80 backdrop-blur-md border-b md:border-b-0 md:border-r border-gray-800 p-4 flex justify-between items-center md:flex-col md:w-64 md:h-screen md:justify-start md:space-y-8 z-20">
        <div className="flex flex-col md:items-center">
           <h2 className="font-black text-2xl tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500 drop-shadow-sm">BOUGNAT DARTS</h2>
           <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">First to {match.config.legsToWin}</span>
        </div>
        <div className="flex gap-2 md:flex-col md:w-full">
            <Button variant="secondary" size="sm" onClick={() => setShowSettings(true)} className="md:w-full border-gray-700">⚙️</Button>
            <Button variant="secondary" size="sm" onClick={() => setShowStats(true)} className="md:w-full text-xs font-bold">STATS</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowExitConfirm(true)} className="md:w-full text-red-500 hover:text-red-400 text-xs font-bold uppercase">Exit</Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full relative z-10">
        
        {/* Scores Area (Current Leg) */}
        <div className="flex-1 p-4 grid grid-cols-2 gap-4 items-center content-center min-h-[300px]">
          {match.players.map((p, idx) => {
             const stats = calculatePlayerStats(match, p.id);
             return (
               <PlayerScore 
                 key={p.id}
                 name={p.name}
                 score={match.currentLeg.scores[p.id]}
                 isActive={match.currentPlayerIndex === idx}
                 legsWon={match.legsWon[p.id]}
                 stats={{
                   matchAvg: stats.matchAvg,
                   legAvg: stats.legAvg,
                   legDarts: stats.legDarts,
                   lastScore: match.currentLeg.history.filter(t => t.playerId === p.id).pop()?.score || null
                 }}
               />
             );
          })}
        </div>

        {/* --- MATCH SCORE BANNER --- */}
        <div className="w-full bg-gray-900/50 border-y border-gray-800 backdrop-blur-sm py-3 mb-2 flex items-center justify-center relative overflow-hidden group">
            {/* Ambient Background Light */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-full bg-orange-500/5 blur-xl group-hover:bg-orange-500/10 transition-colors"></div>
            
            <div className="flex items-center space-x-8 md:space-x-16 z-10">
                {match.players.map((p, index) => (
                    <React.Fragment key={p.id}>
                        {index > 0 && (
                            <div className="flex flex-col items-center px-4">
                                <span className="text-[10px] text-orange-500 font-black uppercase tracking-[0.2em]">Legs</span>
                                <span className="text-[9px] text-gray-500 font-bold whitespace-nowrap">First to {match.config.legsToWin}</span>
                            </div>
                        )}
                        <div className={`flex flex-col items-center transition-all duration-300 ${match.currentPlayerIndex === index ? 'scale-110' : 'opacity-70'}`}>
                            <span className={`text-4xl md:text-5xl font-black font-mono leading-none ${match.legsWon[p.id] > match.legsWon[match.players[index === 0 ? 1 : 0].id] ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-gray-400'}`}>
                                {match.legsWon[p.id]}
                            </span>
                        </div>
                    </React.Fragment>
                ))}
            </div>
        </div>

        {/* Active Turn Info & Hint */}
        <div className="px-6 py-1 flex flex-col items-center min-h-[60px] justify-end space-y-2">
            {isLegStart && (
                <button 
                  onClick={handleSwitchStart}
                  className="text-[10px] uppercase font-bold tracking-wider text-gray-500 bg-gray-900/50 px-4 py-1 rounded-full border border-gray-700 hover:text-orange-400 hover:border-orange-500/50 transition-colors"
                >
                   Swap Starting Player ⇄
                </button>
            )}
            {showCheckoutHints && <CheckoutHint score={currentScore} />}
        </div>

        {/* Input Area */}
        <div className="bg-gray-800/80 backdrop-blur-xl p-4 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-gray-700/50">
          <div className="flex justify-between items-center mb-4 px-3">
             <div className="text-gray-400 text-xs uppercase font-bold tracking-wider">Score Input</div>
             <div className="text-3xl font-mono font-bold text-white tracking-widest min-w-[3ch] text-right text-orange-400 drop-shadow-[0_0_10px_rgba(234,88,12,0.5)]">
                 {inputBuffer || <span className="text-gray-700">0</span>}
             </div>
             <Button variant="ghost" size="sm" onClick={handleUndo} disabled={match.currentLeg.history.length === 0} className="text-xs uppercase font-bold">
               Undo
             </Button>
          </div>

          <div className="flex gap-2 h-64 md:h-72">
            {/* Numpad */}
            <div className="flex-1">
               <Keypad 
                 currentInput={inputBuffer}
                 onInput={handleInput}
                 onClear={handleClear}
                 onEnter={handleSubmitScore}
                 isCheckoutPossible={isCheckoutPossible}
               />
            </div>
            
            {/* Action Button */}
            <div className="w-1/4 flex flex-col gap-2">
               <Button 
                 className={`h-full text-2xl font-black rounded-xl transition-all duration-300 ${inputBuffer ? 'scale-[1.02] shadow-[0_0_20px_rgba(234,88,12,0.3)]' : ''}`}
                 variant={isCheckoutPossible && parseInt(inputBuffer || '0') === currentScore ? "primary" : "secondary"}
                 onClick={handleSubmitScore}
               >
                 {isCheckoutPossible && parseInt(inputBuffer || '0') === currentScore ? 'OUT' : 'OK'}
               </Button>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Checkout Darts Modal */}
      {pendingCheckoutScore !== null && (
          <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fadeIn">
             <h2 className="text-3xl font-black italic text-white mb-2 uppercase text-center">Game Shot!</h2>
             <p className="text-gray-400 mb-8 font-bold uppercase tracking-widest text-sm">How many darts?</p>
             
             <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
                 {[1, 2, 3].map(d => {
                     const minDarts = getMinDartsForScore(pendingCheckoutScore);
                     const disabled = d < minDarts;
                     return (
                         <Button 
                            key={d}
                            variant={disabled ? "secondary" : "primary"}
                            onClick={() => !disabled && handleCheckoutConfirm(d)}
                            className={`h-24 text-4xl ${disabled ? 'opacity-20 cursor-not-allowed' : 'shadow-[0_0_30px_rgba(234,88,12,0.5)] scale-100 hover:scale-105'}`}
                            disabled={disabled}
                         >
                             {d}
                         </Button>
                     )
                 })}
             </div>
             <div className="mt-8">
                <Button variant="ghost" onClick={() => setPendingCheckoutScore(null)}>Cancel</Button>
             </div>
          </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-sm border border-gray-700 shadow-2xl">
            <h2 className="text-xl font-black italic text-white mb-6 text-center uppercase">Settings</h2>
            
            <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <span className="text-gray-300 font-bold text-sm">Checkout Guide</span>
                    <button 
                        onClick={() => setShowCheckoutHints(!showCheckoutHints)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${showCheckoutHints ? 'bg-orange-600' : 'bg-gray-600'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-md ${showCheckoutHints ? 'left-7' : 'left-1'}`}></div>
                    </button>
                </div>
            </div>

            <Button className="w-full" onClick={() => setShowSettings(false)}>Close</Button>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-gray-900 rounded-xl p-6 w-full max-w-sm text-center border border-gray-700 shadow-2xl">
              <h3 className="text-2xl font-black text-white mb-2 italic">ABORT GAME?</h3>
              <p className="text-gray-400 mb-8 text-sm">Current match progress will be lost.</p>
              
              <div className="grid grid-cols-2 gap-3">
                  <Button variant="secondary" onClick={() => setShowExitConfirm(false)}>
                      Resume
                  </Button>
                  <Button variant="danger" onClick={onExit}>
                      Quit
                  </Button>
              </div>
           </div>
        </div>
      )}

      {/* Live Stats Modal */}
      {showStats && (
        <StatsModal 
            match={match} 
            onClose={() => setShowStats(false)} 
            title="LIVE MATCH STATS"
        />
      )}

    </div>
  );
};