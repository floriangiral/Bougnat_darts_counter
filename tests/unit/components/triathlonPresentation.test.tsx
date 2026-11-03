// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { TriathlonStatsView } from '../../../views/TriathlonStatsView';
import { TriathlonGameHeader } from '../../../components/triathlon/TriathlonGameHeader';
import { TriathlonStandingCard } from '../../../components/triathlon/TriathlonStandingCard';
import { TriathlonTransitionRecap } from '../../../components/triathlon/TriathlonTransitionRecap';
import { TriathlonStatsModal } from '../../../components/triathlon/TriathlonStatsModal';
import { createTriathlonScorecard } from '../../../src/domain/triathlon';

afterEach(cleanup);

function scorecard(id: string, name: string, totalScore = 42) {
  const card = createTriathlonScorecard(id, name);
  return {
    ...card, totalScore, totalBasePoints: 35, totalBonusPoints: 7,
    capital: {
      ...card.capital, basePoints: 20, bonusPoints: 5, totalPoints: 25, summary: 'Capital: 150 points',
      bonuses: [{ label: 'Meilleur capital', points: 5, detail: '150 points' }],
    },
    cricket: { ...card.cricket, basePoints: 15, bonusPoints: 2, totalPoints: 17, summary: 'Cricket: 2.50 MPR' },
  };
}

describe('TriathlonStatsView', () => {
  it('shows sorted scorecards, event summaries and bonuses, honoring the tie-break winner', () => {
    const cards = [scorecard('a', 'Alice'), scorecard('b', 'Bob')];
    const onHome = vi.fn();
    const onRematch = vi.fn();
    const view = render(<TriathlonStatsView players={[]} globalScores={{}} results={{ scorecards: cards, tieBreakWinnerId: 'b' }} onHome={onHome} onRematch={onRematch} />);
    expect(view.getAllByText('Bob 👑')).toHaveLength(2);
    const rows = within(view.getByRole('table')).getAllByRole('row');
    expect(rows[1].textContent).toContain('Bob');
    expect(rows[2].textContent).toContain('Alice');
    expect(view.getByText(/Egalite finale/)).toBeTruthy();
    expect(view.getAllByText('Capital: 150 points')).toHaveLength(2);
    expect(view.getAllByText('Cricket: 2.50 MPR')).toHaveLength(2);
    expect(view.getAllByText('Meilleur capital')).toHaveLength(2);
    expect(view.getAllByText('20 + 5 = 25')).toHaveLength(2);
    fireEvent.click(view.getByTestId('triathlon-stats-home'));
    fireEvent.click(view.getByTestId('triathlon-stats-rematch'));
    expect(onHome).toHaveBeenCalledOnce();
    expect(onRematch).toHaveBeenCalledOnce();
    expect(cards[0].competitorId).toBe('a');
  });

  it('builds legacy fallback scorecards from global scores and handles no competitors', () => {
    const props = {
      players: [{ id: 'a', name: 'Alice', teamId: 'a' }, { id: 'b', name: 'Bob', teamId: 'b' }],
      globalScores: { a: 12 }, results: {}, onHome: vi.fn(), onRematch: vi.fn(),
    };
    const view = render(<TriathlonStatsView {...props} />);
    expect(view.getAllByText('Alice 👑')).toHaveLength(2);
    expect(view.getAllByText('12/100')).toHaveLength(2);
    expect(view.getAllByText('0/100')).toHaveLength(2);
    expect(view.queryByText(/Egalite finale/)).toBeNull();
    view.rerender(<TriathlonStatsView {...props} players={[]} />);
    expect(within(view.getByRole('table')).getAllByRole('row')).toHaveLength(1);
    expect(view.getByTestId('triathlon-stats-home')).toBeTruthy();
  });
});

describe('Triathlon presentation components', () => {
  it('shows detailed live statistics and closes the modal, including tie-break annotations', () => {
    const cards = [scorecard('a', 'Alice'), scorecard('b', 'Bob', 31)];
    const onClose = vi.fn();
    const view = render(<TriathlonStatsModal scorecards={cards} tieBreakWinnerId="a" onClose={onClose} />);
    expect(view.getByRole('heading', { name: 'Statistiques Triathlon' })).toBeTruthy();
    expect(view.getByText('Alice • Departage')).toBeTruthy();
    expect(view.getByText('Bob')).toBeTruthy();
    expect(view.getByText(/Egalite finale departagee/)).toBeTruthy();
    expect(view.getByText('42/100')).toBeTruthy();
    expect(view.getByText('31/100')).toBeTruthy();
    expect(view.getAllByText('Meilleur capital')).toHaveLength(2);
    expect(view.getAllByText('Capital: 150 points')).toHaveLength(2);
    expect(view.getAllByText('Resultat 20 + Bonus 5')).toHaveLength(2);
    fireEvent.click(view.getByRole('button', { name: 'Fermer' }));
    expect(onClose).toHaveBeenCalledOnce();
    view.rerender(<TriathlonStatsModal scorecards={cards} onClose={onClose} />);
    expect(view.queryByText(/Egalite finale departagee/)).toBeNull();
    expect(view.getByText('Alice')).toBeTruthy();
  });

  it('keeps live statistics closable when no scorecards exist yet', () => {
    const onClose = vi.fn();
    const view = render(<TriathlonStatsModal scorecards={[]} onClose={onClose} />);
    expect(view.getByText(/Score total sur 100/)).toBeTruthy();
    expect(view.queryByText(/\/100$/)).toBeNull();
    fireEvent.click(view.getByRole('button', { name: 'Fermer' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('displays the wall clock and formatted elapsed time and dispatches header actions', () => {
    const onShowStats = vi.fn();
    const onShowExitConfirm = vi.fn();
    const view = render(<TriathlonGameHeader currentTime="16:12" elapsedSeconds={125} onShowStats={onShowStats} onShowExitConfirm={onShowExitConfirm} />);
    expect(view.getByText('16:12')).toBeTruthy();
    expect(view.getByText('02:05')).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: 'Stats' }));
    fireEvent.click(view.getByRole('button', { name: 'Quitter' }));
    expect(onShowStats).toHaveBeenCalledOnce();
    expect(onShowExitConfirm).toHaveBeenCalledOnce();
  });

  it('renders every event contribution and marks only the tie-break winner', () => {
    const cards = [scorecard('a', 'Alice'), scorecard('b', 'Bob', 31)];
    const view = render(<TriathlonStandingCard scorecards={cards} tieBreakWinnerId="a" />);
    expect(view.getByText('42/100')).toBeTruthy();
    expect(view.getByText('31/100')).toBeTruthy();
    expect(view.getAllByText('Base 35 | Bonus 7')).toHaveLength(2);
    expect(view.getAllByText('25 pts')).toHaveLength(2);
    expect(view.getByText('Gagnant du 501 tie-break').parentElement?.textContent).toContain('Alice');
    view.rerender(<TriathlonStandingCard scorecards={cards} />);
    expect(view.queryByText('Gagnant du 501 tie-break')).toBeNull();
  });

  it('switches event recaps and distinguishes awarded bonuses from no bonus', () => {
    const cards = [scorecard('a', 'Alice')];
    const view = render(<TriathlonTransitionRecap eventKey="capital" eventLabel="Capital termine" scorecards={cards} />);
    expect(view.getByRole('heading', { name: 'Capital termine' })).toBeTruthy();
    expect(view.getByText('20 points de resultat + 5 points bonus')).toBeTruthy();
    expect(view.getByText('Meilleur capital')).toBeTruthy();
    expect(view.getByText('Total triathlon : 42/100')).toBeTruthy();
    view.rerender(<TriathlonTransitionRecap eventKey="cricket" eventLabel="Cricket termine" scorecards={cards} />);
    expect(view.getByText('15 points de resultat + 2 points bonus')).toBeTruthy();
    expect(view.getByText('17 pts')).toBeTruthy();
    expect(view.getByText('Aucun bonus sur cette epreuve.')).toBeTruthy();
    expect(view.queryByText('Meilleur capital')).toBeNull();
  });
});
