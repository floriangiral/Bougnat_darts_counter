import React from 'react';
import { Bot, Swords, Users } from 'lucide-react';

import type { GameType } from '../../utils/arenaFlow';
import type { X01BotLevel } from '../../types';
import { formatX01BotAverageRange, X01_BOT_LEVELS } from '../../src/domain/x01Bot/x01Bot';
import { buildTeamStarterOptions, canEnableBotOpponent, getBotLevelLabel, getSetupPlayerCountOptions, supportsDoublesMode } from '../../src/features/game-setup/setupViewModel';
import { PlayerNameField } from './PlayerNameField';
import { setupActiveOptionClass, setupInactiveOptionClass, setupLabelClass, setupSectionClass } from './setupViewStyles';

interface SetupPlayersSectionProps {
  gameType: GameType;
  isDoubles: boolean;
  playerNames: string[];
  team1Names: string[];
  team2Names: string[];
  teamStarterIds: Record<string, string>;
  playAgainstBot: boolean;
  botLevel: X01BotLevel;
  onSetDoubles: (value: boolean) => void;
  onSetPlayerCount: (count: number) => void;
  onUpdatePlayerName: (index: number, name: string) => void;
  onUpdateTeamName: (team: 1 | 2, index: number, name: string) => void;
  onUpdateTeamStarter: (teamId: 'team1' | 'team2', playerId: string) => void;
  onToggleBot: (value: boolean) => void;
  onSetBotLevel: (value: X01BotLevel) => void;
}

export const SetupPlayersSection: React.FC<SetupPlayersSectionProps> = ({
  gameType,
  isDoubles,
  playerNames,
  team1Names,
  team2Names,
  teamStarterIds,
  playAgainstBot,
  botLevel,
  onSetDoubles,
  onSetPlayerCount,
  onUpdatePlayerName,
  onUpdateTeamName,
  onUpdateTeamStarter,
  onToggleBot,
  onSetBotLevel,
}) => {
  const canPlayAgainstBot = canEnableBotOpponent(gameType, isDoubles);
  const playerCountOptions = getSetupPlayerCountOptions(gameType);
  const team1StarterOptions = buildTeamStarterOptions('team1', team1Names);
  const team2StarterOptions = buildTeamStarterOptions('team2', team2Names);

  return (
    <section className={setupSectionClass}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className={`${setupLabelClass} mb-0`}>Joueurs</label>
        {supportsDoublesMode(gameType) && (
          <div className="inline-flex rounded-2xl border border-white/10 bg-black/20 p-1">
            <button
              type="button"
              onClick={() => onSetDoubles(false)}
              className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all ${!isDoubles ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
            >
              <Users className="mr-2 inline h-4 w-4" />
              Simple
            </button>
            <button
              type="button"
              onClick={() => onSetDoubles(true)}
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
          <div className="mb-5 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Nombre De Joueurs</div>
            <div className="grid grid-cols-4 gap-2">
              {playerCountOptions.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => onSetPlayerCount(count)}
                  className={`rounded-xl border py-2 text-sm font-black transition-all ${playerNames.length === count ? setupActiveOptionClass : setupInactiveOptionClass}`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {(!playAgainstBot ? playerNames : playerNames.slice(0, 1)).map((name, index) => (
              <PlayerNameField
                key={index}
                label={`Joueur ${index + 1}`}
                value={name}
                placeholder={`Joueur ${index + 1}`}
                onChange={(value) => onUpdatePlayerName(index, value)}
              />
            ))}
            {canPlayAgainstBot && playAgainstBot && (
              <div className="rounded-2xl border border-orange-500/25 bg-orange-500/[0.06] px-4 py-3">
                <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">
                  <Bot className="h-4 w-4" />
                  Adversaire robot
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-lg font-black text-white">
                  Robot {getBotLevelLabel(X01_BOT_LEVELS, botLevel)}
                </div>
              </div>
            )}
          </div>

          {canPlayAgainstBot && (
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={playAgainstBot}
                  onChange={(event) => onToggleBot(event.target.checked)}
                  className="h-5 w-5 rounded border-white/20 bg-white/10 accent-orange-600"
                />
                <span className="text-sm font-black uppercase tracking-[0.16em] text-white">
                  Jouer contre un robot
                </span>
              </label>

              {playAgainstBot && (
                <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                  {X01_BOT_LEVELS.map((definition) => (
                    <label
                      key={definition.level}
                      className={`cursor-pointer rounded-xl border px-3 py-3 transition-all ${
                        botLevel === definition.level ? setupActiveOptionClass : setupInactiveOptionClass
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={botLevel === definition.level}
                        onChange={() => onSetBotLevel(definition.level)}
                        className="sr-only"
                      />
                      <span className="block text-xs font-black uppercase tracking-[0.16em]">
                        {definition.label}
                      </span>
                      <span className="mt-1 block text-[10px] font-bold uppercase leading-tight text-current opacity-75">
                        {formatX01BotAverageRange(definition)}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
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
                onChange={(value) => onUpdateTeamName(1, 0, value)}
                compact
              />
              <PlayerNameField
                label="Joueur 2"
                value={team1Names[1]}
                placeholder="Joueur 2"
                onChange={(value) => onUpdateTeamName(1, 1, value)}
                compact
              />
            </div>
            <div className="mt-4">
              <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Qui commence dans ce duo ?</div>
              <div className="grid grid-cols-2 gap-2">
                {team1StarterOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onUpdateTeamStarter('team1', option.id)}
                    className={`rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-[0.12em] ${teamStarterIds.team1 === option.id ? setupActiveOptionClass : setupInactiveOptionClass}`}
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
                onChange={(value) => onUpdateTeamName(2, 0, value)}
                compact
              />
              <PlayerNameField
                label="Joueur 4"
                value={team2Names[1]}
                placeholder="Joueur 4"
                onChange={(value) => onUpdateTeamName(2, 1, value)}
                compact
              />
            </div>
            <div className="mt-4">
              <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Qui commence dans ce duo ?</div>
              <div className="grid grid-cols-2 gap-2">
                {team2StarterOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onUpdateTeamStarter('team2', option.id)}
                    className={`rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-[0.12em] ${teamStarterIds.team2 === option.id ? setupActiveOptionClass : setupInactiveOptionClass}`}
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
  );
};