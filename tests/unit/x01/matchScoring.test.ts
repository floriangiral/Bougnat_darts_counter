import { describe, expect, it } from 'vitest';
import type { FeedbackKind } from '../../../src/features/x01/scoring/matchSubmission';

import { createMatch, undoTurn } from '../../../src/application/scoring/matchLifecycle';
import type { GameConfig, Player } from '../../../types';
import { buildCheckoutConfirmResult, buildScoreSubmissionResult, cloneMatchState } from '../../../src/features/x01/scoring/matchSubmission';
import { deriveRemainingPreview, getDisplayedThrowerForTeam } from '../../../src/features/x01/scoring/matchPreview';
import { getMatchFormatCompactText, getMatchFormatText, getStarterOptions, getWinnerDisplayName } from '../../../src/features/x01/scoring/matchPresentation';
import { isCheckoutPossible } from '../../../src/features/x01/scoring/checkoutEligibility';
import { getFeedbackStyles } from '../../../src/features/x01/scoring/matchFeedback';
import { POSSIBLE_TURN_SCORES } from '../../../src/features/x01/scoring/possibleTurnScores';
import { bruteForceMinDarts, DOUBLE_OUT_IMPOSSIBLE_TOTALS } from './checkoutBruteForce';

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
  it.each<[number, string, FeedbackKind]>([
    [Number.NaN, '?', 'bust'], [-1, 'NEGATIF', 'bust'],
    [181, 'SCORE IMPOSSIBLE', 'notice'], [179, 'SCORE IMPOSSIBLE', 'notice'],
  ])('rejects invalid score %s without changing the match', (score, text, type) => {
    const match = createMatch(players, config);
    const snapshot = structuredClone(match);
    expect(buildScoreSubmissionResult(match, score, 10)).toEqual({ kind: 'invalid', feedback: { text, type } });
    expect(match).toEqual(snapshot);
  });

  it.each<[number, number, FeedbackKind | undefined]>([
    [60, 441, undefined], [0, 501, undefined],
  ] as const)('submits a normal score of %s and leaves the input state untouched', (score, remaining, feedback) => {
    const match = createMatch(players, config);
    const result = buildScoreSubmissionResult(match, score, 10);
    expect(result.kind).toBe('applied');
    if (result.kind !== 'applied') throw new Error('Expected applied score');
    expect(result.nextMatch.currentLeg.scores.team1).toBe(remaining);
    expect(result.nextMatch.currentLeg.history[0].score).toBe(score);
    expect(result.persistMatch).toBe(result.nextMatch);
    expect(result.showWinnerScreen).toBe(false);
    expect(result.feedback).toBe(feedback);
    expect(match.currentLeg.history).toEqual([]);
  });

  it('reports bust feedback without deducting points', () => {
    const match = createMatch(players, { ...config, startingScore: 40 });
    const result = buildScoreSubmissionResult(match, 60, 10);
    expect(result).toMatchObject({
      kind: 'applied', showWinnerScreen: false, feedback: { text: 'TROP !', type: 'bust' },
      nextMatch: { currentLeg: { scores: { team1: 40 } } },
    });
  });

  it('confirms a winning checkout with elapsed duration, or starts the next leg', () => {
    for (const legsToWin of [1, 2]) {
      const match = createMatch(players, { ...config, startingScore: 40, legsToWin });
      const result = buildCheckoutConfirmResult(match, 40, 1, 99);
      expect(result.showWinnerScreen).toBe(legsToWin === 1);
      expect(result.persistMatch).toBe(result.nextMatch);
      expect(result.nextMatch.legsWon.team1).toBe(1);
      expect(result.nextMatch.status).toBe(legsToWin === 1 ? 'finished' : 'active');
      expect(result.nextMatch.duration).toBe(legsToWin === 1 ? 99 : 0);
    }
  });

  it('formats sets, resolves doubles starters and renders winner names', () => {
    const doubles = createMatch([
      ...players, { id: 'p3', name: 'Joueur 3', teamId: 'team1' },
    ], { ...config, matchMode: 'SETS', isDoubles: true, teamStarterIds: { team1: 'p3', team2: 'missing' } });
    expect(getMatchFormatText(doubles)).toBe('Premier à 3 Sets (3 Legs/Set)');
    expect(getMatchFormatCompactText(doubles)).toBe('Premier à 3 Sets');
    expect(getStarterOptions(doubles)).toEqual([
      { id: 'team1', label: 'Joueur 3' }, { id: 'team2', label: 'Joueur 2' },
    ]);
    expect(getStarterOptions({ ...doubles, players: [] })).toEqual([
      { id: 'team1', label: 'Joueur 1' }, { id: 'team2', label: 'Joueur 3' },
    ]);
    expect(getWinnerDisplayName(doubles, 'team1')).toBe('Joueur 1 / Joueur 3');
    const singles = createMatch(players, config);
    expect(getWinnerDisplayName(singles, 'team1')).toBe('Joueur 1');
    expect(getWinnerDisplayName(singles, 'unknown')).toBe('');
  });

  it.each<[string, boolean]>([
    ['', true], ['60', false], ['no score', true], ['-1', true], ['179', true], ['181', true], ['999', true],
  ])('does not preview invalid or inactive input %j (started=%s)', (input, started) => {
    expect(deriveRemainingPreview(createMatch(players, config), input, started)).toBeNull();
  });

  it('previews zero and exact finishes but not a negative remaining score', () => {
    const match = createMatch(players, { ...config, startingScore: 40 });
    expect(deriveRemainingPreview(match, '0', true)).toEqual({ teamId: 'team1', score: 40 });
    expect(deriveRemainingPreview(match, '40', true)).toEqual({ teamId: 'team1', score: 0 });
    expect(deriveRemainingPreview(match, '60', true)).toBeNull();
    expect(getDisplayedThrowerForTeam(match, 0, 'team1')).toBe(match.players[0]);
    expect(getDisplayedThrowerForTeam(match, 1, 'team1')).toBe(match.players[0]);
    expect(getDisplayedThrowerForTeam(match, 99, 'team1')).toBe(match.players[0]);
    expect(getDisplayedThrowerForTeam(match, 0, 'missing')).toBeNull();
  });

  it.each<[FeedbackKind | undefined, string, string]>([
    ['bust', 'Bust', 'border-red-500/45'],
    ['miss', 'Turn', 'border-slate-500/35'],
    ['notice', 'Info', 'border-slate-400/35'],
    ['info', 'Belles Fléchettes!', 'border-slate-400/35'],
    [undefined, 'Belles Fléchettes!', 'border-slate-400/35'],
  ] as const)('presents %s feedback with its semantic label and styling', (kind, label, border) => {
    expect(getFeedbackStyles(kind)).toMatchObject({ label, border });
  });

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

  it('lists exactly the valid visit totals that cannot finish in Double-Out', () => {
    const impossibleFinishes = [...POSSIBLE_TURN_SCORES]
      .filter((score) => score >= 2 && bruteForceMinDarts(score, 'Double') === null)
      .sort((left, right) => left - right);
    expect(impossibleFinishes).toEqual(DOUBLE_OUT_IMPOSSIBLE_TOTALS);
  });

  it.each(DOUBLE_OUT_IMPOSSIBLE_TOTALS)('records an impossible Double-Out finish on %s as a bust', (score) => {
    const match = createMatch(players, { ...config, startingScore: score, legsToWin: 1 });
    const result = buildScoreSubmissionResult(match, score, 10);
    expect(result).toMatchObject({
      kind: 'applied', showWinnerScreen: false, feedback: { text: 'SORTIE IMPOSSIBLE', type: 'bust' },
      nextMatch: { status: 'active', currentPlayerIndex: 1, currentLeg: { scores: { team1: score }, history: [{ score: 0, isBust: true, remainingAfter: score }] } },
    });
  });

  it('still asks for the darts used on the maximum Double-Out finish', () => {
    const match = createMatch(players, { ...config, startingScore: 170 });
    expect(buildScoreSubmissionResult(match, 170, 10)).toEqual({ kind: 'checkout_confirm', score: 170 });
  });

  it('busts a Master-Out visit that leaves 1', () => {
    const match = createMatch(players, { ...config, checkOut: 'Master', startingScore: 4 });
    expect(buildScoreSubmissionResult(match, 3, 10)).toMatchObject({
      kind: 'applied', feedback: { text: 'TROP !', type: 'bust' },
      nextMatch: { currentLeg: { scores: { team1: 4 }, history: [{ isBust: true }] } },
    });
  });

  it.each(['Open', 'Double', 'Master'] as const)('derives %s checkout eligibility from every dart combination', (rule) => {
    for (let remaining = 0; remaining <= 181; remaining += 1) {
      expect(isCheckoutPossible(remaining, rule), `${rule} ${remaining}`).toBe(bruteForceMinDarts(remaining, rule) !== null);
    }
  });

  describe('ouverture Double/Master-In (spec 046)', () => {
    const doubleIn: GameConfig = { ...config, checkIn: 'Double' };
    const doublesPlayers: Player[] = [
      { id: 'a1', name: 'A1', teamId: 'team1' }, { id: 'b1', name: 'B1', teamId: 'team2' },
      { id: 'a2', name: 'A2', teamId: 'team1' }, { id: 'b2', name: 'B2', teamId: 'team2' },
    ];
    const applied = (result: ReturnType<typeof buildScoreSubmissionResult>) => {
      if (result.kind !== 'applied') throw new Error(`expected applied, got ${result.kind}`);
      return result.nextMatch;
    };

    it('asks to confirm the first scoring visit, then counts it only when confirmed', () => {
      const match = createMatch(players, doubleIn);
      expect(buildScoreSubmissionResult(match, 60, 10)).toEqual({ kind: 'opening_confirm', score: 60 });
      expect(applied(buildScoreSubmissionResult(match, 0, 10)).currentLeg.scores.team1).toBe(501);
      expect(applied(buildScoreSubmissionResult(match, 60, 10, { openingConfirmed: true })).currentLeg.scores.team1).toBe(441);
    });

    it.each<[GameConfig['checkIn'], number]>([['Double', 171], ['Double', 180], ['Double', 1], ['Master', 1]])(
      'refuses an impossible %s opening total of %s without recording the visit',
      (checkIn, score) => {
        const match = createMatch(players, { ...config, checkIn });
        expect(buildScoreSubmissionResult(match, score, 10)).toEqual({
          kind: 'invalid', feedback: { text: 'OUVERTURE IMPOSSIBLE', type: 'notice' },
        });
      },
    );

    it('accepts a Master-In opening on a triple', () => {
      const match = createMatch(players, { ...config, checkIn: 'Master' });
      expect(buildScoreSubmissionResult(match, 3, 10)).toEqual({ kind: 'opening_confirm', score: 3 });
    });

    it('asks only once per team and per leg, and again after undoing the opening', () => {
      const opened = applied(buildScoreSubmissionResult(createMatch(players, doubleIn), 60, 10, { openingConfirmed: true }));
      expect(buildScoreSubmissionResult(opened, 45, 10)).toEqual({ kind: 'opening_confirm', score: 45 });
      const bothOpened = applied(buildScoreSubmissionResult(opened, 45, 10, { openingConfirmed: true }));
      expect(applied(buildScoreSubmissionResult(bothOpened, 100, 10)).currentLeg.scores.team1).toBe(341);
      expect(buildScoreSubmissionResult(undoTurn(undoTurn(bothOpened)), 60, 10)).toEqual({ kind: 'opening_confirm', score: 60 });
    });

    it('requires a new opening in the next leg', () => {
      const short = createMatch(players, { ...doubleIn, startingScore: 40, legsToWin: 2 });
      const team1Opened = applied(buildScoreSubmissionResult(short, 20, 10, { openingConfirmed: true }));
      const bothOpened = applied(buildScoreSubmissionResult(team1Opened, 20, 10, { openingConfirmed: true }));
      expect(buildScoreSubmissionResult(bothOpened, 20, 10)).toEqual({ kind: 'checkout_confirm', score: 20 });
      const nextLeg = buildCheckoutConfirmResult(bothOpened, 20, 1, 10).nextMatch;
      expect(nextLeg.completedLegs).toHaveLength(1);
      expect(buildScoreSubmissionResult(nextLeg, 20, 10)).toEqual({ kind: 'opening_confirm', score: 20 });
    });

    it('chains the opening confirmation with the checkout when one visit opens and finishes', () => {
      const short = createMatch(players, { ...doubleIn, startingScore: 40 });
      expect(buildScoreSubmissionResult(short, 40, 10)).toEqual({ kind: 'opening_confirm', score: 40 });
      expect(buildScoreSubmissionResult(short, 40, 10, { openingConfirmed: true })).toEqual({ kind: 'checkout_confirm', score: 40 });
    });

    it('records a bust without confirmation and keeps the team closed', () => {
      const short = createMatch(players, { ...doubleIn, startingScore: 40 });
      const busted = applied(buildScoreSubmissionResult(short, 60, 10));
      expect(busted.currentLeg.history[0]).toMatchObject({ isBust: true, score: 0 });
      const backToTeam1 = applied(buildScoreSubmissionResult(busted, 0, 10));
      expect(buildScoreSubmissionResult(backToTeam1, 20, 10)).toEqual({ kind: 'opening_confirm', score: 20 });
    });

    it('opens per team in doubles: the partner of an opened player is not asked again', () => {
      const match = createMatch(doublesPlayers, { ...doubleIn, isDoubles: true, initialStartingTeamId: 'team1', teamStarterIds: { team1: 'a1', team2: 'b1' } });
      const a1Opened = applied(buildScoreSubmissionResult(match, 60, 10, { openingConfirmed: true }));
      const b1Missed = applied(buildScoreSubmissionResult(a1Opened, 0, 10));
      expect(b1Missed.players[b1Missed.currentPlayerIndex].id).toBe('a2');
      expect(applied(buildScoreSubmissionResult(b1Missed, 60, 10)).currentLeg.scores.team1).toBe(381);
    });

    it('keeps Open matches unchanged', () => {
      expect(applied(buildScoreSubmissionResult(createMatch(players, config), 60, 10)).currentLeg.scores.team1).toBe(441);
    });
  });
});

