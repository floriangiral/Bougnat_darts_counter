import React, { useState, useEffect, useRef } from 'react';
import { MatchState } from '../types';
import { submitTurn, undoTurn, switchStartPlayer, getMinDartsForScore, reorderPlayersForDoubles, formatDuration } from '../utils/gameLogic';
import { PlayerScore } from '../components/game/PlayerScore';
import { Keypad } from '../components/game/Keypad';
import { Button } from '../components/ui/Button';
import { CheckoutHint } from '../components/game/CheckoutHint';
import { StatsModal } from '../components/stats/StatsModal';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { parseDartsVoiceCommand } from '../utils/voiceParser';

interface MatchViewProps {
  initialMatch: MatchState;
  onFinish: (winnerId: string) => void;
  onFinishWithState?: (winnerId: string, match: MatchState) => void;
  onExit: () => void;
}

export const MatchView: React.FC<MatchViewProps> = ({ initialMatch, onFinish, onFinishWithState, onExit }) => {
  const [match, setMatch] = useState<MatchState>(initialMatch);
  const [inputBuffer, setInputBuffer] = useState<string>('');
  
  // Clock & Duration State
  const [currentTime, setCurrentTime] = useState<string>(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  // Ref to track status inside interval without resetting it
  const matchStatusRef = useRef(match.status);
  useEffect(() => { matchStatusRef.current = match.status; }, [match.status]);

  // Quick Actions State (Defaults)
  const [quickShortcuts, setQuickShortcuts] = useState<{ left: number[], right: number[] }>({
      left: [180, 140, 100, 60, 26], // 20s focus
      right: [171, 133, 95, 57, 19]  // 19s focus
  });

  // Voice Hook Integration
  const { 
      isListening, 
      transcript, 
      startListening, 
      hasRecognitionSupport, 
      resetTranscript, 
      error: voiceError,
      isLoadingModel,
      isModelMissing
  } = useSpeechRecognition();

  // UI States
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [pendingCheckoutScore, setPendingCheckoutScore] = useState<number | null>(null);
  const [lastVoiceCommand, setLastVoiceCommand] = useState<string | null>(null);
  
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

  // --- Clock & Duration Timer ---
  useEffect(() => {
    const timer = setInterval(() => {
      // Update Clock
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      
      // Update Duration if active
      if (matchStatusRef.current === 'active') {
          setElapsedSeconds(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- Voice Logic (Vosk + Darts Parser) ---
  useEffect(() => {
      if (transcript) {
          console.log("Processing Transcript:", transcript);
          const result = parseDartsVoiceCommand(transcript);
          
          if (result.type !== 'UNKNOWN') {
             setLastVoiceCommand(transcript);
             setTimeout(() => setLastVoiceCommand(null), 3000);
             resetTranscript();
          }

          if (result.type === 'SCORE' && result.value !== undefined) {
              setInputBuffer(result.value.toString());
          } 
          else if (result.type === 'COMMAND_SUBMIT') {
              if (inputBuffer) {
                  handleSubmitScore();
              }
          }
          else if (result.type === 'COMMAND_CLEAR') {
              handleClear();
          }
          else if (result.type === 'COMMAND_UNDO') {
              handleUndo();
          }
      }
  }, [transcript, resetTranscript, inputBuffer]); 

  const handleInput = (val: number) => {
    if (inputBuffer.length >= 3) return;
    const newVal = inputBuffer + val.toString();
    if (parseInt(newVal) > 180) return;
    setInputBuffer(newVal);
  };

  const handleClear = () => {
    setInputBuffer('');
    resetTranscript(); 
  };

  const getMaxCheckout = (rule: 'Open' | 'Double' | 'Master') => {
      if (rule === 'Double') return 170;
      return 180;
  };

  // Centralized submission logic
  const processScoreSubmission = (score: number) => {
      if (isNaN(score)) return;
      if (score > 180) return;

      const maxCheckout = getMaxCheckout(match.config.checkOut);
      
      // If potential checkout, ask for darts used
      if (score === currentScore && score <= maxCheckout) {
           setPendingCheckoutScore(score);
           // Clear input buffer so keypad looks clean while modal is up
           setInputBuffer(''); 
           return;
      }

      // Otherwise submit immediately with default 3 darts
      let nextState = submitTurn(match, score, 3);
      
      // Capture duration if match finished
      if (nextState.status === 'finished') {
          nextState = { ...nextState, duration: elapsedSeconds };
      }

      setMatch(nextState);
      setInputBuffer('');
      resetTranscript();
  };

  const handleSubmitScore = () => {
    if (!inputBuffer) return;
    processScoreSubmission(parseInt(inputBuffer));
  };

  // Quick Action Handler - Instantly Submits
  const handleQuickAction = (val: number) => {
      // Just call the processor. It handles validation and auto-checkout modal if needed.
      processScoreSubmission(val);
  };

  const handleCheckoutConfirm = (dartsUsed: number) => {
     if (pendingCheckoutScore === null) return;
     let nextState = submitTurn(match, pendingCheckoutScore, dartsUsed);
     
     // Capture duration if match finished
     if (nextState.status === 'finished') {
         nextState = { ...nextState, duration: elapsedSeconds };
     }
     
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

  const handleMicClick = () => {
      if (!isListening && !isModelMissing && !isLoadingModel) {
          startListening();
      } 
  };

  const updateShortcut = (side: 'left' | 'right', index: number, valStr: string) => {
      const val = parseInt(valStr);
      if (isNaN(val)) return;
      
      setQuickShortcuts(prev => {
          const newArr = side === 'left' ? [...prev.left] : [...prev.right];
          newArr[index] = val;
          return { ...prev, [side]: newArr };
      });
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
    <div className="h-[100dvh] w-full bg-black text-white flex flex-col overflow-hidden relative">
      
      {/* 1. HEADER (Time, Logo, Config) */}
      <div className="h-14 shrink-0 bg-gray-900 border-b border-gray-800 flex justify-between items-center px-4 z-20 relative select-none">
        
        {/* CENTER CLOCK & DURATION (Absolute) */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center">
             <span className="font-mono text-gray-500 font-bold text-sm md:text-base opacity-80 tracking-widest bg-gray-900 px-2 rounded leading-none">
                 {currentTime}
             </span>
             <span className="font-mono text-[10px] text-gray-600 font-bold tracking-widest mt-0.5">
                 {formatDuration(elapsedSeconds)}
             </span>
        </div>

        {/* LEFT: Logo & Rules */}
        <div className="flex flex-col items-start justify-center z-10">
           <div className="font-black italic text-sm md:text-lg tracking-tight leading-none">
                <span className="text-white">BOUGNAT</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">DARTS</span>
           </div>
           <div className="flex items-center gap-2 text-[8px] md:text-[10px] font-mono text-gray-500 leading-none mt-1">
               <span className="whitespace-nowrap">IN: <span className="text-gray-300 font-bold">{match.config.checkIn}</span></span>
               <span className="text-gray-700">|</span>
               <span className="whitespace-nowrap">OUT: <span className="text-gray-300 font-bold">{match.config.checkOut}</span></span>
           </div>
        </div>

        {/* RIGHT: Buttons */}
        <div className="flex gap-3 z-10">
            <button onClick={() => setShowSettings(true)} className="text-gray-400 hover:text-white transition-colors">⚙️</button>
            <button onClick={() => setShowStats(true)} className="text-gray-400 hover:text-white text-[10px] md:text-xs font-bold uppercase border border-gray-700 px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 transition-colors">Stats</button>
            <button onClick={() => setShowExitConfirm(true)} className="text-red-500 hover:text-red-400 text-[10px] md:text-xs font-bold uppercase border border-red-900/30 px-2 py-1 rounded bg-red-900/10 hover:bg-red-900/30 transition-colors">Exit</button>
        </div>
      </div>

      {/* 2. MAIN SCORE AREA */}
      <div className="flex-1 relative flex items-stretch min-h-0 z-0">
        
        {/* Player 1 Area */}
        <div className="flex-1 border-r border-gray-800/50">
            {teams[0] && renderPlayerArea(teams[0])}
        </div>

        {/* Player 2 Area */}
        <div className="flex-1">
            {teams[1] && renderPlayerArea(teams[1])}
        </div>

        {/* FLOATING MATCH SCORE PILL */}
        <div className="absolute bottom-32 md:bottom-24 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none w-full flex flex-col items-center justify-end">
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

      {/* 3. INPUT AREA & VOICE CONSOLE */}
      <div className="shrink-0 bg-gray-900 border-t border-gray-800 pb-safe h-[42dvh] flex flex-col relative z-30">
         
         {/* --- VOICE CONSOLE & UTILITY BAR --- */}
         <div className="h-14 shrink-0 bg-black/40 flex items-center justify-between px-2 relative border-b border-gray-800/50">
             {/* Background Tech Pattern */}
             <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjEiLz4KPGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoNiwgMTgyLCAyMTIsIDAuMDUpIi8+Cjwvc3ZnPg==')] opacity-30 pointer-events-none"></div>

             {/* LEFT: Utility Action (Swap Start) */}
             <div className="w-20 flex justify-start z-10">
                {!showStarterSelection && isLegStart && (
                    <button 
                        onClick={handleSwitchStart} 
                        className="text-[10px] font-bold text-gray-500 hover:text-cyan-400 border border-gray-700 hover:border-cyan-500 rounded px-2 py-1 uppercase transition-colors"
                    >
                        Swap Start
                    </button>
                )}
             </div>

             {/* CENTER: The Console Display */}
             <div className="flex-1 mx-2 h-10 bg-black/60 rounded border border-gray-700/50 flex items-center justify-center relative overflow-hidden shadow-inner">
                 {/* Status Light */}
                 <div className={`absolute left-2 w-1.5 h-1.5 rounded-full ${
                     isModelMissing ? 'bg-red-900' : 
                     isLoadingModel ? 'bg-yellow-500 animate-pulse' :
                     isListening ? 'bg-cyan-500 animate-pulse shadow-[0_0_8px_cyan]' : 
                     'bg-green-500'
                 }`}></div>
                 
                 {/* Main Readout */}
                 <div className="flex flex-col items-center justify-center leading-none">
                     {/* The Input Buffer (Draft Score) */}
                     {inputBuffer ? (
                         <span className="text-2xl font-mono font-bold text-orange-500 tracking-widest drop-shadow-sm">
                             {inputBuffer}
                         </span>
                     ) : (
                         <div className="flex flex-col items-center">
                            {/* Voice Feedback Text */}
                            <span className={`font-mono text-xs font-bold uppercase tracking-wider ${
                                isModelMissing ? 'text-red-600' :
                                isLoadingModel ? 'text-yellow-500' :
                                isListening ? 'text-cyan-400' : 
                                'text-gray-600'
                            }`}>
                                {isModelMissing ? "IA NON DISPONIBLE" :
                                 isLoadingModel ? "INITIALISATION..." : 
                                 isListening ? (transcript || "LISTENING...") : 
                                 lastVoiceCommand ? `CMD: ${lastVoiceCommand}` : 
                                 "READY • LOCAL"}
                            </span>
                            {/* Subtext */}
                            {voiceError && !isModelMissing && <span className="text-[8px] text-red-500 font-bold uppercase">{voiceError}</span>}
                         </div>
                     )}
                 </div>
             </div>

             {/* RIGHT: Utility Action (Undo) */}
             <div className="w-20 flex justify-end z-10">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleUndo} 
                    disabled={match.currentLeg.history.length === 0} 
                    className="text-xs font-bold text-gray-400 hover:text-white px-0"
                >
                    UNDO ↶
                </Button>
             </div>
         </div>

         {/* Keypad Layout */}
         <div className="flex flex-1 px-2 pb-2 gap-2 min-h-0 pt-2">
            <div className="flex-1">
               <Keypad 
                 currentInput={inputBuffer}
                 onInput={handleInput}
                 onClear={handleClear}
                 onEnter={handleSubmitScore}
                 isCheckoutPossible={canCheckoutNow}
                 // Passing Voice Props
                 hasVoiceSupport={hasRecognitionSupport}
                 isModelMissing={isModelMissing}
                 onMicClick={handleMicClick}
                 isListening={isListening}
                 isLoadingModel={isLoadingModel}
                 // Quick Actions
                 quickShortcutsLeft={quickShortcuts.left}
                 quickShortcutsRight={quickShortcuts.right}
                 onQuickAction={handleQuickAction}
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
      // (Implementation same as existing)
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
      // (Implementation same as existing)
      return (
          <>
            {showStarterSelection && (
                <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6">
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
                <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6">
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
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-gray-700 max-h-[80vh] overflow-y-auto">
                    <h2 className="text-xl font-black text-white mb-6 text-center uppercase">Settings</h2>
                    
                    {/* General Settings */}
                    <div className="flex justify-between items-center p-4 bg-gray-800 rounded-lg mb-4">
                        <span className="text-gray-300 font-bold text-sm">Checkout Hints</span>
                        <button onClick={() => setShowCheckoutHints(!showCheckoutHints)} className={`w-12 h-6 rounded-full relative transition-colors ${showCheckoutHints ? 'bg-orange-600' : 'bg-gray-600'}`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showCheckoutHints ? 'left-7' : 'left-1'}`}></div>
                        </button>
                    </div>

                    {/* Quick Keys Configuration */}
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 mb-6">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                             Quick Keys Config 
                             <span className="text-[9px] bg-gray-700 px-1 rounded text-gray-300">Tablet / Desktop</span>
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                            {/* Left Col (20s) */}
                            <div className="space-y-2">
                                <div className="text-center text-[10px] text-cyan-500 font-bold uppercase">Left (20s Focus)</div>
                                {quickShortcuts.left.map((val, idx) => (
                                    <input 
                                        key={`L-conf-${idx}`}
                                        type="number"
                                        min="0"
                                        max="180"
                                        className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-center font-mono font-bold text-cyan-500 focus:border-cyan-500 focus:outline-none"
                                        value={val}
                                        onChange={(e) => updateShortcut('left', idx, e.target.value)}
                                    />
                                ))}
                            </div>

                            {/* Right Col (19s) */}
                            <div className="space-y-2">
                                <div className="text-center text-[10px] text-orange-500 font-bold uppercase">Right (19s Focus)</div>
                                {quickShortcuts.right.map((val, idx) => (
                                    <input 
                                        key={`R-conf-${idx}`}
                                        type="number"
                                        min="0"
                                        max="180"
                                        className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-center font-mono font-bold text-orange-500 focus:border-orange-500 focus:outline-none"
                                        value={val}
                                        onChange={(e) => updateShortcut('right', idx, e.target.value)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <Button className="w-full" onClick={() => setShowSettings(false)}>Close</Button>
                </div>
                </div>
            )}

            {showExitConfirm && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
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