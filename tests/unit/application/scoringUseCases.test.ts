import { describe, expect, it } from 'vitest';

import type { GameConfig, Player } from '../../../types';
import { EndGame, EndLeg, RecordThrow, StartGame, UndoThrow } from '../../../src/application';

const players: Player[] = [
  { id: 'p1', name: 'Joueur 1', teamId: 'team1' },
  { id: 'p2', name: 'Joueur 2', teamId: 'team2' },
];

const baseConfig: GameConfig = {
  startingScore: 101,
  checkIn: 'Open',
  checkOut: 'Double',
  matchMode: 'LEGS',
  setsToWin: 0,
  legsToWin: 1,
  isDoubles: false,
  initialStartingPlayerIndex: 0,
};

describe('scoring application use cases', () => {
  it('starts a game through the StartGame use case', () => {
    const match = StartGame.execute({
      players,
      config: baseConfig,
    });

    expect(match.status).toBe('active');
    expect(match.currentLeg.scores.team1).toBe(101);
    expect(match.currentLeg.scores.team2).toBe(101);
  });

  it('requires checkout confirmation when a throw reaches zero', () => {
    const match = StartGame.execute({
      players,
      config: { ...baseConfig, startingScore: 40 },
    });

    expect(RecordThrow.execute({
      match,
      score: 40,
      dartsThrown: 1,
    })).toEqual({
      kind: 'requires_checkout_confirmation',
      score: 40,
    });
  });

  it('records a bust and rotates to the next player', () => {
    const match = StartGame.execute({
      players,
      config: { ...baseConfig, startingScore: 41 },
    });

    const result = RecordThrow.execute({
      match,
      score: 40,
      dartsThrown: 3,
    });

    expect(result.kind).toBe('recorded');
    if (result.kind !== 'recorded') {
      throw new Error('expected recorded result');
    }

    expect(result.isBust).toBe(true);
    expect(result.nextMatch.currentLeg.scores.team1).toBe(41);
    expect(result.nextMatch.currentPlayerIndex).toBe(1);
  });

  it('undoes the latest throw through the UndoThrow use case', () => {
    const match = StartGame.execute({
      players,
      config: baseConfig,
    });
    const result = RecordThrow.execute({
      match,
      score: 60,
      dartsThrown: 3,
    });

    expect(result.kind).toBe('recorded');
    if (result.kind !== 'recorded') {
      throw new Error('expected recorded result');
    }

    const undone = UndoThrow.execute({ match: result.nextMatch });
    expect(undone.currentLeg.history).toHaveLength(0);
    expect(undone.currentLeg.scores.team1).toBe(101);
    expect(undone.currentPlayerIndex).toBe(0);
  });

  it('exposes end-of-leg and end-of-game transitions as explicit use cases', () => {
    const match = StartGame.execute({
      players,
      config: { ...baseConfig, startingScore: 32 },
    });

    const result = RecordThrow.execute({
      match,
      score: 32,
      dartsThrown: 1,
    });

    expect(result.kind).toBe('requires_checkout_confirmation');
    if (result.kind !== 'requires_checkout_confirmation') {
      throw new Error('expected checkout confirmation result');
    }

    const finishedMatch = {
      ...match,
      status: 'finished' as const,
      matchWinnerId: 'team1',
      duration: 0,
    };
    const endedGame = EndGame.execute({
      match: finishedMatch,
      elapsedSeconds: 87,
    });
    expect(endedGame.kind).toBe('game_ended');
    if (endedGame.kind !== 'game_ended') {
      throw new Error('expected game_ended result');
    }
    expect(endedGame.match.duration).toBe(87);

    const legEnded = EndLeg.execute({
      ...match,
      completedLegs: [{
        ...match.currentLeg,
        winnerId: 'team1',
      }],
    });
    expect(legEnded).toEqual({
      kind: 'leg_ended',
      match: {
        ...match,
        completedLegs: [{
          ...match.currentLeg,
          winnerId: 'team1',
        }],
      },
      winnerTeamId: 'team1',
    });
  });
});
