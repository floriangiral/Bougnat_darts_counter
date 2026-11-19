// Spec ref: spec:counter/inp-phase1-quick-wins
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// We import the module fresh after resetting the module registry to avoid
// sharing the debounce timer state between tests.
describe('persistAppSession debounce (spec:counter/inp-phase1-quick-wins)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires the async persist exactly once after a burst of rapid calls', async () => {
    const persistMock = vi.fn().mockResolvedValue(undefined);
    vi.doMock('../../../src/infrastructure', () => ({
      persistAppSessionAsync: persistMock,
      restorePersistedAppSessionAsync: vi.fn().mockResolvedValue(null),
      clearPersistedAppSessionAsync: vi.fn().mockResolvedValue(undefined),
    }));

    const { persistAppSession } = await import('../../../src/app/appShell');

    const session = buildMinimalSession('A');
    persistAppSession({ ...session, screen: 'MATCH' });
    persistAppSession({ ...session, screen: 'STATS' });
    persistAppSession({ ...session, screen: 'HOME' });

    // No write yet — all three calls are within the debounce window.
    expect(persistMock).not.toHaveBeenCalled();

    // Advance past the 300ms debounce threshold.
    await vi.runAllTimersAsync();

    expect(persistMock).toHaveBeenCalledOnce();
    // The persisted session is the last one passed.
    expect(persistMock).toHaveBeenCalledWith(expect.objectContaining({ screen: 'HOME' }));
  });

  it('fires again after a second burst following the debounce cooldown', async () => {
    const persistMock = vi.fn().mockResolvedValue(undefined);
    vi.doMock('../../../src/infrastructure', () => ({
      persistAppSessionAsync: persistMock,
      restorePersistedAppSessionAsync: vi.fn().mockResolvedValue(null),
      clearPersistedAppSessionAsync: vi.fn().mockResolvedValue(undefined),
    }));

    const { persistAppSession } = await import('../../../src/app/appShell');

    const session = buildMinimalSession('B');

    // First burst.
    persistAppSession({ ...session, screen: 'MATCH' });
    await vi.runAllTimersAsync();
    expect(persistMock).toHaveBeenCalledOnce();

    // Second burst after cooldown.
    persistAppSession({ ...session, screen: 'STATS' });
    await vi.runAllTimersAsync();
    expect(persistMock).toHaveBeenCalledTimes(2);
    expect(persistMock).toHaveBeenLastCalledWith(expect.objectContaining({ screen: 'STATS' }));
  });

  // Spec ref: spec:counter/external-match-link (flush before leaving the page)
  it('writes the pending session immediately on flush and cancels the debounced write', async () => {
    const persistMock = vi.fn().mockResolvedValue(undefined);
    vi.doMock('../../../src/infrastructure', () => ({
      persistAppSessionAsync: persistMock,
      restorePersistedAppSessionAsync: vi.fn().mockResolvedValue(null),
      clearPersistedAppSessionAsync: vi.fn().mockResolvedValue(undefined),
    }));

    const { flushAppSessionPersistence, persistAppSession } = await import('../../../src/app/appShell');

    persistAppSession({ ...buildMinimalSession('C'), screen: 'STATS' });
    flushAppSessionPersistence();
    expect(persistMock).toHaveBeenCalledOnce();
    expect(persistMock).toHaveBeenCalledWith(expect.objectContaining({ screen: 'STATS' }));

    await vi.runAllTimersAsync();
    expect(persistMock).toHaveBeenCalledOnce();
  });

  it('does nothing on flush when no write is pending', async () => {
    const persistMock = vi.fn().mockResolvedValue(undefined);
    vi.doMock('../../../src/infrastructure', () => ({
      persistAppSessionAsync: persistMock,
      restorePersistedAppSessionAsync: vi.fn().mockResolvedValue(null),
      clearPersistedAppSessionAsync: vi.fn().mockResolvedValue(undefined),
    }));

    const { flushAppSessionPersistence, persistAppSession } = await import('../../../src/app/appShell');

    flushAppSessionPersistence();
    persistAppSession(buildMinimalSession('D'));
    await vi.runAllTimersAsync();
    flushAppSessionPersistence();
    expect(persistMock).toHaveBeenCalledOnce();
  });
});

function buildMinimalSession(id: string) {
  return {
    screen: 'HOME' as const,
    selectedGameType: 'X01' as const,
    currentMatch: null,
    matchWinner: '',
    arenaPrefillPlayers: [],
    arenaPrefillConfig: undefined,
    cricketResults: null,
    triathlonData: null,
    capitalResults: [],
    killerResults: null,
    gotchaResults: null,
    matchRuntime: null,
    _testId: id,
  };
}
