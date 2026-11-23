import { describe, expect, it } from 'vitest';
import { createMatch } from '../../../../src/application/scoring/matchLifecycle';
import { buildX01ShareContent } from '../../../../src/presentation/stats/x01ShareText.fr';
import type { GameConfig, MatchState, Player } from '../../../../types';

const config: GameConfig = {
  startingScore: 40,
  checkIn: 'Open',
  checkOut: 'Double',
  matchMode: 'LEGS',
  legsToWin: 1,
  setsToWin: 1,
  isDoubles: false,
};

const players: Player[] = [
  { id: 'alice', name: 'Alice', teamId: 'team1' },
  { id: 'bob', name: 'Bob', teamId: 'team2' },
];

const finishedMatch = (overrides: Partial<MatchState> = {}): MatchState => {
  const match = createMatch(players, config);
  return {
    ...match,
    status: 'finished',
    matchWinnerId: 'team1',
    legsWon: { team1: 1, team2: 0 },
    currentLeg: {
      ...match.currentLeg,
      scores: { team1: 0, team2: 40 },
      winnerId: 'team1',
      history: [{ playerId: 'alice', score: 40, isBust: false, remainingAfter: 0, dartsThrown: 1 }],
    },
    duration: 62,
    ...overrides,
  };
};

describe('buildX01ShareContent', () => {
  it('formats the finished result and per-player statistics in French', () => {
    const share = buildX01ShareContent(finishedMatch(), 'team1');

    expect(share.title).toBe('Résultat X01 — Alice');
    expect(share.text).toContain('40 — entrée libre — sortie double');
    expect(share.text).toContain('Alice remporte le match (Alice 1 — Bob 0 manche(s))');
    expect(share.text).toContain('Durée : 01:02');
    expect(share.text).toContain('Alice : moyenne 3 fléchettes 120,0 ; meilleur score 40 ; meilleur checkout 40');
    expect(share.text).toContain('Bob : moyenne 3 fléchettes 0,0 ; meilleur score 0 ; meilleur checkout —');
  });

  it('groups doubles by team and reports sets instead of legs in sets mode', () => {
    const doublesPlayers: Player[] = [
      { id: 'alice', name: 'Alice', teamId: 'team1' },
      { id: 'carol', name: 'Carol', teamId: 'team1' },
      { id: 'bob', name: 'Bob', teamId: 'team2' },
      { id: 'dan', name: 'Dan', teamId: 'team2' },
    ];
    const match = createMatch(doublesPlayers, { ...config, isDoubles: true, matchMode: 'SETS' });
    const share = buildX01ShareContent({
      ...match,
      status: 'finished',
      matchWinnerId: 'team1',
      setsWon: { team1: 2, team2: 1 },
    }, 'team1');

    expect(share.text).toContain('Alice / Carol remporte le match (Alice / Carol 2 — Bob / Dan 1 set(s))');
    expect(share.text).toContain('Alice / Carol : moyenne 3 fléchettes 0,0');
    expect(share.text).not.toContain('Alice : moyenne');
  });
});
