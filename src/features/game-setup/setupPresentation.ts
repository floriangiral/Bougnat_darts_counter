// Presentation helpers for the setup screen: labels, rule descriptions, rules content.
// Extracted from setupModel.ts to separate domain state management from presentation concerns.
import type { GameConfig, InOutRule, MatchMode } from '../../../types';
import type { GameType } from '../../../utils/arenaFlow';
import { TRIATHLON_SCORING_RULES } from '../../domain/triathlon';

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

/** Message affiché quand le score personnalisé est hors bornes (X01 plafonné à 2501). */
export const getCustomScoreErrorText = (gameType: GameType) => (
  gameType === 'X01'
    ? 'Saisis une valeur entre 2 et 2501 pour lancer une partie personnalisée.'
    : 'Saisis une valeur de 2 ou plus pour lancer une partie personnalisée.'
);

export const getSetupTitle = (_gameType: GameType) => {
  return 'Configuration';
};

export const getGameName = (gameType: GameType) => {
  if (gameType === 'CRICKET') return 'Cricket';
  if (gameType === 'CAPITAL') return 'Capital';
  if (gameType === 'KILLER') return 'Killer';
  if (gameType === 'GOTCHA') return 'Gotcha';
  if (gameType === 'TRIATHLON') return 'Triathlon';
  if (gameType === 'ATC180') return '180 Around the Clock';
  return 'X01';
};

const { x01: TRI_X01, cricket: TRI_CRICKET, capital: TRI_CAPITAL } = TRIATHLON_SCORING_RULES;

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
    `Barème v${TRIATHLON_SCORING_RULES.version} sur 100 points (501 sur 34, Cricket sur 33, Capital sur 33) : chaque épreuve donne des points de résultat, complétés par des bonus de performance.`,
    `501 : victoire ${TRI_X01.winnerBasePoints} pts ; défaite en position de sortie ${TRI_X01.closeLossBasePoints} pts (reste finissable en une visite au double : de 2 à 170, sauf 159, 162, 163, 165, 166, 168 et 169) ; autre défaite ${TRI_X01.standardLossBasePoints} pts. Bonus : meilleure moyenne sur les 9 premières fléchettes +${TRI_X01.bonuses.bestFirstNineAverage.points}, meilleure moyenne +${TRI_X01.bonuses.bestAverage.points}, plus de visites à ${TRI_X01.tonPlusThreshold} ou plus +${TRI_X01.bonuses.mostTonPlusVisits.points}.`,
    `Cricket : vainqueur ${TRI_CRICKET.winnerBasePoints} pts, perdant ${TRI_CRICKET.loserBasePoints} pts, égalité ${TRI_CRICKET.drawBasePoints} pts chacun. Bonus : meilleur MPR +${TRI_CRICKET.bonuses.bestMpr.points}, fermeture complète des 7 cibles +${TRI_CRICKET.bonuses.fullClose.points}, plus de numéros fermés +${TRI_CRICKET.bonuses.mostClosedNumbers.points}.`,
    `Capital : 1er ${TRI_CAPITAL.rank.rankPoints[0]} pts, 2e ${TRI_CAPITAL.rank.rankPoints[1]} pts, mêmes points en cas d’égalité. Bonus : meilleur challenge (plus de points marqués sur un challenge réussi) +${TRI_CAPITAL.bonuses.bestChallenge.points}, régularité (plus de challenges réussis) +${TRI_CAPITAL.bonuses.regularity.points}, peu de pénalités (moins de challenges ratés) +${TRI_CAPITAL.bonuses.fewestPenalties.points}.`,
    'Un bonus n’est attribué que si la meilleure valeur dépasse celle d’au moins un adversaire : à égalité, les premiers ex æquo le partagent, mais personne ne le reçoit si tous sont à égalité.',
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
  ATC180: [
    'La partie dure 20 tours : un par numéro, du 1 au 20, dans l’ordre croissant.',
    'À chaque tour, chaque joueur lance 3 fléchettes sur le numéro du tour, puis le joueur suivant joue ce même numéro.',
    'Triple du numéro : 3 points. Simple (grand ou petit) ou double du numéro : 1 point. Autre numéro ou hors cible : 0 point.',
    'On avance au numéro suivant quel que soit le résultat : pas de bust, pas de pénalité. Au maximum 9 points par tour et 180 sur la partie.',
    'Tout le monde commence à 0. Le total le plus élevé après les 20 tours gagne ; en cas d’égalité, les joueurs sont vainqueurs ex aequo.',
    'Seul, c’est un entraînement : vise ton meilleur total. Repères : débutant environ 60, intermédiaire environ 100, confirmé 140 et plus.',
  ],
};

export const getRulesContent = (
  gameType: GameType,
  cricketRounds: NonNullable<GameConfig['cricketRounds']>,
  checkIn: InOutRule,
  checkOut: InOutRule,
): SetupRulesContent => {
  if (gameType === 'X01') {
    const openingDarts = checkIn === 'Double' ? 'double ou double bull' : 'double, triple ou double bull';
    const checkInRule = checkIn === 'Open'
      ? 'Check-in actuel : Open. Le score commence immédiatement.'
      : `Check-in actuel : ${checkIn}. Le score ne commence qu’après une ouverture valide (${openingDarts}) : saisissez les points comptés à partir de la fléchette d’ouverture incluse, puis confirmez l’ouverture (une fois par équipe et par manche). Le robot n’est pas disponible avec cette ouverture.`;
    return {
      title: 'Règles du X01',
      items: [
        'Chaque joueur commence avec un score défini, puis retire les points marqués à chaque tour.',
        'Le vainqueur est le premier à atteindre exactement zéro.',
        checkInRule,
        `Check-out actuel : ${checkOut}. Il faut donc terminer selon cette règle pour valider la victoire.`,
        'Si un joueur dépasse zéro ou termine sans respecter le check-out, le tour est annulé.',
        'En Double-Out et en Master-Out, laisser 1 point est un trop, et un total impossible à finir avec la règle (ex. 180 en Double-Out) compte comme un trop.',
        'À 3 ou 4 joueurs, l’ordre de passage (n° 1 à 4) est choisi avant la partie : chaque manche est ouverte par le numéro suivant. Après la victoire, les places suivantes peuvent se jouer dans la manche en cours ; sinon, le classement est calculé.',
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
        'À la limite de tours, le meilleur score l’emporte, puis le plus de numéros fermés, puis le plus de marques ; en cas d’égalité parfaite, l’égalité est déclarée.',
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
