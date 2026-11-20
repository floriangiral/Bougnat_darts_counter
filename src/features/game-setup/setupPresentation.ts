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
        return 'Fin sur n’importe quel segment.';
      case 'Double':
        return 'Fin classique sur un double ou le bull.';
      case 'Master':
        return 'Fin sur un double, un triple ou le double bull (pas le simple bull).';
    }
  }

  switch (rule) {
    case 'Open':
      return 'Le score commence immédiatement.';
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

const STATIC_RULE_ITEMS: Partial<Record<GameType, readonly string[]>> = {
  CAPITAL: [
    'Ordre des challenges : Capital, 20, Suite, 19, 3 à côté, 18, 57 points, 17, Couleur, 16, Triple, 15, Double, 14, Moins de 21, 13, Bulle ou D-Bull.',
    'Capital : le joueur saisit directement le score total de sa visite.',
    'Sur les challenges numériques, seuls les segments de la cible choisie comptent. Suite, 3 à côté et Couleur se jouent sur 3 fléchettes.',
    '57 points : il faut atteindre exactement 57, peu importe la combinaison. Si 57 est atteint avant la 3e fléchette, le jeu passe directement à la suite.',
    'Moins de 21 : la visite est réussie si le total des 3 fléchettes est strictement inférieur à 21. Bulle ou D-Bull : un bull simple ou double valide le challenge.',
    "Un challenge réussi ajoute les points marqués. En cas d’échec, le score du joueur est divisé par 2, arrondi à l’entier supérieur.",
  ],
  TRIATHLON: [
    'Le Triathlon enchaîne 3 épreuves dans cet ordre : Capital, Cricket puis 501.',
    "Capital : 1 seule manche. En doublettes, chaque joueur joue individuellement et les scores des 2 équipiers sont additionnés pour le classement de l’équipe.",
    'Cricket : 1 seule manche. En doublettes, le Cricket se joue en équipe, comme le 501.',
    '501 : finish au double, 1 seule manche, en individuel ou en doublettes selon le format choisi.',
    "Le départ se décide avec une fléchette à la bulle : le joueur ou l’équipe le plus près du centre commence le Triathlon.",
    'Le score final se joue sur 100 points : chaque épreuve donne des points de résultat, puis des bonus de performance viennent compléter le total.',
    'Les bonus prennent en compte la qualité de jeu : checkout, moyenne et fléchettes sur le 501 ; MPR, score et fermetures sur le Cricket ; score, régularité et pénalités sur le Capital.',
    "En cas d’égalité au score final, un 501 supplémentaire départage les joueurs ou les équipes. Le gagnant du tir à la bulle initial commence ce tie-break.",
    'Les statistiques finales affichent le détail des points de résultat, des bonus et le score final du Triathlon.',
  ],
  KILLER: [
    'Chaque joueur commence avec 3 vies.',
    'Phase 1 : chaque joueur lance avec sa main faible pour prendre un numéro unique.',
    'Phase 2 : touche ton propre double pour devenir Killer.',
    "Un Killer retire une vie en touchant le double d’un adversaire.",
    'Un Killer qui touche son propre double perd une vie.',
    'Le dernier joueur encore en vie gagne la partie.',
  ],
  GOTCHA: [
    'Tout le monde commence à zéro et monte vers le score cible.',
    'Le premier joueur qui atteint exactement le score cible gagne.',
    'Si tu dépasses la cible, le tour est cassé et ton score ne bouge pas.',
    "Si ton nouveau score est identique à celui d’un adversaire, tu fais Gotcha : son score revient à zéro.",
    'Le bull simple vaut 25 et le double bull vaut 50 dans le total de visite.',
    'Chaque tour se joue en 3 fléchettes, sans double obligatoire pour finir.',
  ],
};

export const getRulesContent = (
  gameType: GameType,
  cricketRounds: NonNullable<GameConfig['cricketRounds']>,
  checkIn: InOutRule,
  checkOut: InOutRule,
): SetupRulesContent => {
  if (gameType === 'X01') {
    return {
      title: 'Règles du X01',
      items: [
        'Chaque joueur commence avec un score défini, puis retire les points marqués à chaque tour.',
        'Le vainqueur est le premier à atteindre exactement zéro.',
        `Check-in actuel : ${checkIn}. Le score ${checkIn === 'Open' ? 'commence immédiatement' : 'ne commence qu’après une ouverture valide'}.`,
        `Check-out actuel : ${checkOut}. Il faut donc terminer selon cette règle pour valider la victoire.`,
        'Si un joueur dépasse zéro ou termine sans respecter le check-out, le tour est annulé.',
        'En Double-Out et en Master-Out, laisser 1 point est un trop, et un total impossible à finir avec la règle (ex. 180 en Double-Out) compte comme un trop.',
      ],
    };
  }

  if (gameType === 'CRICKET') {
    return {
      title: 'Règles du Cricket',
      items: [
        'Les cibles sont 15, 16, 17, 18, 19, 20 et Bull.',
        'Il faut fermer chaque nombre avec trois marques.',
        "Une fois une cible fermée, les marques supplémentaires rapportent des points tant que l’adversaire ne l’a pas fermée.",
        'Le joueur gagne quand il a tout fermé et qu’il a au moins autant de points que son adversaire.',
        `La partie est limitée à ${cricketRounds} tours par joueur ou équipe, avec 3 fléchettes par tour.`,
      ],
    };
  }

  const staticItems = STATIC_RULE_ITEMS[gameType];
  if (staticItems) {
    return {
      title: `Règles du ${getGameName(gameType)}`,
      items: [...staticItems],
    };
  }

  return {
    title: 'Règles du mode',
    items: [
      'Configure les joueurs et les options du mode avant de lancer la partie.',
      'Les règles détaillées dépendront du type de jeu sélectionné.',
    ],
  };
};
