import React, { useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { CapitalDart, CapitalTarget } from '../../types';

interface CapitalKeypadProps {
  target: CapitalTarget;
  onDartInput: (dart: CapitalDart) => void;
  onUndo: () => void;
  canUndo: boolean;
  onBackspace?: () => void;
}

const BOARD_COLUMNS = [
  [1, 6, 11, 16],
  [2, 7, 12, 17],
  [3, 8, 13, 18],
  [4, 9, 14, 19],
  [5, 10, 15, 20],
];

const DOUBLE_NUMBERS = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
const TRIPLE_NUMBERS = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

export const CapitalKeypad: React.FC<CapitalKeypadProps> = ({ target, onDartInput, onUndo, canUndo, onBackspace }) => {
  const [multiplier, setMultiplier] = useState<1 | 2 | 3>(1);
  const [capitalInput, setCapitalInput] = useState('');
  const canUndoCapitalInput = target === 'CAPITAL' && capitalInput.length > 0;
  const canTriggerUndo = canUndo || canUndoCapitalInput;
  const isSuiteTarget = target === 'SUITE' || target === 'COTE_A_COTE' || target === '57' || target === 'COULEUR' || target === '21_OU_MOINS';

  const numberedTarget = useMemo(() => {
    if (!/^\d+$/.test(target)) {
      return null;
    }
    const value = parseInt(target, 10);
    return Number.isNaN(value) ? null : value;
  }, [target]);

  const handleHit = (value: number) => {
    let finalMultiplier = multiplier;
    if (value === 25 && multiplier === 3) {
      finalMultiplier = 1;
    }
    onDartInput({ value, multiplier: finalMultiplier as 1 | 2 | 3 });
    setMultiplier(1); // Reset to single after hit
  };

  const handleMiss = () => {
    onDartInput({ value: 0, multiplier: 1 });
    setMultiplier(1);
  };

  const renderFixedActionButton = (label: string, value: number, forcedMultiplier: 1 | 2 | 3, extraClass = '') => (
    <Button
      key={label}
      onClick={() => onDartInput({ value, multiplier: forcedMultiplier })}
      className={`h-full min-h-0 px-2 py-2 text-sm font-black uppercase sm:text-xl ${extraClass}`}
    >
      {label}
    </Button>
  );

  const getBullLabel = (forcedMultiplier: 1 | 2) => (forcedMultiplier === 2 ? 'BULLE (50)' : 'D-BULLE (25)');

  const handleCapitalSubmit = () => {
    const value = parseInt(capitalInput, 10);
    if (Number.isNaN(value) || value < 0 || value > 180) return;
    onDartInput({ value, multiplier: 1 });
    setCapitalInput('');
  };

  const handleUndoAction = () => {
    if (canUndoCapitalInput) {
      setCapitalInput((prev) => prev.slice(0, -1));
      onBackspace?.();
      return;
    }

    onUndo();
  };

  const boardModeButtonClass = (mode: 1 | 2 | 3) => `
    min-h-0 border px-3 py-2 font-black tracking-[0.16em] transition-all
    ${isSuiteTarget ? 'text-[11px] sm:text-sm' : 'text-xs sm:text-lg'}
    ${multiplier === mode
      ? mode === 1
        ? 'border-sky-400/70 bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-[0_16px_40px_rgba(37,99,235,0.28)]'
        : mode === 2
          ? 'border-emerald-400/70 bg-gradient-to-r from-emerald-600 to-green-500 text-white shadow-[0_16px_40px_rgba(16,185,129,0.24)]'
          : 'border-red-400/70 bg-gradient-to-r from-red-700 to-red-500 text-white shadow-[0_16px_40px_rgba(239,68,68,0.24)]'
      : 'border-slate-700 bg-slate-800/90 text-slate-200 hover:border-slate-500 hover:bg-slate-700/95'
    }
  `;

  const boardNumberButtonClass = `
    min-h-0 border px-2 py-2 font-black transition-all
    ${isSuiteTarget ? 'text-base sm:text-xl' : 'text-sm sm:text-xl'}
    border-gray-700 bg-gray-800 text-white shadow-inner active:scale-95 hover:bg-gray-700
  `;

  if (target === 'CAPITAL') {
    return (
      <div className="flex h-full min-h-0 flex-col gap-2 border-t border-gray-800 bg-gray-950 p-2 shadow-2xl">
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-gray-800 bg-black/60 px-3 sm:h-11 sm:px-4">
          <div className="flex w-1/3 items-center gap-3">
            <div className="flex items-center gap-2 opacity-80">
              <span className="text-base sm:text-lg">⌨️</span>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center">
            <div className={`text-2xl font-black tracking-[0.2em] font-mono sm:text-3xl ${capitalInput ? 'text-orange-500' : 'text-gray-700'}`}>
              {capitalInput || '---'}
            </div>
          </div>

          <div className="flex w-1/3 justify-end">
            <button
              onClick={handleUndoAction}
              disabled={!canTriggerUndo}
              className="flex items-center gap-1 p-1.5 text-[9px] font-bold uppercase text-gray-500 transition-colors hover:text-white disabled:opacity-40 sm:text-[10px]"
            >
              <span>Retour</span> <span className="text-lg">↶</span>
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-4 grid-rows-4 gap-1.5 sm:gap-2">
          {[1, 2, 3].map((num) => (
            <Button
              key={num}
              variant="secondary"
              onClick={() => setCapitalInput((prev) => (prev + String(num)).slice(0, 3))}
              className="h-full min-h-0 px-1 py-1 text-lg font-bold bg-gray-800 border-gray-700 shadow-inner transition-transform active:scale-95 hover:bg-gray-700 sm:text-2xl md:text-3xl"
            >
              {num}
            </Button>
          ))}
          <Button
            onClick={handleCapitalSubmit}
            className="row-span-3 h-full min-h-0 px-1 py-1 text-lg font-black shadow-lg shadow-orange-900/30 sm:text-2xl md:text-3xl"
          >
            OK
          </Button>
          {[4, 5, 6, 7, 8, 9].map((num) => (
            <Button
              key={num}
              variant="secondary"
              onClick={() => setCapitalInput((prev) => (prev + String(num)).slice(0, 3))}
              className="h-full min-h-0 px-1 py-1 text-lg font-bold bg-gray-800 border-gray-700 shadow-inner transition-transform active:scale-95 hover:bg-gray-700 sm:text-2xl md:text-3xl"
            >
              {num}
            </Button>
          ))}
          <Button
            variant="danger"
            onClick={() => setCapitalInput('')}
            className="h-full min-h-0 px-1 py-1 text-sm font-bold shadow-sm sm:text-lg md:text-xl"
          >
            C
          </Button>
          <Button
            variant="secondary"
            onClick={() => setCapitalInput((prev) => (prev + '0').slice(0, 3))}
            className="h-full min-h-0 px-1 py-1 text-lg font-bold bg-gray-800 border-gray-700 shadow-inner sm:text-2xl md:text-3xl"
          >
            0
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              onDartInput({ value: 0, multiplier: 1 });
              setCapitalInput('');
            }}
            className="h-full min-h-0 px-1 py-1 text-xs font-black shadow-sm sm:text-sm md:text-base"
          >
            MISS
          </Button>
        </div>
      </div>
    );
  }

  if (target === 'CENTRE') {
    return (
      <div className="flex h-full min-h-0 flex-col justify-end gap-2 border-t border-gray-800 bg-gray-950 p-2 shadow-2xl">
        <div className="grid h-12 shrink-0 grid-cols-2 gap-2 sm:h-14">
          <Button
            variant="secondary"
            onClick={() => onDartInput({ value: 25, multiplier: 1 })}
            className="min-h-0 px-2 py-2 text-sm font-black !bg-green-700 !border-green-800 !text-white hover:!bg-green-600 sm:text-lg"
          >
            D-BULLE (25)
          </Button>
          <Button
            variant="secondary"
            onClick={() => onDartInput({ value: 25, multiplier: 2 })}
            className="min-h-0 px-2 py-2 text-sm font-black !bg-red-600 !border-red-800 !text-white hover:!bg-red-500 sm:text-lg"
          >
            BULLE (50)
          </Button>
        </div>

        <div className="grid h-12 shrink-0 grid-cols-2 gap-2 sm:h-14">
          <Button variant="secondary" onClick={handleUndoAction} disabled={!canTriggerUndo} className="min-h-0 px-2 py-2 text-sm font-black text-gray-300 sm:text-lg">
            RETOUR
          </Button>
          <Button variant="danger" onClick={handleMiss} className="min-h-0 px-2 py-2 text-sm font-black sm:text-lg">
            MISS
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Objectif</div>
            <div className="mt-2 text-4xl font-black text-white sm:text-5xl">D-BULLE (25) / BULLE (50)</div>
          </div>
        </div>
      </div>
    );
  }

  if (target === 'DOUBLE') {
    return (
      <div className="flex h-full min-h-0 flex-col border-t border-gray-800 bg-gray-950 p-2 shadow-2xl">
        <div className="grid min-h-0 flex-1 grid-cols-4 grid-rows-5 gap-x-1.5 gap-y-3 sm:gap-x-2 sm:gap-y-3.5">
          {DOUBLE_NUMBERS.map((value) => (
            <Button
              key={`D-${value}`}
              variant="secondary"
              onClick={() => onDartInput({ value, multiplier: 2 })}
              className="h-full min-h-0 px-1 py-1 text-sm font-black !bg-emerald-900/80 !border-emerald-700 !text-emerald-100 hover:!bg-emerald-800 sm:text-lg"
            >
              D{value}
            </Button>
          ))}
        </div>
        <div className="mt-3 grid h-12 shrink-0 grid-cols-3 gap-2 sm:mt-4 sm:h-14">
          {renderFixedActionButton('BULLE (50)', 25, 2, 'bg-red-600 border-red-800 text-white')}
          <Button variant="secondary" onClick={handleUndoAction} disabled={!canTriggerUndo} className="min-h-0 px-2 py-2 text-sm font-black text-gray-300 sm:text-lg">
            RETOUR
          </Button>
          <Button variant="danger" onClick={handleMiss} className="min-h-0 px-2 py-2 text-sm font-black sm:text-lg">
            MISS
          </Button>
        </div>
      </div>
    );
  }

  if (target === 'TRIPLE') {
    return (
      <div className="flex h-full min-h-0 flex-col border-t border-gray-800 bg-gray-950 p-2 shadow-2xl">
        <div className="grid min-h-0 flex-1 grid-cols-4 grid-rows-5 gap-x-1.5 gap-y-3 sm:gap-x-2 sm:gap-y-3.5">
          {TRIPLE_NUMBERS.map((value) => (
            <Button
              key={`T-${value}`}
              onClick={() => onDartInput({ value, multiplier: 3 })}
              className="h-full min-h-0 px-1 py-1 text-sm font-black bg-orange-900/60 border-orange-800 text-orange-200 sm:text-lg"
            >
              T{value}
            </Button>
          ))}
        </div>
        <div className="mt-3 grid h-12 shrink-0 grid-cols-2 gap-2 sm:mt-4 sm:h-14">
          {numberedTarget === 20 ? (
            <>
              <Button variant="secondary" onClick={handleUndoAction} disabled={!canTriggerUndo} className="min-h-0 px-2 py-2 text-sm font-black text-gray-300 sm:text-lg">
                RETOUR
              </Button>
              <Button variant="danger" onClick={handleMiss} className="min-h-0 px-2 py-2 text-sm font-black sm:text-lg">
                MISS
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={handleUndoAction} disabled={!canTriggerUndo} className="min-h-0 px-2 py-2 text-sm font-black text-gray-300 sm:text-lg">
                RETOUR
              </Button>
              <Button variant="danger" onClick={handleMiss} className="min-h-0 px-2 py-2 text-sm font-black sm:text-lg">
                MISS
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (target === '57') {
    return (
      <div className="flex h-full min-h-0 flex-col justify-end gap-2.5 border-t border-gray-800 bg-gray-950 p-2 pt-1 shadow-2xl sm:gap-3 sm:px-4 sm:pb-4 sm:pt-1.5">
        <div className="bg-gradient-to-b from-slate-950 via-slate-950 to-black px-3 pb-3 pt-1 sm:px-4 sm:pb-4 sm:pt-1.5">
          <div className="grid h-14 shrink-0 grid-cols-3 gap-3 sm:h-16 sm:gap-4">
            <Button variant="secondary" onClick={() => setMultiplier(1)} className={boardModeButtonClass(1)}>
              SIMPLE
            </Button>
            <Button variant="secondary" onClick={() => setMultiplier(2)} className={boardModeButtonClass(2)}>
              DOUBLE
            </Button>
            <Button variant="secondary" onClick={() => setMultiplier(3)} className={boardModeButtonClass(3)}>
              TRIPLE
            </Button>
          </div>

          <div className="mt-3 grid min-h-0 flex-1 grid-cols-5 gap-2.5 sm:mt-4 sm:gap-3.5">
            {BOARD_COLUMNS.map((column, columnIndex) => (
              <div key={`57-column-${columnIndex}`} className="grid min-h-0 grid-rows-4 bg-slate-900/20 p-0 gap-2 sm:gap-2.5">
                {column.map((num) => (
                  <Button
                    key={`57-${num}`}
                    variant="secondary"
                    onClick={() => onDartInput({ value: num, multiplier })}
                    className={boardNumberButtonClass}
                  >
                    {num}
                  </Button>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-3 grid h-14 shrink-0 grid-cols-4 gap-3 sm:mt-4 sm:h-16 sm:gap-4">
            <Button
              variant="secondary"
              onClick={handleUndoAction}
              disabled={!canTriggerUndo}
              className="min-h-0 border border-slate-700 bg-slate-800/95 px-3 py-2 text-[11px] font-bold text-slate-300 shadow-[0_12px_28px_rgba(15,23,42,0.2)] hover:border-slate-500 hover:bg-slate-700 sm:text-sm"
            >
              RETOUR
            </Button>
            {multiplier !== 3 ? (
              <Button
                onClick={() => onDartInput({ value: 25, multiplier: multiplier === 2 ? 2 : 1 })}
                className={`
                  col-span-2 min-h-0 border px-3 py-2 text-[11px] font-black transition-all sm:text-lg
                  ${multiplier === 2
                    ? 'border-red-700/80 bg-gradient-to-r from-red-700 to-red-500 text-white shadow-[0_16px_36px_rgba(220,38,38,0.3)] hover:from-red-600 hover:to-red-500'
                    : 'border-emerald-700/80 bg-gradient-to-r from-emerald-700 to-green-500 text-white shadow-[0_16px_36px_rgba(16,185,129,0.26)] hover:from-emerald-600 hover:to-green-400'
                  }
                `}
              >
                {getBullLabel(multiplier === 2 ? 2 : 1)}
              </Button>
            ) : (
              <div className="col-span-2" />
            )}
            <Button
              variant="danger"
              onClick={handleMiss}
              className="min-h-0 border border-red-900/70 bg-gradient-to-b from-red-950 to-red-900/80 px-3 py-2 text-[11px] font-bold text-red-100 shadow-[0_12px_28px_rgba(127,29,29,0.22)] hover:from-red-900 hover:to-red-800 sm:text-lg"
            >
              MISS
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (numberedTarget !== null) {
    return (
      <div className="flex h-full min-h-0 flex-col justify-end gap-2 border-t border-gray-800 bg-gray-950 p-2 shadow-2xl">
        <div className="grid h-12 shrink-0 grid-cols-3 gap-2 sm:h-14">
          {renderFixedActionButton(`S${numberedTarget}`, numberedTarget, 1, 'bg-gray-800 border-gray-700 text-white')}
          {renderFixedActionButton(`D${numberedTarget}`, numberedTarget, 2, 'bg-cyan-900/70 border-cyan-700 text-cyan-200')}
          {renderFixedActionButton(`T${numberedTarget}`, numberedTarget, 3, 'bg-orange-900/70 border-orange-700 text-orange-200')}
        </div>

        <div className="grid h-12 shrink-0 grid-cols-2 gap-2 sm:h-14">
          <Button variant="secondary" onClick={handleUndoAction} disabled={!canTriggerUndo} className="min-h-0 px-2 py-2 text-sm font-black text-gray-300 sm:text-lg">
            RETOUR
          </Button>
          <Button variant="danger" onClick={handleMiss} className="min-h-0 px-2 py-2 text-sm font-black sm:text-lg">
            MISS
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Objectif</div>
            <div className="mt-2 text-6xl font-black text-white sm:text-7xl">{numberedTarget}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-full min-h-0 flex-col border-t border-gray-800 bg-gray-950 shadow-2xl ${isSuiteTarget ? 'justify-end gap-2.5 p-2 pt-1 sm:gap-3 sm:px-4 sm:pb-4 sm:pt-1.5' : 'gap-2 p-2'}`}>
      <div className={`bg-gradient-to-b from-slate-950 via-slate-950 to-black ${isSuiteTarget ? 'px-3 pb-3 pt-1 sm:px-4 sm:pb-4 sm:pt-1.5' : 'px-2 py-2.5'}`}>
        <div className={`grid shrink-0 grid-cols-3 ${isSuiteTarget ? 'h-14 gap-3 sm:h-16 sm:gap-4' : 'h-12 gap-2 sm:h-14'}`}>
        <Button 
          variant="secondary"
          onClick={() => setMultiplier(1)}
          className={boardModeButtonClass(1)}
        >
          SIMPLE
        </Button>
        <Button 
          variant="secondary"
          onClick={() => setMultiplier(2)}
          className={boardModeButtonClass(2)}
        >
          DOUBLE
        </Button>
        <Button 
          variant="secondary"
          onClick={() => setMultiplier(3)}
          className={boardModeButtonClass(3)}
        >
          TRIPLE
        </Button>
        </div>

        <div className={`${isSuiteTarget ? 'mt-3 sm:mt-4' : 'mt-2'} grid min-h-0 flex-1 grid-cols-5 ${isSuiteTarget ? 'gap-2.5 sm:gap-3.5' : 'gap-1.5 sm:gap-2'}`}>
          {BOARD_COLUMNS.map((column, columnIndex) => (
            <div
              key={`column-${columnIndex}`}
              className={`grid min-h-0 grid-rows-4 bg-slate-900/20 p-0 ${isSuiteTarget ? 'gap-2 sm:gap-2.5' : 'gap-1.5'}`}
            >
              {column.map((num) => (
                <Button
                  key={num}
                  variant="secondary"
                  onClick={() => handleHit(num)}
                  className={boardNumberButtonClass}
                >
                  {num}
                </Button>
              ))}
            </div>
          ))}
        </div>

        <div className={`${isSuiteTarget ? 'mt-3 sm:mt-4' : 'mt-2'} grid shrink-0 grid-cols-4 ${isSuiteTarget ? 'h-14 gap-3 sm:h-16 sm:gap-4' : 'h-12 gap-2 sm:h-14'}`}>
        <Button 
          variant="secondary" 
          onClick={handleUndoAction} 
          disabled={!canTriggerUndo} 
          className={`min-h-0 border border-slate-700 bg-slate-800/95 font-bold text-slate-300 shadow-[0_12px_28px_rgba(15,23,42,0.2)] hover:border-slate-500 hover:bg-slate-700 ${isSuiteTarget ? 'px-3 py-2 text-[11px] sm:text-sm' : 'px-2 py-1 text-[10px] sm:text-sm'}`}
        >
          RETOUR
        </Button>
        {multiplier !== 3 ? (
          <Button 
            onClick={() => handleHit(25)}
            className={`
              col-span-2 min-h-0 border font-black transition-all
              ${isSuiteTarget ? 'px-3 py-2 text-[11px] sm:text-lg' : 'px-2 py-1 text-xs sm:text-xl'}
              ${multiplier === 2
                ? 'border-red-700/80 bg-gradient-to-r from-red-700 to-red-500 text-white shadow-[0_16px_36px_rgba(220,38,38,0.3)] hover:from-red-600 hover:to-red-500'
                : 'border-emerald-700/80 bg-gradient-to-r from-emerald-700 to-green-500 text-white shadow-[0_16px_36px_rgba(16,185,129,0.26)] hover:from-emerald-600 hover:to-green-400'
              }
            `}
          >
            {getBullLabel(multiplier === 2 ? 2 : 1)}
          </Button>
        ) : (
          <div className="col-span-2" />
        )}
        <Button 
          variant="danger" 
          onClick={handleMiss} 
          className={`min-h-0 border border-red-900/70 bg-gradient-to-b from-red-950 to-red-900/80 font-bold text-red-100 shadow-[0_12px_28px_rgba(127,29,29,0.22)] hover:from-red-900 hover:to-red-800 ${isSuiteTarget ? 'px-3 py-2 text-[11px] sm:text-lg' : 'px-2 py-1 text-xs sm:text-lg'}`}
        >
          MISS
        </Button>
        </div>
      </div>
    </div>
  );
};
