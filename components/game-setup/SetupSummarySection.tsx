import React from 'react';

import { Button } from '../ui/Button';
import type { SetupSummaryEntry } from '../../src/features/game-setup/setupViewModel';
import { setupLabelClass, setupSectionClass } from './setupViewStyles';

interface SetupSummarySectionProps {
  entries: SetupSummaryEntry[];
  isLaunchBlocked: boolean;
  onStart: () => void;
}

export const SetupSummarySection: React.FC<SetupSummarySectionProps> = ({ entries, isLaunchBlocked, onStart }) => (
  <section className={`tablet-setup-summary ${setupSectionClass}`}>
    <label className={setupLabelClass}>Resume Du Match</label>
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Configuration</div>
        <div className="space-y-2 text-sm text-gray-300">
          {entries.map((entry) => (
            <div key={entry.label} className="flex items-center justify-between gap-4">
              <span>{entry.label}</span>
              <span className="text-right font-black text-white">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>

      <Button
        onClick={onStart}
        disabled={isLaunchBlocked}
        className="h-16 w-full rounded-2xl text-xl shadow-[0_18px_40px_rgba(234,88,12,0.28)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
      >
        Lancer La Partie
      </Button>
    </div>
  </section>
);