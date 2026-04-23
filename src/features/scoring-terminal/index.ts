import { env } from '../../lib/env';

import { ScoringTerminalClient } from './application/client';
import { ScoringTerminalOperationQueue } from './application/operationQueue';
import { IndexedDbScoringTerminalRepository } from './infra/local/indexedDbRepository';
import { TournamentApiScoringSyncAdapter } from './infra/sync/tournamentApiAdapter';

const resolveTournamentApiBaseURL = () => {
  const fallback = env.VITE_APP_URL?.replace(/\/$/, '');
  const raw = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_TOURNAMENT_API_URL ?? fallback;
  return (raw ?? '').replace(/\/$/, '');
};

export const createScoringTerminalClient = () => {
  const repository = new IndexedDbScoringTerminalRepository();
  const adapter = new TournamentApiScoringSyncAdapter({
    baseURL: resolveTournamentApiBaseURL(),
  });
  const queue = new ScoringTerminalOperationQueue({
    repository,
    adapter,
  });

  return new ScoringTerminalClient({
    repository,
    queue,
  });
};

export * from './domain/types';
export * from './application/mappers';
export * from './application/ports';
export * from './application/operationQueue';
export * from './application/client';
export * from './infra/sync/tournamentApiAdapter';
export * from './infra/local/inMemoryRepository';
export * from './infra/local/indexedDbRepository';
