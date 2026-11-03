// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { Keypad } from '../../../components/game/Keypad';
import { CricketKeypad } from '../../../components/game/CricketKeypad';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function keypad(overrides: Partial<ComponentProps<typeof Keypad>> = {}) {
  const props = {
    onInput: vi.fn(), onClear: vi.fn(), onEnter: vi.fn(), onRemaining: vi.fn(),
    onCheckoutShortcut: vi.fn(), onQuickAction: vi.fn(), currentInput: '',
    isCheckoutPossible: false, ...overrides,
  };
  return { ...render(<Keypad {...props} />), props };
}

function pointer(element: HTMLElement, type: string, isPrimary = true) {
  const event = new Event(type === 'pointerleave' ? 'pointerout' : type, { bubbles: true });
  Object.defineProperty(event, 'isPrimary', { value: isPrimary });
  fireEvent(element, event);
}

describe('Keypad', () => {
  it('handles all digits, shortcuts and explicit actions, ignoring secondary pointers', () => {
    const view = keypad({ quickShortcutsLeft: [26], quickShortcutsRight: [180] });
    for (let digit = 0; digit <= 9; digit++) {
      const key = view.getByTestId(`x01-keypad-${digit}`);
      pointer(key, 'pointerdown', false);
      pointer(key, 'pointerup', false);
      expect(view.props.onInput).not.toHaveBeenCalledWith(digit);
      pointer(key, 'pointerdown');
      if (digit >= 1 && digit <= 3) pointer(key, 'pointerup');
      expect(view.props.onInput).toHaveBeenLastCalledWith(digit);
    }
    for (const value of [26, 180]) {
      const key = view.getByRole('button', { name: String(value) });
      pointer(key, 'pointerdown', false);
      expect(view.props.onQuickAction).not.toHaveBeenCalledWith(value);
      pointer(key, 'pointerdown');
      expect(view.props.onQuickAction).toHaveBeenLastCalledWith(value);
    }
    fireEvent.click(view.getByTestId('x01-keypad-clear'));
    fireEvent.click(view.getByTestId('x01-keypad-ok'));
    fireEvent.click(view.getByTestId('x01-keypad-remaining'));
    expect(view.props.onClear).toHaveBeenCalledOnce();
    expect(view.props.onEnter).toHaveBeenCalledOnce();
    expect(view.props.onRemaining).toHaveBeenCalledOnce();
  });

  it('uses a long press to finish and suppresses the subsequent digit tap', () => {
    const view = keypad({ isCheckoutPossible: true, checkoutScore: 40 });
    expect(view.getAllByText('darts to finish')).toHaveLength(3);
    const key = view.getByTestId('x01-keypad-1');
    pointer(key, 'pointerdown');
    act(() => vi.advanceTimersByTime(450));
    expect(view.props.onCheckoutShortcut).toHaveBeenCalledWith(1);
    pointer(key, 'pointerup');
    expect(view.props.onInput).not.toHaveBeenCalled();
    pointer(key, 'pointerdown');
    act(() => vi.advanceTimersByTime(100));
    pointer(key, 'pointerup');
    act(() => vi.advanceTimersByTime(450));
    expect(view.props.onInput).toHaveBeenCalledWith(1);
    expect(view.props.onCheckoutShortcut).toHaveBeenCalledOnce();
  });

  it('requires enough darts for the finish and cancels abandoned or unmounted presses', () => {
    const view = keypad({ isCheckoutPossible: true, checkoutScore: 170 });
    expect(view.getAllByText('darts to finish')).toHaveLength(1);
    const one = view.getByTestId('x01-keypad-1');
    pointer(one, 'pointerdown');
    act(() => vi.advanceTimersByTime(450));
    pointer(one, 'pointerup');
    expect(view.props.onCheckoutShortcut).not.toHaveBeenCalled();
    expect(view.props.onInput).toHaveBeenCalledWith(1);
    const three = view.getByTestId('x01-keypad-3');
    for (const cancellation of ['pointerleave', 'pointercancel']) {
      pointer(three, 'pointerdown');
      pointer(three, cancellation);
      act(() => vi.advanceTimersByTime(500));
    }
    pointer(three, 'pointerdown');
    view.unmount();
    act(() => vi.advanceTimersByTime(500));
    expect(view.props.onCheckoutShortcut).not.toHaveBeenCalled();
  });

  it('disables every action when scoring is locked', () => {
    const view = keypad({ disabled: true, quickShortcutsLeft: [26], quickShortcutsRight: [180] });
    for (const button of view.getAllByRole('button')) {
      expect((button as HTMLButtonElement).disabled).toBe(true);
      fireEvent.click(button);
    }
    expect(view.props.onEnter).not.toHaveBeenCalled();
    expect(view.props.onClear).not.toHaveBeenCalled();
    expect(view.props.onRemaining).not.toHaveBeenCalled();
  });

  it('allows optional shortcut callbacks to be omitted', () => {
    const view = keypad({
      quickShortcutsLeft: [26], quickShortcutsRight: [180], onQuickAction: undefined,
      isCheckoutPossible: true, checkoutScore: 40, onCheckoutShortcut: undefined,
    });
    pointer(view.getByRole('button', { name: '26' }), 'pointerdown');
    pointer(view.getByRole('button', { name: '180' }), 'pointerdown');
    pointer(view.getByTestId('x01-keypad-2'), 'pointerdown');
    act(() => vi.advanceTimersByTime(500));
    pointer(view.getByTestId('x01-keypad-2'), 'pointerup');
    expect(view.props.onInput).toHaveBeenCalledWith(2);
  });
});

describe('CricketKeypad', () => {
  it('forwards every target and multiplier, bull, misses and undo actions', () => {
    const props = { onHit: vi.fn(), onMiss: vi.fn(), onTripleMiss: vi.fn(), onUndo: vi.fn(), canUndo: true };
    const view = render(<CricketKeypad {...props} />);
    for (const target of [20, 19, 18, 17, 16, 15]) {
      view.getAllByRole('button', { name: String(target) }).forEach((key, index) => {
        fireEvent.click(key);
        expect(props.onHit).toHaveBeenLastCalledWith(target, index + 1);
      });
    }
    fireEvent.click(view.getByRole('button', { name: 'BULL' }));
    expect(props.onHit).toHaveBeenLastCalledWith(25, 1);
    const doubleBull = view.getByRole('button', { name: 'D-BULL' });
    doubleBull.focus();
    fireEvent.pointerUp(doubleBull);
    expect(document.activeElement).not.toBe(doubleBull);
    fireEvent.click(doubleBull);
    expect(props.onHit).toHaveBeenLastCalledWith(25, 2);
    fireEvent.click(view.getByRole('button', { name: 'MISS' }));
    fireEvent.click(view.getByRole('button', { name: '3 MISS' }));
    fireEvent.click(view.getByRole('button', { name: 'C' }));
    expect(props.onMiss).toHaveBeenCalledOnce();
    expect(props.onTripleMiss).toHaveBeenCalledOnce();
    expect(props.onUndo).toHaveBeenCalledOnce();
    view.rerender(<CricketKeypad {...props} canUndo={false} />);
    expect((view.getByRole('button', { name: 'C' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(view.getByRole('button', { name: 'C' }));
    expect(props.onUndo).toHaveBeenCalledOnce();
  });
});
