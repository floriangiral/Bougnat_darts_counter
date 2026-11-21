// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import {
  getEffectiveTheme,
  getThemeMode,
  resetThemeControllerForTests,
  setThemeMode,
  startThemeSync,
} from '../../../src/app/themeController';
import {
  getStatusBarStyle,
  isThemeMode,
  LIGHT_THEME_ENABLED,
  parseThemePreference,
  resolveEffectiveTheme,
  serializeThemePreference,
  THEME_CANVAS_COLORS,
  THEME_STORAGE_KEY,
} from '../../../src/features/theming/themePreference';
import { readThemeMode, writeThemeMode } from '../../../src/infrastructure/local/themePreferenceStore';
import { applyEffectiveTheme, systemPrefersLight, watchSystemTheme } from '../../../src/infrastructure/web/themeDocument';
import { ThemeSelector } from '../../../components/ui/ThemeSelector';

const INDEX_HTML = readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
const INLINE_SCRIPT = /<script>\s*([\s\S]*?)<\/script>/i.exec(INDEX_HTML)?.[1] ?? '';

type Listener = (event: { matches: boolean }) => void;
const stubSystemTheme = (prefersLight: boolean) => {
  const listeners = new Set<Listener>();
  const query = {
    matches: prefersLight,
    addEventListener: (_type: string, listener: Listener) => listeners.add(listener),
    removeEventListener: (_type: string, listener: Listener) => listeners.delete(listener),
  };
  window.matchMedia = vi.fn().mockReturnValue(query);
  return {
    change: (next: boolean) => {
      query.matches = next;
      listeners.forEach((listener) => listener({ matches: next }));
    },
    listeners,
  };
};

const resetHead = () => {
  document.documentElement.removeAttribute('data-theme');
  document.head.innerHTML = `
    <meta name="theme-color" content="#06080d" media="(prefers-color-scheme: dark)" />
    <meta name="theme-color" content="#f5f3ef" media="(prefers-color-scheme: light)" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />`;
};

const runInlineScript = () => {
  // Exécution volontaire du script anti-flash réel de index.html, sans évaluation de code externe.
  const script = document.createElement('script');
  script.textContent = INLINE_SCRIPT;
  document.head.appendChild(script);
  script.remove();
};

const originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia');
const restoreMatchMedia = () => {
  if (originalMatchMedia) Object.defineProperty(window, 'matchMedia', originalMatchMedia);
  else delete (window as { matchMedia?: unknown }).matchMedia;
};

beforeEach(() => {
  window.localStorage.clear();
  resetHead();
  resetThemeControllerForTests();
});

afterEach(() => {
  cleanup();
  restoreMatchMedia();
});

describe('themePreference (fonctions pures)', () => {
  it('résout le thème effectif (table de vérité)', () => {
    expect(resolveEffectiveTheme('system', false)).toBe('dark');
    expect(resolveEffectiveTheme('system', true)).toBe('light');
    expect(resolveEffectiveTheme('dark', true)).toBe('dark');
    expect(resolveEffectiveTheme('light', false)).toBe('light');
    expect(resolveEffectiveTheme('light', true, false)).toBe('dark');
  });

  it('ignore une préférence absente, corrompue ou d’un autre schéma (FR-05)', () => {
    expect(parseThemePreference(null)).toBe('system');
    expect(parseThemePreference('{')).toBe('system');
    expect(parseThemePreference('"light"')).toBe('system');
    expect(parseThemePreference(JSON.stringify({ v: 2, mode: 'light' }))).toBe('system');
    expect(parseThemePreference(JSON.stringify({ v: 1, mode: 'sepia' }))).toBe('system');
    expect(parseThemePreference(serializeThemePreference('light'))).toBe('light');
    expect(isThemeMode('dark')).toBe(true);
    expect(isThemeMode(3)).toBe(false);
  });

  it('adapte la barre d’état iOS au thème', () => {
    expect(getStatusBarStyle('dark')).toBe('black-translucent');
    expect(getStatusBarStyle('light')).toBe('default');
  });
});

describe('script anti-flash de index.html (spec 069 FR-01)', () => {
  it('reste minimal, ES5 et aligné sur le module TypeScript', () => {
    expect(INLINE_SCRIPT.length).toBeLessThan(1024 + 400);
    expect(INLINE_SCRIPT).not.toMatch(/=>|\blet\b|\bconst\b|`/);
    expect(INLINE_SCRIPT).toContain(`'${THEME_STORAGE_KEY}'`);
    expect(INLINE_SCRIPT).toContain(THEME_CANVAS_COLORS.dark);
    expect(INLINE_SCRIPT).toContain(THEME_CANVAS_COLORS.light);
    expect(INLINE_SCRIPT).toContain(`L=${LIGHT_THEME_ENABLED ? 1 : 0}`);
    expect(INDEX_HTML).toContain('<html lang="fr" data-theme="dark">');
    expect(INDEX_HTML).not.toMatch(/<style>/);
  });

  it.each([
    ['préférence absente, système clair', null, true, 'light', '#f5f3ef', 'default'],
    ['préférence absente, système sombre', null, false, 'dark', '#06080d', 'black-translucent'],
    ['sombre forcé, système clair (AC-02)', serializeThemePreference('dark'), true, 'dark', '#06080d', 'black-translucent'],
    ['clair forcé', serializeThemePreference('light'), false, 'light', '#f5f3ef', 'default'],
    ['valeur corrompue (AC-06)', '{oops', true, 'light', '#f5f3ef', 'default'],
  ])('%s', (_label, stored, prefersLight, theme, color, statusBar) => {
    if (stored) window.localStorage.setItem(THEME_STORAGE_KEY, stored);
    stubSystemTheme(prefersLight);
    runInlineScript();
    expect(document.documentElement.getAttribute('data-theme')).toBe(theme);
    const metas = [...document.querySelectorAll('meta[name="theme-color"]')];
    expect(metas.every((meta) => meta.getAttribute('content') === color && !meta.hasAttribute('media'))).toBe(true);
    expect(document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')?.getAttribute('content')).toBe(statusBar);
  });

  it('retombe sur sombre sans matchMedia', () => {
    (window as { matchMedia?: unknown }).matchMedia = undefined;
    runInlineScript();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});

describe('stockage et document', () => {
  it('lit et écrit la préférence sans jamais lever d’erreur', () => {
    writeThemeMode('light');
    expect(readThemeMode()).toBe('light');
    const failing = { getItem: () => { throw new Error('bloqué'); }, setItem: () => { throw new Error('plein'); } };
    expect(readThemeMode(failing)).toBe('system');
    expect(() => writeThemeMode('dark', failing)).not.toThrow();
    expect(readThemeMode(null)).toBe('system');
  });

  it('applique data-theme, theme-color et la barre d’état (FR-04)', () => {
    applyEffectiveTheme(document, 'light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#f5f3ef');
    applyEffectiveTheme(document, 'dark');
    expect(document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')?.getAttribute('content')).toBe('black-translucent');
  });

  it('suit le thème système et tolère son absence', () => {
    const system = stubSystemTheme(false);
    const onChange = vi.fn();
    const stop = watchSystemTheme(window, onChange);
    system.change(true);
    expect(onChange).toHaveBeenCalledWith(true);
    stop();
    expect(system.listeners.size).toBe(0);
    expect(systemPrefersLight(undefined)).toBe(false);
    expect(watchSystemTheme(undefined, onChange)()).toBeUndefined();
    expect(systemPrefersLight({ matchMedia: () => { throw new Error('x'); } })).toBe(false);
  });
});

describe('themeController', () => {
  it('suit le système en mode Auto sans rechargement (AC-03) et persiste un choix manuel (FR-03)', () => {
    const system = stubSystemTheme(false);
    const stop = startThemeSync();
    expect(document.documentElement.dataset.theme).toBe('dark');
    system.change(true);
    expect(document.documentElement.dataset.theme).toBe('light');

    setThemeMode('dark');
    system.change(true);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe(serializeThemePreference('dark'));
    expect(getEffectiveTheme()).toBe('dark');
    stop();

    resetThemeControllerForTests();
    expect(getThemeMode()).toBe('dark');
  });
});

describe('ThemeSelector', () => {
  it('propose Auto / Sombre / Clair et applique le choix immédiatement', () => {
    stubSystemTheme(false);
    const view = render(<ThemeSelector />);
    expect(view.getByTestId('theme-selector')).toBeTruthy();
    const light = view.getByLabelText('Clair') as HTMLInputElement;
    expect((view.getByLabelText('Auto') as HTMLInputElement).checked).toBe(true);
    act(() => light.click());
    expect(light.checked).toBe(true);
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(light.closest('label')?.dataset.state).toBe('checked');
  });
});
