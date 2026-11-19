// Spec: spec:counter/offline-scoring-terminal-foundation
//
// Random identifiers (RFC 4122 version 4). crypto.randomUUID only exists in secure
// contexts (https, localhost): a page served over http from a LAN address, as when a
// phone tests the counter against a local partner app, does not have it, and creating
// a match used to throw. crypto.getRandomValues is available everywhere.

export interface CryptoLike {
  getRandomValues(array: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer>;
  randomUUID?: () => string;
}

const HEX = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));

export const createId = (cryptoImpl: CryptoLike = globalThis.crypto): string => {
  if (typeof cryptoImpl.randomUUID === 'function') {
    return cryptoImpl.randomUUID();
  }
  const bytes = cryptoImpl.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant RFC 4122
  const hex = Array.from(bytes, (b) => HEX[b]);
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
};
