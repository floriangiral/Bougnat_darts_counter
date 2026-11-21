// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, renderHook } from '@testing-library/react';
import { useGameOrientation } from '../../../src/app/useGameOrientation';
import { ORIENTATION_HINT_DISMISS_KEY, resolveOrientationHint } from '../../../src/features/layout/orientationHint';
import { resolveViewportClass, type ViewportClass } from '../../../src/features/layout/viewportClass';
import { OrientationHint } from '../../../components/ui/OrientationHint';

const touch = (width: number, height: number) => resolveViewportClass({ width, height, isTouch: true, accessMode: 'local' });
const pointer = (width: number, height: number) => resolveViewportClass({ width, height, isTouch: false, accessMode: 'local' });

const TABLET_PORTRAIT = touch(810, 1010);
const TABLET_LANDSCAPE = touch(1080, 750);
const PHONE_PORTRAIT = touch(390, 844);
const PHONE_LANDSCAPE = touch(844, 390);

const hint = (viewport: ViewportClass, overrides: Partial<Parameters<typeof resolveOrientationHint>[0]> = {}) =>
  resolveOrientationHint({ viewport, isGameScreen: true, dismissed: false, ...overrides });

describe('resolveOrientationHint (spec 028, décision PO sur la spec 073)', () => {
  it('n’incite jamais à tourner une tablette, dans aucune orientation', () => {
    expect(hint(TABLET_PORTRAIT)).toBeNull();
    expect(hint(TABLET_LANDSCAPE)).toBeNull();
    expect(hint(touch(1024, 1292))).toBeNull();
  });

  it('invite à revenir en portrait sur un téléphone paysage en partie, sans bloquer (option B)', () => {
    expect(hint(PHONE_LANDSCAPE)).toBe('rotate-to-portrait');
    expect(hint(touch(932, 430))).toBe('rotate-to-portrait');
    expect(hint(PHONE_PORTRAIT)).toBeNull();
  });

  it('ne s’affiche ni hors des écrans de jeu, ni sur pointeur fin, ni après « Continuer »', () => {
    expect(hint(PHONE_LANDSCAPE, { isGameScreen: false })).toBeNull();
    expect(hint(PHONE_LANDSCAPE, { dismissed: true })).toBeNull();
    expect(hint(pointer(700, 400))).toBeNull();
    expect(hint(pointer(1536, 620))).toBeNull();
  });
});

describe('useGameOrientation', () => {
  beforeEach(() => window.sessionStorage.clear());
  afterEach(cleanup);

  it('mémorise « Continuer en paysage » pour la partie en cours seulement', () => {
    const { result, rerender } = renderHook((props: { gameId: string }) => useGameOrientation({
      viewport: PHONE_LANDSCAPE,
      isGameScreen: true,
      gameId: props.gameId,
    }), { initialProps: { gameId: 'm1' } });

    expect(result.current.hint).toBe('rotate-to-portrait');
    act(() => result.current.dismiss());
    expect(result.current.hint).toBeNull();
    expect(window.sessionStorage.getItem(ORIENTATION_HINT_DISMISS_KEY)).toBe('m1');

    rerender({ gameId: 'm2' });
    expect(result.current.hint).toBe('rotate-to-portrait');
  });

  it('retrouve le choix après rechargement de la même partie et ignore un écran sans partie', () => {
    window.sessionStorage.setItem(ORIENTATION_HINT_DISMISS_KEY, 'm1');
    const restored = renderHook(() => useGameOrientation({ viewport: PHONE_LANDSCAPE, isGameScreen: true, gameId: 'm1' }));
    expect(restored.result.current.hint).toBeNull();

    const withoutGame = renderHook(() => useGameOrientation({ viewport: PHONE_LANDSCAPE, isGameScreen: true, gameId: null }));
    expect(withoutGame.result.current.hint).toBe('rotate-to-portrait');
    act(() => withoutGame.result.current.dismiss());
    expect(withoutGame.result.current.hint).toBe('rotate-to-portrait');
  });

  it('tolère un stockage de session indisponible', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('bloqué'); });
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('bloqué'); });
    const { result } = renderHook(() => useGameOrientation({ viewport: PHONE_LANDSCAPE, isGameScreen: true, gameId: 'm1' }));
    act(() => result.current.dismiss());
    expect(result.current.hint).toBeNull();
    getItem.mockRestore();
    setItem.mockRestore();
  });
});

describe('OrientationHint', () => {
  afterEach(cleanup);

  it('est non bloquante et fermable au clavier', () => {
    const onDismiss = vi.fn();
    const view = render(<OrientationHint onDismiss={onDismiss} />);
    expect(view.getByRole('status').textContent).toContain('Tourne ton téléphone pour l’affichage portrait');
    view.getByRole('button', { name: 'Continuer en paysage' }).click();
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
