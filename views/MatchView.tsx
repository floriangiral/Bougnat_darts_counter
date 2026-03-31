import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, LogOut, Settings } from 'lucide-react';
import { MatchState, Turn } from '../types';
import { submitTurn, getMinDartsForScore, formatDuration, resolveMatchStart } from '../utils/gameLogic';
import { PlayerScore } from '../components/game/PlayerScore';
import { Keypad } from '../components/game/Keypad';
import { Button } from '../components/ui/Button';
import { CheckoutHint } from '../components/game/CheckoutHint';
import { StatsModal } from '../components/stats/StatsModal';
import { supabase } from '../lib/supabase';
import { persistSharedMatchStateSafely, subscribeToSharedMatchSessionSafely } from '../lib/sharedMatchSync';
import { StartingPlayerOverlay } from '../components/game/StartingPlayerOverlay';
import { env } from '../src/lib/env';
import { parseDartsSpeechTranscript } from '../src/features/x01/voice/dartsSpeechParser';
import type { VoiceScoreProposalState } from '../src/features/x01/voice/dartsSpeechTypes';
import { useDeepgramStreaming } from '../src/features/x01/voice/useDeepgramStreaming';
import { VoiceScoringControl } from '../src/features/x01/voice/VoiceScoringControl';

interface MatchViewProps {
  initialMatch: MatchState;
  onFinish: (winnerId: string) => void;
  onFinishWithState?: (winnerId: string, match: MatchState) => void;
  onExit: () => void;
  sharedSessionId?: string;
  currentUserId?: string;
  skipStartingPlayerPrompt?: boolean;
  restoredState?: {
    match: MatchState;
    hasGameStarted: boolean;
    elapsedSeconds: number;
  } | null;
  onStateChange?: (snapshot: {
    match: MatchState;
    hasGameStarted: boolean;
    elapsedSeconds: number;
  }) => void;
}

type MatchUndoSnapshot = {
  match: MatchState;
  elapsedSeconds: number;
  showWinnerScreen: boolean;
  hasGameStarted: boolean;
};

type FeedbackKind = 'bust' | 'miss' | 'info' | 'notice';

type ScoreSubmissionResult =
  | { kind: 'invalid'; feedback: { text: string; type: FeedbackKind } }
  | { kind: 'checkout_confirm'; score: number }
  | {
      kind: 'applied';
      nextMatch: MatchState;
      persistMatch: MatchState;
      showWinnerScreen: boolean;
      feedback?: { text: string; type: FeedbackKind };
    };

type AppliedScoreSubmissionResult = Extract<ScoreSubmissionResult, { kind: 'applied' }>;

const cloneTurn = (turn: Turn): Turn => ({ ...turn });

const cloneMatchState = (match: MatchState): MatchState => ({
  ...match,
  players: match.players.map((player) => ({ ...player })),
  setsWon: { ...match.setsWon },
  legsWon: { ...match.legsWon },
  completedLegs: match.completedLegs.map((leg) => ({
    ...leg,
    scores: { ...leg.scores },
    history: leg.history.map(cloneTurn),
  })),
  currentLeg: {
    ...match.currentLeg,
    scores: { ...match.currentLeg.scores },
    history: match.currentLeg.history.map(cloneTurn),
  },
});

const buildScoreSubmissionResult = (
  match: MatchState,
  score: number,
  elapsedSeconds: number
): ScoreSubmissionResult => {
  if (Number.isNaN(score)) {
    return { kind: 'invalid', feedback: { text: '?', type: 'bust' } };
  }

  if (score < 0) {
    return { kind: 'invalid', feedback: { text: 'NEGATIF', type: 'bust' } };
  }

  if (score !== 0 && (!POSSIBLE_TURN_SCORES.has(score) || score > 180)) {
    return { kind: 'invalid', feedback: { text: 'SCORE IMPOSSIBLE', type: 'notice' } };
  }

  const currentPlayer = match.players[match.currentPlayerIndex];
  const currentScore = match.currentLeg.scores[currentPlayer.teamId];

  if (score === currentScore) {
    return { kind: 'checkout_confirm', score };
  }

  const nextMatch = submitTurn(match, score, 3);

  if (nextMatch.status === 'finished') {
    const persistMatch = { ...nextMatch, duration: elapsedSeconds };
    return {
      kind: 'applied',
      nextMatch: persistMatch,
      persistMatch,
      showWinnerScreen: true,
    };
  }

  const lastTurn = nextMatch.currentLeg.history[nextMatch.currentLeg.history.length - 1];
  const feedback =
    lastTurn?.isBust
      ? { text: 'TROP !', type: 'bust' as const }
      : score >= 100
        ? { text: score.toString(), type: 'info' as const }
        : undefined;

  return {
    kind: 'applied',
    nextMatch,
    persistMatch: nextMatch,
    showWinnerScreen: false,
    feedback,
  };
};

const buildCheckoutConfirmResult = (
  match: MatchState,
  score: number,
  dartsUsed: number,
  elapsedSeconds: number
): AppliedScoreSubmissionResult => {
  const nextMatch = submitTurn(match, score, dartsUsed);

  if (nextMatch.status === 'finished') {
    const persistMatch = { ...nextMatch, duration: elapsedSeconds };
    return {
      kind: 'applied',
      nextMatch: persistMatch,
      persistMatch,
      showWinnerScreen: true,
    };
  }

  return {
    kind: 'applied',
    nextMatch,
    persistMatch: nextMatch,
    showWinnerScreen: false,
  };
};

export const MatchView: React.FC<MatchViewProps> = ({
  initialMatch,
  onFinish,
  onFinishWithState,
  onExit,
  sharedSessionId,
  currentUserId,
  skipStartingPlayerPrompt = false,
  restoredState = null,
  onStateChange,
}) => {
  const [match, setMatch] = useState<MatchState>(restoredState?.match ?? initialMatch);
  const [inputBuffer, setInputBuffer] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }));
  const [elapsedSeconds, setElapsedSeconds] = useState(restoredState?.elapsedSeconds ?? 0);
  const matchStatusRef = useRef(match.status);

  // Modals & UI States
  const [showStats, setShowStats] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWinnerScreen, setShowWinnerScreen] = useState(false);
  const [hasGameStarted, setHasGameStarted] = useState(
    () => restoredState?.hasGameStarted ?? (skipStartingPlayerPrompt || initialMatch.currentLeg.history.length > 0)
  );
  
  // Game Interaction States
  const [pendingCheckoutScore, setPendingCheckoutScore] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string, type: 'bust' | 'miss' | 'info' | 'notice' } | null>(null);

  // Match UI state
  const [showHints, setShowHints] = useState(false);
  const [voiceAssistEnabled, setVoiceAssistEnabled] = useState(true);
  const [canCustomizeSideShortcuts, setCanCustomizeSideShortcuts] = useState(() => window.innerWidth >= 768);
  const [shortcutsLeft, setShortcutsLeft] = useState<number[]>([41, 45, 60, 100]);
  const [shortcutsRight, setShortcutsRight] = useState<number[]>([26, 81, 85, 140]);
  const [leftShortcutDrafts, setLeftShortcutDrafts] = useState<string[]>(['41', '45', '60', '100']);
  const [rightShortcutDrafts, setRightShortcutDrafts] = useState<string[]>(['26', '81', '85', '140']);
  const [undoStack, setUndoStack] = useState<MatchUndoSnapshot[]>([]);
  const [voiceProposal, setVoiceProposal] = useState<VoiceScoreProposalState | null>(null);
  const hydratedMatchIdRef = useRef<string | null>(null);
  const voiceScoringAvailable = env.VITE_ENABLE_VOICE_SCORING;
  const voiceScoringEnabled = voiceScoringAvailable && voiceAssistEnabled;

  useEffect(() => {
    const sourceMatchId = restoredState?.match.id ?? initialMatch.id;
    if (hydratedMatchIdRef.current === sourceMatchId) {
      return;
    }

    hydratedMatchIdRef.current = sourceMatchId;

    if (restoredState) {
      setMatch(restoredState.match);
      setHasGameStarted(restoredState.hasGameStarted);
      setElapsedSeconds(restoredState.elapsedSeconds);
      setShowWinnerScreen(restoredState.match.status === 'finished');
      setPendingCheckoutScore(null);
      setUndoStack([]);
      return;
    }

    setMatch(initialMatch);
    setHasGameStarted(skipStartingPlayerPrompt || initialMatch.currentLeg.history.length > 0);
    setElapsedSeconds(0);
    setShowWinnerScreen(false);
    setPendingCheckoutScore(null);
    setUndoStack([]);
    setVoiceProposal(null);
    setVoiceAssistEnabled(true);
  }, [initialMatch.id, restoredState?.match.id, skipStartingPlayerPrompt]);

  const {
    error: voiceError,
    isListening,
    liveTranscript,
    reset: resetVoiceStreaming,
    start: startVoiceStreaming,
    state: voiceStreamingState,
    stop: stopVoiceStreaming,
  } = useDeepgramStreaming({
    enabled: voiceScoringEnabled,
    onUtterance: ({ transcript, confidence, trigger }) => {
      const result = parseDartsSpeechTranscript(transcript, {
        confidence,
        dartsAlreadyThrown: 0,
        currentRemainingScore: currentTeamScore,
        startingScoreBeforeTurn: currentTeamScore,
      });

      setVoiceProposal({
        transcript,
        trigger,
        result,
      });

      if (result.status !== 'invalid' && result.score !== null) {
        setInputBuffer(String(result.score));
      }
    },
  });

  useEffect(() => {
    onStateChange?.({
      match,
      hasGameStarted,
      elapsedSeconds,
    });
  }, [elapsedSeconds, hasGameStarted, match, onStateChange]);

  useEffect(() => {
    matchStatusRef.current = match.status;
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }));
      if (matchStatusRef.current === 'active' && hasGameStarted) setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [match.status, hasGameStarted]);

  useEffect(() => {
    const syncLayoutMode = () => setCanCustomizeSideShortcuts(window.innerWidth >= 768);
    syncLayoutMode();
    window.addEventListener('resize', syncLayoutMode);
    return () => window.removeEventListener('resize', syncLayoutMode);
  }, []);

  useEffect(() => {
    setLeftShortcutDrafts(shortcutsLeft.map(String));
  }, [shortcutsLeft]);

  useEffect(() => {
    setRightShortcutDrafts(shortcutsRight.map(String));
  }, [shortcutsRight]);

  useEffect(() => {
    setVoiceProposal(null);
    resetVoiceStreaming();
  }, [match.currentLeg.history.length, match.currentPlayerIndex, resetVoiceStreaming]);

  useEffect(() => {
    if (!sharedSessionId) return;

    const channel = subscribeToSharedMatchSessionSafely(sharedSessionId, {
      onError: (error) => {
        console.error('[x01-shared-sync] remote update failed', error);
        triggerFeedback('SYNC KO', 'notice');
      },
      onRemoteMatch: (remoteMatch) => {
      setMatch(remoteMatch);
      setUndoStack([]);
      setPendingCheckoutScore(null);
      if (remoteMatch.status === 'finished') {
        setShowWinnerScreen(true);
      } else {
        setShowWinnerScreen(false);
      }
      },
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sharedSessionId]);

  const triggerFeedback = (text: string, type: 'bust' | 'miss' | 'info' | 'notice') => {
      setFeedbackMessage({ text, type });
      const duration = type === 'info' ? 2600 : 1500;
      setTimeout(() => setFeedbackMessage(null), duration);
  };

  const persistSharedState = async (nextState: MatchState) => {
    if (!sharedSessionId) return;

    const result = await persistSharedMatchStateSafely(sharedSessionId, nextState);
    if (!('error' in result)) return;

    const syncError = result.error;
    console.error('[x01-shared-sync] persist failed', syncError);
    triggerFeedback('SYNC KO', 'notice');
  };

  const ensureCurrentPlayerCanAct = () => {
    if (!sharedSessionId || !currentUserId) return true;
    if (match.players[match.currentPlayerIndex]?.id !== currentUserId) {
      triggerFeedback('WAIT', 'miss');
      return false;
    }
    return true;
  };

  const pushUndoSnapshot = () => {
    setUndoStack((prev) => [
      ...prev,
      {
        match: cloneMatchState(match),
        elapsedSeconds,
        showWinnerScreen,
        hasGameStarted,
      },
    ]);
  };

  const handleUndoAction = () => {
    if (inputBuffer) {
      setInputBuffer((prev) => {
        const nextValue = prev.slice(0, -1);
        if (!nextValue) {
          setVoiceProposal(null);
        }
        return nextValue;
      });
      return;
    }

    if (pendingCheckoutScore !== null) {
      setPendingCheckoutScore(null);
      return;
    }

    if (voiceProposal || voiceError) {
      setVoiceProposal(null);
      resetVoiceStreaming();
      return;
    }

    const previousState = undoStack[undoStack.length - 1];
    if (!previousState) return;

    setUndoStack((prev) => prev.slice(0, -1));
    setMatch(previousState.match);
    setElapsedSeconds(previousState.elapsedSeconds);
    setHasGameStarted(previousState.hasGameStarted);
    setShowWinnerScreen(previousState.showWinnerScreen);
    setPendingCheckoutScore(null);
    setVoiceProposal(null);
    resetVoiceStreaming();
    void persistSharedState(previousState.match);
  };

  const processScoreSubmission = (score: number) => {
      if (!hasGameStarted) return;
      if (!ensureCurrentPlayerCanAct()) return;
      const result = buildScoreSubmissionResult(match, score, elapsedSeconds);

      if (result.kind === 'invalid') {
        triggerFeedback(result.feedback.text, result.feedback.type);
        return;
      }

      if (result.kind === 'checkout_confirm') {
        setPendingCheckoutScore(result.score);
        setInputBuffer('');
        return;
      }

      pushUndoSnapshot();
      setMatch(result.nextMatch);
      setShowWinnerScreen(result.showWinnerScreen);
      if (result.feedback) {
        triggerFeedback(result.feedback.text, result.feedback.type);
      }
      void persistSharedState(result.persistMatch);
      setInputBuffer('');
      setVoiceProposal(null);
      resetVoiceStreaming();
  };

  const handleSubmitScore = () => {
      if (inputBuffer) {
        processScoreSubmission(parseInt(inputBuffer, 10));
        return;
      }

      if (voiceProposal && voiceProposal.result.status !== 'invalid' && voiceProposal.result.score !== null) {
        processScoreSubmission(voiceProposal.result.score);
      }
  };
  
  const handleRemainingSubmit = () => {
      if (!hasGameStarted) return;
      if (!inputBuffer) return;
      const targetRemaining = parseInt(inputBuffer);
      if (isNaN(targetRemaining)) return;

      const currentPlayer = match.players[match.currentPlayerIndex];
      const currentScore = match.currentLeg.scores[currentPlayer.teamId];

      if (targetRemaining < 0 || targetRemaining > currentScore) {
          triggerFeedback("SCORE RESTANT IMPOSSIBLE", "notice");
          return;
      }

      if (targetRemaining === currentScore) {
          triggerFeedback("UTILISE MISS", "miss");
          return;
      }

      if (match.config.checkOut === 'Double' && targetRemaining === 1) {
          triggerFeedback("SCORE RESTANT IMPOSSIBLE", "notice");
          return;
      }

      const impliedScore = currentScore - targetRemaining;
      
      // Le bouton RESTE doit décrire un score restant atteignable en un tour.
      if (impliedScore > 180) {
           triggerFeedback("SCORE RESTANT IMPOSSIBLE", "notice");
           return;
      }

      processScoreSubmission(impliedScore);
  };

  const handleQuickScore = (val: number) => {
      if (!hasGameStarted) return;
      if (!ensureCurrentPlayerCanAct()) return;
      processScoreSubmission(val);
  };

  const handleShortcutDraftChange = (side: 'left' | 'right', index: number, value: string) => {
      const sanitizedValue = value.replace(/\D/g, '').slice(0, 3);
      const setDrafts = side === 'left' ? setLeftShortcutDrafts : setRightShortcutDrafts;

      setDrafts((prev) => prev.map((entry, entryIndex) => (
        entryIndex === index ? sanitizedValue : entry
      )));

      if (!sanitizedValue) return;

      const parsed = parseInt(sanitizedValue, 10);
      if (Number.isNaN(parsed) || parsed > 180 || !POSSIBLE_TURN_SCORES.has(parsed)) return;

      const setShortcuts = side === 'left' ? setShortcutsLeft : setShortcutsRight;
      setShortcuts((prev) => prev.map((entry, entryIndex) => (
        entryIndex === index ? parsed : entry
      )));
  };

  const resetShortcutDraft = (side: 'left' | 'right', index: number) => {
      const source = side === 'left' ? shortcutsLeft : shortcutsRight;
      const setDrafts = side === 'left' ? setLeftShortcutDrafts : setRightShortcutDrafts;
      setDrafts((prev) => prev.map((entry, entryIndex) => (
        entryIndex === index ? String(source[index]) : entry
      )));
  };

  const handleCheckoutConfirm = (dartsUsed: number) => {
     if (!hasGameStarted) return;
     if (!ensureCurrentPlayerCanAct()) return;
     if (pendingCheckoutScore === null) return;
     const result = buildCheckoutConfirmResult(match, pendingCheckoutScore, dartsUsed, elapsedSeconds);
     pushUndoSnapshot();
     setMatch(result.nextMatch);
     setShowWinnerScreen(result.showWinnerScreen);
     void persistSharedState(result.persistMatch);
     setPendingCheckoutScore(null);
     setVoiceProposal(null);
     resetVoiceStreaming();
  };

  const dismissVoiceProposal = () => {
    setVoiceProposal(null);
    resetVoiceStreaming();
  };

  const retryVoiceCapture = () => {
    setVoiceProposal(null);
    resetVoiceStreaming();
    void startVoiceStreaming();
  };

  const handleVoiceConfirm = () => {
    if (!voiceProposal || voiceProposal.result.status === 'invalid' || voiceProposal.result.score === null) {
      return;
    }

    setInputBuffer(String(voiceProposal.result.score));
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopVoiceStreaming();
      return;
    }

    if (!hasGameStarted) {
      return;
    }

    if (!ensureCurrentPlayerCanAct()) {
      return;
    }

    setVoiceProposal(null);
    void startVoiceStreaming();
  };

  const currentPlayer = match.players[match.currentPlayerIndex];
  // Fix: Explicitly type teams as string[] to avoid 'unknown' inference error
  const teams = Array.from(new Set(match.players.map(p => p.teamId))) as string[];
  const currentTeamScore = match.currentLeg.scores[currentPlayer.teamId];
  const matchStartingPlayer =
    match.completedLegs.length > 0
      ? match.players[match.completedLegs[0].startingPlayerIndex]
      : match.players[match.currentLeg.startingPlayerIndex];
  const getDisplayedThrowerForTeam = (teamId: string) => {
    if (currentPlayer.teamId === teamId) {
      return currentPlayer;
    }

    for (let offset = 1; offset < match.players.length; offset += 1) {
      const candidate = match.players[(match.currentPlayerIndex + offset) % match.players.length];
      if (candidate.teamId === teamId) {
        return candidate;
      }
    }

    return match.players.find((player) => player.teamId === teamId) ?? null;
  };
  const feedbackStyles = getFeedbackStyles(feedbackMessage?.type);
  const doubleOutBogeyScores = new Set([159, 162, 163, 165, 166, 168, 169]);
  const matchFormatText =
    match.config.matchMode === 'SETS'
      ? `Premier à ${match.config.setsToWin} Sets (${match.config.legsToWin} Legs/Set)`
      : `Premier à ${match.config.legsToWin} Legs`;
  const matchFormatCompactText =
    match.config.matchMode === 'SETS'
      ? `Premier a ${match.config.setsToWin} Sets`
      : `Premier a ${match.config.legsToWin} Manches`;
  const isCheckoutPossible =
    match.config.checkOut === 'Open'
      ? currentTeamScore > 0 && currentTeamScore <= 180
      : match.config.checkOut === 'Double'
        ? currentTeamScore >= 2 && currentTeamScore <= 170 && !doubleOutBogeyScores.has(currentTeamScore)
        : currentTeamScore >= 2 && currentTeamScore <= 180;
  const starterOptions = match.config.isDoubles
    ? [
        {
          id: 'team1',
          label:
            match.players.find((player) => player.id === match.config.teamStarterIds?.team1)?.name
            || match.players.find((player) => player.teamId === 'team1')?.name
            || 'Joueur 1',
        },
        {
          id: 'team2',
          label:
            match.players.find((player) => player.id === match.config.teamStarterIds?.team2)?.name
            || match.players.find((player) => player.teamId === 'team2')?.name
            || 'Joueur 3',
        },
      ]
    : match.players.map((player, index) => ({
        id: String(index),
        label: player.name,
      }));
  const canUndoAction = Boolean(inputBuffer || pendingCheckoutScore !== null || voiceProposal || voiceError || undoStack.length > 0);
  const voiceStateLabel =
    voiceStreamingState === 'processing'
      ? 'Traitement vocal'
      : voiceStreamingState === 'listening'
        ? 'Ecoute en cours'
        : voiceError
          ? 'Erreur vocale'
          : 'Scoring vocal';
  const showVoicePanel = isListening || Boolean(voiceProposal) || Boolean(voiceError);
  const proposedVoiceScore = voiceProposal;
  const proposedVoiceScoreValue =
    proposedVoiceScore && proposedVoiceScore.result.status !== 'invalid' && proposedVoiceScore.result.score !== null
      ? proposedVoiceScore.result.score
      : null;
  const voiceHeadline = voiceProposal?.transcript || liveTranscript || voiceError || 'Annonce ton score ou tes fleches';
  const voiceDisplayText = voiceProposal?.transcript || liveTranscript || voiceError || '';
  const getWinnerDisplayName = (winnerTeamId: string | null) => {
    if (!winnerTeamId) return '';
    const winnerPlayers = match.players.filter((player) => player.teamId === winnerTeamId);
    if (match.config.isDoubles) {
      return winnerPlayers.map((player) => player.name).join(' / ');
    }
    return winnerPlayers[0]?.name || '';
  };
  const handleStarterSelect = async (starterId: string) => {
    const nextMatch = resolveMatchStart(match, starterId);
    setMatch(nextMatch);
    setHasGameStarted(true);
    await persistSharedState(nextMatch);
  };

  return (
    <div className="relative flex h-[100dvh] w-full min-h-0 flex-col overflow-hidden bg-black text-white">
      <div className="laptop-compact-topbar z-20 flex min-h-[78px] shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900 px-3 py-2.5 sm:min-h-[88px] sm:px-4 sm:py-3">
        <div className="flex min-w-0 flex-col gap-1">
           <div className="whitespace-nowrap font-black italic text-base sm:text-lg md:text-xl">
             <span className="text-white">BOUGNAT</span> <span className="text-orange-500">DARTS</span>
           </div>
           <div className="inline-flex w-fit items-center whitespace-nowrap rounded-full border border-gray-700/80 bg-gray-900/94 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-gray-300 shadow-[0_10px_24px_rgba(0,0,0,0.35)] backdrop-blur-md sm:px-3 sm:text-[10px] sm:tracking-[0.12em] md:text-[11px]">
             <span className="sm:hidden">{matchFormatCompactText}</span>
             <span className="hidden sm:inline">{matchFormatText}</span>
           </div>
        </div>
        
        {/* CENTER TIME & TIMER */}
        <div className="laptop-compact-timer flex min-w-[92px] flex-col items-center justify-center sm:min-w-[112px]">
            <div className="mb-1 text-[11px] leading-none text-gray-500 font-mono md:text-xs">{currentTime}</div>
            <div className="text-base font-bold leading-none tracking-[0.18em] text-orange-500 font-mono sm:text-lg md:text-xl">{formatDuration(elapsedSeconds)}</div>
        </div>

        <div className="laptop-compact-topbar-actions flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setShowStats(true)}
              className="inline-flex h-[38px] w-[38px] items-center justify-center rounded border border-gray-700 bg-gray-800 text-[11px] font-bold uppercase text-white transition-colors hover:bg-gray-700 sm:h-[40px] sm:w-[40px] sm:text-xs"
              aria-label="Statistiques"
              title="Statistiques"
            >
              <BarChart3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="inline-flex h-[38px] w-[38px] items-center justify-center rounded border border-gray-700 bg-gray-800 text-white transition-colors hover:bg-gray-700 sm:h-[40px] sm:w-[40px]"
              aria-label="Configuration"
              title="Configuration"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowExitConfirm(true)}
              className="inline-flex h-[38px] w-[38px] items-center justify-center rounded border border-red-900/30 text-red-500 transition-colors hover:bg-red-950/30 sm:h-[40px] sm:w-[40px]"
              aria-label="Quitter"
              title="Quitter"
            >
              <LogOut className="h-4 w-4" />
            </button>
        </div>
      </div>

      {/* Main Score Area */}
      <div className="relative flex min-h-0 flex-1 items-stretch">
        {feedbackMessage && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                <div className={`relative ${feedbackMessage.type === 'info' ? 'min-w-[280px] px-10 py-8 sm:min-w-[340px]' : 'min-w-[220px] px-8 py-6'} overflow-hidden rounded-[1.5rem] border ${feedbackStyles.border} ${feedbackStyles.surface} shadow-[0_24px_80px_rgba(0,0,0,0.5)]`}>
                    {feedbackMessage.type === 'info' && (
                      <div className="pointer-events-none absolute inset-0">
                        {CONFETTI_PIECES.map((piece, index) => (
                          <span
                            key={`${piece.left}-${piece.top}-${index}`}
                            className={`absolute block rounded-sm ${piece.color} ${piece.size} animate-bounce opacity-100 shadow-[0_0_10px_rgba(255,255,255,0.18)]`}
                            style={{
                              left: piece.left,
                              top: piece.top,
                              transform: `rotate(${piece.rotate}deg)`,
                              animationDelay: piece.delay,
                              animationDuration: piece.duration,
                            }}
                          />
                        ))}
                      </div>
                    )}
                    <div className={`absolute inset-x-0 top-0 h-1 ${feedbackStyles.accent}`} />
                    <div className="relative flex flex-col items-center text-center">
                        <span className={`mb-3 ${feedbackMessage.type === 'info' ? 'text-[13px] sm:text-[14px]' : 'text-[11px]'} font-black uppercase tracking-[0.28em] ${feedbackStyles.kicker}`}>
                            {feedbackStyles.label}
                        </span>
                        <h1 className={`${feedbackMessage.type === 'info' ? 'text-6xl sm:text-7xl' : 'text-5xl sm:text-6xl'} font-black uppercase leading-none ${feedbackStyles.value}`}>
                            {feedbackMessage.text}
                        </h1>
                    </div>
                </div>
            </div>
        )}
        <div className="flex-1 border-r border-gray-800/50">{teams[0] && renderPlayerArea(teams[0])}</div>
        <div className="flex-1">{teams[1] && renderPlayerArea(teams[1])}</div>

        {/* Match Status */}
        <div className="pointer-events-none absolute left-1/2 top-2 z-20 flex -translate-x-1/2 transform flex-col items-center gap-2 sm:top-3">
            <div className="laptop-compact-status-pill pointer-events-auto grid w-[230px] max-w-[92vw] grid-cols-[1fr_auto_1fr] items-center rounded-full border border-gray-700/80 bg-gray-900/94 px-3 py-2 shadow-[0_0_22px_rgba(0,0,0,0.42)] backdrop-blur-md sm:w-[270px] sm:px-4 sm:py-2.5 md:w-[310px]">
                 <div className="flex items-center justify-center gap-1.5">
                    <span className="text-2xl font-black leading-none text-orange-500 font-mono sm:text-[1.9rem] md:text-[2.2rem]">
                        {teams[0] ? (match.config.matchMode === 'SETS' ? match.setsWon[teams[0]] : match.legsWon[teams[0]]) : 0}
                    </span>
                    {match.config.matchMode === 'SETS' && teams[0] && (
                        <span className="text-xs font-bold text-gray-500 font-mono sm:text-sm md:text-base">({match.legsWon[teams[0]]})</span>
                    )}
                 </div>

                 <span className="flex h-8 items-center px-3 text-[11px] font-black uppercase tracking-[0.18em] text-gray-300 sm:h-9 sm:px-4 sm:text-xs md:h-10 md:text-sm">
                    {match.config.matchMode === 'SETS' ? 'SETS' : 'MANCHES'}
                 </span>

                 <div className="flex items-center justify-center gap-1.5">
                    {match.config.matchMode === 'SETS' && teams[1] && (
                        <span className="text-xs font-bold text-gray-500 font-mono sm:text-sm md:text-base">({match.legsWon[teams[1]]})</span>
                    )}
                    <span className="text-2xl font-black leading-none text-orange-500 font-mono sm:text-[1.9rem] md:text-[2.2rem]">
                        {teams[1] ? (match.config.matchMode === 'SETS' ? match.setsWon[teams[1]] : match.legsWon[teams[1]]) : 0}
                    </span>
                 </div>
            </div>
            {showHints && <CheckoutHint score={currentTeamScore} />}
        </div>
      </div>

      {/* Control Area */}
      <div className="laptop-compact-control-area relative z-30 flex h-[clamp(19rem,38svh,29rem)] shrink-0 flex-col border-t border-gray-800 bg-gray-900 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.5)] sm:h-[clamp(20rem,39svh,30rem)] md:h-[clamp(16rem,32svh,24rem)] xl:h-[clamp(20rem,37svh,29rem)]">
         
         {/* Live Input Bar */}
         <div className="laptop-compact-inputbar border-b border-gray-800 bg-[linear-gradient(180deg,rgba(4,8,16,0.95),rgba(2,6,12,0.92))] px-2 py-1.5 backdrop-blur-sm sm:px-4 sm:py-2.5">
             <div className="relative flex min-h-[2.75rem] items-center justify-between gap-2 sm:min-h-[3.5rem] sm:gap-3 md:min-h-[4rem] md:gap-4">
                 <div className="min-w-0 flex-1 pr-16 sm:pr-24 md:pr-28">
                    <div className="flex min-w-0 items-center gap-2">
                      <div
                        className={`shrink-0 items-center rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] sm:inline-flex sm:px-3 sm:text-[10px] sm:tracking-[0.16em] ${
                          showVoicePanel ? 'hidden' : 'inline-flex'
                        } ${
                          showVoicePanel
                            ? 'border-cyan-500/40 bg-cyan-500/12 text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.18)]'
                            : 'border-white/10 bg-white/[0.03] text-gray-500'
                        }`}
                      >
                        AI Scoring
                      </div>
                      <div className="truncate text-[11px] font-black text-white/90 sm:text-[13px] md:text-[14px]">
                        {showVoicePanel ? voiceDisplayText : ''}
                      </div>
                    </div>
                 </div>

                 <div className="pointer-events-none absolute left-1/2 top-1/2 flex w-[7.25rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center sm:w-[9rem] md:w-[10.5rem]">
                     <div className="text-[9px] font-black uppercase leading-none tracking-[0.22em] text-gray-500 sm:text-[10px]">
                       Score
                     </div>
                     <div className={`mt-0.5 text-[clamp(1.75rem,8vw,3.5rem)] font-black leading-none tracking-[0.08em] font-mono sm:mt-1 sm:text-[clamp(2.2rem,5vw,4rem)] md:text-[clamp(2.5rem,4vw,4.5rem)] ${(inputBuffer || proposedVoiceScoreValue !== null) ? 'text-orange-500' : 'text-gray-700'}`}>
                         {inputBuffer || (proposedVoiceScoreValue !== null ? String(proposedVoiceScoreValue) : "---")}
                     </div>
                 </div>

                 <div className="flex shrink-0 items-center justify-end gap-1 pl-16 sm:gap-2 sm:pl-24 md:pl-28">
                     <button
                       onClick={() => {
                          if (!ensureCurrentPlayerCanAct()) return;
                          handleUndoAction();
                        }}
                       disabled={!canUndoAction}
                       className="inline-flex h-8 items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 text-[9px] font-black uppercase tracking-[0.14em] text-gray-400 transition-colors hover:text-white disabled:opacity-40 sm:h-9 sm:gap-1.5 sm:px-3 sm:text-[10px] sm:tracking-[0.18em]"
                     >
                        <span>Retour</span> <span className="text-base leading-none">↶</span>
                     </button>
                 </div>
             </div>
         </div>

         {/* Keypad */}
         <div className="flex min-h-0 flex-1 overflow-hidden p-1.5 sm:p-2">
            <div className="flex-1">
               <Keypad 
                  currentInput={inputBuffer} 
                  onInput={v => setInputBuffer(prev => (prev+v).slice(0,3))} 
                  onClear={() => {
                    setInputBuffer('');
                    setVoiceProposal(null);
                  }} 
                  onEnter={handleSubmitScore}
                  onRemaining={handleRemainingSubmit}
                  isCheckoutPossible={isCheckoutPossible}
                  quickShortcutsLeft={shortcutsLeft}
                  quickShortcutsRight={shortcutsRight}
                  onQuickAction={handleQuickScore}
                  voiceControl={
                    <VoiceScoringControl
                      disabled={!hasGameStarted || voiceStreamingState === 'processing'}
                      enabled={voiceScoringEnabled}
                      error={voiceError}
                      isListening={isListening}
                      onToggle={handleVoiceToggle}
                      stateLabel={voiceStateLabel}
                    />
                  }
               />
            </div>
         </div>
      </div>

      {showWinnerScreen && (
          <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
             <h1 className="mb-4 text-center text-4xl font-black italic text-orange-500 sm:text-6xl">VAINQUEUR</h1>
             <div className="mb-12 border-b-4 border-orange-500 pb-4 text-center text-2xl font-bold uppercase text-white sm:text-3xl">
                 {getWinnerDisplayName(match.matchWinnerId)}
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

      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Configuration</div>
                <h3 className="mt-2 text-2xl font-black italic uppercase text-white">Options de jeu</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-gray-300 transition-colors hover:border-white/20 hover:text-white"
              >
                Fermer
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-gray-700 bg-black/20 p-4">
                <div className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Aides de jeu</div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-black uppercase text-white">Suggestions de finish</div>
                      <div className="mt-1 text-sm text-gray-400">Afficher ou masquer l aide de checkout pendant la partie.</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowHints((prev) => !prev)}
                      className={`rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition-colors ${
                        showHints
                          ? 'border-orange-500/40 bg-orange-500/10 text-orange-300'
                          : 'border-white/10 bg-white/[0.04] text-gray-400 hover:text-white'
                      }`}
                    >
                      {showHints ? 'Actif' : 'Off'}
                    </button>
                  </div>

                  {voiceScoringAvailable && (
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-black uppercase text-white">Assistance vocale IA</div>
                        <div className="mt-1 text-sm text-gray-400">
                          Active ou coupe la proposition vocale pendant ce match X01. Active par defaut.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (voiceAssistEnabled) {
                            dismissVoiceProposal();
                          }
                          setVoiceAssistEnabled((prev) => !prev);
                        }}
                        className={`rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition-colors ${
                          voiceAssistEnabled
                            ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                            : 'border-white/10 bg-white/[0.04] text-gray-400 hover:text-white'
                        }`}
                      >
                        {voiceAssistEnabled ? 'Actif' : 'Off'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-gray-700 bg-black/20 p-4">
                <div className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Raccourcis</div>
                {canCustomizeSideShortcuts ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-400">
                      Les raccourcis lateraux sont visibles sur tablette, PC et affichages larges. Tu peux les modifier ici avec des scores valides.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Colonne gauche</div>
                        <div className="grid grid-cols-2 gap-2">
                          {leftShortcutDrafts.map((value, index) => (
                            <input
                              key={`left-shortcut-${index}`}
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={value}
                              onChange={(e) => handleShortcutDraftChange('left', index, e.target.value)}
                              onBlur={() => resetShortcutDraft('left', index)}
                              className="rounded-xl border border-white/10 bg-[#0a1018] px-3 py-2 text-center text-sm font-black text-white outline-none transition-colors focus:border-orange-400/40"
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Colonne droite</div>
                        <div className="grid grid-cols-2 gap-2">
                          {rightShortcutDrafts.map((value, index) => (
                            <input
                              key={`right-shortcut-${index}`}
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={value}
                              onChange={(e) => handleShortcutDraftChange('right', index, e.target.value)}
                              onBlur={() => resetShortcutDraft('right', index)}
                              className="rounded-xl border border-white/10 bg-[#0a1018] px-3 py-2 text-center text-sm font-black text-white outline-none transition-colors focus:border-orange-400/40"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Scores autorises uniquement. Si une valeur n est pas valide, le raccourci precedent est conserve.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">
                    Les raccourcis rapides lateraux ne sont pas affiches sur ce format d ecran. La modification sera disponible automatiquement sur tablette, PC ou affichage plus large.
                  </p>
                )}
              </div>
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
      {!skipStartingPlayerPrompt && !hasGameStarted && !showWinnerScreen && (
        <StartingPlayerOverlay options={starterOptions} onSelect={handleStarterSelect} onCancel={onExit} />
      )}
    </div>
  );

  function renderPlayerArea(teamId: string) {
      const isTeamActive = currentPlayer.teamId === teamId;
      const teamPlayers = match.players.filter(p => p.teamId === teamId);
      const displayedThrower = getDisplayedThrowerForTeam(teamId);
      const displayName = match.config.isDoubles ? (displayedThrower?.name || teamPlayers[0]?.name) : teamPlayers[0]?.name;
      const subtitle = match.config.isDoubles ? teamPlayers.map((player) => player.name).join(' / ') : undefined;
      const showMatchStarterBadge = matchStartingPlayer?.teamId === teamId;
      
      const calcAvg = (history: Turn[]) => {
          const s = history.reduce((a, t) => a + (t.isBust ? 0 : t.score), 0);
          const d = history.reduce((a, t) => a + t.dartsThrown, 0);
          return d > 0 ? ((s / d) * 3).toFixed(1) : "0.0";
      };

      const allHistory = [...match.completedLegs, match.currentLeg].flatMap(l => l.history).filter(t => match.players.find(pl => pl.id === t.playerId)?.teamId === teamId);
      
      return (
        <PlayerScore 
            name={displayName} 
            subtitle={subtitle}
            showMatchStarterBadge={showMatchStarterBadge}
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

function getFeedbackStyles(type: 'bust' | 'miss' | 'info' | 'notice' | undefined) {
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

  if (type === 'notice') {
    return {
      label: 'Info',
      surface: 'bg-gradient-to-br from-slate-900/95 via-gray-900/94 to-black/90',
      border: 'border-slate-400/35',
      accent: 'bg-gradient-to-r from-slate-300 via-slate-200 to-white/80',
      kicker: 'text-slate-300/85',
      value: 'text-white',
    };
  }

  return {
    label: 'Belles Fleches!',
    surface: 'bg-gradient-to-br from-slate-900/95 via-gray-900/94 to-black/90',
    border: 'border-slate-400/35',
    accent: 'bg-gradient-to-r from-slate-300 via-slate-200 to-white/80',
    kicker: 'text-slate-300/85',
    value: 'text-white',
  };
}

const POSSIBLE_TURN_SCORES = (() => {
  const oneDartScores = [0, 25, 50];

  for (let value = 1; value <= 20; value += 1) {
    oneDartScores.push(value, value * 2, value * 3);
  }

  const uniqueOneDartScores = Array.from(new Set(oneDartScores));
  const possibleScores = new Set<number>();

  for (const first of uniqueOneDartScores) {
    for (const second of uniqueOneDartScores) {
      for (const third of uniqueOneDartScores) {
        possibleScores.add(first + second + third);
      }
    }
  }

  return possibleScores;
})();

const CONFETTI_PIECES = [
  { left: '8%', top: '12%', rotate: -18, color: 'bg-yellow-300', size: 'h-3 w-3', delay: '0ms', duration: '1200ms' },
  { left: '18%', top: '7%', rotate: 24, color: 'bg-orange-400', size: 'h-4 w-2.5', delay: '120ms', duration: '1400ms' },
  { left: '82%', top: '9%', rotate: -32, color: 'bg-red-400', size: 'h-3 w-3', delay: '240ms', duration: '1300ms' },
  { left: '90%', top: '22%', rotate: 16, color: 'bg-cyan-300', size: 'h-4 w-2.5', delay: '360ms', duration: '1250ms' },
  { left: '12%', top: '70%', rotate: 40, color: 'bg-lime-300', size: 'h-4 w-2.5', delay: '180ms', duration: '1450ms' },
  { left: '24%', top: '84%', rotate: -22, color: 'bg-pink-400', size: 'h-3 w-3', delay: '300ms', duration: '1280ms' },
  { left: '76%', top: '80%', rotate: 28, color: 'bg-amber-300', size: 'h-4 w-2.5', delay: '140ms', duration: '1500ms' },
  { left: '90%', top: '68%', rotate: -40, color: 'bg-emerald-300', size: 'h-3 w-3', delay: '420ms', duration: '1320ms' },
  { left: '50%', top: '10%', rotate: -12, color: 'bg-fuchsia-300', size: 'h-3 w-3', delay: '200ms', duration: '1380ms' },
  { left: '52%', top: '82%', rotate: 22, color: 'bg-sky-300', size: 'h-4 w-2.5', delay: '280ms', duration: '1480ms' },
];
