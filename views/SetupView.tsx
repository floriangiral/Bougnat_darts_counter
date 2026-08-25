import React, { useEffect, useReducer, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Player, GameConfig, InOutRule, MatchMode } from '../types';
import type { GameType } from '../utils/arenaFlow';
import { SetupPlayersSection } from '../components/game-setup/SetupPlayersSection';
import { SetupCustomNumberModal } from '../components/game-setup/SetupCustomNumberModal';
import { SetupSummarySection } from '../components/game-setup/SetupSummarySection';
import { SetupRulesModal } from '../components/game-setup/SetupRulesModal';
import { SetupTargetScoreSection } from '../components/game-setup/SetupTargetScoreSection';
import { SetupMatchSection } from '../components/game-setup/SetupMatchSection';
import { SetupX01RulesSection } from '../components/game-setup/SetupX01RulesSection';
import {
  setupActiveOptionClass,
  setupInactiveOptionClass,
  setupLabelClass,
  setupSectionClass,
} from '../components/game-setup/setupViewStyles';
import {
  buildSetupConfig,
  buildSetupPlayers,
  createInitialSetupState,
  deriveSetupLaunchState,
  setupReducer,
} from '../src/features/game-setup/setupModel';
import {
  getGameName,
  getRulesContent,
  getSetupTitle,
} from '../src/features/game-setup/setupPresentation';
import { buildSetupSummaryEntries } from '../src/features/game-setup/setupViewModel';

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

export const SetupView: React.FC<SetupViewProps> = ({
  onStart,
  onBack,
  gameType: selectedGameType = 'X01',
  prefilledPlayerNames = [],
  prefilledConfig,
}) => {
  const gameType = (selectedGameType ?? 'X01') as GameType;
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
    playAgainstBot,
    botLevel,
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
    if ((gameType === 'X01' || gameType === 'GOTCHA') && isCustomActive && !isCustomScoreValid) {
      return;
    }
    if (gameType === 'X01' && matchMode === 'LEGS' && isCustomLegsActive && !isCustomLegsValid) {
      return;
    }
    const players = buildSetupPlayers({
      isDoubles,
      playerNames,
      team1Names,
      team2Names,
      playAgainstBot: gameType === 'X01' && !isDoubles && playAgainstBot,
      botLevel,
    });
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
  const summaryEntries = buildSetupSummaryEntries({
    gameType,
    startingScore,
    matchMode,
    legsToWin,
    setsToWin,
    cricketRounds,
    isDoubles,
    playerCount: playerNames.length,
    checkIn,
    checkOut,
  });

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
            <SetupTargetScoreSection
              gameType={gameType}
              presets={presets}
              startingScore={startingScore}
              customScoreStr={customScoreStr}
              hasCustomScoreValue={hasCustomScoreValue}
              isCustomActive={isCustomActive}
              isCustomScoreValid={isCustomScoreValid}
              onPresetSelect={(value) => dispatch({ type: 'set_starting_score', value })}
              onOpenCustomScore={() => {
                if (!hasCustomScoreValue) {
                  dispatch({ type: 'set_custom_score_str', value: '170' });
                  dispatch({ type: 'set_starting_score', value: 170 });
                }
                setIsCustomScoreOpen(true);
              }}
            />

            <SetupPlayersSection
              gameType={gameType}
              isDoubles={isDoubles}
              playerNames={playerNames}
              team1Names={team1Names}
              team2Names={team2Names}
              teamStarterIds={teamStarterIds}
              playAgainstBot={playAgainstBot}
              botLevel={botLevel}
              onSetDoubles={(value) => dispatch({ type: 'set_is_doubles', value })}
              onSetPlayerCount={setPlayerCount}
              onUpdatePlayerName={updatePlayerName}
              onUpdateTeamName={updateTeamName}
              onUpdateTeamStarter={updateTeamStarter}
              onToggleBot={(value) => dispatch({ type: 'set_play_against_bot', gameType, value })}
              onSetBotLevel={(value) => dispatch({ type: 'set_bot_level', value })}
            />

            {gameType === 'CRICKET' && (
              <section className={setupSectionClass}>
                <label className={setupLabelClass}>Nombre De Tours</label>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="grid grid-cols-3 gap-2">
                    {([10, 20, 30] as const).map((rounds) => (
                      <button
                        key={rounds}
                        type="button"
                        onClick={() => dispatch({ type: 'set_cricket_rounds', value: rounds })}
                        className={`rounded-xl border py-3 text-sm font-black transition-all ${cricketRounds === rounds ? setupActiveOptionClass : setupInactiveOptionClass}`}
                      >
                        {rounds}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {gameType === 'X01' && (
              <SetupMatchSection
                matchMode={matchMode}
                legsToWin={legsToWin}
                setsToWin={setsToWin}
                presetLegsOptions={presetLegsOptions}
                isCustomLegsActive={isCustomLegsActive}
                hasCustomLegsValue={hasCustomLegsValue}
                customLegsStr={customLegsStr}
                isCustomLegsValid={isCustomLegsValid}
                onSetMatchMode={(value) => dispatch({ type: 'set_match_mode', value })}
                onSetLegsToWin={(value) => dispatch({ type: 'set_legs_to_win', value })}
                onSetSetsToWin={(value) => dispatch({ type: 'set_sets_to_win', value })}
                onOpenCustomLegs={() => setIsCustomLegsOpen(true)}
              />
            )}

            {gameType === 'X01' && (
              <SetupX01RulesSection
                checkIn={checkIn}
                checkOut={checkOut}
                onSetCheckIn={(value) => dispatch({ type: 'set_check_in', value })}
                onSetCheckOut={(value) => dispatch({ type: 'set_check_out', value })}
              />
            )}

          </div>

          <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <SetupSummarySection
              entries={summaryEntries}
              isLaunchBlocked={isCustomScoreLaunchBlocked || isCustomLegsLaunchBlocked}
              onStart={handleStart}
            />
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
