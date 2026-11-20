import React, { useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { CapitalDart, CapitalTarget } from '../../types';
import { isCapitalTotalReachable } from '../../src/features/capital/capitalGameModel';
import type { KeypadTone } from '../ui/Button';
import {
  BULL_LABELS,
  BULL_TONES,
  getKeyDataAttributes,
  getKeypadKeyClass,
  getMultiplierModeClass,
  MULTIPLIER_TONES,
  type BullMultiplier,
  type KeypadMultiplier,
} from './multiplierStyles';

interface CapitalKeypadProps {
  target: CapitalTarget;
  onDartInput: (dart: CapitalDart) => void;
  onUndo: () => void;
  canUndo: boolean;
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

const undoKeypad = (
  canUndoCapitalInput: boolean,
  setCapitalInput: React.Dispatch<React.SetStateAction<string>>,
  onBackspace: CapitalKeypadProps['onBackspace'],
  onUndo: CapitalKeypadProps['onUndo'],
) => {
  if (canUndoCapitalInput) {
    setCapitalInput((prev) => prev.slice(0, -1));
    onBackspace?.();
    return;
  }
  onUndo();
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

const getBoardModeTextClass = (suiteTarget: boolean): string => (
  suiteTarget ? 'text-[11px] sm:text-sm' : 'text-xs sm:text-lg'
);

const getBoardNumberTextClass = (suiteTarget: boolean): string => (
  suiteTarget ? 'text-base sm:text-xl' : 'text-sm sm:text-xl'
);

const MODE_LABELS: Record<CapitalMultiplier, string> = { 1: 'SIMPLE', 2: 'DOUBLE', 3: 'TRIPLE' };

/** Touche de cible (spec 066) : ton métier, data-tone et data-multiplier. */
const TargetKey: React.FC<{
  tone: KeypadTone;
  multiplier: CapitalMultiplier;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}> = ({ tone, multiplier, onClick, className = '', children }) => (
  <button
    type="button"
    onClick={onClick}
    {...getKeyDataAttributes(tone, multiplier)}
    className={getKeypadKeyClass(tone, `capital-key rounded ${className}`)}
  >
    {children}
  </button>
);

const BullKey: React.FC<{ multiplier: BullMultiplier; onClick: () => void; className?: string }> = ({ multiplier, onClick, className = '' }) => (
  <TargetKey tone={BULL_TONES[multiplier]} multiplier={multiplier} onClick={onClick} className={className}>
    {BULL_LABELS[multiplier]}
  </TargetKey>
);

/** Sélecteur SIMPLE / DOUBLE / TRIPLE du mode plateau : le mode choisi passe en aplat métier. */
const ModeSelector: React.FC<{
  multiplier: CapitalMultiplier;
  onSelect: (mode: CapitalMultiplier) => void;
  className: string;
  textClassName: string;
}> = ({ multiplier, onSelect, className, textClassName }) => (
  <div className={`capital-modes grid shrink-0 grid-cols-3 ${className}`}>
    {([1, 2, 3] as const).map((mode) => (
      <button
        key={mode}
        type="button"
        onClick={() => onSelect(mode)}
        aria-pressed={multiplier === mode}
        data-state={multiplier === mode ? 'selected' : 'idle'}
        {...getKeyDataAttributes(MULTIPLIER_TONES[mode], mode)}
        className={getMultiplierModeClass(mode, multiplier === mode, `capital-key capital-mode-key min-h-12 rounded px-3 py-2 tracking-[0.16em] ${textClassName}`)}
      >
        {MODE_LABELS[mode]}
      </button>
    ))}
  </div>
);

const getBoardLayoutClasses = (suiteTarget: boolean) => suiteTarget
  ? {
    root: 'justify-end gap-2.5 p-2 pt-1 sm:gap-3 sm:px-4 sm:pb-4 sm:pt-1.5',
    panel: 'px-3 pb-3 pt-1 sm:px-4 sm:pb-4 sm:pt-1.5',
    modes: 'h-14 gap-3 sm:h-16 sm:gap-4',
    gridMargin: 'mt-3 sm:mt-4',
    gridGap: 'gap-2.5 sm:gap-3.5',
    columnGap: 'gap-2 sm:gap-2.5',
    actions: 'mt-3 sm:mt-4 h-14 gap-3 sm:h-16 sm:gap-4',
    undo: 'px-3 py-2 text-[11px] sm:text-sm',
    bull: 'px-3 py-2 text-[11px] sm:text-lg',
    miss: 'px-3 py-2 text-[11px] sm:text-lg',
  }
  : {
    root: 'gap-2 p-2',
    panel: 'px-2 py-2.5',
    modes: 'h-12 gap-2 sm:h-14',
    gridMargin: 'mt-2',
    gridGap: 'gap-1.5 sm:gap-2',
    columnGap: 'gap-1.5',
    actions: 'mt-2 h-12 gap-2 sm:h-14',
    undo: 'px-2 py-1 text-[10px] sm:text-sm',
    bull: 'px-2 py-1 text-xs sm:text-xl',
    miss: 'px-2 py-1 text-xs sm:text-lg',
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
  const canUndoCapitalInput = target === 'CAPITAL' && capitalInput.length > 0;
  const canTriggerUndo = canUndo || canUndoCapitalInput;
  const suiteTarget = isSuiteTarget(target);
  const boardLayoutClasses = getBoardLayoutClasses(suiteTarget);
  const numberedTarget = useMemo(() => getNumberedTarget(target), [target]);
  const handleHit = (value: number) => hitTarget(value, multiplier, onDartInput, setMultiplier);

  const handleMiss = () => {
    onDartInput({ value: 0, multiplier: 1 });
    setMultiplier(1);
  };

  const handleCapitalSubmit = () => submitCapitalInput(capitalInput, onDartInput, updateCapitalInput, setCapitalError);
  const handleUndoAction = () => undoKeypad(canUndoCapitalInput, updateCapitalInput, onBackspace, onUndo);
  const appendDigit = (digit: number) => updateCapitalInput((prev) => (prev + String(digit)).slice(0, 3));

  // Rangée Annuler / MISS, toujours en bas de la zone de saisie en arène (spec 072 FR-07).
  const renderActionRow = (className = 'grid-cols-2') => (
    <div className={`capital-actions grid h-12 shrink-0 gap-2 sm:h-14 ${className}`} data-testid="capital-keypad-actions">
      <Button variant="secondary" onClick={handleUndoAction} disabled={!canTriggerUndo} className="capital-action-key min-h-0 px-2 py-2 text-sm font-black text-fg-muted sm:text-lg">
        RETOUR
      </Button>
      <Button variant="danger" onClick={handleMiss} className="capital-action-key min-h-0 px-2 py-2 text-sm font-black sm:text-lg">
        MISS
      </Button>
    </div>
  );

  const renderObjectivePanel = (label: string, valueClassName: string) => (
    <div className="capital-objective-panel flex min-h-0 flex-1 items-center justify-center rounded-3xl border border-border-subtle bg-surface-tint p-4">
      <div className="text-center">
        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-fg-faint">Objectif</div>
        <div className={`mt-2 font-black text-fg ${valueClassName}`}>{label}</div>
      </div>
    </div>
  );

  if (target === 'CAPITAL') {
    const digitClassName = 'capital-key h-full min-h-0 px-1 py-1 text-lg font-bold shadow-inner transition-transform active:scale-95 sm:text-2xl md:text-3xl';
    const renderDigit = (num: number) => (
      <Button key={num} variant="secondary" data-key={`k${num}`} onClick={() => appendDigit(num)} className={digitClassName}>
        {num}
      </Button>
    );
    return (
      <div className="capital-keypad flex h-full min-h-0 flex-col gap-2 border-t border-border bg-surface-sunken p-2 shadow-up" data-capital-mode="capital">
        <div className="capital-entry-bar flex h-10 shrink-0 items-center justify-between border-b border-border bg-surface-inset px-3 sm:h-11 sm:px-4">
          <div className="capital-entry-status flex w-1/3 items-center gap-3">
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

          <div className="capital-entry-display flex flex-1 items-center justify-center">
            <div className={getCapitalInputDisplayClass(capitalInput, capitalError !== null)}>
              {capitalInput || '---'}
            </div>
          </div>

          <div className="capital-entry-undo flex w-1/3 justify-end">
            <button
              type="button"
              onClick={handleUndoAction}
              disabled={!canTriggerUndo}
              className="capital-undo-key flex items-center justify-center gap-1 rounded p-1.5 text-[9px] font-bold uppercase text-fg-faint transition-colors hover:text-fg disabled:opacity-40 sm:text-[10px]"
            >
              <span>Retour</span> <span className="text-lg">↶</span>
            </button>
          </div>
        </div>

        <div className="capital-digit-grid grid min-h-0 flex-1 grid-cols-4 grid-rows-4 gap-1.5 sm:gap-2">
          {[1, 2, 3].map(renderDigit)}
          <Button
            data-key="ok"
            onClick={handleCapitalSubmit}
            className="capital-key capital-ok-key row-span-3 h-full min-h-0 px-1 py-1 text-lg font-black sm:text-2xl md:text-3xl"
          >
            OK
          </Button>
          {[4, 5, 6, 7, 8, 9].map(renderDigit)}
          <Button
            variant="danger"
            data-key="clear"
            onClick={() => updateCapitalInput('')}
            className="capital-key h-full min-h-0 px-1 py-1 text-sm font-bold shadow-sm sm:text-lg md:text-xl"
          >
            C
          </Button>
          {renderDigit(0)}
          <Button
            variant="danger"
            data-key="miss"
            onClick={() => {
              onDartInput({ value: 0, multiplier: 1 });
              updateCapitalInput('');
            }}
            className="capital-key h-full min-h-0 px-1 py-1 text-xs font-black shadow-sm sm:text-sm md:text-base"
          >
            MISS
          </Button>
        </div>
      </div>
    );
  }

  if (target === 'CENTRE') {
    return (
      <div className="capital-keypad flex h-full min-h-0 flex-col justify-end gap-2 border-t border-border bg-surface-sunken p-2 shadow-up" data-capital-mode="fixed">
        <div className="capital-target-keys grid h-12 shrink-0 grid-cols-2 gap-2 sm:h-14">
          <BullKey multiplier={1} onClick={() => onDartInput({ value: 25, multiplier: 1 })} className="min-h-12 px-2 py-2 text-sm sm:text-lg" />
          <BullKey multiplier={2} onClick={() => onDartInput({ value: 25, multiplier: 2 })} className="min-h-12 px-2 py-2 text-sm sm:text-lg" />
        </div>
        {renderActionRow()}
        {renderObjectivePanel(`${BULL_LABELS[1]} / ${BULL_LABELS[2]}`, 'text-4xl sm:text-5xl')}
      </div>
    );
  }

  if (target === 'DOUBLE' || target === 'TRIPLE') {
    const fixedMultiplier: CapitalMultiplier = target === 'DOUBLE' ? 2 : 3;
    const prefix = target === 'DOUBLE' ? 'D' : 'T';
    return (
      <div className="capital-keypad flex h-full min-h-0 flex-col border-t border-border bg-surface-sunken p-2 shadow-up" data-capital-mode="grid">
        <div className="capital-target-grid grid min-h-0 flex-1 grid-cols-4 grid-rows-5 gap-x-1.5 gap-y-3 sm:gap-x-2 sm:gap-y-3.5">
          {(target === 'DOUBLE' ? DOUBLE_NUMBERS : TRIPLE_NUMBERS).map((value) => (
            <TargetKey
              key={`${prefix}-${value}`}
              tone={MULTIPLIER_TONES[fixedMultiplier]}
              multiplier={fixedMultiplier}
              onClick={() => onDartInput({ value, multiplier: fixedMultiplier })}
              className="h-full min-h-12 px-1 py-1 text-sm sm:text-lg"
            >
              {prefix}{value}
            </TargetKey>
          ))}
        </div>
        {target === 'DOUBLE' ? (
          <div className="capital-actions mt-3 grid h-12 shrink-0 grid-cols-3 gap-2 sm:mt-4 sm:h-14" data-testid="capital-keypad-actions">
            <BullKey multiplier={2} onClick={() => onDartInput({ value: 25, multiplier: 2 })} className="h-full min-h-12 px-2 py-2 text-sm uppercase sm:text-xl" />
            <Button variant="secondary" onClick={handleUndoAction} disabled={!canTriggerUndo} className="capital-action-key min-h-0 px-2 py-2 text-sm font-black text-fg-muted sm:text-lg">
              RETOUR
            </Button>
            <Button variant="danger" onClick={handleMiss} className="capital-action-key min-h-0 px-2 py-2 text-sm font-black sm:text-lg">
              MISS
            </Button>
          </div>
        ) : (
          <div className="mt-3 sm:mt-4">{renderActionRow()}</div>
        )}
      </div>
    );
  }

  if (numberedTarget !== null && target !== '57') {
    return (
      <div className="capital-keypad flex h-full min-h-0 flex-col justify-end gap-2 border-t border-border bg-surface-sunken p-2 shadow-up" data-capital-mode="fixed">
        <div className="capital-target-keys grid h-12 shrink-0 grid-cols-3 gap-2 sm:h-14">
          {([1, 2, 3] as const).map((fixedMultiplier) => {
            const label = `${MODE_LABELS[fixedMultiplier][0]}${numberedTarget}`;
            return (
              <TargetKey
                key={label}
                tone={MULTIPLIER_TONES[fixedMultiplier]}
                multiplier={fixedMultiplier}
                onClick={() => onDartInput({ value: numberedTarget, multiplier: fixedMultiplier })}
                className="h-full min-h-12 px-2 py-2 text-sm uppercase sm:text-xl"
              >
                {label}
              </TargetKey>
            );
          })}
        </div>
        {renderActionRow()}
        {renderObjectivePanel(String(numberedTarget), 'text-6xl sm:text-7xl')}
      </div>
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
  const numberKeyClass = `h-full min-h-12 px-2 py-2 shadow-inner active:scale-95 ${getBoardNumberTextClass(suiteTarget)}`;

  return (
    <div className={`capital-keypad flex h-full min-h-0 flex-col border-t border-border bg-surface-sunken shadow-up ${boardLayoutClasses.root}`} data-capital-mode="board">
      <div className={`capital-board-panel flex min-h-0 flex-col bg-surface-sunken ${boardLayoutClasses.panel}`}>
        <ModeSelector
          multiplier={multiplier}
          onSelect={setMultiplier}
          className={boardLayoutClasses.modes}
          textClassName={getBoardModeTextClass(suiteTarget)}
        />

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
                  className={numberKeyClass}
                >
                  {num}
                </TargetKey>
              ))}
            </div>
          ))}
        </div>

        <div className={`capital-actions grid shrink-0 grid-cols-4 ${boardLayoutClasses.actions}`} data-testid="capital-keypad-actions">
          <Button
            variant="secondary"
            onClick={handleUndoAction}
            disabled={!canTriggerUndo}
            className={`capital-action-key min-h-0 font-bold text-fg-muted ${boardLayoutClasses.undo}`}
          >
            RETOUR
          </Button>
          {multiplier === 3 ? (
            <div className="col-span-2" />
          ) : (
            <BullKey
              multiplier={getBullMultiplier(multiplier)}
              onClick={() => handleBoardHit(25)}
              className={`col-span-2 h-full min-h-12 ${boardLayoutClasses.bull}`}
            />
          )}
          <Button
            variant="danger"
            onClick={handleMiss}
            className={`capital-action-key min-h-0 font-bold ${boardLayoutClasses.miss}`}
          >
            MISS
          </Button>
        </div>
      </div>
    </div>
  );
};
