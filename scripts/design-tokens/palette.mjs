// Spec 063 (cliquet CI) et 065 (migration outillée, sans dépendance de production).
// Détection des classes de palette Tailwind brutes et des valeurs arbitraires colorées, et table de
// correspondance « classe brute → rôle sémantique » pour les cas non ambigus. Les cas ambigus
// (couleurs métier, identités de jeu) restent signalés pour une migration manuelle.

const UTILITIES = 'bg|text|border(?:-[trblxyse])?|from|to|via|ring|ring-offset|shadow|fill|stroke|outline|divide|placeholder|accent|caret|decoration';
const HUES = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black';

export const RAW_PALETTE_SOURCE = `(?<![\\w-])(${UTILITIES})-(${HUES})(?:-(\\d{2,3}))?(?:\\/(\\d+|\\[[^\\]\\s]+\\]))?(?![\\w-])`;
export const ARBITRARY_COLOR_SOURCE = '(?<![\\w-])[a-z][a-z-]*-\\[[^\\]\\s]*(?:#[0-9a-fA-F]{3,8}|rgba?\\(|hsla?\\()[^\\]\\s]*\\]';

export const findRawPalette = (text) => [
  ...[...text.matchAll(new RegExp(RAW_PALETTE_SOURCE, 'g'))].map((m) => m[0]),
  ...[...text.matchAll(new RegExp(ARBITRARY_COLOR_SOURCE, 'g'))].map((m) => m[0]),
];

export const countRawPalette = (text) => findRawPalette(text).length;

const alphaValue = (alpha) => {
  if (!alpha) return 100;
  if (alpha.startsWith('[')) return Math.round(Number.parseFloat(alpha.slice(1, -1)) * 100);
  return Number.parseInt(alpha, 10);
};

const NEUTRALS = new Set(['slate', 'gray', 'zinc', 'neutral', 'stone']);
const SUCCESS = new Set(['green', 'emerald']);
const WARNING = new Set(['amber', 'yellow']);

const textRole = (hue, shade) => {
  if (hue === 'white') return 'fg';
  if (hue === 'black') return 'fg-inverse';
  if (NEUTRALS.has(hue)) {
    if (shade <= 200) return 'fg-soft';
    if (shade <= 300) return 'fg-muted';
    if (shade <= 400) return 'fg-subtle';
    if (shade <= 500) return 'fg-faint';
    return 'fg-disabled';
  }
  if (hue === 'orange') {
    if (shade >= 500) return 'brand-fg';
    if (shade === 400) return 'brand-fg-soft';
    return 'brand-fg-faint';
  }
  if (hue === 'red') return shade >= 400 ? 'danger-fg' : 'danger-fg-soft';
  if (SUCCESS.has(hue)) return 'success-fg';
  if (WARNING.has(hue)) return 'warning-fg';
  return null;
};

const bgRole = (hue, shade, alpha) => {
  if (hue === 'white') {
    if (alpha === 100) return 'paper';
    return alpha <= 6 ? 'surface-tint' : 'surface-tint-strong';
  }
  if (hue === 'black') {
    if (alpha === 100) return 'canvas';
    if (alpha <= 30) return 'surface-inset';
    if (alpha <= 70) return 'scrim';
    return 'overlay';
  }
  if (NEUTRALS.has(hue) && alpha === 100) {
    if (shade >= 950) return 'surface-sunken';
    if (shade >= 900) return 'surface';
    if (shade >= 800) return 'surface-raised';
    return 'surface-strong';
  }
  if (NEUTRALS.has(hue) && shade >= 800) return alpha >= 80 ? 'surface-glass' : 'surface-inset';
  if (hue === 'orange') {
    if (alpha === 100) return shade >= 600 ? 'brand-strong' : 'brand';
    return alpha <= 12 ? 'brand-subtle' : 'brand-muted';
  }
  if (hue === 'red') {
    if (alpha === 100) return shade >= 700 ? 'danger-strong' : 'danger';
    return alpha >= 50 ? 'danger-strong' : 'danger-subtle';
  }
  if (SUCCESS.has(hue) && alpha < 100) return 'success-subtle';
  if (WARNING.has(hue) && alpha < 100) return 'warning-subtle';
  if (hue === 'cyan' && alpha < 100) return 'info-subtle';
  return null;
};

const borderRole = (hue, shade, alpha) => {
  if (hue === 'white') return alpha <= 10 ? 'border-subtle' : 'border-strong';
  if (hue === 'black') return 'border';
  if (NEUTRALS.has(hue)) return shade >= 800 ? 'border' : 'border-strong';
  if (hue === 'orange') return alpha === 100 ? 'brand' : 'brand-border';
  if (hue === 'red') return 'danger-border';
  if (SUCCESS.has(hue)) return 'success-border';
  if (WARNING.has(hue)) return 'warning-border';
  if (hue === 'cyan') return 'info-border';
  return null;
};

const gradientRole = (hue, shade, alpha) => {
  if (alpha !== 100) return null;
  if (hue === 'orange') return shade >= 600 ? 'brand-strong' : 'brand';
  if (hue === 'red') return 'brand-2';
  if (hue === 'black') return 'canvas';
  if (NEUTRALS.has(hue)) return shade >= 950 ? 'surface-sunken' : 'surface';
  return null;
};

// Rôles déjà translucides : le modificateur d'opacité d'origine est absorbé.
const TRANSLUCENT_ROLES = new Set([
  'surface-tint', 'surface-tint-strong', 'surface-inset', 'surface-glass', 'scrim', 'overlay',
  'brand-subtle', 'brand-muted', 'brand-border', 'border-subtle', 'danger-subtle', 'danger-border',
  'success-subtle', 'success-border', 'warning-subtle', 'warning-border', 'info-subtle', 'info-border',
]);

export const mapRawClass = (raw) => {
  const match = new RegExp(`^${RAW_PALETTE_SOURCE}$`).exec(raw);
  if (!match) return null;
  const [, utility, hue, shadeText, alphaText] = match;
  const shade = shadeText ? Number.parseInt(shadeText, 10) : 0;
  const alpha = alphaValue(alphaText);
  let role = null;
  if (utility === 'text' || utility === 'placeholder' || utility === 'decoration' || utility === 'caret') role = textRole(hue, shade);
  else if (utility === 'bg') role = bgRole(hue, shade, alpha);
  else if (utility.startsWith('border') || utility === 'divide' || utility === 'outline' || utility === 'ring') role = borderRole(hue, shade, alpha);
  else if (utility === 'from' || utility === 'via' || utility === 'to') role = gradientRole(hue, shade, alpha);
  else if (utility === 'accent' && hue === 'orange') role = 'brand';
  if (!role) return null;
  const keepAlpha = alphaText && !TRANSLUCENT_ROLES.has(role) && alpha !== 100;
  return `${utility}-${role}${keepAlpha ? `/${alphaText}` : ''}`;
};

export const migrateText = (text) => {
  const unmapped = [];
  const output = text.replace(new RegExp(RAW_PALETTE_SOURCE, 'g'), (raw) => {
    const mapped = mapRawClass(raw);
    if (!mapped) unmapped.push(raw);
    return mapped ?? raw;
  });
  return { output, unmapped };
};
