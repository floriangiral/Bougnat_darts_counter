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
    // Spec 066 FR-04/FR-07 : fermée = data-state « closed » (X cerclé), fermée par tous = « dead » + barré.
    const row = (target: number) => view.container.querySelector(`[data-target="${target}"]`) as HTMLElement;
    const cells = (target: number) => Array.from(row(target).querySelectorAll<HTMLElement>('.cricket-mark-cell')).map((cell) => cell.dataset.state);
    expect(cells(20)).toEqual(['dead', 'dead']);
    expect(cells(19)).toEqual(['closed', 'open']);
    expect(cells(18)).toEqual(['open', 'open']);
    expect(row(20).querySelector('.cricket-target-cell')?.getAttribute('data-state')).toBe('dead');
    expect(view.getByText('20').className).toContain('line-through');
    expect(row(19).querySelector('.cricket-target-cell')?.getAttribute('data-state')).toBe('open');
    expect(view.getByText('19', { selector: '.cricket-target-label' }).className).not.toContain('line-through');
    expect(view.container.querySelectorAll('[data-target]')).toHaveLength(7);
    // Joueur actif : fond, bordure et symbole ▶ (spec 072 RM-02).
    const heads = Array.from(view.container.querySelectorAll<HTMLElement>('.cricket-player-head'));
    expect(heads.map((head) => head.dataset.state)).toEqual(['active', 'idle']);
    expect(heads[0].getAttribute('aria-current')).toBe('true');
    expect(heads[0].textContent).toContain('▶');
    expect(heads[1].textContent).not.toContain('▶');
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

  // Spec 072 FR-03 : la colonne des cibles est centrale en arène (moitié des joueurs de chaque côté).
  it('centres the target column in a duel only, never between the 2nd and 3rd player', () => {
    const duel = render(<CricketScoreboard players={players} currentPlayerId="a" />);
    const duelBoard = duel.getByTestId('cricket-scoreboard');
    expect(duelBoard.dataset.split).toBe('center');
    expect(Array.from(duel.container.querySelectorAll<HTMLElement>('.cricket-player-head')).map((head) => head.dataset.side)).toEqual(['left', 'right']);
    duel.unmount();

    const third = { ...players[1], id: 'c', name: 'Chloé' };
    const view = render(<CricketScoreboard players={[...players, third]} currentPlayerId="a" />);
    const board = view.getByTestId('cricket-scoreboard');
    expect(board.dataset.split).toBe('none');
    expect(board.style.getPropertyValue('--cricket-left')).toBe('3');
    const sides = Array.from(view.container.querySelectorAll<HTMLElement>('.cricket-player-head')).map((head) => head.dataset.side);
    expect(sides).toEqual(['left', 'left', 'left']);
    view.rerender(<CricketScoreboard players={[players[0]]} currentPlayerId="a" />);
    expect(view.getByTestId('cricket-scoreboard').dataset.split).toBe('none');
  });

  // Tablette portrait : la CSS dimensionne les noms selon le nombre de colonnes et teinte la colonne active.
  it('exposes the column count and marks the active column cells', () => {
    const view = render(<CricketScoreboard players={players} currentPlayerId="b" />);
    expect(view.getByTestId('cricket-scoreboard').dataset.playerCount).toBe('2');
    const activeCells = (target: number) => Array.from(view.container.querySelectorAll<HTMLElement>(`[data-target="${target}"] .cricket-mark-cell`))
      .map((cell) => cell.dataset.active ?? null);
    expect(activeCells(20)).toEqual([null, 'true']);
    expect(view.container.querySelectorAll('.cricket-mark-cell[data-active="true"]')).toHaveLength(7);
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
    const view = render(<CheckoutHint score={170} rule="Double" />);
    expect(view.getByText('Sortie conseillée')).toBeTruthy();
    expect(view.getByText(/T20.*T20.*BULL/i)).toBeTruthy();
    view.rerender(<CheckoutHint score={169} rule="Double" />);
    expect(view.container.firstChild).toBeNull();
  });
});
