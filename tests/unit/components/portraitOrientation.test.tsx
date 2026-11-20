// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, renderHook } from '@testing-library/react';
import { RotateToPortraitOverlay } from '../../../src/features/smartphone/RotateToPortraitOverlay';
import { usePortraitLock } from '../../../src/features/smartphone/usePortraitLock';

const originalOrientation = Object.getOwnPropertyDescriptor(screen, 'orientation');

function stubOrientation(value: unknown) {
  Object.defineProperty(screen, 'orientation', { configurable: true, value });
}

afterEach(() => {
  cleanup();
  if (originalOrientation) {
    Object.defineProperty(screen, 'orientation', originalOrientation);
  } else {
    delete (screen as { orientation?: unknown }).orientation;
  }
});

describe('RotateToPortraitOverlay', () => {
  it('asks to turn the phone back to portrait and reassures that the game is kept', () => {
    const view = render(<RotateToPortraitOverlay />);
    expect(view.getByRole('alert')).toBeTruthy();
    expect(view.getByText('Tourne ton téléphone')).toBeTruthy();
    expect(view.getByText(/Ta partie est conservée/)).toBeTruthy();
  });
});

describe('usePortraitLock', () => {
  it('requests a portrait lock when enabled', () => {
    const lock = vi.fn().mockResolvedValue(undefined);
    stubOrientation({ lock });
    renderHook(() => usePortraitLock(true));
    expect(lock).toHaveBeenCalledWith('portrait');
  });

  it('does nothing when disabled', () => {
    const lock = vi.fn().mockResolvedValue(undefined);
    stubOrientation({ lock });
    renderHook(() => usePortraitLock(false));
    expect(lock).not.toHaveBeenCalled();
  });

  it('swallows a refused lock (regular browser tab, iOS)', async () => {
    const lock = vi.fn().mockRejectedValue(new Error('NotSupportedError'));
    stubOrientation({ lock });
    renderHook(() => usePortraitLock(true));
    await Promise.resolve();
    expect(lock).toHaveBeenCalledOnce();
  });

  it('tolerates browsers without the orientation lock API', () => {
    stubOrientation({});
    expect(() => renderHook(() => usePortraitLock(true))).not.toThrow();
    stubOrientation(undefined);
    expect(() => renderHook(() => usePortraitLock(true))).not.toThrow();
  });
});
