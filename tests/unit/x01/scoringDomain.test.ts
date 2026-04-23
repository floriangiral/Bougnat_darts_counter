import { describe, expect, it } from 'vitest';

import { ScoreValidator, ScoringRules } from '../../../src/domain/scoring';

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
});
