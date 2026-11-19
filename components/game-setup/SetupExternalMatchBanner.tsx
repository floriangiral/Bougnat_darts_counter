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
      className="mb-5 flex items-start gap-3 rounded-3xl border border-orange-500/30 bg-orange-500/[0.08] px-5 py-4"
    >
      <Lock className="mt-0.5 h-5 w-5 shrink-0 text-orange-300" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">{labels.kicker}</p>
        <p className="text-sm font-bold text-white">{labels.message(host)}</p>
        {isDoubles && <p className="text-xs text-gray-400">{labels.doublesHint}</p>}
      </div>
    </section>
  );
};
