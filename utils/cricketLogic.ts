
import { CricketPlayerState, CricketTarget, Player } from '../types';

export const CRICKET_TARGETS: CricketTarget[] = [20, 19, 18, 17, 16, 15, 25];
export const DEFAULT_CRICKET_ROUNDS = 20;

export const initCricketState = (players: Player[]): CricketPlayerState[] => {
    return players.map(p => ({
        id: p.id,
        name: p.name,
        score: 0,
        marks: {
            20: 0, 19: 0, 18: 0, 17: 0, 16: 0, 15: 0, 25: 0
        },
        dartsThrown: 0,
        history: []
    }));
};

export const isNumberClosedGlobally = (states: CricketPlayerState[], target: CricketTarget): boolean => {
    // A number is closed globally if ALL players have 3 marks on it
    return states.every(p => p.marks[target] >= 3);
};

export const processCricketHit = (
    states: CricketPlayerState[],
    playerId: string,
    target: CricketTarget,
    multiplier: 1 | 2 | 3
): { newStates: CricketPlayerState[], pointsScored: number, isClosedByHit: boolean } => {
    
    const pIdx = states.findIndex(p => p.id === playerId);
    if (pIdx === -1) return { newStates: states, pointsScored: 0, isClosedByHit: false };

    // Deep copy to avoid mutation
    const newStates = JSON.parse(JSON.stringify(states));
    const player = newStates[pIdx];

    const currentMarks = player.marks[target];
    let pointsScored = 0;
    // Explicitly type marksToAdd as number
    let marksToAdd: number;
    let isClosedByHit = false;

    // Logic:
    // 1. Fill marks up to 3.
    // 2. If > 3, check if opponents have closed it.
    // 3. If opponents NOT closed, add (surplus * targetValue) to score.

    if (currentMarks < 3) {
        const needed = 3 - currentMarks;
        if (multiplier >= needed) {
            // We closed it this turn
            player.marks[target] = 3;
            marksToAdd = multiplier - needed; // Remaining marks for scoring
            isClosedByHit = true;
        } else {
            // Just adding marks, not closed yet
            player.marks[target] += multiplier;
            marksToAdd = 0; 
        }
    } else {
        // Already closed by player, all multiplier is for potential scoring
        marksToAdd = multiplier;
    }

    // Scoring Logic (Strict Rules)
    // Points are scored if the player has closed the number (which is true if marksToAdd > 0 here)
    // AND at least one opponent has NOT closed it.
    if (marksToAdd > 0) {
        const isClosedByAll = newStates.every((p: CricketPlayerState) => p.marks[target] >= 3);
        
        if (!isClosedByAll) {
            pointsScored = marksToAdd * target;
            player.score += pointsScored;
        }
    }
    
    player.dartsThrown += 1;
    player.history.push({
        target,
        multiplier,
        isMiss: false,
        pointsScored
    });

    return { newStates, pointsScored, isClosedByHit };
};

export const checkCricketWin = (states: CricketPlayerState[]): string | null => {
    // Win condition:
    // 1. Player has closed all numbers (all marks >= 3)
    // 2. Player has the highest (or tied highest) score
    
    // Sort by score descending to easily check lead
    const sortedByScore = [...states].sort((a,b) => b.score - a.score);
    const highestScore = sortedByScore[0].score;

    for (const player of states) {
        const allClosed = CRICKET_TARGETS.every(t => player.marks[t] >= 3);
        const hasScoreLead = player.score >= highestScore;

        if (allClosed && hasScoreLead) {
            return player.id;
        }
    }

    return null;
};

const getClosedTargetCount = (player: CricketPlayerState): number =>
    CRICKET_TARGETS.filter((target) => player.marks[target] >= 3).length;

const getTotalMarks = (player: CricketPlayerState): number =>
    CRICKET_TARGETS.reduce((sum, target) => sum + Math.min(player.marks[target], 3), 0);

export const haveAllPlayersReachedCricketRoundLimit = (
    states: CricketPlayerState[],
    rounds: number
): boolean =>
    states.every((player) => Math.floor(player.dartsThrown / 3) >= rounds);

export const resolveCricketWinnerOnRounds = (states: CricketPlayerState[]): string | null => {
    if (states.length === 0) return null;

    const ranked = [...states].sort((a, b) => {
        const scoreDiff = b.score - a.score;
        if (scoreDiff !== 0) return scoreDiff;

        const closedDiff = getClosedTargetCount(b) - getClosedTargetCount(a);
        if (closedDiff !== 0) return closedDiff;

        const marksDiff = getTotalMarks(b) - getTotalMarks(a);
        if (marksDiff !== 0) return marksDiff;

        return a.name.localeCompare(b.name, 'fr');
    });

    return ranked[0]?.id ?? null;
};
