import { describe, expect, it } from 'vitest';

import {
  getTeamThrowOrder,
  resolveNextLegStarterIndex,
  resolveNextThrowerIndex,
  resolveSetOpeningStarterIndex,
  resolveUpcomingTeamThrower,
} from '../../../src/application/scoring/x01Rotation';
import type { Player, Turn } from '../../../types';

const doubles: Player[] = [
  { id: 'a1', name: 'A1', teamId: 'team1' },
  { id: 'b1', name: 'B1', teamId: 'team2' },
  { id: 'a2', name: 'A2', teamId: 'team1' },
  { id: 'b2', name: 'B2', teamId: 'team2' },
];
const doublesConfig = { isDoubles: true, teamStarterIds: { team1: 'a2', team2: 'b1' } };
const turn = (playerId: string): Turn => ({ playerId, score: 0, isBust: false, remainingAfter: 501, dartsThrown: 3 });

describe('x01 rotation', () => {
  it('orders each team from its designated first thrower and ignores a starter from another team', () => {
    expect(getTeamThrowOrder(doubles, { team1: 'a2' }, 'team1').map((player) => player.id)).toEqual(['a2', 'a1']);
    expect(getTeamThrowOrder(doubles, { team1: 'b1' }, 'team1').map((player) => player.id)).toEqual(['a1', 'a2']);
    expect(getTeamThrowOrder(doubles, undefined, 'team2').map((player) => player.id)).toEqual(['b1', 'b2']);
    expect(resolveUpcomingTeamThrower(doubles, undefined, [], 'unknown')).toBeUndefined();
  });

  it('gives the turn to the other team, alternating partners from the leg history only', () => {
    expect(resolveNextThrowerIndex(doubles, doublesConfig, [turn('b1')], 1)).toBe(2);
    expect(resolveNextThrowerIndex(doubles, doublesConfig, [turn('b1'), turn('a2')], 2)).toBe(3);
    expect(resolveNextThrowerIndex(doubles, doublesConfig, [turn('b1'), turn('a2'), turn('b2')], 3)).toBe(0);
    expect(resolveNextThrowerIndex(doubles, doublesConfig, [turn('b1'), turn('a2'), turn('b2'), turn('a1')], 0)).toBe(1);
  });

  it('keeps the plain cyclic order for singles and unsupported team layouts', () => {
    const singles = doubles.map((player) => ({ ...player, teamId: player.id }));
    expect(resolveNextThrowerIndex(singles, { isDoubles: false }, [turn('b2')], 3)).toBe(0);
    expect(resolveNextThrowerIndex(singles, { isDoubles: true }, [turn('a1')], 0)).toBe(1);
    expect(resolveNextLegStarterIndex(singles, { isDoubles: false }, 1)).toBe(2);
    expect(resolveNextLegStarterIndex(singles, { isDoubles: true }, 3)).toBe(0);
  });

  it('opens the next leg with the other team’s designated first thrower, whatever the leg starter index', () => {
    expect(resolveNextLegStarterIndex(doubles, doublesConfig, 2)).toBe(1);
    expect(resolveNextLegStarterIndex(doubles, doublesConfig, 3)).toBe(2);
    expect(resolveNextLegStarterIndex(doubles, { isDoubles: true, teamStarterIds: { team1: 'ghost' } }, 1)).toBe(0);
    expect(resolveNextLegStarterIndex(doubles, { ...doublesConfig, initialStartingTeamId: 'team2' }, 99)).toBe(2);
    expect(resolveNextLegStarterIndex(doubles, doublesConfig, -1)).toBe(1);
  });

  it('opens odd sets with the match opener and even sets with the other side (WDF 12.02)', () => {
    const singles: Player[] = [
      { id: 'p1', name: 'P1', teamId: 'p1' },
      { id: 'p2', name: 'P2', teamId: 'p2' },
    ];
    expect([0, 1, 2, 3].map((set) => resolveSetOpeningStarterIndex(singles, { isDoubles: false }, 1, set))).toEqual([1, 0, 1, 0]);
    expect(resolveSetOpeningStarterIndex(singles, { isDoubles: false }, 0, -2)).toBe(0);
    expect([0, 1, 2].map((set) => resolveSetOpeningStarterIndex(doubles, doublesConfig, 1, set))).toEqual([1, 2, 1]);
    expect(resolveSetOpeningStarterIndex(doubles, { ...doublesConfig, initialStartingTeamId: 'team2' }, 99, 1)).toBe(2);
    expect(resolveSetOpeningStarterIndex([], { isDoubles: false }, 0, 1)).toBe(0);
  });
});
