// Spec: spec:counter/external-match-link
// French copy of the external match link screens (setup lock, leave and startup dialogs).

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
} as const;
