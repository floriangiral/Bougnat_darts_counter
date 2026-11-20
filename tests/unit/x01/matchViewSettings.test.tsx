// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { resetCounterSettingsForTests } from '../../../src/app/counterSettingsController';
import { createMatch } from '../../../src/application/scoring/matchLifecycle';
import { COUNTER_SETTINGS_STORAGE_KEY, parseCounterSettings } from '../../../src/features/settings/counterSettings';
import type { Player } from '../../../types';
import { MatchView } from '../../../views/MatchView';

const players: Player[] = [
  { id: 'p1', name: 'Alice', teamId: 'team1' },
  { id: 'p2', name: 'Bruno', teamId: 'team2' },
];

const renderMatch = () => render(
  <MatchView
    initialMatch={createMatch(players, {
      startingScore: 170, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS', legsToWin: 1, setsToWin: 1, isDoubles: false, initialStartingPlayerIndex: 0,
    })}
    skipStartingPlayerPrompt
    onFinish={vi.fn()}
    onExit={vi.fn()}
  />,
);

afterEach(() => {
  cleanup();
  resetCounterSettingsForTests();
  localStorage.clear();
});

describe('MatchView — réglages de l’appareil (spec 129)', () => {
  it('starts without finish hints by default, as before', () => {
    renderMatch();
    expect(screen.queryByTestId('checkout-hint')).toBeNull();
  });

  it('reads the saved preferences when the match starts and writes in-match changes back to them', () => {
    localStorage.setItem(COUNTER_SETTINGS_STORAGE_KEY, JSON.stringify({ v: 1, x01: { checkoutHints: true, mobileShortcutsBar: false } }));
    renderMatch();
    expect(screen.getAllByTestId('checkout-hint').length).toBeGreaterThan(0);
    expect(screen.getByTestId('game-screen').querySelector('[data-mobile-shortcuts="true"]')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Configuration|Réglages/ }));
    const dialog = screen.getByRole('dialog', { name: 'Options de jeu' });
    const hints = within(dialog).getByText('Suggestions de finish').parentElement?.parentElement;
    if (!hints) throw new Error('Missing hints option');
    fireEvent.click(within(hints).getByRole('button', { name: 'Actif' }));

    expect(screen.queryByTestId('checkout-hint')).toBeNull();
    expect(parseCounterSettings(localStorage.getItem(COUNTER_SETTINGS_STORAGE_KEY)).x01).toMatchObject({ checkoutHints: false, mobileShortcutsBar: false });
  });
});
