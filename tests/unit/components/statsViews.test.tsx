// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { StatsView } from '../../../views/StatsView';
import { CricketStatsView } from '../../../views/CricketStatsView';
import { createMatch } from '../../../src/application/scoring/matchLifecycle';
import type { CricketMatchSummary, GameConfig, Player } from '../../../types';

vi.mock('../../../components/stats/StatsModal', () => ({
  StatsModal: ({ title, inline }: { title: string; inline: boolean }) => <div data-inline={inline}>{title}</div>,
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const config: GameConfig = {
  startingScore: 501, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS',
  setsToWin: 1, legsToWin: 3, isDoubles: false,
};
const players: Player[] = [
  { id: 'alice', name: 'Alice', teamId: 'team1' },
  { id: 'bob', name: 'Bob', teamId: 'team2' },
];

describe('StatsView', () => {
  it('shows the winner, embeds match stats and offers home or rematch', () => {
    const onHome = vi.fn();
    const onRematch = vi.fn();
    const match = createMatch(players, config);
    const view = render(<StatsView match={match} winnerId="team1" onHome={onHome} onRematch={onRematch} />);
    expect(view.getByRole('heading', { level: 2 }).textContent).toBe('Vainqueur: Alice');
    expect(view.getByText('STATISTIQUES DU MATCH').getAttribute('data-inline')).toBe('true');
    fireEvent.click(view.getByTestId('stats-home'));
    fireEvent.click(view.getByTestId('stats-rematch'));
    expect(onHome).toHaveBeenCalledOnce();
    expect(onRematch).toHaveBeenCalledOnce();
  });

  it('names doubles winners and provides fallbacks for missing teams', () => {
    const match = createMatch([...players, { id: 'anne', name: 'Anne', teamId: 'team1' }], { ...config, isDoubles: true });
    const props = { match, winnerId: 'team1', onHome: vi.fn() };
    const view = render(<StatsView {...props} />);
    expect(view.getByRole('heading', { level: 2 }).textContent).toBe('Vainqueur: Alice / Anne');
    view.rerender(<StatsView {...props} winnerId="unknown" />);
    expect(view.getByText('Équipe gagnante')).toBeTruthy();
    view.rerender(<StatsView {...props} match={{ ...match, config }} winnerId="unknown" />);
    expect(view.getByText('Inconnu')).toBeTruthy();
  });

  it('returns home after two minutes and cancels or replaces the inactivity timer', () => {
    vi.useFakeTimers();
    const onHome = vi.fn();
    const nextHome = vi.fn();
    const props = { match: createMatch(players, config), winnerId: 'team1', onHome };
    const view = render(<StatsView {...props} />);
    act(() => vi.advanceTimersByTime(119999));
    expect(onHome).not.toHaveBeenCalled();
    view.rerender(<StatsView {...props} onHome={nextHome} />);
    act(() => vi.advanceTimersByTime(120000));
    expect(onHome).not.toHaveBeenCalled();
    expect(nextHome).toHaveBeenCalledOnce();
    view.unmount();
    act(() => vi.advanceTimersByTime(120000));
    expect(nextHome).toHaveBeenCalledOnce();
  });
});

describe('CricketStatsView', () => {
  const results: CricketMatchSummary = {
    competitors: [
      { id: 'alice', name: 'Alice', score: 19, dartsThrown: 3,
        marks: { 20: 3, 19: 2, 18: 1, 17: 0, 16: 0, 15: 0, 25: 0 },
        history: [
          { target: 20, multiplier: 3, isMiss: false, pointsScored: 0 },
          { target: 19, multiplier: 2, isMiss: false, pointsScored: 19 },
          { target: null, multiplier: 1, isMiss: true, pointsScored: 0 },
        ] },
      { id: 'bob', name: 'Bob', score: 60, dartsThrown: 0, history: [],
        marks: { 20: 0, 19: 0, 18: 0, 17: 0, 16: 0, 15: 0, 25: 0 } },
    ], legsWon: {}, setsWon: {}, currentSetLegsWon: {}, winnerId: 'alice',
    config, isDoubles: false, memberNamesByCompetitor: {},
  };

  it('honors the declared winner while sorting scores and calculating MPR and scoring accuracy', () => {
    const onHome = vi.fn();
    const onRematch = vi.fn();
    const view = render(<CricketStatsView results={results} onHome={onHome} onRematch={onRematch} />);
    expect(view.getByRole('heading', { level: 2 }).textContent).toBe('Vainqueur: Alice');
    const names = view.getAllByText(/^(Alice|Bob)$/).filter((node) => node.tagName === 'SPAN' && node.parentElement?.tagName === 'DIV');
    expect(names.map((node) => node.textContent)).toEqual(['Bob', 'Alice']);
    const aliceStats = view.getAllByText('Alice')[1].closest('.border-b') as HTMLElement;
    expect(within(aliceStats).getByText('6.00')).toBeTruthy();
    expect(within(aliceStats).getByText('33%')).toBeTruthy();
    expect(view.getByText('0.00')).toBeTruthy();
    expect(view.getByText('0%')).toBeTruthy();
    fireEvent.click(view.getByTestId('cricket-stats-home'));
    fireEvent.click(view.getByTestId('cricket-stats-rematch'));
    expect(onHome).toHaveBeenCalledOnce();
    expect(onRematch).toHaveBeenCalledOnce();
    expect(results.competitors[0].id).toBe('alice');
  });

  it('falls back to the highest-scoring competitor when the winner is unavailable', () => {
    const view = render(<CricketStatsView results={{ ...results, winnerId: null }} onHome={vi.fn()} onRematch={vi.fn()} />);
    expect(view.getByRole('heading', { level: 2 }).textContent).toBe('Vainqueur: Bob');
  });
});
