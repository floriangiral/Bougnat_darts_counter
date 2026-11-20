import { describe, expect, it } from 'vitest';

import { ScoreValidator, ScoringRules } from '../../../src/domain/scoring';
import { isOpeningTotalPossible, isX01TeamOpened } from '../../../src/domain/scoring/x01OpeningRules';
import { createMatch, submitTurn } from '../../../src/application/scoring/matchLifecycle';

// Independent reference: an opening visit starts with a double (Double-In) or a double/triple (Master-In).
const SEGMENTS = Array.from({ length: 20 }, (_, index) => index + 1);
const DOUBLES = [...SEGMENTS.map((value) => value * 2), 50];
const TRIPLES = SEGMENTS.map((value) => value * 3);
const ANY_DART_OR_MISS = [0, ...SEGMENTS, 25, ...DOUBLES, ...TRIPLES];
const bruteForceOpeningTotals = (openingDarts: number[]) => {
  const totals = new Set<number>();
  for (const first of openingDarts) for (const second of ANY_DART_OR_MISS) for (const third of ANY_DART_OR_MISS) totals.add(first + second + third);
  return totals;
};

describe('scoring domain', () => {
  it('accepts reachable three-dart scores and rejects impossible inputs', () => {
    expect(ScoreValidator.validateScoreInput(180)).toMatchObject({ ok: true });
    expect(ScoreValidator.validateScoreInput(179)).toMatchObject({ ok: false, reason: 'impossible_turn_score' });
    expect(ScoreValidator.validateScoreInput(-1)).toMatchObject({ ok: false, reason: 'negative' });
    expect(ScoreValidator.validateScoreInput(Number.NaN)).toMatchObject({ ok: false, reason: 'not_a_number' });
  });

  it('evaluates bust and checkout confirmation for x01 turns', () => {
    const winningScore = ScoreValidator.validateScoreInput(40);
    expect(winningScore.ok).toBe(true);
    if (!winningScore.ok) {
      throw new Error('expected winningScore to be valid');
    }

    expect(ScoringRules.evaluateTurn(40, winningScore.value, 'Double')).toEqual({
      remainingScore: 0,
      isBust: false,
      requiresCheckoutConfirmation: true,
    });

    expect(ScoringRules.evaluateTurn(winningScore.value.value, winningScore.value, 'Double')).toEqual({
      remainingScore: 0,
      isBust: false,
      requiresCheckoutConfirmation: true,
    });
  });

  it('marks a score leaving 1 in double out as bust', () => {
    const scoreInput = ScoreValidator.validateScoreInput(40);
    expect(scoreInput.ok).toBe(true);
    if (!scoreInput.ok) {
      throw new Error('expected scoreInput to be valid');
    }

    expect(ScoringRules.evaluateTurn(41, scoreInput.value, 'Double')).toEqual({
      remainingScore: 1,
      isBust: true,
      requiresCheckoutConfirmation: false,
    });
  });

  it('validates a remaining target by converting it back to an implied score', () => {
    expect(ScoreValidator.validateRemainingTarget(32, 92, 'Double')).toMatchObject({
      ok: true,
      impliedScore: 60,
    });
    expect(ScoreValidator.validateRemainingTarget(1, 41, 'Double')).toMatchObject({
      ok: false,
      reason: 'impossible_remaining',
    });
    expect(ScoreValidator.validateRemainingTarget(92, 92, 'Open')).toMatchObject({
      ok: false,
      reason: 'same_score_use_miss',
    });
  });

  it('exposes checkout availability without UI dependencies', () => {
    expect(ScoringRules.isCheckoutPossible(170, 'Double')).toBe(true);
    expect(ScoringRules.isCheckoutPossible(169, 'Double')).toBe(false);
    expect(ScoringRules.isCheckoutPossible(180, 'Open')).toBe(true);
  });

  it('applies the shared Master-Out and impossible-finish rules', () => {
    const three = ScoreValidator.validateScoreInput(3);
    const oneEighty = ScoreValidator.validateScoreInput(180);
    if (!three.ok || !oneEighty.ok) throw new Error('expected valid scores');

    expect(ScoringRules.evaluateTurn(4, three.value, 'Master')).toMatchObject({ remainingScore: 1, isBust: true });
    expect(ScoringRules.evaluateTurn(180, oneEighty.value, 'Double')).toEqual({
      remainingScore: 0, isBust: true, requiresCheckoutConfirmation: false,
    });
    expect(ScoringRules.evaluateTurn(180, oneEighty.value, 'Master')).toMatchObject({ requiresCheckoutConfirmation: true });
    expect(ScoreValidator.validateRemainingTarget(1, 4, 'Master')).toEqual({ ok: false, reason: 'impossible_remaining' });
    expect(ScoreValidator.validateRemainingTarget(1, 4, 'Open')).toMatchObject({ ok: true, impliedScore: 3 });
  });

  it.each([['Double', DOUBLES], ['Master', [...DOUBLES, ...TRIPLES]]] as const)(
    'derives every possible %s-In opening total from the dart combinations',
    (rule, openingDarts) => {
      const expected = bruteForceOpeningTotals([...openingDarts]);
      for (let total = 0; total <= 181; total += 1) {
        expect(isOpeningTotalPossible(total, rule), `${rule} ${total}`).toBe(expected.has(total));
      }
      expect(isOpeningTotalPossible(0, 'Open')).toBe(true);
    },
  );

  it('derives the opened state of a team from the current leg history', () => {
    const players = [{ id: 'p1', name: 'A', teamId: 'team1' }, { id: 'p2', name: 'B', teamId: 'team2' }];
    const config = { startingScore: 40, checkIn: 'Double' as const, checkOut: 'Double' as const, matchMode: 'LEGS' as const, setsToWin: 1, legsToWin: 1, isDoubles: false };
    const match = createMatch(players, config);
    expect(isX01TeamOpened(match, 'team1')).toBe(false);
    expect(isX01TeamOpened(createMatch(players, { ...config, checkIn: 'Open' }), 'team1')).toBe(true);
    const busted = submitTurn(match, 60, 3);
    expect(isX01TeamOpened(busted, 'team1')).toBe(false);
    const opened = submitTurn(submitTurn(busted, 0, 3), 20, 3);
    expect(isX01TeamOpened(opened, 'team1')).toBe(true);
    expect(isX01TeamOpened(opened, 'team2')).toBe(false);
  });
});

