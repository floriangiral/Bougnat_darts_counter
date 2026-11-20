// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';

import { GotchaGameView } from '../../../views/GotchaGameView';
import type { GameConfig, Player } from '../../../types';

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

    press('C');
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
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'Retour au tour précédent : Annuler', 'Valider'],
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
    press('C');
    press('1');
    press('2');
    press('0');
    expect(preview()).toBe('bust');
    expect(view.getByText('Trop !')).toBeTruthy();
    expect(view.getByTestId('gotcha-projected-score').textContent).toBe('0');
    press('C');
    press('1');
    press('0');
    press('0');
    expect(preview()).toBe('win');
  });

  it('demande confirmation avant de quitter', () => {
    const onExit = vi.fn();
    const view = renderGotcha(onExit);
    fireEvent.click(view.getByRole('button', { name: 'Quitter' }));
    expect(onExit).not.toHaveBeenCalled();
    fireEvent.click(view.getByRole('button', { name: 'Oui' }));
    expect(onExit).toHaveBeenCalledOnce();
  });
});
