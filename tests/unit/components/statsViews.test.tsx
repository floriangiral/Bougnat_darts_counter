// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, waitFor, within } from '@testing-library/react';
import { StatsView } from '../../../views/StatsView';
import { CricketStatsView } from '../../../views/CricketStatsView';
import { CricketStatsModal } from '../../../components/stats/CricketStatsModal';
import { createMatch, submitTurn } from '../../../src/application/scoring/matchLifecycle';
import type { CricketMatchSummary, GameConfig, Player } from '../../../types';
import { createX01ResultImage } from '../../../src/presentation/stats/x01ResultImage.fr';

vi.mock('../../../src/presentation/stats/x01ResultImage.fr', () => ({
  createX01ResultImage: vi.fn(),
}));

vi.mock('../../../components/stats/StatsModal', () => ({
  StatsModal: ({ title, inline, showHeader }: { title: string; inline: boolean; showHeader?: boolean }) => (
    <div data-inline={inline} data-show-header={String(showHeader ?? true)}>{title}</div>
  ),
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.mocked(createX01ResultImage).mockReset();
  vi.mocked(createX01ResultImage).mockResolvedValue(new File(['image'], 'resultat.png', { type: 'image/png' }));
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
  it('shows the winner, embeds match stats and offers rematch, share and exit', () => {
    const onHome = vi.fn();
    const onRematch = vi.fn();
    const match = createMatch(players, config);
    const view = render(<StatsView match={match} winnerId="team1" onHome={onHome} onRematch={onRematch} />);
    expect(view.getByRole('heading', { level: 2 }).textContent).toBe('Vainqueur: Alice');
    const scoreboard = view.getByTestId('x01-scoreboard');
    expect(within(scoreboard).getByText('Score final : 0 manches à 0')).toBeTruthy();
    expect(scoreboard.querySelector('[data-state="winner"]')?.getAttribute('data-competitor-id')).toBe('team1');
    expect(view.getByTestId('x01-result-meta').textContent).toBe('501 · Sortie double · 00:00');
    const embeddedStats = view.getByText('STATISTIQUES DU MATCH');
    expect(embeddedStats.getAttribute('data-inline')).toBe('true');
    // The stats page title already names the screen: the embedded table drops its visible header.
    expect(embeddedStats.getAttribute('data-show-header')).toBe('false');
    expect(view.queryByTestId('x01-ranking')).toBeNull();
    expect(view.getByTestId('stats-share')).toBeTruthy();
    fireEvent.click(view.getByTestId('stats-rematch'));
    expect(onRematch).toHaveBeenCalledOnce();
    fireEvent.click(view.getByTestId('stats-home'));
    expect(onHome).toHaveBeenCalledOnce();
  });

  it('opens the preview and shares its ready file directly on click', async () => {
    const share = vi.fn<(data: { files: File[] }) => Promise<void>>().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(true);
    vi.stubGlobal('navigator', { share, canShare });
    const match = createMatch(players, config);
    const view = render(<StatsView match={match} winnerId="team1" onHome={vi.fn()} />);
    fireEvent.click(view.getByTestId('stats-share'));
    const dialog = view.getByRole('dialog', { name: 'Partager le résultat' });
    expect(createX01ResultImage).toHaveBeenCalledWith(match);
    const preview = await within(dialog).findByRole('img');
    expect(preview.getAttribute('src')).toMatch(/^data:image\/png/);
    const button = within(dialog).getByRole('button', { name: 'Partager l’image' });
    fireEvent.click(button);
    expect(share).toHaveBeenCalledOnce();
    expect(share.mock.calls[0][0].files[0].name).toBe('resultat.png');
    expect(canShare).toHaveBeenCalledWith({ files: [share.mock.calls[0][0].files[0]] });
    await waitFor(() => expect(button.hasAttribute('disabled')).toBe(false));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Fermer' }));
    expect(view.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(view.getByTestId('stats-share'));
  });

  it('shares the finished text from the preview', async () => {
    const share = vi.fn<(data: { title: string; text: string }) => Promise<void>>().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share });
    const view = render(<StatsView match={createMatch(players, config)} winnerId="team1" onHome={vi.fn()} />);

    fireEvent.click(view.getByTestId('stats-share'));
    fireEvent.click(view.getByRole('button', { name: 'Partager le texte' }));
    await waitFor(() => expect(share).toHaveBeenCalledOnce());

    expect(share).toHaveBeenCalledOnce();
    const payload = share.mock.calls[0]?.[0];
    expect(payload?.title).toBe('Résultat X01 — Alice');
    expect(payload?.text).toContain('Alice remporte le match');
  });

  it('copies text explicitly and uses the clipboard fallback for text sharing', async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const view = render(<StatsView match={createMatch(players, config)} winnerId="team1" onHome={vi.fn()} />);

    fireEvent.click(view.getByTestId('stats-share'));
    fireEvent.click(view.getByRole('button', { name: 'Copier le texte' }));
    await view.findByText('Résultat copié dans le presse-papiers.');
    expect(writeText.mock.calls[0][0]).toContain('Alice remporte le match');
    fireEvent.click(view.getByRole('button', { name: 'Partager le texte' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(2));
  });

  it('reports unsupported image sharing but allows download and copy', async () => {
    vi.stubGlobal('navigator', {});
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const view = render(<StatsView match={createMatch(players, config)} winnerId="team1" onHome={vi.fn()} />);
    fireEvent.click(view.getByTestId('stats-share'));
    await view.findByRole('img');
    expect(view.getByText('Le partage d’image n’est pas disponible sur cet appareil.')).toBeTruthy();
    expect(view.getByRole('button', { name: 'Partager l’image' }).hasAttribute('disabled')).toBe(true);
    fireEvent.click(view.getByRole('button', { name: 'Enregistrer l’image' }));
    expect(click).toHaveBeenCalledOnce();
    expect(view.getByText('Téléchargement de l’image demandé.')).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: 'Copier le texte' }));
    await view.findByText('Le presse-papiers n’est pas disponible.');
  });

  it('reports generation failures, retries and keeps text available', async () => {
    vi.mocked(createX01ResultImage).mockRejectedValueOnce(new Error('échec'));
    const view = render(<StatsView match={createMatch(players, config)} winnerId="team1" onHome={vi.fn()} />);
    fireEvent.click(view.getByTestId('stats-share'));
    await view.findByRole('alert');
    expect(view.getByRole('button', { name: 'Copier le texte' }).hasAttribute('disabled')).toBe(false);
    fireEvent.click(view.getByRole('button', { name: 'Réessayer' }));
    expect(await view.findByRole('img')).toBeTruthy();
  });

  it('reports an unreadable preview and allows a retry', async () => {
    const view = render(<StatsView match={createMatch(players, config)} winnerId="team1" onHome={vi.fn()} />);
    fireEvent.click(view.getByTestId('stats-share'));
    fireEvent.error(await view.findByRole('img'));
    expect(view.getByRole('alert').textContent).toContain('Impossible de générer ou d’afficher l’image.');
    expect(view.getByRole('button', { name: 'Enregistrer l’image' }).hasAttribute('disabled')).toBe(true);
    expect(view.getByRole('button', { name: 'Copier le texte' }).hasAttribute('disabled')).toBe(false);
    fireEvent.click(view.getByRole('button', { name: 'Réessayer' }));
    expect(await view.findByRole('img')).toBeTruthy();
  });

  it('reports share and clipboard errors but not native cancellation', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const share = vi.fn().mockRejectedValueOnce(new DOMException('annulé', 'AbortError')).mockRejectedValueOnce(new Error('échec'));
    const writeText = vi.fn().mockRejectedValue(new Error('refus'));
    vi.stubGlobal('navigator', { share, canShare: () => true, clipboard: { writeText } });
    const view = render(<StatsView match={createMatch(players, config)} winnerId="team1" onHome={vi.fn()} />);
    fireEvent.click(view.getByTestId('stats-share'));
    await view.findByRole('img');
    const button = view.getByRole('button', { name: 'Partager l’image' });
    fireEvent.click(button);
    await waitFor(() => expect(button.hasAttribute('disabled')).toBe(false));
    expect(view.queryByText(/Impossible de partager l’image/)).toBeNull();
    fireEvent.click(button);
    await view.findByText('Impossible de partager l’image. Veuillez réessayer.');
    fireEvent.click(view.getByRole('button', { name: 'Copier le texte' }));
    await view.findByText('Impossible de copier le texte. Veuillez réessayer.');
  });

  it('reports download and text sharing errors without claiming success', async () => {
    const share = vi.fn().mockRejectedValue(new Error('échec'));
    vi.stubGlobal('navigator', { share });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => { throw new Error('échec'); });
    const view = render(<StatsView match={createMatch(players, config)} winnerId="team1" onHome={vi.fn()} />);
    fireEvent.click(view.getByTestId('stats-share'));
    await view.findByRole('img');
    fireEvent.click(view.getByRole('button', { name: 'Enregistrer l’image' }));
    expect(view.getByText('Impossible de télécharger l’image. Veuillez réessayer.')).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: 'Partager le texte' }));
    await view.findByText('Impossible de partager le texte. Veuillez réessayer.');
  });

  it('traps keyboard focus within the preview', async () => {
    vi.stubGlobal('navigator', {});
    const view = render(<StatsView match={createMatch(players, config)} winnerId="team1" onHome={vi.fn()} />);
    fireEvent.click(view.getByTestId('stats-share'));
    const dialog = view.getByRole('dialog');
    const close = within(dialog).getByRole('button', { name: 'Fermer' });
    expect(document.activeElement).toBe(close);
    await within(dialog).findByRole('img');
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(within(dialog).getByRole('button', { name: 'Partager le texte' }));
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(close);
  });

  it('displays the full-width image in a keyboard-focusable scrolling preview', async () => {
    vi.stubGlobal('navigator', {});
    const view = render(<StatsView match={createMatch(players, config)} winnerId="team1" onHome={vi.fn()} />);
    fireEvent.click(view.getByTestId('stats-share'));
    const region = await view.findByRole('region', { name: 'Aperçu défilable de l’image' });
    const image = within(region).getByRole('img');
    expect(region.getAttribute('tabindex')).toBe('0');
    expect(region.className).toContain('overflow-y-auto');
    expect(region.className).toContain('max-h-[45dvh]');
    expect(image.className).toContain('w-full');
    expect(image.className).not.toContain('max-h-');
    region.focus();
    expect(document.activeElement).toBe(region);
    expect(view.getByRole('button', { name: 'Enregistrer l’image' })).toBeTruthy();
    expect(view.getByRole('button', { name: 'Copier le texte' })).toBeTruthy();
    expect(view.getByRole('button', { name: 'Partager le texte' })).toBeTruthy();
    expect(view.getByRole('button', { name: 'Partager l’image' })).toBeTruthy();
    fireEvent.keyDown(region, { key: 'Escape' });
    expect(view.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(view.getByTestId('stats-share'));
  });

  it('shows a brief partner-send confirmation while keeping partner stats actions limited', async () => {
    vi.useFakeTimers();
    const view = render(
      <StatsView
        match={createMatch(players, config)}
        winnerId="team1"
        onHome={vi.fn()}
        isExternalMatch
        partnerResultStatus={{ state: 'sent', host: 'badarts.fr' }}
      />,
    );

    expect(view.getByText('Résultat envoyé vers badarts.fr.')).toBeTruthy();
    expect(view.getByTestId('stats-share')).toBeTruthy();
    expect(view.getByTestId('stats-home')).toBeTruthy();
    expect(view.queryByTestId('stats-rematch')).toBeNull();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(view.queryByText('Résultat envoyé vers badarts.fr.')).toBeNull();
  });

  it('offers retry and organization sharing when partner delivery fails', async () => {
    const share = vi.fn<(data: { title: string; text: string }) => Promise<void>>().mockResolvedValue(undefined);
    const onRetryPartner = vi.fn();
    vi.stubGlobal('navigator', { share });
    const view = render(
      <StatsView
        match={createMatch(players, config)}
        winnerId="team1"
        onHome={vi.fn()}
        isExternalMatch
        partnerResultStatus={{ state: 'failed', host: 'badarts.fr' }}
        onRetryPartner={onRetryPartner}
      />,
    );

    fireEvent.click(view.getByTestId('partner-send-retry'));
    expect(onRetryPartner).toHaveBeenCalledOnce();
    expect(view.getByTestId('partner-notify-organization').textContent).toBe('Prévenir l’organisation');
    await act(async () => {
      fireEvent.click(view.getByTestId('partner-notify-organization'));
      await Promise.resolve();
    });

    const payload = share.mock.calls[0]?.[0];
    expect(payload?.text).toContain('À transmettre à badarts.fr.');
  });

  it('suspends the timeout while the organization sharing sheet is open', async () => {
    vi.useFakeTimers();
    let finish!: () => void;
    const share = vi.fn<(data: { title: string; text: string }) => Promise<void>>()
      .mockReturnValue(new Promise<void>((resolve) => { finish = resolve; }));
    vi.stubGlobal('navigator', { share });
    const onHome = vi.fn();
    const view = render(<StatsView match={createMatch(players, config)} winnerId="team1" onHome={onHome}
      partnerResultStatus={{ state: 'failed', host: 'badarts.fr' }} />);
    fireEvent.click(view.getByTestId('partner-notify-organization'));
    expect(share.mock.calls[0][0].text).toContain('À transmettre à badarts.fr.');
    await act(async () => { await vi.advanceTimersByTimeAsync(300000); });
    expect(onHome).not.toHaveBeenCalled();
    await act(async () => { finish(); await Promise.resolve(); });
    await act(async () => { await vi.advanceTimersByTimeAsync(120000); });
    expect(onHome).toHaveBeenCalledOnce();
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

  it('suspends the timeout throughout the preview and restarts it on closing', async () => {
    vi.useFakeTimers();
    vi.mocked(createX01ResultImage).mockReturnValue(new Promise(() => {}));
    const onHome = vi.fn();
    const view = render(<StatsView match={createMatch(players, config)} winnerId="team1" onHome={onHome} />);
    fireEvent.click(view.getByTestId('stats-share'));
    await act(async () => { await vi.advanceTimersByTimeAsync(300000); });
    expect(onHome).not.toHaveBeenCalled();
    fireEvent.keyDown(view.getByRole('dialog'), { key: 'Escape' });
    await act(async () => { await vi.advanceTimersByTimeAsync(119999); });
    expect(onHome).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(onHome).toHaveBeenCalledOnce();
  });

  it('keeps the preview open while a native sheet is pending', async () => {
    let finish!: () => void;
    const share = vi.fn().mockReturnValue(new Promise<void>((resolve) => { finish = resolve; }));
    vi.stubGlobal('navigator', { share, canShare: () => true });
    const view = render(<StatsView match={createMatch(players, config)} winnerId="team1" onHome={vi.fn()} isExternalMatch />);
    fireEvent.click(view.getByTestId('stats-share'));
    await view.findByRole('img');
    fireEvent.click(view.getByRole('button', { name: 'Partager l’image' }));
    fireEvent.keyDown(view.getByRole('dialog'), { key: 'Escape' });
    expect(view.getByRole('dialog')).toBeTruthy();
    expect(view.getByRole('button', { name: 'Fermer' }).hasAttribute('disabled')).toBe(true);
    await act(async () => { finish(); await Promise.resolve(); });
    fireEvent.keyDown(view.getByRole('dialog'), { key: 'Escape' });
    expect(view.queryByRole('dialog')).toBeNull();
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

  it('garde l’ordre des places jouées avant le classement calculé (spec 136)', () => {
    const carol = { ...results.competitors[1], id: 'carol', name: 'Carol', score: 0 };
    const view = render(
      <CricketStatsView results={{ ...results, competitors: [...results.competitors, carol], placedIds: ['alice', 'carol'] }} onHome={vi.fn()} onRematch={vi.fn()} />,
    );
    const names = view.getAllByText(/^(Alice|Bob|Carol)$/).filter((node) => node.parentElement?.dataset.fit !== undefined);
    expect(names.map((node) => node.textContent)).toEqual(['Alice', 'Carol', 'Bob']);
  });
});

describe('CricketStatsModal', () => {
  const blankMarks = { 20: 0, 19: 0, 18: 0, 17: 0, 16: 0, 15: 0, 25: 0 };
  const competitor = (id: string, name: string) => ({ id, name, score: 0, dartsThrown: 0, marks: blankMarks, history: [] });

  it('shows one readable column per player and scrolls horizontally beyond two players', () => {
    const four = ['Alice', 'Bruno', 'Chloé', 'Damien'].map((name) => competitor(name.toLowerCase(), name));
    const view = render(<CricketStatsModal players={four} onClose={vi.fn()} />);
    const scroll = view.getByTestId('cricket-stats-scroll');
    expect(scroll.dataset.columns).toBe('4');
    expect(scroll.className).toContain('overflow-auto');
    expect(four.map(({ name }) => view.getAllByText(name).length)).toEqual([1, 1, 1, 1]);
    expect(within(scroll).getAllByText('Score')[0].parentElement?.children).toHaveLength(5);
    expect(within(scroll).getAllByText('Score')[0].parentElement?.style.getPropertyValue('--st-cols')).toBe('4');

    cleanup();
    const duel = render(<CricketStatsModal players={four.slice(0, 2)} onClose={vi.fn()} />);
    expect(duel.getByTestId('cricket-stats-scroll').className).not.toContain('overflow-auto');
  });
});
