import type { MatchState } from '../../../../types';
import { POSSIBLE_TURN_SCORES } from './possibleTurnScores';

export type RemainingPreview = {
  teamId: string;
  score: number;
};

export const deriveRemainingPreview = (
  match: MatchState,
  inputBuffer: string,
  hasGameStarted: boolean,
): RemainingPreview | null => {
  if (!hasGameStarted || !inputBuffer) {
    return null;
  }

  const scoredPoints = parseInt(inputBuffer, 10);
  if (Number.isNaN(scoredPoints) || scoredPoints < 0) {
    return null;
  }

  if (scoredPoints !== 0 && (!POSSIBLE_TURN_SCORES.has(scoredPoints) || scoredPoints > 180)) {
    return null;
  }

  const currentPlayer = match.players[match.currentPlayerIndex];
  const currentScore = match.currentLeg.scores[currentPlayer.teamId];
  const remainingAfterInput = currentScore - scoredPoints;

  if (remainingAfterInput < 0) {
    return null;
  }

  return { teamId: currentPlayer.teamId, score: remainingAfterInput };
};

export const getDisplayedThrowerForTeam = (
  match: MatchState,
  currentPlayerIndex: number,
  teamId: string,
) => {
  const currentPlayer = match.players[currentPlayerIndex];

  if (currentPlayer?.teamId === teamId) {
    return currentPlayer;
  }

  for (let offset = 1; offset < match.players.length; offset += 1) {
    const candidate = match.players[(currentPlayerIndex + offset) % match.players.length];
    if (candidate.teamId === teamId) {
      return candidate;
    }
  }

  return match.players.find((player) => player.teamId === teamId) ?? null;
};
