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

const BOARD_NUMBERS = [
  20, 1, 18, 4, 13,
  6, 10, 15, 2, 17,
  3, 19, 7, 16, 8,
  11, 14, 9, 12, 5,
];

const DOUBLE_NUMBERS = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
const TRIPLE_NUMBERS = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

export const CapitalKeypad: React.FC<CapitalKeypadProps> = ({ target, onDartInput, onUndo, canUndo, onBackspace }) => {
  const [multiplier, setMultiplier] = useState<1 | 2 | 3>(1);
  const [capitalInput, setCapitalInput] = useState('');
  const canUndoCapitalInput = target === 'CAPITAL' && capitalInput.length > 0;
  const canTriggerUndo = canUndo || canUndoCapitalInput;

  const numberedTarget = useMemo(() => {
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
      <div className="flex h-full min-h-0 flex-col gap-2 border-t border-gray-800 bg-gray-950 p-2 shadow-2xl">
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-2">
          {renderFixedActionButton('BULL', 25, 1, 'bg-green-700 border-green-800 text-white text-xl')}
          {renderFixedActionButton('D-BULL', 25, 2, 'bg-red-600 border-red-800 text-white text-xl')}
          <Button variant="danger" onClick={handleMiss} className="min-h-0 px-2 py-2 text-lg font-black">
            MISS
          </Button>
          <Button variant="secondary" onClick={handleUndoAction} disabled={!canTriggerUndo} className="min-h-0 px-2 py-2 text-lg font-black text-gray-300">
            RETOUR
          </Button>
        </div>
      </div>
    );
  }

  if (target === 'DOUBLE') {
    return (
      <div className="flex h-full min-h-0 flex-col gap-2 border-t border-gray-800 bg-gray-950 p-2 shadow-2xl">
        <div className="grid min-h-0 flex-1 grid-cols-4 gap-1.5 sm:gap-2">
          {DOUBLE_NUMBERS.map((value) => (
            <Button
              key={`D-${value}`}
              onClick={() => onDartInput({ value, multiplier: 2 })}
              className="h-full min-h-0 px-1 py-1 text-sm font-black bg-cyan-900/60 border-cyan-800 text-cyan-200 sm:text-lg"
            >
              D{value}
            </Button>
          ))}
        </div>
        <div className="grid h-12 shrink-0 grid-cols-3 gap-2 sm:h-14">
          {renderFixedActionButton('D-BULL', 25, 2, 'bg-red-600 border-red-800 text-white')}
          <Button variant="danger" onClick={handleMiss} className="min-h-0 px-2 py-2 text-sm font-black sm:text-lg">
            MISS
          </Button>
          <Button variant="secondary" onClick={handleUndoAction} disabled={!canTriggerUndo} className="min-h-0 px-2 py-2 text-sm font-black text-gray-300 sm:text-lg">
            RETOUR
          </Button>
        </div>
      </div>
    );
  }

  if (target === 'TRIPLE') {
    return (
      <div className="flex h-full min-h-0 flex-col gap-2 border-t border-gray-800 bg-gray-950 p-2 shadow-2xl">
        <div className="grid min-h-0 flex-1 grid-cols-4 gap-1.5 sm:gap-2">
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
        <div className="grid h-12 shrink-0 grid-cols-2 gap-2 sm:h-14">
          <Button variant="danger" onClick={handleMiss} className="min-h-0 px-2 py-2 text-sm font-black sm:text-lg">
            MISS
          </Button>
          <Button variant="secondary" onClick={handleUndoAction} disabled={!canTriggerUndo} className="min-h-0 px-2 py-2 text-sm font-black text-gray-300 sm:text-lg">
            RETOUR
          </Button>
        </div>
      </div>
    );
  }

  if (target === '57') {
    const values = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

    return (
      <div className="flex h-full min-h-0 flex-col gap-2 border-t border-gray-800 bg-gray-950 p-2 shadow-2xl">
        <div className="grid h-12 shrink-0 grid-cols-3 gap-2 sm:h-14">
          <Button
            variant={multiplier === 1 ? 'primary' : 'secondary'}
            onClick={() => setMultiplier(1)}
            className={`min-h-0 px-2 py-1 text-xs font-bold sm:text-lg ${multiplier === 1 ? 'bg-white text-black' : 'bg-gray-800 text-cyan-300'}`}
          >
            SIMPLE
          </Button>
          <Button
            variant={multiplier === 2 ? 'primary' : 'secondary'}
            onClick={() => setMultiplier(2)}
            className={`min-h-0 px-2 py-1 text-xs font-bold sm:text-lg ${multiplier === 2 ? 'bg-cyan-500 text-black' : 'bg-gray-800 text-orange-300'}`}
          >
            DOUBLE
          </Button>
          <Button
            variant={multiplier === 3 ? 'primary' : 'secondary'}
            onClick={() => setMultiplier(3)}
            className={`min-h-0 px-2 py-1 text-xs font-bold sm:text-lg ${multiplier === 3 ? 'bg-orange-500 text-black' : 'bg-gray-800 text-white'}`}
          >
            TRIPLE
          </Button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-5 grid-rows-4 gap-1.5 sm:gap-2">
          {values.map((value) => (
            <Button
              key={`57-${value}`}
              onClick={() => onDartInput({ value, multiplier })}
              className={`
                h-full min-h-0 px-1 py-1 text-sm font-black border-b-2 active:border-b-0 active:translate-y-0.5 transition-all sm:text-xl
                ${multiplier === 1 ? 'bg-gray-800 hover:bg-gray-700 text-white border-gray-900' : ''}
                ${multiplier === 2 ? 'bg-cyan-900/50 hover:bg-cyan-800 text-cyan-300 border-cyan-900' : ''}
                ${multiplier === 3 ? 'bg-orange-900/50 hover:bg-orange-800 text-orange-200 border-orange-900' : ''}
              `}
            >
              {value}
            </Button>
          ))}
        </div>

        <div className="grid h-12 shrink-0 grid-cols-4 gap-2 sm:h-14">
          <Button
            onClick={() => onDartInput({ value: 25, multiplier: 1 })}
            className="min-h-0 px-2 py-1 text-xs font-black bg-green-700 border-green-900 text-white sm:text-lg"
          >
            BULL
          </Button>
          <Button
            onClick={() => onDartInput({ value: 25, multiplier: 2 })}
            className="min-h-0 px-2 py-1 text-xs font-black bg-red-600 border-red-800 text-white sm:text-lg"
          >
            D-BULL
          </Button>
          <Button variant="danger" onClick={handleMiss} className="min-h-0 px-2 py-1 text-xs font-bold sm:text-lg">
            MISS
          </Button>
          <Button variant="secondary" onClick={handleUndoAction} disabled={!canTriggerUndo} className="min-h-0 px-2 py-1 text-[10px] font-bold text-gray-400 sm:text-sm">
            RETOUR
          </Button>
        </div>
      </div>
    );
  }

  if (target === '17_OU_MOINS') {
    const values = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

    return (
      <div className="flex h-full min-h-0 flex-col gap-2 border-t border-gray-800 bg-gray-950 p-2 shadow-2xl">
        <div className="grid h-12 shrink-0 grid-cols-3 gap-2 sm:h-14">
          <Button
            variant={multiplier === 1 ? 'primary' : 'secondary'}
            onClick={() => setMultiplier(1)}
            className={`min-h-0 px-2 py-1 text-xs font-bold sm:text-lg ${multiplier === 1 ? 'bg-white text-black' : 'bg-gray-800 text-cyan-300'}`}
          >
            SIMPLE
          </Button>
          <Button
            variant={multiplier === 2 ? 'primary' : 'secondary'}
            onClick={() => setMultiplier(2)}
            className={`min-h-0 px-2 py-1 text-xs font-bold sm:text-lg ${multiplier === 2 ? 'bg-cyan-500 text-black' : 'bg-gray-800 text-orange-300'}`}
          >
            DOUBLE
          </Button>
          <Button
            variant={multiplier === 3 ? 'primary' : 'secondary'}
            onClick={() => setMultiplier(3)}
            className={`min-h-0 px-2 py-1 text-xs font-bold sm:text-lg ${multiplier === 3 ? 'bg-orange-500 text-black' : 'bg-gray-800 text-white'}`}
          >
            TRIPLE
          </Button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-5 grid-rows-4 gap-1.5 sm:gap-2">
          {values.map((value) => (
            <Button
              key={`lt21-${value}`}
              onClick={() => onDartInput({ value, multiplier })}
              className={`
                h-full min-h-0 px-1 py-1 text-sm font-black border-b-2 active:border-b-0 active:translate-y-0.5 transition-all sm:text-xl
                ${multiplier === 1 ? 'bg-gray-800 hover:bg-gray-700 text-white border-gray-900' : ''}
                ${multiplier === 2 ? 'bg-cyan-900/50 hover:bg-cyan-800 text-cyan-300 border-cyan-900' : ''}
                ${multiplier === 3 ? 'bg-orange-900/50 hover:bg-orange-800 text-orange-200 border-orange-900' : ''}
              `}
            >
              {value}
            </Button>
          ))}
        </div>

        <div className="grid h-12 shrink-0 grid-cols-4 gap-2 sm:h-14">
          <Button
            onClick={() => onDartInput({ value: 25, multiplier: 1 })}
            className="min-h-0 px-2 py-1 text-xs font-black bg-green-700 border-green-900 text-white sm:text-lg"
          >
            BULL
          </Button>
          <Button
            onClick={() => onDartInput({ value: 25, multiplier: 2 })}
            className="min-h-0 px-2 py-1 text-xs font-black bg-red-600 border-red-800 text-white sm:text-lg"
          >
            D-BULL
          </Button>
          <Button variant="danger" onClick={handleMiss} className="min-h-0 px-2 py-1 text-xs font-bold sm:text-lg">
            MISS
          </Button>
          <Button variant="secondary" onClick={handleUndoAction} disabled={!canTriggerUndo} className="min-h-0 px-2 py-1 text-[10px] font-bold text-gray-400 sm:text-sm">
            RETOUR
          </Button>
        </div>
      </div>
    );
  }

  if (numberedTarget !== null) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-2 border-t border-gray-800 bg-gray-950 p-2 shadow-2xl">
        <div className="grid h-12 shrink-0 grid-cols-3 gap-2 sm:h-14">
          {renderFixedActionButton(`S${numberedTarget}`, numberedTarget, 1, 'bg-gray-800 border-gray-700 text-white')}
          {renderFixedActionButton(`D${numberedTarget}`, numberedTarget, 2, 'bg-cyan-900/70 border-cyan-700 text-cyan-200')}
          {renderFixedActionButton(`T${numberedTarget}`, numberedTarget, 3, 'bg-orange-900/70 border-orange-700 text-orange-200')}
        </div>

        <div className="grid h-12 shrink-0 grid-cols-2 gap-2 sm:h-14">
          <Button variant="danger" onClick={handleMiss} className="min-h-0 px-2 py-2 text-sm font-black sm:text-lg">
            MISS
          </Button>
          <Button variant="secondary" onClick={handleUndoAction} disabled={!canTriggerUndo} className="min-h-0 px-2 py-2 text-sm font-black text-gray-300 sm:text-lg">
            RETOUR
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
    <div className="flex h-full min-h-0 flex-col gap-2 border-t border-gray-800 bg-gray-950 p-2 shadow-2xl">
      <div className="grid h-12 shrink-0 grid-cols-3 gap-2 sm:h-14">
        <Button 
          variant={multiplier === 1 ? 'primary' : 'secondary'}
          onClick={() => setMultiplier(1)}
          className={`min-h-0 px-2 py-1 text-xs font-bold sm:text-lg ${multiplier === 1 ? 'bg-white text-black' : 'bg-gray-800 text-gray-400'}`}
        >
          SIMPLE
        </Button>
        <Button 
          variant={multiplier === 2 ? 'primary' : 'secondary'}
          onClick={() => setMultiplier(2)}
          className={`min-h-0 px-2 py-1 text-xs font-bold sm:text-lg ${multiplier === 2 ? 'bg-cyan-500 text-black' : 'bg-gray-800 text-cyan-500'}`}
        >
          DOUBLE
        </Button>
        <Button 
          variant={multiplier === 3 ? 'primary' : 'secondary'}
          onClick={() => setMultiplier(3)}
          className={`min-h-0 px-2 py-1 text-xs font-bold sm:text-lg ${multiplier === 3 ? 'bg-orange-500 text-black' : 'bg-gray-800 text-orange-500'}`}
        >
          TRIPLE
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-5 grid-rows-4 gap-1.5 sm:gap-2">
        {BOARD_NUMBERS.map(num => (
          <Button
            key={num}
            onClick={() => handleHit(num)}
            className={`
              h-full min-h-0 px-1 py-1 text-sm font-black border-b-2 active:border-b-0 active:translate-y-0.5 transition-all sm:text-xl
              ${multiplier === 1 ? 'bg-gray-800 hover:bg-gray-700 text-white border-gray-900' : ''}
              ${multiplier === 2 ? 'bg-cyan-900/50 hover:bg-cyan-800 text-cyan-400 border-cyan-900' : ''}
              ${multiplier === 3 ? 'bg-orange-900/50 hover:bg-orange-800 text-orange-400 border-orange-900' : ''}
            `}
          >
            {num}
          </Button>
        ))}
      </div>

      <div className="grid h-12 shrink-0 grid-cols-4 gap-2 sm:h-14">
        <Button 
          onClick={() => handleHit(25)}
          className={`
            col-span-2 min-h-0 px-2 py-1 text-xs font-black border-b-2 active:border-b-0 active:translate-y-0.5 transition-all sm:text-xl
            ${multiplier === 2 ? 'bg-red-600 hover:bg-red-500 text-white border-red-800' : 'bg-green-700 hover:bg-green-600 text-white border-green-900'}
          `}
        >
          {multiplier === 2 ? 'D-BULL' : 'BULL'}
        </Button>
        <Button 
          variant="danger" 
          onClick={handleMiss} 
          className="min-h-0 px-2 py-1 text-xs font-bold sm:text-lg"
        >
          MISS
        </Button>
        <Button 
          variant="secondary" 
          onClick={handleUndoAction} 
          disabled={!canTriggerUndo} 
          className="min-h-0 px-2 py-1 text-[10px] font-bold text-gray-400 sm:text-sm"
        >
          RETOUR
        </Button>
      </div>
    </div>
  );
};
