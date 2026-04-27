// Presentation helpers for the setup screen: labels, rule descriptions, rules content.
// Extracted from setupModel.ts to separate domain state management from presentation concerns.
import type { GameConfig, InOutRule, MatchMode } from '../../../types';
import type { GameType } from '../../../utils/arenaFlow';

export type SetupRulesContent = {
  title: string;
  items: string[];
};

export const getRuleDescription = (type: 'in' | 'out', rule: InOutRule) => {
  if (type === 'out') {
    switch (rule) {
      case 'Open':
        return 'Fin sur n importe quel segment.';
      case 'Double':
        return 'Fin classique sur un double ou le bull.';
      case 'Master':
        return 'Fin sur un double, un triple ou le bull.';
    }
  }

  switch (rule) {
    case 'Open':
      return 'Le score commence immediatement.';
    case 'Double':
      return 'Un double est requis pour ouvrir le score.';
    case 'Master':
      return 'Touchez un double ou un triple pour commencer.';
  }
};

export const getRuleLabel = (rule: InOutRule) => {
  switch (rule) {
    case 'Open':
      return 'Open';
    case 'Double':
      return 'Double';
    case 'Master':
      return 'Master';
  }
};

export const getMatchModeLabel = (mode: MatchMode) => (mode === 'LEGS' ? 'Manches' : 'Sets');

export const getSetupTitle = (_gameType: GameType) => {
  return 'Configuration';
};

export const getGameName = (gameType: GameType) => {
  if (gameType === 'CRICKET') return 'Cricket';
  if (gameType === 'CAPITAL') return 'Capital';
  if (gameType === 'KILLER') return 'Killer';
  if (gameType === 'GOTCHA') return 'Gotcha';
  if (gameType === 'TRIATHLON') return 'Triathlon';
  return 'X01';
};

export const getRulesContent = (
  gameType: GameType,
  cricketRounds: NonNullable<GameConfig['cricketRounds']>,
  checkIn: InOutRule,
  checkOut: InOutRule,
): SetupRulesContent => {
  if (gameType === 'X01') {
    return {
      title: 'Regles Du X01',
      items: [
        'Chaque joueur commence avec un score defini, puis retire les points marques a chaque tour.',
        'Le vainqueur est le premier a atteindre exactement zero.',
        `Check-in actuel : ${checkIn}. Le score ${checkIn === 'Open' ? 'commence immediatement' : 'ne commence qu apres une ouverture valide'}.`,
        `Check-out actuel : ${checkOut}. Il faut donc terminer selon cette regle pour valider la victoire.`,
        'Si un joueur depasse zero ou termine sans respecter le check-out, le tour est annule.',
      ],
    };
  }

  if (gameType === 'CRICKET') {
    return {
      title: 'Regles Du Cricket',
      items: [
        'Les cibles sont 15, 16, 17, 18, 19, 20 et Bull.',
        'Il faut fermer chaque nombre avec trois marques.',
        'Une fois une cible fermee, les marques supplementaires rapportent des points tant que l adversaire ne l a pas fermee.',
        'Le joueur gagne quand il a tout ferme et qu il a au moins autant de points que son adversaire.',
        `La partie est limitee a ${cricketRounds} tours par joueur ou equipe, avec 3 fleches par tour.`,
      ],
    };
  }

  if (gameType === 'CAPITAL') {
    return {
      title: 'Regles Du Capital',
      items: [
        'Ordre des challenges : Capital, 20, Suite, 19, 3 a cotes, 18, 57 points, 17, Couleur, 16, Triple, 15, Double, 14, 21 ou moins, 13, Bulle ou D-Bull.',
        'Capital : le joueur saisit directement le score total de sa visite.',
        'Sur les challenges numeriques, seuls les segments de la cible choisie comptent. Suite, 3 a cotes et Couleur se jouent sur 3 flechettes.',
        '57 points : il faut atteindre exactement 57, peu importe la combinaison. Si 57 est atteint avant la 3e flechette, le jeu passe directement a la suite.',
        '21 ou moins : la visite est reussie si le total des 3 flechettes est inferieur ou egal a 21. Bulle ou D-Bull : un bull simple ou double valide le challenge.',
        'Un challenge reussi ajoute les points marques. En cas d echec, le score du joueur est divise par 2, arrondi a l entier superieur.',
      ],
    };
  }

  if (gameType === 'TRIATHLON') {
    return {
      title: 'Regles Du Triathlon',
      items: [
        'Le Triathlon enchaine 3 epreuves dans cet ordre : Capital, Cricket puis 501.',
        'Capital : 1 seule manche. En doublettes, chaque joueur joue individuellement et les scores des 2 equipiers sont additionnes pour le classement de l equipe.',
        'Cricket : 1 seule manche. En doublettes, le Cricket se joue en equipe, comme le 501.',
        '501 : finish au double, 1 seule manche, en individuel ou en doublettes selon le format choisi.',
        'Le depart se decide avec une fleche a la bulle : le joueur ou l equipe le plus pres du centre commence le Triathlon.',
        'Le score final se joue sur 100 points : chaque epreuve donne des points de resultat, puis des bonus de performance viennent completer le total.',
        'Les bonus prennent en compte la qualite de jeu : checkout, moyenne et flechettes sur le 501 ; MPR, score et fermetures sur le Cricket ; score, regularite et penalites sur le Capital.',
        'En cas d egalite au score final, un 501 supplementaire departage les joueurs ou les equipes. Le gagnant du tir a la bulle initial commence ce tie-break.',
        'Les statistiques finales affichent le detail des points de resultat, des bonus et le score final du Triathlon.',
      ],
    };
  }

  if (gameType === 'KILLER') {
    return {
      title: 'Regles Du Killer',
      items: [
        'Chaque joueur commence avec 3 vies.',
        'Phase 1 : chaque joueur lance avec sa main faible pour prendre un numero unique.',
        'Phase 2 : touche ton propre double pour devenir Killer.',
        'Un Killer retire une vie en touchant le double d un adversaire.',
        'Un Killer qui touche son propre double perd une vie.',
        'Le dernier joueur encore en vie gagne la partie.',
      ],
    };
  }

  if (gameType === 'GOTCHA') {
    return {
      title: 'Regles Du Gotcha',
      items: [
        'Tout le monde commence a zero et monte vers le score cible.',
        'Le premier joueur qui atteint exactement le score cible gagne.',
        'Si tu depasses la cible, le tour est casse et ton score ne bouge pas.',
        'Si ton nouveau score est identique a celui d un adversaire, tu fais Gotcha : son score revient a zero.',
        'Le bull simple vaut 25 et le double bull vaut 50 dans le total de visite.',
        'Chaque tour se joue en 3 flechettes, sans double obligatoire pour finir.',
      ],
    };
  }

  return {
    title: 'Regles Du Mode',
    items: [
      'Configure les joueurs et les options du mode avant de lancer la partie.',
      'Les regles detaillees dependront du type de jeu selectionne.',
    ],
  };
};
