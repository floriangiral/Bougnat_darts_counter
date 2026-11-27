import type { MatchState, Player } from '../../../types';
import { calculateDetailedStats, calculateDetailedStatsForTeam } from '../../application/scoring/matchStats';
import type { DetailedStats } from '../../application/scoring/matchStats';
import { formatDuration } from '../../application/scoring/matchLifecycle';
import { X01_SCORE_COUNT_ROWS } from './statsPresenter.fr';
import { STATS_LABELS_FR } from './statsLabels.fr';
import { presentX01Ranking } from './x01RankingPresenter.fr';
import { presentX01ResultHeader } from './x01ResultHeader.fr';

/** Valeur d'une cellule : `score` sert à désigner la meilleure valeur de la ligne. */
export interface X01SheetCell {
  text: string;
  detail?: string;
  score?: number;
  best?: boolean;
  /** Détail secondaire, présenté en petit corps. */
  minor?: boolean;
}

export interface X01SheetRow {
  label: string;
  cells: X01SheetCell[];
}

export interface X01SheetSection {
  title: string;
  rows: X01SheetRow[];
}

export interface X01SheetColumn {
  id: string;
  names: string[];
  caption?: string;
}

export interface X01SheetTable {
  title: string;
  columns: X01SheetColumn[];
  sections: X01SheetSection[];
  note?: string;
}

export interface X01SheetSide {
  id: string;
  names: string[];
  count: number;
  isWinner: boolean;
}

export type X01SheetResult =
  | { kind: 'solo'; names: string[]; summary: string }
  | { kind: 'duel'; unit: string; sides: [X01SheetSide, X01SheetSide] }
  | {
    kind: 'ranking';
    entries: Array<{ id: string; ordinal: string; tie: string; names: string[]; detail: string; isWinner: boolean }>;
  };

/** Données de mise en page de la « feuille de match » partagée en image, sans dépendance au rendu. */
export interface X01ResultImageModel {
  date: string;
  rules: string;
  duration: string | null;
  result: X01SheetResult;
  tables: X01SheetTable[];
  description: string;
}

const RULES: Record<MatchState['config']['checkIn'], string> = { Open: 'libre', Double: 'double', Master: 'master' };
const DASH = '–';

const plural = (count: number, singular: string, pluralForm: string) => `${count} ${count > 1 ? pluralForm : singular}`;
const decimal = (value: number) => value.toFixed(1).replace('.', ',');
const pad = (value: number) => String(value).padStart(2, '0');
const playerName = (player: Player) => `${player.name}${player.isBot ? ' (robot)' : ''}`;
const sidePlayers = (match: MatchState, id: string) => match.players.filter((player) => player.teamId === id);
const sideNames = (match: MatchState, id: string) => sidePlayers(match, id).map(playerName);

export const formatX01SheetDate = (date: Date): string =>
  `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;

/** Nom de fichier daté (jour local de génération). */
export const x01ResultFileName = (date: Date): string =>
  `bougnat-darts-x01-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.png`;

const formatGoal = (config: MatchState['config']): string => {
  const legs = plural(config.legsToWin, 'manche', 'manches');
  if (config.matchMode === 'SETS') return `Premier à ${plural(config.setsToWin, 'set', 'sets')} de ${legs}`;
  return config.legsToWin === 1 ? 'Manche unique' : `Premier à ${legs}`;
};

/** « 501 · Premier à 3 manches · Sortie double » ; l'entrée n'apparaît que si elle n'est pas libre. */
export const formatX01SheetRules = (match: MatchState): string => {
  const { config } = match;
  return [
    String(config.startingScore),
    formatGoal(config),
    ...(config.checkIn === 'Open' ? [] : [`Entrée ${RULES[config.checkIn]}`]),
    `Sortie ${RULES[config.checkOut]}`,
    ...(config.maxVisitsPerLeg ? [`${plural(config.maxVisitsPerLeg, 'volée', 'volées')} max par manche`] : []),
  ].join(' · ');
};

const shortRules = (match: MatchState) => [
  String(match.config.startingScore),
  ...(match.config.checkIn === 'Open' ? [] : [`entrée ${RULES[match.config.checkIn]}`]),
  `sortie ${RULES[match.config.checkOut]}`,
].join(' ');

const cell = (text: string, score?: number, detail?: string): X01SheetCell => ({
  text,
  ...(detail ? { detail } : {}),
  ...(score === undefined ? {} : { score }),
});

/** Meilleure valeur : uniquement si toutes les cellules sont chiffrées et qu'elles diffèrent. */
const markBest = (cells: X01SheetCell[], lowIsBest = false): X01SheetCell[] => {
  const scores = cells.map((item) => item.score);
  if (cells.length < 2 || scores.includes(undefined)) return cells;
  const values = scores as number[];
  const best = lowIsBest ? Math.min(...values) : Math.max(...values);
  if (values.every((value) => value === best)) return cells;
  return cells.map((item) => (item.score === best ? { ...item, best: true } : item));
};

const row = (label: string, stats: DetailedStats[], pick: (value: DetailedStats) => X01SheetCell, lowIsBest = false): X01SheetRow =>
  ({ label, cells: markBest(stats.map(pick), lowIsBest) });

const checkoutRows = (stats: DetailedStats[]): X01SheetRow[] => {
  const labels = STATS_LABELS_FR.x01.overview;
  return [
    row(labels.checkoutRate, stats, (value) => (value.checkoutAttempts
      ? cell(`${decimal(value.checkoutRate)}\u00a0%`, value.checkoutRate, `${value.checkoutMade}/${value.checkoutAttempts}`)
      : cell(DASH))),
    row('Checkout à 1 · 2 · 3 fléchettes', stats, ({ checkoutByDarts: { one, two, three } }) =>
      (one.attempts + two.attempts + three.attempts
        ? { text: [one, two, three].map((bucket) => `${bucket.made}/${bucket.attempts}`).join(' · '), minor: true }
        : cell(DASH))),
    row(labels.highestCheckout, stats, (value) =>
      (value.highestCheckout ? cell(String(value.highestCheckout), value.highestCheckout) : cell(DASH))),
  ];
};

const overviewSection = (match: MatchState, stats: DetailedStats[], withLegs: boolean): X01SheetSection => {
  const labels = STATS_LABELS_FR.x01.overview;
  const singleLeg = match.config.matchMode === 'LEGS' && match.config.legsToWin === 1;
  const legRows = withLegs ? [
    row(singleLeg ? labels.averageWinningDarts : labels.averageWinningLegDarts, stats, (value) =>
      (value.averageWinningLegDarts ? cell(String(value.averageWinningLegDarts), value.averageWinningLegDarts) : cell(DASH)), true),
    singleLeg
      ? row(labels.winningDarts, stats, (value) =>
        (value.bestLegDarts === null ? cell(DASH) : cell(String(value.bestLegDarts), value.bestLegDarts)), true)
      : row(labels.bestWorstLeg, stats, (value) => (value.bestLegDarts === null
        ? cell(DASH)
        : cell(`${value.bestLegDarts} / ${value.worstLegDarts ?? DASH}`, value.bestLegDarts)), true),
  ] : [];
  return {
    title: STATS_LABELS_FR.x01.tabs.overview,
    rows: [
      row(labels.threeDartAverage, stats, (value) => cell(decimal(value.threeDartAverage), value.threeDartAverage)),
      row(labels.until170Average, stats, (value) => cell(decimal(value.nonCheckoutAverage), value.nonCheckoutAverage)),
      ...checkoutRows(stats),
      row(labels.highestScore, stats, (value) => cell(String(value.highestScore), value.highestScore)),
      ...legRows,
    ],
  };
};

const scoresSection = (stats: DetailedStats[]): X01SheetSection => ({
  title: STATS_LABELS_FR.x01.tabs.scoring,
  rows: X01_SCORE_COUNT_ROWS.map(({ label, key }) =>
    row(label, stats, (value) => cell(String(value.scoreCounts[key]), value.scoreCounts[key]))),
});

const statsTable = (match: MatchState, title: string, columns: X01SheetColumn[], stats: DetailedStats[], withLegs: boolean, withScores = true): X01SheetTable =>
  ({ title, columns, sections: [overviewSection(match, stats, withLegs), ...(withScores ? [scoresSection(stats)] : [])] });

const buildTables = (match: MatchState, sideIds: string[]): X01SheetTable[] => {
  if (!match.config.isDoubles) {
    const players = sideIds.map((id) => sidePlayers(match, id)[0]);
    return [statsTable(
      match,
      'Statistiques du match',
      players.map((player) => ({ id: player.id, names: [playerName(player)] })),
      players.map((player) => calculateDetailedStats(match, player.id)),
      true,
    )];
  }
  const teams = statsTable(
    match,
    'Statistiques par équipe',
    sideIds.map((id, index) => ({ id, names: sideNames(match, id), caption: `Équipe ${index + 1}` })),
    sideIds.map((id) => calculateDetailedStatsForTeam(match, id)),
    true,
    // Les scores d'une équipe sont la somme de ceux de ses joueurs, détaillés dans le tableau suivant.
    false,
  );
  const players = sideIds.flatMap((id, index) => sidePlayers(match, id).map((player) => ({ player, team: index + 1 })));
  const individuals = statsTable(
    match,
    'Statistiques individuelles',
    players.map(({ player, team }) => ({ id: player.id, names: [playerName(player)], caption: `Équipe ${team}` })),
    players.map(({ player }) => calculateDetailedStats(match, player.id)),
    false,
  );
  // Manches et sets se gagnent en équipe : pas de mesure de manche gagnée attribuée à un joueur.
  return [teams, {
    ...individuals,
    note: 'Manches : mesures d’équipe. Scores d’équipe : somme des joueurs.',
  }];
};

const describe = (match: MatchState, result: X01SheetResult, unit: string): string => {
  const rules = shortRules(match);
  if (result.kind === 'duel') {
    const join = (side: X01SheetSide) => side.names.join(' et ');
    if (!result.sides.some((side) => side.isWinner)) {
      return `${join(result.sides[0])} ${result.sides[0].count} – ${result.sides[1].count} ${join(result.sides[1])}, ${rules}`;
    }
    const [winner, loser] = result.sides[0].isWinner ? result.sides : [result.sides[1], result.sides[0]];
    const verb = winner.names.length > 1 ? 'gagnent' : 'gagne';
    return `${join(winner)} ${verb} ${plural(winner.count, unit.slice(0, -1), unit)} à ${loser.count} contre ${join(loser)}, ${rules}`;
  }
  if (result.kind === 'ranking') {
    const entries = result.entries.map((entry) => [entry.ordinal, entry.tie, entry.names.join(' et ')].filter(Boolean).join(' '));
    return `Classement : ${entries.join(', ')} ; ${rules}`;
  }
  return `${result.names.join(' et ')} : ${result.summary.toLowerCase()}, ${rules}`;
};

const buildResult = (match: MatchState, winnerId: string): { result: X01SheetResult; unit: string; sideIds: string[] } => {
  const header = presentX01ResultHeader(match, winnerId);
  const unit = header.unitLabel;
  const sides = header.sides.map((side) => ({ id: side.id, names: sideNames(match, side.id), count: side.count, isWinner: side.isWinner }));
  const sideIds = sides.map((side) => side.id);
  if (sides.length === 1) {
    return { unit, sideIds, result: { kind: 'solo', names: sides[0].names, summary: `Partie terminée · ${plural(sides[0].count, unit.slice(0, -1), unit)}` } };
  }
  if (sides.length === 2) return { unit, sideIds, result: { kind: 'duel', unit, sides: [sides[0], sides[1]] } };
  return {
    unit,
    sideIds,
    result: {
      kind: 'ranking',
      entries: presentX01Ranking(match).map((entry) => {
        const [ordinal, ...tie] = entry.rankLabel.split(' ');
        return {
          id: entry.competitorId,
          ordinal,
          tie: tie.join(' '),
          names: sideNames(match, entry.competitorId),
          detail: entry.detail,
          isWinner: entry.isMatchWinner,
        };
      }),
    },
  };
};

/** Description accessible de l'image (« Alice gagne 3 manches à 1 contre Bruno, 501 sortie double »). */
export const describeX01Result = (match: MatchState, winnerId: string): string => {
  const { result, unit } = buildResult(match, match.matchWinnerId ?? winnerId);
  return describe(match, result, unit);
};

/** Modèle indépendant du rendu, partagé par les tests et la génération locale. */
export const buildX01ResultImageModel = (match: MatchState, now: Date = new Date()): X01ResultImageModel => {
  if (match.status !== 'finished' || !match.matchWinnerId || !match.players.length) {
    throw new Error('Impossible de générer une image pour un match non terminé.');
  }
  const { result, unit, sideIds } = buildResult(match, match.matchWinnerId);
  if (!sideIds.includes(match.matchWinnerId)) throw new Error('Impossible de déterminer le vainqueur du match.');
  return {
    date: formatX01SheetDate(now),
    rules: formatX01SheetRules(match),
    duration: match.duration > 0 ? formatDuration(match.duration) : null,
    result,
    tables: buildTables(match, sideIds),
    description: describe(match, result, unit),
  };
};
