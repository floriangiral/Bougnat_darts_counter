// Spec: spec:counter/inp-phase1-quick-wins
import React, { useCallback, useEffect, useRef } from 'react';
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
  /** Phone row above the keypad (hidden from md, where the side columns take over). Empty = no row. */
  quickShortcutsMobile?: number[];
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
  currentInput: _currentInput,
  isCheckoutPossible,
  checkoutScore,
  checkoutRule = 'Double',
  quickShortcutsLeft = [],
  quickShortcutsRight = [],
  quickShortcutsMobile = [],
  onQuickAction,
  voiceControl,
  disabled = false,
}) => {
  // From md, digits follow the key height (the .x01-keypad grid is a size container: one key is
  // (100cqh - 3 gaps of 6px) / 4, so 0.2 = 80% of a key), capped at 3rem, so they stay centred instead of overflowing short keys.
  const digitTextClass = 'leading-none text-[1.6875rem] sm:text-[2rem] md:text-[length:min(3rem,calc((100cqh_-_18px)*0.2))]';
  // Refs avoid stale closures in pointer event handlers fired before React re-renders.
  const longPressTimeoutRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);

  const clearLongPress = useCallback(() => {
    if (longPressTimeoutRef.current !== null) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  }, []);

  const startLongPress = useCallback((dartsUsed: number) => {
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
  }, [isCheckoutPossible, onCheckoutShortcut, checkoutScore, checkoutRule, clearLongPress]);

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
      <span className="pointer-events-none absolute inset-x-1 bottom-1 block whitespace-nowrap text-center text-[7px] font-bold uppercase leading-none tracking-[0.04em] text-fg-faint sm:text-[8px]">
        darts to finish
      </span>
    );
  };

  const canFinishWithDarts = (dartsUsed: number) => {
    if (!isCheckoutPossible || typeof checkoutScore !== 'number') return false;
    return dartsUsed >= getMinDartsForScore(checkoutScore, checkoutRule);
  };

  return (
    <div className="x01-keypad-root flex h-full min-h-0 gap-1.5">
      
      {/* LEFT SHORTCUTS */}
      {quickShortcutsLeft.length > 0 && (
        <div className="hidden md:grid w-20 shrink-0 grid-rows-4 gap-1.5 lg:w-24">
           {quickShortcutsLeft.map((val) => (
               <Button 
                  key={val}
                  variant="secondary" 
                  disabled={disabled}
                  onPointerDown={(event: React.PointerEvent<HTMLButtonElement>) => {
                    if (!event.isPrimary) {
                      return;
                    }
                    onQuickAction?.(val);
                  }}
                  className="h-full min-h-0 px-1 py-1 text-sm font-black bg-surface-glass border-border text-cyan-500 hover:text-fg hover:bg-cyan-900 hover:border-info-border shadow-lg transition-all sm:text-base lg:text-xl"
               >
                  {val}
               </Button>
           ))}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-1.5">
      {/* MOBILE SHORTCUTS ROW (side columns are hidden below md); only on screens tall enough (>= 720px)
          so the score area above is not crushed. MatchView grows the control area to match. */}
      {quickShortcutsMobile.length > 0 && (
        <div
          data-testid="x01-keypad-mobile-shortcuts"
          className="hidden h-11 shrink-0 auto-cols-fr grid-flow-col gap-1.5 max-md:[@media(min-height:720px)]:grid"
        >
          {/* First half cyan, second half orange, echoing the left/right side columns. */}
          {quickShortcutsMobile.map((val, index) => (
            <Button
              // Values may repeat (user-defined), so the position is the identity.
              key={`mobile-${index}`}
              variant="secondary"
              disabled={disabled}
              onPointerDown={(event: React.PointerEvent<HTMLButtonElement>) => {
                if (!event.isPrimary) {
                  return;
                }
                onQuickAction?.(val);
              }}
              className={`h-full min-h-0 min-w-0 px-0 py-0 text-lg font-black bg-surface-glass border-border shadow-lg ${
                index < quickShortcutsMobile.length / 2 ? 'text-cyan-500' : 'text-brand-fg'
              }`}
            >
              {val}
            </Button>
          ))}
        </div>
      )}

      {/* CENTER NUMPAD */}
      <div className="x01-keypad grid min-h-0 flex-1 grid-cols-4 grid-rows-4 gap-1.5 [container-type:size]">
        <Button
          variant="secondary"
          disabled={disabled}
          {...createLongPressProps(1, () => onInput(1))}
          data-testid="x01-keypad-1"
          className={`relative h-full min-h-0 px-1 py-1 font-bold shadow-inner transition-transform active:scale-95 hover:bg-surface-strong ${digitTextClass} ${
            canFinishWithDarts(1)
              ? 'bg-gradient-to-b from-orange-950/30 to-surface border-brand-border shadow-[inset_0_0_0_1px_rgba(249,115,22,0.08)]'
              : 'bg-surface-raised border-border-strong'
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
          className={`relative h-full min-h-0 px-1 py-1 font-bold shadow-inner transition-transform active:scale-95 hover:bg-surface-strong ${digitTextClass} ${
            canFinishWithDarts(2)
              ? 'bg-gradient-to-b from-orange-950/30 to-surface border-brand-border shadow-[inset_0_0_0_1px_rgba(249,115,22,0.08)]'
              : 'bg-surface-raised border-border-strong'
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
          className={`relative h-full min-h-0 px-1 py-1 font-bold shadow-inner transition-transform active:scale-95 hover:bg-surface-strong ${digitTextClass} ${
            canFinishWithDarts(3)
              ? 'bg-gradient-to-b from-orange-950/30 to-surface border-brand-border shadow-[inset_0_0_0_1px_rgba(249,115,22,0.08)]'
              : 'bg-surface-raised border-border-strong'
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
          className="h-full min-h-0 !border-info-border !bg-info-subtle px-1 py-1 text-xs font-black !text-cyan-200 shadow-inner hover:!border-info-border hover:!bg-info-subtle hover:!text-fg sm:text-sm md:text-base"
          title="Indiquer le score restant"
        >
          RESTE
        </Button>
        <Button
          variant="secondary"
          disabled={disabled}
          {...createDigitProps(4)}
          data-testid="x01-keypad-4"
          className={`h-full min-h-0 px-1 py-1 font-bold bg-surface-raised border-border-strong shadow-inner transition-transform active:scale-95 hover:bg-surface-strong ${digitTextClass}`}
        >
          4
        </Button>
        <Button
          variant="secondary"
          disabled={disabled}
          {...createDigitProps(5)}
          data-testid="x01-keypad-5"
          className={`h-full min-h-0 px-1 py-1 font-bold bg-surface-raised border-border-strong shadow-inner transition-transform active:scale-95 hover:bg-surface-strong ${digitTextClass}`}
        >
          5
        </Button>
        <Button
          variant="secondary"
          disabled={disabled}
          {...createDigitProps(6)}
          data-testid="x01-keypad-6"
          className={`h-full min-h-0 px-1 py-1 font-bold bg-surface-raised border-border-strong shadow-inner transition-transform active:scale-95 hover:bg-surface-strong ${digitTextClass}`}
        >
          6
        </Button>
        {voiceControl ?? <div className="row-span-2" />}
        <Button
          variant="secondary"
          disabled={disabled}
          {...createDigitProps(7)}
          data-testid="x01-keypad-7"
          className={`h-full min-h-0 px-1 py-1 font-bold bg-surface-raised border-border-strong shadow-inner transition-transform active:scale-95 hover:bg-surface-strong ${digitTextClass}`}
        >
          7
        </Button>
        <Button
          variant="secondary"
          disabled={disabled}
          {...createDigitProps(8)}
          data-testid="x01-keypad-8"
          className={`h-full min-h-0 px-1 py-1 font-bold bg-surface-raised border-border-strong shadow-inner transition-transform active:scale-95 hover:bg-surface-strong ${digitTextClass}`}
        >
          8
        </Button>
        <Button
          variant="secondary"
          disabled={disabled}
          {...createDigitProps(9)}
          data-testid="x01-keypad-9"
          className={`h-full min-h-0 px-1 py-1 font-bold bg-surface-raised border-border-strong shadow-inner transition-transform active:scale-95 hover:bg-surface-strong ${digitTextClass}`}
        >
          9
        </Button>
        <Button variant="danger" disabled={disabled} onClick={onClear} data-testid="x01-keypad-clear" className="h-full min-h-0 px-1 py-1 text-sm font-bold shadow-sm sm:text-lg md:text-xl">C</Button>
        <Button
          variant="secondary"
          disabled={disabled}
          {...createDigitProps(0)}
          data-testid="x01-keypad-0"
          className={`h-full min-h-0 px-1 py-1 font-bold bg-surface-raised border-border-strong shadow-inner transition-transform active:scale-95 hover:bg-surface-strong ${digitTextClass}`}
        >
          0
        </Button>
        <Button disabled={disabled} onClick={onEnter} data-testid="x01-keypad-ok" className="col-span-2 h-full min-h-0 px-1 py-1 text-lg font-black shadow-lg shadow-orange-900/30 sm:text-2xl md:text-3xl">OK</Button>
      </div>
      </div>

      {/* RIGHT SHORTCUTS */}
      {quickShortcutsRight.length > 0 && (
        <div className="hidden md:grid w-20 shrink-0 grid-rows-4 gap-1.5 lg:w-24">
           {quickShortcutsRight.map((val) => (
               <Button 
                  key={val}
                  variant="secondary" 
                  disabled={disabled}
                  onPointerDown={(event: React.PointerEvent<HTMLButtonElement>) => {
                    if (!event.isPrimary) {
                      return;
                    }
                    onQuickAction?.(val);
                  }}
                  className="h-full min-h-0 px-1 py-1 text-sm font-black bg-surface-glass border-border text-brand-fg hover:text-fg hover:bg-brand-strong hover:border-brand-border shadow-lg transition-all sm:text-base lg:text-xl"
               >
                  {val}
               </Button>
           ))}
        </div>
      )}

    </div>
  );
};
