
import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { HomeView } from './views/HomeView';
import { GameConfig, MatchState, CricketMatchSummary, CapitalPlayerState, KillerMatchSummary, GotchaMatchSummary, TriathlonFinishPayload } from './types';
import type { GameType } from './utils/arenaFlow';
import {
  isLiveUpdatePending,
  setLiveUpdateBlocked,
  setLiveUpdatePending,
} from './utils/appPersistence';
import {
  AppScreen,
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
import { useAppScreenHistory } from './src/app/useAppScreenHistory';
import { useGameLifecycle } from './src/app/useGameLifecycle';
import { useTabletLayout } from './src/features/tablet/useTabletLayout';
import { useVisualViewport } from './src/features/smartphone/useVisualViewport';
import { usePortraitLock } from './src/features/smartphone/usePortraitLock';
import { RotateToPortraitOverlay } from './src/features/smartphone/RotateToPortraitOverlay';
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

const StatsView = lazy(() => import('./views/StatsView').then((module) => ({ default: module.StatsView })));
const GameSelectionView = lazy(() => import('./views/GameSelectionView').then((module) => ({ default: module.GameSelectionView })));
const SetupView = lazy(() => import('./views/SetupView').then((module) => ({ default: module.SetupView })));
const MatchView = lazy(() => import('./views/MatchView').then((module) => ({ default: module.MatchView })));
const CricketGameView = lazy(() => import('./views/CricketGameView').then((module) => ({ default: module.CricketGameView })));
const CricketStatsView = lazy(() => import('./views/CricketStatsView').then((module) => ({ default: module.CricketStatsView })));
const CapitalGameView = lazy(() => import('./views/CapitalGameView').then((module) => ({ default: module.CapitalGameView })));
const CapitalStatsView = lazy(() => import('./views/CapitalStatsView').then((module) => ({ default: module.CapitalStatsView })));
const KillerGameView = lazy(() => import('./views/KillerGameView').then((module) => ({ default: module.KillerGameView })));
const GotchaGameView = lazy(() => import('./views/GotchaGameView').then((module) => ({ default: module.GotchaGameView })));
const TriathlonGameView = lazy(() => import('./views/TriathlonGameView').then((module) => ({ default: module.TriathlonGameView })));
const TriathlonStatsView = lazy(() => import('./views/TriathlonStatsView').then((module) => ({ default: module.TriathlonStatsView })));

type ExternalLeaveRequest = {
  kind: ExternalLeaveKind;
  /** Local exit to run once the players chose to leave the linked match */
  proceed: () => void;
};

const ScreenLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#06080d] text-white">
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-emerald-400" />
      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Chargement</div>
    </div>
  </div>
);

export const App: React.FC = () => {
  const tabletLayout = useTabletLayout();
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
  const [externalLinkConflict] = useState<ExternalLinkConflict | null>(() =>
    (incomingExternalLink ? getExternalLinkConflict(restoredSession, EXTERNAL_RETURN_POLICY) : null));
  const externalLink = externalLinkConflict ? null : incomingExternalLink;
  const [pendingExternalLink, setPendingExternalLink] = useState<ExternalMatchLink | null>(() =>
    (externalLinkConflict ? incomingExternalLink : null));
  const [externalMatch, setExternalMatch] = useState<ExternalMatchContext | null>(() => {
    if (externalLink) return createExternalMatchContext(externalLink);
    return restoreExternalMatchContext(restoredSession?.externalMatch, Date.now());
  });
  const [externalLeaveRequest, setExternalLeaveRequest] = useState<ExternalLeaveRequest | null>(null);
  const [partnerNavigationUrl, setPartnerNavigationUrl] = useState<string | null>(null);
  const [screen, setScreen] = useState<AppScreen>(() => (externalLink ? 'SETUP' : (restoredSession?.screen as AppScreen | undefined) ?? 'HOME'));
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
    }
  }, [screen, selectedGameType]);

  useEffect(() => {
    if (restoredSession || incomingExternalLink) {
      return;
    }

    let cancelled = false;

    void restoreAppSessionAsync().then(({ session: persistedSession, discarded }) => {
      if (cancelled) {
        return;
      }
      if (discarded) {
        setSessionNotice(SESSION_DISCARDED_MESSAGE);
      }
      if (!persistedSession) {
        return;
      }

      setScreen(persistedSession.screen as AppScreen);
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
    });

    return () => {
      cancelled = true;
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
    killerResults,
    matchRuntime,
    matchWinner,
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

  useAppScreenHistory(screen, setScreen);

  const shouldBlockLiveUpdate = LIVE_UPDATE_PROTECTED_SCREENS.includes(screen);
  let layoutMode: 'tablet' | 'smartphone' | 'default' = 'default';
  if (tabletLayout.isTablet) {
    layoutMode = 'tablet';
  } else if (tabletLayout.isSmartphone) {
    layoutMode = 'smartphone';
  }
  usePortraitLock(layoutMode === 'smartphone');

  useEffect(() => {
    setLiveUpdateBlocked(shouldBlockLiveUpdate);

    if (!shouldBlockLiveUpdate && isLiveUpdatePending()) {
      setLiveUpdatePending(false);
      window.location.reload();
    }
  }, [shouldBlockLiveUpdate]);

  useEffect(() => {
    if (
      (screen === 'MATCH' || screen === 'STATS' || screen === 'CRICKET_GAME' || screen === 'CAPITAL_GAME' || screen === 'KILLER_GAME' || screen === 'GOTCHA_GAME' || screen === 'TRIATHLON_GAME' || screen === 'TRIATHLON_STATS')
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
    handleCricketFinish,
    handleTriathlonFinish,
    handleCapitalFinish,
    handleKillerFinish,
    handleGotchaFinish,
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

  const leaveForPartner = (url: string, proceed?: () => void) => {
    setExternalMatch(null);
    setExternalLeaveRequest(null);
    proceed?.();
    setPartnerNavigationUrl(url);
  };

  const statsExternalReturn = externalReturnUrl && externalHost
    ? { host: externalHost, onReturn: () => leaveForPartner(externalReturnUrl) }
    : null;

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
    setScreen('SETUP');
    setPendingExternalLink(null);
  };

  return (
    <div
      className="antialiased font-sans bg-black h-full"
      data-layout={layoutMode}
      data-tablet-orientation={tabletLayout.orientation}
      data-tablet-density={tabletLayout.density}
    >
      {tabletLayout.requiresPortrait && <RotateToPortraitOverlay />}
      <Suspense fallback={<ScreenLoader />}>
      {screen === 'HOME' && (
        <HomeView 
          onQuickGame={handleQuickGame} 
        />
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
          initialMatch={matchRuntime?.match ?? currentMatch} 
          onFinish={handleMatchFinish}
          onFinishWithState={handleMatchFinishWithData}
          onExit={guardExternalExit(handleReturnToGameSelection)}
          restoredState={matchRuntime}
          onStateChange={setMatchRuntime}
        />
      )}

      {screen === 'CRICKET_GAME' && currentMatch && (
          <CricketGameView
              players={currentMatch.players}
              config={currentMatch.config}
              onExit={handleReturnToGameSelection}
              onFinish={handleCricketFinish}
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
              restoredState={gameRuntime?.gameType === 'KILLER' ? gameRuntime : null}
              onStateChange={setGameRuntime}
          />
      )}

      {screen === 'GOTCHA_GAME' && currentMatch && (
          <GotchaGameView
              players={currentMatch.players}
              config={currentMatch.config}
              onExit={handleReturnToGameSelection}
              onFinish={handleGotchaFinish}
              restoredState={gameRuntime?.gameType === 'GOTCHA' ? gameRuntime : null}
              onStateChange={setGameRuntime}
          />
      )}

      {screen === 'TRIATHLON_GAME' && currentMatch && (
          <TriathlonGameView 
              players={currentMatch.players}
              config={currentMatch.config}
              onExit={handleReturnToGameSelection}
              onFinish={handleTriathlonFinish}
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
          onHome={guardExternalExit(handleReturnToGameSelection, statsExternalReturn ? 'unsent-result' : 'abandon')}
          onRematch={handleRematch}
          match={currentMatch}
          externalReturn={statsExternalReturn}
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
  );
};
