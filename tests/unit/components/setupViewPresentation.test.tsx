// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';

import { SetupView } from '../../../views/SetupView';
import type { GameType } from '../../../utils/arenaFlow';

// Présentation tablette des pages hors jeu : crochets data-* consommés par src/styles/screens/tablet-pages.css.
afterEach(cleanup);

const renderSetup = (gameType: GameType) => render(<SetupView gameType={gameType} onStart={vi.fn()} onBack={vi.fn()} />);

describe('SetupView — présentation tablette', () => {
  it.each([
    ['X01', 'true'],
    ['CRICKET', 'true'],
    ['CAPITAL', 'false'],
    ['GOTCHA', 'false'],
  ] as const)('%s expose data-setup-options="%s" (deux colonnes seulement avec format/règles)', (gameType, expected) => {
    const view = renderSetup(gameType);
    expect(view.container.querySelector('.setup-main')?.getAttribute('data-setup-options')).toBe(expected);
  });

  it('ouvre les règles dans une modale large et centrée', () => {
    const view = renderSetup('X01');
    fireEvent.click(view.getByRole('button', { name: /Voir les règles/i }));
    const dialog = view.getByRole('dialog');
    expect(dialog.getAttribute('data-modal-size')).toBe('wide');
    expect(dialog.className).toContain('tablet-modal');
    expect(dialog.className).toContain('items-center');
  });

  it('ouvre le score personnalisé dans une modale moyenne et centrée', () => {
    const view = renderSetup('X01');
    fireEvent.click(view.getAllByRole('button', { name: 'Perso' })[0]);
    const dialog = view.getByTestId('custom-score-modal');
    expect(dialog.getAttribute('data-modal-size')).toBe('medium');
    expect(dialog.className).toContain('justify-center');
  });
});
