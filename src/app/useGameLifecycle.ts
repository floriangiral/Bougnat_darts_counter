// Game lifecycle handlers extracted from App.tsx.
// Owns navigation transitions, finish/rematch/exit flows, and analytics tracking per game type.
import type {
  CapitalPlayerState,
  CricketMatchSummary,
  GameConfig,
  GotchaMatchSummary,
  KillerMatchSummary,
  MatchState,
  Player,
  TriathlonFinishPayload,
  TriathlonResults,
} from '../../types';
import { createMatch } from '../application/scoring/matchLifecycle';
import { enterFullScreen, exitFullScreen } from '../../utils/uiUtils';
import type { GameType } from '../../utils/arenaFlow';
import { getScreenForGameType } from '../../utils/arenaFlow';
import type { AppScreen, MatchRuntimeSnapshot } from './appShell';
import { saveFinishedMatchLocally, saveLocalGameHistoryEntry } from '../infrastructure';
import { ANALYTICS_EVENT } from '../domain/observability/analyticsDomain';
import { trackGameEvent } from '../application/observability/analyticsUseCases';
import { analytics } from '../lib/analyticsInstance';

interface UseGameLifecycleParams {
  currentMatch: MatchState | null;
  selectedGameType: GameType;
  setScreen: (screen: AppScreen) => void;
  setCurrentMatch: (match: MatchState | null) => void;
  setMatchWinner: (winner: string) => void;
  setMatchRuntime: (runtime: MatchRuntimeSnapshot | null) => void;
  setSelectedGameType: (type: GameType) => void;
  setArenaPrefillPlayers: (players: string[]) => void;
  setArenaPrefillConfig: (config: Partial<GameConfig> | undefined) => void;
  setCricketResults: (results: CricketMatchSummary | null) => void;
  setCapitalResults: (results: CapitalPlayerState[]) => void;
  setKillerResults: (results: KillerMatchSummary | null) => void;
  setGotchaResults: (results: GotchaMatchSummary | null) => void;
  setTriathlonData: (data: TriathlonFinishPayload | null) => void;
}

export function useGameLifecycle({
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
}: UseGameLifecycleParams) {
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
    if (type === 'X01' || type === 'CRICKET' || type === 'CAPITAL' || type === 'KILLER' || type === 'GOTCHA' || type === 'TRIATHLON') {
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
  };

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

  const handleGotchaFinish = (results: GotchaMatchSummary) => {
    exitFullScreen();
    setGotchaResults(results);
    setMatchRuntime(null);
    void saveLocalGameHistoryEntry({
      id: `gotcha:${Date.now()}`,
      gameType: 'GOTCHA',
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
      'GOTCHA',
      {
        game_type: 'GOTCHA',
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
    setGotchaResults(null);
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

  return {
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
  };
}
