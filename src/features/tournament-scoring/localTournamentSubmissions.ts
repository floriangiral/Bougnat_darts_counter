import type {
  TournamentResultSubmission,
  TournamentSubmissionRecord,
} from '../../application/scoring/tournamentScoring';
import type { TournamentSubmissionRepository } from '../../application/scoring/ports';
import { TournamentScoringApiError } from './tournamentScoringApi';

export const TOURNAMENT_SUBMISSION_STORAGE_KEY = 'bougnat-tournament-submissions-v2';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export const createTournamentSubmissionRecord = (
  submission: TournamentResultSubmission,
  status: TournamentSubmissionRecord['status'],
  errorMessage?: string,
): TournamentSubmissionRecord => ({
  ...submission,
  status,
  errorMessage,
  updatedAt: new Date().toISOString(),
});

export class LocalTournamentSubmissionRepository implements TournamentSubmissionRepository {
  constructor(
    private readonly storage: StorageLike | null = typeof window !== 'undefined' ? window.localStorage : null,
  ) {}

  async saveDraft(record: TournamentSubmissionRecord): Promise<void> {
    const drafts = await this.listDrafts();
    this.writeDrafts([record, ...drafts.filter((draft) => draft.idempotencyKey !== record.idempotencyKey)].slice(0, 25));
  }

  async getDraft(idempotencyKey: string): Promise<TournamentSubmissionRecord | null> {
    const drafts = await this.listDrafts();
    return drafts.find((draft) => draft.idempotencyKey === idempotencyKey) ?? null;
  }

  async listDrafts(): Promise<TournamentSubmissionRecord[]> {
    if (!this.storage) return [];
    try {
      const rawValue = this.storage.getItem(TOURNAMENT_SUBMISSION_STORAGE_KEY);
      if (!rawValue) return [];
      const parsed = JSON.parse(rawValue) as unknown;
      return Array.isArray(parsed) ? parsed as TournamentSubmissionRecord[] : [];
    } catch {
      return [];
    }
  }

  async markSubmitted(idempotencyKey: string, remoteSubmissionId?: string): Promise<void> {
    await this.updateDraft(idempotencyKey, { status: 'submitted', remoteSubmissionId, errorMessage: undefined });
  }

  async markFailed(
    idempotencyKey: string,
    status: TournamentSubmissionRecord['status'],
    errorMessage: string,
  ): Promise<void> {
    await this.updateDraft(idempotencyKey, { status: status === 'submitted' ? 'network_error' : status, errorMessage });
  }

  private async updateDraft(
    idempotencyKey: string,
    patch: Pick<TournamentSubmissionRecord, 'status'> & Partial<TournamentSubmissionRecord>,
  ) {
    const drafts = await this.listDrafts();
    this.writeDrafts(drafts.map((draft) => (
      draft.idempotencyKey === idempotencyKey
        ? { ...draft, ...patch, updatedAt: new Date().toISOString() }
        : draft
    )));
  }

  private writeDrafts(drafts: TournamentSubmissionRecord[]) {
    if (!this.storage) return;
    try {
      this.storage.setItem(TOURNAMENT_SUBMISSION_STORAGE_KEY, JSON.stringify(drafts));
    } catch {
      // Best effort local resilience only.
    }
  }
}

export async function submitTournamentResultWithLocalDraft(
  gateway: { submitResult(submission: TournamentResultSubmission): Promise<TournamentSubmissionRecord> },
  repository: TournamentSubmissionRepository,
  submission: TournamentResultSubmission,
): Promise<TournamentSubmissionRecord> {
  const pendingRecord = createTournamentSubmissionRecord(submission, 'pending');
  await repository.saveDraft(pendingRecord);

  try {
    const submitted = await gateway.submitResult(submission);
    await repository.saveDraft(submitted);
    await repository.markSubmitted(submission.idempotencyKey, submitted.remoteSubmissionId);
    return submitted;
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : 'Soumission tournoi en attente de retry.';
    const mappedStatus = getSubmissionFailureStatus(error);
    await repository.markFailed(submission.idempotencyKey, mappedStatus, message);
    return {
      ...pendingRecord,
      status: mappedStatus,
      errorMessage: message,
      updatedAt: new Date().toISOString(),
    };
  }
}

const getSubmissionFailureStatus = (error: unknown): TournamentSubmissionRecord['status'] => {
  if (error instanceof TournamentScoringApiError && error.code) {
    if (error.code === 'network_error') {
      return 'network_error';
    }

    return error.code;
  }

  return 'network_error';
};
