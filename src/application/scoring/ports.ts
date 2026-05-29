import type { MatchState } from '../../../types';
import type {
  TournamentMatchDetail,
  TournamentMatchSummary,
  TournamentResultSubmission,
  TournamentSubmissionRecord,
} from './tournamentScoring';

export interface SessionRepository {
  getCurrentMatch(matchId: string): Promise<MatchState | null>;
  saveCurrentMatch(match: MatchState): Promise<void>;
  saveMatchHistory(match: MatchState): Promise<void>;
}

export interface TournamentScoringGateway {
  listAssignedMatches(signal?: AbortSignal): Promise<TournamentMatchSummary[]>;
  loadMatch(tournamentId: string, matchId: string, signal?: AbortSignal): Promise<TournamentMatchDetail>;
  submitResult(submission: TournamentResultSubmission, signal?: AbortSignal): Promise<TournamentSubmissionRecord>;
}

export interface TournamentSubmissionRepository {
  saveDraft(record: TournamentSubmissionRecord): Promise<void>;
  getDraft(idempotencyKey: string): Promise<TournamentSubmissionRecord | null>;
  listDrafts(): Promise<TournamentSubmissionRecord[]>;
  markSubmitted(idempotencyKey: string, remoteSubmissionId?: string): Promise<void>;
  markFailed(
    idempotencyKey: string,
    status: TournamentSubmissionRecord['status'],
    errorMessage: string,
  ): Promise<void>;
}

export type SyncRepository = TournamentScoringGateway;
