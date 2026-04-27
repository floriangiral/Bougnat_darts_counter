import type { GameConfig, InOutRule, MatchMode, Player, X01BotLevel } from '../../../types';
import type { GameType } from '../../../utils/arenaFlow';
import { DEFAULT_X01_BOT_LEVEL } from '../../domain/x01Bot/x01Bot';

export interface SetupState {
  startingScore: number;
  customScoreStr: string;
  matchMode: MatchMode;
  legsToWin: number;
  setsToWin: number;
  cricketRounds: NonNullable<GameConfig['cricketRounds']>;
  isDoubles: boolean;
  playerNames: string[];
  team1Names: string[];
  team2Names: string[];
  checkOut: InOutRule;
  checkIn: InOutRule;
  startingPlayerIndex: number;
  teamStarterIds: Record<string, string>;
  customLegsStr: string;
  playAgainstBot: boolean;
  botLevel: X01BotLevel;
}

export type SetupAction =
  | { type: 'apply_game_type_defaults'; gameType: GameType }
  | { type: 'apply_prefilled_names'; gameType: GameType; names: string[] }
  | { type: 'apply_prefilled_config'; gameType: GameType; config: Partial<GameConfig> }
  | { type: 'set_player_count'; gameType: GameType; count: number }
  | { type: 'update_player_name'; index: number; name: string }
  | { type: 'update_team_name'; team: 1 | 2; index: number; name: string }
  | { type: 'update_team_starter'; teamId: 'team1' | 'team2'; playerId: string }
  | { type: 'set_starting_score'; value: number }
  | { type: 'set_custom_score_str'; value: string }
  | { type: 'set_match_mode'; value: MatchMode }
  | { type: 'set_legs_to_win'; value: number }
  | { type: 'set_sets_to_win'; value: number }
  | { type: 'set_cricket_rounds'; value: NonNullable<GameConfig['cricketRounds']> }
  | { type: 'set_is_doubles'; value: boolean }
  | { type: 'set_check_in'; value: InOutRule }
  | { type: 'set_check_out'; value: InOutRule }
  | { type: 'set_starting_player_index'; value: number }
  | { type: 'set_custom_legs_str'; value: string }
  | { type: 'set_play_against_bot'; gameType: GameType; value: boolean }
  | { type: 'set_bot_level'; value: X01BotLevel }
  | { type: 'normalize_for_game_type'; gameType: GameType };

export type SetupLaunchState = {
  isCustomActive: boolean;
  isCustomScoreValid: boolean;
  isCustomLegsActive: boolean;
  isCustomLegsValid: boolean;
  isCustomScoreLaunchBlocked: boolean;
  isCustomLegsLaunchBlocked: boolean;
};

export type SetupRulesContent = {
  title: string;
  items: string[];
};

export const DEFAULT_TEAM_STARTERS = { team1: 't1p1', team2: 't2p1' };

const getSimplePlayerBounds = (gameType: GameType) => {
  if (gameType === 'KILLER') return { min: 2, max: 6 };
  if (gameType === 'GOTCHA') return { min: 2, max: 6 };
  if (gameType === 'TRIATHLON') return { min: 2, max: 2 };
  if (gameType === 'CRICKET') return { min: 2, max: 3 };
  if (gameType === 'X01') return { min: 1, max: 2 };
  return { min: 1, max: 4 };
};

export const createInitialSetupState = (): SetupState => ({
  startingScore: 501,
  customScoreStr: '170',
  matchMode: 'LEGS',
  legsToWin: 3,
  setsToWin: 3,
  cricketRounds: 20,
  isDoubles: false,
  playerNames: ['', ''],
  team1Names: ['', ''],
  team2Names: ['', ''],
  checkOut: 'Double',
  checkIn: 'Open',
  startingPlayerIndex: 0,
  teamStarterIds: DEFAULT_TEAM_STARTERS,
  customLegsStr: '7',
  playAgainstBot: false,
  botLevel: DEFAULT_X01_BOT_LEVEL,
});

export const normalizeSetupState = (state: SetupState, gameType: GameType): SetupState => {
  let nextState = state;

  if (gameType !== 'X01' || nextState.isDoubles) {
    nextState = {
      ...nextState,
      playAgainstBot: false,
    };
  }

  if (nextState.playAgainstBot && !nextState.isDoubles) {
    nextState = {
      ...nextState,
      playerNames: [nextState.playerNames[0] || '', nextState.playerNames[1] || 'Robot'],
      startingPlayerIndex: Math.min(nextState.startingPlayerIndex, 1),
    };
  }

  if (!nextState.isDoubles) {
    const { min, max } = getSimplePlayerBounds(gameType);
    const clampedPlayerCount = Math.max(min, Math.min(max, nextState.playerNames.length));

    if (clampedPlayerCount !== nextState.playerNames.length) {
      nextState = {
        ...nextState,
        playerNames: clampedPlayerCount > nextState.playerNames.length
          ? Array.from({ length: clampedPlayerCount }, (_, index) => nextState.playerNames[index] || `Joueur ${index + 1}`)
          : nextState.playerNames.slice(0, clampedPlayerCount),
      };
    }
  }

  if (!nextState.isDoubles) {
    const maxIndex = Math.max(0, nextState.playerNames.length - 1);
    if (nextState.startingPlayerIndex > maxIndex) {
      nextState = {
        ...nextState,
        startingPlayerIndex: maxIndex,
      };
    }
  }

  return nextState;
};

export const setupReducer = (state: SetupState, action: SetupAction): SetupState => {
  switch (action.type) {
    case 'apply_game_type_defaults': {
      if (action.gameType === 'X01_501_BO5') {
        return normalizeSetupState({
          ...state,
          startingScore: 501,
          customScoreStr: '501',
          matchMode: 'LEGS',
          legsToWin: 3,
          customLegsStr: '3',
          setsToWin: 1,
          isDoubles: false,
          playerNames: ['', ''],
          checkIn: 'Open',
          checkOut: 'Double',
          startingPlayerIndex: 0,
          teamStarterIds: DEFAULT_TEAM_STARTERS,
          playAgainstBot: false,
        }, action.gameType);
      }

      if (action.gameType === 'X01') {
        return normalizeSetupState({
          ...state,
          startingScore: 501,
          matchMode: 'LEGS',
          legsToWin: 3,
          customLegsStr: '3',
          setsToWin: 3,
          isDoubles: false,
          checkIn: 'Open',
          checkOut: 'Double',
          startingPlayerIndex: 0,
          teamStarterIds: DEFAULT_TEAM_STARTERS,
          playAgainstBot: false,
        }, action.gameType);
      }

      if (action.gameType === 'CRICKET') {
        return normalizeSetupState({
          ...state,
          matchMode: 'LEGS',
          legsToWin: 3,
          customLegsStr: '3',
          setsToWin: 1,
          cricketRounds: 20,
          isDoubles: false,
          playAgainstBot: false,
        }, action.gameType);
      }

      if (action.gameType === 'TRIATHLON') {
        return normalizeSetupState({
          ...state,
          matchMode: 'LEGS',
          legsToWin: 1,
          customLegsStr: '1',
          setsToWin: 1,
          isDoubles: false,
          playerNames: ['', ''],
          playAgainstBot: false,
        }, action.gameType);
      }

      if (action.gameType === 'KILLER') {
        return normalizeSetupState({
          ...state,
          matchMode: 'LEGS',
          legsToWin: 1,
          customLegsStr: '1',
          setsToWin: 1,
          isDoubles: false,
          playerNames: state.playerNames.length >= 2 ? state.playerNames.slice(0, 6) : ['', ''],
          playAgainstBot: false,
        }, action.gameType);
      }

      if (action.gameType === 'GOTCHA') {
        return normalizeSetupState({
          ...state,
          startingScore: 301,
          customScoreStr: '301',
          matchMode: 'LEGS',
          legsToWin: 1,
          customLegsStr: '1',
          setsToWin: 1,
          isDoubles: false,
          playerNames: state.playerNames.length >= 2 ? state.playerNames.slice(0, 6) : ['', ''],
          checkIn: 'Open',
          checkOut: 'Open',
          playAgainstBot: false,
        }, action.gameType);
      }

      return normalizeSetupState(state, action.gameType);
    }
    case 'apply_prefilled_names': {
      if (action.names.length === 0) return state;

      if (action.gameType === 'X01' && action.names.length === 4) {
        return normalizeSetupState({
          ...state,
          isDoubles: true,
          playerNames: action.names,
          team1Names: [action.names[0], action.names[1]],
          team2Names: [action.names[2], action.names[3]],
        }, action.gameType);
      }

      return normalizeSetupState({
        ...state,
        isDoubles: false,
        playerNames: action.gameType === 'TRIATHLON'
          ? [action.names[0] || '', action.names[1] || '']
          : action.names,
        team1Names: action.names.length >= 2 ? [action.names[0], action.names[1]] : state.team1Names,
        team2Names: action.names.length >= 4 ? [action.names[2], action.names[3]] : state.team2Names,
      }, action.gameType);
    }
    case 'apply_prefilled_config': {
      const nextState: SetupState = {
        ...state,
        startingScore: typeof action.config.startingScore === 'number' ? action.config.startingScore : state.startingScore,
        customScoreStr: typeof action.config.startingScore === 'number' ? String(action.config.startingScore) : state.customScoreStr,
        matchMode: action.config.matchMode ?? state.matchMode,
        legsToWin: typeof action.config.legsToWin === 'number' ? action.config.legsToWin : state.legsToWin,
        customLegsStr: typeof action.config.legsToWin === 'number' ? String(action.config.legsToWin) : state.customLegsStr,
        setsToWin: typeof action.config.setsToWin === 'number' ? action.config.setsToWin : state.setsToWin,
        cricketRounds: action.config.cricketRounds ?? state.cricketRounds,
        isDoubles: typeof action.config.isDoubles === 'boolean' ? action.config.isDoubles : state.isDoubles,
        startingPlayerIndex: typeof action.config.initialStartingPlayerIndex === 'number' ? action.config.initialStartingPlayerIndex || 0 : state.startingPlayerIndex,
        teamStarterIds: action.config.teamStarterIds ?? state.teamStarterIds,
        checkIn: action.config.checkIn ?? state.checkIn,
        checkOut: action.config.checkOut ?? state.checkOut,
      };

      return normalizeSetupState(nextState, action.gameType);
    }
    case 'set_player_count': {
      const simpleBounds = getSimplePlayerBounds(action.gameType);
      const minPlayers = !state.isDoubles ? simpleBounds.min : 1;
      const maxPlayers = !state.isDoubles ? simpleBounds.max : 4;
      const newCount = Math.max(minPlayers, Math.min(maxPlayers, action.count));

      return normalizeSetupState({
        ...state,
        playerNames: newCount > state.playerNames.length
          ? Array.from({ length: newCount }, (_, index) => state.playerNames[index] || `Joueur ${index + 1}`)
          : state.playerNames.slice(0, newCount),
      }, action.gameType);
    }
    case 'update_player_name': {
      const playerNames = [...state.playerNames];
      playerNames[action.index] = action.name;
      return { ...state, playerNames };
    }
    case 'update_team_name': {
      if (action.team === 1) {
        const team1Names = [...state.team1Names];
        team1Names[action.index] = action.name;
        return { ...state, team1Names };
      }
      const team2Names = [...state.team2Names];
      team2Names[action.index] = action.name;
      return { ...state, team2Names };
    }
    case 'update_team_starter':
      return {
        ...state,
        teamStarterIds: {
          ...state.teamStarterIds,
          [action.teamId]: action.playerId,
        },
      };
    case 'set_starting_score':
      return { ...state, startingScore: action.value };
    case 'set_custom_score_str':
      return { ...state, customScoreStr: action.value };
    case 'set_match_mode':
      return { ...state, matchMode: action.value };
    case 'set_legs_to_win':
      return { ...state, legsToWin: action.value };
    case 'set_sets_to_win':
      return { ...state, setsToWin: action.value };
    case 'set_cricket_rounds':
      return { ...state, cricketRounds: action.value };
    case 'set_is_doubles':
      return {
        ...state,
        isDoubles: action.value,
        playAgainstBot: action.value ? false : state.playAgainstBot,
      };
    case 'set_check_in':
      return { ...state, checkIn: action.value };
    case 'set_check_out':
      return { ...state, checkOut: action.value };
    case 'set_starting_player_index':
      return { ...state, startingPlayerIndex: action.value };
    case 'set_custom_legs_str':
      return { ...state, customLegsStr: action.value };
    case 'set_play_against_bot':
      return normalizeSetupState({
        ...state,
        playAgainstBot: action.gameType === 'X01' && !state.isDoubles ? action.value : false,
      }, action.gameType);
    case 'set_bot_level':
      return { ...state, botLevel: action.value };
    case 'normalize_for_game_type':
      return normalizeSetupState(state, action.gameType);
    default:
      return state;
  }
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

export const getSetupTitle = (gameType: GameType) => {
  if (gameType === 'X01_501_BO5') return '501 Double Out';
  return 'Configuration';
};

export const getGameName = (gameType: GameType) => {
  if (gameType === 'CRICKET') return 'Cricket';
  if (gameType === 'CAPITAL') return 'Capital';
  if (gameType === 'KILLER') return 'Killer';
  if (gameType === 'GOTCHA') return 'Gotcha';
  if (gameType === 'TRIATHLON') return 'Le Triathlon';
  if (gameType === 'X01_501_BO5') return '501, 3 manches gagnantes';
  return 'X01';
};

export const getRulesContent = (gameType: GameType, cricketRounds: NonNullable<GameConfig['cricketRounds']>, checkIn: InOutRule, checkOut: InOutRule): SetupRulesContent => {
  if (gameType === 'X01' || gameType === 'X01_501_BO5') {
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

export const deriveSetupLaunchState = (params: {
  gameType: GameType;
  startingScore: number;
  customScoreStr: string;
  matchMode: MatchMode;
  legsToWin: number;
  customLegsStr: string;
}): SetupLaunchState => {
  const presets = [301, 501, 701];
  const presetLegsOptions = [1, 2, 3, 4, 5];
  const customScoreValue = parseInt(params.customScoreStr, 10);
  const customLegsValue = parseInt(params.customLegsStr, 10);
  const hasCustomScoreValue = params.customScoreStr.trim().length > 0;
  const hasCustomLegsValue = params.customLegsStr.trim().length > 0;
  const isCustomScoreValid = hasCustomScoreValue && !Number.isNaN(customScoreValue) && customScoreValue >= 2;
  const isCustomLegsValid = hasCustomLegsValue && !Number.isNaN(customLegsValue) && customLegsValue >= 1;
  const isPresetSelected = presets.includes(params.startingScore);
  const isCustomActive = !isPresetSelected || params.startingScore === parseInt(params.customScoreStr || '0', 10);
  const isCustomLegsActive = params.matchMode === 'LEGS' && !presetLegsOptions.includes(params.legsToWin);
  const isCustomScoreLaunchBlocked = (params.gameType === 'X01' || params.gameType === 'GOTCHA') && isCustomActive && !isCustomScoreValid;
  const isCustomLegsLaunchBlocked = params.gameType === 'X01' && params.matchMode === 'LEGS' && isCustomLegsActive && !isCustomLegsValid;

  return {
    isCustomActive,
    isCustomScoreValid,
    isCustomLegsActive,
    isCustomLegsValid,
    isCustomScoreLaunchBlocked,
    isCustomLegsLaunchBlocked,
  };
};

export const buildSetupPlayers = (params: {
  isQuickPreset: boolean;
  isDoubles: boolean;
  playerNames: string[];
  team1Names: string[];
  team2Names: string[];
  playAgainstBot?: boolean;
  botLevel?: X01BotLevel;
}) => {
  if (params.isQuickPreset) {
    return [0, 1].map((index) => ({
      id: `p${index + 1}`,
      name: (params.playerNames[index] || `Joueur ${index + 1}`).trim() || `Joueur ${index + 1}`,
      teamId: `p${index + 1}`,
    }));
  }

  if (params.isDoubles) {
    const p1 = { id: 't1p1', name: params.team1Names[0].trim() || 'Joueur 1', teamId: 'team1' };
    const p2 = { id: 't1p2', name: params.team1Names[1].trim() || 'Joueur 2', teamId: 'team1' };
    const p3 = { id: 't2p1', name: params.team2Names[0].trim() || 'Joueur 3', teamId: 'team2' };
    const p4 = { id: 't2p2', name: params.team2Names[1].trim() || 'Joueur 4', teamId: 'team2' };
    return [p1, p2, p3, p4];
  }

  if (params.playAgainstBot) {
    const botLevel = params.botLevel ?? DEFAULT_X01_BOT_LEVEL;
    return [
      {
        id: 'p1',
        name: params.playerNames[0].trim() || 'Joueur 1',
        teamId: 'p1',
      },
      {
        id: 'p2',
        name: params.playerNames[1].trim() || 'Robot',
        teamId: 'p2',
        isBot: true,
        botLevel,
      },
    ] satisfies Player[];
  }

  return params.playerNames.map((name, index) => ({
    id: `p${index + 1}`,
    name: name.trim() || `Joueur ${index + 1}`,
    teamId: `p${index + 1}`,
  }));
};

export const buildSetupConfig = (params: {
  startingScore: number;
  checkIn: InOutRule;
  checkOut: InOutRule;
  matchMode: MatchMode;
  legsToWin: number;
  setsToWin: number;
  cricketRounds: NonNullable<GameConfig['cricketRounds']>;
  isDoubles: boolean;
  startingPlayerIndex: number;
  teamStarterIds: Record<string, string>;
}) => {
  const safeStartingScore = params.startingScore > 0 ? params.startingScore : 501;

  const config: GameConfig = {
    startingScore: safeStartingScore,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    matchMode: params.matchMode,
    legsToWin: params.legsToWin,
    setsToWin: params.setsToWin,
    cricketRounds: params.cricketRounds,
    isDoubles: params.isDoubles,
    initialStartingPlayerIndex: params.isDoubles ? 0 : params.startingPlayerIndex,
    initialStartingTeamId: undefined,
    teamStarterIds: params.isDoubles ? params.teamStarterIds : undefined,
  };

  return { safeStartingScore, config };
};
