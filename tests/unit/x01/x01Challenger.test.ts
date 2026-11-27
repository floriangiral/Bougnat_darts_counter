// Spec 137 « Je prends la gagne » : modèle pur (RM-01 à RM-16 ; AC-03 à AC-09, AC-12, AC-13).
import { describe, expect, it } from 'vitest';
import { createMatch } from '../../../src/application/scoring/matchLifecycle';
import {
  buildTakeTheTableSetup,
  canTakeTheTable,
  getChallengerContext,
  getChallengerFieldCount,
  getLeavingNames,
  getRemainingNames,
  toTakeTheTableQuickFormat,
  validateChallengers,
} from '../../../src/features/x01/challenger/x01Challenger';
import {
  addToChallengerQueue,
  computeWaitingList,
  moveUpInChallengerQueue,
  prefillChallengers,
  removeFromChallengerQueue,
  sanitizeChallengerQueue,
  X01_CHALLENGER_QUEUE_MAX,
} from '../../../src/features/x01/challenger/x01ChallengerQueue';
import { STANDARD_X01_QUICK_FORMAT } from '../../../src/features/game-setup/x01QuickFormat';
import type { GameConfig, MatchState, Player } from '../../../types';

const config: GameConfig = {
  startingScore: 501, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS', legsToWin: 3, setsToWin: 1, isDoubles: false,
};

const single = (name: string, id = name.toLowerCase()): Player => ({ id, name, teamId: id });

const finish = (players: Player[], winnerId: string, scores: Record<string, number>, matchConfig = config): MatchState => {
  const match = createMatch(players, matchConfig);
  return {
    ...match,
    status: 'finished',
    matchWinnerId: winnerId,
    legsWon: { ...match.legsWon, [winnerId]: matchConfig.legsToWin },
    currentLeg: { ...match.currentLeg, winnerId, scores: { ...match.currentLeg.scores, ...scores, [winnerId]: 0 } },
  };
};

const duel = () => finish([single('Alice'), single('Bob')], 'alice', { bob: 120 });
// Spec AC-04 : ordre Bob, Chloé, Alice, David ; Alice vainqueur, David dernier.
const fourPlayers = () => finish(
  [single('Bob'), single('Chloé', 'chloe'), single('Alice'), single('David')],
  'alice',
  { bob: 40, chloe: 100, david: 300 },
);
// AC-06 : Alice / Bob vainqueurs, Bob premier lanceur de l'équipe.
const doubles = (): MatchState => {
  const players: Player[] = [
    { id: 't1p2', name: 'Bob', teamId: 'team1' },
    { id: 't2p1', name: 'Chloé', teamId: 'team2' },
    { id: 't1p1', name: 'Alice', teamId: 'team1' },
    { id: 't2p2', name: 'David', teamId: 'team2' },
  ];
  return finish(players, 'team1', { team2: 80 }, { ...config, isDoubles: true });
};

describe('éligibilité (RM-01)', () => {
  it('accepte un duel, 3-4 joueurs et le 2 contre 2 terminés', () => {
    expect(canTakeTheTable(duel(), { isPartner: false })).toBe(true);
    expect(canTakeTheTable(fourPlayers(), { isPartner: false })).toBe(true);
    expect(canTakeTheTable(doubles(), { isPartner: false })).toBe(true);
  });

  it('refuse un match partenaire, en cours, sans vainqueur, en solo, avec robot ou en doublettes incomplètes', () => {
    expect(canTakeTheTable(duel(), { isPartner: true })).toBe(false);
    expect(canTakeTheTable({ ...duel(), status: 'active' }, { isPartner: false })).toBe(false);
    expect(canTakeTheTable({ ...duel(), matchWinnerId: null }, { isPartner: false })).toBe(false);
    expect(canTakeTheTable({ ...duel(), matchWinnerId: 'ghost' }, { isPartner: false })).toBe(false);
    expect(canTakeTheTable(finish([single('Alice')], 'alice', {}), { isPartner: false })).toBe(false);
    const withBot = finish([single('Alice'), { ...single('Robot'), isBot: true }], 'alice', { robot: 50 });
    expect(canTakeTheTable(withBot, { isPartner: false })).toBe(false);
    const oddDoubles = { ...doubles(), players: doubles().players.slice(0, 3) };
    expect(canTakeTheTable(oddDoubles, { isPartner: false })).toBe(false);
  });
});

describe('contexte et sortants (RM-02 à RM-04, RM-06)', () => {
  it('duel : le perdant sort, un champ challenger', () => {
    const context = getChallengerContext(duel());
    expect(context.mode).toBe('duel');
    expect(context.winner.name).toBe('Alice');
    expect(context.defaultLeaverIds).toEqual(['bob']);
    expect(getChallengerFieldCount(context, context.defaultLeaverIds)).toBe(1);
    expect(getLeavingNames(context, ['bob'])).toEqual(['Bob']);
    expect(getRemainingNames(context, ['bob'])).toEqual(['Alice']);
  });

  it('4 joueurs : non-vainqueurs dans l’ordre du classement, le dernier coché par défaut', () => {
    const context = getChallengerContext(fourPlayers());
    expect(context.mode).toBe('multi');
    expect(context.leaverOptions.map((option) => [option.name, option.rank])).toEqual([['Bob', 2], ['Chloé', 3], ['David', 4]]);
    expect(context.defaultLeaverIds).toEqual(['david']);
    expect(getChallengerFieldCount(context, ['chloe', 'david'])).toBe(2);
    expect(getRemainingNames(context, ['chloe', 'david'])).toEqual(['Alice', 'Bob']);
  });

  it('à égalité au dernier rang, le dernier de la liste du classement sort par défaut', () => {
    const match = finish(
      [single('Bob'), single('David'), single('Alice'), single('Chloé', 'chloe')],
      'alice',
      { bob: 40, david: 200, chloe: 200 },
    );
    const context = getChallengerContext(match);
    expect(context.leaverOptions.map((option) => [option.name, option.isTied])).toEqual([['Bob', false], ['David', true], ['Chloé', true]]);
    expect(context.defaultLeaverIds).toEqual(['chloe']);
  });

  it('2 contre 2 : l’équipe perdante sort entière, deux champs', () => {
    const context = getChallengerContext(doubles());
    expect(context.mode).toBe('doubles');
    expect(context.winner.name).toBe('Bob / Alice');
    expect(context.defaultLeaverIds).toEqual(['team2']);
    expect(getChallengerFieldCount(context, ['team2'])).toBe(2);
    expect(getLeavingNames(context, ['team2'])).toEqual(['Chloé', 'David']);
  });
});

describe('validation des prénoms (RM-08, AC-07)', () => {
  it('refuse vide, espaces, doublon d’un restant ou d’un autre challenger ; accepte un sortant', () => {
    expect(validateChallengers(['', '   '], ['Alice'])).toEqual([{ kind: 'empty' }, { kind: 'empty' }]);
    expect(validateChallengers([' alice '], ['Alice'])).toEqual([{ kind: 'duplicate', name: 'alice' }]);
    expect(validateChallengers(['Léa', 'LÉA'], ['Alice'])).toEqual([null, { kind: 'duplicate', name: 'LÉA' }]);
    expect(validateChallengers(['Bob'], ['Alice'])).toEqual([null]);
  });
});

describe('nouvelle partie (RM-03 à RM-07)', () => {
  const start = (match: MatchState, leaverIds: string[], challengerNames: string[]) => {
    const setup = buildTakeTheTableSetup(match, { leaverIds, challengerNames });
    return createMatch(setup.players, setup.config);
  };

  it('duel : challenger puis vainqueur, challenger au lancer, scores à zéro (AC-03)', () => {
    const finished = duel();
    const next = start(finished, ['bob'], [' Paul ']);
    expect(next.players.map((player) => player.name)).toEqual(['Paul', 'Alice']);
    expect(next.currentPlayerIndex).toBe(0);
    expect(next.currentLeg.startingPlayerIndex).toBe(0);
    expect(next.id).not.toBe(finished.id);
    expect(next.status).toBe('active');
    expect(Object.values(next.currentLeg.scores)).toEqual([501, 501]);
    expect(Object.values(next.legsWon)).toEqual([0, 0]);
  });

  it('4 joueurs, un sortant : challenger n° 1, restants dans leur ordre relatif (AC-04)', () => {
    expect(start(fourPlayers(), ['david'], ['Paul']).players.map((player) => player.name)).toEqual(['Paul', 'Bob', 'Chloé', 'Alice']);
  });

  it('4 joueurs, plusieurs sortants : challengers dans l’ordre des champs (AC-05, trois sortants)', () => {
    expect(start(fourPlayers(), ['chloe', 'david'], ['Paul', 'Léa']).players.map((player) => player.name))
      .toEqual(['Paul', 'Léa', 'Bob', 'Alice']);
    expect(start(fourPlayers(), ['bob', 'chloe', 'david'], ['Paul', 'Léa', 'Max']).players.map((player) => player.name))
      .toEqual(['Paul', 'Léa', 'Max', 'Alice']);
  });

  it('2 contre 2 : équipe challenger en team1 ouvre, vainqueurs dans leur ordre interne (AC-06)', () => {
    const next = start(doubles(), ['team2'], ['Paul', 'David']);
    expect(next.players.map((player) => [player.name, player.teamId])).toEqual([
      ['Paul', 'team1'], ['Bob', 'team2'], ['David', 'team1'], ['Alice', 'team2'],
    ]);
    expect(next.currentPlayerIndex).toBe(0);
    expect(next.config).toMatchObject({ isDoubles: true, initialStartingTeamId: 'team1' });
  });

  it('reconduit score, mode, sets, ouverture, sortie et limite de volées ; absente si elle l’était (RM-07)', () => {
    const custom: GameConfig = {
      ...config, startingScore: 2501, matchMode: 'SETS', setsToWin: 4, legsToWin: 2, checkIn: 'Master', checkOut: 'Open', maxVisitsPerLeg: 12,
    };
    const setup = buildTakeTheTableSetup(finish([single('Alice'), single('Bob')], 'alice', { bob: 3 }, custom), {
      leaverIds: ['bob'], challengerNames: ['Paul'],
    });
    expect(setup.config).toEqual({
      startingScore: 2501, matchMode: 'SETS', setsToWin: 4, legsToWin: 2, checkIn: 'Master', checkOut: 'Open',
      maxVisitsPerLeg: 12, isDoubles: false, initialStartingPlayerIndex: 0,
    });
    expect(buildTakeTheTableSetup(duel(), { leaverIds: ['bob'], challengerNames: ['Paul'] }).config).not.toHaveProperty('maxVisitsPerLeg');
  });
});

describe('partie rapide mémorisée (RM-16, AC-13)', () => {
  it('reprend les règles et la nouvelle composition, sans robot', () => {
    const setup = buildTakeTheTableSetup(fourPlayers(), { leaverIds: ['david'], challengerNames: ['Paul'] });
    expect(toTakeTheTableQuickFormat(setup, { ...STANDARD_X01_QUICK_FORMAT, playAgainstBot: true, botLevel: 'PRO' })).toEqual({
      ...STANDARD_X01_QUICK_FORMAT,
      setsToWin: 1,
      playerNames: ['Paul', 'Bob', 'Chloé', 'Alice'],
      botLevel: 'PRO',
    });
  });

  it('en 2 contre 2, mémorise les deux équipes', () => {
    const setup = buildTakeTheTableSetup(doubles(), { leaverIds: ['team2'], challengerNames: ['Paul', 'David'] });
    expect(toTakeTheTableQuickFormat(setup, null)).toMatchObject({
      isDoubles: true, team1Names: ['Paul', 'David'], team2Names: ['Bob', 'Alice'], playerNames: ['', ''],
    });
  });
});

describe('file d’attente (RM-10 à RM-14)', () => {
  it('assainit une file relue (§16)', () => {
    expect(sanitizeChallengerQueue('Léa')).toEqual([]);
    expect(sanitizeChallengerQueue(null)).toEqual([]);
    expect(sanitizeChallengerQueue([' Léa ', 'léa', '', '  ', 3, null, 'x'.repeat(101), 'Zoé'])).toEqual(['Léa', 'Zoé']);
    const long = Array.from({ length: 15 }, (_, index) => `J${index}`);
    expect(sanitizeChallengerQueue(long)).toEqual(long.slice(0, X01_CHALLENGER_QUEUE_MAX));
  });

  it('préremplit les champs avec les premiers prénoms qui ne sont pas à la table (RM-11)', () => {
    expect(prefillChallengers(['Alice', 'Léa', 'Zoé', 'Max'], 2, ['alice'])).toEqual(['Léa', 'Zoé']);
    expect(prefillChallengers(['Léa'], 2, [])).toEqual(['Léa', '']);
    expect(prefillChallengers([], 1, [])).toEqual(['']);
  });

  it('affiche la file d’après le lancement, prénom remplacé compris (RM-12, AC-09)', () => {
    expect(computeWaitingList(['Léa', 'Zoé', 'Bob'], ['léa'])).toEqual(['Zoé', 'Bob']);
    expect(computeWaitingList(['Léa', 'Zoé', 'Bob'], ['Max'])).toEqual(['Léa', 'Zoé', 'Bob']);
    expect(computeWaitingList(['Léa'], [''])).toEqual(['Léa']);
  });

  it('ajoute en fin de file et refuse vide, doublon, joueur à la table ou file pleine (RM-13, AC-08)', () => {
    const context = { tableNames: ['Alice'], challengerNames: ['Paul', ''] };
    expect(addToChallengerQueue(['Léa'], ' Zoé ', context)).toEqual({ ok: true, queue: ['Léa', 'Zoé'] });
    expect(addToChallengerQueue(['Léa'], '  ', context)).toEqual({ ok: false, error: 'empty' });
    expect(addToChallengerQueue(['Léa'], 'LÉA', context)).toEqual({ ok: false, error: 'duplicate' });
    expect(addToChallengerQueue(['Léa'], 'alice', context)).toEqual({ ok: false, error: 'atTable' });
    expect(addToChallengerQueue(['Léa'], 'paul', context)).toEqual({ ok: false, error: 'atTable' });
    const full = Array.from({ length: X01_CHALLENGER_QUEUE_MAX }, (_, index) => `J${index}`);
    expect(addToChallengerQueue(full, 'Max', context)).toEqual({ ok: false, error: 'full' });
  });

  it('retire et fait monter un prénom dans la liste affichée', () => {
    expect(removeFromChallengerQueue(['Léa', 'Zoé'], 'léa')).toEqual(['Zoé']);
    expect(moveUpInChallengerQueue(['Léa', 'Zoé', 'Bob'], 'Bob', [])).toEqual(['Léa', 'Bob', 'Zoé']);
    // Léa est dans un champ challenger : Bob monte au-dessus de Zoé, Léa garde sa place.
    expect(moveUpInChallengerQueue(['Léa', 'Zoé', 'Bob'], 'Zoé', ['Léa'])).toEqual(['Léa', 'Zoé', 'Bob']);
    expect(moveUpInChallengerQueue(['Zoé', 'Léa', 'Bob'], 'Bob', ['Léa'])).toEqual(['Bob', 'Léa', 'Zoé']);
  });
});
