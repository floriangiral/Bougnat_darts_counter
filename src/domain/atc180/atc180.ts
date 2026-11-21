// Spec ref: specs/130-counter-180-around-the-clock (RM-01 à RM-09).
// Règles du 180 Around the Clock, sans React ni stockage : 20 tours (numéros 1 à 20 dans l'ordre), 3 fléchettes
// par joueur et par tour sur le numéro du tour ; triple = 3 points, simple ou double = 1, autre = 0 ;
// pas de bust, pas de pénalité ; meilleur total après le 20e tour de chacun ; égalité = vainqueurs ex aequo.
//
// L'état ne garde que les volées terminées (ordre chronologique) et les fléchettes de la volée en cours :
// tour courant, joueur courant, totaux, classement et annulation s'en déduisent, sans pile d'annulation.

export type Atc180Hit = 'TRIPLE' | 'DOUBLE' | 'SINGLE' | 'MISS';

export const ATC180_HITS: readonly Atc180Hit[] = ['TRIPLE', 'DOUBLE', 'SINGLE', 'MISS'];

export const ATC180_HIT_POINTS: Readonly<Record<Atc180Hit, number>> = {
  TRIPLE: 3,
  DOUBLE: 1,
  SINGLE: 1,
  MISS: 0,
};

export const ATC180_ROUNDS = 20;
export const ATC180_DARTS_PER_TURN = 3;
export const ATC180_MIN_PLAYERS = 1;
export const ATC180_MAX_PLAYERS = 4;
export const ATC180_MAX_TURN_POINTS = ATC180_DARTS_PER_TURN * ATC180_HIT_POINTS.TRIPLE;
export const ATC180_MAX_TOTAL = ATC180_ROUNDS * ATC180_MAX_TURN_POINTS;

/** Repères indicatifs de la page de règles (affichage seulement, aucun effet sur la partie). */
export const ATC180_BENCHMARKS = [
  { level: 'Débutant', score: 60 },
  { level: 'Intermédiaire', score: 100 },
  { level: 'Confirmé', score: 140 },
] as const;

export type Atc180Benchmark = (typeof ATC180_BENCHMARKS)[number];

export type Atc180Player = {
  id: string;
  name: string;
};

/** Volée terminée : fléchettes saisies (moins de 3 si le joueur a passé : les manquantes valent 0). */
export type Atc180Turn = {
  playerId: string;
  round: number;
  darts: Atc180Hit[];
  points: number;
};

export type Atc180State = {
  players: Atc180Player[];
  startingPlayerIndex: number;
  turns: Atc180Turn[];
  currentDarts: Atc180Hit[];
};

export type Atc180TurnSlot = {
  round: number;
  playerIndex: number;
  playerId: string;
};

export type Atc180RankingEntry = {
  player: Atc180Player;
  total: number;
  /** Rang « sportif » : deux ex aequo partagent le rang, le suivant saute (1, 1, 3). */
  rank: number;
  isWinner: boolean;
};

export type Atc180PlayerStats = {
  total: number;
  /** Points de chaque tour (index 0 = tour 1) ; null tant que le tour n'est pas joué. */
  roundPoints: Array<number | null>;
  dartsThrown: number;
  triples: number;
  hits: number;
  /** Part des fléchettes lancées tombées dans le triple du numéro (0 à 1). */
  tripleRate: number;
  /** Meilleur tour (le premier en cas d'égalité), null avant le premier tour joué. */
  bestRound: { round: number; points: number } | null;
};

export const getAtc180Points = (darts: readonly Atc180Hit[]): number =>
  darts.reduce((sum, hit) => sum + ATC180_HIT_POINTS[hit], 0);

export const createAtc180State = (players: readonly Atc180Player[], startingPlayerIndex = 0): Atc180State => {
  if (players.length < ATC180_MIN_PLAYERS || players.length > ATC180_MAX_PLAYERS) {
    throw new Error('Le 180 Around the Clock se joue de 1 à 4 joueurs.');
  }
  return {
    players: players.map(({ id, name }) => ({ id, name })),
    startingPlayerIndex: Math.max(0, Math.min(Math.trunc(startingPlayerIndex) || 0, players.length - 1)),
    turns: [],
    currentDarts: [],
  };
};

export const getAtc180TotalTurns = (state: Atc180State) => ATC180_ROUNDS * state.players.length;

/** Tour et joueur de la volée d'index donné : chaque tour suit le même ordre, à partir du premier lanceur. */
export const getAtc180TurnSlot = (state: Atc180State, turnIndex: number): Atc180TurnSlot => {
  const count = state.players.length;
  const playerIndex = (state.startingPlayerIndex + (turnIndex % count)) % count;
  return {
    round: Math.floor(turnIndex / count) + 1,
    playerIndex,
    playerId: state.players[playerIndex].id,
  };
};

export const isAtc180Finished = (state: Atc180State) => state.turns.length >= getAtc180TotalTurns(state);

export const hasAtc180Started = (state: Atc180State) => state.turns.length > 0 || state.currentDarts.length > 0;

/** Volée en cours, null une fois les 20 tours joués par tous. */
export const getAtc180CurrentSlot = (state: Atc180State): Atc180TurnSlot | null =>
  (isAtc180Finished(state) ? null : getAtc180TurnSlot(state, state.turns.length));

/** Choix du premier lanceur (« Qui commence ? »), possible seulement avant la première fléchette. */
export const setAtc180Starter = (state: Atc180State, playerIndex: number): Atc180State => {
  if (hasAtc180Started(state) || !Number.isInteger(playerIndex) || playerIndex < 0 || playerIndex >= state.players.length) {
    return state;
  }
  return { ...state, startingPlayerIndex: playerIndex };
};

const completeTurn = (state: Atc180State, darts: Atc180Hit[]): Atc180State => {
  const slot = getAtc180TurnSlot(state, state.turns.length);
  return {
    ...state,
    turns: [...state.turns, { playerId: slot.playerId, round: slot.round, darts, points: getAtc180Points(darts) }],
    currentDarts: [],
  };
};

/** Une fléchette : la 3e termine la volée et donne la main au joueur suivant (ou au tour suivant). */
export const recordAtc180Dart = (state: Atc180State, hit: Atc180Hit): Atc180State => {
  if (isAtc180Finished(state) || !ATC180_HITS.includes(hit)) return state;
  const darts = [...state.currentDarts, hit];
  return darts.length >= ATC180_DARTS_PER_TURN ? completeTurn(state, darts) : { ...state, currentDarts: darts };
};

/** Termine la volée en cours : les fléchettes non saisies valent 0. */
export const passAtc180Turn = (state: Atc180State): Atc180State =>
  (isAtc180Finished(state) ? state : completeTurn(state, [...state.currentDarts]));

export const canUndoAtc180 = (state: Atc180State) => hasAtc180Started(state);

/**
 * Annule la dernière saisie : une fléchette de la volée en cours, sinon la dernière action de la volée
 * précédente (sa 3e fléchette, ou le « Passer » qui l'a terminée), y compris après la fin de partie.
 */
export const undoAtc180 = (state: Atc180State): Atc180State => {
  if (state.currentDarts.length > 0) {
    return { ...state, currentDarts: state.currentDarts.slice(0, -1) };
  }
  const lastTurn = state.turns.at(-1);
  if (!lastTurn) return state;
  return {
    ...state,
    turns: state.turns.slice(0, -1),
    currentDarts: lastTurn.darts.length >= ATC180_DARTS_PER_TURN ? lastTurn.darts.slice(0, -1) : [...lastTurn.darts],
  };
};

export const getAtc180PlayerTotal = (state: Atc180State, playerId: string): number =>
  state.turns.reduce((sum, turn) => (turn.playerId === playerId ? sum + turn.points : sum), 0);

/** Classement par total décroissant ; à égalité, ordre de jeu conservé et rang partagé. */
export const getAtc180Ranking = (state: Atc180State): Atc180RankingEntry[] => {
  const finished = isAtc180Finished(state);
  const sorted = state.players
    .map((player) => ({ player, total: getAtc180PlayerTotal(state, player.id) }))
    .sort((a, b) => b.total - a.total);
  const best = sorted[0]?.total ?? 0;
  return sorted.map((entry) => ({
    ...entry,
    rank: sorted.findIndex((other) => other.total === entry.total) + 1,
    isWinner: finished && entry.total === best,
  }));
};

/** Vainqueurs (ex aequo possibles) une fois la partie terminée ; vide avant. */
export const getAtc180WinnerIds = (state: Atc180State): string[] =>
  getAtc180Ranking(state).filter((entry) => entry.isWinner).map((entry) => entry.player.id);

export const getAtc180PlayerStats = (state: Atc180State, playerId: string): Atc180PlayerStats => {
  const turns = state.turns.filter((turn) => turn.playerId === playerId);
  const roundPoints: Array<number | null> = Array.from({ length: ATC180_ROUNDS }, () => null);
  let bestRound: Atc180PlayerStats['bestRound'] = null;
  let triples = 0;
  let hits = 0;
  turns.forEach((turn) => {
    roundPoints[turn.round - 1] = turn.points;
    if (!bestRound || turn.points > bestRound.points) bestRound = { round: turn.round, points: turn.points };
    turn.darts.forEach((hit) => {
      if (hit === 'TRIPLE') triples += 1;
      if (hit !== 'MISS') hits += 1;
    });
  });
  // Une volée passée compte ses 3 fléchettes : les non saisies sont des fléchettes hors cible.
  const dartsThrown = turns.length * ATC180_DARTS_PER_TURN;
  return {
    total: turns.reduce((sum, turn) => sum + turn.points, 0),
    roundPoints,
    dartsThrown,
    triples,
    hits,
    tripleRate: dartsThrown === 0 ? 0 : triples / dartsThrown,
    bestRound,
  };
};

/** Plus haut repère atteint par un total (Débutant, Intermédiaire, Confirmé), null en dessous de 60. */
export const getAtc180Benchmark = (total: number): Atc180Benchmark | null =>
  [...ATC180_BENCHMARKS].reverse().find((benchmark) => total >= benchmark.score) ?? null;

/**
 * Invariants d'un état relu (reprise de session) : volées dans l'ordre des tours et des joueurs, au plus
 * 3 fléchettes, points cohérents, volée en cours incomplète et vide une fois la partie terminée.
 */
export const isAtc180StateConsistent = (state: Atc180State): boolean => {
  const count = state.players.length;
  if (count < ATC180_MIN_PLAYERS || count > ATC180_MAX_PLAYERS) return false;
  if (new Set(state.players.map((player) => player.id)).size !== count) return false;
  if (!Number.isInteger(state.startingPlayerIndex) || state.startingPlayerIndex < 0 || state.startingPlayerIndex >= count) return false;
  if (state.turns.length > getAtc180TotalTurns(state)) return false;
  if (state.currentDarts.length >= ATC180_DARTS_PER_TURN) return false;
  if (isAtc180Finished(state) && state.currentDarts.length > 0) return false;
  if (!state.currentDarts.every((hit) => ATC180_HITS.includes(hit))) return false;
  return state.turns.every((turn, index) => {
    const slot = getAtc180TurnSlot(state, index);
    return turn.playerId === slot.playerId
      && turn.round === slot.round
      && turn.darts.length <= ATC180_DARTS_PER_TURN
      && turn.darts.every((hit) => ATC180_HITS.includes(hit))
      && turn.points === getAtc180Points(turn.darts);
  });
};
