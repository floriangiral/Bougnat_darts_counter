// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';

import { CapitalKeypad } from '../../../components/game/CapitalKeypad';
import type { CapitalTarget } from '../../../types';

afterEach(cleanup);

function renderKeypad(target: CapitalTarget, canUndo = true) {
  const onDartInput = vi.fn();
  const onUndo = vi.fn();
  const onBackspace = vi.fn();
  return {
    ...render(<CapitalKeypad target={target} canUndo={canUndo} onDartInput={onDartInput} onUndo={onUndo} onBackspace={onBackspace} />),
    onDartInput,
    onUndo,
    onBackspace,
  };
}

describe('CapitalKeypad', () => {
  it('validates totals, limits input length, clears and backspaces before undoing a turn', () => {
    const view = renderKeypad('CAPITAL');
    const press = (name: string) => fireEvent.click(view.getByRole('button', { name }));
    press('OK');
    expect(view.onDartInput).not.toHaveBeenCalled();
    for (const digit of ['1', '8', '0', '9']) press(digit);
    press('OK');
    expect(view.onDartInput).toHaveBeenLastCalledWith({ value: 180, multiplier: 1 });
    expect(view.getByText('---')).toBeTruthy();

    press('9');
    press('9');
    press('9');
    press('OK');
    expect(view.onDartInput).toHaveBeenCalledTimes(1);
    press('C');
    press('4');
    press('5');
    press('6');
    press('Retour ↶');
    expect(view.onBackspace).toHaveBeenCalledOnce();
    expect(view.getByText('45')).toBeTruthy();
    press('C');
    press('Retour ↶');
    expect(view.onUndo).toHaveBeenCalledOnce();
    press('7');
    press('MISS');
    expect(view.onDartInput).toHaveBeenLastCalledWith({ value: 0, multiplier: 1 });
    expect(view.getByText('---')).toBeTruthy();
  });

  it.each(['20', '19', '18', '17', '16', '15', '14', '13'] as const)('emits fixed multipliers for target %s', (target) => {
    const view = renderKeypad(target);
    for (const [prefix, multiplier] of [['S', 1], ['D', 2], ['T', 3]] as const) {
      fireEvent.click(view.getByRole('button', { name: `${prefix}${target}` }));
      expect(view.onDartInput).toHaveBeenLastCalledWith({ value: Number(target), multiplier });
    }
    fireEvent.click(view.getByRole('button', { name: 'MISS' }));
    expect(view.onDartInput).toHaveBeenLastCalledWith({ value: 0, multiplier: 1 });
    fireEvent.click(view.getByRole('button', { name: 'RETOUR' }));
    expect(view.onUndo).toHaveBeenCalledOnce();
  });

  it.each([
    ['CENTRE', 'BULLE (25)', 25, 1],
    ['CENTRE', 'D-BULLE (50)', 25, 2],
    ['DOUBLE', 'D20', 20, 2],
    ['DOUBLE', 'BULLE (50)', 25, 2],
    ['TRIPLE', 'T19', 19, 3],
  ] as const)('handles %s action %s', (target, label, value, multiplier) => {
    const view = renderKeypad(target);
    fireEvent.click(view.getByRole('button', { name: label }));
    expect(view.onDartInput).toHaveBeenLastCalledWith({ value, multiplier });
    fireEvent.click(view.getByRole('button', { name: 'RETOUR' }));
    expect(view.onUndo).toHaveBeenCalledOnce();
    fireEvent.click(view.getByRole('button', { name: 'MISS' }));
    expect(view.onDartInput).toHaveBeenLastCalledWith({ value: 0, multiplier: 1 });
  });

  it.each(['SUITE', 'COTE_A_COTE', 'COULEUR', '21_OU_MOINS'] as const)('resets the multiplier after a hit on %s', (target) => {
    const view = renderKeypad(target);
    fireEvent.click(view.getByRole('button', { name: 'DOUBLE' }));
    fireEvent.click(view.getByRole('button', { name: '20' }));
    expect(view.onDartInput).toHaveBeenLastCalledWith({ value: 20, multiplier: 2 });
    fireEvent.click(view.getByRole('button', { name: '20' }));
    expect(view.onDartInput).toHaveBeenLastCalledWith({ value: 20, multiplier: 1 });
    fireEvent.click(view.getByRole('button', { name: 'TRIPLE' }));
    expect(view.queryByRole('button', { name: 'BULLE (25)' })).toBeNull();
    fireEvent.click(view.getByRole('button', { name: 'MISS' }));
    fireEvent.click(view.getByRole('button', { name: 'DOUBLE' }));
    fireEvent.click(view.getByRole('button', { name: 'D-BULLE (50)' }));
    expect(view.onDartInput).toHaveBeenLastCalledWith({ value: 25, multiplier: 2 });
    fireEvent.click(view.getByRole('button', { name: 'SIMPLE' }));
    fireEvent.click(view.getByRole('button', { name: 'BULLE (25)' }));
    expect(view.onDartInput).toHaveBeenLastCalledWith({ value: 25, multiplier: 1 });
  });

  it('preserves the multiplier for the 57 challenge and disables undo without history', () => {
    const view = renderKeypad('57', false);
    expect(view.getByRole('button', { name: 'RETOUR' }).hasAttribute('disabled')).toBe(true);
    fireEvent.click(view.getByRole('button', { name: 'TRIPLE' }));
    expect(view.queryByRole('button', { name: /BULLE/ })).toBeNull();
    fireEvent.click(view.getByRole('button', { name: '19' }));
    fireEvent.click(view.getByRole('button', { name: '1' }));
    expect(view.onDartInput.mock.calls).toEqual([
      [{ value: 19, multiplier: 3 }],
      [{ value: 1, multiplier: 3 }],
    ]);
    fireEvent.click(view.getByRole('button', { name: 'DOUBLE' }));
    fireEvent.click(view.getByRole('button', { name: 'D-BULLE (50)' }));
    expect(view.onDartInput).toHaveBeenLastCalledWith({ value: 25, multiplier: 2 });
    fireEvent.click(view.getByRole('button', { name: 'SIMPLE' }));
    fireEvent.click(view.getByRole('button', { name: 'BULLE (25)' }));
    expect(view.onDartInput).toHaveBeenLastCalledWith({ value: 25, multiplier: 1 });
    fireEvent.click(view.getByRole('button', { name: 'MISS' }));
    expect(view.onDartInput).toHaveBeenLastCalledWith({ value: 0, multiplier: 1 });
  });
});
