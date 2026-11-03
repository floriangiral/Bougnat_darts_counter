// @vitest-environment jsdom
import 'fake-indexeddb/auto';

import { describe, expect, it } from 'vitest';

import { createMatch } from '../../../src/application/scoring/matchLifecycle';
import {
  clearPersistedAppSessionAsync, listLocalGameHistory, persistAppSessionAsync,
  restorePersistedAppSessionAsync, saveFinishedMatchLocally, saveLocalGameHistoryEntry,
} from '../../../src/infrastructure/local/sessionPersistence';
import { IndexedDBSessionRepository } from '../../../src/infrastructure/local/IndexedDBSessionRepository';
import type { PersistedAppSession } from '../../../src/shared';

describe('session persistence integration', () => {
  it('round-trips an app session and its current match, then clears the session', async () => {
    const match = createMatch([{ id: 'alice', name: 'Alice', teamId: 'p1' }], {
      startingScore: 501, checkIn: 'Open', checkOut: 'Double',
      matchMode: 'LEGS', legsToWin: 1, setsToWin: 1, isDoubles: false,
    });
    const session: PersistedAppSession = {
      screen: 'MATCH', selectedGameType: 'X01', currentMatch: match,
      matchWinner: '', arenaPrefillPlayers: [], capitalResults: [],
      cricketResults: null, triathlonData: null, matchRuntime: null,
    };
    await clearPersistedAppSessionAsync();
    await expect(restorePersistedAppSessionAsync()).resolves.toBeNull();
    await persistAppSessionAsync(session);
    await expect(restorePersistedAppSessionAsync()).resolves.toEqual(session);
    const reader = new IndexedDBSessionRepository();
    await expect(reader.getCurrentMatch(match.id)).resolves.toEqual(match);

    await persistAppSessionAsync({ ...session, currentMatch: null, screen: 'HOME' });
    await expect(restorePersistedAppSessionAsync()).resolves.toEqual({
      ...session, currentMatch: null, screen: 'HOME',
    });
    await clearPersistedAppSessionAsync();
    await expect(restorePersistedAppSessionAsync()).resolves.toBeNull();
  });

  it('saves finished X01 and other game histories, updates duplicate IDs and returns newest first', async () => {
    const match = createMatch([{ id: 'bob', name: 'Bob', teamId: 'p2' }], {
      startingScore: 40, checkIn: 'Open', checkOut: 'Double',
      matchMode: 'LEGS', legsToWin: 1, setsToWin: 1, isDoubles: false,
    });
    await saveFinishedMatchLocally({ ...match, status: 'finished', matchWinnerId: 'p2' });
    const entry = {
      id: 'cricket:integration', gameType: 'CRICKET' as const,
      completedAt: '2099-01-01T00:00:00.000Z', winnerId: 'bob', payload: { score: 60 },
    };
    await saveLocalGameHistoryEntry(entry);
    await saveLocalGameHistoryEntry({ ...entry, payload: { score: 80 } });
    const history = await listLocalGameHistory();
    expect(history[0]).toEqual({ ...entry, payload: { score: 80 } });
    expect(history.filter((item) => item.id === entry.id)).toHaveLength(1);
    expect(history).toContainEqual(expect.objectContaining({
      id: match.id, gameType: 'X01', winnerId: 'p2',
      payload: { match: { ...match, status: 'finished', matchWinnerId: 'p2' } },
    }));
  });
});
