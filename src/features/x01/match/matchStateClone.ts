import type { MatchState, Turn } from '../../../../types';

const cloneTurn = (turn: Turn): Turn => ({ ...turn });

export const cloneMatchState = (match: MatchState): MatchState => ({
  ...match,
  players: match.players.map((player) => ({ ...player })),
  setsWon: { ...match.setsWon },
  legsWon: { ...match.legsWon },
  completedLegs: match.completedLegs.map((leg) => ({
    ...leg,
    scores: { ...leg.scores },
    history: leg.history.map(cloneTurn),
  })),
  currentLeg: {
    ...match.currentLeg,
    scores: { ...match.currentLeg.scores },
    history: match.currentLeg.history.map(cloneTurn),
  },
});

