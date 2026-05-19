
import React, { Suspense, lazy, useEffect, useState } from 'react';
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
  LIVE_UPDATE_PROTECTED_SCREENS,
  MatchRuntimeSnapshot,
  getRestoredAppSession,
  getRestoredAppSessionAsync,
  persistAppSession,
} from './src/app/appShell';
import { useAppScreenHistory } from './src/app/useAppScreenHistory';
import { useGameLifecycle } from './src/app/useGameLifecycle';

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
  
  // State for Cricket results
  const [cricketResults, setCricketResults] = useState<CricketMatchSummary | null>(() => restoredSession?.cricketResults ?? null);

  // State for Triathlon results
  const [triathlonData, setTriathlonData] = useState<TriathlonFinishPayload | null>(() => restoredSession?.triathlonData ?? null);

  // State for Capital results
  const [capitalResults, setCapitalResults] = useState<CapitalPlayerState[]>(() => restoredSession?.capitalResults ?? []);
  const [killerResults, setKillerResults] = useState<KillerMatchSummary | null>(() => restoredSession?.killerResults ?? null);
  const [gotchaResults, setGotchaResults] = useState<GotchaMatchSummary | null>(() => restoredSession?.gotchaResults ?? null);
  const [selectedGameType, setSelectedGameType] = useState<GameType>(() => restoredSession?.selectedGameType ?? 'X01');
  const [isSessionHydrated, setIsSessionHydrated] = useState(Boolean(restoredSession));

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
    setSelectedGameType,
    setArenaPrefillPlayers,
    setArenaPrefillConfig,
    setCricketResults,
    setCapitalResults,
    setKillerResults,
    setGotchaResults,
    setTriathlonData,
  });

  return (
    <div className="antialiased font-sans bg-black h-full">
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
          onExit={handleReturnToGameSelection}
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
          onHome={handleReturnToGameSelection}
          onRematch={handleRematch}
          match={currentMatch}
        />
      )}
      </Suspense>
    </div>
  );
};
