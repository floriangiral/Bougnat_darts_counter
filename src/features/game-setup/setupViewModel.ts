import type { GameType } from '../../../utils/arenaFlow';
import type { InOutRule, MatchMode, X01BotLevel } from '../../../types';
import { getGameName, getMatchModeLabel, getRuleLabel } from './setupPresentation';

export type SetupSummaryEntry = {
  label: string;
  value: string | number;
};

export const supportsDoublesMode = (gameType: GameType) => (
  gameType === 'X01' || gameType === 'CRICKET' || gameType === 'TRIATHLON'
);

export const canEnableBotOpponent = (gameType: GameType, isDoubles: boolean) => (
  gameType === 'X01' && !isDoubles
);

export const getSetupPlayerCountOptions = (gameType: GameType) => {
  if (gameType === 'CRICKET') {
    return [2, 3];
  }

  if (gameType === 'KILLER' || gameType === 'GOTCHA') {
    return [2, 3, 4, 5, 6];
  }

  if (gameType === 'TRIATHLON') {
    return [2];
  }

  if (gameType === 'X01') {
    return [1, 2];
  }

  return [1, 2, 3, 4];
};

export const buildTeamStarterOptions = (teamId: 'team1' | 'team2', playerNames: string[]) => {
  const defaultLabelOffset = teamId === 'team1' ? 1 : 3;
  const playerPrefix = teamId === 'team1' ? 't1p' : 't2p';

  return [0, 1].map((index) => ({
    id: `${playerPrefix}${index + 1}`,
    label: playerNames[index].trim() || `Joueur ${defaultLabelOffset + index}`,
  }));
};

export const buildSetupSummaryEntries = (params: {
  gameType: GameType;
  startingScore: number;
  matchMode: MatchMode;
  legsToWin: number;
  setsToWin: number;
  cricketRounds: number;
  isDoubles: boolean;
  playerCount: number;
  checkIn: InOutRule;
  checkOut: InOutRule;
}): SetupSummaryEntry[] => {
  const entries: SetupSummaryEntry[] = [
    { label: 'Jeu', value: getGameName(params.gameType) },
  ];

  if (params.gameType === 'TRIATHLON') {
    entries.push(
      { label: 'Ordre Des Jeux', value: 'Capital / Cricket / 501' },
      { label: 'Format', value: params.isDoubles ? 'Doublettes' : 'Individuel' },
    );
    return entries;
  }

  if (params.gameType === 'X01' || params.gameType === 'CRICKET' || params.gameType === 'GOTCHA') {
    if (params.gameType === 'X01' || params.gameType === 'GOTCHA') {
      entries.push({
        label: params.gameType === 'GOTCHA' ? 'Score Cible' : 'Score De Depart',
        value: params.startingScore,
      });
    }

    if (params.gameType === 'X01') {
      entries.push({ label: 'Format', value: getMatchModeLabel(params.matchMode) });
    }

    if (params.gameType === 'CRICKET') {
      entries.push(
        { label: 'Nombre De Tours', value: params.cricketRounds },
        { label: 'Nombre De Joueurs', value: params.isDoubles ? 4 : params.playerCount },
      );
    }

    if (params.gameType === 'GOTCHA') {
      entries.push({ label: 'Nombre De Joueurs', value: params.playerCount });
    }

    if (params.gameType === 'X01' && params.matchMode === 'LEGS') {
      entries.push({ label: 'Manches Pour Gagner', value: params.legsToWin });
    }

    if (params.gameType === 'X01' && params.matchMode === 'SETS') {
      entries.push(
        { label: 'Sets Pour Gagner', value: params.setsToWin },
        { label: 'Manches Par Set', value: params.legsToWin },
      );
    }

    if (params.gameType === 'X01') {
      entries.push({
        label: 'Ouverture / Fermeture',
        value: `${getRuleLabel(params.checkIn)} / ${getRuleLabel(params.checkOut)}`,
      });
    }

    entries.push({ label: 'Mode', value: params.isDoubles ? 'Doublettes' : 'Simple' });
  }

  return entries;
};

export const getBotLevelLabel = (levels: Array<{ level: X01BotLevel; label: string }>, botLevel: X01BotLevel) => (
  levels.find((definition) => definition.level === botLevel)?.label ?? 'Amateur'
);