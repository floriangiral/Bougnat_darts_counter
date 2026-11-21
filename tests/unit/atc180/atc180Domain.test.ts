import { describe, expect, it } from 'vitest';

import {
  ATC180_MAX_TOTAL,
  ATC180_ROUNDS,
  canUndoAtc180,
  createAtc180State,
  getAtc180Benchmark,
  getAtc180CurrentSlot,
  getAtc180PlayerStats,
  getAtc180PlayerTotal,
  getAtc180Points,
  getAtc180Ranking,
  getAtc180WinnerIds,
  isAtc180Finished,
  isAtc180StateConsistent,
  passAtc180Turn,
  recordAtc180Dart,
  setAtc180Starter,
  undoAtc180,
  type Atc180Hit,
  type Atc180State,
} from '../../../src/domain/atc180/atc180';

// Spec ref: specs/130-counter-180-around-the-clock — exemples « golden » de la page de règles.

const alice = { id: 'alice', name: 'Alice' };
const bob = { id: 'bob', name: 'Bob' };
const carla = { id: 'carla', name: 'Carla' };

const throwDarts = (state: Atc180State, darts: Atc180Hit[]) => darts.reduce(recordAtc180Dart, state);
const repeatVolley = (state: Atc180State, darts: Atc180Hit[], times: number) =>
  Array.from({ length: times }).reduce<Atc180State>((current) => throwDarts(current, darts), state);

describe('180 Around the Clock — barème', () => {
  it('tour sur le 1 : T1 + S1 + autre numéro = 4 points', () => {
    expect(getAtc180Points(['TRIPLE', 'SINGLE', 'MISS'])).toBe(4);
    const state = throwDarts(createAtc180State([alice]), ['TRIPLE', 'SINGLE', 'MISS']);
    expect(state.turns).toEqual([{ playerId: 'alice', round: 1, darts: ['TRIPLE', 'SINGLE', 'MISS'], points: 4 }]);
  });

  it('tour 17 : T17 + D17 + S3 = 4 points, le total passe de 78 à 82', () => {
    // 16 tours à 78 points : 14 volées à 5 (T + S + S) et 2 à 4 (T + S + MISS).
    let state = repeatVolley(createAtc180State([alice]), ['TRIPLE', 'SINGLE', 'SINGLE'], 14);
    state = repeatVolley(state, ['TRIPLE', 'SINGLE', 'MISS'], 2);
    expect(getAtc180PlayerTotal(state, 'alice')).toBe(78);
    expect(getAtc180CurrentSlot(state)?.round).toBe(17);
    state = throwDarts(state, ['TRIPLE', 'DOUBLE', 'MISS']);
    expect(state.turns.at(-1)).toMatchObject({ round: 17, points: 4 });
    expect(getAtc180PlayerTotal(state, 'alice')).toBe(82);
  });

  it('trois triples = 9 points, le maximum d’un tour', () => {
    const state = throwDarts(createAtc180State([alice]), ['TRIPLE', 'TRIPLE', 'TRIPLE']);
    expect(state.turns[0].points).toBe(9);
  });

  it('partie parfaite = 180, et un total jamais négatif sans bust ni pénalité', () => {
    const perfect = repeatVolley(createAtc180State([alice]), ['TRIPLE', 'TRIPLE', 'TRIPLE'], ATC180_ROUNDS);
    expect(isAtc180Finished(perfect)).toBe(true);
    expect(getAtc180PlayerTotal(perfect, 'alice')).toBe(ATC180_MAX_TOTAL);
    expect(ATC180_MAX_TOTAL).toBe(180);

    const zero = repeatVolley(createAtc180State([alice]), ['MISS', 'MISS', 'MISS'], ATC180_ROUNDS);
    expect(isAtc180Finished(zero)).toBe(true);
    expect(getAtc180PlayerTotal(zero, 'alice')).toBe(0);
  });
});

describe('180 Around the Clock — déroulé', () => {
  it('fait jouer tous les joueurs sur le tour n avant le tour n+1, à partir du premier lanceur', () => {
    let state = createAtc180State([alice, bob, carla], 1);
    const order: string[] = [];
    for (let index = 0; index < 6; index += 1) {
      const slot = getAtc180CurrentSlot(state)!;
      order.push(`${slot.round}:${slot.playerId}`);
      state = passAtc180Turn(state);
    }
    expect(order).toEqual(['1:bob', '1:carla', '1:alice', '2:bob', '2:carla', '2:alice']);
  });

  it('se termine après le 20e tour de chaque joueur et ignore toute saisie ensuite', () => {
    let state = createAtc180State([alice, bob]);
    for (let index = 0; index < 39; index += 1) state = passAtc180Turn(state);
    expect(getAtc180CurrentSlot(state)).toEqual({ round: 20, playerIndex: 1, playerId: 'bob' });
    expect(isAtc180Finished(state)).toBe(false);
    state = throwDarts(state, ['SINGLE', 'MISS', 'MISS']);
    expect(isAtc180Finished(state)).toBe(true);
    expect(getAtc180CurrentSlot(state)).toBeNull();
    expect(recordAtc180Dart(state, 'TRIPLE')).toBe(state);
    expect(passAtc180Turn(state)).toBe(state);
  });

  it('« Passer » termine la volée : les fléchettes non saisies valent 0', () => {
    const state = passAtc180Turn(recordAtc180Dart(createAtc180State([alice, bob]), 'TRIPLE'));
    expect(state.turns[0]).toEqual({ playerId: 'alice', round: 1, darts: ['TRIPLE'], points: 3 });
    expect(getAtc180CurrentSlot(state)?.playerId).toBe('bob');
  });

  it('ne change le premier lanceur qu’avant la première fléchette', () => {
    const initial = createAtc180State([alice, bob]);
    expect(setAtc180Starter(initial, 1).startingPlayerIndex).toBe(1);
    expect(setAtc180Starter(initial, 4)).toBe(initial);
    const started = recordAtc180Dart(initial, 'MISS');
    expect(setAtc180Starter(started, 1)).toBe(started);
  });

  it('refuse moins d’un ou plus de quatre joueurs', () => {
    expect(() => createAtc180State([])).toThrow('1 à 4 joueurs');
    expect(() => createAtc180State([alice, bob, carla, { id: 'd', name: 'D' }, { id: 'e', name: 'E' }])).toThrow();
    expect(createAtc180State([alice, bob], 9).startingPlayerIndex).toBe(1);
  });
});

describe('180 Around the Clock — annulation', () => {
  it('annule fléchette par fléchette à travers les changements de joueur et de tour', () => {
    let state = createAtc180State([alice, bob]);
    state = throwDarts(state, ['TRIPLE', 'SINGLE', 'DOUBLE']);
    state = throwDarts(state, ['MISS', 'TRIPLE', 'TRIPLE']);
    state = recordAtc180Dart(state, 'SINGLE');
    expect(getAtc180CurrentSlot(state)).toMatchObject({ round: 2, playerId: 'alice' });

    state = undoAtc180(state);
    expect(state.currentDarts).toEqual([]);
    expect(getAtc180CurrentSlot(state)).toMatchObject({ round: 2, playerId: 'alice' });

    state = undoAtc180(state);
    expect(getAtc180CurrentSlot(state)).toMatchObject({ round: 1, playerId: 'bob' });
    expect(state.currentDarts).toEqual(['MISS', 'TRIPLE']);
    expect(getAtc180PlayerTotal(state, 'bob')).toBe(0);

    state = undoAtc180(undoAtc180(undoAtc180(state)));
    expect(getAtc180CurrentSlot(state)).toMatchObject({ round: 1, playerId: 'alice' });
    expect(state.currentDarts).toEqual(['TRIPLE', 'SINGLE']);
  });

  it('annule un « Passer » d’un coup et rouvre une partie terminée', () => {
    let state = passAtc180Turn(recordAtc180Dart(createAtc180State([alice]), 'SINGLE'));
    state = undoAtc180(state);
    expect(state.turns).toEqual([]);
    expect(state.currentDarts).toEqual(['SINGLE']);

    let finished = repeatVolley(createAtc180State([alice]), ['SINGLE', 'SINGLE', 'SINGLE'], ATC180_ROUNDS);
    finished = undoAtc180(finished);
    expect(isAtc180Finished(finished)).toBe(false);
    expect(getAtc180CurrentSlot(finished)?.round).toBe(20);
  });

  it('ne fait rien quand il n’y a rien à annuler', () => {
    const initial = createAtc180State([alice]);
    expect(canUndoAtc180(initial)).toBe(false);
    expect(undoAtc180(initial)).toBe(initial);
  });
});

describe('180 Around the Clock — classement et statistiques', () => {
  const playFullGame = (volleys: Record<string, Atc180Hit[]>) => {
    let state = createAtc180State(Object.keys(volleys).map((id) => ({ id, name: id })));
    while (!isAtc180Finished(state)) state = throwDarts(state, volleys[getAtc180CurrentSlot(state)!.playerId]);
    return state;
  };

  it('désigne le meilleur total vainqueur une fois la partie terminée', () => {
    const state = playFullGame({ alice: ['TRIPLE', 'MISS', 'MISS'], bob: ['SINGLE', 'MISS', 'MISS'] });
    expect(getAtc180Ranking(state).map(({ player, total, rank }) => [player.id, total, rank])).toEqual([['alice', 60, 1], ['bob', 20, 2]]);
    expect(getAtc180WinnerIds(state)).toEqual(['alice']);
  });

  it('déclare les égalités ex aequo, sans départage', () => {
    const state = playFullGame({
      alice: ['TRIPLE', 'MISS', 'MISS'],
      bob: ['SINGLE', 'DOUBLE', 'SINGLE'],
      carla: ['MISS', 'MISS', 'MISS'],
    });
    expect(getAtc180WinnerIds(state)).toEqual(['alice', 'bob']);
    expect(getAtc180Ranking(state).map(({ player, rank, isWinner }) => [player.id, rank, isWinner])).toEqual([
      ['alice', 1, true],
      ['bob', 1, true],
      ['carla', 3, false],
    ]);
  });

  it('n’a aucun vainqueur avant la fin, et un joueur seul gagne son entraînement', () => {
    const inProgress = throwDarts(createAtc180State([alice, bob]), ['TRIPLE', 'TRIPLE', 'TRIPLE']);
    expect(getAtc180WinnerIds(inProgress)).toEqual([]);
    expect(getAtc180Ranking(inProgress)[0]).toMatchObject({ total: 9, rank: 1, isWinner: false });
    const training = playFullGame({ alice: ['MISS', 'MISS', 'MISS'] });
    expect(getAtc180WinnerIds(training)).toEqual(['alice']);
  });

  it('calcule le score par tour, le taux de triples et le meilleur tour', () => {
    let state = createAtc180State([alice]);
    state = throwDarts(state, ['TRIPLE', 'SINGLE', 'MISS']);
    state = throwDarts(state, ['TRIPLE', 'TRIPLE', 'DOUBLE']);
    state = passAtc180Turn(recordAtc180Dart(state, 'SINGLE'));
    const stats = getAtc180PlayerStats(state, 'alice');
    expect(stats.roundPoints.slice(0, 4)).toEqual([4, 7, 1, null]);
    expect(stats).toMatchObject({ total: 12, dartsThrown: 9, triples: 3, hits: 6, bestRound: { round: 2, points: 7 } });
    expect(stats.tripleRate).toBeCloseTo(1 / 3);
    expect(getAtc180PlayerStats(createAtc180State([alice]), 'alice')).toMatchObject({ tripleRate: 0, bestRound: null });
  });

  it('situe un total par rapport aux repères débutant, intermédiaire et confirmé', () => {
    expect(getAtc180Benchmark(59)).toBeNull();
    expect(getAtc180Benchmark(60)?.level).toBe('Débutant');
    expect(getAtc180Benchmark(100)?.level).toBe('Intermédiaire');
    expect(getAtc180Benchmark(180)?.level).toBe('Confirmé');
  });
});

describe('180 Around the Clock — cohérence d’un état relu', () => {
  const played = () => throwDarts(throwDarts(createAtc180State([alice, bob]), ['TRIPLE', 'SINGLE', 'MISS']), ['SINGLE']);

  it('accepte un état réel, y compris terminé', () => {
    expect(isAtc180StateConsistent(played())).toBe(true);
    expect(isAtc180StateConsistent(repeatVolley(createAtc180State([alice]), ['MISS', 'MISS', 'MISS'], 20))).toBe(true);
  });

  it.each<[string, (state: Atc180State) => Atc180State]>([
    ['joueur hors de son tour', (state) => ({ ...state, turns: [{ ...state.turns[0], playerId: 'bob' }] })],
    ['tour faux', (state) => ({ ...state, turns: [{ ...state.turns[0], round: 2 }] })],
    ['points incohérents', (state) => ({ ...state, turns: [{ ...state.turns[0], points: 9 }] })],
    ['volée en cours complète', (state) => ({ ...state, currentDarts: ['MISS', 'MISS', 'MISS'] })],
    ['fléchette inconnue', (state) => ({ ...state, currentDarts: ['BULL' as Atc180Hit] })],
    ['premier lanceur hors limites', (state) => ({ ...state, startingPlayerIndex: 2 })],
    ['joueurs en double', (state) => ({ ...state, players: [alice, alice] })],
    ['trop de volées', (state) => ({ ...state, turns: Array.from({ length: 41 }, () => state.turns[0]) })],
  ])('refuse un état incohérent : %s', (_label, mutate) => {
    expect(isAtc180StateConsistent(mutate(played()))).toBe(false);
  });

  it('refuse une volée en cours après la fin de partie', () => {
    const finished = repeatVolley(createAtc180State([alice]), ['MISS', 'MISS', 'MISS'], 20);
    expect(isAtc180StateConsistent({ ...finished, currentDarts: ['MISS'] })).toBe(false);
    expect(isAtc180StateConsistent({ ...finished, players: [] })).toBe(false);
  });
});
