// Spec 137 « Je prends la gagne » (RM-01 à RM-08, RM-16) : modèle pur, sans React ni stockage.
// Le vainqueur garde la table, le ou les sortants sont remplacés par des challengers ; la même partie
// repart de zéro, challenger au lancer, sans question « Qui commence ? » ni écran d'ordre.
import type { GameConfig, MatchState, Player } from '../../../../types';
import { rankX01Competitors } from '../../../application/scoring/x01Ranking';
import { buildSetupPlayers } from '../../game-setup/setupModel';
import { STANDARD_X01_QUICK_FORMAT, toValidX01QuickFormat, type X01QuickFormat } from '../../game-setup/x01QuickFormat';
import { includesChallengerName, isSameChallengerName } from './x01ChallengerQueue';

export type X01ChallengerMode = 'duel' | 'multi' | 'doubles';

export interface X01ChallengerCompetitor {
  /** Camp (`teamId`) : le joueur en simple, l'équipe en 2 contre 2. */
  id: string;
  name: string;
  /** Prénoms du camp dans son ordre de jeu de la partie terminée. */
  playerNames: string[];
  rank: number;
  isTied: boolean;
}

export interface X01ChallengerContext {
  mode: X01ChallengerMode;
  winner: X01ChallengerCompetitor;
  /** Camps non vainqueurs, dans l'ordre du classement final. */
  leaverOptions: X01ChallengerCompetitor[];
  /** RM-03, RM-04, RM-06 : sortants proposés à l'ouverture. */
  defaultLeaverIds: string[];
}

export interface TakeTheTableRequest {
  leaverIds: string[];
  challengerNames: string[];
  /** RM-14 : file enregistrée au lancement (liste affichée par la fenêtre). */
  queue: string[];
}

export interface TakeTheTableSetup {
  players: Player[];
  config: GameConfig;
}

const getCompetitorIds = (match: MatchState): string[] =>
  Array.from(new Set(match.players.map((player) => player.teamId)));

const isDoublesMatch = (match: MatchState): boolean => {
  if (!match.config.isDoubles) return false;
  const competitorIds = getCompetitorIds(match);
  return competitorIds.length === 2
    && competitorIds.every((id) => match.players.filter((player) => player.teamId === id).length === 2);
};

/** RM-01 : terminé avec un vainqueur, au moins deux camps, aucun robot, hors match partenaire. */
export const canTakeTheTable = (match: MatchState, { isPartner }: { isPartner: boolean }): boolean => {
  if (isPartner || match.status !== 'finished' || !match.matchWinnerId) return false;
  const competitorIds = getCompetitorIds(match);
  if (competitorIds.length < 2 || !competitorIds.includes(match.matchWinnerId)) return false;
  if (match.players.some((player) => player.isBot)) return false;
  return !match.config.isDoubles || isDoublesMatch(match);
};

export const getChallengerContext = (match: MatchState): X01ChallengerContext => {
  const ranking = rankX01Competitors(match);
  const toCompetitor = (entry: (typeof ranking)[number]): X01ChallengerCompetitor => {
    const playerNames = match.players.filter((player) => player.teamId === entry.competitorId).map((player) => player.name);
    return { id: entry.competitorId, name: playerNames.join(' / '), playerNames, rank: entry.rank, isTied: entry.isTied };
  };
  const winnerEntry = ranking.find((entry) => entry.competitorId === match.matchWinnerId) ?? ranking[0];
  const leaverOptions = ranking.filter((entry) => entry !== winnerEntry).map(toCompetitor);
  let mode: X01ChallengerMode = 'multi';
  if (isDoublesMatch(match)) mode = 'doubles';
  else if (leaverOptions.length === 1) mode = 'duel';
  // RM-04 : le dernier de la liste du classement (à égalité, le dernier dans l'ordre du classement).
  const last = leaverOptions[leaverOptions.length - 1];
  return {
    mode,
    winner: toCompetitor(winnerEntry),
    leaverOptions,
    defaultLeaverIds: last ? [last.id] : [],
  };
};

/** Nombre de champs challengers : un par sortant en simple, deux pour l'équipe challenger. */
export const getChallengerFieldCount = (context: X01ChallengerContext, leaverIds: readonly string[]): number =>
  (context.mode === 'doubles' ? 2 : leaverIds.length);

/** Prénoms des joueurs qui restent à la table (vainqueur compris). */
export const getRemainingNames = (context: X01ChallengerContext, leaverIds: readonly string[]): string[] => [
  ...context.winner.playerNames,
  ...context.leaverOptions.filter((option) => !leaverIds.includes(option.id)).flatMap((option) => option.playerNames),
];

/** RM-09 : prénoms des joueurs qui quittent la table (raccourcis et ajout en fin de file). */
export const getLeavingNames = (context: X01ChallengerContext, leaverIds: readonly string[]): string[] =>
  context.leaverOptions.filter((option) => leaverIds.includes(option.id)).flatMap((option) => option.playerNames);

export type ChallengerNameError = { kind: 'empty' } | { kind: 'duplicate'; name: string };

/** RM-08 (P1, P2) : vide interdit ; doublon avec un joueur restant ou un challenger précédent refusé. */
export const validateChallengers = (
  challengerNames: readonly string[],
  remainingNames: readonly string[],
): (ChallengerNameError | null)[] =>
  challengerNames.map((name, index) => {
    const trimmed = name.trim();
    if (!trimmed) return { kind: 'empty' };
    const earlier = challengerNames.slice(0, index).filter((other) => other.trim().length > 0);
    if (includesChallengerName(remainingNames, trimmed) || earlier.some((other) => isSameChallengerName(other, trimmed))) {
      return { kind: 'duplicate', name: trimmed };
    }
    return null;
  });

const buildConfig = (config: GameConfig, isDoubles: boolean): GameConfig => ({
  startingScore: config.startingScore,
  checkIn: config.checkIn,
  checkOut: config.checkOut,
  matchMode: config.matchMode,
  legsToWin: config.legsToWin,
  setsToWin: config.setsToWin,
  isDoubles,
  initialStartingPlayerIndex: 0,
  ...(isDoubles ? { initialStartingTeamId: 'team1' as const, teamStarterIds: { team1: 't1p1', team2: 't2p1' } } : {}),
  ...(config.maxVisitsPerLeg ? { maxVisitsPerLeg: config.maxVisitsPerLeg } : {}),
});

/**
 * RM-05 à RM-07 : nouvelle composition, ordre et même configuration remise à zéro.
 * Simple : challengers dans l'ordre des champs, puis restants dans leur ordre relatif de la partie terminée.
 * 2 contre 2 : équipe challenger en `team1`, ouvreuse, son premier prénom au lancer ; vainqueurs en `team2`.
 */
export const buildTakeTheTableSetup = (
  match: MatchState,
  { leaverIds, challengerNames }: Pick<TakeTheTableRequest, 'leaverIds' | 'challengerNames'>,
): TakeTheTableSetup => {
  const challengers = challengerNames.map((name) => name.trim());
  if (isDoublesMatch(match)) {
    const winnerNames = match.players.filter((player) => player.teamId === match.matchWinnerId).map((player) => player.name);
    return {
      players: buildSetupPlayers({ isDoubles: true, playerNames: [], team1Names: challengers, team2Names: winnerNames }),
      config: buildConfig(match.config, true),
    };
  }
  const remaining = match.players.filter((player) => !leaverIds.includes(player.teamId)).map((player) => player.name);
  return {
    players: buildSetupPlayers({
      isDoubles: false,
      playerNames: [...challengers, ...remaining],
      team1Names: ['', ''],
      team2Names: ['', ''],
    }),
    config: buildConfig(match.config, false),
  };
};

/** RM-16 : partie rapide mémorisée (spec 133) avec la nouvelle composition, dans le nouvel ordre, sans robot. */
export const toTakeTheTableQuickFormat = (
  { players, config }: TakeTheTableSetup,
  previous: X01QuickFormat | null,
): X01QuickFormat | null => {
  const base = previous ?? STANDARD_X01_QUICK_FORMAT;
  const namesOf = (teamId: string) => players.filter((player) => player.teamId === teamId).map((player) => player.name);
  return toValidX01QuickFormat({
    ...base,
    startingScore: config.startingScore,
    matchMode: config.matchMode,
    legsToWin: config.legsToWin,
    setsToWin: config.setsToWin,
    checkIn: config.checkIn,
    checkOut: config.checkOut,
    maxVisitsPerLeg: config.maxVisitsPerLeg ?? null,
    isDoubles: config.isDoubles,
    playerNames: config.isDoubles ? base.playerNames : players.map((player) => player.name),
    team1Names: config.isDoubles ? namesOf('team1') : base.team1Names,
    team2Names: config.isDoubles ? namesOf('team2') : base.team2Names,
    playAgainstBot: false,
  });
};
