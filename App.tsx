
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { HomeView, PlayerAccountView, UserInfoView } from './views/HomeView';
import type { AuthPanelMode } from './views/HomeView';
import { GameConfig, MatchState, CricketMatchSummary, CapitalPlayerState, KillerMatchSummary, GotchaMatchSummary, TriathlonFinishPayload } from './types';
import type { GameType } from './utils/arenaFlow';
import {
  isLiveUpdatePending,
  setLiveUpdateBlocked,
  setLiveUpdatePending,
} from './utils/appPersistence';
import {
  AppScreen,
  LIVE_UPDATE_PROTECTED_SCREENS,
  MatchRuntimeSnapshot,
  getRestoredAppSession,
  getRestoredAppSessionAsync,
  persistAppSession,
} from './src/app/appShell';
import { useAppScreenHistory } from './src/app/useAppScreenHistory';
import { useGameLifecycle } from './src/app/useGameLifecycle';
import { env } from './src/lib/env';
import type {
  TournamentMatchDetail,
  TournamentScoringContext,
  TournamentSubmissionRecord,
} from './src/application/scoring/tournamentScoring';
import { mapX01TournamentResultSubmission } from './src/application/scoring/tournamentScoring';
import { HttpTournamentScoringClient, createMockTournamentScoringClient } from './src/features/tournament-scoring/tournamentScoringApi';
import {
  LocalTournamentSubmissionRepository,
  createTournamentSubmissionRecord,
  submitTournamentResultWithLocalDraft,
} from './src/features/tournament-scoring/localTournamentSubmissions';
import { enterFullScreen } from './utils/uiUtils';

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

const ScreenLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#06080d] text-white">
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-emerald-400" />
      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Chargement</div>
    </div>
  </div>
);

export const App: React.FC = () => {
  const [restoredSession] = useState(() => getRestoredAppSession());
  const [screen, setScreen] = useState<AppScreen>(() => (restoredSession?.screen as AppScreen | undefined) ?? 'HOME');
  const [currentMatch, setCurrentMatch] = useState<MatchState | null>(() => restoredSession?.matchRuntime?.match ?? restoredSession?.currentMatch ?? null);
  const [matchWinner, setMatchWinner] = useState<string>(() => restoredSession?.matchWinner ?? '');
  const [arenaPrefillPlayers, setArenaPrefillPlayers] = useState<string[]>(() => restoredSession?.arenaPrefillPlayers ?? []);
  const [arenaPrefillConfig, setArenaPrefillConfig] = useState<Partial<GameConfig> | undefined>(() => restoredSession?.arenaPrefillConfig);
  const [matchRuntime, setMatchRuntime] = useState<MatchRuntimeSnapshot | null>(() => restoredSession?.matchRuntime ?? null);
  const [tournamentContext, setTournamentContext] = useState<TournamentScoringContext | null>(() => restoredSession?.tournamentContext ?? null);
  const [tournamentSubmission, setTournamentSubmission] = useState<TournamentSubmissionRecord | null>(() => restoredSession?.tournamentSubmission ?? null);
  const [tournamentBearerToken, setTournamentBearerToken] = useState<string | null>(null);
  
  // State for Cricket results
  const [cricketResults, setCricketResults] = useState<CricketMatchSummary | null>(() => restoredSession?.cricketResults ?? null);

  // State for Triathlon results
  const [triathlonData, setTriathlonData] = useState<TriathlonFinishPayload | null>(() => restoredSession?.triathlonData ?? null);

  // State for Capital results
  const [capitalResults, setCapitalResults] = useState<CapitalPlayerState[]>(() => restoredSession?.capitalResults ?? []);
  const [killerResults, setKillerResults] = useState<KillerMatchSummary | null>(() => restoredSession?.killerResults ?? null);
  const [gotchaResults, setGotchaResults] = useState<GotchaMatchSummary | null>(() => restoredSession?.gotchaResults ?? null);
  const [selectedGameType, setSelectedGameType] = useState<GameType>(() => restoredSession?.selectedGameType ?? 'X01');
  const [accountInitialMode, setAccountInitialMode] = useState<AuthPanelMode>('login');
  const [isSessionHydrated, setIsSessionHydrated] = useState(Boolean(restoredSession));
  const isConnectedModeEnabled = env.VITE_TOURNAMENT_BACKEND_ENABLED;

  useEffect(() => {
    if (restoredSession) {
      setIsSessionHydrated(true);
      return;
    }

    let cancelled = false;

    void getRestoredAppSessionAsync().then((persistedSession) => {
      if (cancelled || !persistedSession) {
        if (!cancelled) {
          setIsSessionHydrated(true);
        }
        return;
      }

      setScreen(persistedSession.screen as AppScreen);
      setSelectedGameType(persistedSession.selectedGameType);
      setCurrentMatch(persistedSession.matchRuntime?.match ?? persistedSession.currentMatch ?? null);
      setMatchWinner(persistedSession.matchWinner);
      setArenaPrefillPlayers(persistedSession.arenaPrefillPlayers);
      setArenaPrefillConfig(persistedSession.arenaPrefillConfig);
      setMatchRuntime(persistedSession.matchRuntime);
      setTournamentContext(persistedSession.tournamentContext ?? null);
      setTournamentSubmission(persistedSession.tournamentSubmission ?? null);
      setCricketResults(persistedSession.cricketResults);
      setTriathlonData(persistedSession.triathlonData);
      setCapitalResults(persistedSession.capitalResults);
      setKillerResults(persistedSession.killerResults ?? null);
      setGotchaResults(persistedSession.gotchaResults ?? null);
      setIsSessionHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, [restoredSession]);

  useEffect(() => {
    persistAppSession({
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
      tournamentContext,
      tournamentSubmission,
    });
  }, [
    arenaPrefillConfig,
    arenaPrefillPlayers,
    capitalResults,
    cricketResults,
    currentMatch,
    gotchaResults,
    killerResults,
    matchRuntime,
    matchWinner,
    screen,
    selectedGameType,
    tournamentContext,
    tournamentSubmission,
    triathlonData,
  ]);

  useAppScreenHistory(screen, setScreen);

  const shouldBlockLiveUpdate = LIVE_UPDATE_PROTECTED_SCREENS.includes(screen);

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

  useEffect(() => {
    if (!isConnectedModeEnabled && (screen === 'PLAYER_ACCOUNT' || screen === 'USER_INFO')) {
      setScreen('HOME');
    }
  }, [isConnectedModeEnabled, screen]);

  const {
    handleQuickGame,
    handleGameSelect,
    handleStartSetup,
    handleMatchFinish,
    handleMatchFinishWithData: handleLocalMatchFinishWithData,
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
    setSelectedGameType,
    setArenaPrefillPlayers,
    setArenaPrefillConfig,
    setCricketResults,
    setCapitalResults,
    setKillerResults,
    setGotchaResults,
    setTriathlonData,
  });

  const submitTournamentResult = async (context: TournamentScoringContext, finalMatch: MatchState, bearerToken: string | null) => {
    const submission = mapX01TournamentResultSubmission(context, finalMatch);
    const repository = new LocalTournamentSubmissionRepository();
    setTournamentSubmission(createTournamentSubmissionRecord(submission, 'pending'));

    const gateway = bearerToken === '__mock__'
      ? createMockTournamentScoringClient()
      : bearerToken
        ? new HttpTournamentScoringClient(env.VITE_TOURNAMENT_API_BASE_URL || env.VITE_BOUGNAT_API_URL, async () => bearerToken)
        : null;

    if (!gateway) {
      const draft = createTournamentSubmissionRecord(submission, 'network_error', 'Session API absente. Retry depuis l espace joueur.');
      await repository.saveDraft(draft);
      setTournamentSubmission(draft);
      return;
    }

    const result = await submitTournamentResultWithLocalDraft(gateway, repository, submission);
    setTournamentSubmission(result);
  };

  const handleTournamentMatchLaunch = (detail: TournamentMatchDetail, bearerToken: string) => {
    enterFullScreen();
    setSelectedGameType('X01');
    setCurrentMatch(detail.match);
    setMatchWinner('');
    setMatchRuntime(null);
    setTournamentContext(detail.context);
    setTournamentSubmission(null);
    setTournamentBearerToken(bearerToken);
    setScreen('MATCH');
  };

  const handleMatchFinishWithData = (winnerId: string, finalMatch: MatchState) => {
    handleLocalMatchFinishWithData(winnerId, finalMatch);
    if (tournamentContext) {
      void submitTournamentResult(tournamentContext, finalMatch, tournamentBearerToken);
    }
  };

  const handleReturnToGameSelectionAndClearTournament = () => {
    setTournamentContext(null);
    setTournamentSubmission(null);
    setTournamentBearerToken(null);
    handleReturnToGameSelection();
  };

  const isClerkOauthCallback = env.VITE_CLERK_PUBLISHABLE_KEY.trim() && window.location.pathname === '/sso-callback';
  const handleOpenAccount = (mode: AuthPanelMode) => {
    setAccountInitialMode(mode);
    setScreen('PLAYER_ACCOUNT');
  };
  const handleOpenUserInfo = () => {
    setScreen('USER_INFO');
  };

  return (
    <div className="antialiased font-sans bg-black h-full">
      {isClerkOauthCallback ? (
        <div className="flex min-h-screen items-center justify-center bg-[#06080d] px-4 text-white">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-orange-300" />
            <div className="mt-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-300">Connexion</div>
            <AuthenticateWithRedirectCallback />
          </div>
        </div>
      ) : (
      <Suspense fallback={<ScreenLoader />}>
      {screen === 'HOME' && (
        <HomeView 
          onQuickGame={() => {
            setTournamentContext(null);
            setTournamentSubmission(null);
            setTournamentBearerToken(null);
            handleQuickGame();
          }}
          onOpenAccount={handleOpenAccount}
          onOpenUserInfo={handleOpenUserInfo}
        />
      )}

      {screen === 'PLAYER_ACCOUNT' && (
        <PlayerAccountView
          initialMode={accountInitialMode}
          onBack={() => setScreen('HOME')}
        />
      )}

      {screen === 'USER_INFO' && (
        <UserInfoView
          onBack={() => setScreen('HOME')}
          onLaunchTournamentMatch={handleTournamentMatchLaunch}
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
          onBack={() => setScreen('GAME_SELECTION')}
          prefilledPlayerNames={arenaPrefillPlayers}
          prefilledConfig={arenaPrefillConfig}
        />
      )}
      
      {screen === 'MATCH' && currentMatch && (
        <MatchView 
          initialMatch={matchRuntime?.match ?? currentMatch} 
          onFinish={handleMatchFinish}
          onFinishWithState={handleMatchFinishWithData}
          onExit={handleReturnToGameSelectionAndClearTournament}
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
          />
      )}

      {screen === 'GOTCHA_GAME' && currentMatch && (
          <GotchaGameView
              players={currentMatch.players}
              config={currentMatch.config}
              onExit={handleReturnToGameSelection}
              onFinish={handleGotchaFinish}
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
          onHome={handleReturnToGameSelectionAndClearTournament}
          onRematch={handleRematch}
          match={currentMatch}
          tournamentSubmission={tournamentSubmission}
        />
      )}
      </Suspense>
      )}
    </div>
  );
};
