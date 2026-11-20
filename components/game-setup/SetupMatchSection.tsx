import React from 'react';

import { setupActiveOptionClass, setupInactiveOptionClass, setupLabelClass, setupSectionClass } from './setupViewStyles';

interface SetupMatchSectionProps {
  matchMode: 'LEGS' | 'SETS';
  legsToWin: number;
  setsToWin: number;
  presetLegsOptions: number[];
  isCustomLegsActive: boolean;
  hasCustomLegsValue: boolean;
  customLegsStr: string;
  isCustomLegsValid: boolean;
  onSetMatchMode: (mode: 'LEGS' | 'SETS') => void;
  onSetLegsToWin: (value: number) => void;
  onSetSetsToWin: (value: number) => void;
  onOpenCustomLegs: () => void;
}

export const SetupMatchSection: React.FC<SetupMatchSectionProps> = ({
  matchMode,
  legsToWin,
  setsToWin,
  presetLegsOptions,
  isCustomLegsActive,
  hasCustomLegsValue,
  customLegsStr,
  isCustomLegsValid,
  onSetMatchMode,
  onSetLegsToWin,
  onSetSetsToWin,
  onOpenCustomLegs,
}) => {
  return (
    <section className={setupSectionClass}>
      <div className={setupLabelClass}>Format du match</div>

      <div className="mb-5 inline-flex rounded-2xl border border-border-subtle bg-surface-inset p-1">
        <button
          type="button"
          onClick={() => onSetMatchMode('LEGS')}
          className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all ${matchMode === 'LEGS' ? 'bg-surface-tint-strong text-fg' : 'text-fg-faint hover:text-fg'}`}
        >
          Manches
        </button>
        <button
          type="button"
          onClick={() => onSetMatchMode('SETS')}
          className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all ${matchMode === 'SETS' ? 'bg-surface-tint-strong text-fg' : 'text-fg-faint hover:text-fg'}`}
        >
          Sets
        </button>
      </div>

      <div className="space-y-4 rounded-2xl border border-border-subtle bg-surface-inset p-4">
        {matchMode === 'LEGS' ? (
          <div>
            <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-fg-faint">Manches pour gagner le match</div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {presetLegsOptions.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => onSetLegsToWin(num)}
                  className={`rounded-xl border py-2 text-sm font-black ${legsToWin === num ? setupActiveOptionClass : setupInactiveOptionClass}`}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={onOpenCustomLegs}
                className={`rounded-xl border py-2 text-sm font-black ${isCustomLegsActive ? setupActiveOptionClass : setupInactiveOptionClass}`}
              >
                {isCustomLegsActive && hasCustomLegsValue ? customLegsStr : 'Perso'}
              </button>
            </div>
            {isCustomLegsActive && !isCustomLegsValid && (
              <p className="mt-3 text-right text-xs font-bold text-warning-fg">
                Saisis au moins 1 manche pour utiliser une valeur personnalisée.
              </p>
            )}
          </div>
        ) : (
          <>
            <div>
              <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-fg-faint">Sets pour gagner le match</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[1, 3, 5, 7].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => onSetSetsToWin(num)}
                    className={`rounded-xl border py-2 text-sm font-black ${setsToWin === num ? setupActiveOptionClass : setupInactiveOptionClass}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-fg-faint">Manches pour gagner un set</div>
              <div className="grid grid-cols-2 gap-2">
                {[3, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => onSetLegsToWin(num)}
                    className={`rounded-xl border py-2 text-sm font-black ${legsToWin === num ? setupActiveOptionClass : setupInactiveOptionClass}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
