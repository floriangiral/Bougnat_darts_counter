// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';

import { CapitalStatsView } from '../../../views/CapitalStatsView';
import type { CapitalDart, CapitalPlayerState } from '../../../types';

afterEach(cleanup);

describe('CapitalStatsView', () => {
  it('renders duplicate darts without duplicate keys and formats every dart label', () => {
    const repeatedDart: CapitalDart = { value: 20, multiplier: 1 };
    const results: CapitalPlayerState[] = [{
      id: 'alice', name: 'Alice', score: 100, targetIndex: 2,
      history: [
        { target: '20', isSuccess: true, pointsScored: 60, darts: [repeatedDart, repeatedDart, repeatedDart] },
        { target: 'CENTRE', isSuccess: true, pointsScored: 75, darts: [{ value: 25, multiplier: 1 }, { value: 25, multiplier: 2 }, { value: 0, multiplier: 1 }] },
        { target: 'DOUBLE', isSuccess: false, pointsScored: 0, darts: [{ value: 19, multiplier: 2 }, { value: 18, multiplier: 3 }] },
      ],
    }, { id: 'bob', name: 'Bob', score: 150, targetIndex: 0, history: [] }];
    const consoleError = vi.spyOn(console, 'error');
    const onHome = vi.fn();
    const onRematch = vi.fn();
    const view = render(<CapitalStatsView results={results} onHome={onHome} onRematch={onRematch} />);
    expect(view.getAllByText('S20')).toHaveLength(3);
    for (const label of ['B', 'DB', 'RATE', 'D19', 'T18', 'DIVISE PAR 2', 'Classement #2', '67%']) {
      expect(view.getByText(label)).toBeTruthy();
    }
    expect(consoleError).not.toHaveBeenCalled();
    fireEvent.click(view.getByRole('button', { name: 'Bob (150)' }));
    expect(view.getByText('Classement #1')).toBeTruthy();
    expect(view.getByText('0%')).toBeTruthy();
    fireEvent.click(view.getByTestId('capital-stats-home'));
    fireEvent.click(view.getByTestId('capital-stats-rematch'));
    expect(onHome).toHaveBeenCalledOnce();
    expect(onRematch).toHaveBeenCalledOnce();
  });

  it('offers a route home when there are no results', () => {
    const onHome = vi.fn();
    const view = render(<CapitalStatsView results={[]} onHome={onHome} onRematch={vi.fn()} />);
    expect(view.getByText("Aucune statistique n'est disponible pour le moment.")).toBeTruthy();
    fireEvent.click(view.getByTestId('capital-stats-home-empty'));
    expect(onHome).toHaveBeenCalledOnce();
  });
});
