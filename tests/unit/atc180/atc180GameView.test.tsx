// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';

import { Atc180GameView } from '../../../views/Atc180GameView';
import type { Atc180MatchSummary, GameConfig, Player } from '../../../types';
import type { Atc180RuntimeSnapshot } from '../../../src/shared/session/persistedAppSession';

// Spec ref: specs/130-counter-180-around-the-clock (FR-03 à FR-09, AC-03 à AC-08).

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const config: GameConfig = {
  startingScore: 0, checkIn: 'Open', checkOut: 'Open', matchMode: 'LEGS',
  setsToWin: 1, legsToWin: 1, isDoubles: false,
};
const alice: Player = { id: 'alice', name: 'Alice', teamId: 'alice' };
const bob: Player = { id: 'bob', name: 'Bob', teamId: 'bob' };

const renderGame = (players: Player[], props: Partial<React.ComponentProps<typeof Atc180GameView>> = {}) => {
  const onFinish = vi.fn<(summary: Atc180MatchSummary) => void>();
  const onStateChange = vi.fn<(snapshot: Atc180RuntimeSnapshot) => void>();
  const onExit = vi.fn();
  const view = render(
    <Atc180GameView players={players} config={config} onExit={onExit} onFinish={onFinish} onStateChange={onStateChange} {...props} />,
  );
  const key = (id: string) => view.container.querySelector<HTMLButtonElement>(`[data-key="${id}"]`)!;
  const hit = (...ids: string[]) => ids.forEach((id) => fireEvent.click(key(id)));
  const press = (name: string) => fireEvent.click(view.getByRole('button', { name }));
  const lastSnapshot = () => onStateChange.mock.calls.at(-1)![0];
  return { view, onFinish, onStateChange, onExit, key, hit, press, lastSnapshot };
};

const playAll = (hit: (...ids: string[]) => void, volleys: number, darts: string[]) => {
  for (let index = 0; index < volleys; index += 1) hit(...darts);
};

describe('Atc180GameView — partie', () => {
  it('impose l’ordre complet au-delà de deux joueurs et le conserve à travers les tours et la reprise', () => {
    const chloe: Player = { id: 'chloe', name: 'Chloé', teamId: 'chloe' };
    const { view, hit, lastSnapshot } = renderGame([alice, bob, chloe]);
    expect(view.getByRole('dialog', { name: 'Ordre de passage' })).toBeTruthy();
    hit('triple');
    expect(lastSnapshot().state.currentDarts).toHaveLength(0);
    expect(lastSnapshot().timing.running).toBe(false);
    fireEvent.click(view.getByTestId('throw-order-option-bob'));
    fireEvent.click(view.getByTestId('throw-order-option-chloe'));
    fireEvent.click(view.getByTestId('throw-order-confirm'));
    expect(lastSnapshot().state.players.map((player) => player.id)).toEqual(['bob', 'chloe', 'alice']);
    hit('triple', 'double', 'miss');
    expect(view.getByTestId('atc180-player-chloe').dataset.state).toBe('active');
    hit('miss', 'miss', 'miss', 'miss', 'miss', 'miss');
    expect(view.getByTestId('atc180-target').textContent).toBe('2');
    expect(view.getByTestId('atc180-player-bob').dataset.state).toBe('active');
    const snapshot = lastSnapshot();
    cleanup();
    const resumed = renderGame([alice, bob, chloe], { restoredState: snapshot });
    expect(resumed.view.queryByRole('dialog', { name: 'Ordre de passage' })).toBeNull();
    expect(resumed.lastSnapshot().state.players.map((player) => player.id)).toEqual(['bob', 'chloe', 'alice']);
    expect(resumed.view.getByTestId('atc180-player-bob').dataset.state).toBe('active');
  });

  it('demande « Qui commence ? » à plusieurs puis remplit les zones avec le joueur choisi', () => {
    const { view, key } = renderGame([alice, bob]);
    expect(view.getByRole('dialog', { name: 'Qui commence ?' })).toBeTruthy();
    fireEvent.click(key('triple'));
    expect(view.getByTestId('atc180-volley').getAttribute('data-darts')).toBe('0');

    fireEvent.click(view.getByTestId('starter-option-1'));
    expect(view.queryByRole('dialog', { name: 'Qui commence ?' })).toBeNull();
    const screen = view.getByTestId('game-screen');
    expect(screen.getAttribute('data-game')).toBe('atc180');
    expect(screen.querySelector('[data-zone="header"]')?.textContent).toContain('180 · Tour 1/20');
    const input = screen.querySelector<HTMLElement>('[data-zone="input"]')!;
    expect(within(input).getAllByRole('button').map((button) => button.getAttribute('aria-label') ?? button.textContent)).toEqual(
      ['Triple : 3 pts', 'Double : 1 pt', 'Simple : 1 pt', 'Miss : 0 pt', 'Annuler'],
    );
    expect(view.queryByRole('button', { name: 'Passer' })).toBeNull();
    expect(['triple', 'double', 'single', 'miss'].map((id) => key(id).getAttribute('data-tone'))).toEqual(['triple', 'double', 'neutral', 'danger']);
    expect(view.getByTestId('atc180-player-bob').getAttribute('data-state')).toBe('active');
    expect(view.getByTestId('atc180-player-alice').getAttribute('data-state')).toBe('idle');
    expect(view.getByRole('heading', { level: 1, name: 'Bob' })).toBeTruthy();
    expect(view.getByTestId('atc180-target').textContent).toBe('1');
  });

  it('affiche la progression des 20 tours en solo et actualise les points provisoires', () => {
    const { view, hit } = renderGame([alice]);
    const grid = view.getByTestId('atc180-training-grid');
    const firstRound = view.getByTestId('atc180-training-round-1');
    expect(grid.children).toHaveLength(20);
    expect(view.getByTestId('atc180-training-panel').textContent).toContain('Progression');
    expect(view.queryByText('Tableau')).toBeNull();
    expect((view.getByRole('progressbar', { name: 'Tours terminés' }) as HTMLProgressElement).value).toBe(0);
    expect(firstRound.dataset.state).toBe('current');
    expect(firstRound.dataset.points).toBe('0');

    hit('triple', 'single');
    expect(firstRound.dataset.state).toBe('current');
    expect(firstRound.dataset.points).toBe('4');
    expect(firstRound.textContent).toContain('+4');

    hit('miss');
    expect(firstRound.dataset.state).toBe('complete');
    expect(firstRound.dataset.points).toBe('4');
    expect(view.getByTestId('atc180-training-round-2').dataset.state).toBe('current');
    expect(view.getByTestId('atc180-target').textContent).toBe('2');
    expect((view.getByRole('progressbar', { name: 'Tours terminés' }) as HTMLProgressElement).value).toBe(1);
  });

  it('saisit fléchette par fléchette, passe la main après 3 fléchettes et avance d’un numéro après chaque tour', () => {
    const { view, hit, onStateChange } = renderGame([alice, bob]);
    fireEvent.click(view.getByTestId('starter-option-0'));
    expect(view.queryByTestId('atc180-training-panel')).toBeNull();
    expect(view.getByRole('heading', { name: 'Tableau' })).toBeTruthy();
    hit('triple', 'single');
    expect(view.getByTestId('atc180-slot-0').getAttribute('data-tone')).toBe('triple');
    expect(view.getByTestId('atc180-slot-0').textContent).toBe('T1');
    expect(view.getByTestId('atc180-slot-1').textContent).toBe('S1');
    expect(view.getByTestId('atc180-slot-2').getAttribute('data-state')).toBe('next');
    expect(view.getByTestId('atc180-volley-points').textContent).toBe('+4');

    hit('miss');
    expect(view.getByTestId('atc180-player-alice').textContent).toContain('4');
    expect(view.getByTestId('atc180-player-bob').getAttribute('data-state')).toBe('active');
    expect(view.getByTestId('atc180-volley').textContent).toContain('Volée précédente : Alice sur le 1, +4 pts');

    hit('double');
    hit('miss');
    expect(view.getByTestId('atc180-player-bob').getAttribute('data-state')).toBe('active');
    expect(view.getByTestId('atc180-target').textContent).toBe('1');
    hit('miss');
    expect(view.getByTestId('atc180-target').textContent).toBe('2');
    expect(view.getByTestId('atc180-player-alice').getAttribute('data-state')).toBe('active');
    expect(view.getByTestId('atc180-player-alice').getAttribute('data-leader')).toBe('true');
    expect(onStateChange).toHaveBeenLastCalledWith(expect.objectContaining({ gameType: 'ATC180', hasGameStarted: true }));
  });

  it('annule à travers les changements de joueur et de tour', () => {
    const { view, hit, press } = renderGame([alice, bob]);
    fireEvent.click(view.getByTestId('starter-option-0'));
    const undo = () => view.getByRole('button', { name: 'Annuler' });
    expect(undo().hasAttribute('disabled')).toBe(true);
    hit('triple', 'triple', 'triple');
    hit('single', 'single', 'single');
    expect(view.getByTestId('atc180-target').textContent).toBe('2');

    press('Annuler');
    expect(view.getByTestId('atc180-target').textContent).toBe('1');
    expect(view.getByTestId('atc180-player-bob').getAttribute('data-state')).toBe('active');
    expect(view.getByTestId('atc180-volley').getAttribute('data-darts')).toBe('2');
    press('Annuler');
    press('Annuler');
    press('Annuler');
    expect(view.getByTestId('atc180-player-alice').getAttribute('data-state')).toBe('active');
    expect(view.getByTestId('atc180-volley').getAttribute('data-darts')).toBe('2');
    expect(view.getByTestId('atc180-active-total').textContent).toBe('0');
  });

  it('termine sur le classement ex aequo, les statistiques, et propose revanche, annulation ou retour', () => {
    const onRematch = vi.fn();
    const { view, hit, onFinish, onExit } = renderGame([alice, bob], { onRematch });
    fireEvent.click(view.getByTestId('starter-option-0'));
    playAll(hit, 40, ['triple', 'miss', 'miss']);

    const results = view.getByTestId('atc180-results');
    expect(results.getAttribute('data-tie')).toBe('true');
    expect(view.getByText('Vainqueurs ex aequo')).toBeTruthy();
    expect(view.getByTestId('atc180-rank-alice').getAttribute('data-rank')).toBe('1');
    expect(view.getByTestId('atc180-rank-bob').getAttribute('data-winner')).toBe('true');
    expect(view.getByTestId('atc180-rank-alice').textContent).toContain('33 %');
    expect(view.getByTestId('atc180-rounds-alice').querySelectorAll('[data-points="3"]')).toHaveLength(20);
    expect(onFinish).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ winnerIds: ['alice', 'bob'] }));

    fireEvent.click(view.getByTestId('atc180-rematch'));
    expect(onRematch).toHaveBeenCalledOnce();
    fireEvent.click(view.getByTestId('atc180-results-exit'));
    expect(onExit).toHaveBeenCalledOnce();

    fireEvent.click(view.getByTestId('atc180-results-undo'));
    expect(view.queryByTestId('atc180-results')).toBeNull();
    expect(view.getByTestId('atc180-target').textContent).toBe('20');
    expect(view.getByTestId('atc180-volley').getAttribute('data-darts')).toBe('2');
  });

  it('démarre seul sans « Qui commence ? » et conclut l’entraînement avec un repère de niveau', () => {
    const { view, hit, onFinish } = renderGame([alice]);
    expect(view.queryByRole('dialog', { name: 'Qui commence ?' })).toBeNull();
    playAll(hit, 20, ['triple', 'triple', 'single']);
    expect(view.getByText('Entraînement terminé')).toBeTruthy();
    expect(view.getByTestId('atc180-benchmark').textContent).toContain('confirmé');
    expect(view.getByTestId('atc180-results').getAttribute('data-tie')).toBe('false');
    expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({ winnerIds: ['alice'], ranking: [expect.objectContaining({ total: 140 })] }));
    expect(view.queryByTestId('atc180-rematch')).toBeNull();
  });

  it('ne fait tourner le chronomètre qu’une fois la partie lancée', () => {
    vi.useFakeTimers();
    const { view } = renderGame([alice, bob]);
    act(() => { vi.advanceTimersByTime(3000); });
    expect(view.getByRole('timer').textContent).toBe('00:00');
    fireEvent.click(view.getByTestId('starter-option-0'));
    act(() => { vi.advanceTimersByTime(2000); });
    expect(view.getByRole('timer').textContent).toBe('00:02');
  });

  it('demande confirmation avant de quitter une partie en cours', () => {
    const { view, onExit } = renderGame([alice]);
    fireEvent.click(view.getByRole('button', { name: 'Quitter' }));
    expect(onExit).not.toHaveBeenCalled();
    fireEvent.click(view.getByRole('button', { name: 'Oui' }));
    expect(onExit).toHaveBeenCalledOnce();
  });
});

describe('Atc180GameView — reprise après rechargement (spec 010)', () => {
  it('reprend le tour, le joueur courant, la volée en cours et l’annulation', () => {
    const first = renderGame([alice, bob]);
    fireEvent.click(first.view.getByTestId('starter-option-1'));
    first.hit('triple', 'triple', 'triple', 'double');
    const snapshot = first.lastSnapshot();
    first.view.unmount();

    const second = renderGame([alice, bob], { restoredState: snapshot });
    expect(second.view.queryByRole('dialog', { name: 'Qui commence ?' })).toBeNull();
    expect(second.view.getByTestId('atc180-player-alice').getAttribute('data-state')).toBe('active');
    expect(second.view.getByTestId('atc180-player-bob').textContent).toContain('9');
    expect(second.view.getByTestId('atc180-volley').getAttribute('data-darts')).toBe('1');
    second.press('Annuler');
    second.press('Annuler');
    expect(second.view.getByTestId('atc180-player-bob').getAttribute('data-state')).toBe('active');
  });

  it('reprend une partie terminée sur son classement sans renvoyer le résultat', () => {
    const first = renderGame([alice]);
    playAll(first.hit, 20, ['miss', 'miss', 'miss']);
    expect(first.onFinish).toHaveBeenCalledOnce();
    const snapshot = first.lastSnapshot();
    expect(snapshot.timing.running).toBe(false);
    first.view.unmount();

    const second = renderGame([alice], { restoredState: snapshot });
    expect(second.view.getByTestId('atc180-results')).toBeTruthy();
    expect(second.view.getByTestId('atc180-benchmark').textContent).toContain('environ 60');
    expect(second.onFinish).not.toHaveBeenCalled();
  });
});
