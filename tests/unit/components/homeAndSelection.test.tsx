// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { HomeView } from '../../../views/HomeView';
import { GameSelectionView } from '../../../views/GameSelectionView';
import { env } from '../../../src/lib/env';
import { version } from '../../../package.json';
import { resetThemeControllerForTests } from '../../../src/app/themeController';

vi.mock('../../../src/lib/env', () => ({
  env: { VITE_APP_URL: 'https://darts.example/', VITE_APP_ENV: 'staging', VITE_APP_VERSION: 'abcdef12345' },
}));
vi.mock('../../../components/ui/InstallAppButton', () => ({ InstallAppButton: () => null }));
vi.mock('../../../components/ui/ChangelogModal', () => ({
  ChangelogModal: ({ onClose }: { onClose: () => void }) => <button onClick={onClose}>Close release notes</button>,
}));

beforeEach(() => {
  env.VITE_APP_URL = 'https://darts.example/';
  env.VITE_APP_ENV = 'staging';
  env.VITE_APP_VERSION = 'abcdef12345';
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  resetThemeControllerForTests();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe('HomeView', () => {
  it('displays the package release version on the home page', () => {
    vi.stubGlobal('__APP_SEMVER__', version);
    const view = render(<HomeView onQuickGame={vi.fn()} onOpenSettings={vi.fn()} />);
    expect(view.getByRole('button', { name: `v${version} · build abcdef1 (Nouveautés)` })).toBeTruthy();
  });

  it('starts a game, exposes repository and release notes, and normalizes deployment labels', () => {
    vi.stubGlobal('__APP_SEMVER__', '1.2.3');
    const onQuickGame = vi.fn();
    const view = render(<HomeView onQuickGame={onQuickGame} onOpenSettings={vi.fn()} />);
    expect(view.getByText('PREPROD')).toBeTruthy();
    expect(view.getByRole('link', { name: 'Ouvrir le repository GitHub' }).getAttribute('href')).toBe('https://github.com/floriangiral/Bougnat_darts_counter');
    fireEvent.click(view.getByRole('button', { name: 'Lancer une partie' }));
    expect(onQuickGame).toHaveBeenCalledOnce();
    fireEvent.click(view.getByRole('button', { name: 'v1.2.3 · build abcdef1 (Nouveautés)' }));
    fireEvent.click(view.getByRole('button', { name: 'Close release notes' }));
    expect(view.queryByRole('button', { name: 'Close release notes' })).toBeNull();
    env.VITE_APP_ENV = 'development';
    env.VITE_APP_VERSION = 'dev';
    vi.stubGlobal('__APP_SEMVER__', '');
    view.rerender(<HomeView onQuickGame={onQuickGame} onOpenSettings={vi.fn()} />);
    expect(view.getByText('DEV')).toBeTruthy();
    expect(view.getByRole('button', { name: 'vdev (Nouveautés)' })).toBeTruthy();
    env.VITE_APP_ENV = 'production';
    view.rerender(<HomeView onQuickGame={onQuickGame} onOpenSettings={vi.fn()} />);
    expect(view.queryByText('DEV')).toBeNull();
  });

  it('shares the normalized app URL, copies or opens it, and restores scrolling on close', async () => {
    vi.stubGlobal('__APP_SEMVER__', '1.2.3');
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    document.body.style.overflow = 'auto';
    const view = render(<HomeView onQuickGame={vi.fn()} onOpenSettings={vi.fn()} />);
    fireEvent.click(view.getByRole('button', { name: "Partager L'App" }));
    expect(document.body.style.overflow).toBe('hidden');
    expect(view.getByRole('img').getAttribute('src')).toBe('/app-qr.svg?appUrl=https%3A%2F%2Fdarts.example');
    fireEvent.click(view.getByRole('button', { name: 'Copier Le Lien' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('https://darts.example'));
    writeText.mockRejectedValueOnce(new Error('Clipboard unavailable'));
    fireEvent.click(view.getByRole('button', { name: 'Copier Le Lien' }));
    await waitFor(() => expect(open).toHaveBeenCalledWith('https://darts.example', '_blank', 'noopener,noreferrer'));
    fireEvent.click(view.getByRole('button', { name: 'Ouvrir' }));
    expect(open).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(view.getByRole('dialog')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(view.queryByRole('dialog')).toBeNull();
    expect(document.body.style.overflow).toBe('auto');
    fireEvent.click(view.getByRole('button', { name: "Partager L'App" }));
    fireEvent.click(view.getByRole('button', { name: 'Fermer le partage' }));
    expect(view.queryByRole('dialog')).toBeNull();
    fireEvent.click(view.getByRole('button', { name: "Partager L'App" }));
    fireEvent.click(view.getByRole('button', { name: 'Fermer' }));
    expect(view.queryByRole('dialog')).toBeNull();
    document.body.style.overflow = '';
  });

  it('falls back to the current origin and focuses the share close button', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('__APP_SEMVER__', '1.2.3');
    env.VITE_APP_URL = '';
    const view = render(<HomeView onQuickGame={vi.fn()} onOpenSettings={vi.fn()} />);
    fireEvent.click(view.getByRole('button', { name: "Partager L'App" }));
    await act(() => Promise.resolve().then(() => { vi.runOnlyPendingTimers(); }));
    expect(document.activeElement).toBe(view.getByRole('button', { name: 'Fermer' }));
    expect(view.getByRole('link', { name: window.location.origin }).getAttribute('href')).toBe(window.location.origin);
    view.unmount();
    expect(document.body.style.overflow).toBe('');
    env.VITE_APP_URL = 'https://darts.example/';
  });
});

describe('HomeView settings entry (spec 129)', () => {
  it('opens the Réglages screen from a single gear and keeps the theme selector out of the home page', () => {
    vi.stubGlobal('__APP_SEMVER__', '1.2.3');
    const onQuickGame = vi.fn();
    const onOpenSettings = vi.fn();
    const view = render(<HomeView onQuickGame={onQuickGame} onOpenSettings={onOpenSettings} />);
    expect(view.queryByTestId('theme-selector')).toBeNull();
    expect(view.queryByRole('radio')).toBeNull();
    const gear = view.getByTestId('home-settings');
    expect(view.getByRole('button', { name: 'Réglages' })).toBe(gear);
    fireEvent.click(gear);
    expect(onOpenSettings).toHaveBeenCalledOnce();
    // Le parcours de base reste direct : la roue crantée n'ajoute aucune étape.
    fireEvent.click(view.getByRole('button', { name: 'Lancer une partie' }));
    expect(onQuickGame).toHaveBeenCalledOnce();
  });
});

describe('GameSelectionView', () => {
  const GAME_ORDER = ['X01', 'TRIATHLON', 'CRICKET', 'CAPITAL', 'GOTCHA', 'KILLER', 'ATC180'];

  it('keeps the game order and navigates to every game or back home', () => {
    const onSelect = vi.fn();
    const onBack = vi.fn();
    const view = render(<GameSelectionView onSelect={onSelect} onBack={onBack} />);
    expect(view.getAllByRole('heading', { level: 3 }).map((node) => node.textContent)).toEqual([
      'Match X01', 'Triathlon', 'Cricket', 'Capital', 'Gotcha', 'Killer', '180 Around the Clock',
    ]);
    for (const game of GAME_ORDER) {
      fireEvent.click(view.getByTestId(`game-card-${game.toLowerCase()}`));
      expect(onSelect).toHaveBeenLastCalledWith(game);
    }
    fireEvent.click(view.getByRole('button', { name: 'Accueil' }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('features X01 and tags each card with its game identity', () => {
    const view = render(<GameSelectionView onSelect={vi.fn()} onBack={vi.fn()} />);
    expect(view.getByTestId('game-card-killer').dataset.game).toBe('killer');
    expect(view.getByTestId('game-card-atc180').dataset.game).toBe('atc180');
    const featured = GAME_ORDER.filter((game) => view.getByTestId(`game-card-${game.toLowerCase()}`).dataset.featured === 'true');
    expect(featured).toEqual(['X01']);
  });

  it('names each card by its title and describes it with its rule and its markers', () => {
    const view = render(<GameSelectionView onSelect={vi.fn()} onBack={vi.fn()} />);
    const x01 = view.getByRole('button', { name: 'Match X01' });
    expect(x01).toBe(view.getByTestId('game-card-x01'));
    expect(x01.getAttribute('aria-describedby')?.split(' ').map((id) => document.getElementById(id)?.textContent)).toEqual([
      '301, 501, 701 ou sur mesure',
      '1 à 4 joueurs2 contre 2Robot',
    ]);
  });

  it('derives the player markers from the setup options of each game', () => {
    const view = render(<GameSelectionView onSelect={vi.fn()} onBack={vi.fn()} />);
    const tagsOf = (game: string) => Object.fromEntries(
      Array.from(view.getByTestId(`game-card-${game}`).querySelectorAll<HTMLElement>('[data-tag]'))
        .map((tag) => [tag.dataset.tag ?? '', tag.textContent] as const),
    );
    expect(tagsOf('x01')).toEqual({ players: '1 à 4 joueurs', doubles: '2 contre 2', bot: 'Robot' });
    expect(tagsOf('triathlon')).toEqual({ players: '2 joueurs', doubles: '2 contre 2', fact: '3 épreuves' });
    expect(tagsOf('cricket')).toEqual({ players: '2 ou 3 joueurs', doubles: '2 contre 2', fact: '7 cibles' });
    expect(tagsOf('capital')).toEqual({ players: '1 à 4 joueurs', fact: '17 objectifs' });
    expect(tagsOf('gotcha')).toEqual({ players: '2 à 6 joueurs', fact: 'Cible au choix' });
    expect(tagsOf('killer')).toEqual({ players: '2 à 6 joueurs', fact: '3 vies' });
    expect(tagsOf('atc180')).toEqual({ players: '1 à 4 joueurs', fact: '180 points max' });
  });
});
