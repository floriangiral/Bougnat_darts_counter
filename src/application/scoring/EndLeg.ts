import type { MatchState } from '../../../types';

export type EndLegResult =
  | { kind: 'no_leg_end'; match: MatchState }
  | { kind: 'leg_ended'; match: MatchState; winnerTeamId: string };

export class EndLeg {
  static execute(match: MatchState): EndLegResult {
    const latestCompletedLeg = match.completedLegs[match.completedLegs.length - 1];
    if (!latestCompletedLeg?.winnerId) {
      return { kind: 'no_leg_end', match };
    }

    return {
      kind: 'leg_ended',
      match,
      winnerTeamId: latestCompletedLeg.winnerId,
    };
  }
}
