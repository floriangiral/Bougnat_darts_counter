// Spec: spec:counter/voice-scoring-reliability
import React, { useCallback, useState, useEffect, useRef } from 'react';
import { MatchState } from '../types';
import { formatDuration, resolveMatchStart } from '../src/application/scoring/matchLifecycle';
import { getMinDartsForScore } from '../src/application/scoring/matchStats';
import { Keypad } from '../components/game/Keypad';
import { Button } from '../components/ui/Button';
import { StatsModal } from '../components/stats/StatsModal';
import { StartingPlayerOverlay } from '../components/game/StartingPlayerOverlay';
import { MatchInputBar } from '../components/match/MatchInputBar';
import { MatchSettingsModal } from '../components/match/MatchSettingsModal';
import { MatchFeedbackOverlay } from '../components/match/MatchFeedbackOverlay';
import { MatchPlayersBoard } from '../components/match/MatchPlayersBoard';
import { GameScreenLayout } from '../components/layout/GameScreenLayout';
import { MatchTopBar } from '../components/match/MatchTopBar';
import { env } from '../src/lib/env';
import { useSharedX01Session } from '../src/features/x01/session/useSharedX01Session';
import type { VoiceScoreProposalState } from '../src/features/x01/voice/dartsSpeechTypes';
import { buildVoiceScoreProposal } from '../src/features/x01/voice/voiceProposalModel';
import { buildVoiceRuntimeIssueMessage, buildVoiceStateLabel } from '../src/features/x01/voice/voiceSessionModel';
import { useDeepgramStreaming } from '../src/features/x01/voice/useDeepgramStreaming';
import { VoiceScoringControl } from '../src/features/x01/voice/VoiceScoringControl';
import { buildCheckoutConfirmResult, buildScoreSubmissionResult, cloneMatchState, type FeedbackKind, type ScoreSubmissionOptions } from '../src/features/x01/scoring/matchSubmission';
import { deriveRemainingPreview, type RemainingPreview } from '../src/features/x01/scoring/matchPreview';
import { isCheckoutPossible } from '../src/features/x01/scoring/checkoutEligibility';
import { isDeadRemainingScore, isX01TeamOpened } from '../src/features/x01/scoring/x01Rules';
import { resolveBotVictoryPreview } from '../src/features/x01/scoring/botVictoryPreview';
import { getMatchFormatCompactText, getMatchFormatText, getOpeningConfirmQuestion, getStarterOptions, getWinnerDisplayName } from '../src/features/x01/scoring/matchPresentation';
import { buildX01BotTurnResult } from '../src/application/x01Bot/x01BotTurn';
import { DEFAULT_X01_BOT_LEVEL, isX01BotPlayer } from '../src/domain/x01Bot/x01Bot';
import { useMatchTimer } from '../src/features/x01/hooks/useMatchTimer';
import { useMatchShortcuts } from '../src/features/x01/hooks/useMatchShortcuts';
import type { MatchRuntimeSnapshot, X01UndoSnapshot } from '../src/shared/session/persistedAppSession';
import { useViewport } from '../src/features/layout/useViewportClass';

interface MatchViewProps {
  initialMatch: MatchState;
  onFinish: (winnerId: string) => void;
  onFinishWithState?: (winnerId: string, match: MatchState) => void;
  onExit: () => void;
  sharedSessionId?: string;
  currentUserId?: string;
  skipStartingPlayerPrompt?: boolean;
  restoredState?: MatchRuntimeSnapshot | null;
  /** Called on business changes only (never on a clock tick), spec 010. */
  onStateChange?: (snapshot: MatchRuntimeSnapshot) => void;
}

type MatchUndoSnapshot = X01UndoSnapshot;

type LegTransitionState = {
  winnerTeamId: string;
  countdown: number;
};

type BotVictoryPreview = {
  kind: 'leg' | 'match';
  winnerName: string;
};

// Une manche déjà jouée fige le départ : le choix « Qui commence ? » n'a plus d'effet (x01Rotation).
const hasMatchProgress = (match: MatchState) => match.currentLeg.history.length > 0 || match.completedLegs.length > 0;

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
  // Spec 070: the phone density comes from the single resolver (no local matchMedia detection).
  const viewport = useViewport();
  const isCompactPhone = viewport.layoutMode === 'smartphone' && (viewport.density === 'tight' || viewport.density === 'compact');
  // Spec 072 : en arène et en téléphone paysage tactiles, joueurs | saisie côte à côte (bureau inchangé).
  const isTouchSplit = viewport.input === 'touch' && (viewport.recipe === 'arena' || viewport.recipe === 'phone-landscape');
  const isArena = viewport.input === 'touch' && viewport.recipe === 'arena';
  const [inputBuffer, setInputBuffer] = useState<string>('');

  // Modals & UI States
  const [showStats, setShowStats] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWinnerScreen, setShowWinnerScreen] = useState(false);
  const [hasGameStarted, setHasGameStarted] = useState(
    () => restoredState?.hasGameStarted ?? (skipStartingPlayerPrompt || hasMatchProgress(initialMatch))
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
  const [pendingOpeningScore, setPendingOpeningScore] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: FeedbackKind } | null>(null);
  const [remainingPreview, setRemainingPreview] = useState<RemainingPreview | null>(null);

  // Match UI state
  const [showHints, setShowHints] = useState(false);
  const [voiceAssistEnabled, setVoiceAssistEnabled] = useState(true);
  const {
    canCustomizeSideShortcuts,
    shortcutsLeft,
    shortcutsRight,
    shortcutsMobile,
    leftShortcutDrafts,
    rightShortcutDrafts,
    mobileShortcutDrafts,
    mobileShortcutsEnabled,
    toggleMobileShortcuts,
    handleShortcutDraftChange,
    resetShortcutDraft,
  } = useMatchShortcuts();
  const showMobileShortcuts = mobileShortcutsEnabled && shortcutsMobile.length > 0;
  const [undoStack, setUndoStack] = useState<MatchUndoSnapshot[]>(() => restoredState?.undoStack ?? []);
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
      setPendingOpeningScore(null);
      setUndoStack(restoredState.undoStack ?? []);
      setLegTransition(null);
      setBotVictoryPreview(null);
      return;
    }

    setMatch(initialMatch);
    setHasGameStarted(skipStartingPlayerPrompt || hasMatchProgress(initialMatch));
    setElapsedSeconds(0);
    setShowWinnerScreen(false);
    setPendingCheckoutScore(null);
    setPendingOpeningScore(null);
    setUndoStack([]);
    setLegTransition(null);
    setBotVictoryPreview(null);
    setVoiceProposal(null);
    setVoiceAssistEnabled(true);
  // The reset is keyed by match and restored-state IDs; object identity would reset active input on each render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMatch.id, restoredState?.match.id, skipStartingPlayerPrompt]);

  const currentPlayer = match.players[match.currentPlayerIndex];
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

  // The clock is read through a ref: a tick alone must not publish (and persist) a snapshot.
  const elapsedSecondsRef = useRef(elapsedSeconds);
  useEffect(() => {
    elapsedSecondsRef.current = elapsedSeconds;
  }, [elapsedSeconds]);

  useEffect(() => {
    onStateChange?.({
      match,
      hasGameStarted,
      elapsedSeconds: elapsedSecondsRef.current,
      measuredAt: Date.now(),
      undoStack,
    });
  }, [hasGameStarted, match, onStateChange, undoStack]);

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
      setPendingOpeningScore(null);
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

    if (pendingOpeningScore !== null) {
      setPendingOpeningScore(null);
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

  const processScoreSubmission = (score: number, options?: ScoreSubmissionOptions) => {
      if (!hasGameStarted) return;
      if (isKeyboardLocked) return;
      if (!ensureCurrentPlayerCanAct()) return;
      setRemainingPreview(null);
      const result = buildScoreSubmissionResult(match, score, elapsedSeconds, options);

      if (result.kind === 'invalid') {
        triggerFeedback(result.feedback.text, result.feedback.type);
        return;
      }

      if (result.kind === 'checkout_confirm') {
        setPendingCheckoutScore(result.score);
        setInputBuffer('');
        return;
      }

      if (result.kind === 'opening_confirm') {
        setPendingOpeningScore(result.score);
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
        processScoreSubmission(Number.parseInt(inputBuffer, 10));
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
      const targetRemaining = Number.parseInt(inputBuffer);
      if (Number.isNaN(targetRemaining)) return;

      const currentPlayer = match.players[match.currentPlayerIndex];
      const currentScore = match.currentLeg.scores[currentPlayer.teamId];

      if (!currentTeamOpened) {
          triggerFeedback("OUVERTURE REQUISE", "notice");
          return;
      }

      if (targetRemaining < 0 || targetRemaining > currentScore) {
          triggerFeedback("SCORE RESTANT IMPOSSIBLE", "notice");
          return;
      }

      if (targetRemaining === currentScore) {
          triggerFeedback("UTILISE MISS", "miss");
          return;
      }

      if (isDeadRemainingScore(targetRemaining, match.config.checkOut)) {
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
      if (!checkoutIsPossible) return;

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
        ? result.nextMatch.completedLegs.at(-1)
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

  // « Non » : aucune ouverture dans la visite, elle est enregistrée à 0.
  const handleOpeningConfirm = (opened: boolean) => {
     if (pendingOpeningScore === null) return;
     const openingScore = pendingOpeningScore;
     setPendingOpeningScore(null);
     processScoreSubmission(opened ? openingScore : 0, { openingConfirmed: true });
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
  const currentTeamOpened = isX01TeamOpened(match, currentPlayer.teamId);
  // Avant l'ouverture, une sortie directe (appui long) contournerait l'attestation d'ouverture.
  const checkoutIsPossible = currentTeamOpened && isCheckoutPossible(currentTeamScore, match.config.checkOut);
  const starterOptions = getStarterOptions(match);
  const canUndoAction = !isKeyboardLocked && Boolean(inputBuffer || pendingCheckoutScore !== null || pendingOpeningScore !== null || voiceProposal || voiceError || undoStack.length > 0);
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
      || pendingOpeningScore !== null
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
    pendingOpeningScore,
    persistSharedState,
    resetVoiceStreaming,
    showBotVictoryPreview,
    showWinnerScreen,
  ]);

  const matchWinnerId = match.matchWinnerId;

  const handleUndoPress = () => {
    if (!ensureCurrentPlayerCanAct()) return;
    handleUndoAction();
  };

  const players = (
    <>
      <MatchPlayersBoard
        match={match}
        remainingPreview={remainingPreview}
        compactMobileBrowser={isCompactPhone}
        splitLayout={isTouchSplit}
        largeActive={isArena}
        showHints={showHints}
      />
      {feedbackMessage && <MatchFeedbackOverlay text={feedbackMessage.text} type={feedbackMessage.type} />}
      {botVictoryPreview && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-scrim p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-brand-border bg-surface-raised px-6 py-5 text-center shadow-elevated">
            <div className="text-[10px] font-black uppercase tracking-[0.28em] text-brand-fg">
              {botVictoryPreview.kind === 'match' ? 'Match gagné par' : 'Manche gagnée par'}
            </div>
            <div className="mt-3 truncate text-3xl font-black uppercase italic text-fg sm:text-4xl">
              {botVictoryPreview.winnerName}
            </div>
          </div>
        </div>
      )}
      {/* Q5 (spec 072) : en arène, la transition de manche reste dans la zone joueurs (x01.css). */}
      {legTransition && !showWinnerScreen && (
        <div data-testid="x01-leg-transition" className="x01-leg-transition fixed inset-0 z-[90] flex flex-col items-center justify-center bg-overlay p-6 text-fg backdrop-blur-md">
          <div className="text-center">
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-brand-fg sm:text-xs">
              Manche gagnée
            </div>
            <div className="mt-4 text-3xl font-black italic text-fg sm:text-5xl">
              {getWinnerDisplayName(match, legTransition.winnerTeamId)}
            </div>
            <div className="mt-3 text-sm font-bold uppercase tracking-[0.18em] text-fg-subtle sm:text-base">
              Prochaine manche dans {legTransition.countdown}s
            </div>
          </div>
        </div>
      )}
    </>
  );

  const input = (
    <>
      <MatchInputBar
        canUndo={canUndoAction}
        inputBuffer={inputBuffer}
        proposedVoiceScoreValue={proposedVoiceScoreValue}
        showVoicePanel={showVoicePanel}
        voiceDisplayText={voiceDisplayText}
        onUndo={handleUndoPress}
        showUndo={!isArena}
      />

      <div className="x01-keypad-area flex min-h-0 flex-1 overflow-hidden p-1.5">
        <div className="min-h-0 flex-1">
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
            isCheckoutPossible={checkoutIsPossible}
            checkoutScore={currentTeamScore}
            checkoutRule={match.config.checkOut}
            quickShortcutsLeft={shortcutsLeft}
            quickShortcutsRight={shortcutsRight}
            quickShortcutsMobile={showMobileShortcuts ? shortcutsMobile : []}
            onQuickAction={handleQuickScore}
            disabled={isKeyboardLocked}
            undoKey={isArena ? { onUndo: handleUndoPress, canUndo: canUndoAction } : undefined}
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

      {/* Q4 (spec 072) : choix des fléchettes au finish. Modale plein écran en pile ; en arène et en
          téléphone paysage, panneau limité à la zone de saisie, les scores restent visibles (x01.css). */}
      {pendingCheckoutScore !== null && (
        <dialog
          open
          aria-label="Fléchettes utilisées"
          data-testid="checkout-confirm-modal"
          className="x01-checkout-panel app-modal fixed inset-0 z-50 m-0 flex h-full w-full max-h-none max-w-none flex-col items-center justify-center overflow-y-auto border-0 bg-overlay p-6 text-fg backdrop-blur-md"
        >
          <h2 className="mb-8 text-3xl font-black uppercase italic tracking-tighter text-fg">Bravo !</h2>
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-fg-muted">Fléchettes utilisées</p>

          <div className="flex w-full max-w-sm justify-center gap-3 sm:gap-4">
            {[1, 2, 3]
              .filter(d => d >= getMinDartsForScore(pendingCheckoutScore, match.config.checkOut))
              .map(d => (
                <Button
                  key={d}
                  data-testid={`checkout-darts-${d}`}
                  onClick={() => handleCheckoutConfirm(d)}
                  className="h-16 flex-1 border-2 text-3xl transition-all sm:h-20 sm:text-4xl"
                >
                  {d}
                </Button>
            ))}
          </div>
          <Button
            variant="secondary"
            data-testid="checkout-cancel"
            onClick={() => setPendingCheckoutScore(null)}
            className="mt-6 h-14 w-full max-w-sm"
          >
            Annuler
          </Button>
        </dialog>
      )}
    </>
  );

  return (
    <GameScreenLayout
      game="x01"
      header={
        <MatchTopBar
          compactFormatText={matchFormatCompactText}
          currentTime={currentTime}
          elapsedTime={formatDuration(elapsedSeconds)}
          formatText={matchFormatText}
          onExit={() => setShowExitConfirm(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenStats={() => setShowStats(true)}
        />
      }
      players={players}
      playersProps={{ className: 'x01-score-area flex items-stretch' }}
      input={input}
      // Spec: spec:counter/score-layout-font-scale-resilience
      // Control area uses px instead of rem for floor/ceil so system font-scale cannot push the keypad off screen.
      // Below md the height comes from .x01-control-area (x01.css): --x01-control-h is the preferred
      // height, floored there so 44px smartphone keys never overlap and grown for the shortcut row.
      inputProps={{
        'data-mobile-shortcuts': showMobileShortcuts,
        className: `x01-control-area smartphone-keyboard-sensitive legacy-match-control-area laptop-compact-control-area z-30 flex shrink-0 flex-col border-t border-border bg-surface pb-safe shadow-up sm:[--x01-control-h:clamp(240px,39svh,400px)] md:h-[clamp(16rem,32svh,24rem)] xl:h-[clamp(20rem,37svh,29rem)] ${isCompactPhone ? '[--x01-control-h:clamp(196px,33svh,320px)]' : '[--x01-control-h:clamp(220px,38svh,380px)]'}`,
      }}
    >
      {showWinnerScreen && matchWinnerId !== null && (
          <div className="fixed inset-0 z-[100] bg-canvas flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
             <h1 className="mb-4 text-center text-4xl font-black italic text-brand-fg sm:text-6xl">VAINQUEUR</h1>
             <div className="mb-12 border-b-4 border-brand pb-4 text-center text-2xl font-bold uppercase text-fg sm:text-3xl">
                 {getWinnerDisplayName(match, matchWinnerId)}
             </div>
             <Button
               onClick={() => onFinishWithState ? onFinishWithState(matchWinnerId, match) : onFinish(matchWinnerId)}
               size="lg"
               data-testid="winner-view-stats"
               className="w-full max-w-xs h-20 text-2xl uppercase"
             >
               Voir les Stats ➔
             </Button>
          </div>
      )}

      {showExitConfirm && (
          <dialog open aria-label="Quitter le match ?" className="app-modal fixed inset-0 z-50 m-0 h-full w-full max-h-none max-w-none border-0 bg-overlay text-fg backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface rounded-xl p-6 w-full max-w-sm text-center border border-border-strong">
                <h3 className="text-2xl font-black text-fg mb-2 italic uppercase">Quitter le match ?</h3>
                <div className="grid grid-cols-2 gap-3 mt-8">
                    <Button variant="secondary" onClick={() => setShowExitConfirm(false)}>NON</Button>
                    <Button variant="danger" onClick={() => { setShowExitConfirm(false); onExit(); }}>OUI</Button>
                </div>
            </div>
          </dialog>
      )}

      {showSettings && (
        <MatchSettingsModal
          canCustomizeSideShortcuts={canCustomizeSideShortcuts}
          leftShortcutDrafts={leftShortcutDrafts}
          rightShortcutDrafts={rightShortcutDrafts}
          mobileShortcutDrafts={mobileShortcutDrafts}
          mobileShortcutsEnabled={mobileShortcutsEnabled}
          onToggleMobileShortcuts={toggleMobileShortcuts}
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

      {pendingOpeningScore !== null && (
          <dialog open aria-label="Ouverture réussie ?" data-testid="opening-confirm-modal" className="app-modal fixed inset-0 z-50 m-0 h-full w-full max-h-none max-w-none border-0 bg-overlay text-fg backdrop-blur-md flex flex-col items-center justify-center p-6">
              <h2 className="text-3xl font-black italic text-fg mb-4 uppercase tracking-tighter">Ouverture</h2>
              <p className="mb-8 max-w-sm text-center text-lg font-bold text-fg-soft">
                {getOpeningConfirmQuestion(match.config.checkIn, pendingOpeningScore)}
              </p>
              <div className="flex w-full max-w-sm justify-center gap-3 sm:gap-4">
                  <Button
                    variant="secondary"
                    data-testid="opening-confirm-no"
                    onClick={() => handleOpeningConfirm(false)}
                    className="h-16 flex-1 text-2xl sm:h-20"
                  >
                    Non
                  </Button>
                  <Button
                    data-testid="opening-confirm-yes"
                    onClick={() => handleOpeningConfirm(true)}
                    className="h-16 flex-1 text-2xl sm:h-20"
                  >
                    Oui
                  </Button>
              </div>
          </dialog>
      )}

      {showStats && <StatsModal match={match} onClose={() => setShowStats(false)} title="Statistiques" />}
      {!skipStartingPlayerPrompt && !hasGameStarted && !showWinnerScreen && (
        <StartingPlayerOverlay options={starterOptions} onSelect={(starterId) => {
          handleStarterSelect(starterId).catch((error: unknown) => {
            console.error('Failed to persist match starter', error);
          });
        }} onCancel={onExit} />
      )}
    </GameScreenLayout>
  );

};
