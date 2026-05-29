import type { PersonalScoringMatchPayload, PersonalScoringMatchResponse } from './playerAccountTypes';
import { PlayerAccountApiError, submitPlayerPersonalMatch } from './playerAccountApi';

export const PERSONAL_X01_MATCH_STORAGE_KEY = 'bougnat-personal-x01-matches-v1';

export type PersonalX01SyncStatus =
  | 'sync_pending'
  | 'syncing'
  | 'synced'
  | 'conflict'
  | 'unauthorized'
  | 'rejected'
  | 'failed';

export type PersonalX01MatchRecord = {
  clientMatchId: string;
  payload: PersonalScoringMatchPayload;
  status: PersonalX01SyncStatus;
  errorMessage?: string;
  response?: PersonalScoringMatchResponse;
  updatedAt: string;
};

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

const getPersonalScoringRecordKey = (payload: PersonalScoringMatchPayload): string =>
  payload.participant_key ? `${payload.client_match_id}:${payload.participant_key}` : payload.client_match_id;

export class LocalPersonalX01MatchRepository {
  constructor(
    private readonly storage: StorageLike | null = typeof window !== 'undefined' ? window.localStorage : null,
  ) {}

  async save(record: PersonalX01MatchRecord): Promise<void> {
    const records = await this.list();
    this.write([
      record,
      ...records.filter((item) => item.clientMatchId !== record.clientMatchId),
    ].slice(0, 50));
  }

  async savePending(payload: PersonalScoringMatchPayload): Promise<void> {
    await this.save(createPersonalX01MatchRecord(payload, 'sync_pending'));
  }

  async list(): Promise<PersonalX01MatchRecord[]> {
    if (!this.storage) return [];
    try {
      const rawValue = this.storage.getItem(PERSONAL_X01_MATCH_STORAGE_KEY);
      if (!rawValue) return [];
      const parsed = JSON.parse(rawValue) as unknown;
      return Array.isArray(parsed) ? parsed as PersonalX01MatchRecord[] : [];
    } catch {
      return [];
    }
  }

  async listRetryable(): Promise<PersonalX01MatchRecord[]> {
    const records = await this.list();
    return records.filter((record) => record.status === 'sync_pending' || record.status === 'failed');
  }

  async mark(clientMatchId: string, status: PersonalX01SyncStatus, errorMessage?: string, response?: PersonalScoringMatchResponse): Promise<void> {
    const records = await this.list();
    this.write(records.map((record) => (
      record.clientMatchId === clientMatchId
        ? { ...record, status, errorMessage, response, updatedAt: new Date().toISOString() }
        : record
    )));
  }

  private write(records: PersonalX01MatchRecord[]) {
    if (!this.storage) return;
    try {
      this.storage.setItem(PERSONAL_X01_MATCH_STORAGE_KEY, JSON.stringify(records));
    } catch {
      // Best-effort offline cache.
    }
  }
}

export const createPersonalX01MatchRecord = (
  payload: PersonalScoringMatchPayload,
  status: PersonalX01SyncStatus,
  errorMessage?: string,
  response?: PersonalScoringMatchResponse,
): PersonalX01MatchRecord => ({
  clientMatchId: getPersonalScoringRecordKey(payload),
  payload,
  status,
  errorMessage,
  response,
  updatedAt: new Date().toISOString(),
});

export class HttpPersonalX01MatchGateway {
  constructor(
    private readonly apiBaseUrl: string,
    private readonly getBearerToken: () => Promise<string | null>,
  ) {}

  async submitPersonalMatch(payload: PersonalScoringMatchPayload): Promise<PersonalScoringMatchResponse> {
    const bearerToken = await this.getBearerToken();
    if (!bearerToken) {
      throw new PlayerAccountApiError('Session joueur indisponible.', 401, 'unauthorized');
    }
    return submitPlayerPersonalMatch(this.apiBaseUrl, bearerToken, payload);
  }
}

export async function submitPersonalX01MatchWithLocalDraft(
  gateway: { submitPersonalMatch(payload: PersonalScoringMatchPayload): Promise<PersonalScoringMatchResponse> },
  repository: LocalPersonalX01MatchRepository,
  payload: PersonalScoringMatchPayload,
): Promise<PersonalX01MatchRecord> {
  const pendingRecord = createPersonalX01MatchRecord(payload, 'sync_pending');
  await repository.save(pendingRecord);

  try {
    await repository.mark(pendingRecord.clientMatchId, 'syncing');
    const response = await gateway.submitPersonalMatch(payload);
    await repository.mark(pendingRecord.clientMatchId, 'synced', undefined, response);
    return createPersonalX01MatchRecord(payload, 'synced', undefined, response);
  } catch (error) {
    const status = mapPersonalMatchFailureStatus(error);
    const message = error instanceof Error && error.message ? error.message : 'Synchronisation du match en attente.';
    await repository.mark(pendingRecord.clientMatchId, status, message);
    return createPersonalX01MatchRecord(payload, status, message);
  }
}

export async function retryPendingPersonalX01Matches(
  gateway: { submitPersonalMatch(payload: PersonalScoringMatchPayload): Promise<PersonalScoringMatchResponse> },
  repository = new LocalPersonalX01MatchRepository(),
): Promise<PersonalX01MatchRecord[]> {
  const retryableRecords = await repository.listRetryable();
  const results: PersonalX01MatchRecord[] = [];
  for (const record of retryableRecords) {
    results.push(await submitPersonalX01MatchWithLocalDraft(gateway, repository, record.payload));
  }
  return results;
}

const mapPersonalMatchFailureStatus = (error: unknown): PersonalX01SyncStatus => {
  if (error instanceof PlayerAccountApiError) {
    if (error.status === 401) return 'unauthorized';
    if (error.status === 409) return 'conflict';
    if (error.status === 400 || error.status === 422) return 'rejected';
  }
  return 'sync_pending';
};
