// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';

import { KillerGameView } from '../../../views/KillerGameView';
import type { GameConfig, Player } from '../../../types';

afterEach(cleanup);

const config: GameConfig = {
  startingScore: 301, checkIn: 'Open', checkOut: 'Open', matchMode: 'LEGS',
  setsToWin: 1, legsToWin: 1, isDoubles: false,
};
const players: Player[] = [
  { id: 'anne', name: 'Anne', teamId: 'anne' },
  { id: 'bob', name: 'Bob', teamId: 'bob' },
  { id: 'chloe', name: 'Chloé', teamId: 'chloe' },
];

const renderKiller = (onExit = vi.fn()) => render(
  <KillerGameView players={players} config={config} onExit={onExit} onFinish={vi.fn()} />,
);

// Spec 072 (FR-05, FR-07) et spec 066 (data-state / data-tone).
describe('KillerGameView — écran à zones', () => {
  it('remplit les zones de GameScreenLayout avec les 21 numéros, Bull en ton bull', () => {
    const view = renderKiller();
    const screen = view.getByTestId('game-screen');
    expect(screen.getAttribute('data-game')).toBe('killer');
    expect(screen.querySelector('[data-zone="header"]')).not.toBeNull();
    expect(screen.querySelector('[data-zone="players"]')?.getAttribute('data-phase')).toBe('ASSIGN_TARGETS');
    const input = screen.querySelector<HTMLElement>('[data-zone="input"]')!;
    const keys = within(within(input).getByRole('group', { name: 'Numéro touché' })).getAllByRole('button');
    expect(keys).toHaveLength(21);
    expect(keys[20].textContent).toBe('Bull');
    expect(keys[20].getAttribute('data-tone')).toBe('bull');
    expect(keys[0].getAttribute('data-tone')).toBe('neutral');
    expect(view.getByTestId('killer-player-anne').getAttribute('data-state')).toBe('active');
    expect(view.getByTestId('killer-player-bob').getAttribute('data-state')).toBe('idle');
  });

  it('marque les numéros pris, puis expose les doubles en ton double et les états des cartes', () => {
    const view = renderKiller();
    const press = (name: string | RegExp) => fireEvent.click(view.getByRole('button', { name }));
    press('20');
    const taken = view.getByRole('button', { name: '20' });
    expect(taken.getAttribute('data-state')).toBe('taken');
    expect(taken.hasAttribute('disabled')).toBe(true);
    expect(view.getByTestId('killer-player-bob').getAttribute('data-state')).toBe('active');
    press('19');
    press('18');

    const own = view.getByRole('button', { name: /Anne.*Double personnel/ });
    expect(own.getAttribute('data-tone')).toBe('double');
    expect(own.getAttribute('data-multiplier')).toBe('2');
    expect(own.getAttribute('data-state')).toBe('own');
    const bobDouble = () => fireEvent.click(view.getByRole('button', { name: /Bob.*Double adverse/ }));

    fireEvent.click(own);
    expect(view.getByTestId('killer-player-anne').getAttribute('data-killer')).toBe('true');
    bobDouble();
    bobDouble();
    press('Passer');
    press('Passer');
    bobDouble();

    const bob = view.getByTestId('killer-player-bob');
    expect(bob.getAttribute('data-state')).toBe('eliminated');
    expect(bob.textContent).toContain('(éliminé)');
    expect(view.queryByRole('button', { name: /Bob.*Double adverse/ })).toBeNull();
    expect(view.getByTestId('killer-active-player').textContent).toContain('Anne joue');
  });

  it('met Annuler et Passer côte à côte et confirme avant de quitter', () => {
    const onExit = vi.fn();
    const view = renderKiller(onExit);
    ['20', '19', '18'].forEach((name) => fireEvent.click(view.getByRole('button', { name })));
    const actions = view.getByRole('button', { name: /Annuler/ }).parentElement!;
    expect(within(actions).getAllByRole('button').map((button) => button.textContent)).toEqual(['Annuler', 'Passer']);

    fireEvent.click(view.getByRole('button', { name: 'Quitter' }));
    expect(onExit).not.toHaveBeenCalled();
    fireEvent.click(view.getByRole('button', { name: 'Non' }));
    expect(view.queryByRole('button', { name: 'Oui' })).toBeNull();
    fireEvent.click(view.getByRole('button', { name: 'Quitter' }));
    fireEvent.click(view.getByRole('button', { name: 'Oui' }));
    expect(onExit).toHaveBeenCalledOnce();
  });
});
