import React, { useState, useEffect } from 'react';
import { MatchState } from '../types';
import { submitTurn, undoTurn, switchStartPlayer, getMinDartsForScore, reorderPlayersForDoubles } from '../utils/gameLogic';
import { PlayerScore } from '../components/game/PlayerScore';
import { Keypad } from '../components/game/Keypad';
import { Button } from '../components/ui/Button';
import { CheckoutHint } from '../components/game/CheckoutHint';
import { StatsModal } from '../components/stats/StatsModal';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface MatchViewProps {
  initialMatch: MatchState;
  onFinish: (winnerId: string) => void;
  onFinishWithState?: (winnerId: string, match: MatchState) => void;
  onExit: () => void;
}

export const MatchView: React.FC<MatchViewProps> = ({ initialMatch, onFinish, onFinishWithState, onExit }) => {
  const [match, setMatch] = useState<MatchState>(initialMatch);
  const [inputBuffer, setInputBuffer] = useState<string>('');
  
  // Voice Hook Integration
  const { isListening, transcript, startListening, stopListening, hasRecognitionSupport, resetTranscript, error: voiceError } = useSpeechRecognition();

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
      if (onFinishWithState) {
          onFinishWithState(match.matchWinnerId, match);
      } else {
          onFinish(match.matchWinnerId);
      }
    }
  }, [match.status, match.matchWinnerId, onFinish, onFinishWithState, match]);

  // --- Voice Logic ---
  useEffect(() => {
      if (transcript) {
          // Parsing simple : on cherche les chiffres dans la phrase
          // Ex: "Score de 60" -> ["60"]
          const numbers = transcript.match(/\d+/);
          
          if (numbers && numbers[0]) {
              const val = parseInt(numbers[0]);
              // Validation basique darts (0-180)
              if (!isNaN(val) && val <= 180) {
                  setInputBuffer(val.toString());
                  // Optionnel: On pourrait auto-submit ici si on est très confiant
              }
          }
      }
  }, [transcript]);

  const handleInput = (val: number) => {
    if (inputBuffer.length >= 3) return;
    const newVal = inputBuffer + val.toString();
    if (parseInt(newVal) > 180) return;
    setInputBuffer(newVal);
  };

  const handleClear = () => {
    setInputBuffer('');
    resetTranscript(); // Clear voice buffer too
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
    resetTranscript();
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

  // Toggle Mic
  const handleMicClick = () => {
      if (isListening) {
          stopListening();
      } else {
          startListening();
      }
  };

  const isCheckoutPossible = () => {
      const rule = match.config.checkOut;
      if (rule === 'Double') {
          return currentScore <= 170 && currentScore > 1 && ![169, 168, 166, 165, 163, 162, 159].includes(currentScore);
      }
      return currentScore <= 180 && currentScore > 0;
  };

  const canCheckoutNow = isCheckoutPossible();
  const isLegStart = match.currentLeg.history.length === 0;
  const teams: string[] = Array.from(new Set(match.players.map(p => p.teamId)));

  return (
    <div className="h-[100dvh] w-full bg-black text-white flex flex-col overflow-hidden">
      
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
      <div className="flex-1 relative flex items-stretch min-h-0">
        
        {/* Player 1 Area */}
        <div className="flex-1 border-r border-gray-800/50">
            {teams[0] && renderPlayerArea(teams[0])}
        </div>

        {/* Player 2 Area */}
        <div className="flex-1">
            {teams[1] && renderPlayerArea(teams[1])}
        </div>

        {/* FLOATING MATCH SCORE PILL (Moved to Bottom Center) */}
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none w-full flex flex-col items-center justify-end pb-2 bg-gradient-to-t from-black/80 to-transparent pt-12">
            
            {/* Score Badge */}
            <div className="bg-gray-900/90 backdrop-blur-md border border-gray-700 px-4 py-1 rounded-full shadow-2xl flex items-center space-x-3 mb-1">
                 <span className="text-orange-500 font-black text-xl md:text-2xl font-mono">
                    {teams[0] && (match.config.matchMode === 'SETS' ? match.setsWon[teams[0]] : match.legsWon[teams[0]])}
                 </span>
                 <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                    {match.config.matchMode === 'SETS' ? 'SETS' : 'LEGS'}
                 </span>
                 <span className="text-orange-500 font-black text-xl md:text-2xl font-mono">
                    {teams[1] && (match.config.matchMode === 'SETS' ? match.setsWon[teams[1]] : match.legsWon[teams[1]])}
                 </span>
            </div>
            
             {/* Target (Goal) */}
            <div className="text-[9px] text-gray-400 font-bold bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
                First to {match.config.matchMode === 'SETS' ? match.config.setsToWin : match.config.legsToWin}
            </div>
        </div>

        {/* Checkout Hint Overlay */}
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

             <div className="flex items-center justify-center gap-3">
                 {/* VOICE MICROPHONE BUTTON */}
                 {hasRecognitionSupport && (
                     <button 
                        onClick={handleMicClick}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            voiceError 
                                ? 'bg-red-900 border border-red-500 text-red-500' 
                                : isListening 
                                    ? 'bg-red-600 animate-pulse text-white shadow-[0_0_15px_rgba(220,38,38,0.6)]' 
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                        }`}
                        title={voiceError ? `Erreur: ${voiceError}` : "Appuyer pour annoncer le score"}
                     >
                         {voiceError ? (
                            <span className="text-[10px] font-black">ERR</span>
                         ) : isListening ? (
                             // Waveform animation mock
                             <div className="flex gap-0.5 h-3 items-center">
                                 <div className="w-0.5 bg-white h-full animate-[bounce_0.5s_infinite]"></div>
                                 <div className="w-0.5 bg-white h-2 animate-[bounce_0.5s_infinite_0.1s]"></div>
                                 <div className="w-0.5 bg-white h-full animate-[bounce_0.5s_infinite_0.2s]"></div>
                             </div>
                         ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                            </svg>
                         )}
                     </button>
                 )}

                 <span className="text-3xl font-mono font-bold text-orange-500 tracking-widest min-w-[3ch] text-center drop-shadow-md border-b-2 border-gray-800">
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

      const calculateAvg = (turns: any[]) => {
          const score = turns.reduce((acc, t) => acc + (t.isBust ? 0 : t.score), 0);
          const darts = turns.reduce((acc, t) => acc + t.dartsThrown, 0);
          return darts > 0 ? ((score / darts) * 3).toFixed(1) : "0.0";
      };

      const legTurns = match.currentLeg.history.filter(t => {
          const p = match.players.find(pl => pl.id === t.playerId);
          return p?.teamId === teamId;
      });
      const legAvg = calculateAvg(legTurns);
      const legDarts = legTurns.reduce((acc, t) => acc + t.dartsThrown, 0);

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
      // ... (Rest of renderModals implementation same as before) ...
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