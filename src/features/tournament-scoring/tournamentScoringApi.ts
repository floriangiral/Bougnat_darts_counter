import type {
  TournamentMatchDetail,
  TournamentMatchSummary,
  TournamentResultSubmission,
  TournamentSubmissionRecord,
} from '../../application/scoring/tournamentScoring';
import {
  mapTournamentMatchDetail,
  mapTournamentMatchSummary,
} from '../../application/scoring/tournamentScoring';
import type { TournamentScoringGateway } from '../../application/scoring/ports';

export class TournamentScoringApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: 'unauthorized' | 'conflict' | 'rejected' | 'network_error',
  ) {
    super(message);
    this.name = 'TournamentScoringApiError';
  }
}

type TokenProvider = () => Promise<string>;

const normalizeApiBaseUrl = (apiBaseUrl: string): string => apiBaseUrl.trim().replace(/\/$/, '');

const buildUrl = (apiBaseUrl: string, path: string): string => `${normalizeApiBaseUrl(apiBaseUrl)}${path}`;

const getRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' ? value as Record<string, unknown> : null;

const readResponseJson = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new TournamentScoringApiError('Reponse tournoi illisible.', response.status);
  }
};

const unwrapApiData = (body: unknown): unknown => {
  const record = getRecord(body);
  return record && 'data' in record ? record.data : body;
};

const getErrorMessage = (body: unknown): string | null => {
  const record = getRecord(body);
  const nestedError = getRecord(record?.error);
  for (const source of [record, nestedError]) {
    if (!source) continue;
    for (const key of ['message', 'error', 'detail']) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
  }
  return null;
};

const classifyError = (status: number): TournamentScoringApiError['code'] => {
  if (status === 401) return 'unauthorized';
  if (status === 409) return 'conflict';
  if (status === 422 || status === 403) return 'rejected';
  return undefined;
};

async function fetchApiData(
  apiBaseUrl: string,
  bearerToken: string,
  path: string,
  init: RequestInit,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(buildUrl(apiBaseUrl, path), {
      ...init,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${bearerToken}`,
        ...init.headers,
      },
    });
  } catch (error) {
    throw new TournamentScoringApiError(
      error instanceof Error && error.message ? error.message : 'Reseau indisponible.',
      undefined,
      'network_error',
    );
  }

  const body = await readResponseJson(response);
  if (!response.ok) {
    throw new TournamentScoringApiError(
      getErrorMessage(body) ?? `Service tournoi indisponible (${response.status}).`,
      response.status,
      classifyError(response.status),
    );
  }

  return unwrapApiData(body);
}

const normalizeList = (body: unknown): unknown[] => {
  if (Array.isArray(body)) return body;
  const record = getRecord(body);
  for (const key of ['matches', 'items', 'assigned_matches', 'assignedMatches']) {
    const value = record?.[key];
    if (Array.isArray(value)) return value;
  }
  return [];
};

export class HttpTournamentScoringClient implements TournamentScoringGateway {
  constructor(
    private readonly apiBaseUrl: string,
    private readonly getToken: TokenProvider,
  ) {}

  async listAssignedMatches(signal?: AbortSignal): Promise<TournamentMatchSummary[]> {
    const bearerToken = await this.getToken();
    const body = await fetchApiData(this.apiBaseUrl, bearerToken, '/v1/scoring/me/tournament-matches', {
      method: 'GET',
      signal,
    });
    return normalizeList(body)
      .map(mapTournamentMatchSummary)
      .filter((match): match is TournamentMatchSummary => Boolean(match));
  }

  async loadMatch(tournamentId: string, matchId: string, signal?: AbortSignal): Promise<TournamentMatchDetail> {
    const bearerToken = await this.getToken();
    const body = await fetchApiData(
      this.apiBaseUrl,
      bearerToken,
      `/v1/scoring/tournaments/${encodeURIComponent(tournamentId)}/matches/${encodeURIComponent(matchId)}`,
      { method: 'GET', signal },
    );
    return mapTournamentMatchDetail(body);
  }

  async submitResult(submission: TournamentResultSubmission, signal?: AbortSignal): Promise<TournamentSubmissionRecord> {
    const bearerToken = await this.getToken();
    const body = await fetchApiData(
      this.apiBaseUrl,
      bearerToken,
      `/v1/scoring/tournaments/${encodeURIComponent(submission.tournamentId)}/matches/${encodeURIComponent(submission.matchId)}/results`,
      {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': submission.idempotencyKey,
        },
        body: JSON.stringify(submission.payload),
      },
    );
    const record = getRecord(body);
    return {
      ...submission,
      status: 'submitted',
      remoteSubmissionId: typeof record?.id === 'string' ? record.id : undefined,
      updatedAt: new Date().toISOString(),
    };
  }
}

export const createMockTournamentScoringClient = (): TournamentScoringGateway => {
  const rawMatch = {
    tournament_id: 'mock-open',
    match_id: 'mock-match-1',
    tournament_name: 'Open Bougnat mock',
    label: 'Table 1 - 501',
    status: 'assigned',
    board_label: 'Table 1',
    starting_score: 101,
    legs_to_win: 1,
    match_mode: 'LEGS',
    check_in: 'Open',
    check_out: 'Open',
    players: [
      { id: 'mock-p1', display_name: 'Alice', team_id: 'team1' },
      { id: 'mock-p2', display_name: 'Bob', team_id: 'team2' },
    ],
    rights: { can_score: true, can_submit_result: true },
  };

  return {
    async listAssignedMatches() {
      const summary = mapTournamentMatchSummary(rawMatch);
      return summary ? [summary] : [];
    },
    async loadMatch() {
      return mapTournamentMatchDetail(rawMatch);
    },
    async submitResult(submission) {
      return {
        ...submission,
        status: 'submitted',
        remoteSubmissionId: 'mock-submission-1',
        updatedAt: new Date().toISOString(),
      };
    },
  };
};
