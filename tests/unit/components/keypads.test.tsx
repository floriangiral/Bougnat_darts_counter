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
      for (const key of view.getAllByRole('button', { name: String(value) })) {
        vi.mocked(view.props.onQuickAction).mockClear();
        pointer(key, 'pointerdown', false);
        expect(view.props.onQuickAction).not.toHaveBeenCalled();
        pointer(key, 'pointerdown');
        expect(view.props.onQuickAction).toHaveBeenLastCalledWith(value);
      }
    }
    fireEvent.click(view.getByTestId('x01-keypad-clear'));
    fireEvent.click(view.getByTestId('x01-keypad-ok'));
    fireEvent.click(view.getByTestId('x01-keypad-remaining'));
    expect(view.props.onClear).toHaveBeenCalledOnce();
    expect(view.props.onEnter).toHaveBeenCalledOnce();
    expect(view.props.onRemaining).toHaveBeenCalledOnce();
  });

  it('uses a long press to finish and suppresses the subsequent digit tap', async () => {
    const view = keypad({ isCheckoutPossible: true, checkoutScore: 40 });
    expect(view.getAllByText('darts to finish')).toHaveLength(3);
    const key = view.getByTestId('x01-keypad-1');
    pointer(key, 'pointerdown');
    await act(() => Promise.resolve().then(() => { vi.advanceTimersByTime(450); }));
    expect(view.props.onCheckoutShortcut).toHaveBeenCalledWith(1);
    pointer(key, 'pointerup');
    expect(view.props.onInput).not.toHaveBeenCalled();
    pointer(key, 'pointerdown');
    await act(() => Promise.resolve().then(() => { vi.advanceTimersByTime(100); }));
    pointer(key, 'pointerup');
    await act(() => Promise.resolve().then(() => { vi.advanceTimersByTime(450); }));
    expect(view.props.onInput).toHaveBeenCalledWith(1);
    expect(view.props.onCheckoutShortcut).toHaveBeenCalledOnce();
  });

  it('requires enough darts for the finish and cancels abandoned or unmounted presses', async () => {
    const view = keypad({ isCheckoutPossible: true, checkoutScore: 170 });
    expect(view.getAllByText('darts to finish')).toHaveLength(1);
    const one = view.getByTestId('x01-keypad-1');
    pointer(one, 'pointerdown');
    await act(() => Promise.resolve().then(() => { vi.advanceTimersByTime(450); }));
    pointer(one, 'pointerup');
    expect(view.props.onCheckoutShortcut).not.toHaveBeenCalled();
    expect(view.props.onInput).toHaveBeenCalledWith(1);
    const three = view.getByTestId('x01-keypad-3');
    for (const cancellation of ['pointerleave', 'pointercancel']) {
      pointer(three, 'pointerdown');
      pointer(three, cancellation);
      await act(() => Promise.resolve().then(() => { vi.advanceTimersByTime(500); }));
    }
    pointer(three, 'pointerdown');
    view.unmount();
    await act(() => Promise.resolve().then(() => { vi.advanceTimersByTime(500); }));
    expect(view.props.onCheckoutShortcut).not.toHaveBeenCalled();
  });

  it('renders the mobile shortcut row in order, first half double tone and second half triple tone', () => {
    const view = keypad({ quickShortcutsMobile: [45, 60, 100, 81, 85, 140] });
    const row = view.getByTestId('x01-keypad-mobile-shortcuts');
    expect(row.className).toContain('max-md:[@media(min-height:720px)]:grid');
    const buttons = Array.from(row.querySelectorAll('button'));
    expect(buttons.map((b) => b.textContent)).toEqual(['45', '60', '100', '81', '85', '140']);
    expect(buttons.map((b) => b.dataset.tone)).toEqual(['double', 'double', 'double', 'triple', 'triple', 'triple']);
    pointer(buttons[5], 'pointerdown');
    expect(view.props.onQuickAction).toHaveBeenLastCalledWith(140);
  });

  it('exposes key tones and the finish state through data attributes', () => {
    const view = keypad({ quickShortcutsLeft: [26], quickShortcutsRight: [180], isCheckoutPossible: true, checkoutScore: 40 });
    expect(view.getByRole('button', { name: '26' }).dataset.tone).toBe('double');
    expect(view.getByRole('button', { name: '180' }).dataset.tone).toBe('triple');
    expect(view.getByTestId('x01-keypad-5').dataset.tone).toBe('neutral');
    expect(view.getByTestId('x01-keypad-remaining').dataset.tone).toBe('info');
    expect(['1', '2', '3'].map((digit) => view.getByTestId(`x01-keypad-${digit}`).dataset.state)).toEqual(['finish', 'finish', 'finish']);
    view.rerender(<Keypad {...view.props} checkoutScore={170} />);
    expect(['1', '2', '3'].map((digit) => view.getByTestId(`x01-keypad-${digit}`).dataset.state)).toEqual([undefined, undefined, 'finish']);
  });

  it('places the arena undo key just before OK on its own row and gates it', () => {
    const onUndo = vi.fn();
    const view = keypad({ undoKey: { onUndo, canUndo: true } });
    const grid = view.getByTestId('x01-keypad-ok').parentElement as HTMLElement;
    expect(grid.dataset.undoRow).toBe('true');
    const undo = view.getByTestId('x01-keypad-undo');
    expect(undo.nextElementSibling).toBe(view.getByTestId('x01-keypad-ok'));
    expect(undo.textContent).toContain('Retour');
    fireEvent.click(undo);
    expect(onUndo).toHaveBeenCalledOnce();
    view.rerender(<Keypad {...view.props} undoKey={{ onUndo, canUndo: false }} />);
    expect((view.getByTestId('x01-keypad-undo') as HTMLButtonElement).disabled).toBe(true);
    view.rerender(<Keypad {...view.props} undoKey={undefined} />);
    expect(view.queryByTestId('x01-keypad-undo')).toBeNull();
    expect(grid.dataset.undoRow).toBeUndefined();
  });

  it('omits the mobile shortcut row without mobile shortcuts, even with side columns', () => {
    expect(keypad({ quickShortcutsLeft: [26], quickShortcutsRight: [180] }).queryByTestId('x01-keypad-mobile-shortcuts')).toBeNull();
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

  it('allows optional shortcut callbacks to be omitted', async () => {
    const view = keypad({
      quickShortcutsLeft: [26], quickShortcutsRight: [180], onQuickAction: undefined,
      isCheckoutPossible: true, checkoutScore: 40, onCheckoutShortcut: undefined,
    });
    for (const key of view.getAllByRole('button', { name: /^(26|180)$/ })) pointer(key, 'pointerdown');
    pointer(view.getByTestId('x01-keypad-2'), 'pointerdown');
    await act(() => Promise.resolve().then(() => { vi.advanceTimersByTime(500); }));
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
    fireEvent.click(view.getByRole('button', { name: 'BULL (25)' }));
    expect(props.onHit).toHaveBeenLastCalledWith(25, 1);
    fireEvent.click(view.getByRole('button', { name: 'D-BULL (50)' }));
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

  // Spec 066 FR-02/FR-07 et spec 064 FR-02 : convention de la cible exposée par attributs, focus jamais retiré.
  it('exposes the shared target convention and keeps the focus after a tap', () => {
    const view = render(<CricketKeypad onHit={vi.fn()} onMiss={vi.fn()} onTripleMiss={vi.fn()} onUndo={vi.fn()} canUndo />);
    const twenties = view.getAllByRole('button', { name: '20' });
    expect(twenties.map((key) => [key.dataset.tone, key.dataset.multiplier])).toEqual([
      ['neutral', '1'], ['double', '2'], ['triple', '3'],
    ]);
    const bull = view.getByRole('button', { name: 'BULL (25)' });
    const doubleBull = view.getByRole('button', { name: 'D-BULL (50)' });
    expect([bull.dataset.tone, bull.dataset.multiplier]).toEqual(['bull', '1']);
    expect([doubleBull.dataset.tone, doubleBull.dataset.multiplier]).toEqual(['dbull', '2']);
    expect(doubleBull.getAttribute('style')).toBeNull();
    for (const key of view.getAllByRole('button')) {
      expect(key.className).not.toMatch(/(^|\s)!|focus:outline-none/);
    }
    doubleBull.focus();
    fireEvent.pointerUp(doubleBull);
    expect(document.activeElement).toBe(doubleBull);
  });
});
