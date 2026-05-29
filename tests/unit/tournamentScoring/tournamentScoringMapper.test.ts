import { describe, expect, it } from 'vitest';
import {
  mapTournamentMatchDetail,
  mapTournamentMatchSummary,
  mapX01TournamentResultSubmission,
} from '../../../src/application/scoring/tournamentScoring';
import { submitTurn } from '../../../src/application/scoring/matchLifecycle';

describe('tournamentScoring mapper', () => {
  it('normalise un match tournoi backend en contexte et MatchState X01 local', () => {
    const summary = mapTournamentMatchSummary(buildRawMatch());
    const detail = mapTournamentMatchDetail(buildRawMatch());

    expect(summary).toMatchObject({
      tournamentId: 'tournament-1',
      matchId: 'match-1',
      tournamentName: 'Open Bougnat',
      formatLabel: '101 - 1 legs',
      players: ['Alice', 'Bob'],
      rights: {
        canScore: true,
        canSubmitResult: true,
      },
    });
    expect(detail.context).toMatchObject({
      tournamentId: 'tournament-1',
      matchId: 'match-1',
      format: {
        gameType: 'X01',
      },
    });
    expect(detail.match.id).toBe('tournament:tournament-1:match-1');
    expect(detail.match.config).toMatchObject({
      startingScore: 101,
      legsToWin: 1,
      matchMode: 'LEGS',
      checkOut: 'Open',
    });
  });

  it('mappe un resultat X01 avec historique, stats et cle idempotente stable', () => {
    const detail = mapTournamentMatchDetail(buildRawMatch());
    const finished = submitTurn(detail.match, 101, 3);
    const submission = mapX01TournamentResultSubmission(detail.context, finished, '2026-05-29T12:00:00.000Z');

    expect(submission.idempotencyKey).toBe('tournament:tournament-1:match:match-1:result:tournament:tournament-1:match-1');
    expect(submission.payload).toMatchObject({
      contract: 'bougnat-counter.x01-result.v0',
      tournament_id: 'tournament-1',
      match_id: 'match-1',
      winner_team_id: 'team1',
      final_score: {
        team1: 1,
        team2: 0,
      },
      rules: {
        starting_score: 101,
        check_out: 'Open',
      },
    });
    expect(submission.payload.legs[0].turns[0]).toMatchObject({
      player_id: 'alice',
      team_id: 'team1',
      score: 101,
      remaining_after: 0,
      darts_thrown: 3,
    });
    expect(submission.payload.stats.team1.highest_checkout).toBe(101);
  });
});

function buildRawMatch() {
  return {
    tournament_id: 'tournament-1',
    match_id: 'match-1',
    tournament_name: 'Open Bougnat',
    label: 'Demi-finale',
    board_label: 'Table 2',
    status: 'assigned',
    starting_score: 101,
    legs_to_win: 1,
    sets_to_win: 1,
    match_mode: 'LEGS',
    check_in: 'Open',
    check_out: 'Open',
    players: [
      { id: 'alice', display_name: 'Alice', team_id: 'team1' },
      { id: 'bob', display_name: 'Bob', team_id: 'team2' },
    ],
    rights: {
      can_score: true,
      can_submit_result: true,
    },
  };
}
