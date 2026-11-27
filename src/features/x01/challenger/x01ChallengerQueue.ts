// Spec 137 (RM-10 à RM-15) : file d'attente des challengers « Je prends la gagne », fonctions pures.
// La file est une liste ordonnée de prénoms ; elle vit dans la session persistée (x01ChallengerQueue).

export const X01_CHALLENGER_QUEUE_MAX = 12;
export const X01_CHALLENGER_NAME_MAX_LENGTH = 100;

/** RM-08 : comparaison sans espaces de bord ni distinction de casse. */
export const normalizeChallengerName = (name: string): string => name.trim().toLocaleLowerCase('fr');

export const isSameChallengerName = (a: string, b: string): boolean =>
  normalizeChallengerName(a) === normalizeChallengerName(b);

export const includesChallengerName = (names: readonly string[], name: string): boolean =>
  names.some((candidate) => isSameChallengerName(candidate, name));

const isQueueName = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.trim().length <= X01_CHALLENGER_NAME_MAX_LENGTH;

/** §16 : une file relue invalide est assainie (éléments invalides et doublons retirés, 12 au plus). */
export const sanitizeChallengerQueue = (raw: unknown): string[] => {
  if (!Array.isArray(raw)) return [];
  const queue: string[] = [];
  for (const value of raw as unknown[]) {
    if (!isQueueName(value) || includesChallengerName(queue, value)) continue;
    queue.push(value.trim());
    if (queue.length === X01_CHALLENGER_QUEUE_MAX) break;
  }
  return queue;
};

/** RM-11 : les premiers prénoms de la file qui ne sont pas à la table, complétés par des champs vides. */
export const prefillChallengers = (
  queue: readonly string[],
  count: number,
  remainingNames: readonly string[],
): string[] => {
  const candidates = queue.filter((name) => !includesChallengerName(remainingNames, name)).slice(0, count);
  return [...candidates, ...Array.from({ length: count - candidates.length }, () => '')];
};

/** RM-12 : la file telle qu'elle sera après le lancement (prénoms absents des champs challengers). */
export const computeWaitingList = (queue: readonly string[], challengerNames: readonly string[]): string[] => {
  const filled = challengerNames.filter((name) => name.trim().length > 0);
  return queue.filter((name) => !includesChallengerName(filled, name));
};

export type QueueAddError = 'empty' | 'duplicate' | 'atTable' | 'full';

export type QueueAddResult = { ok: true; queue: string[] } | { ok: false; error: QueueAddError };

/**
 * RM-13 : ajout en fin de file. `tableNames` regroupe les joueurs restants ; un challenger saisi est
 * aussi « à la table ». La capacité porte sur la liste affichée (`computeWaitingList`).
 */
export const addToChallengerQueue = (
  queue: readonly string[],
  name: string,
  { tableNames, challengerNames }: { tableNames: readonly string[]; challengerNames: readonly string[] },
): QueueAddResult => {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: 'empty' };
  const filledChallengers = challengerNames.filter((candidate) => candidate.trim().length > 0);
  if (includesChallengerName(tableNames, trimmed) || includesChallengerName(filledChallengers, trimmed)) {
    return { ok: false, error: 'atTable' };
  }
  if (includesChallengerName(queue, trimmed)) return { ok: false, error: 'duplicate' };
  if (computeWaitingList(queue, challengerNames).length >= X01_CHALLENGER_QUEUE_MAX) return { ok: false, error: 'full' };
  return { ok: true, queue: [...queue, trimmed.slice(0, X01_CHALLENGER_NAME_MAX_LENGTH)] };
};

export const removeFromChallengerQueue = (queue: readonly string[], name: string): string[] =>
  queue.filter((candidate) => !isSameChallengerName(candidate, name));

/** RM-13 : « Monter » échange un prénom avec celui qui le précède dans la liste affichée. */
export const moveUpInChallengerQueue = (
  queue: readonly string[],
  name: string,
  challengerNames: readonly string[],
): string[] => {
  const visible = computeWaitingList(queue, challengerNames);
  const visibleIndex = visible.findIndex((candidate) => isSameChallengerName(candidate, name));
  if (visibleIndex <= 0) return [...queue];
  const previous = visible[visibleIndex - 1];
  const next = [...queue];
  const from = next.findIndex((candidate) => isSameChallengerName(candidate, name));
  const to = next.findIndex((candidate) => isSameChallengerName(candidate, previous));
  [next[from], next[to]] = [next[to], next[from]];
  return next;
};
