import type { FeedbackKind } from './matchSubmission';

export const getFeedbackStyles = (type: FeedbackKind | undefined) => {
  if (type === 'bust') {
    return {
      label: 'Bust',
      surface: 'bg-gradient-to-br from-red-950/95 via-red-900/90 to-black/90',
      border: 'border-danger-border',
      accent: 'bg-gradient-to-r from-brand-2 via-brand-2 to-brand',
      kicker: 'text-danger-fg-soft/85',
      value: 'text-fg drop-shadow-[0_0_16px_rgba(248,113,113,0.28)]',
    };
  }

  if (type === 'miss') {
    return {
      label: 'Turn',
      surface: 'bg-gradient-to-br from-slate-900/95 via-slate-800/92 to-black/88',
      border: 'border-border-strong/35',
      accent: 'bg-gradient-to-r from-surface via-surface to-white/80',
      kicker: 'text-fg-muted/80',
      value: 'text-fg',
    };
  }

  if (type === 'notice') {
    return {
      label: 'Info',
      surface: 'bg-gradient-to-br from-slate-900/95 via-gray-900/94 to-black/90',
      border: 'border-border-strong/35',
      accent: 'bg-gradient-to-r from-surface via-surface to-white/80',
      kicker: 'text-fg-muted/85',
      value: 'text-fg',
    };
  }

  return {
    label: 'Belles Fléchettes!',
    surface: 'bg-gradient-to-br from-slate-900/95 via-gray-900/94 to-black/90',
    border: 'border-border-strong/35',
    accent: 'bg-gradient-to-r from-surface via-surface to-white/80',
    kicker: 'text-fg-muted/85',
    value: 'text-fg',
  };
};
