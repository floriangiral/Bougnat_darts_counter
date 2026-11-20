// Convention provisoire alignée sur le CricketKeypad, à remplacer par les tokens de la spec 066.
// Spec ref: specs/054-counter-impossible-totals-validation (RM-03, FR-05).
export type KeypadMultiplier = 1 | 2 | 3;

export const MULTIPLIER_KEY_CLASSES: Record<KeypadMultiplier, string> = {
  1: '!border-white/10 !bg-none !bg-slate-800 !text-white hover:!border-white/20 hover:!bg-slate-700',
  2: '!border-cyan-500/40 !bg-none !bg-slate-800 !text-cyan-300 hover:!border-cyan-400/60 hover:!bg-cyan-900/25',
  3: '!border-orange-500/40 !bg-none !bg-slate-800 !text-orange-300 hover:!border-orange-400/60 hover:!bg-orange-900/25',
};

export const MULTIPLIER_ACTIVE_MODE_CLASSES: Record<KeypadMultiplier, string> = {
  1: '!border-white/60 !bg-none !bg-slate-600 !text-white shadow-[0_16px_40px_rgba(148,163,184,0.22)]',
  2: '!border-cyan-300/70 !bg-none !bg-cyan-700 !text-white shadow-[0_16px_40px_rgba(8,145,178,0.28)]',
  3: '!border-orange-300/70 !bg-none !bg-orange-700 !text-white shadow-[0_16px_40px_rgba(194,65,12,0.28)]',
};

export const BULL_KEY_CLASS =
  '!border-emerald-300/55 !bg-gradient-to-r !from-emerald-700 !to-green-500 !text-white shadow-[0_16px_36px_rgba(34,197,94,0.3)] hover:!from-emerald-600 hover:!to-green-400';

export const DOUBLE_BULL_KEY_CLASS =
  '!border-red-200/60 !bg-none !bg-[#d90416] !text-white shadow-[0_16px_36px_rgba(217,4,22,0.36)] hover:!bg-[#f20d20]';
