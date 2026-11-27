import type { GameConfig, MatchState, Player, Turn } from '../../../../types';
import { createMatch, submitTurn } from '../../../../src/application/scoring/matchLifecycle';

export const baseConfig: GameConfig = {
  startingScore: 501, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS',
  setsToWin: 1, legsToWin: 3, isDoubles: false,
};

export const player = (id: string, name: string, teamId = id, isBot = false): Player =>
  ({ id, name, teamId, ...(isBot ? { isBot: true } : {}) });

export const turn = (playerId: string, score: number, remainingAfter: number, dartsThrown = 3): Turn =>
  ({ playerId, score, remainingAfter, dartsThrown, isBust: false });

const SCORES = [26, 41, 45, 60, 81, 85, 100, 121, 140, 180];

/** Match terminé joué volée par volée, déterministe : statistiques réalistes pour la mise en page. */
export const playMatch = (players: Player[], config: GameConfig, seed = 7): MatchState => {
  let state = seed;
  const next = () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
  let match = createMatch(players, config);
  for (let index = 0; index < 5000 && match.status !== 'finished'; index += 1) {
    const current = match.players[match.currentPlayerIndex];
    const remaining = match.currentLeg.scores[current.teamId];
    if (remaining <= 100 && remaining !== 99 && next() < 0.45) {
      match = submitTurn(match, remaining, 1 + Math.floor(next() * 3));
    } else {
      const score = SCORES[Math.floor(next() * SCORES.length)];
      match = submitTurn(match, score > remaining - 2 ? Math.max(0, Math.min(remaining - 40, 20)) : score, 3);
    }
  }
  if (match.status !== 'finished') throw new Error('Match de test non terminé');
  return { ...match, duration: 1384 };
};
