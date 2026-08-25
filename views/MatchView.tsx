// Spec: spec:counter/voice-scoring-reliability
import React, { useCallback, useState, useEffect, useRef } from 'react';
import { MatchState } from '../types';
import { resolveMatchStart } from '../src/application/scoring/matchLifecycle';
import { getMinDartsForScore } from '../src/application/scoring/matchStats';
import { formatDuration } from '../src/application/scoring/matchLifecycle';
import { PlayerScore } from '../components/game/PlayerScore';
import { Keypad } from '../components/game/Keypad';
import { Button } from '../components/ui/Button';
import { StatsModal } from '../components/stats/StatsModal';
import { StartingPlayerOverlay } from '../components/game/StartingPlayerOverlay';
import { MatchInputBar } from '../components/match/MatchInputBar';
import { MatchSettingsModal } from '../components/match/MatchSettingsModal';
import { MatchStatusPill } from '../components/match/MatchStatusPill';
import { MatchTopBar } from '../components/match/MatchTopBar';
import { env } from '../src/lib/env';
import { useSharedX01Session } from '../src/features/x01/session/useSharedX01Session';
import type { VoiceScoreProposalState } from '../src/features/x01/voice/dartsSpeechTypes';
import { buildVoiceScoreProposal } from '../src/features/x01/voice/voiceProposalModel';
import { buildVoiceRuntimeIssueMessage, buildVoiceStateLabel } from '../src/features/x01/voice/voiceSessionModel';
import { useDeepgramStreaming } from '../src/features/x01/voice/useDeepgramStreaming';
import { VoiceScoringControl } from '../src/features/x01/voice/VoiceScoringControl';
import { buildCheckoutConfirmResult, buildScoreSubmissionResult, cloneMatchState, type FeedbackKind } from '../src/features/x01/scoring/matchSubmission';
import { deriveRemainingPreview, type RemainingPreview } from '../src/features/x01/scoring/matchPreview';
import { getFeedbackStyles } from '../src/features/x01/scoring/matchFeedback';
import { resolveBotVictoryPreview } from '../src/features/x01/scoring/botVictoryPreview';
import { getMatchFormatCompactText, getMatchFormatText, getStarterOptions, getWinnerDisplayName } from '../src/features/x01/scoring/matchPresentation';
import { buildPlayerScoreViewModel } from '../src/features/x01/scoring/matchPlayerScore';
import { buildX01BotTurnResult } from '../src/application/x01Bot/x01BotTurn';
import { DEFAULT_X01_BOT_LEVEL, isX01BotPlayer } from '../src/domain/x01Bot/x01Bot';
import { useMatchTimer } from '../src/features/x01/hooks/useMatchTimer';
import { useMatchShortcuts } from '../src/features/x01/hooks/useMatchShortcuts';

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

type LegTransitionState = {
  winnerTeamId: string;
  countdown: number;
};

type BotVictoryPreview = {
  kind: 'leg' | 'match';
  winnerName: string;
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

  // Modals & UI States
  const [showStats, setShowStats] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWinnerScreen, setShowWinnerScreen] = useState(false);
  const [hasGameStarted, setHasGameStarted] = useState(
    () => restoredState?.hasGameStarted ?? (skipStartingPlayerPrompt || initialMatch.currentLeg.history.length > 0)
  );
  const { currentTime, elapsedSeconds, setElapsedSeconds } = useMatchTimer({
    matchStatus: match.status,
    hasGameStarted,
    initialElapsedSeconds: restoredState?.elapsedSeconds ?? 0,
  });
  const [legTransition, setLegTransition] = useState<LegTransitionState | null>(null);
  const [botVictoryPreview, setBotVictoryPreview] = useState<BotVictoryPreview | null>(null);
  
  // Game Interaction States
  const [pendingCheckoutScore, setPendingCheckoutScore] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: FeedbackKind } | null>(null);
  const [remainingPreview, setRemainingPreview] = useState<RemainingPreview | null>(null);
  const [isCompactBrowserMobile, setIsCompactBrowserMobile] = useState(false);

  // Match UI state
  const [showHints, setShowHints] = useState(false);
  const [voiceAssistEnabled, setVoiceAssistEnabled] = useState(true);
  const {
    canCustomizeSideShortcuts,
    shortcutsLeft,
    shortcutsRight,
    leftShortcutDrafts,
    rightShortcutDrafts,
    handleShortcutDraftChange,
    resetShortcutDraft,
  } = useMatchShortcuts();
  const [undoStack, setUndoStack] = useState<MatchUndoSnapshot[]>([]);
  const [voiceProposal, setVoiceProposal] = useState<VoiceScoreProposalState | null>(null);
  const hydratedMatchIdRef = useRef<string | null>(null);
  const legTransitionTimeoutRef = useRef<number | null>(null);
  const legTransitionIntervalRef = useRef<number | null>(null);
  const botTurnTimeoutRef = useRef<number | null>(null);
  const botVictoryPreviewTimeoutRef = useRef<number | null>(null);
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
      setLegTransition(null);
      setBotVictoryPreview(null);
      return;
    }

    setMatch(initialMatch);
    setHasGameStarted(skipStartingPlayerPrompt || initialMatch.currentLeg.history.length > 0);
    setElapsedSeconds(0);
    setShowWinnerScreen(false);
    setPendingCheckoutScore(null);
    setUndoStack([]);
    setLegTransition(null);
    setBotVictoryPreview(null);
    setVoiceProposal(null);
    setVoiceAssistEnabled(true);
  // The reset is keyed by match and restored-state IDs; object identity would reset active input on each render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMatch.id, restoredState?.match.id, skipStartingPlayerPrompt]);

  const currentPlayer = match.players[match.currentPlayerIndex];
  const teams = Array.from(new Set(match.players.map(p => p.teamId))) as string[];
  const currentTeamScore = match.currentLeg.scores[currentPlayer.teamId];
  const voiceTurnSessionKey = [
    match.id,
    match.completedLegs.length,
    match.currentLeg.history.length,
    match.currentPlayerIndex,
    currentPlayer.id,
  ].join(':');

  const {
    error: voiceError,
    issue: voiceIssue,
    isListening,
    liveTranscript,
    reset: resetVoiceStreaming,
    start: startVoiceStreaming,
    state: voiceStreamingState,
    stop: stopVoiceStreaming,
  } = useDeepgramStreaming({
    enabled: voiceScoringEnabled,
    sessionKey: voiceTurnSessionKey,
    onUtterance: ({ transcript, confidence, trigger }) => {
      const proposal = buildVoiceScoreProposal({
        confidence,
        context: {
          currentRemainingScore: currentTeamScore,
          dartsAlreadyThrown: 0,
          startingScoreBeforeTurn: currentTeamScore,
        },
        transcript,
        trigger,
      });

      setVoiceProposal(proposal);

      if (proposal.prefillScore) {
        setRemainingPreview(null);
        setInputBuffer(proposal.prefillScore);
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
    setVoiceProposal(null);
    resetVoiceStreaming();
    setRemainingPreview(null);
  }, [match.currentLeg.history.length, match.currentPlayerIndex, resetVoiceStreaming]);

  useEffect(() => {
    setRemainingPreview(deriveRemainingPreview(match, inputBuffer, hasGameStarted));
  // The preview follows the active turn inputs, not unrelated match object changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasGameStarted, inputBuffer, match.currentLeg.scores, match.currentPlayerIndex, match.players]);

  useEffect(() => () => {
    if (legTransitionTimeoutRef.current !== null) {
      window.clearTimeout(legTransitionTimeoutRef.current);
    }
    if (legTransitionIntervalRef.current !== null) {
      window.clearInterval(legTransitionIntervalRef.current);
    }
    if (botTurnTimeoutRef.current !== null) {
      window.clearTimeout(botTurnTimeoutRef.current);
    }
    if (botVictoryPreviewTimeoutRef.current !== null) {
      window.clearTimeout(botVictoryPreviewTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const browserMobileQuery = window.matchMedia('(max-width: 767px)');
    const standaloneQuery = window.matchMedia('(display-mode: standalone)');

    const computeCompactBrowserMobile = () => {
      const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
      const isStandalone = standaloneQuery.matches || Boolean(navigatorWithStandalone.standalone);
      setIsCompactBrowserMobile(browserMobileQuery.matches && !isStandalone);
    };

    computeCompactBrowserMobile();

    if (typeof browserMobileQuery.addEventListener === 'function') {
      browserMobileQuery.addEventListener('change', computeCompactBrowserMobile);
      standaloneQuery.addEventListener('change', computeCompactBrowserMobile);
      return () => {
        browserMobileQuery.removeEventListener('change', computeCompactBrowserMobile);
        standaloneQuery.removeEventListener('change', computeCompactBrowserMobile);
      };
    }

    browserMobileQuery.addListener(computeCompactBrowserMobile);
    standaloneQuery.addListener(computeCompactBrowserMobile);
    return () => {
      browserMobileQuery.removeListener(computeCompactBrowserMobile);
      standaloneQuery.removeListener(computeCompactBrowserMobile);
    };
  }, []);

  const triggerFeedback = (text: string, type: 'bust' | 'miss' | 'info' | 'notice') => {
      setFeedbackMessage({ text, type });
      const duration = type === 'info' ? 2600 : 1500;
      setTimeout(() => setFeedbackMessage(null), duration);
  };
  const { ensureCurrentPlayerCanAct: canCurrentPlayerAct, persistSharedState } = useSharedX01Session({
    sharedSessionId,
    currentUserId,
    currentPlayerId: match.players[match.currentPlayerIndex]?.id,
    onRemoteMatch: (remoteMatch) => {
      setMatch(remoteMatch);
      setRemainingPreview(null);
      setUndoStack([]);
      setPendingCheckoutScore(null);
      setLegTransition(null);
      setBotVictoryPreview(null);
      setShowWinnerScreen(remoteMatch.status === 'finished');
    },
    onSyncError: () => {
      triggerFeedback('SYNC KO', 'notice');
    },
  });

  const ensureCurrentPlayerCanAct = () => {
    if (canCurrentPlayerAct()) return true;
    triggerFeedback('WAIT', 'miss');
    return false;
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

    const previousState = undoStack.at(-1);
    if (!previousState) return;

    setUndoStack((prev) => prev.slice(0, -1));
    setMatch(previousState.match);
    setElapsedSeconds(previousState.elapsedSeconds);
    setHasGameStarted(previousState.hasGameStarted);
    setShowWinnerScreen(previousState.showWinnerScreen);
    setPendingCheckoutScore(null);
    setVoiceProposal(null);
    setRemainingPreview(null);
    resetVoiceStreaming();
    void persistSharedState(previousState.match);
  };

  const processScoreSubmission = (score: number) => {
      if (!hasGameStarted) return;
      if (isKeyboardLocked) return;
      if (!ensureCurrentPlayerCanAct()) return;
      setRemainingPreview(null);
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
      if (isKeyboardLocked) return;
      if (!inputBuffer) return;
      setRemainingPreview(null);
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

  const handleCheckoutShortcut = (dartsUsed: number) => {
      if (!hasGameStarted) return;
      if (isKeyboardLocked) return;
      if (!ensureCurrentPlayerCanAct()) return;
      if (!isCheckoutPossible) return;

      const minDarts = getMinDartsForScore(currentTeamScore, match.config.checkOut);
      if (dartsUsed < minDarts) return;

      pushUndoSnapshot();
      const result = buildCheckoutConfirmResult(match, currentTeamScore, dartsUsed, elapsedSeconds);
      setMatch(result.nextMatch);
      setShowWinnerScreen(result.showWinnerScreen);
      const advancedToNextLeg =
        !result.showWinnerScreen &&
        result.nextMatch.completedLegs.length > match.completedLegs.length &&
        result.nextMatch.currentLeg.history.length === 0;
      const latestCompletedLeg = advancedToNextLeg
        ? result.nextMatch.completedLegs[result.nextMatch.completedLegs.length - 1]
        : null;
      if (advancedToNextLeg && latestCompletedLeg?.winnerId) {
        if (legTransitionTimeoutRef.current !== null) {
          window.clearTimeout(legTransitionTimeoutRef.current);
        }
        if (legTransitionIntervalRef.current !== null) {
          window.clearInterval(legTransitionIntervalRef.current);
        }
        setLegTransition({ winnerTeamId: latestCompletedLeg.winnerId, countdown: 3 });
        legTransitionIntervalRef.current = window.setInterval(() => {
          setLegTransition((prev) => {
            if (!prev) return prev;
            if (prev.countdown <= 1) {
              if (legTransitionIntervalRef.current !== null) {
                window.clearInterval(legTransitionIntervalRef.current);
                legTransitionIntervalRef.current = null;
              }
              return prev;
            }
            return { ...prev, countdown: prev.countdown - 1 };
          });
        }, 1000);
        legTransitionTimeoutRef.current = window.setTimeout(() => {
          setLegTransition(null);
          legTransitionTimeoutRef.current = null;
          if (legTransitionIntervalRef.current !== null) {
            window.clearInterval(legTransitionIntervalRef.current);
            legTransitionIntervalRef.current = null;
          }
        }, 3000);
      }
      void persistSharedState(result.persistMatch);
      setInputBuffer('');
      setPendingCheckoutScore(null);
      setVoiceProposal(null);
      resetVoiceStreaming();
  };

  const handleQuickScore = (val: number) => {
      if (!hasGameStarted) return;
      if (isKeyboardLocked) return;
      if (!ensureCurrentPlayerCanAct()) return;
      processScoreSubmission(val);
  };

  const handleCheckoutConfirm = (dartsUsed: number) => {
     if (!hasGameStarted) return;
     if (isKeyboardLocked) return;
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
    setInputBuffer('');
    void startVoiceStreaming();
  };

  const isCurrentPlayerBot = isX01BotPlayer(currentPlayer);
  const isKeyboardLocked = isCurrentPlayerBot || Boolean(botVictoryPreview);
  const matchFormatText = getMatchFormatText(match);
  const matchFormatCompactText = getMatchFormatCompactText(match);
  const feedbackStyles = getFeedbackStyles(feedbackMessage?.type);
  const doubleOutBogeyScores = new Set([159, 162, 163, 165, 166, 168, 169]);
  const isCheckoutPossible =
    match.config.checkOut === 'Open'
      ? currentTeamScore > 0 && currentTeamScore <= 180
      : match.config.checkOut === 'Double'
        ? currentTeamScore >= 2 && currentTeamScore <= 170 && !doubleOutBogeyScores.has(currentTeamScore)
        : currentTeamScore >= 2 && currentTeamScore <= 180;
  const starterOptions = getStarterOptions(match);
  const canUndoAction = !isKeyboardLocked && Boolean(inputBuffer || pendingCheckoutScore !== null || voiceProposal || voiceError || undoStack.length > 0);
  const voiceStateLabel = buildVoiceStateLabel(voiceStreamingState, voiceIssue);
  const resolvedVoiceError = voiceError || (voiceIssue ? buildVoiceRuntimeIssueMessage(voiceIssue) : null);
  const showVoicePanel = isListening || Boolean(voiceProposal) || Boolean(voiceError);
  const proposedVoiceScore = voiceProposal;
  const proposedVoiceScoreValue =
    proposedVoiceScore && proposedVoiceScore.result.status !== 'invalid' && proposedVoiceScore.result.score !== null
      ? proposedVoiceScore.result.score
      : null;
  const voiceDisplayText = voiceProposal?.guidance || voiceProposal?.transcript || liveTranscript || resolvedVoiceError || '';
  const handleStarterSelect = async (starterId: string) => {
    const nextMatch = resolveMatchStart(match, starterId);
    setMatch(nextMatch);
    setHasGameStarted(true);
    await persistSharedState(nextMatch);
  };

  const showBotVictoryPreview = useCallback((preview: BotVictoryPreview, onComplete?: () => void) => {
    if (botVictoryPreviewTimeoutRef.current !== null) {
      window.clearTimeout(botVictoryPreviewTimeoutRef.current);
    }

    setBotVictoryPreview(preview);
    botVictoryPreviewTimeoutRef.current = window.setTimeout(() => {
      setBotVictoryPreview(null);
      botVictoryPreviewTimeoutRef.current = null;
      onComplete?.();
    }, 2000);
  }, []);

  useEffect(() => {
    if (
      !hasGameStarted
      || !isCurrentPlayerBot
      || match.status !== 'active'
      || showWinnerScreen
      || pendingCheckoutScore !== null
      || legTransition
      || botVictoryPreview
    ) {
      return;
    }

    if (botTurnTimeoutRef.current !== null) {
      window.clearTimeout(botTurnTimeoutRef.current);
    }

    botTurnTimeoutRef.current = window.setTimeout(() => {
      const result = buildX01BotTurnResult({
        match,
        level: currentPlayer.botLevel ?? DEFAULT_X01_BOT_LEVEL,
        elapsedSeconds,
      });
      const { hasBotWonLeg, hasBotWonMatch, previewKind } = resolveBotVictoryPreview({
        previousMatch: match,
        nextMatch: result.nextMatch,
        currentPlayerTeamId: currentPlayer.teamId,
        showWinnerScreen: result.showWinnerScreen,
      });

      setUndoStack((prev) => [
        ...prev,
        {
          match: cloneMatchState(match),
          elapsedSeconds,
          showWinnerScreen,
          hasGameStarted,
        },
      ]);
      setMatch(result.nextMatch);
      setShowWinnerScreen(false);
      setInputBuffer('');
      setPendingCheckoutScore(null);
      setVoiceProposal(null);
      setRemainingPreview(null);
      resetVoiceStreaming();
      void persistSharedState(result.persistMatch);
      if (hasBotWonMatch || hasBotWonLeg) {
        showBotVictoryPreview(
          {
            kind: previewKind ?? 'leg',
            winnerName: currentPlayer.name,
          },
          hasBotWonMatch ? () => setShowWinnerScreen(true) : undefined,
        );
      } else {
        setShowWinnerScreen(result.showWinnerScreen);
      }
      botTurnTimeoutRef.current = null;
    }, 700);

    return () => {
      if (botTurnTimeoutRef.current !== null) {
        window.clearTimeout(botTurnTimeoutRef.current);
        botTurnTimeoutRef.current = null;
      }
    };
  }, [
    currentPlayer,
    elapsedSeconds,
    hasGameStarted,
    isCurrentPlayerBot,
    legTransition,
    match,
    botVictoryPreview,
    pendingCheckoutScore,
    persistSharedState,
    resetVoiceStreaming,
    showBotVictoryPreview,
    showWinnerScreen,
  ]);

  return (
    <div className="tablet-x01-root relative flex h-[100dvh] w-full min-h-0 flex-col overflow-hidden bg-black text-white">
      <MatchTopBar
        compactFormatText={matchFormatCompactText}
        currentTime={currentTime}
        elapsedTime={formatDuration(elapsedSeconds)}
        formatText={matchFormatText}
        onExit={() => setShowExitConfirm(true)}
        onOpenSettings={() => setShowSettings(true)}
        onOpenStats={() => setShowStats(true)}
      />

      {/* Main Score Area */}
      <div className="tablet-x01-score-area relative flex min-h-0 flex-1 items-stretch">
        {feedbackMessage && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="relative min-w-[220px] overflow-hidden rounded-[1.5rem] border px-8 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.5)] sm:min-w-[340px] sm:px-10 sm:py-8">
                    <div className={`absolute inset-x-0 top-0 h-1 ${feedbackStyles.accent}`} />
                    <div className="relative flex flex-col items-center text-center">
                        <span className={`mb-3 text-[11px] font-black uppercase tracking-[0.28em] ${feedbackStyles.kicker}`}>
                            {feedbackStyles.label}
                        </span>
                        <h1 className={`text-5xl font-black uppercase leading-none sm:text-6xl ${feedbackStyles.value}`}>
                            {feedbackMessage.text}
                        </h1>
                    </div>
                </div>
            </div>
        )}
        {botVictoryPreview && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="w-full max-w-sm rounded-2xl border border-orange-500/30 bg-gray-950/95 px-6 py-5 text-center shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
                <div className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-400">
                  {botVictoryPreview.kind === 'match' ? 'Match gagné par' : 'Manche gagnée par'}
                </div>
                <div className="mt-3 truncate text-3xl font-black uppercase italic text-white sm:text-4xl">
                  {botVictoryPreview.winnerName}
                </div>
              </div>
            </div>
        )}
        <div className="min-w-0 flex-1 overflow-hidden border-r border-gray-800/50">{teams[0] && renderPlayerArea(teams[0])}</div>
        <div className="min-w-0 flex-1 overflow-hidden">{teams[1] && renderPlayerArea(teams[1])}</div>

        <MatchStatusPill
          currentScore={currentTeamScore}
          isSetsMode={match.config.matchMode === 'SETS'}
          leftLegsWon={teams[0] ? match.legsWon[teams[0]] : 0}
          leftSetsWon={teams[0] ? match.setsWon[teams[0]] : 0}
          rightLegsWon={teams[1] ? match.legsWon[teams[1]] : 0}
          rightSetsWon={teams[1] ? match.setsWon[teams[1]] : 0}
          showHints={showHints}
        />
      </div>

      {/* Control Area */}
      {/* Spec: spec:counter/score-layout-font-scale-resilience */}
      {/* Control area uses px instead of rem for floor/ceil so system font-scale cannot push the keypad off screen. */}
      <div className={`smartphone-keyboard-sensitive tablet-x01-control-area legacy-match-control-area laptop-compact-control-area relative z-30 flex shrink-0 flex-col border-t border-gray-800 bg-gray-900 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.5)] sm:h-[clamp(240px,39svh,400px)] md:h-[clamp(16rem,32svh,24rem)] xl:h-[clamp(20rem,37svh,29rem)] ${isCompactBrowserMobile ? 'h-[clamp(196px,33svh,320px)]' : 'h-[clamp(220px,38svh,380px)]'}`}>
         
         <MatchInputBar
           canUndo={canUndoAction}
           inputBuffer={inputBuffer}
           proposedVoiceScoreValue={proposedVoiceScoreValue}
           showVoicePanel={showVoicePanel}
           voiceDisplayText={voiceDisplayText}
           onUndo={() => {
             if (!ensureCurrentPlayerCanAct()) return;
             handleUndoAction();
           }}
         />

         {/* Keypad */}
         <div className="flex min-h-0 flex-1 overflow-hidden p-1.5 sm:p-2">
            <div className="flex-1">
               <Keypad 
                  currentInput={inputBuffer} 
                  onInput={v => {
                    if (isKeyboardLocked) return;
                    setInputBuffer(prev => (prev+v).slice(0,3));
                  }} 
                  onClear={() => {
                    if (isKeyboardLocked) return;
                    setRemainingPreview(null);
                    setInputBuffer('');
                    setVoiceProposal(null);
                  }} 
                  onEnter={handleSubmitScore}
                  onRemaining={handleRemainingSubmit}
                  onCheckoutShortcut={handleCheckoutShortcut}
                  isCheckoutPossible={isCheckoutPossible}
                  checkoutScore={currentTeamScore}
                  checkoutRule={match.config.checkOut}
                  quickShortcutsLeft={shortcutsLeft}
                  quickShortcutsRight={shortcutsRight}
                  onQuickAction={handleQuickScore}
                  disabled={isKeyboardLocked}
                  voiceControl={
                    <VoiceScoringControl
                      disabled={!hasGameStarted || isKeyboardLocked || voiceStreamingState === 'processing'}
                      enabled={voiceScoringEnabled}
                      error={resolvedVoiceError}
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
                 {getWinnerDisplayName(match, match.matchWinnerId)}
             </div>
             <Button
               onClick={() => onFinishWithState ? onFinishWithState(match.matchWinnerId!, match) : onFinish(match.matchWinnerId!)}
               size="lg"
               data-testid="winner-view-stats"
               className="w-full max-w-xs h-20 text-2xl uppercase"
             >
               Voir les Stats ➔
             </Button>
          </div>
      )}

      {legTransition && !showWinnerScreen && (
        <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-black/92 p-6 text-white backdrop-blur-md">
          <div className="text-center">
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-orange-400 sm:text-xs">
              Manche gagnée
            </div>
            <div className="mt-4 text-3xl font-black italic text-white sm:text-5xl">
              {getWinnerDisplayName(match, legTransition.winnerTeamId)}
            </div>
            <div className="mt-3 text-sm font-bold uppercase tracking-[0.18em] text-gray-400 sm:text-base">
              Prochaine manche dans {legTransition.countdown}s
            </div>
          </div>
        </div>
      )}

      {showExitConfirm && (
          <div className="app-modal fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true">
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
        <MatchSettingsModal
          canCustomizeSideShortcuts={canCustomizeSideShortcuts}
          leftShortcutDrafts={leftShortcutDrafts}
          rightShortcutDrafts={rightShortcutDrafts}
          showHints={showHints}
          voiceAssistEnabled={voiceAssistEnabled}
          voiceScoringAvailable={voiceScoringAvailable}
          onClose={() => setShowSettings(false)}
          onDismissVoiceProposal={dismissVoiceProposal}
          onResetShortcutDraft={resetShortcutDraft}
          onShortcutDraftChange={handleShortcutDraftChange}
          onToggleHints={() => setShowHints((prev) => !prev)}
          onToggleVoiceAssist={() => setVoiceAssistEnabled((prev) => !prev)}
        />
      )}

      {pendingCheckoutScore !== null && (
          <div data-testid="checkout-confirm-modal" className="app-modal fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6" role="dialog" aria-modal="true">
              <h2 className="text-3xl font-black italic text-white mb-8 uppercase tracking-tighter">Bravo !</h2>
              <p className="text-gray-500 mb-4 text-xs font-bold uppercase tracking-widest">Fléchettes utilisées</p>
              
              <div className="flex w-full max-w-sm justify-center gap-3 sm:gap-4">
                  {[1, 2, 3]
                    .filter(d => d >= getMinDartsForScore(pendingCheckoutScore, match.config.checkOut))
                    .map(d => (
                      <Button
                        key={d}
                        data-testid={`checkout-darts-${d}`}
                        onClick={() => handleCheckoutConfirm(d)}
                        className="h-16 flex-1 border-2 border-gray-800 text-3xl shadow-lg transition-all hover:border-orange-500 sm:h-20 sm:text-4xl"
                      >
                        {d}
                      </Button>
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
      const playerScore = buildPlayerScoreViewModel(match, teamId, remainingPreview);

      return (
        <PlayerScore 
            name={playerScore.name}
            subtitle={playerScore.subtitle}
            showMatchStarterBadge={playerScore.showMatchStarterBadge}
          compactMobileBrowser={isCompactBrowserMobile}
            isActive={playerScore.isActive}
            score={playerScore.score}
            legsWon={playerScore.legsWon}
            setsWon={playerScore.setsWon}
            stats={playerScore.stats}
        />
      );
  }
};
