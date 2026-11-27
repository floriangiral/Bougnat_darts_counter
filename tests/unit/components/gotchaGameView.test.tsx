// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';

import { GotchaGameView } from '../../../views/GotchaGameView';
import type { GameConfig, Player } from '../../../types';
import { createGotchaState, recordGotchaTurn } from '../../../src/domain/gotcha/gotcha';
import { formatDuration } from '../../../src/application/scoring/matchLifecycle';
import { confirmGotchaThrowOrder, continueGotchaForNextPlace } from '../../../src/features/gotcha/gotchaPlacement';
import type { GotchaRuntimeSnapshot } from '../../../src/shared/session/persistedAppSession';

afterEach(cleanup);

const config: GameConfig = {
  startingScore: 301, checkIn: 'Open', checkOut: 'Open', matchMode: 'LEGS',
  setsToWin: 1, legsToWin: 1, isDoubles: false,
};
const players: Player[] = [
  { id: 'alice', name: 'Alice', teamId: 'alice' },
  { id: 'bob', name: 'Bob', teamId: 'bob' },
];

const renderGotcha = (onExit = vi.fn(), startingScore = 301) => render(
  <GotchaGameView players={players} config={{ ...config, startingScore }} onExit={onExit} onFinish={vi.fn()} />,
);

describe('GotchaGameView', () => {
  // Spec ref: specs/054-counter-impossible-totals-validation (FR-02, AC-01, décision Q1 b).
  it('disables validation as soon as an unreachable total is typed, then accepts the correction', () => {
    const view = renderGotcha();
    const press = (name: string) => fireEvent.click(view.getByRole('button', { name }));
    const submit = () => view.getByRole('button', { name: 'Valider' });

    press('1');
    press('7');
    expect(submit().hasAttribute('disabled')).toBe(false);
    expect(view.queryByText(/Score impossible/)).toBeNull();

    press('9');
    expect(submit().hasAttribute('disabled')).toBe(true);
    expect(view.getByText('Score impossible : ce total ne se fait pas en 3 fléchettes.')).toBeTruthy();

    fireEvent.click(submit());
    expect(view.getByRole('heading', { name: 'Alice' })).toBeTruthy();

    press('Annuler');
    press('1');
    press('8');
    press('0');
    expect(submit().hasAttribute('disabled')).toBe(false);
    fireEvent.click(submit());
    expect(view.getByRole('heading', { name: 'Bob' })).toBeTruthy();
  });

  // Spec 072 (FR-05, FR-07) et spec 066 (bust projeté → game-bust, victoire → game-win).
  it('remplit les zones de GameScreenLayout et expose l’état des cartes et de l’aperçu', () => {
    const view = renderGotcha(vi.fn(), 100);
    const screen = view.getByTestId('game-screen');
    expect(screen.getAttribute('data-game')).toBe('gotcha');
    expect(screen.querySelector('[data-zone="header"]')).not.toBeNull();
    const input = screen.querySelector<HTMLElement>('[data-zone="input"]')!;
    expect(within(input).getAllByRole('button').map((button) => button.textContent)).toEqual(
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'Annuler', 'Valider'],
    );
    expect(view.getByTestId('gotcha-player-alice').getAttribute('data-state')).toBe('active');
    expect(view.getByTestId('gotcha-player-bob').getAttribute('data-state')).toBe('idle');

    const press = (name: string) => fireEvent.click(view.getByRole('button', { name }));
    const preview = () => view.getByTestId('gotcha-visit-preview').getAttribute('data-state');
    expect(preview()).toBe('idle');
    press('6');
    press('0');
    press('Valider');
    expect(view.getByTestId('gotcha-player-bob').getAttribute('data-state')).toBe('active');

    press('6');
    press('0');
    expect(preview()).toBe('gotcha');
    expect(view.getByTestId('gotcha-player-alice').getAttribute('data-gotcha-target')).toBe('true');
    press('Annuler');
    press('1');
    press('2');
    press('0');
    expect(preview()).toBe('bust');
    expect(view.getByText('Trop !')).toBeTruthy();
    expect(view.getByTestId('gotcha-projected-score').textContent).toBe('0');
    press('Annuler');
    press('1');
    press('0');
    press('0');
    expect(preview()).toBe('win');
  });

  it('fusionne C et Retour : Annuler efface la saisie, sinon revient au tour précédent', () => {
    const view = renderGotcha(vi.fn(), 100);
    const press = (name: string) => fireEvent.click(view.getByRole('button', { name }));
    const undo = () => view.getByRole('button', { name: 'Annuler' });
    expect(view.queryByRole('button', { name: 'C' })).toBeNull();
    expect(undo().hasAttribute('disabled')).toBe(true);
    press('6');
    expect(undo().dataset.undoIntent).toBe('clear-input');
    press('Annuler');
    expect(view.getByTestId('gotcha-visit-preview').textContent).not.toContain('6');
    expect(undo().hasAttribute('disabled')).toBe(true);
    press('6');
    press('0');
    press('Valider');
    expect(view.getByTestId('gotcha-player-bob').getAttribute('data-state')).toBe('active');
    expect(undo().dataset.undoIntent).toBe('undo-last');
    press('Annuler');
    expect(view.getByTestId('gotcha-player-alice').getAttribute('data-state')).toBe('active');
    expect(undo().hasAttribute('disabled')).toBe(true);
  });

  it('demande confirmation avant de quitter', () => {
    const onExit = vi.fn();
    const view = renderGotcha(onExit);
    fireEvent.click(view.getByRole('button', { name: 'Quitter' }));
    expect(onExit).not.toHaveBeenCalled();
    expect(view.getByRole('dialog', { name: 'Quitter la partie ?' })).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: 'Oui' }));
    expect(onExit).toHaveBeenCalledOnce();
  });

  // Spec 136 : places jouées en Gotcha.
  describe('places jouées (spec 136)', () => {
    const trio: Player[] = [...players, { id: 'carla', name: 'Carla', teamId: 'carla' }];
    const chooseOrder = (view: ReturnType<typeof render>, ids: string[]) => {
      ids.forEach((id) => fireEvent.click(view.getByTestId(`throw-order-option-${id}`)));
      fireEvent.click(view.getByTestId('throw-order-confirm'));
      expect(view.queryByTestId('throw-order-overlay')).toBeNull();
    };

    it('exige l’ordre de passage complet avant de jouer, le suit et ne le redemande pas après rechargement', () => {
      vi.useFakeTimers();
      try {
        const onStateChange = vi.fn<(snapshot: GotchaRuntimeSnapshot) => void>();
        const view = render(
          <GotchaGameView players={trio} config={{ ...config, startingScore: 100 }} onExit={vi.fn()} onFinish={vi.fn()} onStateChange={onStateChange} />,
        );
        expect(view.getByTestId('throw-order-overlay')).toBeTruthy();
        const keypad = within(view.getByTestId('game-screen').querySelector<HTMLElement>('[data-zone="input"]')!);
        fireEvent.click(keypad.getByRole('button', { name: '6' }));
        fireEvent.click(keypad.getByRole('button', { name: 'Valider' }));
        expect(view.getByTestId('gotcha-visit-preview').textContent).not.toContain('6');
        act(() => { vi.advanceTimersByTime(3000); });
        expect(view.getByTestId('game-screen').textContent).toContain(formatDuration(0));
        expect(onStateChange.mock.lastCall?.[0].state.players.every((player) => player.history.length === 0)).toBe(true);
        expect(onStateChange.mock.lastCall?.[0].timing.running).toBe(false);

        chooseOrder(view, ['carla', 'alice']);
        expect(view.getByTestId('gotcha-player-carla').getAttribute('data-state')).toBe('active');
        expect(within(view.getByRole('list')).getAllByRole('listitem').map((item) => item.dataset.testid))
          .toEqual(['gotcha-player-carla', 'gotcha-player-alice', 'gotcha-player-bob']);
        fireEvent.click(view.getByRole('button', { name: '6' }));
        fireEvent.click(view.getByRole('button', { name: '0' }));
        fireEvent.click(view.getByRole('button', { name: 'Valider' }));
        expect(view.getByTestId('gotcha-player-alice').getAttribute('data-state')).toBe('active');

        const saved = onStateChange.mock.lastCall![0];
        view.unmount();
        const reloaded = render(
          <GotchaGameView players={trio} config={{ ...config, startingScore: 100 }} onExit={vi.fn()} onFinish={vi.fn()} restoredState={saved} />,
        );
        expect(reloaded.queryByTestId('throw-order-overlay')).toBeNull();
        expect(reloaded.getByTestId('gotcha-player-alice').getAttribute('data-state')).toBe('active');
        expect(reloaded.getByTestId('gotcha-player-carla').textContent).toContain('60');
      } finally {
        vi.useRealTimers();
      }
    });
    const renderTrio = (onFinish = vi.fn()) => {
      const view = render(
        <GotchaGameView players={trio} config={{ ...config, startingScore: 100 }} onExit={vi.fn()} onFinish={onFinish} />,
      );
      const visit = (...digits: string[]) => {
        digits.forEach((digit) => fireEvent.click(view.getByRole('button', { name: digit })));
        fireEvent.click(view.getByRole('button', { name: 'Valider' }));
      };
      chooseOrder(view, ['alice', 'bob']);
      return { view, visit };
    };

    it('propose la 2e place puis classe au score sur « Terminer la partie »', () => {
      const onFinish = vi.fn();
      const { view, visit } = renderTrio(onFinish);
      visit('1', '0', '0');

      expect(view.getByRole('dialog', { name: 'Alice gagne la partie !' })).toBeTruthy();
      expect(view.getByTestId('placement-play').textContent).toBe('Jouer la 2e place');
      expect(onFinish).not.toHaveBeenCalled();

      fireEvent.click(view.getByRole('button', { name: 'Terminer la partie' }));
      expect(view.getByTestId('gotcha-winner')).toBeTruthy();
      expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({ winnerId: 'alice' }));
      const ranks = ['alice', 'bob', 'carla'].map((id) => view.getByTestId(`final-rank-${id}`).getAttribute('data-rank'));
      expect(ranks).toEqual(['1', '2', '2']);
      expect(view.getByTestId('final-rank-carla').textContent).toContain('0 pts');
    });

    it('reprend la partie sur « Jouer la 2e place » sans redonner la main au classé, et Annuler rouvre le choix', () => {
      const { view, visit } = renderTrio();
      visit('1', '0', '0');
      fireEvent.click(view.getByRole('button', { name: 'Jouer la 2e place' }));

      expect(view.queryByTestId('placement-prompt')).toBeNull();
      const alice = view.getByTestId('gotcha-player-alice');
      expect(alice.getAttribute('data-placed')).toBe('1');
      expect(alice.getAttribute('data-state')).toBe('idle');
      expect(view.getByTestId('gotcha-place-alice').textContent).toBe('1er');
      expect(view.getByTestId('gotcha-player-bob').getAttribute('data-state')).toBe('active');

      visit('5', '0');
      visit('4', '0');
      expect(view.getByTestId('gotcha-player-bob').getAttribute('data-state')).toBe('active');

      fireEvent.click(view.getByRole('button', { name: 'Annuler' }));
      fireEvent.click(view.getByRole('button', { name: 'Annuler' }));
      fireEvent.click(view.getByRole('button', { name: 'Annuler' }));
      expect(view.getByRole('dialog', { name: 'Alice gagne la partie !' })).toBeTruthy();
    });

    it('annule la volée gagnante depuis la fenêtre de choix (RM-09)', () => {
      const { view, visit } = renderTrio();
      visit('1', '0', '0');
      fireEvent.click(view.getByRole('button', { name: 'Annuler le dernier coup' }));

      expect(view.queryByTestId('placement-prompt')).toBeNull();
      expect(view.getByTestId('gotcha-player-alice').getAttribute('data-state')).toBe('active');
      expect(view.getByTestId('gotcha-player-alice').hasAttribute('data-placed')).toBe(false);
    });

    const choosing = recordGotchaTurn(confirmGotchaThrowOrder(createGotchaState(trio, 100), ['alice', 'bob', 'carla']), 100);
    const restore = (state: typeof choosing, onFinish = vi.fn(), onStateChange = vi.fn()) => render(
      <GotchaGameView
        players={trio}
        config={{ ...config, startingScore: 100 }}
        onExit={vi.fn()}
        onFinish={onFinish}
        onStateChange={onStateChange}
        restoredState={{ gameType: 'GOTCHA', state, history: [], timing: { elapsedSeconds: 10, measuredAt: 0, running: true } }}
      />,
    );

    it('reprend une session en attente du choix puis continue', () => {
      const onFinish = vi.fn();
      const view = restore(choosing, onFinish);

      expect(view.getByRole('dialog', { name: 'Alice gagne la partie !' })).toBeTruthy();
      fireEvent.click(view.getByRole('button', { name: 'Jouer la 2e place' }));
      expect(view.getByTestId('gotcha-player-bob').getAttribute('data-state')).toBe('active');
      expect(view.getByTestId('gotcha-player-alice').getAttribute('data-placed')).toBe('1');
      expect(onFinish).not.toHaveBeenCalled();
    });

    it('ne traite pas winnerId comme une fin pendant les places : chrono actif, aucun report', () => {
      vi.useFakeTimers();
      try {
        const onFinish = vi.fn();
        const onStateChange = vi.fn<(state: GotchaRuntimeSnapshot) => void>();
        const view = restore(continueGotchaForNextPlace(choosing), onFinish, onStateChange);

        expect(view.queryByTestId('gotcha-winner')).toBeNull();
        expect(view.queryByTestId('placement-prompt')).toBeNull();
        expect(onStateChange.mock.lastCall?.[0].timing.running).toBe(true);
        act(() => { vi.advanceTimersByTime(2000); });
        expect(view.getByTestId('game-screen').textContent).toContain(formatDuration(12));
        expect(onFinish).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });
});
});
