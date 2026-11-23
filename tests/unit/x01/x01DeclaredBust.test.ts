import { describe, expect, it } from 'vitest';
import { canX01VisitBust } from '../../../src/domain/scoring/x01DeclaredBust';
import { canSubmitBustTurn, createMatch, submitBustTurn, submitTurn } from '../../../src/application/scoring/matchLifecycle';
import type { GameConfig, InOutRule, Player } from '../../../types';

const players: Player[] = [
  { id: 'p1', name: 'Alice', teamId: 't1' },
  { id: 'p2', name: 'Bruno', teamId: 't2' },
];
const config: GameConfig = { startingScore: 181, checkIn: 'Double', checkOut: 'Double', matchMode: 'LEGS', legsToWin: 1, setsToWin: 1, isDoubles: false, initialStartingPlayerIndex: 0 };

describe('possibilité de déclarer un trop X01', () => {
  it.each<[number, InOutRule, InOutRule, boolean, boolean]>([
    [501, 'Open', 'Double', true, false],
    [182, 'Open', 'Double', true, false],
    [181, 'Open', 'Double', true, true],
    [181, 'Open', 'Master', true, true],
    [181, 'Open', 'Open', true, false],
    [180, 'Open', 'Open', true, false],
    [180, 'Open', 'Double', true, true],
    [180, 'Open', 'Master', true, false],
    [179, 'Open', 'Open', true, true],
    [171, 'Double', 'Double', false, true],
    [172, 'Double', 'Double', false, false],
    [170, 'Double', 'Master', false, false],
    [169, 'Double', 'Open', false, true],
    [181, 'Master', 'Double', false, true],
    [40, 'Double', 'Double', false, true],
  ])('reste %i, entrée %s, sortie %s, ouvert %s → %s', (score, entry, exit, opened, expected) => {
    expect(canX01VisitBust(score, entry, exit, opened)).toBe(expected);
  });

  it('refuse un trop impossible au moteur puis l’autorise après ouverture', () => {
    const closed = createMatch(players, config);
    expect(canSubmitBustTurn(closed)).toBe(false);
    expect(submitBustTurn(closed)).toBe(closed);
    const next = submitTurn(submitTurn(closed, 2, 3), 2, 3);
    expect(canSubmitBustTurn(next)).toBe(true);
    expect(submitBustTurn(next).currentLeg.history.at(-1)).toMatchObject({ isBust: true, dartsThrown: 3, remainingAfter: 179 });
    const finished = { ...next, status: 'finished' as const };
    expect(submitBustTurn(finished)).toBe(finished);
  });
});
