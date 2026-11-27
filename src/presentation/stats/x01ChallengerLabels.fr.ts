// Spec 137 : libellés et messages de « Je prends la gagne » (écran de fin X01 et fenêtre).
import type { ChallengerNameError } from '../../features/x01/challenger/x01Challenger';
import { X01_CHALLENGER_QUEUE_MAX, type QueueAddError } from '../../features/x01/challenger/x01ChallengerQueue';

export const X01_CHALLENGER_LABELS_FR = {
  takeTheTable: 'JE PRENDS LA GAGNE',
  title: 'Qui prend la gagne ?',
  winnerTag: 'Vainqueur',
  leaversLegend: 'Qui sort ?',
  challenger: 'Challenger',
  challengerNumbered: (index: number) => `Challenger ${index}`,
  challengerTeam: 'Équipe challenger',
  challengerTeamPlayer: (index: number) => (index === 1 ? 'Équipe challenger, joueur 1 (lance en premier)' : `Équipe challenger, joueur ${index}`),
  shortcuts: 'Raccourcis',
  shortcutLabel: (name: string) => `Mettre ${name} en challenger`,
  queueTitle: 'File d’attente',
  queueEmpty: 'File vide',
  queueAddLabel: 'Ajouter à la file',
  queueAdd: 'Ajouter',
  queueRemove: 'Retirer',
  queueRemoveLabel: (name: string) => `Retirer ${name} de la file`,
  queueMoveUp: 'Monter',
  queueMoveUpLabel: (name: string) => `Monter ${name}`,
  queueAddLeaver: (name: string) => `Ajouter ${name} en fin de file`,
  cancel: 'Annuler',
  launch: 'Lancer',
} as const;

/** RM-03, RM-06 : « Bob sort » ou « Chloé / David sortent ». */
export const formatLeavingLabel = (names: readonly string[]): string =>
  (names.length > 1 ? `${names.join(' / ')} sortent` : `${names[0] ?? ''} sort`);

/** RM-12 : « Prochain : Paul, puis Léa », « Prochain : Paul » ou « File vide ». */
export const formatNextInQueue = (queue: readonly string[]): string =>
  (queue.length === 0 ? X01_CHALLENGER_LABELS_FR.queueEmpty : `Prochain : ${queue.join(', puis ')}`);

/** §15 : messages d'erreur des champs challengers. */
export const formatChallengerError = (error: ChallengerNameError): string =>
  (error.kind === 'empty'
    ? 'Saisis le prénom du challenger.'
    : `${error.name} joue déjà : choisis un autre prénom, par exemple « ${error.name} B. ».`);

/** §15 : messages d'erreur de l'ajout à la file. */
export const formatQueueAddError = (error: QueueAddError, name: string): string => {
  switch (error) {
    case 'empty':
      return 'Saisis un prénom à ajouter à la file.';
    case 'duplicate':
      return `${name.trim()} est déjà dans la file.`;
    case 'atTable':
      return `${name.trim()} est à la table.`;
    case 'full':
      return `File complète (${X01_CHALLENGER_QUEUE_MAX} prénoms).`;
  }
};
