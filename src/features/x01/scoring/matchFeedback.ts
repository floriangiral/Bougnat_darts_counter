import type { FeedbackKind } from './matchSubmission';

export const getFeedbackStyles = (type: FeedbackKind | undefined) => {
  if (type === 'bust') {
    return {
      label: 'Bust',
      surface: 'bg-gradient-to-br from-red-950/95 via-red-900/90 to-black/90',
      border: 'border-red-500/45',
      accent: 'bg-gradient-to-r from-red-400 via-red-500 to-orange-500',
      kicker: 'text-red-200/85',
      value: 'text-white drop-shadow-[0_0_16px_rgba(248,113,113,0.28)]',
    };
  }

  if (type === 'miss') {
    return {
      label: 'Turn',
      surface: 'bg-gradient-to-br from-slate-900/95 via-slate-800/92 to-black/88',
      border: 'border-slate-500/35',
      accent: 'bg-gradient-to-r from-slate-400 via-slate-300 to-white/80',
      kicker: 'text-slate-300/80',
      value: 'text-white',
    };
  }

  if (type === 'notice') {
    return {
      label: 'Info',
      surface: 'bg-gradient-to-br from-slate-900/95 via-gray-900/94 to-black/90',
      border: 'border-slate-400/35',
      accent: 'bg-gradient-to-r from-slate-300 via-slate-200 to-white/80',
      kicker: 'text-slate-300/85',
      value: 'text-white',
    };
  }

  return {
    label: 'Belles Fleches!',
    surface: 'bg-gradient-to-br from-slate-900/95 via-gray-900/94 to-black/90',
    border: 'border-slate-400/35',
    accent: 'bg-gradient-to-r from-slate-300 via-slate-200 to-white/80',
    kicker: 'text-slate-300/85',
    value: 'text-white',
  };
};
