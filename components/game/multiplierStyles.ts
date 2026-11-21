// Spec 066 (V2-DS-04) : convention de la cible commune à tous les pavés — simple neutre, double cyan,
// triple orange, Bull vert, D-Bull rouge. Les touches (KeypadKey, components/game/controls) exposent
// data-tone / data-multiplier (FR-07) ;
// les couleurs viennent des rôles game-* (jamais de palette brute, jamais de !important).
// Spec ref: specs/054-counter-impossible-totals-validation (RM-03, FR-05).
import { KEYPAD_TONES, type KeypadTone } from '../ui/buttonStyles';

export type KeypadMultiplier = 1 | 2 | 3;
export type BullMultiplier = 1 | 2;

export const MULTIPLIER_TONES: Record<KeypadMultiplier, KeypadTone> = {
  1: 'neutral',
  2: 'double',
  3: 'triple',
};

export const BULL_TONES: Record<BullMultiplier, KeypadTone> = {
  1: 'bull',
  2: 'dbull',
};

/** Libellés communs du Bull (Cricket, Capital) : la valeur en points lève toute ambiguïté. */
export const BULL_LABELS: Record<BullMultiplier, string> = {
  1: 'BULL (25)',
  2: 'D-BULL (50)',
};

const KEY_BASE =
  'bd-touch-target bd-keypad-key flex select-none items-center justify-center text-center font-black leading-tight transition-[color,background-color,border-color,transform] duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 [touch-action:manipulation] [-webkit-tap-highlight-color:transparent]';

/** Classes d'une touche de pavé dans le ton métier donné (rôles game-* via KEYPAD_TONES). */
export const getKeypadKeyClass = (tone: KeypadTone, extra = ''): string => `${KEY_BASE} ${KEYPAD_TONES[tone]} ${extra}`;

// Sélecteur de multiplicateur (SIMPLE / DOUBLE / TRIPLE) : le mode choisi passe en aplat métier.
const SELECTED_MODE_CLASSES: Record<KeypadMultiplier, string> = {
  1: 'border border-border-strong bg-surface-strong text-fg shadow-raised',
  2: 'border border-game-double bg-game-double text-on-game shadow-raised',
  3: 'border border-game-triple bg-game-triple text-on-game shadow-raised',
};

export const getMultiplierModeClass = (mode: KeypadMultiplier, selected: boolean, extra = ''): string => (
  selected
    ? `${KEY_BASE} ${SELECTED_MODE_CLASSES[mode]} ${extra}`
    : getKeypadKeyClass(MULTIPLIER_TONES[mode], extra)
);
