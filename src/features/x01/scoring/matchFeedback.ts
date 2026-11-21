import type { FeedbackKind } from './matchSubmission';

// Spec 066 FR-06 / 065 FR-05 : intention pure (ton + libellé), la présentation traduit le ton en rôles.
export type FeedbackTone = 'bust' | 'miss' | 'notice' | 'info';

export type FeedbackPresentation = Readonly<{
  tone: FeedbackTone;
  label: string;
}>;

const PRESENTATIONS: Record<FeedbackTone, FeedbackPresentation> = {
  bust: { tone: 'bust', label: 'Trop' },
  miss: { tone: 'miss', label: 'Tour' },
  notice: { tone: 'notice', label: 'Info' },
  info: { tone: 'info', label: 'Belles fléchettes !' },
};

export const getFeedbackPresentation = (type: FeedbackKind | undefined): FeedbackPresentation =>
  PRESENTATIONS[type ?? 'info'];
