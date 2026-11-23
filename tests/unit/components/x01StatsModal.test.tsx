// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { StatsModal } from '../../../components/stats/StatsModal';
import { createMatch, submitTurn } from '../../../src/application/scoring/matchLifecycle';
import type { GameConfig, MatchState, Player } from '../../../types';

afterEach(cleanup);

const config: GameConfig = {
  startingScore: 301, checkIn: 'Open', checkOut: 'Open', matchMode: 'LEGS',
  setsToWin: 1, legsToWin: 1, isDoubles: false, initialStartingPlayerIndex: 0,
};
const named = (names: string[]): Player[] => names.map((name, index) => ({ id: `p${index + 1}`, name, teamId: `p${index + 1}` }));
const play = (match: MatchState, scores: number[]) => scores.reduce((current, score) => submitTurn(current, score, 3), match);
const headers = (view: ReturnType<typeof render>) => view.getAllByRole('columnheader').map((cell) => cell.textContent);

describe('X01 StatsModal', () => {
  it('s’ouvre en modale large en tablette, mais pas intégrée à l’écran de fin', () => {
    const modal = render(<StatsModal match={createMatch(named(['Alice', 'Bob']), config)} onClose={vi.fn()} />);
    expect(modal.getByRole('dialog').getAttribute('data-modal-size')).toBe('wide');
    modal.unmount();
    const inline = render(<StatsModal match={createMatch(named(['Alice', 'Bob']), config)} inline />);
    expect(inline.container.querySelector('[data-modal-size]')).toBeNull();
    inline.unmount();
    const embedded = render(<StatsModal match={createMatch(named(['Alice', 'Bob']), config)} inline showHeader={false} title="Statistiques" />);
    const heading = embedded.getByRole('heading', { name: 'Statistiques' });
    expect(heading.className).toContain('sr-only');
  });

  it('shows one column per player beyond two, scrolling horizontally, and marks the best values', () => {
    const match = play(createMatch(named(['Alice', 'Bob', 'Carol', 'Maximilienne']), config), [100, 140, 60, 140]);
    const view = render(<StatsModal match={match} inline />);

    expect(headers(view)).toEqual(['Mesure', 'Alice', 'Bob', 'Carol', 'Maximilienne']);
    expect(view.getByTitle('Maximilienne').className).not.toContain('truncate');
    expect(view.getByTestId('x01-stats-scroll').className).toContain('overflow-auto');
    expect(view.getByText('Mesure').closest('[data-columns]')?.getAttribute('data-columns')).toBe('4');

    const best = Array.from(view.container.querySelectorAll('[data-state="best"]')).map((cell) => cell.getAttribute('data-competitor-id'));
    expect(best).toEqual(['p2', 'p4']);

    fireEvent.click(view.getByRole('button', { name: 'Scores' }));
    const bestScoring = Array.from(view.container.querySelectorAll('[data-state="best"]')).map((cell) => cell.getAttribute('data-competitor-id'));
    expect(bestScoring).toEqual(['p2', 'p4', 'p1', 'p3']);
  });

  it('keeps the two-column layout for two players and one column per team in doubles', () => {
    const view = render(<StatsModal match={createMatch(named(['Alice', 'Bob']), config)} onClose={vi.fn()} />);
    expect(headers(view)).toEqual(['Mesure', 'Alice', 'Bob']);
    expect(view.getByTitle('Alice').className).not.toContain('truncate');
    expect(view.getByTitle('Alice').querySelector('[data-fit]')?.textContent).toBe('Alice');
    expect(view.getByTestId('x01-stats-scroll').className).toContain('overflow-y-auto');
    expect(view.container.querySelector('[data-state="best"]')).toBeNull();

    const doubles = createMatch(
      [
        { id: 't1p1', name: 'Alice', teamId: 'team1' }, { id: 't1p2', name: 'Anne', teamId: 'team1' },
        { id: 't2p1', name: 'Bob', teamId: 'team2' }, { id: 't2p2', name: 'Bill', teamId: 'team2' },
      ],
      { ...config, isDoubles: true },
    );
    view.rerender(<StatsModal match={doubles} onClose={vi.fn()} />);
    expect(headers(view)).toEqual(['Mesure', 'Alice / Anne', 'Bob / Bill']);
  });

  it('closes from the dialog header', () => {
    const onClose = vi.fn();
    const view = render(<StatsModal match={createMatch(named(['Alice', 'Bob', 'Carol']), config)} onClose={onClose} title="Statistiques" />);
    expect(view.getByRole('dialog')).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: /✕/ }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
