import { describe, expect, it } from 'vitest';

import { createMatch } from '../../../src/application/scoring/matchLifecycle';
import type { GameConfig, Player } from '../../../types';
import { buildCheckoutConfirmResult, buildScoreSubmissionResult, cloneMatchState } from '../../../src/features/x01/scoring/matchSubmission';
import { deriveRemainingPreview } from '../../../src/features/x01/scoring/matchPreview';
import { getMatchFormatCompactText, getMatchFormatText, getStarterOptions, getWinnerDisplayName } from '../../../src/features/x01/scoring/matchPresentation';
import { isCheckoutPossible } from '../../../src/features/x01/scoring/checkoutEligibility';

const players: Player[] = [
  { id: 'p1', name: 'Joueur 1', teamId: 'team1' },
  { id: 'p2', name: 'Joueur 2', teamId: 'team2' },
];

const config: GameConfig = {
  startingScore: 501,
  checkIn: 'Open',
  checkOut: 'Double',
  matchMode: 'LEGS',
  setsToWin: 3,
  legsToWin: 3,
  isDoubles: false,
  initialStartingPlayerIndex: 0,
};

describe('x01 match scoring helpers', () => {
  it('applies checkout eligibility rules without UI coupling', () => {
    expect(isCheckoutPossible(170, 'Double')).toBe(true);
    expect(isCheckoutPossible(159, 'Double')).toBe(false);
    expect(isCheckoutPossible(180, 'Open')).toBe(true);
    expect(isCheckoutPossible(181, 'Open')).toBe(false);
    expect(isCheckoutPossible(180, 'Master')).toBe(true);
    expect(isCheckoutPossible(1, 'Master')).toBe(false);
  });

  it('clones match state deeply enough for undo snapshots', () => {
    const match = createMatch(players, config);
    const cloned = cloneMatchState(match);

    expect(cloned).not.toBe(match);
    expect(cloned.currentLeg).not.toBe(match.currentLeg);
    expect(cloned.players).not.toBe(match.players);
  });

  it('validates impossible score submissions before applying a turn', () => {
    const match = createMatch(players, config);
    const result = buildScoreSubmissionResult(match, 179, 0);

    expect(result).toEqual({
      kind: 'invalid',
      feedback: { text: 'SCORE IMPOSSIBLE', type: 'notice' },
    });
  });

  it('prompts for checkout confirmation on a zero finish', () => {
    const match = createMatch(players, { ...config, startingScore: 40, legsToWin: 1 });
    const result = buildScoreSubmissionResult(match, 40, 12);

    expect(result).toEqual({ kind: 'checkout_confirm', score: 40 });
  });

  it('derives remaining score previews from the keypad input', () => {
    const match = createMatch(players, config);
    expect(deriveRemainingPreview(match, '60', true)).toEqual({ teamId: 'team1', score: 441 });
    expect(deriveRemainingPreview(match, '999', true)).toBeNull();
  });

  it('keeps match presentation copy in sync', () => {
    const match = createMatch(players, config);

    expect(getMatchFormatText(match)).toContain('Prem')
    expect(getMatchFormatCompactText(match)).toContain('Prem')
    expect(getStarterOptions(match)).toHaveLength(2);
    expect(getWinnerDisplayName(match, null)).toBe('');
  });

  it('preserves checkout confirmation flow for the active player', () => {
    const match = createMatch(players, { ...config, startingScore: 40, legsToWin: 1 });
    const result = buildCheckoutConfirmResult(match, 40, 2, 99);

    expect(result.kind).toBe('applied');
    if (result.kind !== 'applied') {
      throw new Error('expected applied result');
    }
    expect(result.nextMatch.currentLeg.history).toHaveLength(1);
    expect(result.persistMatch.currentLeg.history).toHaveLength(1);
  });
});
