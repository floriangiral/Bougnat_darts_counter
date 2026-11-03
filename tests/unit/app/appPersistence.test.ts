// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  isLiveUpdateBlocked, isLiveUpdatePending, LIVE_UPDATE_BLOCK_STORAGE_KEY,
  LIVE_UPDATE_PENDING_STORAGE_KEY, readLocalStorageJson, removeLocalStorageItem,
  setLiveUpdateBlocked, setLiveUpdatePending, writeLocalStorageJson,
} from '../../../utils/appPersistence';

beforeEach(() => window.localStorage.clear());

describe('browser persistence', () => {
  it('round-trips JSON, handles missing/malformed values and removes entries', () => {
    expect(readLocalStorageJson('session')).toBeNull();
    const value = { screen: 'MATCH', players: ['Alice'], score: 0 };
    writeLocalStorageJson('session', value);
    expect(readLocalStorageJson('session')).toEqual(value);
    window.localStorage.setItem('broken', '{');
    expect(readLocalStorageJson('broken')).toBeNull();
    removeLocalStorageItem('session');
    expect(readLocalStorageJson('session')).toBeNull();
  });

  it.each([
    [LIVE_UPDATE_BLOCK_STORAGE_KEY, setLiveUpdateBlocked, isLiveUpdateBlocked],
    [LIVE_UPDATE_PENDING_STORAGE_KEY, setLiveUpdatePending, isLiveUpdatePending],
  ] as const)('stores and clears the %s flag', (key, set, get) => {
    expect(get()).toBe(false);
    set(true);
    expect(window.localStorage.getItem(key)).toBe('true');
    expect(get()).toBe(true);
    set(false);
    expect(window.localStorage.getItem(key)).toBeNull();
    window.localStorage.setItem(key, 'false');
    expect(get()).toBe(false);
  });

  it('keeps the existing graceful behavior when browser storage is unavailable', () => {
    for (const method of ['getItem', 'setItem', 'removeItem'] as const) {
      vi.spyOn(Storage.prototype, method).mockImplementation(() => { throw new Error('Storage denied'); });
    }
    expect(readLocalStorageJson('session')).toBeNull();
    expect(isLiveUpdateBlocked()).toBe(false);
    expect(isLiveUpdatePending()).toBe(false);
    expect(() => {
      writeLocalStorageJson('session', {});
      removeLocalStorageItem('session');
      setLiveUpdateBlocked(true);
      setLiveUpdateBlocked(false);
      setLiveUpdatePending(true);
      setLiveUpdatePending(false);
    }).not.toThrow();
  });
});
