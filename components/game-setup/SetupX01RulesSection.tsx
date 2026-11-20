import React from 'react';

import type { InOutRule } from '../../types';
import { getRuleDescription, getRuleLabel } from '../../src/features/game-setup/setupPresentation';
import { setupActiveOptionClass, setupInactiveOptionClass, setupLabelClass, setupSectionClass } from './setupViewStyles';

interface SetupX01RulesSectionProps {
  checkIn: InOutRule;
  checkOut: InOutRule;
  onSetCheckIn: (value: InOutRule) => void;
  onSetCheckOut: (value: InOutRule) => void;
}

export const SetupX01RulesSection: React.FC<SetupX01RulesSectionProps> = ({
  checkIn,
  checkOut,
  onSetCheckIn,
  onSetCheckOut,
}) => {
  return (
    <section className={setupSectionClass}>
      <div className={setupLabelClass}>Règles</div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-border-subtle bg-surface-inset p-4">
          <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-fg-faint">Ouverture</div>
          <div className="grid grid-cols-3 gap-2">
            {(['Open', 'Double', 'Master'] as const).map((rule) => (
              <button
                key={rule}
                type="button"
                onClick={() => onSetCheckIn(rule)}
                aria-pressed={checkIn === rule}
                className={`rounded-xl border px-2 py-2 text-[11px] font-black uppercase tracking-[0.14em] ${checkIn === rule ? setupActiveOptionClass : setupInactiveOptionClass}`}
              >
                {getRuleLabel(rule)}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-fg-subtle">{getRuleDescription('in', checkIn)}</p>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-surface-inset p-4">
          <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-fg-faint">Fermeture</div>
          <div className="grid grid-cols-3 gap-2">
            {(['Open', 'Double', 'Master'] as const).map((rule) => (
              <button
                key={rule}
                type="button"
                onClick={() => onSetCheckOut(rule)}
                aria-pressed={checkOut === rule}
                className={`rounded-xl border px-2 py-2 text-[11px] font-black uppercase tracking-[0.14em] ${checkOut === rule ? setupActiveOptionClass : setupInactiveOptionClass}`}
              >
                {getRuleLabel(rule)}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-fg-subtle">{getRuleDescription('out', checkOut)}</p>
        </div>
      </div>
    </section>
  );
};
