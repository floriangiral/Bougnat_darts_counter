import { toBackendSubmitScoreRequest } from '../../application/mappers';
import type {
  PullSyncResult,
  ScoringTerminalSyncAdapter,
  SubmitScoreVisitResult,
} from '../../application/ports';
import type { SubmitScoreVisitCommand, SyncPullItem } from '../../domain/types';

type RequestSuccessEnvelope<T> = {
  data: T;
  request_id?: string;
};

type RequestErrorEnvelope = {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    request_id?: string;
  };
};

type BackendSubmitScoreResponse = {
  status: string;
  event_id?: string;
};

type BackendPullResponse = {
  cursor: string;
  items: Array<{
    sync_operation_id: string;
    target_type: string;
    target_id: string;
    operation_type: string;
    status: string;
    payload: Record<string, unknown>;
    received_at: string;
  }>;
};

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const parseErrorEnvelope = async (response: Response): Promise<RequestErrorEnvelope['error'] | null> => {
  try {
    const body = (await response.json()) as unknown;
    if (!isRecord(body)) return null;
    const error = body.error;
    if (!isRecord(error)) return null;
    if (typeof error.code !== 'string') return null;
    if (typeof error.message !== 'string') return null;

    return {
      code: error.code,
      message: error.message,
      details: isRecord(error.details) ? error.details : undefined,
      request_id: typeof error.request_id === 'string' ? error.request_id : undefined,
    };
  } catch {
    return null;
  }
};

const shouldTreatAsMatchClosed = (errorMessage: string) => {
  const normalized = errorMessage.toLowerCase();
  return normalized.includes('match status does not allow scoring') ||
    normalized.includes('match scoring status does not allow');
};

const mapPullItems = (items: BackendPullResponse['items']): SyncPullItem[] =>
  items.map((item) => ({
    syncOperationID: item.sync_operation_id,
    targetType: item.target_type,
    targetID: item.target_id,
    operationType: item.operation_type,
    status: item.status,
    payload: item.payload,
    receivedAt: item.received_at,
  }));

export class TournamentApiScoringSyncAdapter implements ScoringTerminalSyncAdapter {
  private readonly baseURL: string;
  private readonly fetchImpl: FetchLike;
  private readonly getAccessToken: (() => Promise<string | null>) | null;

  constructor(options: {
    baseURL: string;
    fetchImpl?: FetchLike;
    getAccessToken?: () => Promise<string | null>;
  }) {
    this.baseURL = options.baseURL.replace(/\/$/, '');
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.getAccessToken = options.getAccessToken ?? null;
  }

  async submitScoreVisit(command: SubmitScoreVisitCommand): Promise<SubmitScoreVisitResult> {
    const payload = toBackendSubmitScoreRequest(command);

    try {
      const response = await this.fetchImpl(`${this.baseURL}/scoring/events`, {
        method: 'POST',
        headers: await this.buildJSONHeaders(),
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const body = (await response.json()) as RequestSuccessEnvelope<BackendSubmitScoreResponse>;
        const status = body?.data?.status;
        const eventID = body?.data?.event_id ?? null;

        if (status === 'accepted') return { kind: 'accepted', eventId: eventID };
        if (status === 'duplicate') return { kind: 'duplicate', eventId: eventID };
        if (status === 'rejected') {
          return {
            kind: 'rejected',
            reasonCode: 'backend_rejected',
            message: 'backend rejected operation',
            resyncRequired: true,
            matchClosed: false,
          };
        }

        return {
          kind: 'retryable_error',
          reasonCode: 'unexpected_backend_status',
          message: `unexpected scoring status: ${String(status ?? 'unknown')}`,
        };
      }

      const apiError = await parseErrorEnvelope(response);
      if (response.status === 409) {
        return {
          kind: 'conflict',
          reasonCode: apiError?.code ?? 'conflict',
          message: apiError?.message ?? 'server conflict',
          serverState: apiError?.details ?? null,
          conflictKind: 'technical',
          resyncRequired: true,
        };
      }
      if (response.status === 400) {
        const message = apiError?.message ?? 'bad request';
        return {
          kind: 'rejected',
          reasonCode: apiError?.code ?? 'bad_request',
          message,
          resyncRequired: shouldTreatAsMatchClosed(message),
          matchClosed: shouldTreatAsMatchClosed(message),
        };
      }
      if (response.status === 401 || response.status === 403) {
        return {
          kind: 'fatal_error',
          reasonCode: apiError?.code ?? 'unauthorized',
          message: apiError?.message ?? 'authentication or scope issue',
        };
      }
      if (response.status >= 500) {
        return {
          kind: 'retryable_error',
          reasonCode: apiError?.code ?? 'server_unavailable',
          message: apiError?.message ?? 'server unavailable',
        };
      }

      return {
        kind: 'retryable_error',
        reasonCode: apiError?.code ?? 'unexpected_http_status',
        message: apiError?.message ?? `unexpected status: ${response.status}`,
      };
    } catch (error) {
      return {
        kind: 'retryable_error',
        reasonCode: 'network_error',
        message: error instanceof Error ? error.message : 'network error',
      };
    }
  }

  async pullSync(deviceSessionID: string, cursor: string | null): Promise<PullSyncResult> {
    const query = new URLSearchParams();
    query.set('device_id', deviceSessionID);
    if (cursor) {
      query.set('cursor', cursor);
    }

    try {
      const response = await this.fetchImpl(`${this.baseURL}/sync/pull?${query.toString()}`, {
        method: 'GET',
        headers: await this.buildJSONHeaders(),
      });

      if (response.ok) {
        const body = (await response.json()) as RequestSuccessEnvelope<BackendPullResponse>;
        const data = body?.data;
        return {
          kind: 'ok',
          cursor: data?.cursor ?? cursor ?? '',
          items: Array.isArray(data?.items) ? mapPullItems(data.items) : [],
        };
      }

      const apiError = await parseErrorEnvelope(response);
      if (response.status === 401 || response.status === 403) {
        return {
          kind: 'fatal_error',
          reasonCode: apiError?.code ?? 'unauthorized',
          message: apiError?.message ?? 'authentication or scope issue',
        };
      }
      if (response.status >= 500) {
        return {
          kind: 'retryable_error',
          reasonCode: apiError?.code ?? 'server_unavailable',
          message: apiError?.message ?? 'server unavailable',
        };
      }
      return {
        kind: 'retryable_error',
        reasonCode: apiError?.code ?? 'sync_pull_failed',
        message: apiError?.message ?? `unexpected status: ${response.status}`,
      };
    } catch (error) {
      return {
        kind: 'retryable_error',
        reasonCode: 'network_error',
        message: error instanceof Error ? error.message : 'network error',
      };
    }
  }

  private async buildJSONHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (!this.getAccessToken) {
      return headers;
    }

    const token = await this.getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }
}
