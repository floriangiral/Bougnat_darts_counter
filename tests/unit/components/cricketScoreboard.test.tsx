// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { CricketScoreboard } from '../../../components/game/CricketScoreboard';
import { CheckoutHint } from '../../../components/game/CheckoutHint';
import type { CricketPlayerState } from '../../../types';

afterEach(cleanup);

const players: CricketPlayerState[] = [
  { id: 'a', name: 'Alice', score: 60, dartsThrown: 5, history: [], marks: { 20: 3, 19: 3, 18: 2, 17: 1, 16: 0, 15: 0, 25: 0 } },
  { id: 'b', name: 'Bob', score: 19, dartsThrown: 3, history: [], marks: { 20: 3, 19: 0, 18: 0, 17: 0, 16: 0, 15: 0, 25: 0 } },
];

describe('CricketScoreboard', () => {
  it('renders scores, marks, closed targets and per-player round progress', () => {
    const view = render(<CricketScoreboard players={players} currentPlayerId="a" currentPlayerTurnDartsThrown={2} startingCompetitorId="b" />);
    for (const text of ['Alice', 'Bob', '60', '19', 'TOUR 2/20', '2/3', '0/3', '/', 'B']) {
      expect(view.getAllByText(text).length).toBeGreaterThan(0);
    }
    expect(view.getAllByText('X')).toHaveLength(4);
    expect(view.getByText('20').className).toContain('line-through');
    expect(view.getAllByText('19').some((node) => node.className.includes('text-orange-400'))).toBe(true);
    expect(view.getByTitle('A commencé la partie').parentElement?.textContent).toContain('Bob');
  });

  it('renders current doubles thrower and teammate lists, with explicit round overrides', () => {
    const view = render(<CricketScoreboard
      players={players} currentPlayerId="a" displayedRound={9} roundsLimit={10} isDoubles
      memberNamesByCompetitor={{ a: ['Alice', 'Anne'], b: ['Bob', 'Bill'] }} currentThrowerName="Anne"
      startingCompetitorId="a"
    />);
    expect(view.getByText('TOUR 9/10')).toBeTruthy();
    expect(view.getByText('Anne')).toBeTruthy();
    expect(view.getByText('Bob / Bill')).toBeTruthy();
    expect(view.queryByText('Alice / Anne')).toBeNull();
    view.rerender(<CricketScoreboard players={players} currentPlayerId="missing" isDoubles memberNamesByCompetitor={{ a: ['Alice', 'Anne'] }} />);
    expect(view.getByText('Alice / Anne')).toBeTruthy();
    expect(view.getByText('TOUR 2/20')).toBeTruthy();
  });

  it('caps the round limit and handles an empty scoreboard', () => {
    const view = render(<CricketScoreboard players={[{ ...players[0], dartsThrown: 90 }]} currentPlayerId="a" roundsLimit={10} />);
    expect(view.getByText('TOUR 10/10')).toBeTruthy();
    view.rerender(<CricketScoreboard players={[]} currentPlayerId="missing" />);
    expect(view.getByText('TOUR 1/20')).toBeTruthy();
  });
});

describe('CheckoutHint', () => {
  it('shows a real checkout and removes it when no route exists', () => {
    const view = render(<CheckoutHint score={170} />);
    expect(view.getByText('Checkout Path')).toBeTruthy();
    expect(view.getByText(/T20.*T20.*BULL/i)).toBeTruthy();
    view.rerender(<CheckoutHint score={169} />);
    expect(view.container.firstChild).toBeNull();
  });
});
