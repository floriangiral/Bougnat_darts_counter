import React, { useState, useEffect, useRef } from 'react';
import { MatchState, Turn } from '../types';
import { submitTurn, undoTurn, getMinDartsForScore, formatDuration } from '../utils/gameLogic';
import { PlayerScore } from '../components/game/PlayerScore';
import { Keypad } from '../components/game/Keypad';
import { Button } from '../components/ui/Button';
import { CheckoutHint } from '../components/game/CheckoutHint';
import { StatsModal } from '../components/stats/StatsModal';
import { subscribeToSharedMatchSession, supabase, updateSharedMatchSessionState } from '../lib/supabase';

interface MatchViewProps {
  initialMatch: MatchState;
  onFinish: (winnerId: string) => void;
  onFinishWithState?: (winnerId: string, match: MatchState) => void;
  onExit: () => void;
  sharedSessionId?: string;
  currentUserId?: string;
}

export const MatchView: React.FC<MatchViewProps> = ({
  initialMatch,
  onFinish,
  onFinishWithState,
  onExit,
  sharedSessionId,
  currentUserId,
}) => {
  const [match, setMatch] = useState<MatchState>(initialMatch);
  const [inputBuffer, setInputBuffer] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const matchStatusRef = useRef(match.status);
  const syncInFlightRef = useRef(false);

  // Modals & UI States
  const [showStats, setShowStats] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showWinnerScreen, setShowWinnerScreen] = useState(false);
  
  // Game Interaction States
  const [pendingCheckoutScore, setPendingCheckoutScore] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string, type: 'bust' | 'miss' | 'info' } | null>(null);

  // Match UI state
  const showHints = true;
  const [shortcutsLeft, setShortcutsLeft] = useState<number[]>([41, 45, 60, 100]);
  const [shortcutsRight, setShortcutsRight] = useState<number[]>([26, 81, 85, 140]);

  useEffect(() => {
    setMatch(initialMatch);
  }, [initialMatch]);

  useEffect(() => {
    matchStatusRef.current = match.status;
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      if (matchStatusRef.current === 'active') setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [match.status]);

  useEffect(() => {
    if (!sharedSessionId) return;

    const channel = subscribeToSharedMatchSession(sharedSessionId, (row) => {
      if (!row?.match_state) return;
      syncInFlightRef.current = true;
      setMatch(row.match_state as MatchState);
      if ((row.match_state as MatchState).status === 'finished') {
        setShowWinnerScreen(true);
      }
      window.setTimeout(() => {
        syncInFlightRef.current = false;
      }, 120);
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sharedSessionId]);

  const triggerFeedback = (text: string, type: 'bust' | 'miss' | 'info') => {
      setFeedbackMessage({ text, type });
      setTimeout(() => setFeedbackMessage(null), 1500);
  };

  const persistSharedState = async (nextState: MatchState) => {
    if (!sharedSessionId) return;

    await updateSharedMatchSessionState(sharedSessionId, {
      matchState: nextState as unknown as Record<string, unknown>,
      status: nextState.status === 'finished' ? 'finished' : 'active',
    });
  };

  const ensureCurrentPlayerCanAct = () => {
    if (!sharedSessionId || !currentUserId) return true;
    if (match.players[match.currentPlayerIndex]?.id !== currentUserId) {
      triggerFeedback('WAIT', 'miss');
      return false;
    }
    return true;
  };

  const processScoreSubmission = (score: number) => {
      if (!ensureCurrentPlayerCanAct()) return;
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

      if (nextState.status === 'finished') {
          setMatch({ ...nextState, duration: elapsedSeconds });
          setShowWinnerScreen(true);
          void persistSharedState({ ...nextState, duration: elapsedSeconds });
          return;
      }

      const lastTurn = nextState.currentLeg.history[nextState.currentLeg.history.length - 1];
      if (lastTurn?.isBust) triggerFeedback("TROP !", "bust");
      else if (score >= 100) triggerFeedback(score.toString(), "info");

      setMatch(nextState);
      void persistSharedState(nextState);
      setInputBuffer('');
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
      if (!ensureCurrentPlayerCanAct()) return;
      processScoreSubmission(val);
  };

  const handleCheckoutConfirm = (dartsUsed: number) => {
     if (!ensureCurrentPlayerCanAct()) return;
     if (pendingCheckoutScore === null) return;
     let nextState = submitTurn(match, pendingCheckoutScore, dartsUsed);
     
     if (nextState.status === 'finished') {
         const finalState = { ...nextState, duration: elapsedSeconds };
         setMatch(finalState);
         setShowWinnerScreen(true);
         void persistSharedState(finalState);
     } else {
         setMatch(nextState);
         void persistSharedState(nextState);
     }
     setPendingCheckoutScore(null);
  };

  const currentPlayer = match.players[match.currentPlayerIndex];
  // Fix: Explicitly type teams as string[] to avoid 'unknown' inference error
  const teams = Array.from(new Set(match.players.map(p => p.teamId))) as string[];
  const currentTeamScore = match.currentLeg.scores[currentPlayer.teamId];
  const feedbackStyles = getFeedbackStyles(feedbackMessage?.type);

  return (
    <div className="relative flex h-[100dvh] w-full min-h-0 flex-col overflow-hidden bg-black text-white">
      <div className="z-20 flex min-h-14 shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900 px-2 py-2 sm:px-4">
        <div className="flex flex-col">
           <div className="font-black italic text-xs sm:text-sm md:text-lg"><span className="text-white">BOUGNAT</span> <span className="text-orange-500">DARTS</span></div>
           <div className="text-[8px] font-mono uppercase text-gray-500 md:text-[10px]">Sortie: {match.config.checkOut}</div>
        </div>
        
        {/* CENTER TIME & TIMER */}
        <div className="flex min-w-[72px] flex-col items-center justify-center sm:min-w-[96px]">
            <div className="mb-1 text-[9px] leading-none text-gray-500 font-mono md:text-[10px]">{currentTime}</div>
            <div className="text-xs font-bold leading-none tracking-[0.18em] text-orange-500 font-mono sm:text-sm md:text-base">{formatDuration(elapsedSeconds)}</div>
        </div>

        <div className="flex gap-1.5 sm:gap-2">
            <button onClick={() => setShowStats(true)} className="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-[9px] font-bold uppercase text-white sm:text-[10px]">Stats</button>
            <button onClick={() => setShowExitConfirm(true)} className="rounded border border-red-900/30 px-2 py-1 text-[9px] font-bold uppercase text-red-500 sm:text-[10px]">Quitter</button>
        </div>
      </div>

      {/* Main Score Area */}
      <div className="relative flex min-h-0 flex-1 items-stretch">
        {feedbackMessage && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                <div className={`relative overflow-hidden rounded-[1.75rem] border ${feedbackStyles.border} ${feedbackStyles.surface} px-7 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)]`}>
                    <div className={`absolute inset-x-0 top-0 h-1 ${feedbackStyles.accent}`} />
                    <div className="relative flex flex-col items-center text-center">
                        <span className={`mb-2 text-[10px] font-black uppercase tracking-[0.32em] ${feedbackStyles.kicker}`}>
                            {feedbackStyles.label}
                        </span>
                        <h1 className={`text-4xl font-black italic uppercase leading-none sm:text-5xl ${feedbackStyles.value}`}>
                            {feedbackMessage.text}
                        </h1>
                    </div>
                </div>
            </div>
        )}
        <div className="flex-1 border-r border-gray-800/50">{teams[0] && renderPlayerArea(teams[0])}</div>
        <div className="flex-1">{teams[1] && renderPlayerArea(teams[1])}</div>
        
        {/* Match Status */}
        <div className="pointer-events-none absolute left-1/2 top-3 z-20 flex -translate-x-1/2 transform flex-col items-center gap-2 sm:top-4">
            <div className="pointer-events-auto flex max-w-[92vw] items-center gap-2 rounded-full border border-gray-700/80 bg-gray-900/88 px-3 py-1.5 shadow-[0_0_22px_rgba(0,0,0,0.42)] backdrop-blur-md sm:max-w-none sm:gap-3 sm:px-4 sm:py-2">
                 <div className="flex items-center gap-1.5">
                    <span className="text-base font-black leading-none text-orange-500 font-mono sm:text-lg md:text-xl">
                        {teams[0] ? (match.config.matchMode === 'SETS' ? match.setsWon[teams[0]] : match.legsWon[teams[0]]) : 0}
                    </span>
                    {match.config.matchMode === 'SETS' && teams[0] && (
                        <span className="text-[9px] font-bold text-gray-500 font-mono sm:text-[10px] md:text-sm">({match.legsWon[teams[0]]})</span>
                    )}
                 </div>

                 <span className="flex h-5 items-center border-x border-gray-800 px-2 text-[8px] font-black uppercase tracking-[0.16em] text-gray-500 sm:px-3 sm:text-[9px] md:text-[10px] md:tracking-[0.22em]">
                    {match.config.matchMode === 'SETS' ? 'SETS' : 'LEGS'}
                 </span>

                 <div className="flex items-center gap-1.5">
                    {match.config.matchMode === 'SETS' && teams[1] && (
                        <span className="text-[9px] font-bold text-gray-500 font-mono sm:text-[10px] md:text-sm">({match.legsWon[teams[1]]})</span>
                    )}
                    <span className="text-base font-black leading-none text-orange-500 font-mono sm:text-lg md:text-xl">
                        {teams[1] ? (match.config.matchMode === 'SETS' ? match.setsWon[teams[1]] : match.legsWon[teams[1]]) : 0}
                    </span>
                 </div>
            </div>
            <div className="rounded-full border border-white/5 bg-black/45 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.12em] text-gray-500 backdrop-blur-sm sm:px-3 sm:text-[9px] md:text-[10px]">
                {match.config.matchMode === 'SETS' 
                    ? `Premier à ${match.config.setsToWin} Sets (${match.config.legsToWin} Legs/Set)` 
                    : `Premier à ${match.config.legsToWin} Legs`}
            </div>

            {showHints && <CheckoutHint score={currentTeamScore} />}
        </div>
      </div>

      {/* Control Area */}
      <div className="relative z-30 flex h-[clamp(14rem,28svh,22rem)] shrink-0 flex-col border-t border-gray-800 bg-gray-900 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.5)] sm:h-[clamp(15rem,29svh,23rem)] md:h-[clamp(16rem,30svh,24rem)]">
         
         {/* Live Input Bar */}
         <div className="flex h-11 items-center justify-between border-b border-gray-800 bg-black/60 px-3 backdrop-blur-sm sm:h-12 sm:px-4 md:h-14">
             
             <div className="flex w-1/3 items-center gap-3">
                <div className="flex items-center gap-2 opacity-80">
                    <span className="text-base sm:text-lg">⌨️</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase hidden md:inline">Manual Input</span>
                </div>
             </div>

             <div className="flex-1 flex justify-center items-center">
                 <div className={`text-2xl font-black tracking-[0.2em] font-mono sm:text-3xl ${inputBuffer ? 'text-orange-500' : 'text-gray-700'}`}>
                     {inputBuffer || "---"}
                 </div>
             </div>

             <div className="flex w-1/3 justify-end">
                 <button
                    onClick={() => {
                      if (!ensureCurrentPlayerCanAct()) return;
                      const nextState = undoTurn(match);
                      setMatch(nextState);
                      void persistSharedState(nextState);
                    }}
                    className="flex items-center gap-1 p-2 text-[9px] font-bold uppercase text-gray-500 transition-colors hover:text-white sm:text-[10px]"
                 >
                    <span>Undo</span> <span className="text-lg">↶</span>
                 </button>
             </div>
         </div>

         {/* Keypad */}
         <div className="flex min-h-0 flex-1 gap-1.5 overflow-hidden p-1.5 sm:gap-2 sm:p-2">
            <div className="flex-1">
               <Keypad 
                  currentInput={inputBuffer} 
                  onInput={v => setInputBuffer(prev => (prev+v).slice(0,3))} 
                  onClear={() => setInputBuffer('')} 
                  onEnter={handleSubmitScore} 
                  isCheckoutPossible={false} 
                  quickShortcutsLeft={shortcutsLeft}
                  quickShortcutsRight={shortcutsRight}
                  onQuickAction={handleQuickScore}
               />
            </div>
            <div className="flex w-[68px] flex-col gap-1.5 sm:w-20 sm:gap-2 md:w-24">
                <Button 
                    variant="secondary" 
                    className="h-1/3 min-h-0 px-1 py-1 text-[9px] font-black leading-tight bg-gray-800 border-gray-700 text-cyan-500 shadow-md hover:border-cyan-500/50 hover:bg-cyan-900 hover:text-white sm:text-[11px] md:text-sm" 
                    onClick={handleRemainingSubmit}
                    title="Entrer le score qu'il reste"
                >
                    RESTE
                </Button>
                <Button 
                    className="flex-1 min-h-0 px-1 py-1 text-lg font-black shadow-lg shadow-orange-900/30 sm:text-2xl md:text-3xl" 
                    onClick={handleSubmitScore}
                >
                    OK
                </Button>
            </div>
         </div>
      </div>

      {showWinnerScreen && (
          <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
             <h1 className="mb-4 text-center text-4xl font-black italic text-orange-500 sm:text-6xl">VAINQUEUR</h1>
             <div className="mb-12 border-b-4 border-orange-500 pb-4 text-center text-2xl font-bold uppercase text-white sm:text-3xl">
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
                    <Button variant="danger" onClick={onExit}>OUI</Button>
                </div>
            </div>
          </div>
      )}

      {pendingCheckoutScore !== null && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6">
              <h2 className="text-3xl font-black italic text-white mb-8 uppercase tracking-tighter">Game Shot !</h2>
              <p className="text-gray-500 mb-4 text-xs font-bold uppercase tracking-widest">Fléchettes utilisées</p>
              
              <div className="flex w-full max-w-sm justify-center gap-3 sm:gap-4">
                  {[1, 2, 3]
                    .filter(d => d >= getMinDartsForScore(pendingCheckoutScore, match.config.checkOut))
                    .map(d => (
                      <Button key={d} onClick={() => handleCheckoutConfirm(d)} className="h-16 flex-1 border-2 border-gray-800 text-3xl shadow-lg transition-all hover:border-orange-500 sm:h-20 sm:text-4xl">{d}</Button>
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

function getFeedbackStyles(type: 'bust' | 'miss' | 'info' | undefined) {
  if (type === 'bust') {
    return {
      label: 'Bust',
      surface: 'bg-gradient-to-br from-red-950/95 via-red-900/90 to-black/90',
      border: 'border-red-500/45',
      accent: 'bg-gradient-to-r from-red-400 via-red-500 to-orange-500',
      kicker: 'text-red-200/85',
      value: 'text-white drop-shadow-[0_0_16px_rgba(248,113,113,0.28)]',
    };
  }

  if (type === 'miss') {
    return {
      label: 'Turn',
      surface: 'bg-gradient-to-br from-slate-900/95 via-slate-800/92 to-black/88',
      border: 'border-slate-500/35',
      accent: 'bg-gradient-to-r from-slate-400 via-slate-300 to-white/80',
      kicker: 'text-slate-300/80',
      value: 'text-white',
    };
  }

  return {
    label: 'Big Score',
    surface: 'bg-gradient-to-br from-[#1b1208]/96 via-[#2a160b]/94 to-[#120b08]/90',
    border: 'border-orange-400/35',
    accent: 'bg-gradient-to-r from-orange-400 via-orange-500 to-red-500',
    kicker: 'text-orange-200/85',
    value: 'bg-gradient-to-r from-white via-orange-100 to-orange-300 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(249,115,22,0.28)]',
  };
}
