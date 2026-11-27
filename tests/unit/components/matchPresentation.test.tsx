// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { MatchInputBar } from '../../../components/match/MatchInputBar';
import { MatchStatusPill } from '../../../components/match/MatchStatusPill';
import { MatchPlayerArea } from '../../../components/game/MatchPlayerArea';
import { MatchPlayersBoard } from '../../../components/match/MatchPlayersBoard';
import { MatchFeedbackOverlay } from '../../../components/match/MatchFeedbackOverlay';
import { CheckoutHint } from '../../../components/game/CheckoutHint';
import { StartingPlayerOverlay } from '../../../components/game/StartingPlayerOverlay';
import { createMatch } from '../../../src/application/scoring/matchLifecycle';

afterEach(cleanup);

describe('StartingPlayerOverlay', () => {
  it('selects a competitor by ID rather than label and allows cancelling', () => {
    const onSelect = vi.fn();
    const onCancel = vi.fn();
    const view = render(<StartingPlayerOverlay options={[{ id: 'team1', label: 'Alice / Anne' }, { id: 'team2', label: 'Bob / Bill' }]} onSelect={onSelect} onCancel={onCancel} />);
    expect(view.getByRole('dialog', { name: 'Qui commence ?' })).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: 'Alice / Anne' }));
    fireEvent.click(view.getByRole('button', { name: 'Bob / Bill' }));
    expect(onSelect.mock.calls).toEqual([['team1'], ['team2']]);
    fireEvent.click(view.getByRole('button', { name: 'Quitter' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('supports a custom prompt and an empty competitor list', () => {
    const view = render(<StartingPlayerOverlay title="Tir a la bulle" options={[]} onSelect={vi.fn()} onCancel={vi.fn()} />);
    expect(view.getByRole('dialog', { name: 'Tir a la bulle' })).toBeTruthy();
    expect(view.getAllByRole('button')).toHaveLength(1);
  });
});

describe('MatchInputBar', () => {
  const props = {
    inputBuffer: '', proposedVoiceScoreValue: null as number | null,
    showVoicePanel: false, voiceDisplayText: 'Cent quatre-vingts',
  };

  it('prioritizes typed input over voice suggestions and no longer carries the undo key', () => {
    const view = render(<MatchInputBar {...props} />);
    expect(view.getByText('---')).toBeTruthy();
    expect(view.queryByText(props.voiceDisplayText)).toBeNull();
    expect(view.queryByRole('button')).toBeNull();
    view.rerender(<MatchInputBar {...props} proposedVoiceScoreValue={0} showVoicePanel />);
    expect(view.getByText('0')).toBeTruthy();
    expect(view.getByText(props.voiceDisplayText)).toBeTruthy();
    view.rerender(<MatchInputBar {...props} inputBuffer="60" proposedVoiceScoreValue={180} />);
    expect(view.getByText('60')).toBeTruthy();
    expect(view.queryByText('180')).toBeNull();
  });

  it('shows the tablet display: big input, remaining after the visit, checkout and voice states', () => {
    const view = render(
      <MatchInputBar
        {...props}
        layout="display"
        checkoutPossible
      />,
    );
    const score = view.getByTestId('x01-input-score');
    const status = () => view.getByTestId('x01-display-status');
    expect(view.getByTestId('x01-display').dataset.state).toBe('empty');
    expect(score.textContent).toBe('---');
    expect(status().dataset.state).toBe('hint');
    expect(view.getByTestId('x01-display-checkout').textContent).toBe('Sortie possible');
    expect(view.queryByRole('button')).toBeNull();

    view.rerender(<MatchInputBar {...props} layout="display" inputBuffer="60" remainingAfter={441} />);
    expect(score.textContent).toBe('60');
    expect(score.dataset.state).toBe('filled');
    expect(status().dataset.state).toBe('remaining');
    expect(status().textContent).toBe('Reste 441');
    expect(view.queryByTestId('x01-display-checkout')).toBeNull();

    view.rerender(<MatchInputBar {...props} layout="display" remainingAfter={441} />);
    expect(view.queryByTestId('x01-display-remaining')).toBeNull();

    view.rerender(<MatchInputBar {...props} layout="display" showVoicePanel voiceDisplayText="" />);
    expect(status().dataset.state).toBe('voice');
    expect(status().textContent).toBe('À l’écoute…');

    view.rerender(<MatchInputBar {...props} layout="display" showVoicePanel voiceError voiceDisplayText="Micro refusé" />);
    expect(status().dataset.state).toBe('error');
    expect(status().textContent).toBe('Micro refusé');
  });
});

describe('MatchStatusPill', () => {
  it('switches legs to sets, retains leg counts and shows checkout hints only when enabled', () => {
    const props = {
      currentScore: 170, isSetsMode: false, leftLegsWon: 2, leftSetsWon: 4,
      rightLegsWon: 1, rightSetsWon: 3, showHints: false, checkoutRule: 'Double' as const,
    };
    const view = render(<MatchStatusPill {...props} />);
    expect(view.getByText('MANCHES')).toBeTruthy();
    expect(view.getByText('2')).toBeTruthy();
    expect(view.getByText('1')).toBeTruthy();
    expect(view.queryByText('Sortie conseillée')).toBeNull();
    view.rerender(<MatchStatusPill {...props} isSetsMode showHints />);
    for (const text of ['SETS', '4', '3', '(2)', '(1)', 'Sortie conseillée', 'T20 T20 Bull']) expect(view.getByText(text)).toBeTruthy();
    view.rerender(<MatchStatusPill {...props} currentScore={180} checkoutRule="Master" showHints />);
    expect(view.getByText('T20 T20 T20')).toBeTruthy();
  });
});

describe('CheckoutHint', () => {
  const routeFor = (score: number, rule: 'Open' | 'Double' | 'Master') => {
    const view = render(<CheckoutHint score={score} rule={rule} />);
    const route = view.queryByTestId('checkout-hint-route')?.textContent ?? null;
    view.unmount();
    return route;
  };

  it('suit la table Double-Out et n’affiche rien sur un reste non finissable', () => {
    expect(routeFor(170, 'Double')).toBe('T20 T20 Bull');
    expect(routeFor(180, 'Double')).toBeNull();
    expect(routeFor(1, 'Double')).toBeNull();
  });

  it('propose une route Master-Out terminée par un double, un triple ou le double bull', () => {
    expect(routeFor(40, 'Master')).toBe('D20');
    expect(routeFor(60, 'Master')).toBe('T20');
    expect(routeFor(180, 'Master')).toBe('T20 T20 T20');
    expect(routeFor(25, 'Master')).not.toMatch(/(^| )25$/);
    expect(routeFor(1, 'Master')).toBeNull();
    expect(routeFor(179, 'Master')).toBeNull();
  });

  it('propose une route Open, y compris sur un reste de 1', () => {
    expect(routeFor(1, 'Open')).toBe('1');
    expect(routeFor(180, 'Open')).toBe('T20 T20 T20');
    expect(routeFor(179, 'Open')).toBeNull();
  });
});

describe('MatchPlayerArea', () => {
  it('passes the current player score and remaining preview through to the score presentation', () => {
    const match = createMatch([
      { id: 'alice', name: 'Alice', teamId: 'team1' },
      { id: 'bob', name: 'Bob', teamId: 'team2' },
    ], { startingScore: 501, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS', legsToWin: 3, setsToWin: 1, isDoubles: false });
    const view = render(<MatchPlayerArea match={match} teamId="team1" remainingPreview={null} compactMobileBrowser={false} />);
    expect(view.getByText('Alice')).toBeTruthy();
    expect(view.getByText('501')).toBeTruthy();
    view.rerender(<MatchPlayerArea match={match} teamId="team1" remainingPreview={{ teamId: 'team1', score: 441 }} compactMobileBrowser />);
    expect(view.getByText('441')).toBeTruthy();
    expect(view.queryByText('501')).toBeNull();
    expect(match.currentLeg.scores.team1).toBe(501);
  });
});

describe('MatchPlayersBoard', () => {
  const config = { startingScore: 501, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS', legsToWin: 3, setsToWin: 1, isDoubles: false } as const;
  const playersOf = (count: number) => ['Alice', 'Bruno', 'Chloé', 'David'].slice(0, count)
    .map((name, index) => ({ id: `p${index + 1}`, name, teamId: `team${index + 1}` }));
  const board = (count: number, overrides: Partial<Parameters<typeof MatchPlayersBoard>[0]> = {}, startingScore = 501) => {
    const match = createMatch(playersOf(count), { ...config, startingScore });
    return { match, view: render(<MatchPlayersBoard match={match} remainingPreview={null} compactMobileBrowser={false} splitLayout={false} showHints={false} {...overrides} />) };
  };

  it('keeps the two-column duel with the central legs pill', () => {
    const { view } = board(2);
    const players = view.getByTestId('x01-players');
    expect(players.dataset.variant).toBe('duel');
    expect(view.getAllByTestId('x01-player-card')).toHaveLength(2);
    expect(view.getByTestId('x01-status-pill')).toBeTruthy();
    expect(view.queryByTestId('x01-player-counters')).toBeNull();
  });

  it.each([3, 4])('renders every one of %i players in a grid, with per-card counters and the active player marked', (count) => {
    const { match, view } = board(count);
    const players = view.getByTestId('x01-players');
    expect(players.dataset.variant).toBe('grid');
    expect(players.dataset.teamCount).toBe(String(count));
    const cards = view.getAllByTestId('x01-player-card');
    expect(cards).toHaveLength(count);
    expect(view.getAllByTestId('x01-player-score').map((score) => score.textContent?.trim())).toEqual(Array.from({ length: count }, () => '501'));
    expect(view.queryByTestId('x01-status-pill')).toBeNull();
    expect(view.getAllByTestId('x01-player-counters')).toHaveLength(count);
    const activeTeam = match.players[match.currentPlayerIndex].teamId;
    const active = cards.filter((card) => card.dataset.state === 'active');
    expect(active).toHaveLength(1);
    expect(active[0].closest('[data-team-id]')?.getAttribute('data-team-id')).toBe(activeTeam);
    expect(active[0].getAttribute('aria-current')).toBe('true');
  });

  it('shows per-card counters and the finish hint under the active score in the split layout', () => {
    const { view } = board(2, { splitLayout: true, showHints: true }, 170);
    expect(view.queryByTestId('x01-status-pill')).toBeNull();
    expect(view.getAllByTestId('x01-player-counters').map((node) => node.textContent)).toEqual(['Manches 0', 'Manches 0']);
    expect(view.getAllByTestId('checkout-hint')).toHaveLength(1);
    const activeCell = view.getByTestId('x01-players').querySelector('[data-active="true"]');
    expect(activeCell?.querySelector('[data-testid="checkout-hint-route"]')?.textContent).toBe('T20 T20 Bull');
  });

  it('renders a single competitor next to an empty column', () => {
    const { view } = board(1);
    expect(view.getAllByTestId('x01-player-card')).toHaveLength(1);
    expect(view.getByTestId('x01-players').querySelector('[data-empty="true"]')).not.toBeNull();
  });

  it.each([
    [4, true, 1],
    [4, true, 3],
    [3, true, 0],
    [4, false, 1],
    [3, false, 2],
  ] as const)('keeps %i cards in passage order when the active player changes (split %s, active index %i)', (count, splitLayout, activeIndex) => {
    const { match } = board(count);
    cleanup();
    const view = render(
      <MatchPlayersBoard match={{ ...match, currentPlayerIndex: activeIndex }} remainingPreview={null} compactMobileBrowser={false} splitLayout={splitLayout} showHints={false} />,
    );
    const cells = Array.from(view.getByTestId('x01-players').querySelectorAll<HTMLElement>('[data-team-id]'));
    expect(view.getByTestId('x01-players').dataset.seating).toBe('fixed');
    expect(cells.map((cell) => [cell.dataset.teamId, cell.dataset.seat, cell.style.order, cell.dataset.active]))
      .toEqual(Array.from({ length: count }, (_, index) => [`team${index + 1}`, String(index), '', String(index === activeIndex)]));
  });

  it('leaves the two-player duel untouched by the rotation', () => {
    const { match } = board(2);
    cleanup();
    const view = render(
      <MatchPlayersBoard match={{ ...match, currentPlayerIndex: 1 }} remainingPreview={null} compactMobileBrowser={false} splitLayout showHints={false} />,
    );
    const cells = Array.from(view.getByTestId('x01-players').querySelectorAll<HTMLElement>('[data-team-id]'));
    expect(cells.map((cell) => [cell.dataset.teamId, cell.style.order, cell.dataset.seat])).toEqual([['team1', '', undefined], ['team2', '', undefined]]);
  });

  describe('places fixes à 3 ou 4 joueurs', () => {
    const renderFixed = (count: number, activeIndex: number, splitLayout = false) => {
      const { match } = board(count, {}, 170);
      cleanup();
      return render(
        <MatchPlayersBoard match={{ ...match, currentPlayerIndex: activeIndex }} remainingPreview={null} compactMobileBrowser={false} splitLayout={splitLayout} showHints />,
      );
    };
    const seats = (view: ReturnType<typeof render>) =>
      Array.from(view.getByTestId('x01-players').children as HTMLCollectionOf<HTMLElement>)
        .map((cell) => [cell.dataset.teamId ?? 'vide', cell.dataset.seat ?? null, cell.style.order, cell.dataset.active ?? null]);

    it.each([false, true])('garde chaque joueur à sa place et ne déplace que le cadre actif (paysage %s)', (splitLayout) => {
      const first = renderFixed(4, 0, splitLayout);
      expect(first.getByTestId('x01-players').dataset.seating).toBe('fixed');
      expect(seats(first)).toEqual([
        ['team1', '0', '', 'true'], ['team2', '1', '', 'false'], ['team3', '2', '', 'false'], ['team4', '3', '', 'false'],
      ]);
      const next = renderFixed(4, 2, splitLayout);
      expect(seats(next).map(([team, seat, , active]) => [team, seat, active])).toEqual([
        ['team1', '0', 'false'], ['team2', '1', 'false'], ['team3', '2', 'true'], ['team4', '3', 'false'],
      ]);
      expect(next.getAllByTestId('checkout-hint')).toHaveLength(1);
      expect(next.getByTestId('x01-players').querySelector('[data-active="true"] [data-testid="checkout-hint"]')).not.toBeNull();
    });

    it('laisse vide la case en bas à droite à 3 joueurs', () => {
      const view = renderFixed(3, 1);
      expect(seats(view).map(([team]) => team)).toEqual(['team1', 'team2', 'team3', 'vide']);
      expect(view.getByTestId('x01-players').lastElementChild?.getAttribute('data-empty')).toBe('true');
      expect(view.getAllByTestId('x01-player-card')).toHaveLength(3);
    });

    it('réserve l’emplacement du finish sur chaque carte et marque le joueur qui a commencé la partie', () => {
      const view = renderFixed(4, 1);
      expect(view.getByTestId('x01-players').querySelectorAll('.x01-player-below-score[data-reserved]')).toHaveLength(4);
      const marks = view.getAllByTestId('x01-starter-mark');
      expect(marks).toHaveLength(1);
      expect(marks[0].closest('[data-team-id]')?.getAttribute('data-team-id')).toBe('team1');
      expect(marks[0].textContent).toContain('A commencé la partie');
    });

    it('ne change rien au duel et fixe les places sans option de présentation', () => {
      const duel = renderFixed(2, 0);
      expect(duel.getByTestId('x01-players').dataset.seating).toBeUndefined();
      expect(duel.queryByTestId('x01-starter-mark')).toBeNull();
      cleanup();
      const { view } = board(4);
      expect(view.getByTestId('x01-players').dataset.seating).toBe('fixed');
      expect(view.getAllByTestId('x01-starter-mark')).toHaveLength(1);
    });
  });
});

describe('MatchFeedbackOverlay', () => {
  it.each([
    ['bust', 'bust', 'Trop'], ['miss', 'miss', 'Tour'], ['notice', 'notice', 'Info'], ['info', 'info', 'Belles fléchettes !'],
  ] as const)('exposes the %s tone and its label', (type, tone, label) => {
    const view = render(<MatchFeedbackOverlay text="TROP !" type={type} />);
    const card = view.getByTestId('x01-feedback');
    expect(card.dataset.tone).toBe(tone);
    expect(view.getByText(label)).toBeTruthy();
    expect(view.getByText('TROP !')).toBeTruthy();
    view.unmount();
  });
});

