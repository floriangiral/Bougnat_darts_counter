// Spec: spec:counter/external-match-link
// French copy of the external match link screens (setup lock, leave and startup dialogs).
import type { ExternalLinkIssue } from '../../features/external-match/externalMatchLink';

/** "Alice vs Bob" for singles, "Alice / Carl vs Bob / Dan" for doubles (link order). */
export const formatExternalMatchup = (playerNames: readonly string[]): string => {
  if (playerNames.length === 4) {
    return `${playerNames[0]} / ${playerNames[1]} vs ${playerNames[2]} / ${playerNames[3]}`;
  }
  return playerNames.join(' vs ');
};

export const EXTERNAL_MATCH_LABELS_FR = {
  setupBanner: {
    kicker: 'Match de tournoi',
    message: (host: string) => `Joueurs et format fixés par ${host} : ils ne peuvent pas être modifiés.`,
    doublesHint: 'Vous pouvez encore choisir qui commence dans chaque duo.',
  },
  leave: {
    abandon: {
      title: 'Quitter le match du tournoi ?',
      message: (host: string) => `Ce match a été ouvert depuis ${host}. En le quittant, aucun score ne sera envoyé.`,
      notify: 'Retour au tournoi',
      notifyHint: (host: string) => `${host} sera prévenu que le match est abandonné.`,
      leave: 'Quitter sans prévenir',
      cancel: 'Annuler',
    },
    unsentResult: {
      title: 'Résultat non envoyé',
      message: (host: string) => `Le résultat de ce match n'a pas encore été envoyé à ${host}.`,
      notify: 'Envoyer le résultat',
      notifyHint: (host: string) => `Retour vers ${host}.`,
      leave: 'Quitter sans envoyer',
      cancel: 'Annuler',
    },
  },
  conflict: {
    incoming: (playerNames: readonly string[]) => `Nouveau match : ${formatExternalMatchup(playerNames)}`,
    matchInProgress: {
      title: 'Une partie est en cours',
      message: 'Ouvrir le match du tournoi abandonnera la partie en cours sur cet appareil.',
      keep: 'Reprendre la partie',
    },
    unsentResult: {
      title: 'Résultat précédent non envoyé',
      message: (host: string) =>
        `Le résultat du match précédent n'a pas été envoyé à ${host}. Ouvrir le nouveau match le perdra.`,
      keep: "Envoyer d'abord le résultat",
      keepHint: 'Rouvrez ensuite le lien du nouveau match.',
    },
    open: 'Ouvrir le nouveau match',
  },
  invalidLink: {
    title: 'Lien de match invalide',
    footer: "Le compteur s'ouvre normalement. Signalez ce message à l'organisateur du tournoi.",
    close: 'Compris',
  },
} as const;

const INVALID_LINK_MESSAGES: Record<Exclude<ExternalLinkIssue, 'return-not-allowed'>, string> = {
  'feature-disabled': "Les liens de match de tournoi ne sont pas activés sur ce compteur.",
  'unsupported-version': "Ce lien utilise une version non prise en charge par ce compteur.",
  'unsupported-game': 'Seuls les matchs X01 peuvent être ouverts par un lien.',
  'missing-return': "Le lien ne contient pas d'adresse de retour (paramètre return).",
  'missing-players': 'Le lien doit contenir 2 joueurs (p1, p2) ou 4 joueurs (t1p1 à t2p2).',
  'invalid-start': 'Score de départ invalide (de 2 à 9999).',
  'invalid-in': "Règle d'ouverture invalide (open, double ou master).",
  'invalid-out': 'Règle de fermeture invalide (open, double ou master).',
  'invalid-legs': 'Nombre de manches invalide (de 1 à 15).',
  'invalid-sets': 'Nombre de sets invalide (de 1 à 15).',
  'invalid-stats': 'Paramètre stats invalide (1 ou 0).',
};

/** Reason shown to the players when a link that looks like an external match link is rejected. */
export const getInvalidExternalLinkMessage = (issue: ExternalLinkIssue, returnHost?: string): string => {
  if (issue === 'return-not-allowed') {
    return returnHost
      ? `L'adresse de retour ${returnHost} n'est pas autorisée sur ce compteur.`
      : "L'adresse de retour n'est pas autorisée sur ce compteur.";
  }
  return INVALID_LINK_MESSAGES[issue];
};
