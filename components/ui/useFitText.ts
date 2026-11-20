import React from 'react';
import {
  computeFitTextLayout,
  DEFAULT_FIT_MIN_FONT_PX,
  FIT_SAFETY_PX,
  resolveMaxFontPx,
  type FitTextLayout,
} from './fitTextLayout';

// Mesure et ajustement d'un nom de joueur ou d'équipe (voir FitText) : la taille suit la place réellement
// mesurée, entre le plafond (taille prévue par le style de l'écran, la prop maxFontPx ou la variable
// CSS maxFontVar) et un plancher lisible ; en dessous du plancher, le nom passe sur deux lignes
// équilibrées, jamais d'ellipse.

export type FitTextMaxFont = number | ((element: HTMLElement) => number);

export interface FitTextOptions {
  /** Plafond en px (ou fonction lue à chaque mesure) ; à défaut, la taille de police calculée par le CSS. */
  maxFontPx?: FitTextMaxFont;
  /** Variable CSS (héritée) qui plafonne aussi la taille, en px. */
  maxFontVar?: string;
  minFontPx?: number;
  /** Classes de la case : un changement relance la mesure (le plafond peut venir du CSS). */
  className?: string;
}

const MAX_REFINEMENTS = 3;

const px = (value: string) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** Largeur du texte en px de mise en page : neutralise un ancêtre transformé (animation d'apparition). */
const textWidth = (outer: HTMLElement, inner: HTMLElement) => {
  const width = inner.getBoundingClientRect().width;
  const layoutWidth = outer.offsetWidth;
  if (layoutWidth <= 0) return width;
  const scale = outer.getBoundingClientRect().width / layoutWidth;
  return scale > 0 ? width / scale : width;
};

/**
 * Mesure synchrone : les styles posés le temps de la mesure sont restaurés avant la fin de la fonction,
 * le navigateur ne les peint jamais et ResizeObserver ne les voit pas.
 */
export const measureFitText = (
  outer: HTMLElement,
  inner: HTMLElement,
  maxFontPx: FitTextMaxFont | undefined,
  maxFontVar: string,
  minFontPx: number,
): FitTextLayout => {
  const saved = { fontSize: outer.style.fontSize, whiteSpace: outer.style.whiteSpace };
  try {
    outer.style.fontSize = '';
    outer.style.whiteSpace = 'nowrap';
    const computed = getComputedStyle(outer);
    const propMax = typeof maxFontPx === 'function' ? maxFontPx(outer) : maxFontPx;
    const varMax = maxFontVar ? px(computed.getPropertyValue(maxFontVar)) : 0;
    const resolved = resolveMaxFontPx(propMax, varMax);
    const max = Number.isNaN(resolved) ? px(computed.fontSize) : resolved;
    const availableWidth = outer.clientWidth - px(computed.paddingLeft) - px(computed.paddingRight);

    outer.style.fontSize = `${max}px`;
    let layout = computeFitTextLayout({
      availableWidth,
      naturalWidth: textWidth(outer, inner),
      referenceFontPx: max,
      maxFontPx: max,
      minFontPx,
    });

    // Le rendu des glyphes n'est pas parfaitement proportionnel : on vérifie la taille retenue.
    for (let step = 0; step < MAX_REFINEMENTS && layout.mode === 'fit' && layout.fontPx !== null; step += 1) {
      outer.style.fontSize = `${layout.fontPx}px`;
      const width = textWidth(outer, inner);
      if (width <= availableWidth - FIT_SAFETY_PX) break;
      layout = computeFitTextLayout({
        availableWidth,
        naturalWidth: width,
        referenceFontPx: layout.fontPx,
        maxFontPx: layout.fontPx - 0.5,
        minFontPx,
      });
    }
    return layout;
  } finally {
    outer.style.fontSize = saved.fontSize;
    outer.style.whiteSpace = saved.whiteSpace;
  }
};

const sameLayout = (a: FitTextLayout, b: FitTextLayout) => a.mode === b.mode && a.fontPx === b.fontPx;

export const useFitText = ({
  maxFontPx,
  maxFontVar = '--fit-max',
  minFontPx = DEFAULT_FIT_MIN_FONT_PX,
  className = '',
}: FitTextOptions) => {
  const outerRef = React.useRef<HTMLElement | null>(null);
  const innerRef = React.useRef<HTMLSpanElement | null>(null);
  const [layout, setLayout] = React.useState<FitTextLayout>({ mode: 'auto', fontPx: null });
  const optionsRef = React.useRef({ maxFontPx, maxFontVar, minFontPx });
  optionsRef.current = { maxFontPx, maxFontVar, minFontPx };
  const lastKeyRef = React.useRef<string | null>(null);

  const update = React.useCallback(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const options = optionsRef.current;
    const next = measureFitText(outer, inner, options.maxFontPx, options.maxFontVar, options.minFontPx);
    setLayout((current) => (sameLayout(current, next) ? current : next));
  }, []);

  // Nouvelle mesure quand le texte, les classes ou les bornes changent (sans boucle : clé comparée).
  React.useLayoutEffect(() => {
    const numericMax = typeof maxFontPx === 'number' ? maxFontPx : 'fn';
    const key = `${innerRef.current?.textContent ?? ''}|${className}|${numericMax}|${maxFontVar}|${minFontPx}`;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;
    update();
  });

  React.useLayoutEffect(() => {
    const outer = outerRef.current;
    if (!outer) return undefined;
    // Les plafonds en vh (rangée X01 en tablette) changent avec la hauteur de la fenêtre seule.
    window.addEventListener('resize', update);
    const fonts = typeof document === 'undefined' ? undefined : document.fonts;
    fonts?.addEventListener?.('loadingdone', update);
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      let lastWidth = -1;
      observer = new ResizeObserver(() => {
        const width = outer.clientWidth;
        if (width === lastWidth) return;
        lastWidth = width;
        update();
      });
      observer.observe(outer);
    }
    return () => {
      window.removeEventListener('resize', update);
      fonts?.removeEventListener?.('loadingdone', update);
      observer?.disconnect();
    };
  }, [update]);

  const style: React.CSSProperties = {};
  if (layout.fontPx !== null) style.fontSize = `${layout.fontPx}px`;
  if (layout.mode === 'fit') {
    style.whiteSpace = 'nowrap';
  } else {
    // Deux lignes équilibrées, coupure aux espaces puis n'importe où : jamais d'ellipse.
    style.whiteSpace = 'normal';
    style.textWrap = 'balance';
    style.overflowWrap = 'anywhere';
    if (layout.mode === 'wrap') style.lineHeight = 1.1;
  }

  return { outerRef, innerRef, mode: layout.mode, style };
};

