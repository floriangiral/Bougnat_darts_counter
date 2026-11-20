// @vitest-environment jsdom
// Spec ref: specs/010-counter-offline-session-recovery-guarantees (Révision V2 : V2-FR-07, V2-AC-06).
import 'fake-indexeddb/auto';

import { beforeEach, describe, expect, it } from 'vitest';

import { createMatch } from '../../../src/application/scoring/matchLifecycle';
import { persistAppSessionAsync } from '../../../src/infrastructure';
import type { PersistedAppSession } from '../../../src/shared';
import type { GameConfig, MatchState, Player } from '../../../types';

const CURRENT_MATCH_FALLBACK_KEY = 'bougnat-current-match-v1';

const players: Player[] = [
  { id: 'anne', name: 'Anne', teamId: 'team1' },
  { id: 'zoe', name: 'Zoé', teamId: 'team2' },
];
const config: GameConfig = {
  startingScore: 501, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS', legsToWin: 1, setsToWin: 1, isDoubles: false,
};

const buildSession = (match: MatchState | null): PersistedAppSession => ({
  screen: match ? 'MATCH' : 'GAME_SELECTION',
  selectedGameType: 'X01',
  currentMatch: match,
  matchWinner: '',
  arenaPrefillPlayers: [],
  cricketResults: null,
  triathlonData: null,
  capitalResults: [],
  matchRuntime: null,
});

const countCurrentMatchesInIndexedDb = () =>
  new Promise<number>((resolve, reject) => {
    const request = indexedDB.open('bougnat-counter-local');
    request.onerror = () => reject(request.error ?? new Error('open failed'));
    request.onsuccess = () => {
      const db = request.result;
      const countRequest = db.transaction('current_matches', 'readonly').objectStore('current_matches').count();
      countRequest.onsuccess = () => {
        db.close();
        resolve(countRequest.result);
      };
      countRequest.onerror = () => reject(countRequest.error ?? new Error('count failed'));
    };
  });

const countCurrentMatchesInLocalStorage = () =>
  Object.keys(JSON.parse(window.localStorage.getItem(CURRENT_MATCH_FALLBACK_KEY) ?? '{}') as Record<string, unknown>).length;

beforeEach(() => {
  window.localStorage.clear();
});

describe('purge de current_matches', () => {
  it('ne conserve que la partie en cours après dix parties X01, puis plus rien sans partie', async () => {
    for (let game = 0; game < 10; game += 1) {
      await persistAppSessionAsync(buildSession(createMatch(players, config)));
    }

    expect(await countCurrentMatchesInIndexedDb()).toBeLessThanOrEqual(1);
    expect(countCurrentMatchesInLocalStorage()).toBeLessThanOrEqual(1);

    await persistAppSessionAsync(buildSession(null));

    expect(await countCurrentMatchesInIndexedDb()).toBe(0);
    expect(countCurrentMatchesInLocalStorage()).toBe(0);
  });
});
