// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { SettingsView } from '../../../views/SettingsView';
import { env } from '../../../src/lib/env';
import { resetCounterSettingsForTests } from '../../../src/app/counterSettingsController';
import { resetThemeControllerForTests } from '../../../src/app/themeController';
import { COUNTER_SETTINGS_STORAGE_KEY, parseCounterSettings } from '../../../src/features/settings/counterSettings';

vi.mock('../../../src/lib/env', () => ({ env: { VITE_ENABLE_VOICE_SCORING: true } }));

afterEach(() => {
  cleanup();
  resetCounterSettingsForTests();
  resetThemeControllerForTests();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  env.VITE_ENABLE_VOICE_SCORING = true;
});

const storedX01 = () => parseCounterSettings(localStorage.getItem(COUNTER_SETTINGS_STORAGE_KEY)).x01;

describe('SettingsView (spec 129)', () => {
  it('shows the appearance, X01 and other games sections and goes back home', () => {
    const onBack = vi.fn();
    const view = render(<SettingsView onBack={onBack} />);
    expect(view.getByRole('heading', { level: 1, name: 'Réglages' })).toBeTruthy();
    ['Apparence', 'X01 · Aides de jeu', 'X01 · Raccourcis', 'Autres jeux'].forEach((name) => {
      expect(view.getByRole('region', { name })).toBeTruthy();
    });
    expect(within(view.getByTestId('settings-section-appearance')).getByTestId('theme-selector')).toBeTruthy();
    expect(view.getAllByRole('switch').map((node) => node.getAttribute('aria-checked'))).toEqual(['false', 'true', 'true']);
    const backButtons = view.getAllByRole('button', { name: 'Retour à l’accueil' });
    expect(backButtons[0]).toBe(view.getByTestId('settings-back'));
    backButtons.forEach((button) => fireEvent.click(button));
    expect(onBack).toHaveBeenCalledTimes(2);
  });

  it('persists every X01 option and applies the theme immediately', () => {
    const view = render(<SettingsView onBack={vi.fn()} />);
    const hints = view.getByRole('switch', { name: 'Suggestions de finish' });
    fireEvent.click(hints);
    expect(hints.getAttribute('aria-checked')).toBe('true');
    expect(hints.dataset.state).toBe('on');
    fireEvent.click(view.getByRole('switch', { name: 'Assistance vocale IA' }));
    fireEvent.click(view.getByRole('switch', { name: 'Barre de raccourcis (téléphone)' }));
    expect(storedX01()).toMatchObject({ checkoutHints: true, voiceAssist: false, mobileShortcutsBar: false });

    const left = view.getByRole('textbox', { name: 'Colonne gauche 1' });
    fireEvent.change(left, { target: { value: '180' } });
    const mobile = view.getByRole('textbox', { name: 'Scores de la barre 6' });
    fireEvent.change(mobile, { target: { value: '179' } });
    fireEvent.blur(mobile);
    expect((mobile as HTMLInputElement).value).toBe('140');
    expect(storedX01().shortcuts).toMatchObject({ left: [180, 45, 60, 100], mobile: [45, 60, 100, 81, 85, 140] });

    fireEvent.click(view.getByRole('radio', { name: 'Clair' }));
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('reads saved preferences and hides the voice option when voice scoring is unavailable', () => {
    env.VITE_ENABLE_VOICE_SCORING = false;
    localStorage.setItem(COUNTER_SETTINGS_STORAGE_KEY, JSON.stringify({ v: 1, x01: { checkoutHints: true, shortcuts: { right: [1, 2, 3, 4] } } }));
    const view = render(<SettingsView onBack={vi.fn()} />);
    expect(view.queryByRole('switch', { name: 'Assistance vocale IA' })).toBeNull();
    expect(view.getByRole('switch', { name: 'Suggestions de finish' }).getAttribute('aria-checked')).toBe('true');
    expect((view.getByRole('textbox', { name: 'Colonne droite 4' }) as HTMLInputElement).value).toBe('4');
  });
});
