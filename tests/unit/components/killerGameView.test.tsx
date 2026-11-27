// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';

import { KillerGameView } from '../../../views/KillerGameView';
import type { GameConfig, Player } from '../../../types';
import type { KillerRuntimeSnapshot } from '../../../src/shared/session/persistedAppSession';

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

const renderKiller = (onExit = vi.fn()) => {
  const view = render(<KillerGameView players={players} config={config} onExit={onExit} onFinish={vi.fn()} />);
  fireEvent.click(view.getByTestId('throw-order-option-anne'));
  fireEvent.click(view.getByTestId('throw-order-option-bob'));
  fireEvent.click(view.getByTestId('throw-order-confirm'));
  return view;
};

// Spec 072 (FR-05, FR-07) et spec 066 (data-state / data-tone).
describe('KillerGameView — écran à zones', () => {
  it('valide tout l’ordre avant l’attribution des numéros et le conserve à la reprise', () => {
    const onStateChange = vi.fn<(snapshot: KillerRuntimeSnapshot) => void>();
    const view = render(<KillerGameView players={players} config={config} onExit={vi.fn()} onFinish={vi.fn()} onStateChange={onStateChange} />);
    expect(view.getByRole('dialog', { name: 'Ordre de passage' })).toBeTruthy();
    expect(view.getByTestId('throw-order-confirm').hasAttribute('disabled')).toBe(true);
    fireEvent.click(view.getByRole('button', { name: '20' }));
    expect(onStateChange.mock.lastCall![0].state.players.every((player) => player.target === null)).toBe(true);
    expect(onStateChange.mock.lastCall![0].timing.running).toBe(false);
    const pending = onStateChange.mock.lastCall![0];
    cleanup();

    const resumed = render(<KillerGameView players={players} config={config} onExit={vi.fn()} onFinish={vi.fn()} restoredState={pending} onStateChange={onStateChange} />);
    expect(resumed.getByRole('dialog', { name: 'Ordre de passage' })).toBeTruthy();
    fireEvent.click(resumed.getByTestId('throw-order-option-chloe'));
    fireEvent.click(resumed.getByTestId('throw-order-option-anne'));
    fireEvent.click(resumed.getByTestId('throw-order-confirm'));
    ['20', '19', '18'].forEach((name) => fireEvent.click(resumed.getByRole('button', { name })));
    expect(resumed.getByTestId('killer-player-chloe').dataset.state).toBe('active');
    fireEvent.click(resumed.getByRole('button', { name: 'Passer' }));
    expect(resumed.getByTestId('killer-player-anne').dataset.state).toBe('active');
    const snapshot = onStateChange.mock.lastCall![0];
    expect(snapshot.state.players.map((player) => player.id)).toEqual(['chloe', 'anne', 'bob']);
    expect(snapshot.hasGameStarted).toBe(true);
    cleanup();

    const restored = render(<KillerGameView players={players} config={config} onExit={vi.fn()} onFinish={vi.fn()} restoredState={snapshot} />);
    expect(restored.queryByRole('dialog', { name: 'Ordre de passage' })).toBeNull();
    expect(restored.getByTestId('killer-player-anne').dataset.state).toBe('active');
  });

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

  // Tablette portrait : statut du joueur actif et nombre de survivants exposés pour la présentation.
  it('expose le statut Killer du joueur actif et le nombre de doubles à viser', () => {
    const view = renderKiller();
    ['20', '19', '18'].forEach((name) => fireEvent.click(view.getByRole('button', { name })));
    const status = () => view.getByTestId('killer-active-status');
    const targets = () => view.getByRole('group', { name: 'Double touché' });
    expect(status().getAttribute('data-killer')).toBe('false');
    expect(status().textContent).toBe('Pas Killer');
    expect(targets().getAttribute('data-count')).toBe('3');

    fireEvent.click(view.getByRole('button', { name: /Anne.*Double personnel/ }));
    expect(status().getAttribute('data-killer')).toBe('true');
    expect(status().textContent).toBe('Killer');
    const bobDouble = () => fireEvent.click(view.getByRole('button', { name: /Bob.*Double adverse/ }));
    const pass = () => fireEvent.click(view.getByRole('button', { name: 'Passer' }));
    bobDouble();
    bobDouble();
    pass();
    pass();
    bobDouble();
    expect(view.getByTestId('killer-player-bob').getAttribute('data-state')).toBe('eliminated');
    expect(targets().getAttribute('data-count')).toBe('2');
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

// Spec 136 : classement complet au-delà de deux joueurs.
describe('KillerGameView — classement de fin', () => {
  it('affiche le survivant puis les éliminés du dernier au premier', () => {
    const restoredState = {
      gameType: 'KILLER' as const,
      history: [],
      timing: { elapsedSeconds: 60, measuredAt: 0, running: false },
      state: {
        phase: 'FINISHED' as const,
        currentPlayerIndex: 0,
        dartsInTurn: 0,
        winnerId: 'chloe',
        log: [],
        eliminatedIds: ['anne', 'bob'],
        players: [
          { id: 'anne', name: 'Anne', target: 20 as const, lives: 0, isKiller: true, isEliminated: true },
          { id: 'bob', name: 'Bob', target: 19 as const, lives: 0, isKiller: false, isEliminated: true },
          { id: 'chloe', name: 'Chloé', target: 18 as const, lives: 2, isKiller: true, isEliminated: false },
        ],
      },
    };
    const view = render(
      <KillerGameView players={players} config={config} onExit={vi.fn()} onFinish={vi.fn()} restoredState={restoredState} />,
    );

    const rows = within(view.getByTestId('final-ranking')).getAllByRole('listitem');
    expect(rows.map((row) => [row.getAttribute('data-testid'), row.getAttribute('data-rank')])).toEqual([
      ['final-rank-chloe', '1'],
      ['final-rank-bob', '2'],
      ['final-rank-anne', '3'],
    ]);
    expect(rows[0].textContent).toContain('2 vies');
    expect(rows[2].textContent).toContain('Éliminé');
  });
});
