// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';

import { FitText } from '../../../components/ui/FitText';
import { computeFitTextLayout, resolveMaxFontPx } from '../../../components/ui/fitTextLayout';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// jsdom ne fait pas de mise en page : largeur du texte = nombre de caractères × ratio × taille de la case.
const mockTextWidth = (emPerChar = 0.6) =>
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const fontPx = Number.parseFloat(this.parentElement?.style.fontSize ?? '') || 16;
    return { width: (this.textContent ?? '').length * emPerChar * fontPx } as DOMRect;
  });

const setWidth = (element: HTMLElement, width: number) =>
  Object.defineProperty(element, 'clientWidth', { configurable: true, value: width });

const resize = () => {
  act(() => {
    fireEvent(window, new Event('resize'));
  });
};

describe('computeFitTextLayout', () => {
  const base = { naturalWidth: 200, referenceFontPx: 40, maxFontPx: 40, minFontPx: 14 };

  it('keeps the design size when the name already fits', () => {
    expect(computeFitTextLayout({ ...base, availableWidth: 400 })).toEqual({ mode: 'fit', fontPx: 40 });
  });

  it('shrinks proportionally to the measured room, rounded down to the half pixel', () => {
    // (151 − 1) / 200 × 40 = 30
    expect(computeFitTextLayout({ ...base, availableWidth: 151 })).toEqual({ mode: 'fit', fontPx: 30 });
    // (100 − 1) / 200 × 40 = 19,8 → 19,5
    expect(computeFitTextLayout({ ...base, availableWidth: 100 })).toEqual({ mode: 'fit', fontPx: 19.5 });
  });

  it('wraps on two lines at the readable minimum instead of truncating', () => {
    expect(computeFitTextLayout({ ...base, availableWidth: 60 })).toEqual({ mode: 'wrap', fontPx: 14 });
  });

  it('never sets a minimum above the design maximum', () => {
    expect(computeFitTextLayout({ ...base, maxFontPx: 12, referenceFontPx: 12, availableWidth: 400 })).toEqual({ mode: 'fit', fontPx: 12 });
    expect(computeFitTextLayout({ ...base, maxFontPx: 12, referenceFontPx: 12, availableWidth: 20 })).toEqual({ mode: 'wrap', fontPx: 12 });
  });

  it('falls back to the maximum without measure (hidden box, no layout engine)', () => {
    expect(computeFitTextLayout({ ...base, availableWidth: 0 })).toEqual({ mode: 'auto', fontPx: 40 });
    expect(computeFitTextLayout({ ...base, naturalWidth: 0, availableWidth: 100 })).toEqual({ mode: 'auto', fontPx: 40 });
    expect(computeFitTextLayout({ ...base, maxFontPx: Number.NaN, availableWidth: 100 })).toEqual({ mode: 'auto', fontPx: null });
  });

  it('resolves the smallest known cap', () => {
    expect(resolveMaxFontPx(44, 20)).toBe(20);
    expect(resolveMaxFontPx(undefined, 0, null)).toBeNaN();
  });
});

describe('FitText', () => {
  it('fits the name to the measured width, under the CSS variable cap', () => {
    mockTextWidth();
    vi.stubGlobal('ResizeObserver', undefined);
    const view = render(<FitText maxFontPx={44} className="player-name">Jean-Baptiste</FitText>);
    const box = view.container.firstElementChild as HTMLElement;
    expect(box.dataset.fit).toBe('auto');
    expect(box.style.fontSize).toBe('44px');

    setWidth(box, 300);
    resize();
    expect(box.dataset.fit).toBe('fit');
    expect(box.style.fontSize).toBe('38px');

    box.style.setProperty('--fit-max', '20px');
    resize();
    expect(box.style.fontSize).toBe('20px');
    expect(box.style.whiteSpace).toBe('nowrap');
  });

  it('re-measures when the text changes and wraps 20-character names at 320 px', () => {
    mockTextWidth();
    vi.stubGlobal('ResizeObserver', undefined);
    const view = render(<FitText as="h2" maxFontPx={48} minFontPx={16}>Alice</FitText>);
    const box = view.container.firstElementChild as HTMLElement;
    expect(box.tagName).toBe('H2');
    setWidth(box, 140);
    resize();
    expect(box.style.fontSize).toBe('46px');

    view.rerender(<FitText as="h2" maxFontPx={48} minFontPx={16}>Alexandre / Jean-Baptiste</FitText>);
    expect(box.dataset.fit).toBe('wrap');
    expect(box.style.fontSize).toBe('16px');
    expect(box.style.textWrap).toBe('balance');
    expect(box.style.overflowWrap).toBe('anywhere');
    expect(box.textContent).toBe('Alexandre / Jean-Baptiste');
  });

  it('refines the size when glyphs do not scale linearly', () => {
    let calls = 0;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      calls += 1;
      const fontPx = Number.parseFloat(this.parentElement?.style.fontSize ?? '') || 16;
      // Première mesure sous-estimée : la vérification à la taille retenue la corrige.
      return { width: (calls === 1 ? 5 : 6) * fontPx } as DOMRect;
    });
    vi.stubGlobal('ResizeObserver', undefined);
    const view = render(<FitText maxFontPx={40}>Bougnat</FitText>);
    const box = view.container.firstElementChild as HTMLElement;
    calls = 0;
    setWidth(box, 121);
    resize();
    expect(Number.parseFloat(box.style.fontSize) * 6).toBeLessThanOrEqual(120);
  });

  it('ignores the scale of a transformed ancestor (zoom-in animation)', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.dataset.fit !== undefined) return { width: 150 } as DOMRect;
      const fontPx = Number.parseFloat(this.parentElement?.style.fontSize ?? '') || 16;
      return { width: (this.textContent ?? '').length * 0.6 * fontPx * 0.5 } as DOMRect;
    });
    vi.stubGlobal('ResizeObserver', undefined);
    const view = render(<FitText maxFontPx={44}>Jean-Baptiste</FitText>);
    const box = view.container.firstElementChild as HTMLElement;
    setWidth(box, 300);
    Object.defineProperty(box, 'offsetWidth', { configurable: true, value: 300 });
    resize();
    expect(box.style.fontSize).toBe('38px');
  });

  it('only re-measures on width changes from ResizeObserver and stops observing on unmount', () => {
    const spy = mockTextWidth();
    const disconnect = vi.fn();
    let notify: (() => void) | undefined;
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: () => void) {
        notify = callback;
      }
      observe = vi.fn();
      disconnect = disconnect;
    });
    const view = render(<FitText maxFontPx={30}>Zoé</FitText>);
    const box = view.container.firstElementChild as HTMLElement;
    setWidth(box, 200);
    act(() => notify?.());
    expect(box.style.fontSize).toBe('30px');
    const measures = spy.mock.calls.length;
    act(() => notify?.());
    expect(spy.mock.calls.length).toBe(measures);
    view.unmount();
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
