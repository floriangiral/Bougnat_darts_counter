// Spec: spec:counter/inp-phase1-quick-wins
import React, { useEffect, useRef } from 'react';
import { Button } from '../ui/Button';
import { InOutRule } from '../../types';
import { getMinDartsForScore } from '../../src/application/scoring/matchStats';

interface KeypadProps {
  onInput: (val: number) => void;
  onClear: () => void;
  onEnter: () => void;
  onRemaining?: () => void;
  onCheckoutShortcut?: (dartsUsed: number) => void;
  currentInput: string;
  isCheckoutPossible: boolean;
  checkoutScore?: number;
  checkoutRule?: InOutRule;
  // Quick Actions
  quickShortcutsLeft?: number[];
  quickShortcutsRight?: number[];
  onQuickAction?: (val: number) => void;
  voiceControl?: React.ReactNode;
  disabled?: boolean;
}

export const Keypad: React.FC<KeypadProps> = ({ 
  onInput, 
  onClear, 
  onEnter, 
  onRemaining,
  onCheckoutShortcut,
  currentInput, 
  isCheckoutPossible,
  checkoutScore,
  checkoutRule = 'Double' as InOutRule,
  quickShortcutsLeft = [],
  quickShortcutsRight = [],
  onQuickAction,
  voiceControl,
  disabled = false,
}) => {
  const digitTextClass = 'text-[1.6875rem] sm:text-[2rem] md:text-[3rem]';
  // Refs avoid stale closures in pointer event handlers fired before React re-renders.
  const longPressTimeoutRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);

  const clearLongPress = () => {
    if (longPressTimeoutRef.current !== null) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  const startLongPress = (dartsUsed: number) => {
    if (!isCheckoutPossible || !onCheckoutShortcut || typeof checkoutScore !== 'number') return;

    clearLongPress();
    longPressTriggeredRef.current = false;
    longPressTimeoutRef.current = window.setTimeout(() => {
      const minDarts = getMinDartsForScore(checkoutScore, checkoutRule);
      if (dartsUsed >= minDarts) {
        longPressTriggeredRef.current = true;
        onCheckoutShortcut(dartsUsed);
      }
      longPressTimeoutRef.current = null;
    }, 450);
  };

  useEffect(() => {
    return () => {
      if (longPressTimeoutRef.current !== null) {
        window.clearTimeout(longPressTimeoutRef.current);
      }
    };
  }, []);

  /**
   * For buttons 1/2/3: merges long-press start (onPointerDown) and tap detection (onPointerUp).
   * onTap fires only when the press is released before the 450ms long-press threshold.
   */
  const createLongPressProps = (dartsUsed: number, onTap: () => void) => ({
    onPointerDown: (e: React.PointerEvent) => {
      if (!e.isPrimary) return;
      startLongPress(dartsUsed);
    },
    onPointerUp: (e: React.PointerEvent) => {
      if (!e.isPrimary) return;
      clearLongPress();
      if (!longPressTriggeredRef.current) {
        onTap();
      }
      longPressTriggeredRef.current = false;
    },
    onPointerLeave: clearLongPress,
    onPointerCancel: clearLongPress,
  });

  /** For buttons 4-9/0 and shortcuts: instant response on first contact. */
  const createDigitProps = (digit: number) => ({
    onPointerDown: (e: React.PointerEvent) => {
      if (!e.isPrimary) return;
      onInput(digit);
    },
  });

  const renderFinishShortcutLabel = (dartsUsed: number) => {
    if (!isCheckoutPossible || typeof checkoutScore !== 'number') return null;
    const minDarts = getMinDartsForScore(checkoutScore, checkoutRule);
    if (dartsUsed < minDarts) return null;

    return (
      <span className="pointer-events-none absolute inset-x-1 bottom-1 block whitespace-nowrap text-center text-[7px] font-bold uppercase leading-none tracking-[0.04em] text-gray-500 sm:text-[8px]">
        darts to finish
      </span>
    );
  };

  const canFinishWithDarts = (dartsUsed: number) => {
    if (!isCheckoutPossible || typeof checkoutScore !== 'number') return false;
    return dartsUsed >= getMinDartsForScore(checkoutScore, checkoutRule);
  };

  return (
    <div className="flex h-full min-h-0 gap-1.5 sm:gap-2">
      
      {/* LEFT SHORTCUTS */}
      {quickShortcutsLeft.length > 0 && (
        <div className="hidden md:grid w-20 shrink-0 grid-rows-4 gap-1.5 sm:gap-2 lg:w-24">
           {quickShortcutsLeft.map((val, idx) => (
               <Button 
                  key={`L-${idx}`} 
                  variant="secondary" 
                  disabled={disabled}
                  onPointerDown={(e) => { if (!e.isPrimary) return; onQuickAction && onQuickAction(val); }}
                  className="h-full min-h-0 px-1 py-1 text-sm font-black bg-gray-900/80 border-gray-800 text-cyan-500 hover:text-white hover:bg-cyan-900 hover:border-cyan-500/50 shadow-lg transition-all sm:text-base lg:text-xl"
               >
                  {val}
               </Button>
           ))}
        </div>
      )}

      {/* CENTER NUMPAD */}
      <div className="grid min-h-0 flex-1 grid-cols-4 grid-rows-4 gap-1.5 sm:gap-2">
        <Button
          variant="secondary"
          disabled={disabled}
          {...createLongPressProps(1, () => onInput(1))}
          data-testid="x01-keypad-1"
          className={`relative h-full min-h-0 px-1 py-1 font-bold shadow-inner transition-transform active:scale-95 hover:bg-gray-700 ${digitTextClass} ${
            canFinishWithDarts(1)
              ? 'bg-gradient-to-b from-orange-950/30 to-gray-800 border-orange-500/25 shadow-[inset_0_0_0_1px_rgba(249,115,22,0.08)]'
              : 'bg-gray-800 border-gray-700'
          }`}
          title={isCheckoutPossible ? 'Appui long: finish en 1 flèche' : undefined}
        >
          <span className="leading-none">1</span>
          {renderFinishShortcutLabel(1)}
        </Button>
        <Button
          variant="secondary"
          disabled={disabled}
          {...createLongPressProps(2, () => onInput(2))}
          data-testid="x01-keypad-2"
          className={`relative h-full min-h-0 px-1 py-1 font-bold shadow-inner transition-transform active:scale-95 hover:bg-gray-700 ${digitTextClass} ${
            canFinishWithDarts(2)
              ? 'bg-gradient-to-b from-orange-950/30 to-gray-800 border-orange-500/25 shadow-[inset_0_0_0_1px_rgba(249,115,22,0.08)]'
              : 'bg-gray-800 border-gray-700'
          }`}
          title={isCheckoutPossible ? 'Appui long: finish en 2 flèches' : undefined}
        >
          <span className="leading-none">2</span>
          {renderFinishShortcutLabel(2)}
        </Button>
        <Button
          variant="secondary"
          disabled={disabled}
          {...createLongPressProps(3, () => onInput(3))}
          data-testid="x01-keypad-3"
          className={`relative h-full min-h-0 px-1 py-1 font-bold shadow-inner transition-transform active:scale-95 hover:bg-gray-700 ${digitTextClass} ${
            canFinishWithDarts(3)
              ? 'bg-gradient-to-b from-orange-950/30 to-gray-800 border-orange-500/25 shadow-[inset_0_0_0_1px_rgba(249,115,22,0.08)]'
              : 'bg-gray-800 border-gray-700'
          }`}
          title={isCheckoutPossible ? 'Appui long: finish en 3 flèches' : undefined}
        >
          <span className="leading-none">3</span>
          {renderFinishShortcutLabel(3)}
        </Button>
        <Button
          variant="secondary"
          disabled={disabled}
          onClick={onRemaining}
          data-testid="x01-keypad-remaining"
          className="h-full min-h-0 !border-cyan-500/45 !bg-cyan-950/60 px-1 py-1 text-xs font-black !text-cyan-200 shadow-inner hover:!border-cyan-400/70 hover:!bg-cyan-900/70 hover:!text-white sm:text-sm md:text-base"
          title="Indiquer le score restant"
        >
          RESTE
        </Button>
        <Button
          variant="secondary"
          disabled={disabled}
          {...createDigitProps(4)}
          data-testid="x01-keypad-4"
          className={`h-full min-h-0 px-1 py-1 font-bold bg-gray-800 border-gray-700 shadow-inner transition-transform active:scale-95 hover:bg-gray-700 ${digitTextClass}`}
        >
          4
        </Button>
        <Button
          variant="secondary"
          disabled={disabled}
          {...createDigitProps(5)}
          data-testid="x01-keypad-5"
          className={`h-full min-h-0 px-1 py-1 font-bold bg-gray-800 border-gray-700 shadow-inner transition-transform active:scale-95 hover:bg-gray-700 ${digitTextClass}`}
        >
          5
        </Button>
        <Button
          variant="secondary"
          disabled={disabled}
          {...createDigitProps(6)}
          data-testid="x01-keypad-6"
          className={`h-full min-h-0 px-1 py-1 font-bold bg-gray-800 border-gray-700 shadow-inner transition-transform active:scale-95 hover:bg-gray-700 ${digitTextClass}`}
        >
          6
        </Button>
        {voiceControl ?? <div className="row-span-2" />}
        <Button
          variant="secondary"
          disabled={disabled}
          {...createDigitProps(7)}
          data-testid="x01-keypad-7"
          className={`h-full min-h-0 px-1 py-1 font-bold bg-gray-800 border-gray-700 shadow-inner transition-transform active:scale-95 hover:bg-gray-700 ${digitTextClass}`}
        >
          7
        </Button>
        <Button
          variant="secondary"
          disabled={disabled}
          {...createDigitProps(8)}
          data-testid="x01-keypad-8"
          className={`h-full min-h-0 px-1 py-1 font-bold bg-gray-800 border-gray-700 shadow-inner transition-transform active:scale-95 hover:bg-gray-700 ${digitTextClass}`}
        >
          8
        </Button>
        <Button
          variant="secondary"
          disabled={disabled}
          {...createDigitProps(9)}
          data-testid="x01-keypad-9"
          className={`h-full min-h-0 px-1 py-1 font-bold bg-gray-800 border-gray-700 shadow-inner transition-transform active:scale-95 hover:bg-gray-700 ${digitTextClass}`}
        >
          9
        </Button>
        <Button variant="danger" disabled={disabled} onClick={onClear} data-testid="x01-keypad-clear" className="h-full min-h-0 px-1 py-1 text-sm font-bold shadow-sm sm:text-lg md:text-xl">C</Button>
        <Button
          variant="secondary"
          disabled={disabled}
          {...createDigitProps(0)}
          data-testid="x01-keypad-0"
          className={`h-full min-h-0 px-1 py-1 font-bold bg-gray-800 border-gray-700 shadow-inner transition-transform active:scale-95 hover:bg-gray-700 ${digitTextClass}`}
        >
          0
        </Button>
        <Button disabled={disabled} onClick={onEnter} data-testid="x01-keypad-ok" className="col-span-2 h-full min-h-0 px-1 py-1 text-lg font-black shadow-lg shadow-orange-900/30 sm:text-2xl md:text-3xl">OK</Button>
      </div>

      {/* RIGHT SHORTCUTS */}
      {quickShortcutsRight.length > 0 && (
        <div className="hidden md:grid w-20 shrink-0 grid-rows-4 gap-1.5 sm:gap-2 lg:w-24">
           {quickShortcutsRight.map((val, idx) => (
               <Button 
                  key={`R-${idx}`} 
                  variant="secondary" 
                  disabled={disabled}
                  onPointerDown={(e) => { if (!e.isPrimary) return; onQuickAction && onQuickAction(val); }}
                  className="h-full min-h-0 px-1 py-1 text-sm font-black bg-gray-900/80 border-gray-800 text-orange-500 hover:text-white hover:bg-orange-900 hover:border-orange-500/50 shadow-lg transition-all sm:text-base lg:text-xl"
               >
                  {val}
               </Button>
           ))}
        </div>
      )}

    </div>
  );
};
