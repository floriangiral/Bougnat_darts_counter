// Spec: spec:counter/inp-phase1-quick-wins
import React, { useCallback, useEffect, useRef } from 'react';
import { Button } from '../ui/Button';
import { GameActionButton } from './controls/GameActionButton';
import { GameUndoButton } from './controls/GameUndoButton';
import { resolveUndoIntent, type UndoIntent } from './controls/undoIntent';
import { InOutRule } from '../../types';
import { getMinDartsForScore } from '../../src/application/scoring/matchStats';

/**
 * Touche « Annuler » fusionnée (décision PO du 2026-11-20) : une saisie en cours est effacée,
 * sinon la dernière volée validée est annulée ; désactivée quand il n'y a rien à annuler.
 */
export interface KeypadUndo {
  hasPendingInput: boolean;
  canUndoLast: boolean;
  onClearInput: () => void;
  onUndoLast: () => void;
}

/**
 * Même pavé 4 colonnes partout (1 2 3 RESTE / 4 5 6 voix / 7 8 9 voix / Annuler 0 OK).
 * `classic` : téléphone, téléphone paysage, bureau (raccourcis en colonnes latérales ou en rangée téléphone) ;
 * `tablet` : tablette portrait et arène (une rangée de grands raccourcis au-dessus du pavé, deux en arène).
 */
export type KeypadLayout = 'classic' | 'tablet';

interface KeypadProps {
  onInput: (val: number) => void;
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
  undo: KeypadUndo;
  layout?: KeypadLayout;
}

// Simple neutre (spec 066) ; le plancher tactile vient de bd-touch-target et de x01.css.
const DIGIT_CLASS = 'x01-key-digit h-full min-h-0 px-1 py-1 font-bold shadow-inner transition-transform active:scale-95';
// Raccourcis de score : ton double (gauche / première moitié) et triple (droite / seconde moitié).
const SHORTCUT_CLASS = 'x01-key-shortcut h-full min-h-0 px-1 py-1 text-sm font-black shadow-raised transition-all sm:text-base lg:text-xl';

const UNDO_HINTS: Record<UndoIntent, string> = {
  'clear-input': 'la saisie',
  'undo-last': 'la volée',
  none: '',
};

interface RemainingKeyProps {
  onRemaining?: () => void;
  disabled?: boolean;
}

/** RESTE : valide la saisie comme score restant du joueur actif (au lieu des points marqués). */
const RemainingKey: React.FC<RemainingKeyProps> = ({ onRemaining, disabled = false }) => (
  <Button
    variant="keypad"
    disabled={disabled}
    onClick={onRemaining}
    data-testid="x01-keypad-remaining"
    data-tone="info"
    className="x01-key-remaining h-full min-h-0 px-1 py-1 text-xs font-black shadow-inner sm:text-sm md:text-base"
    title="Valider la saisie comme score restant"
  >
    <span className="text-info-fg">RESTE</span>
  </Button>
);

export const Keypad: React.FC<KeypadProps> = ({
  onInput,
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
  undo,
  layout = 'classic',
}) => {
  const isTablet = layout === 'tablet';
  // From md, digits follow the key height (the .x01-keypad grid is a size container: one key is
  // (100cqh - 3 gaps of 6px) / 4, so 0.2 = 80% of a key), capped at 3rem, so they stay centred instead of overflowing short keys.
  // Le pavé tablette fixe ses tailles dans x01.css (unités de conteneur).
  const digitTextClass = isTablet ? '' : 'leading-none text-[1.6875rem] sm:text-[2rem] md:text-[length:min(3rem,calc((100cqh_-_18px)*0.2))]';
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

  const canFinishWithDarts = (dartsUsed: number) => {
    if (!isCheckoutPossible || typeof checkoutScore !== 'number') return false;
    return dartsUsed >= getMinDartsForScore(checkoutScore, checkoutRule);
  };

  const renderDigit = (digit: number) => {
    const isFinishKey = digit >= 1 && digit <= 3;
    if (!isFinishKey) {
      return (
        <Button
          key={digit}
          variant="keypad"
          disabled={disabled}
          {...createDigitProps(digit)}
          data-testid={`x01-keypad-${digit}`}
          className={`${DIGIT_CLASS} ${digitTextClass}`}
        >
          {digit}
        </Button>
      );
    }

    const canFinish = canFinishWithDarts(digit);
    const dartsLabel = digit === 1 ? 'fléchette' : 'fléchettes';
    const finishTitle = isCheckoutPossible ? `Appui long : finish en ${digit} ${dartsLabel}` : undefined;
    return (
      <Button
        key={digit}
        variant="keypad"
        disabled={disabled}
        {...createLongPressProps(digit, () => onInput(digit))}
        data-testid={`x01-keypad-${digit}`}
        data-state={canFinish ? 'finish' : undefined}
        className={`relative ${DIGIT_CLASS} ${digitTextClass}`}
        title={finishTitle}
      >
        {canFinish && (
          <span aria-hidden="true" className="x01-key-finish-highlight pointer-events-none absolute inset-0 rounded border border-brand-border bg-gradient-to-b from-brand-subtle to-transparent" />
        )}
        <span className="relative leading-none">{digit}</span>
        {canFinish && (
          <span data-testid="x01-key-finish-label" className="x01-key-finish-label pointer-events-none absolute inset-x-1 bottom-1 block whitespace-nowrap text-center text-[7px] font-bold uppercase leading-none tracking-[0.04em] text-brand-fg sm:text-[8px]">
            Finish<span className="x01-key-finish-hint"> · appui long</span>
          </span>
        )}
      </Button>
    );
  };

  const renderShortcut = (val: number, tone: 'double' | 'triple', key: string, className: string) => (
    <Button
      key={key}
      variant="keypad"
      tone={tone}
      disabled={disabled}
      onPointerDown={(event: React.PointerEvent<HTMLButtonElement>) => {
        if (!event.isPrimary) {
          return;
        }
        onQuickAction?.(val);
      }}
      className={className}
    >
      {val}
    </Button>
  );

  const undoKey = (
    <GameUndoButton
      hasPendingInput={undo.hasPendingInput}
      canUndoLast={undo.canUndoLast}
      onClearInput={undo.onClearInput}
      onUndoLast={undo.onUndoLast}
      disabled={disabled}
      data-testid="x01-keypad-undo"
      className={`x01-key-undo h-full min-h-0 ${isTablet ? 'flex-wrap' : ''}`}
    >
      {isTablet && (
        <span aria-hidden="true" className="x01-key-undo-hint basis-full font-bold normal-case text-fg-subtle">
          {UNDO_HINTS[resolveUndoIntent(undo)]}
        </span>
      )}
    </GameUndoButton>
  );

  const okKey = (
    <GameActionButton
      action="validate"
      label="OK"
      disabled={disabled}
      onClick={onEnter}
      data-testid="x01-keypad-ok"
      className="x01-key-ok x01-keypad-action col-span-2 h-full min-h-0"
    />
  );

  // CENTER NUMPAD : 1 2 3 RESTE / 4 5 6 voix / 7 8 9 voix / Annuler 0 OK (OK sur deux colonnes).
  const numpad = (
    <fieldset aria-label="Pavé numérique" className="x01-keypad grid min-h-0 min-w-auto flex-1 grid-cols-4 grid-rows-4 gap-1.5 [container-type:size]">
      {[1, 2, 3].map(renderDigit)}
      <RemainingKey onRemaining={onRemaining} disabled={disabled} />
      {[4, 5, 6].map(renderDigit)}
      {voiceControl ?? <div className="row-span-2" />}
      {[7, 8, 9].map(renderDigit)}
      {undoKey}
      {renderDigit(0)}
      {okKey}
    </fieldset>
  );

  if (isTablet) {
    // Raccourcis gauche puis droite : une rangée de grandes touches égales (deux rangées de 4 en arène).
    const shortcuts = [
      ...quickShortcutsLeft.map((val, index) => ({ val, tone: 'double' as const, key: `left-${index}` })),
      ...quickShortcutsRight.map((val, index) => ({ val, tone: 'triple' as const, key: `right-${index}` })),
    ];
    const shortcutVars = {
      '--x01-shortcut-count': shortcuts.length,
      '--x01-shortcut-half': Math.ceil(shortcuts.length / 2),
    } as React.CSSProperties;

    return (
      <div className="x01-keypad-root flex h-full min-h-0 flex-col" data-keypad-layout="tablet">
        {shortcuts.length > 0 && (
          <fieldset
            data-testid="x01-keypad-shortcuts"
            aria-label="Raccourcis de score"
            className="x01-keypad-shortcuts grid min-w-auto shrink-0"
            style={shortcutVars}
          >
            {shortcuts.map(({ val, tone, key }) => renderShortcut(val, tone, key, 'x01-key-shortcut min-h-0 min-w-0 font-black shadow-raised'))}
          </fieldset>
        )}
        {numpad}
      </div>
    );
  }

  return (
    <div className="x01-keypad-root flex h-full min-h-0 gap-1.5" data-keypad-layout="classic">

      {/* LEFT SHORTCUTS */}
      {quickShortcutsLeft.length > 0 && (
        <div data-testid="x01-keypad-side" className="x01-keypad-side hidden md:grid w-20 shrink-0 grid-rows-4 gap-1.5 lg:w-24">
          {quickShortcutsLeft.map((val, index) => renderShortcut(val, 'double', `left-${index}`, SHORTCUT_CLASS))}
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
          {/* First half double tone, second half triple tone, echoing the left/right side columns.
              Values may repeat (user-defined), so the position is the identity. */}
          {quickShortcutsMobile.map((val, index) => renderShortcut(
            val,
            index < quickShortcutsMobile.length / 2 ? 'double' : 'triple',
            `mobile-${index}`,
            'h-full min-h-0 min-w-0 px-0 py-0 text-lg font-black shadow-raised',
          ))}
        </div>
      )}

      {numpad}
      </div>

      {/* RIGHT SHORTCUTS */}
      {quickShortcutsRight.length > 0 && (
        <div data-testid="x01-keypad-side" className="x01-keypad-side hidden md:grid w-20 shrink-0 grid-rows-4 gap-1.5 lg:w-24">
          {quickShortcutsRight.map((val, index) => renderShortcut(val, 'triple', `right-${index}`, SHORTCUT_CLASS))}
        </div>
      )}

    </div>
  );
};
