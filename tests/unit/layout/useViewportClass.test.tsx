// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, renderHook } from '@testing-library/react';
import { readViewportClass, useViewport, useViewportClass, ViewportContext } from '../../../src/features/layout/useViewportClass';
import { resolveViewportClass } from '../../../src/features/layout/viewportClass';

const setWindowSize = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
};

const stubMatchMedia = (coarse: boolean) => {
  const listeners = new Set<() => void>();
  const query = {
    matches: coarse,
    addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
  };
  window.matchMedia = vi.fn().mockReturnValue(query) as unknown as typeof window.matchMedia;
  return { query, listeners };
};

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  cleanup();
  window.matchMedia = originalMatchMedia;
  setWindowSize(1024, 768);
});

describe('useViewportClass', () => {
  it('lit la taille de fenêtre et any-pointer: coarse', () => {
    setWindowSize(1080, 750);
    stubMatchMedia(true);
    expect(readViewportClass()).toMatchObject({ recipe: 'arena', layoutMode: 'tablet', input: 'touch' });
  });

  it('considère l’absence de matchMedia comme tactile (§14)', () => {
    setWindowSize(390, 844);
    (window as { matchMedia?: unknown }).matchMedia = undefined;
    expect(readViewportClass()).toMatchObject({ input: 'touch', layoutMode: 'smartphone' });
  });

  it('recalcule la recette à la rotation sans rendu inutile (FR-04)', () => {
    setWindowSize(810, 1010);
    const { listeners } = stubMatchMedia(true);
    const { result } = renderHook(() => useViewportClass());
    expect(result.current.recipe).toBe('stack');

    const before = result.current;
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(result.current).toBe(before);

    setWindowSize(1080, 750);
    act(() => {
      window.dispatchEvent(new Event('orientationchange'));
    });
    expect(result.current.recipe).toBe('arena');

    expect(listeners.size).toBe(1);
  });

  it('expose la classe aux vues par contexte, bureau par défaut hors fournisseur', () => {
    const Probe = () => <span>{useViewport().recipe + ':' + useViewport().layoutMode}</span>;
    expect(render(<Probe />).container.textContent).toBe('arena:default');
    cleanup();
    const phone = resolveViewportClass({ width: 390, height: 844, isTouch: true, accessMode: 'local' });
    const view = render(<ViewportContext.Provider value={phone}><Probe /></ViewportContext.Provider>);
    expect(view.container.textContent).toBe('stack:smartphone');
  });
});
