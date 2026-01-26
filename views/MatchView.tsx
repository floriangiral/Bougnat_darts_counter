import React, { useState, useEffect } from 'react';
import { MatchState } from '../types';
import { submitTurn, undoTurn, calculatePlayerStats, switchStartPlayer, getMinDartsForScore, reorderPlayersForDoubles } from '../utils/gameLogic';
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
  
  // Helper for starter modal
  const team1Players = match.players.filter(p => p.teamId === 'team1');
  const team2Players = match.players.filter(p => p.teamId === 'team2');

  // Local State for Doubles Starter Selection
  // Pre-select the first player of each team to avoid needing to click if default order is fine
  const [selectedT1StarterId, setSelectedT1StarterId] = useState<string>(team1Players[0]?.id || '');
  const [selectedT2StarterId, setSelectedT2StarterId] = useState<string>(team2Players[0]?.id || '');

  // Settings States
  const [showCheckoutHints, setShowCheckoutHints] = useState(true);
  
  const currentPlayer = match.players[match.currentPlayerIndex];
  // Score is now looked up by teamId
  const currentScore = match.currentLeg.scores[currentPlayer.teamId];

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

  const getMaxCheckout = (rule: 'Open' | 'Double' | 'Master') => {
      if (rule === 'Double') return 170;
      return 180; // Open and Master can technically finish on 180
  };

  const handleSubmitScore = () => {
    if (!inputBuffer) return;
    const score = parseInt(inputBuffer);
    
    // Safety check
    if (score > 180) return;

    // Check if this is a winning shot
    // Note: This validation depends on the 'Out' rule.
    const maxCheckout = getMaxCheckout(match.config.checkOut);
    
    if (score === currentScore && score <= maxCheckout) {
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

  // Check if checkout is mathematically possible this turn
  const isCheckoutPossible = () => {
      const rule = match.config.checkOut;
      if (rule === 'Double') {
          return currentScore <= 170 && currentScore > 1 && ![169, 168, 166, 165, 163, 162, 159].includes(currentScore);
      }
      // Open / Master
      return currentScore <= 180 && currentScore > 0;
  };

  const canCheckoutNow = isCheckoutPossible();
  
  // Is it the start of a leg? (For allowing player switch)
  const isLegStart = match.currentLeg.history.length === 0;

  const getFormatLabel = () => {
      if (match.config.matchMode === 'SETS') {
          return `First to ${match.config.setsToWin} Sets`;
      }
      return `First to ${match.config.legsToWin} Legs`;
  }

  // Group players by Team ID for display
  const teams = Array.from(new Set(match.players.map(p => p.teamId)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col md:flex-row relative overflow-hidden">
      
      {/* Top Bar (Mobile) / Side Bar (Desktop) */}
      <div className="bg-gray-900/80 backdrop-blur-md border-b md:border-b-0 md:border-r border-gray-800 p-4 flex justify-between items-center md:flex-col md:w-64 md:h-screen md:justify-start md:space-y-8 z-20">
        <div className="flex flex-col md:items-center">
           <h2 className="font-black text-2xl tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500 drop-shadow-sm">BOUGNAT DARTS</h2>
           <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">{getFormatLabel()}</span>
           <div className="mt-2 flex gap-2 text-[9px] font-mono text-gray-600 bg-gray-950 px-2 py-1 rounded border border-gray-800">
               <span>IN: <span className="text-gray-400">{match.config.checkIn}</span></span>
               <span>|</span>
               <span>OUT: <span className="text-orange-500">{match.config.checkOut}</span></span>
           </div>
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
          {teams.map((teamId) => {
             const teamPlayersLocal = match.players.filter(p => p.teamId === teamId);
             
             // Name display
             const displayName = match.config.isDoubles 
                ? (teamId === 'team1' ? 'TEAM 1' : 'TEAM 2') 
                : teamPlayersLocal[0].name;

             // Active Logic: Is the current player in this team?
             const isTeamActive = currentPlayer.teamId === teamId;
             
             // Current Thrower Name (if doubles)
             const throwerName = isTeamActive && match.config.isDoubles ? currentPlayer.name : undefined;

             // Team Avg Calculation
             const teamTurns = [...match.completedLegs, match.currentLeg].flatMap(l => l.history).filter(t => {
                 const p = match.players.find(pl => pl.id === t.playerId);
                 return p?.teamId === teamId;
             });
             
             const teamTotalScore = teamTurns.reduce((acc, t) => acc + (t.isBust ? 0 : t.score), 0);
             const teamTotalDarts = teamTurns.reduce((acc, t) => acc + t.dartsThrown, 0);
             const teamAvg = teamTotalDarts > 0 ? ((teamTotalScore / teamTotalDarts) * 3).toFixed(1) : "0.0";
             
             // Last Score for team
             const lastTurn = match.currentLeg.history.slice().reverse().find(t => {
                  const p = match.players.find(pl => pl.id === t.playerId);
                  return p?.teamId === teamId;
             });

             return (
               <PlayerScore 
                 key={teamId}
                 name={displayName}
                 currentThrowerName={throwerName}
                 score={match.currentLeg.scores[teamId]}
                 isActive={isTeamActive}
                 legsWon={match.legsWon[teamId]}
                 setsWon={match.config.matchMode === 'SETS' ? match.setsWon[teamId] : undefined}
                 stats={{
                   matchAvg: teamAvg, // Team Average
                   legAvg: teamAvg, // Simplified for MVP (leg avg is same logic but filtered)
                   legDarts: 0, // Hard to calc team leg darts easily without util update, hide for now
                   lastScore: lastTurn?.score || null
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
                {teams.map((teamId, index) => {
                    const score = match.config.matchMode === 'SETS' ? match.setsWon[teamId] : match.legsWon[teamId];
                    const opponentId = teams[index === 0 ? 1 : 0];
                    const opponentScore = match.config.matchMode === 'SETS' ? match.setsWon[opponentId] : match.legsWon[opponentId];
                    const label = match.config.matchMode === 'SETS' ? 'SETS' : 'LEGS';
                    const target = match.config.matchMode === 'SETS' ? match.config.setsToWin : match.config.legsToWin;
                    
                    const isTeamActive = currentPlayer.teamId === teamId;

                    return (
                        <React.Fragment key={teamId}>
                            {index > 0 && (
                                <div className="flex flex-col items-center px-4">
                                    <span className="text-[10px] text-orange-500 font-black uppercase tracking-[0.2em]">{label}</span>
                                    <span className="text-[9px] text-gray-500 font-bold whitespace-nowrap">First to {target}</span>
                                </div>
                            )}
                            <div className={`flex flex-col items-center transition-all duration-300 ${isTeamActive ? 'scale-110' : 'opacity-70'}`}>
                                <span className={`text-4xl md:text-5xl font-black font-mono leading-none ${score > opponentScore ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-gray-400'}`}>
                                    {score}
                                </span>
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>
        </div>

        {/* Active Turn Info & Hint */}
        <div className="px-6 py-1 flex flex-col items-center min-h-[60px] justify-end space-y-2">
            {!showStarterSelection && isLegStart && (
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
                 isCheckoutPossible={canCheckoutNow}
               />
            </div>
            
            {/* Action Button */}
            <div className="w-1/4 flex flex-col gap-2">
               <Button 
                 className={`h-full text-2xl font-black rounded-xl transition-all duration-300 ${inputBuffer ? 'scale-[1.02] shadow-[0_0_20px_rgba(234,88,12,0.3)]' : ''}`}
                 variant={canCheckoutNow && parseInt(inputBuffer || '0') === currentScore ? "primary" : "secondary"}
                 onClick={handleSubmitScore}
               >
                 {canCheckoutNow && parseInt(inputBuffer || '0') === currentScore ? 'OUT' : 'OK'}
               </Button>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      
      {/* Starter Selection Modal for Doubles */}
      {showStarterSelection && (
          <div className="absolute inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-fadeIn">
             <h2 className="text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 mb-8 uppercase text-center drop-shadow-sm">Match Setup</h2>
             <p className="text-gray-500 mb-6 uppercase text-xs font-bold tracking-widest">Select the first thrower for each team</p>
             
             <div className="grid grid-cols-2 gap-4 w-full max-w-lg mb-8">
                 {/* Team 1 Selection */}
                 <div className="space-y-3 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                     <div className="text-center text-orange-500 font-bold uppercase text-sm mb-2">Team 1 Leader</div>
                     {team1Players.map(p => (
                         <Button 
                            key={p.id} 
                            variant={selectedT1StarterId === p.id ? "primary" : "secondary"}
                            onClick={() => setSelectedT1StarterId(p.id)} 
                            className={`w-full py-4 text-sm transition-all ${selectedT1StarterId === p.id ? 'scale-105 shadow-lg' : 'opacity-70'}`}
                         >
                             {p.name}
                         </Button>
                     ))}
                 </div>

                 {/* Team 2 Selection */}
                 <div className="space-y-3 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                     <div className="text-center text-orange-500 font-bold uppercase text-sm mb-2">Team 2 Leader</div>
                     {team2Players.map(p => (
                         <Button 
                            key={p.id} 
                            variant={selectedT2StarterId === p.id ? "primary" : "secondary"}
                            onClick={() => setSelectedT2StarterId(p.id)} 
                            className={`w-full py-4 text-sm transition-all ${selectedT2StarterId === p.id ? 'scale-105 shadow-lg' : 'opacity-70'}`}
                         >
                             {p.name}
                         </Button>
                     ))}
                 </div>
             </div>

             <div className="w-full max-w-lg">
                <p className="text-white mb-4 uppercase text-xs font-bold tracking-widest text-center">Who throws first?</p>
                <div className="grid grid-cols-2 gap-4">
                    <Button 
                        size="lg" 
                        variant="ghost"
                        onClick={() => handleConfirmDoublesStart('team1')}
                        className="border-2 border-orange-600 text-orange-500 hover:bg-orange-600 hover:text-white"
                    >
                        TEAM 1
                    </Button>
                    <Button 
                        size="lg" 
                        variant="ghost"
                        onClick={() => handleConfirmDoublesStart('team2')}
                        className="border-2 border-orange-600 text-orange-500 hover:bg-orange-600 hover:text-white"
                    >
                        TEAM 2
                    </Button>
                </div>
             </div>
          </div>
      )}

      {/* Checkout Darts Modal */}
      {pendingCheckoutScore !== null && (
          <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fadeIn">
             <h2 className="text-3xl font-black italic text-white mb-2 uppercase text-center">Game Shot!</h2>
             <p className="text-gray-400 mb-8 font-bold uppercase tracking-widest text-sm">How many darts?</p>
             
             <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
                 {[1, 2, 3].map(d => {
                     const minDarts = getMinDartsForScore(pendingCheckoutScore, match.config.checkOut);
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