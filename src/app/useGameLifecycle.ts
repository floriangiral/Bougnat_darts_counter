// Game lifecycle handlers extracted from App.tsx.
// Owns navigation transitions, finish/rematch/exit flows, and local history persistence.
import type {
  Atc180MatchSummary,
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
import type { AppScreen, GameRuntimeSnapshot, MatchRuntimeSnapshot } from './appShell';
import { saveFinishedMatchLocally, saveLocalGameHistoryEntry } from '../infrastructure';
import {
  buildTakeTheTableSetup,
  toTakeTheTableQuickFormat,
  type TakeTheTableRequest,
} from '../features/x01/challenger/x01Challenger';
import { sanitizeChallengerQueue } from '../features/x01/challenger/x01ChallengerQueue';
import { loadX01QuickFormat, rememberX01QuickFormat } from './x01QuickFormatController';

interface UseGameLifecycleParams {
  currentMatch: MatchState | null;
  selectedGameType: GameType;
  setScreen: (screen: AppScreen) => void;
  setCurrentMatch: (match: MatchState | null) => void;
  setMatchWinner: (winner: string) => void;
  setMatchRuntime: (runtime: MatchRuntimeSnapshot | null) => void;
  setGameRuntime: (runtime: GameRuntimeSnapshot | null) => void;
  setSelectedGameType: (type: GameType) => void;
  setArenaPrefillPlayers: (players: string[]) => void;
  setArenaPrefillConfig: (config: Partial<GameConfig> | undefined) => void;
  setCricketResults: (results: CricketMatchSummary | null) => void;
  setCapitalResults: (results: CapitalPlayerState[]) => void;
  setKillerResults: (results: KillerMatchSummary | null) => void;
  setGotchaResults: (results: GotchaMatchSummary | null) => void;
  setTriathlonData: (data: TriathlonFinishPayload | null) => void;
  /** Spec 137 : file d'attente des challengers « Je prends la gagne », persistée dans la session. */
  setX01ChallengerQueue: (queue: string[]) => void;
  /** Spec 137 (RM-05) : match X01 lancé sans « Qui commence ? » ni « Ordre de passage ». */
  setSkipStartPromptMatchId: (matchId: string | null) => void;
}

export function useGameLifecycle({
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
  setX01ChallengerQueue,
  setSkipStartPromptMatchId,
}: UseGameLifecycleParams) {
  // Spec 010: any exit from a game in progress drops its runtime snapshot (X01 and others).
  const clearRuntimes = () => {
    setMatchRuntime(null);
    setGameRuntime(null);
  };

  const handleQuickGame = () => {
    setArenaPrefillPlayers([]);
    setArenaPrefillConfig(undefined);
    setScreen('GAME_SELECTION');
  };

  const handleGameSelect = (type: GameType) => {
    // Spec 010: after a browser back from a game, picking another game abandons that game.
    if (type !== selectedGameType) setGameRuntime(null);
    setArenaPrefillPlayers([]);
    setArenaPrefillConfig(undefined);
    setSelectedGameType(type);
    if (type === 'X01' || type === 'CRICKET' || type === 'CAPITAL' || type === 'KILLER' || type === 'GOTCHA' || type === 'TRIATHLON' || type === 'ATC180') {
      setScreen('SETUP');
    }
  };

  const handleStartSetup = (players: Player[], config: GameConfig) => {
    enterFullScreen();
    const match = createMatch(players, config);
    setCurrentMatch(match);
    clearRuntimes();
    setScreen(getScreenForGameType(selectedGameType));
  };

  const handleMatchFinish = (winnerId: string) => {
    exitFullScreen();
    setMatchWinner(winnerId);
    clearRuntimes();
    setScreen('STATS');
  };

  const handleMatchFinishWithData = (winnerId: string, finalMatch: MatchState) => {
    exitFullScreen();
    setMatchWinner(winnerId);
    setCurrentMatch(finalMatch);
    clearRuntimes();
    void saveFinishedMatchLocally(finalMatch);
    setScreen('STATS');
  };

  const handleCricketFinish = (results: CricketMatchSummary) => {
    exitFullScreen();
    setCricketResults(results);
    clearRuntimes();
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
    clearRuntimes();
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

  const handleCapitalFinish = (results: CapitalPlayerState[]) => {
    exitFullScreen();
    setCapitalResults(results);
    clearRuntimes();
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

  const handleKillerFinish = (results: KillerMatchSummary) => {
    exitFullScreen();
    setKillerResults(results);
    // The finished game stays on screen (and restorable) until the players leave it.
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
  };

  const handleGotchaFinish = (results: GotchaMatchSummary) => {
    exitFullScreen();
    setGotchaResults(results);
    // The finished game stays on screen (and restorable) until the players leave it.
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
  };

  // Spec 130: the result (ranking, statistics, rematch) stays in the game view, restorable like Killer/Gotcha.
  const handleAtc180Finish = (results: Atc180MatchSummary) => {
    exitFullScreen();
    setMatchRuntime(null);
    void saveLocalGameHistoryEntry({
      id: `atc180:${Date.now()}`,
      gameType: 'ATC180',
      completedAt: new Date().toISOString(),
      winnerId: results.winnerIds.length === 1 ? results.winnerIds[0] : null,
      payload: {
        results,
        players: currentMatch?.players ?? [],
        config: currentMatch?.config ?? null,
      },
    });
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
    clearRuntimes();
    // Spec 137 (P7) : tout retour au choix des jeux efface la file des challengers.
    setX01ChallengerQueue([]);
    setScreen('GAME_SELECTION');
  };

  const startRematch = (finishedMatch: MatchState) => {
    const newMatch = createMatch(finishedMatch.players, finishedMatch.config);
    setCurrentMatch(newMatch);
    setMatchWinner('');
    clearRuntimes();
    enterFullScreen();
    setScreen(getScreenForGameType(selectedGameType));
  };

  const handleMatchRematch = (finishedMatch: MatchState) => {
    void saveFinishedMatchLocally(finishedMatch);
    startRematch(finishedMatch);
  };

  /**
   * Spec 137 (RM-16) : sauvegarde le match terminé, enregistre la file, mémorise la nouvelle partie pour
   * la partie rapide (spec 133) et démarre la même partie, challenger au lancer, sans question de départ.
   */
  const handleTakeTheTable = (finishedMatch: MatchState, request: TakeTheTableRequest) => {
    void saveFinishedMatchLocally(finishedMatch);
    const setup = buildTakeTheTableSetup(finishedMatch, request);
    const newMatch = createMatch(setup.players, setup.config);
    const quickFormat = toTakeTheTableQuickFormat(setup, loadX01QuickFormat());
    if (quickFormat) rememberX01QuickFormat(quickFormat);
    setX01ChallengerQueue(sanitizeChallengerQueue(request.queue));
    setSkipStartPromptMatchId(newMatch.id);
    setCurrentMatch(newMatch);
    setMatchWinner('');
    clearRuntimes();
    enterFullScreen();
    setScreen('MATCH');
  };

  const handleRematch = () => {
    if (!currentMatch) return;
    startRematch(currentMatch);
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
    handleAtc180Finish,
    handleReturnToGameSelection,
    handleRematch,
    handleMatchRematch,
    handleTakeTheTable,
  };
}
