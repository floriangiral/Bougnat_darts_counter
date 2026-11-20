// Convention provisoire alignée sur le CricketKeypad, à remplacer par les tokens de la spec 066.
// Spec ref: specs/054-counter-impossible-totals-validation (RM-03, FR-05).
export type KeypadMultiplier = 1 | 2 | 3;

export const MULTIPLIER_KEY_CLASSES: Record<KeypadMultiplier, string> = {
  1: '!border-border-subtle !bg-none !bg-surface-raised !text-fg hover:!border-border-strong/20 hover:!bg-surface-strong',
  2: '!border-info-border !bg-none !bg-surface-raised !text-cyan-300 hover:!border-info-border hover:!bg-info-subtle',
  3: '!border-brand-border !bg-none !bg-surface-raised !text-brand-fg-faint hover:!border-brand-border hover:!bg-brand-muted',
};

export const MULTIPLIER_ACTIVE_MODE_CLASSES: Record<KeypadMultiplier, string> = {
  1: '!border-border-strong/60 !bg-none !bg-surface-strong !text-fg shadow-[0_16px_40px_rgba(148,163,184,0.22)]',
  2: '!border-info-border !bg-none !bg-cyan-700 !text-fg shadow-[0_16px_40px_rgba(8,145,178,0.28)]',
  3: '!border-brand-border !bg-none !bg-brand-strong !text-fg shadow-[0_16px_40px_rgba(194,65,12,0.28)]',
};

export const BULL_KEY_CLASS =
  '!border-success-border !bg-gradient-to-r !from-emerald-700 !to-green-500 !text-fg shadow-[0_16px_36px_rgba(34,197,94,0.3)] hover:!from-emerald-600 hover:!to-green-400';

export const DOUBLE_BULL_KEY_CLASS =
  '!border-danger-border !bg-none !bg-[#d90416] !text-fg shadow-[0_16px_36px_rgba(217,4,22,0.36)] hover:!bg-[#f20d20]';
