
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { HomeView } from './views/HomeView';
import { SetupView } from './views/SetupView';
import { MatchView } from './views/MatchView';
import { GameConfig, Player, MatchState, CricketMatchSummary, CapitalPlayerState, TriathlonFinishPayload, TriathlonResults } from './types';
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

const StatsView = lazy(() => import('./views/StatsView').then((module) => ({ default: module.StatsView })));
const GameSelectionView = lazy(() => import('./views/GameSelectionView').then((module) => ({ default: module.GameSelectionView })));
const CricketGameView = lazy(() => import('./views/CricketGameView').then((module) => ({ default: module.CricketGameView })));
const CricketStatsView = lazy(() => import('./views/CricketStatsView').then((module) => ({ default: module.CricketStatsView })));
const CapitalGameView = lazy(() => import('./views/CapitalGameView').then((module) => ({ default: module.CapitalGameView })));
const CapitalStatsView = lazy(() => import('./views/CapitalStatsView').then((module) => ({ default: module.CapitalStatsView })));
const TriathlonGameView = lazy(() => import('./views/TriathlonGameView').then((module) => ({ default: module.TriathlonGameView })));
const TriathlonStatsView = lazy(() => import('./views/TriathlonStatsView').then((module) => ({ default: module.TriathlonStatsView })));

const ScreenLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#06080d] text-white">
    <div className="flex flex-col items-center gap-4">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-orange-500" />
      <div className="text-[11px] font-black uppercase tracking-[0.24em] text-gray-400">Loading Arena</div>
    </div>
  </div>
);

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
  const [selectedGameType, setSelectedGameType] = useState<GameType>(() => restoredSession?.selectedGameType ?? 'X01');

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
      matchRuntime,
    });
  }, [
    arenaPrefillConfig,
    arenaPrefillPlayers,
    capitalResults,
    cricketResults,
    currentMatch,
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
      (screen === 'MATCH' || screen === 'STATS' || screen === 'CRICKET_GAME' || screen === 'CAPITAL_GAME' || screen === 'TRIATHLON_GAME' || screen === 'TRIATHLON_STATS')
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
    if (type === 'X01' || type === 'X01_501_BO5' || type === 'CRICKET' || type === 'CAPITAL' || type === 'TRIATHLON') {
      setScreen('SETUP');
    }
  };

  const handleStartSetup = (players: Player[], config: GameConfig) => {
    enterFullScreen();
    const match = createMatch(players, config);
    setCurrentMatch(match);
    setMatchRuntime(null);

    setScreen(getScreenForGameType(selectedGameType));
  };

  const handleMatchFinish = (winnerId: string) => {
    exitFullScreen();
    setMatchWinner(winnerId);
    setMatchRuntime(null);
    setScreen('STATS');
  };
  
  const handleMatchFinishWithData = (winnerId: string, finalMatch: MatchState) => {
      exitFullScreen();
      setMatchWinner(winnerId);
      setCurrentMatch(finalMatch);
      setMatchRuntime(null);
      void saveFinishedMatchLocally(finalMatch);
      
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
      setScreen('CAPITAL_STATS');
  };

  const handleReturnToGameSelection = () => {
    exitFullScreen();
    setCurrentMatch(null);
    setMatchWinner('');
    setCricketResults(null);
    setCapitalResults([]);
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
