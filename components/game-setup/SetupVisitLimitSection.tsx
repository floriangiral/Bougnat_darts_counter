import React from 'react';

import { setupActiveOptionClass, setupInactiveOptionClass, setupLabelClass, setupSectionClass } from './setupViewStyles';

interface SetupVisitLimitSectionProps {
  maxVisitsPerLeg: number | null;
  presets: number[];
  customMaxVisitsStr: string;
  isCustomActive: boolean;
  isCustomValid: boolean;
  onSelect: (value: number | null) => void;
  onOpenCustom: () => void;
}

export const SetupVisitLimitSection: React.FC<SetupVisitLimitSectionProps> = ({
  maxVisitsPerLeg,
  presets,
  customMaxVisitsStr,
  isCustomActive,
  isCustomValid,
  onSelect,
  onOpenCustom,
}) => {
  const optionClass = (isActive: boolean) =>
    `rounded-xl border py-2 text-sm font-black ${isActive ? setupActiveOptionClass : setupInactiveOptionClass}`;

  return (
    <section className={setupSectionClass}>
      <div className={setupLabelClass}>Volées par manche</div>
      <div className="setup-option-grid grid grid-cols-3 gap-2 sm:grid-cols-5">
        <button
          type="button"
          onClick={() => onSelect(null)}
          aria-pressed={maxVisitsPerLeg === null}
          className={optionClass(maxVisitsPerLeg === null)}
        >
          Aucune
        </button>
        {presets.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            aria-pressed={maxVisitsPerLeg === value}
            className={optionClass(maxVisitsPerLeg === value)}
          >
            {value}
          </button>
        ))}
        <button
          type="button"
          onClick={onOpenCustom}
          aria-pressed={isCustomActive}
          className={optionClass(isCustomActive)}
        >
          {isCustomActive && customMaxVisitsStr.trim() ? customMaxVisitsStr : 'Perso'}
        </button>
      </div>
      <p className="setup-help mt-3 text-xs font-bold text-fg-muted">
        {maxVisitsPerLeg === null
          ? 'Manches sans limite de volées.'
          : 'Limite atteinte sans fermeture : une fléchette chacun, le plus près du bull gagne la manche.'}
      </p>
      {isCustomActive && !isCustomValid && (
        <p className="setup-help mt-2 text-right text-xs font-bold text-warning-fg">
          Saisis une valeur entre 1 et 99 volées.
        </p>
      )}
    </section>
  );
};
