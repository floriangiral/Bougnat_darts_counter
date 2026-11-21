import { createContext, useContext, useEffect, useState } from 'react';
import { getAppAccessMode } from '../../app/appShell';
import { resolveViewportClass, type ViewportClass } from './viewportClass';

const TOUCH_QUERY = '(any-pointer: coarse)';

const readTouch = (): boolean | null => {
  if (typeof window.matchMedia !== 'function') return null;
  return window.matchMedia(TOUCH_QUERY).matches;
};

// Q4 : la hauteur de fenêtre (et non visualViewport) décide de la recette, pour que l'ouverture du
// clavier virtuel ne fasse pas basculer la présentation ; --app-viewport-height reste géré à part.
export const readViewportClass = (): ViewportClass => {
  if (typeof window === 'undefined') {
    return resolveViewportClass({ width: 0, height: 0, isTouch: null, accessMode: 'local' });
  }
  return resolveViewportClass({
    width: window.innerWidth,
    height: window.innerHeight,
    isTouch: readTouch(),
    accessMode: getAppAccessMode(),
  });
};

const sameClass = (a: ViewportClass, b: ViewportClass) =>
  a.widthClass === b.widthClass
  && a.heightClass === b.heightClass
  && a.orientation === b.orientation
  && a.input === b.input
  && a.density === b.density
  && a.recipe === b.recipe
  && a.layoutMode === b.layoutMode;

/** Hook unique (spec 070 FR-01), lu par App seulement ; les vues passent par useViewport(). */
export const useViewportClass = (): ViewportClass => {
  const [viewport, setViewport] = useState<ViewportClass>(readViewportClass);

  useEffect(() => {
    // FR-04 : recalcul sans perte d'état ; un même résultat ne provoque aucun rendu.
    const update = () => setViewport((previous) => {
      const next = readViewportClass();
      return sameClass(previous, next) ? previous : next;
    });
    const touchQuery = typeof window.matchMedia === 'function' ? window.matchMedia(TOUCH_QUERY) : null;

    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    touchQuery?.addEventListener?.('change', update);

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      touchQuery?.removeEventListener?.('change', update);
    };
  }, []);

  return viewport;
};

export const ViewportContext = createContext<ViewportClass>(
  resolveViewportClass({ width: 1280, height: 800, isTouch: false, accessMode: 'local' }),
);

export const useViewport = (): ViewportClass => useContext(ViewportContext);
