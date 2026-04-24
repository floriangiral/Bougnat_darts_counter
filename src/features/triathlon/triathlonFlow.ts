import type { BullAttempt, CapitalPlayerState, CricketMatchSummary, MatchState, Player, TriathlonResults } from '../../../types';
import { buildTriathlonScorecards, getTriathlonWinnerId, sortTriathlonScorecards, type TriathlonScorecard } from '../../../utils/triathlonScoring';

export type TriathlonPhase =
  | 'STARTING_DRAW'
  | 'CAPITAL'
  | 'TRANSITION_CRICKET'
  | 'CRICKET'
  | 'TRANSITION_X01'
  | 'X01'
  | 'TIE_BREAK_X01';

export const INITIAL_STARTER_DRAW_MESSAGE = 'Une fleche a la bulle pour determiner le premier lanceur.';

export const buildTriathlonCompetitors = (players: Player[], isDoubles: boolean): Player[] => {
  if (!isDoubles) {
    return players.map((player) => ({
      id: player.id,
      name: player.name,
      teamId: player.id,
    }));
  }

  const teamIds = Array.from(new Set(players.map((player) => player.teamId)));
  return teamIds.map((teamId, index) => ({
    id: teamId,
    name: `Equipe ${index + 1}`,
    teamId,
  }));
};

export const getAttemptValue = (attempt: BullAttempt | undefined) => {
  if (attempt === 'DOUBLE_BULL') return 50;
  if (attempt === 'BULL') return 25;
  return 0;
};

export const buildScoresFromScorecards = (scorecards: TriathlonScorecard[]) =>
  Object.fromEntries(scorecards.map((card) => [card.competitorId, card.totalScore]));

export const createInitialTriathlonFlowState = (): TriathlonFlowState => ({
  phase: 'STARTING_DRAW',
  results: {},
  startingCompetitorId: null,
  starterDrawAttempts: {},
  starterDrawMessage: INITIAL_STARTER_DRAW_MESSAGE,
  scorecards: [],
});

export type TriathlonFlowState = {
  phase: TriathlonPhase;
  results: TriathlonResults;
  startingCompetitorId: string | null;
  starterDrawAttempts: Record<string, BullAttempt | undefined>;
  starterDrawMessage: string;
  scorecards: TriathlonScorecard[];
};

export type TriathlonFlowAction =
  | { type: 'set_scorecards'; scorecards: TriathlonScorecard[] }
  | { type: 'advance_phase'; phase: Extract<TriathlonPhase, 'CRICKET' | 'X01'> }
  | { type: 'starter_attempts_updated'; attempts: Record<string, BullAttempt | undefined>; message?: string }
  | { type: 'starter_resolved'; starterId: string | null; attempts: Record<string, BullAttempt | undefined>; triathlonCompetitors: Player[] }
  | { type: 'capital_finished'; capital: CapitalPlayerState[]; triathlonCompetitors: Player[]; scorecards: TriathlonScorecard[] }
  | { type: 'cricket_finished'; cricket: CricketMatchSummary; triathlonCompetitors: Player[]; scorecards: TriathlonScorecard[] }
  | { type: 'x01_finished'; x01: MatchState; triathlonCompetitors: Player[]; scorecards: TriathlonScorecard[]; requiresTieBreak: boolean }
  | { type: 'tiebreak_finished'; tieBreakMatch: MatchState; tieBreakWinnerId: string | null; triathlonCompetitors: Player[] };

export const triathlonFlowReducer = (state: TriathlonFlowState, action: TriathlonFlowAction): TriathlonFlowState => {
  switch (action.type) {
    case 'set_scorecards':
      return { ...state, scorecards: action.scorecards };
    case 'advance_phase':
      return { ...state, phase: action.phase };
    case 'starter_attempts_updated':
      return {
        ...state,
        starterDrawAttempts: action.attempts,
        starterDrawMessage: action.message ?? state.starterDrawMessage,
      };
    case 'starter_resolved':
      return {
        ...state,
        phase: 'CAPITAL',
        startingCompetitorId: action.starterId,
        starterDrawAttempts: action.attempts,
        results: {
          ...state.results,
          startingBull: {
            attempts: action.attempts,
            starterId: action.starterId,
            triathlonCompetitors: action.triathlonCompetitors,
          },
        },
      };
    case 'capital_finished':
      return {
        ...state,
        phase: 'TRANSITION_CRICKET',
        results: {
          ...state.results,
          capital: action.capital,
          triathlonCompetitors: action.triathlonCompetitors,
        },
        scorecards: action.scorecards,
      };
    case 'cricket_finished':
      return {
        ...state,
        phase: 'TRANSITION_X01',
        results: {
          ...state.results,
          cricket: action.cricket,
          triathlonCompetitors: action.triathlonCompetitors,
        },
        scorecards: action.scorecards,
      };
    case 'x01_finished':
      return {
        ...state,
        phase: action.requiresTieBreak ? 'TIE_BREAK_X01' : state.phase,
        results: {
          ...state.results,
          x01: action.x01,
          triathlonCompetitors: action.triathlonCompetitors,
        },
        scorecards: action.scorecards,
      };
    case 'tiebreak_finished':
      return {
        ...state,
        results: {
          ...state.results,
          tieBreakMatch: action.tieBreakMatch,
          tieBreakWinnerId: action.tieBreakWinnerId,
          triathlonCompetitors: action.triathlonCompetitors,
        },
      };
    default:
      return state;
  }
};

export const finalizeTriathlonResults = (
  nextResults: TriathlonResults,
  nextScorecards: TriathlonScorecard[],
  triathlonCompetitors: Player[],
  onFinish: (globalScores: Record<string, number>, results: TriathlonResults) => void,
) => {
  const ordered = sortTriathlonScorecards(nextScorecards, nextResults.tieBreakWinnerId);
  const topScore = ordered[0]?.totalScore ?? 0;
  const tiedCompetitors = ordered.filter((card) => card.totalScore === topScore);

  if (tiedCompetitors.length > 1 && !nextResults.tieBreakWinnerId) {
    return false;
  }

  const winnerId = getTriathlonWinnerId(nextScorecards, nextResults.tieBreakWinnerId);
  onFinish(buildScoresFromScorecards(nextScorecards), {
    ...nextResults,
    finalWinnerId: winnerId,
    scorecards: nextScorecards,
    triathlonCompetitors,
  });
  return true;
};

export const rebuildScorecards = (
  triathlonCompetitors: Player[],
  players: Player[],
  isDoubles: boolean,
  nextResults: TriathlonResults,
) =>
  buildTriathlonScorecards({
    competitors: triathlonCompetitors,
    sourcePlayers: players,
    isDoubles,
    capitalResults: nextResults.capital ?? null,
    cricketSummary: nextResults.cricket ?? null,
    x01Match: nextResults.x01 ?? null,
  });
