// Spec: spec:counter/voice-scoring-reliability
import React, { useCallback, useState, useEffect, useRef } from 'react';
import { MatchState } from '../types';
import { formatDuration, isLegVisitLimitReached, resolveLegByBullOff, resolveMatchStart } from '../src/application/scoring/matchLifecycle';
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
import { ConfirmExitDialog, GameHeader, useExitConfirmation } from '../components/game/controls';
import { env } from '../src/lib/env';
import { useSharedX01Session } from '../src/features/x01/session/useSharedX01Session';
import type { VoiceRuntimeIssue, VoiceScoreProposalState } from '../src/features/x01/voice/dartsSpeechTypes';
import { buildVoiceScoreProposal } from '../src/features/x01/voice/voiceProposalModel';
import { buildVoiceRuntimeIssueMessage, buildVoiceStateLabel } from '../src/features/x01/voice/voiceSessionModel';
import { useDeepgramStreaming } from '../src/features/x01/voice/useDeepgramStreaming';
import { VoiceScoringControl } from '../src/features/x01/voice/VoiceScoringControl';
import { VoicePrivacyNotice } from '../src/features/x01/voice/VoicePrivacyNotice';
import { acceptVoicePrivacyNotice, hasAcceptedVoicePrivacyNotice } from '../src/app/voicePrivacyNoticeController';
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
import { useCounterSettings } from '../src/app/useCounterSettings';
import { updateX01Settings } from '../src/features/settings/counterSettings';
import type { MatchRuntimeSnapshot, X01UndoSnapshot } from '../src/shared/session/persistedAppSession';
import { useViewport } from '../src/features/layout/useViewportClass';
import type { ViewportClass } from '../src/features/layout/viewportClass';
import { FitText } from '../components/ui/FitText';

interface MatchViewProps {
  initialMatch: MatchState;
  onFinish: (winnerId: string) => void;
  onFinishWithState?: (winnerId: string, match: MatchState) => void;
  onRematch?: (finishedMatch: MatchState) => void;
  externalResultReturn?: { host: string; onSend: (finishedMatch: MatchState) => void };
  onExit: () => void;
  sharedSessionId?: string;
  currentUserId?: string;
  skipStartingPlayerPrompt?: boolean;
  skipWinnerScreen?: boolean;
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

/** Présentation de l'écran X01 selon la classe d'écran (spec 070), sans effet sur l'état de la partie. */
const resolveMatchLayout = (viewport: ViewportClass) => {
  const isTouch = viewport.input === 'touch';
  // Spec 070: the phone density comes from the single resolver (no local matchMedia detection).
  const isCompactPhone = viewport.layoutMode === 'smartphone' && (viewport.density === 'tight' || viewport.density === 'compact');
  // Spec 072 : en arène et en téléphone paysage tactiles, joueurs | saisie côte à côte (bureau inchangé).
  const isTouchSplit = isTouch && (viewport.recipe === 'arena' || viewport.recipe === 'phone-landscape');
  const isArena = isTouch && viewport.recipe === 'arena';
  // Tablette portrait (décision PO du 2026-11-20) : joueur actif dominant. Seules les props changent :
  // aucun composant porteur d'état n'est démonté.
  const isTabletPortrait = viewport.layoutMode === 'tablet' && isTouch
    && viewport.recipe !== 'arena' && viewport.orientation === 'portrait';
  return {
    isCompactPhone,
    isTouchSplit,
    isArena,
    isTabletPortrait,
    // Pavé tablette (portrait et arène) : bandeau d'affichage en grand, rangée de grands raccourcis, pavé 4 colonnes.
    isTabletKeypad: isArena || isTabletPortrait,
  };
};

type VoiceDisplayInput = {
  voiceProposal: VoiceScoreProposalState | null;
  voiceError: string | null;
  voiceIssue: VoiceRuntimeIssue | null;
  liveTranscript: string;
  isListening: boolean;
};

/** Texte, score proposé et état d'erreur affichés pour la saisie vocale du tour en cours. */
const deriveVoiceDisplay = ({ voiceProposal, voiceError, voiceIssue, liveTranscript, isListening }: VoiceDisplayInput) => {
  const resolvedVoiceError = voiceError || (voiceIssue ? buildVoiceRuntimeIssueMessage(voiceIssue) : null);
  const proposedVoiceScoreValue =
    voiceProposal && voiceProposal.result.status !== 'invalid' && voiceProposal.result.score !== null
      ? voiceProposal.result.score
      : null;
  const voiceDisplayText = voiceProposal?.guidance || voiceProposal?.transcript || liveTranscript || resolvedVoiceError || '';
  return {
    resolvedVoiceError,
    showVoicePanel: isListening || Boolean(voiceProposal) || Boolean(voiceError),
    proposedVoiceScoreValue,
    voiceDisplayText,
    isVoiceTextError: Boolean(resolvedVoiceError) && voiceDisplayText === resolvedVoiceError,
  };
};

export const MatchView: React.FC<MatchViewProps> = (props) => {
  const matchId = props.restoredState?.match.id ?? props.initialMatch.id;
  return <MatchViewSession key={matchId} {...props} />;
};

const MatchViewSession: React.FC<MatchViewProps> = ({
  initialMatch,
  onFinish,
  onFinishWithState,
  onRematch,
  externalResultReturn,
  onExit,
  sharedSessionId,
  currentUserId,
  skipStartingPlayerPrompt = false,
  skipWinnerScreen = false,
  restoredState = null,
  onStateChange,
}) => {
  const [match, setMatch] = useState<MatchState>(restoredState?.match ?? initialMatch);
  const { isCompactPhone, isTouchSplit, isArena, isTabletPortrait, isTabletKeypad } = resolveMatchLayout(useViewport());
  const [inputBuffer, setInputBuffer] = useState<string>('');

  // Modals & UI States
  const [showStats, setShowStats] = useState(false);
  const exitConfirmation = useExitConfirmation(onExit);
  const [showSettings, setShowSettings] = useState(false);
  // Spec 080 : fiche voix avant la première écoute (« consent ») ou depuis les options (« info »).
  const [voicePrivacyNotice, setVoicePrivacyNotice] = useState<'consent' | 'info' | null>(null);
  // Parcours 2 : « Saisie manuelle » coupe la voix pour ce match seulement.
  const [voiceDeclinedForMatch, setVoiceDeclinedForMatch] = useState(false);
  const [showWinnerScreen, setShowWinnerScreen] = useState(false);
  const autoFinishedMatchIdRef = useRef<string | null>(null);
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

  const finishWithoutWinnerScreen = useCallback((finishedMatch: MatchState): boolean => {
    if (!skipWinnerScreen || finishedMatch.status !== 'finished' || !finishedMatch.matchWinnerId) return false;
    if (autoFinishedMatchIdRef.current === finishedMatch.id) return true;

    autoFinishedMatchIdRef.current = finishedMatch.id;
    if (externalResultReturn) externalResultReturn.onSend(finishedMatch);
    else if (onFinishWithState) onFinishWithState(finishedMatch.matchWinnerId, finishedMatch);
    else onFinish(finishedMatch.matchWinnerId);
    return true;
  }, [externalResultReturn, onFinish, onFinishWithState, skipWinnerScreen]);

  useEffect(() => {
    if (botVictoryPreview || match.status !== 'finished') return;
    finishWithoutWinnerScreen(match);
  }, [botVictoryPreview, finishWithoutWinnerScreen, match]);
  
  // Game Interaction States
  const [pendingCheckoutScore, setPendingCheckoutScore] = useState<number | null>(null);
  const [pendingOpeningScore, setPendingOpeningScore] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: FeedbackKind } | null>(null);
  const [remainingPreview, setRemainingPreview] = useState<RemainingPreview | null>(null);

  // Match UI state
  // Spec 129 : préférences de l'appareil, partagées avec la page Réglages.
  const [counterSettings, updateCounterSettings] = useCounterSettings();
  const showHints = counterSettings.x01.checkoutHints;
  const voiceAssistEnabled = counterSettings.x01.voiceAssist;
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
    commitShortcutDraft,
  } = useMatchShortcuts();
  const showMobileShortcuts = !isTabletKeypad && mobileShortcutsEnabled && shortcutsMobile.length > 0;
  const [undoStack, setUndoStack] = useState<MatchUndoSnapshot[]>(() => restoredState?.undoStack ?? []);
  const [voiceProposal, setVoiceProposal] = useState<VoiceScoreProposalState | null>(null);
  const hydratedMatchIdRef = useRef<string | null>(null);
  const legTransitionTimeoutRef = useRef<number | null>(null);
  const legTransitionIntervalRef = useRef<number | null>(null);
  const botTurnTimeoutRef = useRef<number | null>(null);
  const botVictoryPreviewTimeoutRef = useRef<number | null>(null);
  const voiceScoringAvailable = env.VITE_ENABLE_VOICE_SCORING;
  const voiceScoringEnabled = voiceScoringAvailable && voiceAssistEnabled && !voiceDeclinedForMatch;

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
    setVoiceDeclinedForMatch(false);
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
    isPrivacyNoticeAccepted: hasAcceptedVoicePrivacyNotice,
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

  // « Annuler », premier temps : efface la saisie en cours (chiffres, confirmation, proposition vocale).
  const clearPendingInput = () => {
    if (inputBuffer) {
      setRemainingPreview(null);
      setInputBuffer('');
      setVoiceProposal(null);
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
    }
  };

  // « Annuler », second temps (aucune saisie en cours) : revient sur la dernière volée validée.
  const undoLastVisit = () => {
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

      if (finishWithoutWinnerScreen(result.nextMatch)) return;
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

  const startLegTransition = (winnerTeamId: string) => {
    if (legTransitionTimeoutRef.current !== null) {
      window.clearTimeout(legTransitionTimeoutRef.current);
    }
    if (legTransitionIntervalRef.current !== null) {
      window.clearInterval(legTransitionIntervalRef.current);
    }
    setLegTransition({ winnerTeamId, countdown: 3 });
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
  };

  const handleCheckoutShortcut = (dartsUsed: number) => {
      if (!hasGameStarted) return;
      if (isKeyboardLocked) return;
      if (!ensureCurrentPlayerCanAct()) return;
      if (!checkoutIsPossible) return;

      const minDarts = getMinDartsForScore(currentTeamScore, match.config.checkOut);
      if (dartsUsed < minDarts) return;

      const result = buildCheckoutConfirmResult(match, currentTeamScore, dartsUsed, elapsedSeconds);
      if (finishWithoutWinnerScreen(result.nextMatch)) return;
      pushUndoSnapshot();
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
        startLegTransition(latestCompletedLeg.winnerId);
      }
      void persistSharedState(result.persistMatch);
      setInputBuffer('');
      setPendingCheckoutScore(null);
      setVoiceProposal(null);
      resetVoiceStreaming();
  };

  // Limite de volées atteinte : le camp le plus près du bull (une fléchette chacun) gagne la manche.
  const handleBullOffWinner = (winnerTeamId: string) => {
      if (!isBullOffPending) return;
      if (!canCurrentPlayerAct()) {
        triggerFeedback('WAIT', 'miss');
        return;
      }

      const resolved = resolveLegByBullOff(match, winnerTeamId);
      if (resolved === match) return;
      const nextMatch = resolved.status === 'finished' ? { ...resolved, duration: elapsedSeconds } : resolved;
      if (finishWithoutWinnerScreen(nextMatch)) return;

      pushUndoSnapshot();
      setMatch(nextMatch);
      setShowWinnerScreen(nextMatch.status === 'finished');
      if (nextMatch.status !== 'finished') startLegTransition(winnerTeamId);
      void persistSharedState(nextMatch);
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
     if (finishWithoutWinnerScreen(result.nextMatch)) return;
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

    // RM-01 : aucune écoute (ni jeton, ni micro) avant le choix sur la fiche.
    if (!hasAcceptedVoicePrivacyNotice()) {
      setVoicePrivacyNotice('consent');
      return;
    }

    setVoiceProposal(null);
    setInputBuffer('');
    void startVoiceStreaming();
  };

  const acceptVoicePrivacy = () => {
    acceptVoicePrivacyNotice();
    setVoicePrivacyNotice(null);
    handleVoiceToggle();
  };

  const declineVoicePrivacy = () => {
    setVoicePrivacyNotice(null);
    setVoiceDeclinedForMatch(true);
  };

  const isCurrentPlayerBot = isX01BotPlayer(currentPlayer);
  const isBullOffPending = hasGameStarted && isLegVisitLimitReached(match);
  const isKeyboardLocked = isCurrentPlayerBot || Boolean(botVictoryPreview) || isBullOffPending;
  const matchFormatText = getMatchFormatText(match);
  const matchFormatCompactText = getMatchFormatCompactText(match);
  const currentTeamOpened = isX01TeamOpened(match, currentPlayer.teamId);
  // Avant l'ouverture, une sortie directe (appui long) contournerait l'attestation d'ouverture.
  const checkoutIsPossible = currentTeamOpened && isCheckoutPossible(currentTeamScore, match.config.checkOut);
  const starterOptions = getStarterOptions(match);
  const bullOffTeamIds = Array.from(new Set(match.players.map((player) => player.teamId)));
  const hasPendingInput = Boolean(inputBuffer || pendingCheckoutScore !== null || pendingOpeningScore !== null || voiceProposal || voiceError);
  const canUndoLastVisit = undoStack.length > 0;
  const voiceStateLabel = buildVoiceStateLabel(voiceStreamingState, voiceIssue);
  const {
    resolvedVoiceError,
    showVoicePanel,
    proposedVoiceScoreValue,
    voiceDisplayText,
    isVoiceTextError,
  } = deriveVoiceDisplay({ voiceProposal, voiceError, voiceIssue, liveTranscript, isListening });
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
      || isBullOffPending
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

      if (finishWithoutWinnerScreen(result.nextMatch)) {
        botTurnTimeoutRef.current = null;
        return;
      }

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
    finishWithoutWinnerScreen,
    isBullOffPending,
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

  const keypadUndo = {
    hasPendingInput,
    canUndoLast: canUndoLastVisit,
    onClearInput: () => {
      if (isKeyboardLocked) return;
      clearPendingInput();
    },
    onUndoLast: () => {
      if (isKeyboardLocked || !ensureCurrentPlayerCanAct()) return;
      undoLastVisit();
    },
  };
  const voiceControl = (
    <VoiceScoringControl
      disabled={!hasGameStarted || isKeyboardLocked || voiceStreamingState === 'processing'}
      enabled={voiceScoringEnabled}
      error={resolvedVoiceError}
      issue={voiceIssue}
      isListening={isListening}
      onToggle={handleVoiceToggle}
      stateLabel={voiceStateLabel}
    />
  );

  const players = (
    <>
      <MatchPlayersBoard
        match={match}
        remainingPreview={remainingPreview}
        compactMobileBrowser={isCompactPhone}
        splitLayout={isTouchSplit || isTabletPortrait}
        largeActive={isArena || isTabletPortrait}
        scaleWithScreen={isTabletPortrait}
        showHints={showHints}
      />
      {feedbackMessage && <MatchFeedbackOverlay text={feedbackMessage.text} type={feedbackMessage.type} />}
      {botVictoryPreview && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-scrim p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-brand-border bg-surface-raised px-6 py-5 text-center shadow-elevated">
            <div className="text-[10px] font-black uppercase tracking-[0.28em] text-brand-fg">
              {botVictoryPreview.kind === 'match' ? 'Match gagné par' : 'Manche gagnée par'}
            </div>
            <FitText as="div" className="mt-3 text-3xl font-black uppercase italic text-fg sm:text-4xl">
              {botVictoryPreview.winnerName}
            </FitText>
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
        layout={isTabletKeypad ? 'display' : 'bar'}
        inputBuffer={inputBuffer}
        proposedVoiceScoreValue={proposedVoiceScoreValue}
        showVoicePanel={showVoicePanel || (isTabletKeypad && isVoiceTextError)}
        voiceDisplayText={voiceDisplayText}
        voiceError={isVoiceTextError}
        remainingAfter={remainingPreview?.score ?? null}
        checkoutPossible={hasGameStarted && checkoutIsPossible}
      />

      <div className="x01-keypad-area flex min-h-0 flex-1 overflow-hidden p-1.5">
        <div className="min-h-0 flex-1">
          <Keypad
            layout={isTabletKeypad ? 'tablet' : 'classic'}
            currentInput={inputBuffer}
            onInput={v => {
              if (isKeyboardLocked) return;
              setInputBuffer(prev => (prev+v).slice(0,3));
            }}
            undo={keypadUndo}
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
            voiceControl={voiceControl}
          />
        </div>
      </div>

      {/* Q4 (spec 072) : choix des fléchettes au finish. Modale plein écran sur téléphone portrait et bureau ;
          en arène, téléphone paysage et tablette portrait, panneau limité à la zone de saisie (x01.css). */}
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

      {isBullOffPending && !showWinnerScreen && (
        <dialog
          open
          aria-labelledby="x01-bull-off-title"
          data-testid="bull-off-modal"
          className="x01-checkout-panel app-modal fixed inset-0 z-50 m-0 flex h-full w-full max-h-none max-w-none flex-col items-center justify-center overflow-y-auto border-0 bg-overlay p-6 text-center text-fg backdrop-blur-md"
        >
          <h2 id="x01-bull-off-title" className="mb-3 text-3xl font-black uppercase italic tracking-tighter text-fg">
            Départage au bull
          </h2>
          <p className="mb-6 max-w-sm text-sm font-bold text-fg-muted">
            Limite de {match.config.maxVisitsPerLeg} volées atteinte. Une fléchette chacun : le plus près du bull gagne la manche.
          </p>
          <div className="flex w-full max-w-sm flex-col gap-3">
            {bullOffTeamIds.map((teamId) => (
              <Button
                key={teamId}
                data-testid={`bull-off-winner-${teamId}`}
                onClick={() => handleBullOffWinner(teamId)}
                className="h-16 w-full text-xl"
              >
                {getWinnerDisplayName(match, teamId)}
              </Button>
            ))}
          </div>
          {canUndoLastVisit && (
            <Button
              variant="secondary"
              data-testid="bull-off-undo"
              onClick={() => {
                if (!ensureCurrentPlayerCanAct()) return;
                undoLastVisit();
              }}
              className="mt-6 h-14 w-full max-w-sm"
            >
              Annuler la dernière volée
            </Button>
          )}
        </dialog>
      )}
    </>
  );

  return (
    <GameScreenLayout
      game="x01"
      header={
        <GameHeader
          game="x01"
          badge={matchFormatText}
          compactBadge={matchFormatCompactText}
          clock={{ time: currentTime, elapsed: formatDuration(elapsedSeconds) }}
          onStats={() => setShowStats(true)}
          onSettings={() => setShowSettings(true)}
          onExit={exitConfirmation.requestExit}
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
        'data-keypad': isTabletKeypad ? 'tablet' : 'classic',
        className: `x01-control-area smartphone-keyboard-sensitive legacy-match-control-area laptop-compact-control-area z-30 flex shrink-0 flex-col border-t border-border bg-surface pb-safe shadow-up sm:[--x01-control-h:clamp(240px,39svh,400px)] md:h-[clamp(16rem,32svh,24rem)] xl:h-[clamp(20rem,37svh,29rem)] ${isCompactPhone ? '[--x01-control-h:clamp(196px,33svh,320px)]' : '[--x01-control-h:clamp(220px,38svh,380px)]'}`,
      }}
    >
      {showWinnerScreen && !skipWinnerScreen && matchWinnerId !== null && (
          <div className="fixed inset-0 z-[100] bg-canvas flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
             <h1 className="mb-4 text-center text-4xl font-black italic text-brand-fg sm:text-6xl">VAINQUEUR</h1>
             <div className="mb-12 border-b-4 border-brand pb-4 text-center text-2xl font-bold uppercase text-fg sm:text-3xl">
                 {getWinnerDisplayName(match, matchWinnerId)}
             </div>
             <div className="flex w-full max-w-xs flex-col gap-3">
               {externalResultReturn ? (
                 <Button
                   onClick={() => externalResultReturn.onSend(match)}
                   variant="secondary"
                   data-testid="winner-view-external-return"
                   aria-label={`Envoyer le résultat à ${externalResultReturn.host}`}
                   className="min-h-20 w-full flex-col gap-1 px-3 py-3 text-lg uppercase"
                 >
                   <span>Envoyer le résultat</span>
                   <span className="text-xs normal-case">Retour vers {externalResultReturn.host}</span>
                 </Button>
               ) : (
                 <>
                   <Button
                     onClick={() => onFinishWithState ? onFinishWithState(matchWinnerId, match) : onFinish(matchWinnerId)}
                     size="lg"
                     data-testid="winner-view-stats"
                     className="h-20 w-full text-2xl uppercase"
                   >
                     Voir les Stats ➔
                   </Button>
                   {onRematch && (
                     <Button
                       onClick={() => onRematch(match)}
                       variant="secondary"
                       data-testid="winner-view-rematch"
                       className="min-h-16 w-full text-lg uppercase"
                     >
                       Revanche
                     </Button>
                   )}
                 </>
               )}
             </div>
          </div>
      )}

      <ConfirmExitDialog {...exitConfirmation.dialogProps} />

      {showSettings && (
        <MatchSettingsModal
          canCustomizeSideShortcuts={canCustomizeSideShortcuts || isTabletPortrait}
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
          onCommitShortcutDraft={commitShortcutDraft}
          onShortcutDraftChange={handleShortcutDraftChange}
          onToggleHints={() => updateCounterSettings((current) =>
            updateX01Settings(current, { checkoutHints: !current.x01.checkoutHints }))}
          onShowVoicePrivacy={() => setVoicePrivacyNotice('info')}
          onToggleVoiceAssist={() => {
            setVoiceDeclinedForMatch(false);
            updateCounterSettings((current) =>
              updateX01Settings(current, { voiceAssist: !current.x01.voiceAssist }));
          }}
        />
      )}

      {voicePrivacyNotice === 'consent' && (
        <VoicePrivacyNotice mode="consent" onAccept={acceptVoicePrivacy} onDecline={declineVoicePrivacy} />
      )}
      {voicePrivacyNotice === 'info' && (
        <VoicePrivacyNotice mode="info" onClose={() => setVoicePrivacyNotice(null)} />
      )}

      {pendingOpeningScore !== null && (
          <dialog open aria-label="Ouverture réussie ?" data-testid="opening-confirm-modal" className="app-modal tablet-modal fixed inset-0 z-50 m-0 h-full w-full max-h-none max-w-none border-0 bg-overlay text-fg backdrop-blur-md flex flex-col items-center justify-center p-6">
            <div className="bd-confirm-card flex w-full max-w-sm flex-col items-center text-center">
              <h2 className="bd-confirm-title text-3xl font-black italic text-fg mb-4 uppercase tracking-tighter">Ouverture</h2>
              <p className="bd-confirm-text mb-8 text-center text-lg font-bold text-fg-soft">
                {getOpeningConfirmQuestion(match.config.checkIn, pendingOpeningScore)}
              </p>
              <div className="bd-confirm-actions flex w-full justify-center gap-3 sm:gap-4">
                  <Button
                    variant="secondary"
                    data-testid="opening-confirm-no"
                    onClick={() => handleOpeningConfirm(false)}
                    className="bd-confirm-button h-16 flex-1 text-2xl sm:h-20"
                  >
                    Non
                  </Button>
                  <Button
                    data-testid="opening-confirm-yes"
                    onClick={() => handleOpeningConfirm(true)}
                    className="bd-confirm-button h-16 flex-1 text-2xl sm:h-20"
                  >
                    Oui
                  </Button>
              </div>
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
