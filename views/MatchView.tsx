
import React, { useState, useEffect, useRef } from 'react';
import { MatchState, Turn } from '../types';
import { submitTurn, undoTurn, getMinDartsForScore, formatDuration } from '../utils/gameLogic';
import { PlayerScore } from '../components/game/PlayerScore';
import { Keypad } from '../components/game/Keypad';
import { Button } from '../components/ui/Button';
import { CheckoutHint } from '../components/game/CheckoutHint';
import { StatsModal } from '../components/stats/StatsModal';
import { MatchSettingsModal } from '../components/game/MatchSettingsModal';
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
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const matchStatusRef = useRef(match.status);
  
  // Voice Hook
  const { isListening, transcript, startListening, stopListening, hasRecognitionSupport, resetTranscript } = useSpeechRecognition();
  
  // Silence Timeout Ref
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modals & UI States
  const [showStats, setShowStats] = useState(false);
  const [showMatchSettings, setShowMatchSettings] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showWinnerScreen, setShowWinnerScreen] = useState(false);
  
  // Game Interaction States
  const [pendingCheckoutScore, setPendingCheckoutScore] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string, type: 'bust' | 'miss' | 'info' } | null>(null);

  // --- SETTINGS STATE (Local to Match) ---
  const [showHints, setShowHints] = useState(true);
  const [shortcutsLeft, setShortcutsLeft] = useState<number[]>([41, 45, 60, 100]);
  const [shortcutsRight, setShortcutsRight] = useState<number[]>([26, 81, 85, 140]);

  useEffect(() => {
    matchStatusRef.current = match.status;
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      if (matchStatusRef.current === 'active') setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [match.status]);

  // Safety cleanup on unmount
  useEffect(() => {
      return () => {
          stopListening();
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      };
  }, [stopListening]);

  // 1. Manage Silence Timeout logic when listening state changes
  useEffect(() => {
      if (isListening) {
          // If we just started listening, set the 3s timeout
          resetSilenceTimer();
      } else {
          // If stopped, clear the timeout
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      }
      return () => { if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current); };
  }, [isListening]);

  // 2. Manage Transcript processing & Timeout reset
  useEffect(() => {
      if (match.config.enableVoice && isListening) {
          // Whenever transcript changes (user is speaking), reset the timeout to keep alive
          if (transcript) {
              resetSilenceTimer();
              
              const result = parseDartsVoiceCommand(transcript);
              if (result.type === 'SCORE' && result.value !== undefined) setInputBuffer(result.value.toString());
              else if (result.type === 'COMMAND_SUBMIT') { if (inputBuffer) handleSubmitScore(); }
              else if (result.type === 'COMMAND_CLEAR') setInputBuffer('');
              else if (result.type === 'COMMAND_UNDO') setMatch(undoTurn(match));
          }
      }
  }, [transcript, isListening, match.config.enableVoice]);

  const resetSilenceTimer = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      
      // Auto-stop after 3 seconds of inactivity (no new transcript or command processing)
      silenceTimerRef.current = setTimeout(() => {
          // Only log if actually active
          if (matchStatusRef.current === 'active') {
             // console.log("Voice Timeout: No input for 3s");
             stopListening();
          }
      }, 3000);
  };

  const handleMicToggle = () => {
      if (isListening) {
          stopListening();
      } else {
          startListening();
      }
  };

  const triggerFeedback = (text: string, type: 'bust' | 'miss' | 'info') => {
      setFeedbackMessage({ text, type });
      setTimeout(() => setFeedbackMessage(null), 1500);
  };

  const processScoreSubmission = (score: number) => {
      if (isNaN(score)) return triggerFeedback("?", "bust");
      if (score > 180) return triggerFeedback("MAX 180", "bust");
      if (score < 0) return triggerFeedback("NEGATIF", "bust");

      const currentPlayer = match.players[match.currentPlayerIndex];
      const currentScore = match.currentLeg.scores[currentPlayer.teamId];
      
      if (score === currentScore) {
           setPendingCheckoutScore(score);
           setInputBuffer(''); 
           return;
      }

      let nextState = submitTurn(match, score, 3);

      // Stop microphone after turn to release resources (Requirement or best practice)
      if (isListening) {
          stopListening();
      }

      if (nextState.status === 'finished') {
          setMatch({ ...nextState, duration: elapsedSeconds });
          setShowWinnerScreen(true);
          return;
      }

      const lastTurn = nextState.currentLeg.history[nextState.currentLeg.history.length - 1];
      if (lastTurn?.isBust) triggerFeedback("TROP !", "bust");
      else if (score >= 100) triggerFeedback(score.toString(), "info");

      setMatch(nextState);
      setInputBuffer('');
      resetTranscript();
  };

  const handleSubmitScore = () => inputBuffer && processScoreSubmission(parseInt(inputBuffer));
  
  const handleRemainingSubmit = () => {
      if (!inputBuffer) return;
      const targetRemaining = parseInt(inputBuffer);
      if (isNaN(targetRemaining)) return;

      const currentPlayer = match.players[match.currentPlayerIndex];
      const currentScore = match.currentLeg.scores[currentPlayer.teamId];

      if (targetRemaining > currentScore) {
          triggerFeedback("IMPOSSIBLE", "bust");
          return;
      }

      const impliedScore = currentScore - targetRemaining;
      
      // Validation du score implicite (ex: score de 200 impossible)
      if (impliedScore > 180) {
           triggerFeedback("MAX 180", "bust");
           return;
      }

      processScoreSubmission(impliedScore);
  };

  const handleQuickScore = (val: number) => {
      processScoreSubmission(val);
  };

  const handleCheckoutConfirm = (dartsUsed: number) => {
     if (pendingCheckoutScore === null) return;
     let nextState = submitTurn(match, pendingCheckoutScore, dartsUsed);
     
     // Stop Mic on Checkout as well
     if (isListening) stopListening();

     if (nextState.status === 'finished') {
         setMatch({ ...nextState, duration: elapsedSeconds });
         setShowWinnerScreen(true);
     } else setMatch(nextState);
     setPendingCheckoutScore(null);
  };

  const currentPlayer = match.players[match.currentPlayerIndex];
  // Fix: Explicitly type teams as string[] to avoid 'unknown' inference error
  const teams = Array.from(new Set(match.players.map(p => p.teamId))) as string[];
  const currentTeamScore = match.currentLeg.scores[currentPlayer.teamId];

  return (
    <div className="h-[100dvh] w-full bg-black text-white flex flex-col overflow-hidden relative">
      <div className="h-14 shrink-0 bg-gray-900 border-b border-gray-800 flex justify-between items-center px-4 z-20">
        <div className="flex flex-col">
           <div className="font-black italic text-sm md:text-lg"><span className="text-white">BOUGNAT</span> <span className="text-orange-500">DARTS</span></div>
           <div className="text-[8px] md:text-[10px] font-mono text-gray-500 uppercase">Sortie: {match.config.checkOut}</div>
        </div>
        
        {/* CENTER TIME & TIMER */}
        <div className="flex flex-col items-center justify-center">
            <div className="text-gray-500 font-mono text-[10px] leading-none mb-1">{currentTime}</div>
            <div className="text-orange-500 font-mono font-bold text-sm md:text-base leading-none tracking-widest">{formatDuration(elapsedSeconds)}</div>
        </div>

        <div className="flex gap-2">
            {/* SETTINGS BUTTON */}
            <button 
                onClick={() => setShowMatchSettings(true)}
                className="p-2 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                title="Options"
            >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                 </svg>
            </button>
            <button onClick={() => setShowStats(true)} className="text-[10px] font-bold uppercase border border-gray-700 px-2 py-1 rounded bg-gray-800">Stats</button>
            <button onClick={() => setShowExitConfirm(true)} className="text-red-500 text-[10px] font-bold uppercase border border-red-900/30 px-2 py-1 rounded">Quitter</button>
        </div>
      </div>

      {/* Main Score Area */}
      <div className="flex-1 relative flex items-stretch">
        {feedbackMessage && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                <div className={`transform rotate-[-5deg] border-4 px-8 py-4 rounded-xl shadow-2xl ${feedbackMessage.type === 'bust' ? 'bg-red-600 border-red-400' : 'bg-cyan-600 border-cyan-400'}`}>
                    <h1 className="text-5xl font-black italic uppercase">{feedbackMessage.text}</h1>
                </div>
            </div>
        )}
        <div className="flex-1 border-r border-gray-800/50">{teams[0] && renderPlayerArea(teams[0])}</div>
        <div className="flex-1">{teams[1] && renderPlayerArea(teams[1])}</div>
        
        {/* Pilule Centrale de Score */}
        <div className="absolute bottom-32 md:bottom-[40dvh] left-1/2 transform -translate-x-1/2 flex flex-col items-center z-20 pointer-events-none">
            {showHints && <CheckoutHint score={currentTeamScore} />}

            <div className="bg-gray-900/95 backdrop-blur-md border border-gray-700 px-5 py-2 md:px-10 md:py-4 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center space-x-4 md:space-x-8 mb-1 pointer-events-auto transition-all duration-300">
                 <div className="flex items-center gap-1.5 md:gap-3">
                    <span className="text-orange-500 font-black text-2xl md:text-6xl font-mono leading-none">
                        {teams[0] ? (match.config.matchMode === 'SETS' ? match.setsWon[teams[0]] : match.legsWon[teams[0]]) : 0}
                    </span>
                    {match.config.matchMode === 'SETS' && teams[0] && (
                        <span className="text-gray-500 font-mono text-xs md:text-xl font-bold">({match.legsWon[teams[0]]})</span>
                    )}
                 </div>

                 <span className="text-[10px] md:text-sm text-gray-600 font-black uppercase tracking-widest border-x border-gray-800 px-3 md:px-6 h-4 md:h-8 flex items-center">
                    {match.config.matchMode === 'SETS' ? 'SETS' : 'LEGS'}
                 </span>

                 <div className="flex items-center gap-1.5 md:gap-3">
                    {match.config.matchMode === 'SETS' && teams[1] && (
                        <span className="text-gray-500 font-mono text-xs md:text-xl font-bold">({match.legsWon[teams[1]]})</span>
                    )}
                    <span className="text-orange-500 font-black text-2xl md:text-6xl font-mono leading-none">
                        {teams[1] ? (match.config.matchMode === 'SETS' ? match.setsWon[teams[1]] : match.legsWon[teams[1]]) : 0}
                    </span>
                 </div>
            </div>
            <div className="text-[9px] md:text-xs text-gray-500 font-bold bg-black/40 px-3 py-1 rounded-full border border-white/5 uppercase tracking-wider backdrop-blur-sm">
                {match.config.matchMode === 'SETS' 
                    ? `Premier à ${match.config.setsToWin} Sets (${match.config.legsToWin} Legs/Set)` 
                    : `Premier à ${match.config.legsToWin} Legs`}
            </div>
        </div>
      </div>

      {/* Control Area */}
      <div className="shrink-0 bg-gray-900 border-t border-gray-800 pb-safe h-[40dvh] flex flex-col z-30 relative shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
         <div className="h-12 bg-black/40 flex items-center justify-between px-4 border-b border-gray-800">
             <div className="text-[10px] font-bold text-gray-500 uppercase">
                {!match.config.enableVoice 
                    ? "IA non activée" 
                    : (isListening ? "À l'écoute..." : "Assistant Prêt")
                }
             </div>
             <div className="text-2xl font-mono font-bold text-orange-500 tracking-widest">{inputBuffer || "---"}</div>
             <button onClick={() => setMatch(undoTurn(match))} className="text-[10px] font-bold text-gray-500 uppercase">Annuler ↶</button>
         </div>
         <div className="flex-1 p-2 flex gap-2">
            <div className="flex-1">
               <Keypad 
                  currentInput={inputBuffer} 
                  onInput={v => setInputBuffer(prev => (prev+v).slice(0,3))} 
                  onClear={() => setInputBuffer('')} 
                  onEnter={handleSubmitScore} 
                  isCheckoutPossible={false} 
                  hasVoiceSupport={hasRecognitionSupport} 
                  isListening={isListening} 
                  onMicClick={handleMicToggle} 
                  isVoiceEnabled={match.config.enableVoice}
                  quickShortcutsLeft={shortcutsLeft}
                  quickShortcutsRight={shortcutsRight}
                  onQuickAction={handleQuickScore}
               />
            </div>
            <div className="w-24 flex flex-col gap-2">
                <Button 
                    variant="secondary" 
                    className="h-1/3 text-xs md:text-sm font-black bg-gray-800 border-gray-700 text-cyan-500 hover:text-white hover:bg-cyan-900 hover:border-cyan-500/50 uppercase leading-tight shadow-md" 
                    onClick={handleRemainingSubmit}
                    title="Entrer le score qu'il reste"
                >
                    RESTE
                </Button>
                <Button 
                    className="flex-1 text-3xl font-black shadow-lg shadow-orange-900/30" 
                    onClick={handleSubmitScore}
                >
                    OK
                </Button>
            </div>
         </div>
      </div>

      {showMatchSettings && (
          <MatchSettingsModal 
              isOpen={showMatchSettings}
              onClose={() => setShowMatchSettings(false)}
              shortcutsLeft={shortcutsLeft}
              shortcutsRight={shortcutsRight}
              onUpdateShortcuts={(side, val) => side === 'left' ? setShortcutsLeft(val) : setShortcutsRight(val)}
              showHints={showHints}
              onToggleHints={() => setShowHints(!showHints)}
          />
      )}

      {showWinnerScreen && (
          <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
             <h1 className="text-6xl font-black italic text-orange-500 mb-4 text-center">VAINQUEUR</h1>
             <div className="text-3xl font-bold text-white mb-12 uppercase border-b-4 border-orange-500 pb-4 text-center">
                 {match.matchWinnerId ? (match.players.find(p => p.teamId === match.matchWinnerId)?.name) : ''}
             </div>
             <Button onClick={() => onFinishWithState ? onFinishWithState(match.matchWinnerId!, match) : onFinish(match.matchWinnerId!)} size="lg" className="w-full max-w-xs h-20 text-2xl uppercase">Voir les Stats ➔</Button>
          </div>
      )}

      {showExitConfirm && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-xl p-6 w-full max-w-sm text-center border border-gray-700">
                <h3 className="text-2xl font-black text-white mb-2 italic uppercase">Quitter le match ?</h3>
                <div className="grid grid-cols-2 gap-3 mt-8">
                    <Button variant="secondary" onClick={() => setShowExitConfirm(false)}>NON</Button>
                    <Button variant="danger" onClick={() => { stopListening(); onExit(); }}>OUI</Button>
                </div>
            </div>
          </div>
      )}

      {pendingCheckoutScore !== null && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6">
              <h2 className="text-3xl font-black italic text-white mb-8 uppercase tracking-tighter">Game Shot !</h2>
              <p className="text-gray-500 mb-4 text-xs font-bold uppercase tracking-widest">Fléchettes utilisées</p>
              
              <div className="flex gap-4 w-full max-w-sm justify-center">
                  {[1, 2, 3]
                    .filter(d => d >= getMinDartsForScore(pendingCheckoutScore, match.config.checkOut))
                    .map(d => (
                      <Button key={d} onClick={() => handleCheckoutConfirm(d)} className="h-20 text-4xl flex-1 shadow-lg border-2 border-gray-800 hover:border-orange-500 transition-all">{d}</Button>
                  ))}
              </div>
          </div>
      )}

      {showStats && <StatsModal match={match} onClose={() => setShowStats(false)} title="Statistiques" />}
    </div>
  );

  function renderPlayerArea(teamId: string) {
      const isTeamActive = currentPlayer.teamId === teamId;
      const teamPlayers = match.players.filter(p => p.teamId === teamId);
      const displayName = match.config.isDoubles ? (teamId === 'team1' ? 'ÉQUIPE 1' : 'ÉQUIPE 2') : teamPlayers[0]?.name;
      
      const calcAvg = (history: Turn[]) => {
          const s = history.reduce((a, t) => a + (t.isBust ? 0 : t.score), 0);
          const d = history.reduce((a, t) => a + t.dartsThrown, 0);
          return d > 0 ? ((s / d) * 3).toFixed(1) : "0.0";
      };

      const allHistory = [...match.completedLegs, match.currentLeg].flatMap(l => l.history).filter(t => match.players.find(pl => pl.id === t.playerId)?.teamId === teamId);
      
      return (
        <PlayerScore 
            name={displayName} 
            isActive={isTeamActive} 
            score={match.currentLeg.scores[teamId]} 
            legsWon={match.legsWon[teamId]}
            stats={{
                matchAvg: calcAvg(allHistory),
                legAvg: calcAvg(match.currentLeg.history.filter(t => match.players.find(pl => pl.id === t.playerId)?.teamId === teamId)),
                legDarts: match.currentLeg.history.filter(t => match.players.find(pl => pl.id === t.playerId)?.teamId === teamId).reduce((a, t) => a + t.dartsThrown, 0),
                lastScore: allHistory[allHistory.length-1]?.score || null
            }}
        />
      );
  }
};
