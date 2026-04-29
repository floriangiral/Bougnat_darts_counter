import { DeepgramClient } from '@deepgram/sdk';
import type { MutableRefObject } from 'react';

import type { DeepgramLiveConnection, DeepgramMessage } from './deepgramLiveTypes';
import { buildDeepgramListenConfig } from './voiceConfig';

export type DeepgramConnectionRefs = {
  connectionRef: MutableRefObject<DeepgramLiveConnection | null>;
  socketReadyRef: MutableRefObject<boolean>;
};

type DeepgramConnectionHandlers = {
  onOpen: () => void;
  onMessage: (message: DeepgramMessage) => void;
  onError: (error: Error) => void;
  onClose: (event: { code: number; reason: string }) => void;
};

export function cleanupDeepgramConnection(refs: DeepgramConnectionRefs) {
  if (refs.connectionRef.current) {
    refs.connectionRef.current.close();
  }
  refs.connectionRef.current = null;
  refs.socketReadyRef.current = false;
}

export async function connectDeepgramLive(
  refs: DeepgramConnectionRefs,
  accessToken: string,
  handlers: DeepgramConnectionHandlers,
) {
  const client = new DeepgramClient({ accessToken });
  const connection = await client.listen.v1.connect(
    buildDeepgramListenConfig(`Bearer ${accessToken}`),
  ) as DeepgramLiveConnection;
  refs.connectionRef.current = connection;

  connection.on('open', handlers.onOpen);
  connection.on('message', handlers.onMessage);
  connection.on('error', handlers.onError);
  connection.on('close', handlers.onClose);

  connection.connect();
  await connection.waitForOpen();

  return connection;
}