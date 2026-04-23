import type { GameConfig, Player } from '../../../types';
import type { GameType } from '../../../utils/arenaFlow';
import type { SetupState } from './setupTypes';

export type SetupMatchDraft = {
  players: Player[];
  config: GameConfig;
};

export const buildSetupMatchDraft = (state: SetupState, gameType: GameType): SetupMatchDraft => {
  const isQuickPreset = gameType === 'X01_501_BO5';
  const safeStartingScore = state.startingScore > 0 ? state.startingScore : 501;
  let players: Player[] = [];

  if (isQuickPreset) {
    players = [0, 1].map((index) => ({
      id: `p${index + 1}`,
      name: (state.playerNames[index] || `Joueur ${index + 1}`).trim() || `Joueur ${index + 1}`,
      teamId: `p${index + 1}`,
    }));
  } else if (state.isDoubles) {
    const p1 = { id: 't1p1', name: state.team1Names[0].trim() || 'Joueur 1', teamId: 'team1' };
    const p2 = { id: 't1p2', name: state.team1Names[1].trim() || 'Joueur 2', teamId: 'team1' };
    const p3 = { id: 't2p1', name: state.team2Names[0].trim() || 'Joueur 3', teamId: 'team2' };
    const p4 = { id: 't2p2', name: state.team2Names[1].trim() || 'Joueur 4', teamId: 'team2' };
    players = [p1, p2, p3, p4];
  } else {
    players = state.playerNames.map((name, index) => ({
      id: `p${index + 1}`,
      name: name.trim() || `Joueur ${index + 1}`,
      teamId: `p${index + 1}`,
    }));
  }

  return {
    players,
    config: {
      startingScore: safeStartingScore,
      checkIn: state.checkIn,
      checkOut: state.checkOut,
      matchMode: state.matchMode,
      legsToWin: state.legsToWin,
      setsToWin: state.setsToWin,
      cricketRounds: state.cricketRounds,
      isDoubles: state.isDoubles,
      initialStartingPlayerIndex: state.isDoubles ? 0 : state.startingPlayerIndex,
      initialStartingTeamId: undefined,
      teamStarterIds: state.isDoubles ? state.teamStarterIds : undefined,
    },
  };
};

