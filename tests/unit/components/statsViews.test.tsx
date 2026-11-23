// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { StatsView } from '../../../views/StatsView';
import { CricketStatsView } from '../../../views/CricketStatsView';
import { createMatch, submitTurn } from '../../../src/application/scoring/matchLifecycle';
import type { CricketMatchSummary, GameConfig, Player } from '../../../types';

vi.mock('../../../components/stats/StatsModal', () => ({
  StatsModal: ({ title, inline }: { title: string; inline: boolean }) => <div data-inline={inline}>{title}</div>,
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
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
  it('shows the winner, embeds match stats and offers share or exit', () => {
    const onHome = vi.fn();
    const match = createMatch(players, config);
    const view = render(<StatsView match={match} winnerId="team1" onHome={onHome} />);
    expect(view.getByRole('heading', { level: 2 }).textContent).toBe('Vainqueur: Alice');
    expect(view.getByText('STATISTIQUES DU MATCH').getAttribute('data-inline')).toBe('true');
    expect(view.queryByTestId('x01-ranking')).toBeNull();
    expect(view.getByTestId('stats-share')).toBeTruthy();
    expect(view.queryByTestId('stats-rematch')).toBeNull();
    fireEvent.click(view.getByTestId('stats-home'));
    expect(onHome).toHaveBeenCalledOnce();
  });

  it('shares the finished result from the stats page', async () => {
    const share = vi.fn<(data: { title: string; text: string }) => Promise<void>>().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share });
    const view = render(<StatsView match={createMatch(players, config)} winnerId="team1" onHome={vi.fn()} />);

    await act(async () => {
      fireEvent.click(view.getByTestId('stats-share'));
      await Promise.resolve();
    });

    expect(share).toHaveBeenCalledOnce();
    const payload = share.mock.calls[0]?.[0];
    expect(payload?.title).toBe('Résultat X01 — Alice');
    expect(payload?.text).toContain('Alice remporte le match');
  });

  // Spec 052 (RM-03) : classement de fin à plus de 2 joueurs.
  it('ranks three or four players at the end: winner, legs won, then lowest remainder', () => {
    const group: Player[] = ['Alice', 'Bob', 'Carol', 'Dave'].map((name, index) => ({ id: `p${index + 1}`, name, teamId: `p${index + 1}` }));
    const finished = [141, 140, 60, 140, 160].reduce(
      (match, score) => submitTurn(match, score, 3),
      createMatch(group, { ...config, startingScore: 301, checkOut: 'Open', legsToWin: 1 }),
    );
    const view = render(<StatsView match={finished} winnerId="p1" onHome={vi.fn()} />);
    const items = within(view.getByTestId('x01-ranking')).getAllByRole('listitem');
    expect(items.map((item) => item.getAttribute('data-competitor-id'))).toEqual(['p1', 'p2', 'p4', 'p3']);
    expect(items[0].dataset.state).toBe('winner');
    expect(items[0].textContent).toBe('1erAlice1 manche · reste 0');
    expect(items[1].textContent).toBe('2e ex aequoBob0 manche · reste 161');
    expect(items[3].textContent).toBe('4eCarol0 manche · reste 241');
    expect(view.getByRole('heading', { name: 'Classement' })).toBeTruthy();
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

  it('returns home after two minutes and cancels or replaces the inactivity timer', async () => {
    vi.useFakeTimers();
    const onHome = vi.fn();
    const nextHome = vi.fn();
    const props = { match: createMatch(players, config), winnerId: 'team1', onHome };
    const view = render(<StatsView {...props} />);
    await act(() => Promise.resolve().then(() => { vi.advanceTimersByTime(119999); }));
    expect(onHome).not.toHaveBeenCalled();
    view.rerender(<StatsView {...props} onHome={nextHome} />);
    await act(() => Promise.resolve().then(() => { vi.advanceTimersByTime(120000); }));
    expect(onHome).not.toHaveBeenCalled();
    expect(nextHome).toHaveBeenCalledOnce();
    view.unmount();
    await act(() => Promise.resolve().then(() => { vi.advanceTimersByTime(120000); }));
    expect(nextHome).toHaveBeenCalledOnce();
  });

  // Spec ref: spec:counter/external-match-link
  it('keeps the result view open for a linked match without offering a rematch', () => {
    const view = render(<StatsView match={createMatch(players, config)} winnerId="team1" onHome={vi.fn()} isExternalMatch />);
    expect(view.getByTestId('stats-share')).toBeTruthy();
    expect(view.queryByTestId('stats-rematch')).toBeNull();
  });

  it('keeps a linked result open without an automatic exit', async () => {
    vi.useFakeTimers();
    const onHome = vi.fn();
    render(
      <StatsView match={createMatch(players, config)} winnerId="team1" onHome={onHome} isExternalMatch />,
    );
    await act(() => Promise.resolve().then(() => { vi.advanceTimersByTime(600000); }));
    expect(onHome).not.toHaveBeenCalled();
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

  it('lists the declared winner first, then calculates MPR and scoring accuracy', () => {
    const onHome = vi.fn();
    const onRematch = vi.fn();
    const view = render(<CricketStatsView results={results} onHome={onHome} onRematch={onRematch} />);
    expect(view.getByRole('heading', { level: 2 }).textContent).toBe('Vainqueur: Alice');
    const names = view.getAllByText(/^(Alice|Bob)$/).filter((node) => node.parentElement?.dataset.fit !== undefined);
    expect(names.map((node) => node.textContent)).toEqual(['Alice', 'Bob']);
    const aliceStats = view.getAllByText('Alice')[1].closest<HTMLElement>('.border-b');
    if (!aliceStats) throw new Error('Alice stats row was not rendered');
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

  it('announces a declared tie and ranks the tied competitors ex aequo', () => {
    const tiedBob = { ...results.competitors[0], id: 'bob', name: 'Bob' };
    const view = render(
      <CricketStatsView results={{ ...results, competitors: [results.competitors[0], tiedBob], winnerId: null }} onHome={vi.fn()} onRematch={vi.fn()} />,
    );
    expect(view.getByRole('heading', { level: 2 }).textContent).toBe('Égalité : Alice et Bob');
    expect(view.getAllByText('1')).toHaveLength(2);
    expect(view.queryByText('2')).toBeNull();
  });
});
