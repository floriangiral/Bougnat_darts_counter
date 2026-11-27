import { describe, expect, it } from 'vitest';
import type { MatchState } from '../../../../types';
import { createMatch } from '../../../../src/application/scoring/matchLifecycle';
import {
  buildX01ResultImageModel,
  describeX01Result,
  formatX01SheetRules,
  x01ResultFileName,
} from '../../../../src/presentation/stats/x01ResultImageModel.fr';
import type { X01SheetTable } from '../../../../src/presentation/stats/x01ResultImageModel.fr';
import { baseConfig, player, turn } from './x01ResultSheetFixtures';

const now = new Date(2026, 10, 27, 23, 59);
const players = [player('a', 'Alice'), player('b', 'Bob', 'b', true), player('c', 'Chloé'), player('d', 'David')];
const config = { ...baseConfig, startingScore: 301, legsToWin: 2 };

const finished = (roster = players, game = config): MatchState => {
  const match = createMatch(roster, game);
  return {
    ...match,
    status: 'finished',
    matchWinnerId: roster[0].teamId,
    duration: 123,
    legsWon: { [roster[0].teamId]: 1 },
    currentLeg: {
      ...match.currentLeg,
      winnerId: roster[0].teamId,
      scores: Object.fromEntries(roster.map((p, index) => [p.teamId, index === 0 ? 0 : 100])),
      history: [
        turn(roster[0].id, 180, 121), turn(roster[1]?.id ?? roster[0].id, 140, 161),
        turn(roster[2]?.id ?? roster[0].id, 100, 201), turn(roster[3]?.id ?? roster[0].id, 60, 241),
        turn(roster[0].id, 121, 0, 3),
      ],
    },
  };
};

const rowOf = (table: X01SheetTable, label: string) =>
  table.sections.flatMap((section) => section.rows).find((row) => row.label === label);
const texts = (table: X01SheetTable, label: string) => rowOf(table, label)?.cells.map((cell) => cell.text);

describe('modèle de la feuille de match X01', () => {
  it('présente un duel : règles, date, durée unique, score et description accessible', () => {
    const match = finished(players.slice(0, 2), { ...config, legsToWin: 3 });
    match.legsWon = { a: 3, b: 1 };
    match.currentLeg = { ...match.currentLeg, history: [turn('a', 180, 121), turn('b', 140, 161), turn('a', 121, 0)] };
    const model = buildX01ResultImageModel(match, now);
    expect(model.date).toBe('27/11/2026');
    expect(model.rules).toBe('301 · Premier à 3 manches · Sortie double');
    expect(model.duration).toBe('02:03');
    expect(model.result).toEqual({
      kind: 'duel',
      unit: 'manches',
      sides: [
        { id: 'a', names: ['Alice'], count: 3, isWinner: true },
        { id: 'b', names: ['Bob (robot)'], count: 1, isWinner: false },
      ],
    });
    expect(model.description).toBe('Alice gagne 3 manches à 1 contre Bob (robot), 301 sortie double');
    expect(model.tables).toHaveLength(1);
    const [table] = model.tables;
    expect(table.columns.map((column) => column.names)).toEqual([['Alice'], ['Bob (robot)']]);
    expect(table.sections.map((section) => section.title)).toEqual(['Vue d\'ensemble', 'Scores']);
    expect(table.sections[1].rows.map((row) => row.label)).toEqual([
      '180s / 171s', '160+ / 152+', '140+ / 133+', '120+ / 114+', '100+ / 95+', '80+ / 76+', '60+ / 57+',
    ]);
    expect(texts(table, 'Moyenne 3 fléchettes')).toEqual(['150,5', '140,0']);
    expect(rowOf(table, 'Moyenne 3 fléchettes')?.cells.map((cell) => cell.best ?? false)).toEqual([true, false]);
    expect(rowOf(table, 'Taux de checkout')?.cells).toEqual([
      { text: '100,0\u00a0%', score: 100, detail: '1/1' },
      { text: '–' },
    ]);
    expect(rowOf(table, 'Checkout à 1 · 2 · 3 fléchettes')?.cells).toEqual([
      { text: '0/0 · 0/0 · 1/1', minor: true },
      { text: '–' },
    ]);
    expect(texts(table, 'Meilleur checkout')).toEqual(['121', '–']);
    expect(texts(table, 'Meilleure / Pire manche')).toEqual(['6 / 6', '–']);
    expect(texts(table, '180s / 171s')).toEqual(['1', '0']);
  });

  it('classe 3 ou 4 camps avec rangs, ex aequo, places jouées ou calculées et sets', () => {
    const tied = buildX01ResultImageModel(finished(), now);
    expect(tied.result.kind).toBe('ranking');
    if (tied.result.kind !== 'ranking') return;
    expect(tied.result.entries.map(({ ordinal, tie, names }) => [ordinal, tie, names[0]])).toEqual([
      ['1er', '', 'Alice'], ['2e', 'ex aequo', 'Bob (robot)'], ['2e', 'ex aequo', 'Chloé'], ['2e', 'ex aequo', 'David'],
    ]);
    expect(tied.description).toBe('Classement : 1er Alice, 2e ex aequo Bob (robot), 2e ex aequo Chloé, 2e ex aequo David ; 301 sortie double');
    expect(tied.tables[0].columns).toHaveLength(4);

    const match = finished(players, { ...config, matchMode: 'SETS', setsToWin: 2, checkIn: 'Double', maxVisitsPerLeg: 15 });
    match.setsWon = { a: 2, b: 1, c: 0, d: 0 };
    match.placement = { finishedTeamIds: ['a', 'c'] };
    const model = buildX01ResultImageModel(match, now);
    expect(model.rules).toBe('301 · Premier à 2 sets de 2 manches · Entrée double · Sortie double · 15 volées max par manche');
    if (model.result.kind !== 'ranking') throw new Error('classement attendu');
    expect(model.result.entries[1]).toMatchObject({ ordinal: '2e', names: ['Chloé'] });
    expect(model.result.entries[1].detail).toContain('place jouée');
    expect(model.result.entries[2].detail).toContain('calculé');
    expect(model.result.entries[0].detail).toContain('2 sets');
  });

  it('présente un solo, une manche unique et refuse un match non terminé', () => {
    const solo = buildX01ResultImageModel(finished([players[0]], { ...config, legsToWin: 1 }), now);
    expect(solo.result).toEqual({ kind: 'solo', names: ['Alice'], summary: 'Partie terminée · 1 manche' });
    expect(solo.rules).toBe('301 · Manche unique · Sortie double');
    expect(solo.description).toBe('Alice : partie terminée · 1 manche, 301 sortie double');
    const labels = solo.tables[0].sections[0].rows.map((row) => row.label);
    expect(labels).toContain('Moyenne fléchettes gagnantes');
    expect(labels).toContain('Fléchettes gagnantes');
    expect(solo.tables[0].sections[0].rows.every((row) => row.cells.every((cell) => !cell.best))).toBe(true);
    expect(() => buildX01ResultImageModel({ ...finished(), status: 'active' }, now)).toThrow('non terminé');
    expect(() => buildX01ResultImageModel({ ...finished(), matchWinnerId: 'inconnu' }, now)).toThrow('vainqueur');
    expect(buildX01ResultImageModel({ ...finished(), duration: 0 }, now).duration).toBeNull();
  });

  it('n’invente pas de checkout ni de manche gagnée lors d’un départage au bull', () => {
    const match = finished(players.slice(0, 2), { ...config, maxVisitsPerLeg: 1 });
    match.currentLeg = {
      ...match.currentLeg,
      decidedByBullOff: true,
      scores: { a: 121, b: 161 },
      history: [turn('a', 180, 121), turn('b', 140, 161)],
    };
    const [table] = buildX01ResultImageModel(match, now).tables;
    expect(texts(table, 'Meilleur checkout')).toEqual(['–', '–']);
    expect(texts(table, 'Moyenne manche gagnante (fléchettes)')).toEqual(['–', '–']);
    expect(texts(table, 'Meilleure / Pire manche')).toEqual(['–', '–']);
    expect(texts(table, 'Taux de checkout')).toEqual(['–', '–']);
  });

  it('sépare les équipes des quatre joueurs sans leur attribuer les manches gagnées', () => {
    const roster = players.map((p, index) => ({ ...p, teamId: index % 2 ? 't2' : 't1' }));
    const match = finished(roster, { ...config, startingScore: 100, isDoubles: true });
    const first = { ...match.currentLeg, winnerId: 't1', history: [turn('c', 40, 60), turn('a', 60, 0, 2)] };
    match.completedLegs = [first];
    match.legsWon = { t1: 2, t2: 0 };
    match.currentLeg = { ...first, history: [turn('a', 60, 40), turn('c', 40, 0, 1)] };
    const model = buildX01ResultImageModel(match, now);
    expect(model.description).toBe('Alice et Chloé gagnent 2 manches à 0 contre Bob (robot) et David, 100 sortie double');
    const [teams, individuals] = model.tables;
    expect(teams.title).toBe('Statistiques par équipe');
    expect(teams.columns).toEqual([
      { id: 't1', names: ['Alice', 'Chloé'], caption: 'Équipe 1' },
      { id: 't2', names: ['Bob (robot)', 'David'], caption: 'Équipe 2' },
    ]);
    expect(teams.sections.map((section) => section.title)).toEqual(['Vue d\'ensemble']);
    expect(texts(teams, 'Meilleur checkout')).toEqual(['60', '–']);
    expect(texts(teams, 'Moyenne manche gagnante (fléchettes)')).toEqual(['5', '–']);
    expect(individuals.columns.map((column) => [column.names[0], column.caption])).toEqual([
      ['Alice', 'Équipe 1'], ['Chloé', 'Équipe 1'], ['Bob (robot)', 'Équipe 2'], ['David', 'Équipe 2'],
    ]);
    expect(individuals.sections.map((section) => section.title)).toEqual(['Vue d\'ensemble', 'Scores']);
    expect(texts(individuals, 'Meilleur checkout')).toEqual(['60', '40', '–', '–']);
    expect(texts(individuals, 'Checkout à 1 · 2 · 3 fléchettes')?.slice(0, 2)).toEqual(['0/0 · 1/1 · 0/0', '1/1 · 0/0 · 0/0']);
    expect(rowOf(individuals, 'Moyenne manche gagnante (fléchettes)')).toBeUndefined();
    expect(rowOf(individuals, 'Meilleure / Pire manche')).toBeUndefined();
    expect(individuals.note).toContain('mesures d’équipe');
  });

  it('formate les règles, la description sans vainqueur connu et le nom de fichier daté', () => {
    expect(formatX01SheetRules(finished(players.slice(0, 2), { ...config, checkIn: 'Master' }))).toBe('301 · Premier à 2 manches · Entrée master · Sortie double');
    expect(describeX01Result(createMatch(players.slice(0, 2), config), 'inconnu')).toBe('Alice 0 – 0 Bob (robot), 301 sortie double');
    expect(describeX01Result(createMatch(players.slice(0, 2), config), 'b')).toBe('Bob (robot) gagne 0 manche à 0 contre Alice, 301 sortie double');
    expect(x01ResultFileName(new Date(2026, 0, 5, 0, 1))).toBe('bougnat-darts-x01-2026-01-05.png');
  });
});
