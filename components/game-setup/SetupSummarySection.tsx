import React from 'react';

import { SetupLaunchButton } from './SetupLaunchButton';
import type { SetupSummaryEntry } from '../../src/features/game-setup/setupViewModel';
import { setupLabelClass, setupSectionClass } from './setupViewStyles';

interface SetupSummarySectionProps {
  entries: SetupSummaryEntry[];
  isLaunchBlocked: boolean;
  onStart: () => void;
  /** Faux quand l'écran place lui-même le lancement sous le résumé (X01). */
  showLaunch?: boolean;
}

export const SetupSummarySection: React.FC<SetupSummarySectionProps> = ({ entries, isLaunchBlocked, onStart, showLaunch = true }) => (
  <section className={`tablet-setup-summary setup-summary ${setupSectionClass}`}>
    <h2 className={setupLabelClass}>Résumé du match</h2>
    <div className="setup-summary-body space-y-4">
      <div className="setup-summary-card rounded-2xl border border-border-subtle bg-surface-inset p-4">
        <div className="setup-kicker setup-summary-kicker mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-fg-faint">Configuration</div>
        <div className="setup-summary-entries space-y-2 text-sm text-fg-muted">
          {entries.map((entry) => (
            <div key={entry.label} className="setup-summary-entry flex items-center justify-between gap-4">
              <span>{entry.label}</span>
              <span className="setup-summary-value text-right font-black text-fg">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>

      {showLaunch && <SetupLaunchButton onStart={onStart} disabled={isLaunchBlocked} />}
    </div>
  </section>
);