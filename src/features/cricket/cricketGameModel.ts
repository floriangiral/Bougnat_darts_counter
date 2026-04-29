import type { CricketMatchSummary, CricketPlayerState, CricketTarget, GameConfig, Player } from '../../../types';
import { initCricketState } from '../../../utils/cricketLogic';

export type CricketHistorySnapshot = {
  states: CricketPlayerState[];
  aggregateStats: CricketPlayerState[];
  currentThrowerIdx: number;
  turnDartsThrown: number;
  orderedPlayers: Player[];
  winnerId: string | null;
};

export type CricketCompetitor = {
  id: string;
  name: string;
  memberNames: string[];
};

export const cloneCricketStates = (states: CricketPlayerState[]): CricketPlayerState[] =>
  states.map((state) => ({
    ...state,
    marks: { ...state.marks },
    history: state.history.map((entry) => ({ ...entry })),
  }));

export const clonePlayers = (players: Player[]): Player[] =>
  players.map((player) => ({ ...player }));

export const buildCricketHistorySnapshot = (
  states: CricketPlayerState[],
  aggregateStats: CricketPlayerState[],
  currentThrowerIdx: number,
  turnDartsThrown: number,
  orderedPlayers: Player[],
  winnerId: string | null,
): CricketHistorySnapshot => ({
  states: cloneCricketStates(states),
  aggregateStats: cloneCricketStates(aggregateStats),
  currentThrowerIdx,
  turnDartsThrown,
  orderedPlayers: clonePlayers(orderedPlayers),
  winnerId,
});

export const buildCricketCompetitors = (players: Player[], isDoubles: boolean): CricketCompetitor[] => {
  if (!isDoubles) {
    return players.map((player) => ({
      id: player.id,
      name: player.name,
      memberNames: [player.name],
    }));
  }

  const groups = players.reduce<Record<string, string[]>>((accumulator, player) => {
    accumulator[player.teamId] = accumulator[player.teamId] || [];
    accumulator[player.teamId].push(player.name);
    return accumulator;
  }, {});

  return Object.entries(groups).map(([teamId, memberNames], index) => ({
    id: teamId,
    name: `Equipe ${index + 1}`,
    memberNames,
  }));
};

export const initAggregateCricketStats = (competitors: CricketCompetitor[]): CricketPlayerState[] =>
  competitors.map((competitor) => ({
    ...initCricketState([{ id: competitor.id, name: competitor.name, teamId: competitor.id }])[0],
  }));

export const appendAggregateCricketHit = (
  previous: CricketPlayerState[],
  competitorId: string,
  target: CricketTarget | null,
  multiplier: 1 | 2 | 3,
  pointsScored: number,
  isMiss: boolean,
) =>
  previous.map((entry) => {
    if (entry.id !== competitorId) {
      return entry;
    }

    const nextMarks = { ...entry.marks };
    if (target !== null) {
      nextMarks[target] += multiplier;
    }

    return {
      ...entry,
      score: entry.score + pointsScored,
      dartsThrown: entry.dartsThrown + 1,
      marks: nextMarks,
      history: [
        ...entry.history,
        {
          target,
          multiplier,
          isMiss,
          pointsScored,
        },
      ],
    };
  });

export const buildCricketMatchSummary = (
  competitors: CricketPlayerState[],
  winnerId: string,
  config: GameConfig,
  memberNamesByCompetitor: Record<string, string[]>,
  legsWon: Record<string, number>,
  setsWon: Record<string, number>,
  currentSetLegsWon: Record<string, number>,
): CricketMatchSummary => ({
  competitors,
  legsWon,
  setsWon,
  currentSetLegsWon,
  winnerId,
  config,
  isDoubles: config.isDoubles,
  memberNamesByCompetitor,
});

export const advanceCricketTurn = (turnDartsThrown: number, orderedPlayersLength: number, dartsAdded = 1) => {
  const nextDartsThrown = turnDartsThrown + dartsAdded;

  if (nextDartsThrown >= 3) {
    return {
      nextTurnDartsThrown: 0,
      shouldAdvanceThrower: true,
      nextThrowerOffset: orderedPlayersLength > 0 ? 1 % orderedPlayersLength : 0,
    };
  }

  return {
    nextTurnDartsThrown: nextDartsThrown,
    shouldAdvanceThrower: false,
    nextThrowerOffset: 0,
  };
};