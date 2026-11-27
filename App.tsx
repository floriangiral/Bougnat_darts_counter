
import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { HomeView } from './views/HomeView';
import { GameConfig, MatchState, CricketMatchSummary, CapitalPlayerState, KillerMatchSummary, GotchaMatchSummary, TriathlonFinishPayload } from './types';
import type { GameType } from './utils/arenaFlow';
import {
  isLiveUpdatePending,
  setLiveUpdateBlocked,
  setLiveUpdatePending,
} from './utils/appPersistence';
import { applyPendingServiceWorkerUpdate } from './src/infrastructure/web/serviceWorkerUpdates';
import {
  AppScreen,
  FULLSCREEN_SCREENS,
  GameRuntimeSnapshot,
  LIVE_UPDATE_PROTECTED_SCREENS,
  MatchRuntimeSnapshot,
  PersistedAppSession,
  flushAppSessionPersistence,
  onAppSessionPersistenceFailure,
  persistAppSession,
  persistAppSessionNow,
  restoreAppSession,
  restoreAppSessionAsync,
} from './src/app/appShell';
import type { PartnerResultStatus } from './src/shared/session/persistedAppSession';
import { useAppScreenHistory } from './src/app/useAppScreenHistory';
import { useGameLifecycle } from './src/app/useGameLifecycle';
import { useGameOrientation } from './src/app/useGameOrientation';
import { useViewportClass, ViewportContext } from './src/features/layout/useViewportClass';
import { getViewportDataAttributes } from './src/features/layout/viewportClass';
import { useVisualViewport } from './src/features/smartphone/useVisualViewport';
import { OrientationHint } from './components/ui/OrientationHint';
import {
  ExternalMatchContext,
  ExternalMatchLink,
  buildExternalCancelUrl,
  buildExternalReturnUrl,
  createExternalMatchContext,
  createExternalReturnPolicy,
  analyzeExternalMatchLink,
  getExternalReturnHost,
  restoreExternalMatchContext,
} from './src/features/external-match/externalMatchLink';
import { removeExternalMatchParamsFromAddressBar } from './src/features/external-match/externalMatchAddressBar';
import { ExternalLinkConflict, getExternalLinkConflict } from './src/features/external-match/externalMatchStartup';
import {
  ExternalLeaveKind,
  ExternalLinkIssueDialog,
  ExternalMatchConflictDialog,
  ExternalMatchLeaveDialog,
} from './components/external-match/ExternalMatchDialogs';
import { env, isExplicitLocalAppEnv } from './src/lib/env';
import { SESSION_DISCARDED_MESSAGE, SESSION_NOT_SAVED_MESSAGE, SessionNotice } from './components/session/SessionNotice';

// Spec 030: where a linked match may send its result (empty origins = feature off). http to
// a private IPv4 is only accepted for an explicit VITE_APP_ENV=local (testing on a phone).
const EXTERNAL_RETURN_POLICY = createExternalReturnPolicy(
  env.VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS,
  isExplicitLocalAppEnv(),
);

const STORED_SESSION_CHECK_TIMEOUT_MS = 2_000;

type GameRuntimeType = GameRuntimeSnapshot['gameType'];

/** Snapshot of the game in progress, only when it belongs to the game being mounted. */
const runtimeForGame = <T extends GameRuntimeType>(
  runtime: GameRuntimeSnapshot | null,
  gameType: T,
): Extract<GameRuntimeSnapshot, { gameType: T }> | null =>
  (runtime?.gameType === gameType ? (runtime as Extract<GameRuntimeSnapshot, { gameType: T }>) : null);

const getRestoredAppScreen = (session: PersistedAppSession): AppScreen => {
  const externalMatch = restoreExternalMatchContext(session.externalMatch, Date.now());
  const match = session.matchRuntime?.match ?? session.currentMatch;
  return externalMatch && match?.status === 'finished' ? 'STATS' : session.screen as AppScreen;
};

const getInitialAppScreen = (session: PersistedAppSession | null, hasIncomingLink: boolean): AppScreen => {
  if (hasIncomingLink) return 'SETUP';
  return session ? getRestoredAppScreen(session) : 'HOME';
};

// A failed partner delivery means leaving would drop an unsent result, not just abandon the match.
const getExternalExitKind = (status: PartnerResultStatus | null): ExternalLeaveKind =>
  (status?.state === 'failed' ? 'unsent-result' : 'abandon');

const getRestoredPartnerResultStatus = (
  session: PersistedAppSession | null,
  hasIncomingLink: boolean,
): PartnerResultStatus | null => {
  if (hasIncomingLink || !session) return null;
  if (session.partnerResultStatus) return session.partnerResultStatus;
  const externalMatch = restoreExternalMatchContext(session.externalMatch, Date.now());
  const match = session.matchRuntime?.match ?? session.currentMatch;
  if (!externalMatch || match?.status !== 'finished') return null;
  return {
    state: 'failed',
    host: getExternalReturnHost(externalMatch, EXTERNAL_RETURN_POLICY) ?? 'la table de marque',
  };
};

const StatsView = lazy(() => import('./views/StatsView').then((module) => ({ default: module.StatsView })));
const SettingsView = lazy(() => import('./views/SettingsView').then((module) => ({ default: module.SettingsView })));
const GameSelectionView = lazy(() => import('./views/GameSelectionView').then((module) => ({ default: module.GameSelectionView })));
const SetupView = lazy(() => import('./views/SetupView').then((module) => ({ default: module.SetupView })));
const MatchView = lazy(() => import('./views/MatchView').then((module) => ({ default: module.MatchView })));
const CricketGameView = lazy(() => import('./views/CricketGameView').then((module) => ({ default: module.CricketGameView })));
const CricketStatsView = lazy(() => import('./views/CricketStatsView').then((module) => ({ default: module.CricketStatsView })));
const CapitalGameView = lazy(() => import('./views/CapitalGameView').then((module) => ({ default: module.CapitalGameView })));
const CapitalStatsView = lazy(() => import('./views/CapitalStatsView').then((module) => ({ default: module.CapitalStatsView })));
const KillerGameView = lazy(() => import('./views/KillerGameView').then((module) => ({ default: module.KillerGameView })));
const GotchaGameView = lazy(() => import('./views/GotchaGameView').then((module) => ({ default: module.GotchaGameView })));
const Atc180GameView = lazy(() => import('./views/Atc180GameView').then((module) => ({ default: module.Atc180GameView })));
const TriathlonGameView = lazy(() => import('./views/TriathlonGameView').then((module) => ({ default: module.TriathlonGameView })));
const TriathlonStatsView = lazy(() => import('./views/TriathlonStatsView').then((module) => ({ default: module.TriathlonStatsView })));

type ExternalLeaveRequest = {
  kind: ExternalLeaveKind;
  /** Local exit to run once the players chose to leave the linked match */
  proceed: () => void;
};

const ScreenLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-canvas text-fg">
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-border-subtle border-t-success-fg" />
      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-fg-subtle">Chargement</div>
    </div>
  </div>
);

export const App: React.FC = () => {
  // Spec 070: the single size-class resolver; views read it through ViewportContext.
  const viewport = useViewportClass();
  useVisualViewport();
  // Spec 010: the stored session is validated (and migrated) before use; a discarded one is
  // announced by a non-blocking notice, and the players start from the home screen.
  const [restoredAtStartup] = useState(() => restoreAppSession());
  const restoredSession = restoredAtStartup.session;
  const [sessionNotice, setSessionNotice] = useState<string | null>(() => (restoredAtStartup.discarded ? SESSION_DISCARDED_MESSAGE : null));
  const latestSessionRef = useRef<PersistedAppSession | null>(null);
  // Spec 030: an external match link is read once at startup. It is applied directly unless
  // it would overwrite a match in progress or an unsent linked result: the players are then
  // asked first (pendingExternalLink). Once decided, its params are removed from the address
  // bar, so a reload restores the persisted session instead of re-applying the link.
  // An invalid link is not applied, but its reason is shown so the organizer can fix it.
  const [externalLinkAnalysis] = useState(() => analyzeExternalMatchLink(window.location.search, EXTERNAL_RETURN_POLICY));
  const incomingExternalLink = externalLinkAnalysis.status === 'valid' ? externalLinkAnalysis.link : null;
  const [showExternalLinkIssue, setShowExternalLinkIssue] = useState(() => externalLinkAnalysis.status === 'invalid');
  const [externalLinkConflict, setExternalLinkConflict] = useState<ExternalLinkConflict | null>(() =>
    (incomingExternalLink ? getExternalLinkConflict(restoredSession, EXTERNAL_RETURN_POLICY) : null));
  const externalLink = externalLinkConflict ? null : incomingExternalLink;
  const [pendingExternalLink, setPendingExternalLink] = useState<ExternalMatchLink | null>(() =>
    (externalLinkConflict ? incomingExternalLink : null));
  const [externalMatch, setExternalMatch] = useState<ExternalMatchContext | null>(() => {
    if (externalLink) return createExternalMatchContext(externalLink);
    return restoreExternalMatchContext(restoredSession?.externalMatch, Date.now());
  });
  const [partnerResultStatus, setPartnerResultStatus] = useState<PartnerResultStatus | null>(() =>
    getRestoredPartnerResultStatus(restoredSession, Boolean(externalLink)));
  const [externalLeaveRequest, setExternalLeaveRequest] = useState<ExternalLeaveRequest | null>(null);
  const [partnerNavigationUrl, setPartnerNavigationUrl] = useState<string | null>(null);
  const [screen, setScreen] = useState<AppScreen>(() => getInitialAppScreen(restoredSession, Boolean(externalLink)));
  const [currentMatch, setCurrentMatch] = useState<MatchState | null>(() => (externalLink ? null : restoredSession?.matchRuntime?.match ?? restoredSession?.currentMatch ?? null));
  const [matchWinner, setMatchWinner] = useState<string>(() => (externalLink ? '' : restoredSession?.matchWinner ?? ''));
  const [arenaPrefillPlayers, setArenaPrefillPlayers] = useState<string[]>(() => externalLink?.playerNames ?? restoredSession?.arenaPrefillPlayers ?? []);
  const [arenaPrefillConfig, setArenaPrefillConfig] = useState<Partial<GameConfig> | undefined>(() => (externalLink ? externalLink.config : restoredSession?.arenaPrefillConfig));
  const [matchRuntime, setMatchRuntime] = useState<MatchRuntimeSnapshot | null>(() => (externalLink ? null : restoredSession?.matchRuntime ?? null));
  // Spec 010: snapshot of the non-X01 game in progress, published by its view after each action.
  const [gameRuntime, setGameRuntime] = useState<GameRuntimeSnapshot | null>(() => (externalLink ? null : restoredSession?.gameRuntime ?? null));
  
  // State for Cricket results
  const [cricketResults, setCricketResults] = useState<CricketMatchSummary | null>(() => restoredSession?.cricketResults ?? null);

  // State for Triathlon results
  const [triathlonData, setTriathlonData] = useState<TriathlonFinishPayload | null>(() => restoredSession?.triathlonData ?? null);

  // State for Capital results
  const [capitalResults, setCapitalResults] = useState<CapitalPlayerState[]>(() => restoredSession?.capitalResults ?? []);
  const [killerResults, setKillerResults] = useState<KillerMatchSummary | null>(() => restoredSession?.killerResults ?? null);
  const [gotchaResults, setGotchaResults] = useState<GotchaMatchSummary | null>(() => restoredSession?.gotchaResults ?? null);
  const [selectedGameType, setSelectedGameType] = useState<GameType>(() => (externalLink ? 'X01' : restoredSession?.selectedGameType ?? 'X01'));
  // Spec 010/030: without a localStorage copy (lost to the quota, cleared…), the IndexedDB session
  // is read before anything is written, so it is neither overwritten by a default session nor
  // silently replaced by an incoming external link.
  const [isCheckingStoredSession, setIsCheckingStoredSession] = useState(() => !restoredSession);

  useEffect(() => {
    if (externalLinkAnalysis.status === 'invalid' || (incomingExternalLink && !pendingExternalLink)) {
      removeExternalMatchParamsFromAddressBar();
    }
  }, [externalLinkAnalysis, incomingExternalLink, pendingExternalLink]);

  // The external context only lives for the linked X01 match: leaving to the home or the
  // game selection (or picking another game) drops it, so no other result is ever sent.
  useEffect(() => {
    if (screen === 'HOME' || screen === 'GAME_SELECTION' || selectedGameType !== 'X01') {
      setExternalMatch(null);
      setPartnerResultStatus(null);
    }
  }, [screen, selectedGameType]);

  useEffect(() => {
    if (restoredSession) {
      return;
    }

    let settled = false;
    const settle = () => {
      settled = true;
      setIsCheckingStoredSession(false);
    };
    // IndexedDB should answer in milliseconds; never keep the session unsaved if it does not.
    const timeout = window.setTimeout(settle, STORED_SESSION_CHECK_TIMEOUT_MS);

    const applyPersistedSession = (persistedSession: PersistedAppSession) => {
      setScreen(getRestoredAppScreen(persistedSession));
      setSelectedGameType(persistedSession.selectedGameType);
      setCurrentMatch(persistedSession.matchRuntime?.match ?? persistedSession.currentMatch ?? null);
      setMatchWinner(persistedSession.matchWinner);
      setArenaPrefillPlayers(persistedSession.arenaPrefillPlayers);
      setArenaPrefillConfig(persistedSession.arenaPrefillConfig);
      setMatchRuntime(persistedSession.matchRuntime);
      setGameRuntime(persistedSession.gameRuntime ?? null);
      setCricketResults(persistedSession.cricketResults);
      setTriathlonData(persistedSession.triathlonData);
      setCapitalResults(persistedSession.capitalResults);
      setKillerResults(persistedSession.killerResults ?? null);
      setGotchaResults(persistedSession.gotchaResults ?? null);
      setExternalMatch(restoreExternalMatchContext(persistedSession.externalMatch, Date.now()));
      setPartnerResultStatus(getRestoredPartnerResultStatus(persistedSession, false));
    };

    void restoreAppSessionAsync().then(({ session: persistedSession, discarded }) => {
      if (settled) {
        return;
      }
      window.clearTimeout(timeout);
      if (discarded) {
        setSessionNotice(SESSION_DISCARDED_MESSAGE);
      }
      if (persistedSession && !incomingExternalLink) {
        applyPersistedSession(persistedSession);
      } else if (persistedSession && incomingExternalLink) {
        const conflict = getExternalLinkConflict(persistedSession, EXTERNAL_RETURN_POLICY);
        if (conflict) {
          applyPersistedSession(persistedSession);
          setExternalLinkConflict(conflict);
          setPendingExternalLink(incomingExternalLink);
        }
      }
      settle();
    });

    return () => {
      settled = true;
      window.clearTimeout(timeout);
    };
  }, [restoredSession, incomingExternalLink]);

  useEffect(() => onAppSessionPersistenceFailure(() => setSessionNotice(SESSION_NOT_SAVED_MESSAGE)), []);

  // Spec 010 (V2-FR-05): the session is written on business changes only (no clock in these
  // dependencies), and once more when the page is hidden or closed.
  useEffect(() => {
    const persistLatestSession = () => {
      if (latestSessionRef.current) persistAppSessionNow(latestSessionRef.current);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') persistLatestSession();
    };
    window.addEventListener('pagehide', persistLatestSession);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', persistLatestSession);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (isCheckingStoredSession) return;
    const session: PersistedAppSession = {
      screen,
      selectedGameType,
      currentMatch,
      matchWinner,
      arenaPrefillPlayers,
      arenaPrefillConfig,
      cricketResults,
      triathlonData,
      capitalResults,
      killerResults,
      gotchaResults,
      matchRuntime,
      gameRuntime,
      externalMatch,
      partnerResultStatus,
    };
    latestSessionRef.current = session;
    persistAppSession(session);
  }, [
    arenaPrefillConfig,
    arenaPrefillPlayers,
    capitalResults,
    cricketResults,
    currentMatch,
    externalMatch,
    gameRuntime,
    gotchaResults,
    isCheckingStoredSession,
    killerResults,
    matchRuntime,
    matchWinner,
    partnerResultStatus,
    screen,
    selectedGameType,
    triathlonData,
  ]);

  // Spec 030: leaving for the external app is a plain top-level navigation (no network
  // call). It runs after the state update has been committed and persisted, so the session
  // left behind no longer carries the external context.
  useEffect(() => {
    if (!partnerNavigationUrl) return;
    flushAppSessionPersistence();
    window.location.assign(partnerNavigationUrl);
  }, [partnerNavigationUrl]);

  useAppScreenHistory(screen, setScreen, selectedGameType);

  const shouldBlockLiveUpdate = LIVE_UPDATE_PROTECTED_SCREENS.includes(screen);
  // Spec 028: a phone held in landscape on a game screen gets a non-blocking hint (tablets: none, spec 073 rejected).
  const orientation = useGameOrientation({
    viewport,
    isGameScreen: FULLSCREEN_SCREENS.includes(screen),
    gameId: currentMatch?.id ?? null,
  });

  useEffect(() => {
    setLiveUpdateBlocked(shouldBlockLiveUpdate);

    if (!shouldBlockLiveUpdate && isLiveUpdatePending()) {
      setLiveUpdatePending(false);
      void applyPendingServiceWorkerUpdate();
    }
  }, [shouldBlockLiveUpdate]);

  useEffect(() => {
    if (
      (screen === 'MATCH' || screen === 'STATS' || screen === 'CRICKET_GAME' || screen === 'CAPITAL_GAME' || screen === 'KILLER_GAME' || screen === 'GOTCHA_GAME' || screen === 'TRIATHLON_GAME' || screen === 'TRIATHLON_STATS' || screen === 'ATC180_GAME')
      && !currentMatch
      && !matchRuntime
    ) {
      setScreen('GAME_SELECTION');
    }
  }, [currentMatch, matchRuntime, screen]);

  const {
    handleQuickGame,
    handleGameSelect,
    handleStartSetup,
    handleMatchFinish,
    handleMatchFinishWithData,
    handleMatchRematch,
    handleCricketFinish,
    handleTriathlonFinish,
    handleCapitalFinish,
    handleKillerFinish,
    handleGotchaFinish,
    handleAtc180Finish,
    handleReturnToGameSelection,
    handleRematch,
  } = useGameLifecycle({
    currentMatch,
    selectedGameType,
    setScreen,
    setCurrentMatch,
    setMatchWinner,
    setMatchRuntime,
    setGameRuntime,
    setSelectedGameType,
    setArenaPrefillPlayers,
    setArenaPrefillConfig,
    setCricketResults,
    setCapitalResults,
    setKillerResults,
    setGotchaResults,
    setTriathlonData,
  });

  // Spec 030: the result and cancel URLs are rebuilt and re-validated here, so an edited
  // persisted session can neither redirect elsewhere nor send a result for another match.
  const externalHost = externalMatch ? getExternalReturnHost(externalMatch, EXTERNAL_RETURN_POLICY) : null;
  const externalReturnUrl = externalMatch && currentMatch
    ? buildExternalReturnUrl(externalMatch, currentMatch, EXTERNAL_RETURN_POLICY)
    : null;
  const externalCancelUrl = externalMatch ? buildExternalCancelUrl(externalMatch, EXTERNAL_RETURN_POLICY) : null;
  const matchRuntimeForMatchView = matchRuntime ?? (
    externalMatch && currentMatch?.status === 'finished'
      ? { match: currentMatch, hasGameStarted: true, elapsedSeconds: currentMatch.duration }
      : null
  );

  const leaveForPartner = (url: string, proceed?: () => void) => {
    setExternalMatch(null);
    setExternalLeaveRequest(null);
    proceed?.();
    setPartnerNavigationUrl(url);
  };

  const handleExternalResultReturn = (finalMatch: MatchState) => {
    const winnerId = finalMatch.matchWinnerId;
    if (!externalMatch || !winnerId) {
      setSessionNotice('Le résultat de ce match ne peut pas être envoyé au partenaire.');
      return;
    }
    const host = getExternalReturnHost(externalMatch, EXTERNAL_RETURN_POLICY) ?? 'la table de marque';
    const returnUrl = buildExternalReturnUrl(externalMatch, finalMatch, EXTERNAL_RETURN_POLICY);
    if (!returnUrl) {
      setPartnerResultStatus({ state: 'failed', host });
      handleMatchFinishWithData(winnerId, finalMatch);
      return;
    }
    const finishWithFailedSend = () => {
      setPartnerResultStatus({ state: 'failed', host });
      handleMatchFinishWithData(winnerId, finalMatch);
    };
    // Open synchronously from the finishing action; keep this tab available for the stats.
    let partnerWindow: Window | null;
    try {
      partnerWindow = window.open('about:blank', '_blank');
      if (partnerWindow) {
        partnerWindow.opener = null;
        partnerWindow.location.replace(returnUrl);
      }
    } catch {
      finishWithFailedSend();
      return;
    }
    if (!partnerWindow) {
      finishWithFailedSend();
      return;
    }
    setPartnerResultStatus({ state: 'sent', host });
    handleMatchFinishWithData(winnerId, finalMatch);
    setExternalMatch(null);
    setExternalLeaveRequest(null);
  };

  // Leaving a linked match (setup back, match exit, end screen exit) asks the players first:
  // tell the external app (result or abandon), leave silently, or stay.
  const guardExternalExit = (proceed: () => void, kind: ExternalLeaveKind = 'abandon') => () => {
    if (!externalHost) {
      proceed();
      return;
    }
    setExternalLeaveRequest({ kind, proceed });
  };

  const getExternalLeaveNotify = (request: ExternalLeaveRequest): (() => void) | null => {
    if (request.kind === 'unsent-result') {
      return externalReturnUrl ? () => leaveForPartner(externalReturnUrl) : null;
    }
    return externalCancelUrl ? () => leaveForPartner(externalCancelUrl, request.proceed) : null;
  };

  const handleOpenPendingExternalLink = () => {
    if (!pendingExternalLink) return;
    setSelectedGameType('X01');
    setArenaPrefillPlayers(pendingExternalLink.playerNames);
    setArenaPrefillConfig(pendingExternalLink.config);
    setCurrentMatch(null);
    setMatchRuntime(null);
    setGameRuntime(null);
    setMatchWinner('');
    setExternalMatch(createExternalMatchContext(pendingExternalLink));
    setPartnerResultStatus(null);
    setScreen('SETUP');
    setPendingExternalLink(null);
  };

  return (
    <ViewportContext.Provider value={viewport}>
    <div
      className="antialiased font-sans bg-canvas text-fg h-full"
      {...getViewportDataAttributes(viewport)}
    >
      {orientation.hint && <OrientationHint onDismiss={orientation.dismiss} />}
      <Suspense fallback={<ScreenLoader />}>
      {screen === 'HOME' && (
        <HomeView 
          onQuickGame={handleQuickGame} 
          onOpenSettings={() => setScreen('SETTINGS')}
        />
      )}

      {screen === 'SETTINGS' && (
        <SettingsView onBack={() => setScreen('HOME')} />
      )}

      {screen === 'GAME_SELECTION' && (
        <GameSelectionView 
          onSelect={handleGameSelect}
          onBack={() => setScreen('HOME')}
        />
      )}
      
      {screen === 'SETUP' && (
        <SetupView 
          gameType={selectedGameType}
          onStart={handleStartSetup} 
          onBack={guardExternalExit(() => setScreen('GAME_SELECTION'))}
          prefilledPlayerNames={arenaPrefillPlayers}
          prefilledConfig={arenaPrefillConfig}
          externalMatchHost={externalHost}
        />
      )}
      
      {screen === 'MATCH' && currentMatch && (
        <MatchView 
          initialMatch={matchRuntimeForMatchView?.match ?? currentMatch}
          onFinish={handleMatchFinish}
          onFinishWithState={handleMatchFinishWithData}
          externalResultReturn={externalHost ? { host: externalHost, onSend: handleExternalResultReturn } : undefined}
          skipWinnerScreen
          onExit={guardExternalExit(handleReturnToGameSelection)}
          restoredState={matchRuntimeForMatchView}
          onStateChange={setMatchRuntime}
        />
      )}

      {screen === 'CRICKET_GAME' && currentMatch && (
          <CricketGameView
              players={currentMatch.players}
              config={currentMatch.config}
              onExit={handleReturnToGameSelection}
              onFinish={handleCricketFinish}
              restoredState={runtimeForGame(gameRuntime, 'CRICKET')}
              playPlacements
              onStateChange={setGameRuntime}
          />
      )}

      {screen === 'CRICKET_STATS' && cricketResults && (
          <CricketStatsView
              results={cricketResults}
              onHome={handleReturnToGameSelection}
              onRematch={handleRematch}
          />
      )}

      {screen === 'CAPITAL_GAME' && currentMatch && (
          <CapitalGameView 
              players={currentMatch.players}
              config={currentMatch.config}
              onExit={handleReturnToGameSelection}
              onFinish={handleCapitalFinish}
              restoredState={runtimeForGame(gameRuntime, 'CAPITAL')}
              onStateChange={setGameRuntime}
          />
      )}

      {screen === 'CAPITAL_STATS' && (
          <CapitalStatsView 
              results={capitalResults}
              onHome={handleReturnToGameSelection}
              onRematch={handleRematch}
          />
      )}

      {screen === 'KILLER_GAME' && currentMatch && (
          <KillerGameView
              players={currentMatch.players}
              config={currentMatch.config}
              onExit={handleReturnToGameSelection}
              onFinish={handleKillerFinish}
              restoredState={runtimeForGame(gameRuntime, 'KILLER')}
              onStateChange={setGameRuntime}
          />
      )}

      {screen === 'GOTCHA_GAME' && currentMatch && (
          <GotchaGameView
              players={currentMatch.players}
              config={currentMatch.config}
              onExit={handleReturnToGameSelection}
              onFinish={handleGotchaFinish}
              restoredState={runtimeForGame(gameRuntime, 'GOTCHA')}
              onStateChange={setGameRuntime}
          />
      )}

      {screen === 'ATC180_GAME' && currentMatch && (
          <Atc180GameView
              key={currentMatch.id}
              players={currentMatch.players}
              config={currentMatch.config}
              onExit={handleReturnToGameSelection}
              onFinish={handleAtc180Finish}
              onRematch={handleRematch}
              restoredState={runtimeForGame(gameRuntime, 'ATC180')}
              onStateChange={setGameRuntime}
          />
      )}

      {screen === 'TRIATHLON_GAME' && currentMatch && (
          <TriathlonGameView 
              players={currentMatch.players}
              config={currentMatch.config}
              onExit={handleReturnToGameSelection}
              onFinish={handleTriathlonFinish}
              restoredState={runtimeForGame(gameRuntime, 'TRIATHLON')}
              onStateChange={setGameRuntime}
          />
      )}

      {screen === 'TRIATHLON_STATS' && currentMatch && triathlonData && (
          <TriathlonStatsView 
              players={triathlonData.results?.triathlonCompetitors || currentMatch.players}
              globalScores={triathlonData.globalScores}
              results={triathlonData.results}
              onHome={handleReturnToGameSelection}
              onRematch={handleRematch}
          />
      )}

      {screen === 'STATS' && currentMatch && (
        <StatsView 
          winnerId={matchWinner} 
          onHome={externalMatch
            ? guardExternalExit(handleReturnToGameSelection, getExternalExitKind(partnerResultStatus))
            : handleReturnToGameSelection}
          match={currentMatch}
          isExternalMatch={Boolean(externalMatch || partnerResultStatus)}
          partnerResultStatus={partnerResultStatus}
          onRetryPartner={
            externalMatch && currentMatch.status === 'finished'
              ? () => handleExternalResultReturn(currentMatch)
              : undefined
          }
          onRematch={!externalMatch && !partnerResultStatus ? () => handleMatchRematch(currentMatch) : undefined}
        />
      )}
      </Suspense>

      {showExternalLinkIssue && externalLinkAnalysis.status === 'invalid' && (
        <ExternalLinkIssueDialog
          issue={externalLinkAnalysis.issue}
          returnHost={externalLinkAnalysis.returnHost}
          onClose={() => setShowExternalLinkIssue(false)}
        />
      )}

      {sessionNotice && (
        <SessionNotice message={sessionNotice} onClose={() => setSessionNotice(null)} />
      )}

      {pendingExternalLink && externalLinkConflict && (
        <ExternalMatchConflictDialog
          conflict={externalLinkConflict}
          incomingPlayerNames={pendingExternalLink.playerNames}
          previousHost={externalHost}
          onOpenLink={handleOpenPendingExternalLink}
          onKeepCurrent={() => setPendingExternalLink(null)}
        />
      )}

      {externalLeaveRequest && externalHost && (
        <ExternalMatchLeaveDialog
          kind={externalLeaveRequest.kind}
          host={externalHost}
          onNotify={getExternalLeaveNotify(externalLeaveRequest)}
          onLeave={() => {
            setExternalMatch(null);
            setExternalLeaveRequest(null);
            externalLeaveRequest.proceed();
          }}
          onCancel={() => setExternalLeaveRequest(null)}
        />
      )}
    </div>
    </ViewportContext.Provider>
  );
};
