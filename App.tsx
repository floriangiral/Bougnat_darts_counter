
import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { HomeView } from './views/HomeView';
import { GameConfig, Player, MatchState, CricketMatchSummary, CapitalPlayerState, KillerMatchSummary, TriathlonFinishPayload, TriathlonResults } from './types';
import { createMatch } from './src/application/scoring/matchLifecycle';
import { enterFullScreen, exitFullScreen } from './utils/uiUtils';
import {
  GameType,
  getScreenForGameType,
} from './utils/arenaFlow';
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
import { saveFinishedMatchLocally, saveLocalGameHistoryEntry } from './src/infrastructure';
import { useAppScreenHistory } from './src/app/useAppScreenHistory';
import {
  ANALYTICS_EVENT,
  buildGameFeatureFlags,
} from './src/domain/observability/analyticsDomain';
import {
  syncFeatureFlags,
  trackGameEvent,
} from './src/application/observability/analyticsUseCases';
import { createVercelAnalyticsPort } from './src/infrastructure/observability/vercelAnalyticsAdapter';
import { env } from './src/lib/env';

const StatsView = lazy(() => import('./views/StatsView').then((module) => ({ default: module.StatsView })));
const GameSelectionView = lazy(() => import('./views/GameSelectionView').then((module) => ({ default: module.GameSelectionView })));
const SetupView = lazy(() => import('./views/SetupView').then((module) => ({ default: module.SetupView })));
const MatchView = lazy(() => import('./views/MatchView').then((module) => ({ default: module.MatchView })));
const CricketGameView = lazy(() => import('./views/CricketGameView').then((module) => ({ default: module.CricketGameView })));
const CricketStatsView = lazy(() => import('./views/CricketStatsView').then((module) => ({ default: module.CricketStatsView })));
const CapitalGameView = lazy(() => import('./views/CapitalGameView').then((module) => ({ default: module.CapitalGameView })));
const CapitalStatsView = lazy(() => import('./views/CapitalStatsView').then((module) => ({ default: module.CapitalStatsView })));
const KillerGameView = lazy(() => import('./views/KillerGameView').then((module) => ({ default: module.KillerGameView })));
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

const analytics = createVercelAnalyticsPort();

export const App: React.FC = () => {
  const [restoredSession] = useState(() => getRestoredAppSession());
  const [screen, setScreen] = useState<AppScreen>(() => restoredSession?.screen ?? 'HOME');
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
  const [selectedGameType, setSelectedGameType] = useState<GameType>(() => restoredSession?.selectedGameType ?? 'X01');

  const featureFlags = useMemo<Record<string, boolean | string>>(
    () =>
      buildGameFeatureFlags({
        selectedGameType,
        screen,
        isDoubles: Boolean(currentMatch?.config.isDoubles),
        voiceScoringEnabled: env.VITE_ENABLE_VOICE_SCORING,
        appAccessMode: env.VITE_APP_ACCESS_MODE,
      }),
    [currentMatch?.config.isDoubles, screen, selectedGameType],
  );

  useEffect(() => {
    if (restoredSession) {
      return;
    }

    let cancelled = false;

    void getRestoredAppSessionAsync().then((persistedSession) => {
      if (cancelled || !persistedSession) {
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
      matchRuntime,
    });
  }, [
    arenaPrefillConfig,
    arenaPrefillPlayers,
    capitalResults,
    cricketResults,
    currentMatch,
    killerResults,
    matchRuntime,
    matchWinner,
    screen,
    selectedGameType,
    triathlonData,
  ]);

  useEffect(() => {
    syncFeatureFlags(analytics, featureFlags);
  }, [featureFlags]);

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
      (screen === 'MATCH' || screen === 'STATS' || screen === 'CRICKET_GAME' || screen === 'CAPITAL_GAME' || screen === 'KILLER_GAME' || screen === 'TRIATHLON_GAME' || screen === 'TRIATHLON_STATS')
      && !currentMatch
      && !matchRuntime
    ) {
      setScreen('GAME_SELECTION');
    }
  }, [currentMatch, matchRuntime, screen]);

  const handleQuickGame = () => {
    setArenaPrefillPlayers([]);
    setArenaPrefillConfig(undefined);
    setScreen('GAME_SELECTION');
  };

  const handleGameSelect = (type: GameType) => {
    setArenaPrefillPlayers([]);
    setArenaPrefillConfig(undefined);
    setSelectedGameType(type);
    trackGameEvent(analytics, ANALYTICS_EVENT.GameSelected, type, { game_type: type });
    if (type === 'X01' || type === 'X01_501_BO5' || type === 'CRICKET' || type === 'CAPITAL' || type === 'KILLER' || type === 'TRIATHLON') {
      setScreen('SETUP');
    }
  };

  const handleStartSetup = (players: Player[], config: GameConfig) => {
    enterFullScreen();
    const match = createMatch(players, config);
    setCurrentMatch(match);
    setMatchRuntime(null);
    trackGameEvent(
      analytics,
      ANALYTICS_EVENT.GameStarted,
      selectedGameType,
      {
        game_type: selectedGameType,
        players_count: players.length,
        is_doubles: config.isDoubles,
      }
    );

    setScreen(getScreenForGameType(selectedGameType));
  };

  const handleMatchFinish = (winnerId: string) => {
    exitFullScreen();
    setMatchWinner(winnerId);
    setMatchRuntime(null);
    trackGameEvent(
      analytics,
      ANALYTICS_EVENT.GameFinished,
      selectedGameType,
      {
        game_type: selectedGameType,
        winner_id: winnerId,
      }
    );
    setScreen('STATS');
  };
  
  const handleMatchFinishWithData = (winnerId: string, finalMatch: MatchState) => {
      exitFullScreen();
      setMatchWinner(winnerId);
      setCurrentMatch(finalMatch);
      setMatchRuntime(null);
      void saveFinishedMatchLocally(finalMatch);
      trackGameEvent(
        analytics,
        ANALYTICS_EVENT.GameFinished,
        selectedGameType,
        {
          game_type: selectedGameType,
          winner_id: winnerId,
        }
      );
      
      setScreen('STATS');
  }

  // Handler for Cricket games
  const handleCricketFinish = (results: CricketMatchSummary) => {
      exitFullScreen();
      setCricketResults(results);
      setMatchRuntime(null);
      void saveLocalGameHistoryEntry({
        id: `cricket:${Date.now()}`,
        gameType: 'CRICKET',
        completedAt: new Date().toISOString(),
        winnerId: results.winnerId,
        payload: {
          results,
          players: currentMatch?.players ?? [],
          config: currentMatch?.config ?? null,
        },
      });
      trackGameEvent(
        analytics,
        ANALYTICS_EVENT.GameFinished,
        'CRICKET',
        {
          game_type: 'CRICKET',
          winner_id: results.winnerId ?? null,
        }
      );
      setScreen('CRICKET_STATS');
  };

  const handleTriathlonFinish = (globalScores: Record<string, number>, results: TriathlonResults) => {
      exitFullScreen();
      setTriathlonData({ globalScores, results });
      setMatchRuntime(null);
      void saveLocalGameHistoryEntry({
        id: `triathlon:${Date.now()}`,
        gameType: 'TRIATHLON',
        completedAt: new Date().toISOString(),
        winnerId: results?.finalWinnerId || results?.tieBreakWinnerId || null,
        payload: {
          globalScores,
          results,
          players: currentMatch?.players ?? [],
          config: currentMatch?.config ?? null,
        },
      });
      trackGameEvent(
        analytics,
        ANALYTICS_EVENT.GameFinished,
        'TRIATHLON',
        {
          game_type: 'TRIATHLON',
          winner_id: results?.finalWinnerId || results?.tieBreakWinnerId || null,
        }
      );
      setScreen('TRIATHLON_STATS');
  };

  // Handler for Capital games
  const handleCapitalFinish = (results: CapitalPlayerState[]) => {
      exitFullScreen();
      setCapitalResults(results);
      setMatchRuntime(null);
      void saveLocalGameHistoryEntry({
        id: `capital:${Date.now()}`,
        gameType: 'CAPITAL',
        completedAt: new Date().toISOString(),
        winnerId: [...results].sort((a, b) => b.score - a.score)[0]?.id ?? null,
        payload: {
          results,
          players: currentMatch?.players ?? [],
          config: currentMatch?.config ?? null,
        },
      });
      trackGameEvent(
        analytics,
        ANALYTICS_EVENT.GameFinished,
        'CAPITAL',
        {
          game_type: 'CAPITAL',
          winner_id: [...results].sort((a, b) => b.score - a.score)[0]?.id ?? null,
        }
      );
      setScreen('CAPITAL_STATS');
  };

  const handleKillerFinish = (results: KillerMatchSummary) => {
      exitFullScreen();
      setKillerResults(results);
      setMatchRuntime(null);
      void saveLocalGameHistoryEntry({
        id: `killer:${Date.now()}`,
        gameType: 'KILLER',
        completedAt: new Date().toISOString(),
        winnerId: results.winnerId,
        payload: {
          results,
          players: currentMatch?.players ?? [],
          config: currentMatch?.config ?? null,
        },
      });
      trackGameEvent(
        analytics,
        ANALYTICS_EVENT.GameFinished,
        'KILLER',
        {
          game_type: 'KILLER',
          winner_id: results.winnerId,
        }
      );
  };

  const handleReturnToGameSelection = () => {
    exitFullScreen();
    setCurrentMatch(null);
    setMatchWinner('');
    setCricketResults(null);
    setCapitalResults([]);
    setKillerResults(null);
    setTriathlonData(null);
    setMatchRuntime(null);
    setScreen('GAME_SELECTION');
  };

  const handleRematch = () => {
      if (!currentMatch) return;
      
      const newMatch = createMatch(currentMatch.players, currentMatch.config);
      setCurrentMatch(newMatch);
      setMatchRuntime(null);
      enterFullScreen();
      
      setScreen(getScreenForGameType(selectedGameType));
  };

  return (
    <div className="antialiased font-sans bg-black h-full">
      <Suspense fallback={<ScreenLoader />}>
      {screen === 'HOME' && (
        <HomeView 
          onQuickGame={handleQuickGame} 
          onSecondaryAction={() => setScreen('GAME_SELECTION')}
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
