// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { resetCounterSettingsForTests } from '../../../src/app/counterSettingsController';
import { createMatch } from '../../../src/application/scoring/matchLifecycle';
import { COUNTER_SETTINGS_STORAGE_KEY, parseCounterSettings } from '../../../src/features/settings/counterSettings';
import { ViewportContext } from '../../../src/features/layout/useViewportClass';
import { resolveViewportClass, type ViewportClass } from '../../../src/features/layout/viewportClass';
import type { Player } from '../../../types';
import { MatchView } from '../../../views/MatchView';

const players: Player[] = [
  { id: 'p1', name: 'Alice', teamId: 'team1' },
  { id: 'p2', name: 'Bruno', teamId: 'team2' },
];

const renderMatch = (viewport?: ViewportClass) => {
  const match = <MatchView
    initialMatch={createMatch(players, {
      startingScore: 170, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS', legsToWin: 1, setsToWin: 1, isDoubles: false, initialStartingPlayerIndex: 0,
    })}
    skipStartingPlayerPrompt
    onFinish={vi.fn()}
    onExit={vi.fn()}
  />;
  return render(viewport ? <ViewportContext.Provider value={viewport}>{match}</ViewportContext.Provider> : match);
};

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

  it.each([
    { width: 610, height: 1000, columns: 8 },
    { width: 810, height: 1080, columns: 8 },
    { width: 1080, height: 810, columns: 4 },
  ])('aligne les options sur le pavé tablette à $width × $height et conserve la validation', ({ width, height, columns }) => {
    renderMatch(resolveViewportClass({ width, height, isTouch: true, accessMode: 'local' }));
    fireEvent.click(screen.getByRole('button', { name: /Configuration|Réglages/ }));
    const dialog = within(screen.getByRole('dialog', { name: 'Options de jeu' }));
    const inputs = dialog.getAllByRole<HTMLInputElement>('textbox');
    const keypadButtons = () => within(screen.getByTestId('x01-keypad-shortcuts')).getAllByRole('button');
    expect(inputs.map((input) => input.value)).toEqual(keypadButtons().map((button) => button.textContent));
    expect(inputs.map((input) => input.dataset.tone)).toEqual(keypadButtons().map((button) => button.dataset.tone));
    expect(inputs[0].parentElement?.style.gridTemplateColumns).toBe(`repeat(${columns}, minmax(3rem, 1fr))`);
    expect(dialog.queryByText(/Colonne gauche|Colonne droite/)).toBeNull();
    expect(dialog.queryByTestId('toggle-mobile-shortcuts')).toBeNull();

    const shortcut = dialog.getByRole<HTMLInputElement>('textbox', { name: 'Raccourci 6' });
    fireEvent.change(shortcut, { target: { value: '57' } });
    fireEvent.blur(shortcut);
    expect(parseCounterSettings(localStorage.getItem(COUNTER_SETTINGS_STORAGE_KEY)).x01.shortcuts.right[1]).toBe(57);
    fireEvent.change(shortcut, { target: { value: '179' } });
    fireEvent.blur(shortcut);
    expect(shortcut.value).toBe('57');
    expect(keypadButtons().map((button) => button.textContent)).toEqual(inputs.map((input) => input.value));
  });
});
