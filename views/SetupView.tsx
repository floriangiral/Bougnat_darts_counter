import React, { useEffect, useReducer, useState } from 'react';
import { ArrowLeft, Swords, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Player, GameConfig, InOutRule, MatchMode } from '../types';
import type { GameType } from '../utils/arenaFlow';
import { SetupCustomNumberModal } from '../components/game-setup/SetupCustomNumberModal';
import { PlayerNameField } from '../components/game-setup/PlayerNameField';
import { SetupRulesModal } from '../components/game-setup/SetupRulesModal';
import {
  buildSetupConfig,
  buildSetupPlayers,
  createInitialSetupState,
  deriveSetupLaunchState,
  getGameName,
  getMatchModeLabel,
  getRuleDescription,
  getRuleLabel,
  getRulesContent,
  getSetupTitle,
  setupReducer,
} from '../src/features/game-setup/setupModel';

interface SetupViewProps {
  gameType?: GameType;
  onStart: (players: Player[], config: GameConfig) => void;
  onBack: () => void;
  prefilledPlayerNames?: string[];
  prefilledConfig?: Partial<{
    startingScore: number;
    matchMode: MatchMode;
    legsToWin: number;
    setsToWin: number;
    cricketRounds: NonNullable<GameConfig['cricketRounds']>;
    isDoubles: boolean;
    checkIn: InOutRule;
    checkOut: InOutRule;
    initialStartingPlayerIndex: number;
    initialStartingTeamId: 'team1' | 'team2';
    teamStarterIds: Record<string, string>;
  }>;
}

const sectionClass = 'rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.2)] backdrop-blur-sm';
const labelClass = 'mb-3 block text-[11px] font-black uppercase tracking-[0.28em] text-orange-300';
const activeOptionClass = 'bg-gradient-to-r from-orange-600 to-red-600 text-white border-transparent shadow-[0_0_14px_rgba(234,88,12,0.35)]';
const inactiveOptionClass = 'bg-white/[0.04] border-white/10 text-gray-400 hover:border-orange-500/40 hover:text-white';


export const SetupView: React.FC<SetupViewProps> = ({
  onStart,
  onBack,
  gameType: selectedGameType = 'X01',
  prefilledPlayerNames = [],
  prefilledConfig,
}) => {
  const gameType = (selectedGameType ?? 'X01') as GameType;
  const isQuickPreset = gameType === 'X01_501_BO5';
  const [setupState, dispatch] = useReducer(setupReducer, undefined, createInitialSetupState);
  const {
    startingScore,
    customScoreStr,
    matchMode,
    legsToWin,
    setsToWin,
    cricketRounds,
    isDoubles,
    playerNames,
    team1Names,
    team2Names,
    checkOut,
    checkIn,
    startingPlayerIndex,
    teamStarterIds,
    customLegsStr,
  } = setupState;
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isCustomScoreOpen, setIsCustomScoreOpen] = useState(false);
  const [isCustomLegsOpen, setIsCustomLegsOpen] = useState(false);
  const launchState = deriveSetupLaunchState({
    gameType,
    startingScore,
    customScoreStr,
    matchMode,
    legsToWin,
    customLegsStr,
  });

  useEffect(() => {
    dispatch({ type: 'apply_game_type_defaults', gameType });
  }, [gameType]);

  useEffect(() => {
    const nextNames = prefilledPlayerNames
      .map((name) => name.trim())
      .filter(Boolean)
      .slice(0, 4);

    if (nextNames.length === 0) return;

    dispatch({ type: 'apply_prefilled_names', gameType, names: nextNames });
  }, [prefilledPlayerNames, gameType]);

  useEffect(() => {
    if (!prefilledConfig) return;

    dispatch({ type: 'apply_prefilled_config', gameType, config: prefilledConfig as Partial<GameConfig> });
  }, [prefilledConfig, gameType]);

  useEffect(() => {
    dispatch({ type: 'normalize_for_game_type', gameType });
  }, [gameType, isDoubles, playerNames.length]);

  const setPlayerCount = (count: number) => {
    dispatch({ type: 'set_player_count', gameType, count });
  };

  const updatePlayerName = (index: number, name: string) => {
    dispatch({ type: 'update_player_name', index, name });
  };

  const updateTeamName = (team: 1 | 2, index: number, name: string) => {
    dispatch({ type: 'update_team_name', team, index, name });
  };

  const updateTeamStarter = (teamId: 'team1' | 'team2', playerId: string) => {
    dispatch({ type: 'update_team_starter', teamId, playerId });
  };

  const handleStart = () => {
    if (gameType === 'X01' && ((isCustomActive && !isCustomScoreValid) || (matchMode === 'LEGS' && isCustomLegsActive && !isCustomLegsValid))) {
      return;
    }
    const players = buildSetupPlayers({ isQuickPreset, isDoubles, playerNames, team1Names, team2Names });
    const { config } = buildSetupConfig({
      startingScore,
      checkIn,
      checkOut,
      matchMode,
      legsToWin,
      setsToWin,
      cricketRounds,
      isDoubles,
      startingPlayerIndex,
      teamStarterIds,
    });
    onStart(players, config);
  };

  const presets = [301, 501, 701];
  const customScoreValue = parseInt(customScoreStr, 10);
  const customLegsValue = parseInt(customLegsStr, 10);
  const hasCustomScoreValue = customScoreStr.trim().length > 0;
  const hasCustomLegsValue = customLegsStr.trim().length > 0;
  const presetLegsOptions = [1, 2, 3, 4, 5];
  const isCustomScoreValid = launchState.isCustomScoreValid;
  const isCustomLegsValid = launchState.isCustomLegsValid;
  const isCustomActive = launchState.isCustomActive;
  const isCustomLegsActive = launchState.isCustomLegsActive;
  const isCustomScoreLaunchBlocked = launchState.isCustomScoreLaunchBlocked;
  const isCustomLegsLaunchBlocked = launchState.isCustomLegsLaunchBlocked;
  const rulesContent = getRulesContent(gameType, cricketRounds, checkIn, checkOut);

  const handleCustomFocus = () => {
    const value = parseInt(customScoreStr, 10);
    if (!Number.isNaN(value)) dispatch({ type: 'set_starting_score', value });
  };

  const handleCustomChange = (value: string) => {
    const sanitizedValue = value.replace(/\D/g, '');
    dispatch({ type: 'set_custom_score_str', value: sanitizedValue });
    const parsed = parseInt(sanitizedValue, 10);
    if (!Number.isNaN(parsed)) dispatch({ type: 'set_starting_score', value: parsed });
  };

  const handleCustomBlur = () => {
    if (!hasCustomScoreValue) return;
    if (!Number.isNaN(customScoreValue) && customScoreValue < 2) {
      dispatch({ type: 'set_custom_score_str', value: '2' });
      dispatch({ type: 'set_starting_score', value: 2 });
    }
  };

  const handleCustomLegsFocus = () => {
    const value = parseInt(customLegsStr, 10);
    if (!Number.isNaN(value)) dispatch({ type: 'set_legs_to_win', value });
  };

  const handleCustomLegsChange = (value: string) => {
    const sanitizedValue = value.replace(/\D/g, '');
    dispatch({ type: 'set_custom_legs_str', value: sanitizedValue });
    const parsed = parseInt(sanitizedValue, 10);
    if (!Number.isNaN(parsed)) dispatch({ type: 'set_legs_to_win', value: parsed });
  };

  const handleCustomLegsBlur = () => {
    if (!hasCustomLegsValue) return;
    if (!Number.isNaN(customLegsValue) && customLegsValue < 1) {
      dispatch({ type: 'set_custom_legs_str', value: '1' });
      dispatch({ type: 'set_legs_to_win', value: 1 });
    }
  };

  return (
    <div className="min-h-screen bg-[#06080d] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_22%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.04),transparent_35%)]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:30px_30px]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-gray-300 transition-all hover:border-orange-400/40 hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </button>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-black uppercase tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
                {getSetupTitle(gameType)}
              </h2>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-1">
              <button
                type="button"
                onClick={() => setIsRulesOpen(true)}
                className="rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-4 text-left backdrop-blur-sm transition-all hover:border-orange-400/30 hover:bg-white/[0.06]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Type De Jeu</p>
                    <p className="mt-2 text-2xl font-black text-orange-400">{getGameName(gameType)}</p>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">
                    Voir Les Regles
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-5">
            {gameType === 'X01' && (
              <section className={sectionClass}>
                <label className={labelClass}>Score De Depart</label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {presets.map((score) => (
                    <button
                      key={score}
                      onClick={() => dispatch({ type: 'set_starting_score', value: score })}
                      className={`rounded-2xl border py-3 text-sm font-black transition-all duration-200 ${startingScore === score ? activeOptionClass : inactiveOptionClass}`}
                    >
                      {score}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      if (!hasCustomScoreValue) {
                        dispatch({ type: 'set_custom_score_str', value: '170' });
                        dispatch({ type: 'set_starting_score', value: 170 });
                      }
                      setIsCustomScoreOpen(true);
                    }}
                    className={`rounded-2xl border py-3 text-sm font-black transition-all duration-200 ${
                      isCustomActive && !presets.includes(startingScore) ? activeOptionClass : inactiveOptionClass
                    }`}
                  >
                    {isCustomActive && hasCustomScoreValue ? customScoreStr : 'Perso'}
                  </button>
                </div>
                {isCustomActive && !isCustomScoreValid && (
                  <p className="mt-3 text-right text-xs font-bold text-amber-300">
                    Saisis une valeur de 2 ou plus pour lancer une partie personnalisee.
                  </p>
                )}
              </section>
            )}

            <section className={sectionClass}>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className={`${labelClass} mb-0`}>Joueurs</label>
                {(gameType === 'X01' || gameType === 'CRICKET' || gameType === 'TRIATHLON') && !isQuickPreset && (
                  <div className="inline-flex rounded-2xl border border-white/10 bg-black/20 p-1">
                    <button
                      onClick={() => dispatch({ type: 'set_is_doubles', value: false })}
                      className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all ${!isDoubles ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                    >
                      <Users className="mr-2 inline h-4 w-4" />
                      Simple
                    </button>
                    <button
                      onClick={() => dispatch({ type: 'set_is_doubles', value: true })}
                      className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all ${isDoubles ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                    >
                      <Swords className="mr-2 inline h-4 w-4" />
                      Doublettes
                    </button>
                  </div>
                )}
              </div>

              {!isDoubles ? (
                <>
                  {!isQuickPreset && (
                    <div className="mb-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Nombre De Joueurs</div>
                      <div className="grid grid-cols-4 gap-2">
                        {(
                          gameType === 'CRICKET'
                            ? [2, 3]
                            : gameType === 'TRIATHLON'
                              ? [2]
                              : [1, 2, 3, 4]
                        ).map((count) => (
                          <button
                            key={count}
                            type="button"
                            onClick={() => setPlayerCount(count)}
                            className={`rounded-xl border py-2 text-sm font-black transition-all ${playerNames.length === count ? activeOptionClass : inactiveOptionClass}`}
                          >
                            {count}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {(isQuickPreset ? playerNames.slice(0, 2) : playerNames).map((name, index) => (
                      <PlayerNameField
                        key={index}
                        label={`Joueur ${index + 1}`}
                        value={name}
                        placeholder={`Joueur ${index + 1}`}
                        onChange={(value) => updatePlayerName(index, value)}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Joueurs 1 / 2</div>
                    <div className="space-y-3">
                      <PlayerNameField
                        label="Joueur 1"
                        value={team1Names[0]}
                        placeholder="Joueur 1"
                        onChange={(value) => updateTeamName(1, 0, value)}
                        compact
                      />
                      <PlayerNameField
                        label="Joueur 2"
                        value={team1Names[1]}
                        placeholder="Joueur 2"
                        onChange={(value) => updateTeamName(1, 1, value)}
                        compact
                      />
                    </div>
                    <div className="mt-4">
                      <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Qui commence dans ce duo ?</div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 't1p1', label: team1Names[0].trim() || 'Joueur 1' },
                          { id: 't1p2', label: team1Names[1].trim() || 'Joueur 2' },
                        ].map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => updateTeamStarter('team1', option.id)}
                            className={`rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-[0.12em] ${teamStarterIds.team1 === option.id ? activeOptionClass : inactiveOptionClass}`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Joueurs 3 / 4</div>
                    <div className="space-y-3">
                      <PlayerNameField
                        label="Joueur 3"
                        value={team2Names[0]}
                        placeholder="Joueur 3"
                        onChange={(value) => updateTeamName(2, 0, value)}
                        compact
                      />
                      <PlayerNameField
                        label="Joueur 4"
                        value={team2Names[1]}
                        placeholder="Joueur 4"
                        onChange={(value) => updateTeamName(2, 1, value)}
                        compact
                      />
                    </div>
                    <div className="mt-4">
                      <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Qui commence dans ce duo ?</div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 't2p1', label: team2Names[0].trim() || 'Joueur 3' },
                          { id: 't2p2', label: team2Names[1].trim() || 'Joueur 4' },
                        ].map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => updateTeamStarter('team2', option.id)}
                            className={`rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-[0.12em] ${teamStarterIds.team2 === option.id ? activeOptionClass : inactiveOptionClass}`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {gameType === 'CRICKET' && (
              <section className={sectionClass}>
                <label className={labelClass}>Nombre De Tours</label>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="grid grid-cols-3 gap-2">
                    {([10, 20, 30] as const).map((rounds) => (
                      <button
                        key={rounds}
                        type="button"
                        onClick={() => dispatch({ type: 'set_cricket_rounds', value: rounds })}
                        className={`rounded-xl border py-3 text-sm font-black transition-all ${cricketRounds === rounds ? activeOptionClass : inactiveOptionClass}`}
                      >
                        {rounds}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {gameType === 'X01' && (
              <section className={sectionClass}>
                <label className={labelClass}>Format Du Match</label>

                <div className="mb-5 inline-flex rounded-2xl border border-white/10 bg-black/20 p-1">
                  <button onClick={() => dispatch({ type: 'set_match_mode', value: 'LEGS' })} className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all ${matchMode === 'LEGS' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>
                    Manches
                  </button>
                  <button onClick={() => dispatch({ type: 'set_match_mode', value: 'SETS' })} className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all ${matchMode === 'SETS' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>
                    Sets
                  </button>
                </div>

                <div className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  {matchMode === 'LEGS' ? (
                    <div>
                      <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Manches Pour Gagner Le Match</div>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                        {presetLegsOptions.map((num) => (
                          <button key={num} onClick={() => dispatch({ type: 'set_legs_to_win', value: num })} className={`rounded-xl border py-2 text-sm font-black ${legsToWin === num ? activeOptionClass : inactiveOptionClass}`}>
                            {num}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setIsCustomLegsOpen(true)}
                          className={`rounded-xl border py-2 text-sm font-black ${isCustomLegsActive ? activeOptionClass : inactiveOptionClass}`}
                        >
                          {isCustomLegsActive && hasCustomLegsValue ? customLegsStr : 'Perso'}
                        </button>
                      </div>
                      {isCustomLegsActive && !isCustomLegsValid && (
                        <p className="mt-3 text-right text-xs font-bold text-amber-300">
                          Saisis au moins 1 manche pour utiliser une valeur personnalisee.
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Sets Pour Gagner Le Match</div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {[1, 3, 5, 7].map((num) => (
                            <button key={num} onClick={() => dispatch({ type: 'set_sets_to_win', value: num })} className={`rounded-xl border py-2 text-sm font-black ${setsToWin === num ? activeOptionClass : inactiveOptionClass}`}>
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Manches Pour Gagner Un Set</div>
                        <div className="grid grid-cols-2 gap-2">
                          {[3, 5].map((num) => (
                            <button key={num} onClick={() => dispatch({ type: 'set_legs_to_win', value: num })} className={`rounded-xl border py-2 text-sm font-black ${legsToWin === num ? activeOptionClass : inactiveOptionClass}`}>
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </section>
            )}

            {gameType === 'X01' && (
              <section className={sectionClass}>
                <label className={labelClass}>Regles</label>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Ouverture</div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Open', 'Double', 'Master'] as const).map((rule) => (
                        <button key={rule} onClick={() => dispatch({ type: 'set_check_in', value: rule })} className={`rounded-xl border px-2 py-2 text-[11px] font-black uppercase tracking-[0.14em] ${checkIn === rule ? activeOptionClass : inactiveOptionClass}`}>
                          {getRuleLabel(rule)}
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-sm text-gray-400">{getRuleDescription('in', checkIn)}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Fermeture</div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Open', 'Double', 'Master'] as const).map((rule) => (
                        <button key={rule} onClick={() => dispatch({ type: 'set_check_out', value: rule })} className={`rounded-xl border px-2 py-2 text-[11px] font-black uppercase tracking-[0.14em] ${checkOut === rule ? activeOptionClass : inactiveOptionClass}`}>
                          {getRuleLabel(rule)}
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-sm text-gray-400">{getRuleDescription('out', checkOut)}</p>
                  </div>
                </div>
              </section>
            )}

          </div>

          <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <section className={sectionClass}>
              <label className={labelClass}>Resume Du Match</label>
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Configuration</div>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-center justify-between">
                      <span>Jeu</span>
                      <span className="font-black text-white">{getGameName(gameType)}</span>
                    </div>
                    {gameType === 'TRIATHLON' && (
                      <>
                        <div className="flex items-center justify-between">
                          <span>Ordre Des Jeux</span>
                          <span className="font-black text-white">Capital / Cricket / 501</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Format</span>
                          <span className="font-black text-white">{isDoubles ? 'Doublettes' : 'Individuel'}</span>
                        </div>
                      </>
                    )}
                    {(gameType === 'X01' || gameType === 'CRICKET' || isQuickPreset) && (
                      <>
                        {(gameType === 'X01' || isQuickPreset) && (
                          <div className="flex items-center justify-between">
                            <span>Score De Depart</span>
                            <span className="font-black text-white">{startingScore}</span>
                          </div>
                        )}
                        {(gameType === 'X01' || isQuickPreset) && (
                          <div className="flex items-center justify-between">
                            <span>Format</span>
                            <span className="font-black text-white">{isQuickPreset ? 'BO5' : getMatchModeLabel(matchMode)}</span>
                          </div>
                        )}
                        {gameType === 'CRICKET' && (
                          <div className="flex items-center justify-between">
                            <span>Nombre De Tours</span>
                            <span className="font-black text-white">{cricketRounds}</span>
                          </div>
                        )}
                        {gameType === 'CRICKET' && (
                          <div className="flex items-center justify-between">
                            <span>Nombre De Joueurs</span>
                            <span className="font-black text-white">{isDoubles ? 4 : playerNames.length}</span>
                          </div>
                        )}
                        {gameType === 'X01' && matchMode === 'LEGS' && (
                          <div className="flex items-center justify-between">
                            <span>Manches Pour Gagner</span>
                            <span className="font-black text-white">{legsToWin}</span>
                          </div>
                        )}
                        {gameType === 'X01' && matchMode === 'SETS' && (
                          <>
                            <div className="flex items-center justify-between">
                              <span>Sets Pour Gagner</span>
                              <span className="font-black text-white">{setsToWin}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Manches Par Set</span>
                              <span className="font-black text-white">{legsToWin}</span>
                            </div>
                          </>
                        )}
                        {gameType === 'X01' && (
                          <div className="flex items-center justify-between">
                            <span>Ouverture / Fermeture</span>
                            <span className="font-black text-white">{getRuleLabel(checkIn)} / {getRuleLabel(checkOut)}</span>
                          </div>
                        )}
                        {!isQuickPreset && (
                          <div className="flex items-center justify-between">
                            <span>Mode</span>
                            <span className="font-black text-white">{isDoubles ? 'Doublettes' : 'Simple'}</span>
                          </div>
                        )}
                        {isQuickPreset && (
                          <div className="flex items-center justify-between">
                            <span>Joueurs</span>
                            <span className="font-black text-white">1 vs 1</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleStart}
                  disabled={isCustomScoreLaunchBlocked || isCustomLegsLaunchBlocked}
                  className="h-16 w-full rounded-2xl text-xl shadow-[0_18px_40px_rgba(234,88,12,0.28)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                >
                  Lancer La Partie
                </Button>
              </div>
            </section>
          </aside>
        </div>
      </div>

      {isRulesOpen && (
        <SetupRulesModal
          items={rulesContent.items}
          onClose={() => setIsRulesOpen(false)}
          title={rulesContent.title}
        />
      )}

      {isCustomScoreOpen && (
        <SetupCustomNumberModal
          confirmTestId="custom-score-confirm"
          errorText={isCustomActive && !isCustomScoreValid ? 'Saisis une valeur de 2 ou plus pour lancer une partie personnalisee.' : undefined}
          inputTestId="custom-score-input"
          kicker="Score Personnalise"
          modalTestId="custom-score-modal"
          onBlur={handleCustomBlur}
          onChange={handleCustomChange}
          onClose={() => setIsCustomScoreOpen(false)}
          onFocus={handleCustomFocus}
          placeholder="170"
          title="Choisir Un Score"
          value={customScoreStr}
        />
      )}

      {isCustomLegsOpen && (
        <SetupCustomNumberModal
          disabled={!isCustomLegsValid}
          errorText={!isCustomLegsValid ? 'Saisis au moins 1 manche pour valider cette option.' : undefined}
          kicker="Manches Personnalisees"
          onBlur={handleCustomLegsBlur}
          onChange={handleCustomLegsChange}
          onClose={() => setIsCustomLegsOpen(false)}
          onFocus={handleCustomLegsFocus}
          placeholder="7"
          title="Choisir Un Nombre"
          value={customLegsStr}
        />
      )}
    </div>
  );
};
