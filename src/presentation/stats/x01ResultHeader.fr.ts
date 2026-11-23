import { formatDuration } from '../../application/scoring/matchLifecycle';
import type { InOutRule, MatchState } from '../../../types';

export interface X01ResultSide {
  id: string;
  name: string;
  /** Manches (format manches) ou sets (format sets) remportés */
  count: number;
  isWinner: boolean;
}

export interface X01ResultHeader {
  sides: X01ResultSide[];
  unitLabel: string;
  formatLabel: string;
  durationLabel: string;
}

const RULE_LABELS: Record<InOutRule, string> = {
  Open: 'libre',
  Double: 'double',
  Master: 'master',
};

const formatRules = (match: MatchState) => {
  const parts = [String(match.config.startingScore)];
  if (match.config.checkIn !== 'Open') parts.push(`Entrée ${RULE_LABELS[match.config.checkIn]}`);
  parts.push(`Sortie ${RULE_LABELS[match.config.checkOut]}`);
  return parts.join(' · ');
};

/** Bandeau de fin X01 : un camp par joueur (simple) ou par équipe (doublettes), dans l'ordre de jeu. */
export const presentX01ResultHeader = (match: MatchState, winnerId: string): X01ResultHeader => {
  const isSets = match.config.matchMode === 'SETS';
  const sideIds = Array.from(new Set(match.players.map((player) => player.teamId)));

  return {
    sides: sideIds.map((id) => ({
      id,
      name: match.players.filter((player) => player.teamId === id).map((player) => player.name).join(' / '),
      count: (isSets ? match.setsWon[id] : match.legsWon[id]) ?? 0,
      isWinner: id === winnerId,
    })),
    unitLabel: isSets ? 'sets' : 'manches',
    formatLabel: formatRules(match),
    durationLabel: formatDuration(match.duration),
  };
};
