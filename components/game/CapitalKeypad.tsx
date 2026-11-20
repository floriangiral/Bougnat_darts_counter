import React, { useMemo, useState } from 'react';
import { CapitalDart, CapitalTarget } from '../../types';
import { isCapitalTotalReachable } from '../../src/features/capital/capitalGameModel';
import type { KeypadTone } from '../ui/Button';
import {
  BULL_LABELS,
  BULL_TONES,
  MULTIPLIER_TONES,
  type BullMultiplier,
  type KeypadMultiplier,
} from './multiplierStyles';
import {
  GameActionButton,
  GameUndoButton,
  KeypadActionRow,
  KeypadGrid,
  KeypadKey,
  KeypadPanel,
} from './controls';

interface CapitalKeypadProps {
  target: CapitalTarget;
  onDartInput: (dart: CapitalDart) => void;
  onUndo: () => void;
  canUndo: boolean;
  /** Appelé quand « Annuler » efface la saisie chiffrée en cours (mode Capital). */
  onBackspace?: () => void;
}

type CapitalMultiplier = KeypadMultiplier;

const BOARD_COLUMNS = [
  [1, 6, 11, 16],
  [2, 7, 12, 17],
  [3, 8, 13, 18],
  [4, 9, 14, 19],
  [5, 10, 15, 20],
];

const DOUBLE_NUMBERS = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
const TRIPLE_NUMBERS = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

const isSuiteTarget = (target: CapitalTarget): boolean => (
  target === 'SUITE'
  || target === 'COTE_A_COTE'
  || target === '57'
  || target === 'COULEUR'
  || target === '21_OU_MOINS'
);

const getNumberedTarget = (target: CapitalTarget): number | null => {
  if (!/^\d+$/.test(target)) return null;
  const value = Number.parseInt(target, 10);
  return Number.isNaN(value) ? null : value;
};

const hitTarget = (
  value: number,
  multiplier: CapitalMultiplier,
  onDartInput: CapitalKeypadProps['onDartInput'],
  setMultiplier: React.Dispatch<React.SetStateAction<CapitalMultiplier>>,
) => {
  const finalMultiplier = value === 25 && multiplier === 3 ? 1 : multiplier;
  onDartInput({ value, multiplier: finalMultiplier });
  setMultiplier(1);
};

const CAPITAL_IMPOSSIBLE_TOTAL_MESSAGE = 'SCORE IMPOSSIBLE';

const submitCapitalInput = (
  capitalInput: string,
  onDartInput: CapitalKeypadProps['onDartInput'],
  setCapitalInput: React.Dispatch<React.SetStateAction<string>>,
  setCapitalError: React.Dispatch<React.SetStateAction<string | null>>,
) => {
  const value = Number.parseInt(capitalInput, 10);
  if (Number.isNaN(value)) return;
  if (!isCapitalTotalReachable(value)) {
    setCapitalError(CAPITAL_IMPOSSIBLE_TOTAL_MESSAGE);
    return;
  }
  onDartInput({ value, multiplier: 1 });
  setCapitalInput('');
  setCapitalError(null);
};

const MODE_LABELS: Record<CapitalMultiplier, string> = { 1: 'SIMPLE', 2: 'DOUBLE', 3: 'TRIPLE' };

/** Touche de cible (spec 066) : ton métier, data-tone et data-multiplier (KeypadKey commune). */
const TargetKey: React.FC<{
  tone: KeypadTone;
  multiplier: CapitalMultiplier;
  onClick: () => void;
  className?: string;
  size?: 'target' | 'label';
  children: React.ReactNode;
}> = ({ tone, multiplier, onClick, className = '', size = 'target', children }) => (
  <KeypadKey tone={tone} multiplier={multiplier} size={size} onClick={onClick} className={`capital-key ${className}`}>
    {children}
  </KeypadKey>
);

const BullKey: React.FC<{ multiplier: BullMultiplier; onClick: () => void; className?: string }> = ({ multiplier, onClick, className = '' }) => (
  <TargetKey tone={BULL_TONES[multiplier]} multiplier={multiplier} onClick={onClick} size="label" className={className}>
    {BULL_LABELS[multiplier]}
  </TargetKey>
);

/** Sélecteur SIMPLE / DOUBLE / TRIPLE du mode plateau : le mode choisi passe en aplat métier (aria-pressed). */
const ModeSelector: React.FC<{
  multiplier: CapitalMultiplier;
  onSelect: (mode: CapitalMultiplier) => void;
  className: string;
}> = ({ multiplier, onSelect, className }) => (
  <div className={`capital-modes grid shrink-0 grid-cols-3 ${className}`}>
    {([1, 2, 3] as const).map((mode) => (
      <KeypadKey
        key={mode}
        tone={MULTIPLIER_TONES[mode]}
        multiplier={mode}
        selected={multiplier === mode}
        size="label"
        onClick={() => onSelect(mode)}
        className="capital-key capital-mode-key tracking-[0.16em]"
      >
        {MODE_LABELS[mode]}
      </KeypadKey>
    ))}
  </div>
);

const getBoardLayoutClasses = (suiteTarget: boolean) => suiteTarget
  ? {
    root: 'justify-end pt-1 sm:px-4 sm:pb-4 sm:pt-1.5',
    panel: 'px-3 pb-3 pt-1 sm:px-4 sm:pb-4 sm:pt-1.5',
    modes: 'gap-3 sm:gap-4',
    gridMargin: 'mt-3 sm:mt-4',
    gridGap: 'gap-2.5 sm:gap-3.5',
    columnGap: 'gap-2 sm:gap-2.5',
    actions: 'mt-3 sm:mt-4',
  }
  : {
    root: '',
    panel: 'px-2 py-2.5',
    modes: 'gap-2',
    gridMargin: 'mt-2',
    gridGap: 'gap-1.5 sm:gap-2',
    columnGap: 'gap-1.5',
    actions: 'mt-2',
  };

const getCapitalInputDisplayClass = (capitalInput: string, hasError: boolean): string => {
  let colorClass = 'text-fg-disabled';
  if (hasError) colorClass = 'text-danger-fg';
  else if (capitalInput) colorClass = 'text-brand-fg';
  return `text-2xl font-black tracking-[0.2em] font-mono sm:text-3xl ${colorClass}`;
};

const getBullMultiplier = (multiplier: CapitalMultiplier): BullMultiplier => (
  multiplier === 2 ? 2 : 1
);

export const CapitalKeypad: React.FC<CapitalKeypadProps> = ({ target, onDartInput, onUndo, canUndo, onBackspace }) => {
  const [multiplier, setMultiplier] = useState<CapitalMultiplier>(1);
  const [capitalInput, setCapitalInput] = useState('');
  const [capitalError, setCapitalError] = useState<string | null>(null);
  const updateCapitalInput: React.Dispatch<React.SetStateAction<string>> = (value) => {
    setCapitalError(null);
    setCapitalInput(value);
  };
  const hasPendingInput = target === 'CAPITAL' && capitalInput.length > 0;
  const suiteTarget = isSuiteTarget(target);
  const boardLayoutClasses = getBoardLayoutClasses(suiteTarget);
  const numberedTarget = useMemo(() => getNumberedTarget(target), [target]);
  const handleHit = (value: number) => hitTarget(value, multiplier, onDartInput, setMultiplier);

  const handleMiss = () => {
    onDartInput({ value: 0, multiplier: 1 });
    setMultiplier(1);
  };

  const handleCapitalSubmit = () => submitCapitalInput(capitalInput, onDartInput, updateCapitalInput, setCapitalError);
  const clearCapitalInput = () => {
    updateCapitalInput('');
    onBackspace?.();
  };
  const appendDigit = (digit: number) => updateCapitalInput((prev) => (prev + String(digit)).slice(0, 3));

  const undoButton = <GameActionButton action="undo" onClick={onUndo} disabled={!canUndo} className="capital-action-key" />;
  const missButton = <GameActionButton action="miss" onClick={handleMiss} className="capital-action-key" />;

  // Rangée Annuler | … | MISS, toujours en bas de la zone de saisie (spec 072 FR-07, commandes unifiées).
  const renderActionRow = () => (
    <KeypadActionRow className="capital-actions" data-testid="capital-keypad-actions" undo={undoButton} validate={missButton} />
  );

  const renderObjectivePanel = (label: string, kind: 'number' | 'bull', valueClassName: string) => (
    <div className="capital-objective-panel flex min-h-0 flex-1 items-center justify-center rounded-3xl border border-border-subtle bg-surface-tint p-4" data-kind={kind}>
      <div className="text-center">
        <div className="capital-objective-panel-label text-[10px] font-black uppercase tracking-[0.22em] text-fg-faint">Objectif</div>
        <div className={`capital-objective-panel-value mt-2 font-black text-fg ${valueClassName}`}>{label}</div>
      </div>
    </div>
  );

  if (target === 'CAPITAL') {
    const renderDigit = (num: number) => (
      <KeypadKey key={num} keyId={`k${num}`} size="digit" onClick={() => appendDigit(num)} className="capital-key">
        {num}
      </KeypadKey>
    );
    // Pavé chiffré : 1-9, MISS et 0, puis Annuler (efface la saisie, sinon annule la dernière entrée) | OK.
    return (
      <KeypadPanel className="capital-keypad border-t border-border bg-surface-sunken shadow-up" data-capital-mode="capital">
        <div className="capital-entry-bar grid h-10 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-border bg-surface-inset px-3 sm:h-11 sm:px-4">
          <div className="capital-entry-status flex items-center gap-3">
            {capitalError ? (
              <p role="alert" className="text-[9px] font-black uppercase tracking-[0.12em] text-danger-fg sm:text-[11px]">
                {capitalError}
              </p>
            ) : (
              <div className="flex items-center gap-2 opacity-80">
                <span className="text-base sm:text-lg" aria-hidden="true">⌨️</span>
              </div>
            )}
          </div>

          <div className="capital-entry-display flex items-center justify-center">
            <div className={getCapitalInputDisplayClass(capitalInput, capitalError !== null)}>
              {capitalInput || '---'}
            </div>
          </div>
        </div>

        <KeypadGrid columns={4} rows={4} className="capital-digit-grid">
          {[1, 2, 3].map(renderDigit)}
          <GameActionButton
            action="miss"
            data-key="miss"
            onClick={() => {
              onDartInput({ value: 0, multiplier: 1 });
              updateCapitalInput('');
            }}
            className="capital-key"
          />
          {[4, 5, 6].map(renderDigit)}
          <KeypadKey keyId="k0" size="digit" onClick={() => appendDigit(0)} className="capital-key row-span-2">
            0
          </KeypadKey>
          {[7, 8, 9].map(renderDigit)}
          <GameUndoButton
            data-key="undo"
            hasPendingInput={hasPendingInput}
            canUndoLast={canUndo}
            onClearInput={clearCapitalInput}
            onUndoLast={onUndo}
            className="capital-key capital-action-key col-span-2"
          />
          <GameActionButton action="validate" label="OK" data-key="ok" onClick={handleCapitalSubmit} className="capital-key capital-ok-key col-span-2" />
        </KeypadGrid>
      </KeypadPanel>
    );
  }

  if (target === 'CENTRE') {
    return (
      <KeypadPanel className="capital-keypad justify-end border-t border-border bg-surface-sunken shadow-up" data-capital-mode="fixed">
        <div className="capital-target-keys grid shrink-0 grid-cols-2 gap-2">
          <BullKey multiplier={1} onClick={() => onDartInput({ value: 25, multiplier: 1 })} />
          <BullKey multiplier={2} onClick={() => onDartInput({ value: 25, multiplier: 2 })} />
        </div>
        {renderActionRow()}
        {renderObjectivePanel(`${BULL_LABELS[1]} / ${BULL_LABELS[2]}`, 'bull', 'text-4xl sm:text-5xl')}
      </KeypadPanel>
    );
  }

  if (target === 'DOUBLE' || target === 'TRIPLE') {
    const fixedMultiplier: CapitalMultiplier = target === 'DOUBLE' ? 2 : 3;
    const prefix = target === 'DOUBLE' ? 'D' : 'T';
    return (
      <KeypadPanel className="capital-keypad border-t border-border bg-surface-sunken shadow-up" data-capital-mode="grid">
        <KeypadGrid columns={4} rows={5} label={target === 'DOUBLE' ? 'Doubles' : 'Triples'} className="capital-target-grid">
          {(target === 'DOUBLE' ? DOUBLE_NUMBERS : TRIPLE_NUMBERS).map((value) => (
            <TargetKey
              key={`${prefix}-${value}`}
              tone={MULTIPLIER_TONES[fixedMultiplier]}
              multiplier={fixedMultiplier}
              onClick={() => onDartInput({ value, multiplier: fixedMultiplier })}
            >
              {prefix}{value}
            </TargetKey>
          ))}
        </KeypadGrid>
        <KeypadActionRow className="capital-actions" data-testid="capital-keypad-actions" undo={undoButton} validate={missButton}>
          {target === 'DOUBLE' && <BullKey multiplier={2} onClick={() => onDartInput({ value: 25, multiplier: 2 })} />}
        </KeypadActionRow>
      </KeypadPanel>
    );
  }

  if (numberedTarget !== null && target !== '57') {
    return (
      <KeypadPanel className="capital-keypad justify-end border-t border-border bg-surface-sunken shadow-up" data-capital-mode="fixed">
        <div className="capital-target-keys grid shrink-0 grid-cols-3 gap-2">
          {([1, 2, 3] as const).map((fixedMultiplier) => {
            const label = `${MODE_LABELS[fixedMultiplier][0]}${numberedTarget}`;
            return (
              <TargetKey
                key={label}
                tone={MULTIPLIER_TONES[fixedMultiplier]}
                multiplier={fixedMultiplier}
                onClick={() => onDartInput({ value: numberedTarget, multiplier: fixedMultiplier })}
              >
                {label}
              </TargetKey>
            );
          })}
        </div>
        {renderActionRow()}
        {renderObjectivePanel(String(numberedTarget), 'number', 'text-6xl sm:text-7xl')}
      </KeypadPanel>
    );
  }

  // Mode plateau (Suite, 3 à côté, 57, Couleur, 21 ou moins). Au 57, le multiplicateur reste choisi.
  const preserveMultiplier = target === '57';
  const handleBoardHit = (value: number) => {
    if (preserveMultiplier) {
      onDartInput({ value, multiplier: value === 25 ? getBullMultiplier(multiplier) : multiplier });
      return;
    }
    handleHit(value);
  };

  return (
    <KeypadPanel className={`capital-keypad border-t border-border bg-surface-sunken shadow-up ${boardLayoutClasses.root}`} data-capital-mode="board">
      <div className={`capital-board-panel flex min-h-0 flex-1 flex-col bg-surface-sunken ${boardLayoutClasses.panel}`}>
        <ModeSelector multiplier={multiplier} onSelect={setMultiplier} className={boardLayoutClasses.modes} />

        <div className={`capital-board-grid ${boardLayoutClasses.gridMargin} grid min-h-0 flex-1 grid-cols-5 ${boardLayoutClasses.gridGap}`}>
          {BOARD_COLUMNS.map((column, columnIndex) => (
            <div
              key={`column-${columnIndex}`}
              className={`grid min-h-0 grid-rows-4 bg-surface-inset p-0 ${boardLayoutClasses.columnGap}`}
            >
              {column.map((num) => (
                <TargetKey
                  key={num}
                  tone={MULTIPLIER_TONES[multiplier]}
                  multiplier={multiplier}
                  onClick={() => handleBoardHit(num)}
                >
                  {num}
                </TargetKey>
              ))}
            </div>
          ))}
        </div>

        <KeypadActionRow
          columns={4}
          className={`capital-actions ${boardLayoutClasses.actions}`}
          data-testid="capital-keypad-actions"
          undo={undoButton}
          validate={missButton}
        >
          {multiplier === 3 ? (
            <div className="col-span-2" aria-hidden="true" />
          ) : (
            <BullKey multiplier={getBullMultiplier(multiplier)} onClick={() => handleBoardHit(25)} className="col-span-2" />
          )}
        </KeypadActionRow>
      </div>
    </KeypadPanel>
  );
};
