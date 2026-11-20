// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';

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

const renderGotcha = () => render(
  <GotchaGameView players={players} config={config} onExit={vi.fn()} onFinish={vi.fn()} />,
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
});
