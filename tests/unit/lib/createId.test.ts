// Spec: spec:counter/offline-scoring-terminal-foundation
import { describe, expect, it } from 'vitest';
import { webcrypto } from 'node:crypto';

import { createId, type CryptoLike } from '../../../src/shared/ids/createId';
import { createMatch } from '../../../src/application/scoring/matchLifecycle';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

// Same as a page served over http from a LAN address: no randomUUID
const insecureCrypto: CryptoLike = { getRandomValues: (array: Uint8Array<ArrayBuffer>) => webcrypto.getRandomValues(array) };

describe('createId', () => {
  it('uses crypto.randomUUID when the context provides it', () => {
    expect(createId({ ...insecureCrypto, randomUUID: () => 'from-random-uuid' })).toBe('from-random-uuid');
  });

  it('builds a version 4 UUID without crypto.randomUUID (http on a LAN address)', () => {
    const ids = new Set(Array.from({ length: 50 }, () => createId(insecureCrypto)));
    expect(ids.size).toBe(50);
    ids.forEach((id) => expect(id).toMatch(UUID_V4));
  });

  it('defaults to the global crypto', () => {
    expect(createId()).toMatch(UUID_V4);
  });

  it('lets a match be created when crypto.randomUUID is missing', () => {
    // randomUUID lives on the prototype: an own property hides it, deleting it restores it
    const ownDescriptor = Object.getOwnPropertyDescriptor(globalThis.crypto, 'randomUUID');
    Object.defineProperty(globalThis.crypto, 'randomUUID', { value: undefined, configurable: true });
    try {
      const match = createMatch(
        [{ id: 'p1', name: 'Alice', teamId: 'p1' }, { id: 'p2', name: 'Bob', teamId: 'p2' }],
        { startingScore: 501, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS', setsToWin: 1, legsToWin: 2, isDoubles: false },
      );
      expect(match.id).toMatch(UUID_V4);
    } finally {
      if (ownDescriptor) Object.defineProperty(globalThis.crypto, 'randomUUID', ownDescriptor);
      else Reflect.deleteProperty(globalThis.crypto, 'randomUUID');
    }
  });
});
