import {
  getStatusBarStyle,
  THEME_CANVAS_COLORS,
  type EffectiveTheme,
} from '../../features/theming/themePreference';

const LIGHT_QUERY = '(prefers-color-scheme: light)';

// Spec 069 FR-04 : data-theme pilote les tokens CSS ; theme-color et barre d'état suivent le thème effectif.
export const applyEffectiveTheme = (doc: Document, theme: EffectiveTheme): void => {
  doc.documentElement.setAttribute('data-theme', theme);
  doc.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.setAttribute('content', THEME_CANVAS_COLORS[theme]);
    meta.removeAttribute('media');
  });
  doc.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
    ?.setAttribute('content', getStatusBarStyle(theme));
};

export const systemPrefersLight = (win: Pick<Window, 'matchMedia'> | undefined): boolean => {
  try {
    return typeof win?.matchMedia === 'function' && win.matchMedia(LIGHT_QUERY).matches;
  } catch {
    return false;
  }
};

// Spec 069 FR-02 : en mode système, un changement de thème de l'appareil s'applique sans rechargement.
export const watchSystemTheme = (
  win: Pick<Window, 'matchMedia'> | undefined,
  onChange: (prefersLight: boolean) => void,
): (() => void) => {
  if (typeof win?.matchMedia !== 'function') return () => undefined;
  const query = win.matchMedia(LIGHT_QUERY);
  const listener = (event: MediaQueryListEvent) => onChange(event.matches);
  query.addEventListener?.('change', listener);
  return () => query.removeEventListener?.('change', listener);
};
