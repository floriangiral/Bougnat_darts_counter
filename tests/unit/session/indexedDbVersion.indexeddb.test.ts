// @vitest-environment jsdom
// Spec ref: specs/010-counter-offline-session-recovery-guarantees (V2-FR-07) — revue : pas de montée de
// version IndexedDB, qu'un ancien onglet resté ouvert bloquerait indéfiniment.
import 'fake-indexeddb/auto';

import { describe, expect, it } from 'vitest';

import { persistAppSessionAsync } from '../../../src/infrastructure';
import type { PersistedAppSession } from '../../../src/shared';

const DB_NAME = 'bougnat-counter-local';

const requestDone = <T>(request: IDBRequest<T>) => new Promise<T>((resolve, reject) => {
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error ?? new Error('request failed'));
});

// Base as created by the 2.0.0 release (version 1), with orphan entries, left open as by an old tab.
const openLegacyDatabaseWithOrphans = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = () => {
    for (const store of ['app_sessions', 'current_matches', 'match_history']) {
      request.result.createObjectStore(store, { keyPath: 'id' });
    }
  };
  request.onerror = () => reject(request.error ?? new Error('open failed'));
  request.onsuccess = () => {
    const db = request.result;
    const tx = db.transaction('current_matches', 'readwrite');
    ['m1', 'm2', 'm3'].forEach((id) => tx.objectStore('current_matches').put({ id, match: {}, updatedAt: '' }));
    tx.oncomplete = () => resolve(db);
  };
});

const session: PersistedAppSession = {
  screen: 'GAME_SELECTION', selectedGameType: 'CRICKET', currentMatch: null, matchWinner: '', arenaPrefillPlayers: [],
  cricketResults: null, triathlonData: null, capitalResults: [], matchRuntime: null,
};

describe('base IndexedDB existante', () => {
  it('reste en version 1, n’est pas bloquée par un ancien onglet et purge les parties orphelines', async () => {
    const oldTab = await openLegacyDatabaseWithOrphans();

    await expect(persistAppSessionAsync(session)).resolves.toBe(true);

    expect(oldTab.version).toBe(1);
    const count = await requestDone(oldTab.transaction('current_matches', 'readonly').objectStore('current_matches').count());
    expect(count).toBe(0);
    oldTab.close();
  }, 5_000);
});
