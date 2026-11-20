// Spec: spec:counter/external-match-link
// Setup banner of a match opened from an external link: players and format are locked.
import React from 'react';
import { Lock } from 'lucide-react';

import { EXTERNAL_MATCH_LABELS_FR } from '../../src/presentation/externalMatch/externalMatchLabels.fr';

interface SetupExternalMatchBannerProps {
  /** Host of the external app, e.g. "badarts.fr" */
  host: string;
  isDoubles: boolean;
}

export const SetupExternalMatchBanner: React.FC<SetupExternalMatchBannerProps> = ({ host, isDoubles }) => {
  const labels = EXTERNAL_MATCH_LABELS_FR.setupBanner;
  return (
    <section
      data-testid="setup-external-match-banner"
      className="mb-5 flex items-start gap-3 rounded-3xl border border-brand-border bg-brand-subtle px-5 py-4"
    >
      <Lock className="mt-0.5 h-5 w-5 shrink-0 text-brand-fg-faint" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-fg-faint">{labels.kicker(host)}</p>
        <p className="text-sm font-bold text-fg">{labels.message}</p>
        {isDoubles && <p className="text-xs text-fg-subtle">{labels.doublesHint}</p>}
      </div>
    </section>
  );
};
