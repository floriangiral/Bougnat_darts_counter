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

type SetupSummaryParams = {
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
};

const buildTriathlonSummary = (params: SetupSummaryParams): SetupSummaryEntry[] => [
  { label: 'Jeu', value: getGameName(params.gameType) },
  { label: 'Ordre Des Jeux', value: 'Capital / Cricket / 501' },
  { label: 'Format', value: params.isDoubles ? 'Doublettes' : 'Individuel' },
];

const appendX01Summary = (entries: SetupSummaryEntry[], params: SetupSummaryParams): void => {
  entries.push(
    { label: 'Score De Depart', value: params.startingScore },
    { label: 'Format', value: getMatchModeLabel(params.matchMode) },
  );

  if (params.matchMode === 'LEGS') {
    entries.push({ label: 'Manches Pour Gagner', value: params.legsToWin });
  }
  if (params.matchMode === 'SETS') {
    entries.push(
      { label: 'Sets Pour Gagner', value: params.setsToWin },
      { label: 'Manches Par Set', value: params.legsToWin },
    );
  }

  entries.push(
    {
      label: 'Ouverture / Fermeture',
      value: `${getRuleLabel(params.checkIn)} / ${getRuleLabel(params.checkOut)}`,
    },
    { label: 'Mode', value: params.isDoubles ? 'Doublettes' : 'Simple' },
  );
};

const appendCricketSummary = (entries: SetupSummaryEntry[], params: SetupSummaryParams): void => {
  entries.push(
    { label: 'Nombre De Tours', value: params.cricketRounds },
    { label: 'Nombre De Joueurs', value: params.isDoubles ? 4 : params.playerCount },
    { label: 'Mode', value: params.isDoubles ? 'Doublettes' : 'Simple' },
  );
};

const appendGotchaSummary = (entries: SetupSummaryEntry[], params: SetupSummaryParams): void => {
  entries.push(
    { label: 'Score Cible', value: params.startingScore },
    { label: 'Nombre De Joueurs', value: params.playerCount },
    { label: 'Mode', value: params.isDoubles ? 'Doublettes' : 'Simple' },
  );
};

export const buildSetupSummaryEntries = (params: SetupSummaryParams): SetupSummaryEntry[] => {
  const entries: SetupSummaryEntry[] = [{ label: 'Jeu', value: getGameName(params.gameType) }];
  if (params.gameType === 'TRIATHLON') return buildTriathlonSummary(params);

  switch (params.gameType) {
    case 'X01':
      appendX01Summary(entries, params);
      break;
    case 'CRICKET':
      appendCricketSummary(entries, params);
      break;
    case 'GOTCHA':
      appendGotchaSummary(entries, params);
      break;
    default:
      break;
  }
  return entries;
};

export const getBotLevelLabel = (levels: Array<{ level: X01BotLevel; label: string }>, botLevel: X01BotLevel) => (
  levels.find((definition) => definition.level === botLevel)?.label ?? 'Amateur'
);