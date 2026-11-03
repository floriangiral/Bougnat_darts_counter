// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useGameLifecycle } from '../../../src/app/useGameLifecycle';
import { createMatch } from '../../../src/application/scoring/matchLifecycle';
import { saveFinishedMatchLocally, saveLocalGameHistoryEntry } from '../../../src/infrastructure';
import type { CapitalPlayerState, CricketMatchSummary, GameConfig, Player } from '../../../types';
import { enterFullScreen, exitFullScreen } from '../../../utils/uiUtils';
import type { GameType } from '../../../utils/arenaFlow';

const infrastructureMocks = vi.hoisted(() => ({
  saveFinishedMatchLocally: vi.fn<typeof saveFinishedMatchLocally>(),
  saveLocalGameHistoryEntry: vi.fn<typeof saveLocalGameHistoryEntry>(),
}));
vi.mock('../../../src/infrastructure', () => infrastructureMocks);
vi.mock('../../../utils/uiUtils', () => ({
  enterFullScreen: vi.fn(),
  exitFullScreen: vi.fn(),
}));

afterEach(cleanup);

type LifecycleParams = Parameters<typeof useGameLifecycle>[0];

const players: Player[] = [
  { id: 'alice', name: 'Alice', teamId: 'team1' },
  { id: 'bob', name: 'Bob', teamId: 'team2' },
];
const config: GameConfig = {
  startingScore: 501, checkIn: 'Open', checkOut: 'Double',
  matchMode: 'LEGS', legsToWin: 1, setsToWin: 1, isDoubles: false,
};
const cricket: CricketMatchSummary = {
  competitors: [], legsWon: {}, setsWon: {}, currentSetLegsWon: {},
  winnerId: 'alice', config, isDoubles: false, memberNamesByCompetitor: {},
};

function setup(overrides: Partial<Parameters<typeof useGameLifecycle>[0]> = {}) {
  const params = {
    currentMatch: createMatch(players, config),
    selectedGameType: 'X01' as GameType,
    ...overrides,
    setScreen: vi.fn<LifecycleParams['setScreen']>(),
    setCurrentMatch: vi.fn<LifecycleParams['setCurrentMatch']>(),
    setMatchWinner: vi.fn<LifecycleParams['setMatchWinner']>(),
    setMatchRuntime: vi.fn<LifecycleParams['setMatchRuntime']>(),
    setSelectedGameType: vi.fn<LifecycleParams['setSelectedGameType']>(),
    setArenaPrefillPlayers: vi.fn<LifecycleParams['setArenaPrefillPlayers']>(),
    setArenaPrefillConfig: vi.fn<LifecycleParams['setArenaPrefillConfig']>(),
    setCricketResults: vi.fn<LifecycleParams['setCricketResults']>(),
    setCapitalResults: vi.fn<LifecycleParams['setCapitalResults']>(),
    setKillerResults: vi.fn<LifecycleParams['setKillerResults']>(),
    setGotchaResults: vi.fn<LifecycleParams['setGotchaResults']>(),
    setTriathlonData: vi.fn<LifecycleParams['setTriathlonData']>(),
  };
  const { result } = renderHook(() => useGameLifecycle(params));
  return { params, handlers: result.current };
}

describe('game lifecycle', () => {
  it('clears setup prefills for quick games', () => {
    const { params, handlers } = setup();
    handlers.handleQuickGame();
    expect(params.setArenaPrefillPlayers).toHaveBeenCalledWith([]);
    expect(params.setArenaPrefillConfig).toHaveBeenCalledWith(undefined);
    expect(params.setScreen).toHaveBeenCalledWith('GAME_SELECTION');
  });

  it.each(['X01', 'CRICKET', 'CAPITAL', 'KILLER', 'GOTCHA', 'TRIATHLON'] as const)(
    'starts %s with its configuration and supports a fresh rematch', (gameType) => {
      const { params, handlers } = setup({ selectedGameType: gameType });
      handlers.handleGameSelect(gameType);
      expect(params.setSelectedGameType).toHaveBeenCalledWith(gameType);
      expect(params.setScreen).toHaveBeenLastCalledWith('SETUP');
      expect(params.setArenaPrefillPlayers).toHaveBeenCalledWith([]);
      expect(params.setArenaPrefillConfig).toHaveBeenCalledWith(undefined);
      handlers.handleStartSetup(players, config);
      const expectedScreen = gameType === 'X01' ? 'MATCH' : `${gameType}_GAME`;
      expect(params.setScreen).toHaveBeenLastCalledWith(expectedScreen);
      expect(params.setCurrentMatch.mock.calls.at(-1)?.[0]).toMatchObject({
        config, players, status: 'active', currentLeg: { history: [] },
      });
      expect(params.setMatchRuntime).toHaveBeenCalledWith(null);
      expect(enterFullScreen).toHaveBeenCalledOnce();
      handlers.handleRematch();
      expect(params.setScreen).toHaveBeenLastCalledWith(expectedScreen);
      expect(params.setCurrentMatch).toHaveBeenCalledTimes(2);
      expect(enterFullScreen).toHaveBeenCalledTimes(2);
    },
  );

  it('does not start a rematch without a current match', () => {
    const { params, handlers } = setup({ currentMatch: null });
    handlers.handleRematch();
    expect(params.setCurrentMatch).not.toHaveBeenCalled();
    expect(enterFullScreen).not.toHaveBeenCalled();
  });

  it('shows X01 results and persists the final snapshot only when supplied', () => {
    const { params, handlers } = setup();
    handlers.handleMatchFinish('team1');
    expect(params.setMatchWinner).toHaveBeenLastCalledWith('team1');
    expect(params.setScreen).toHaveBeenLastCalledWith('STATS');
    expect(saveFinishedMatchLocally).not.toHaveBeenCalled();
    const finished = { ...createMatch(players, config), status: 'finished' as const, matchWinnerId: 'team2' };
    handlers.handleMatchFinishWithData('team2', finished);
    expect(params.setCurrentMatch).toHaveBeenLastCalledWith(finished);
    expect(params.setMatchWinner).toHaveBeenLastCalledWith('team2');
    expect(saveFinishedMatchLocally).toHaveBeenCalledExactlyOnceWith(finished);
    expect(params.setMatchRuntime).toHaveBeenLastCalledWith(null);
    expect(exitFullScreen).toHaveBeenCalledTimes(2);
  });

  it('persists Cricket results with the match context and navigates to statistics', () => {
    const { params, handlers } = setup();
    handlers.handleCricketFinish(cricket);
    expect(params.setCricketResults).toHaveBeenCalledWith(cricket);
    expect(params.setScreen).toHaveBeenCalledWith('CRICKET_STATS');
    expect(saveLocalGameHistoryEntry).toHaveBeenCalledWith(expect.objectContaining({
      gameType: 'CRICKET', winnerId: 'alice', payload: { results: cricket, players, config },
    }));
    expect(exitFullScreen).toHaveBeenCalledOnce();
    expect(params.setMatchRuntime).toHaveBeenCalledWith(null);
  });

  it.each([
    [{ finalWinnerId: 'alice', tieBreakWinnerId: 'bob' }, 'alice'],
    [{ tieBreakWinnerId: 'bob' }, 'bob'],
    [{}, null],
  ] as const)('persists Triathlon winner precedence for %j', (results, winnerId) => {
    const { params, handlers } = setup({ currentMatch: null });
    const globalScores = { alice: 80, bob: 70 };
    handlers.handleTriathlonFinish(globalScores, results);
    expect(params.setTriathlonData).toHaveBeenCalledWith({ globalScores, results });
    expect(params.setScreen).toHaveBeenCalledWith('TRIATHLON_STATS');
    const savedEntry = infrastructureMocks.saveLocalGameHistoryEntry.mock.calls.at(-1)?.[0];
    if (!savedEntry) throw new Error('Triathlon history entry was not saved');
    expect(savedEntry.gameType).toBe('TRIATHLON');
    expect(savedEntry.winnerId).toBe(winnerId);
    expect(savedEntry.payload.globalScores).toEqual(globalScores);
    expect(savedEntry.payload.results).toEqual(results);
    expect(savedEntry.payload.players).toEqual([]);
    expect(savedEntry.payload.config).toBeNull();
  });

  it('ranks Capital without mutating results and supports an empty result', () => {
    const { params, handlers } = setup({ currentMatch: null });
    const results: CapitalPlayerState[] = [
      { id: 'alice', name: 'Alice', score: 40, targetIndex: 17, history: [] },
      { id: 'bob', name: 'Bob', score: 80, targetIndex: 17, history: [] },
    ];
    handlers.handleCapitalFinish(results);
    expect(params.setCapitalResults).toHaveBeenCalledWith(results);
    expect(params.setScreen).toHaveBeenCalledWith('CAPITAL_STATS');
    expect(saveLocalGameHistoryEntry).toHaveBeenLastCalledWith(expect.objectContaining({
      gameType: 'CAPITAL', winnerId: 'bob', payload: { results, players: [], config: null },
    }));
    expect(results.map((player) => player.id)).toEqual(['alice', 'bob']);
    handlers.handleCapitalFinish([]);
    expect(saveLocalGameHistoryEntry).toHaveBeenLastCalledWith(expect.objectContaining({ winnerId: null }));
  });

  it('saves Killer and Gotcha results while leaving the in-game result screen in control', () => {
    const { params, handlers } = setup();
    const killer = { players: [], winnerId: 'alice', duration: 30 };
    const gotcha = { ...killer, targetScore: 301 };
    handlers.handleKillerFinish(killer);
    handlers.handleGotchaFinish(gotcha);
    expect(params.setKillerResults).toHaveBeenCalledWith(killer);
    expect(params.setGotchaResults).toHaveBeenCalledWith(gotcha);
    expect(params.setScreen).not.toHaveBeenCalled();
    for (const [gameType, results] of [['KILLER', killer], ['GOTCHA', gotcha]] as const) {
      expect(saveLocalGameHistoryEntry).toHaveBeenCalledWith(expect.objectContaining({
        gameType, winnerId: 'alice', payload: { results, players, config },
      }));
    }
    expect(exitFullScreen).toHaveBeenCalledTimes(2);
  });

  it('clears every game result and runtime when returning to game selection', () => {
    const { params, handlers } = setup();
    handlers.handleReturnToGameSelection();
    for (const callback of [
      params.setCurrentMatch, params.setCricketResults, params.setKillerResults,
      params.setGotchaResults, params.setTriathlonData, params.setMatchRuntime,
    ]) expect(callback).toHaveBeenCalledExactlyOnceWith(null);
    expect(params.setMatchWinner).toHaveBeenCalledWith('');
    expect(params.setCapitalResults).toHaveBeenCalledWith([]);
    expect(params.setScreen).toHaveBeenCalledWith('GAME_SELECTION');
    expect(exitFullScreen).toHaveBeenCalledOnce();
  });
});
