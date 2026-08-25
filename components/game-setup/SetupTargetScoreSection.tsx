import React from 'react';

import type { GameType } from '../../utils/arenaFlow';
import { setupActiveOptionClass, setupInactiveOptionClass, setupLabelClass, setupSectionClass } from './setupViewStyles';

interface SetupTargetScoreSectionProps {
  gameType: GameType;
  presets: number[];
  startingScore: number;
  customScoreStr: string;
  hasCustomScoreValue: boolean;
  isCustomActive: boolean;
  isCustomScoreValid: boolean;
  onPresetSelect: (score: number) => void;
  onOpenCustomScore: () => void;
}

export const SetupTargetScoreSection: React.FC<SetupTargetScoreSectionProps> = ({
  gameType,
  presets,
  startingScore,
  customScoreStr,
  hasCustomScoreValue,
  isCustomActive,
  isCustomScoreValid,
  onPresetSelect,
  onOpenCustomScore,
}) => {
  if (gameType !== 'X01' && gameType !== 'GOTCHA') {
    return null;
  }

  const sectionLabel = gameType === 'GOTCHA' ? 'Score Cible' : 'Score De Depart';
  let customScoreLabel = 'Perso';
  if (gameType === 'GOTCHA') {
    customScoreLabel = 'PERSO';
  } else if (isCustomActive && hasCustomScoreValue) {
    customScoreLabel = customScoreStr;
  }

  return (
    <section className={setupSectionClass}>
      <div className={setupLabelClass}>{sectionLabel}</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {presets.map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onPresetSelect(score)}
            className={`rounded-2xl border py-3 text-sm font-black transition-all duration-200 ${startingScore === score ? setupActiveOptionClass : setupInactiveOptionClass}`}
          >
            {score}
          </button>
        ))}
        <button
          type="button"
          onClick={onOpenCustomScore}
          className={`rounded-2xl border py-3 text-sm font-black transition-all duration-200 ${
            isCustomActive && !presets.includes(startingScore) ? setupActiveOptionClass : setupInactiveOptionClass
          }`}
        >
          {customScoreLabel}
        </button>
      </div>
      {isCustomActive && !isCustomScoreValid && (
        <p className="mt-3 text-right text-xs font-bold text-amber-300">
          Saisis une valeur de 2 ou plus pour lancer une partie personnalisee.
        </p>
      )}
    </section>
  );
};
