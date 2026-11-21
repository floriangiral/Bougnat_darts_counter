import React from 'react';
import { Bot, Swords, Users } from 'lucide-react';

import type { GameType } from '../../utils/arenaFlow';
import type { X01BotLevel } from '../../types';
import { formatX01BotAverageRange, X01_BOT_LEVELS } from '../../src/domain/x01Bot/x01Bot';
import {
  buildTeamStarterOptions,
  canEnableBotOpponent,
  getBotLevelLabel,
  getBotPlayerCountBlockReason,
  getSetupPlayerCountOptions,
  supportsDoublesMode,
} from '../../src/features/game-setup/setupViewModel';
import { PlayerNameField } from './PlayerNameField';
import { setupActiveOptionClass, setupInactiveOptionClass, setupKickerClass, setupLabelClass, setupSectionClass } from './setupViewStyles';

const PLAYER_SLOT_KEYS = ['player-slot-1', 'player-slot-2', 'player-slot-3', 'player-slot-4', 'player-slot-5', 'player-slot-6'];

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
  /** Spec 030: players imposed by an external match link (names, count, mode and bot locked) */
  isCompositionLocked?: boolean;
  /** Spec 046: why the bot opponent cannot be enabled (Double/Master opening), or null */
  botBlockReason?: string | null;
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
  isCompositionLocked = false,
  botBlockReason = null,
}) => {
  const canPlayAgainstBot = !isCompositionLocked && canEnableBotOpponent(gameType, isDoubles);
  const playerCountOptions = getSetupPlayerCountOptions(gameType);
  const botPlayerCountReason = playAgainstBot ? null : getBotPlayerCountBlockReason(gameType, playerNames.length);
  const isBotToggleDisabled = Boolean(botBlockReason || botPlayerCountReason);
  const team1StarterOptions = buildTeamStarterOptions('team1', team1Names);
  const team2StarterOptions = buildTeamStarterOptions('team2', team2Names);

  return (
    <section className={setupSectionClass}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className={`${setupLabelClass} mb-0`}>Joueurs</h2>
        {supportsDoublesMode(gameType) && (
          <div className="setup-segmented inline-flex rounded-2xl border border-border-subtle bg-surface-inset p-1">
            <button
              type="button"
              onClick={() => onSetDoubles(false)}
              disabled={isCompositionLocked}
              className={`setup-segment rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all disabled:cursor-not-allowed ${!isDoubles ? 'bg-surface-tint-strong text-fg' : 'text-fg-faint hover:text-fg'}`}
            >
              <Users className="mr-2 inline h-4 w-4" />
              Simple
            </button>
            <button
              type="button"
              onClick={() => onSetDoubles(true)}
              disabled={isCompositionLocked}
              className={`setup-segment rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all disabled:cursor-not-allowed ${isDoubles ? 'bg-surface-tint-strong text-fg' : 'text-fg-faint hover:text-fg'}`}
            >
              <Swords className="mr-2 inline h-4 w-4" />
              Doublettes
            </button>
          </div>
        )}
      </div>

      {!isDoubles ? (
        <>
          <div className="mb-5 rounded-2xl border border-border-subtle bg-surface-inset p-4">
            <div className={setupKickerClass}>Nombre de joueurs</div>
            <fieldset data-testid="setup-player-count" aria-label="Nombre de joueurs" className="grid min-w-auto grid-cols-4 gap-2">
              {playerCountOptions.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => onSetPlayerCount(count)}
                  disabled={isCompositionLocked}
                  aria-pressed={playerNames.length === count}
                  data-state={playerNames.length === count ? 'selected' : 'idle'}
                  className={`rounded-xl border py-2 text-sm font-black transition-all disabled:cursor-not-allowed ${playerNames.length === count ? setupActiveOptionClass : setupInactiveOptionClass}`}
                >
                  {count}
                </button>
              ))}
            </fieldset>
          </div>

          <div className="setup-player-names space-y-3">
            {(!playAgainstBot ? playerNames : playerNames.slice(0, 1)).map((name, index) => (
              <PlayerNameField
                key={PLAYER_SLOT_KEYS[index]}
                label={`Joueur ${index + 1}`}
                value={name}
                placeholder={`Joueur ${index + 1}`}
                onChange={(value) => onUpdatePlayerName(index, value)}
                disabled={isCompositionLocked}
              />
            ))}
            {canPlayAgainstBot && playAgainstBot && (
              <div className="setup-name-field rounded-2xl border border-brand-border bg-brand-subtle px-4 py-3">
                <div className="setup-kicker mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-brand-fg-faint">
                  <Bot className="h-4 w-4" />
                  Adversaire robot
                </div>
                <div className="setup-name-box setup-name-text rounded-xl border border-border-subtle bg-surface-inset px-3 py-2 text-lg font-black text-fg">
                  Robot {getBotLevelLabel(X01_BOT_LEVELS, botLevel)}
                </div>
              </div>
            )}
          </div>

          {canPlayAgainstBot && (
            <div className="mt-5 rounded-2xl border border-border-subtle bg-surface-inset p-4">
              <label className={`setup-check flex items-center gap-3 ${isBotToggleDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  checked={playAgainstBot}
                  disabled={isBotToggleDisabled}
                  onChange={(event) => onToggleBot(event.target.checked)}
                  className="h-5 w-5 rounded border-border bg-surface-tint-strong accent-brand"
                />
                <span className="setup-check-label text-sm font-black uppercase tracking-[0.16em] text-fg">
                  Jouer contre un robot
                </span>
              </label>
              {botBlockReason && (
                <p data-testid="setup-bot-block-reason" className="setup-help mt-3 text-sm text-warning-fg">{botBlockReason}</p>
              )}
              {botPlayerCountReason && (
                <p data-testid="setup-bot-player-count-reason" className="setup-help mt-3 text-sm text-warning-fg">{botPlayerCountReason}</p>
              )}

              {playAgainstBot && (
                <div className="setup-bot-levels mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                  {X01_BOT_LEVELS.map((definition) => (
                    <label
                      key={definition.level}
                      className={`setup-bot-level cursor-pointer rounded-xl border px-3 py-3 transition-all ${
                        botLevel === definition.level ? setupActiveOptionClass : setupInactiveOptionClass
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={botLevel === definition.level}
                        onChange={() => onSetBotLevel(definition.level)}
                        className="sr-only"
                      />
                      <span className="setup-bot-level-name block text-xs font-black uppercase tracking-[0.16em]">
                        {definition.label}
                      </span>
                      <span className="setup-bot-level-meta mt-1 block text-[10px] font-bold uppercase leading-tight text-current opacity-75">
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
        <div className="setup-teams grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border-subtle bg-surface-inset p-4">
            <div className="setup-kicker mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-brand-fg-faint">Joueurs 1 / 2</div>
            <div className="setup-team-names space-y-3">
              <PlayerNameField
                label="Joueur 1"
                value={team1Names[0]}
                placeholder="Joueur 1"
                onChange={(value) => onUpdateTeamName(1, 0, value)}
                compact
                disabled={isCompositionLocked}
              />
              <PlayerNameField
                label="Joueur 2"
                value={team1Names[1]}
                placeholder="Joueur 2"
                onChange={(value) => onUpdateTeamName(1, 1, value)}
                compact
                disabled={isCompositionLocked}
              />
            </div>
            <div className="mt-4">
              <div className={setupKickerClass}>Qui commence dans ce duo ?</div>
              <div className="grid grid-cols-2 gap-2">
                {team1StarterOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onUpdateTeamStarter('team1', option.id)}
                    className={`setup-option-text rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-[0.12em] ${teamStarterIds.team1 === option.id ? setupActiveOptionClass : setupInactiveOptionClass}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border-subtle bg-surface-inset p-4">
            <div className="setup-kicker mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-brand-fg-faint">Joueurs 3 / 4</div>
            <div className="setup-team-names space-y-3">
              <PlayerNameField
                label="Joueur 3"
                value={team2Names[0]}
                placeholder="Joueur 3"
                onChange={(value) => onUpdateTeamName(2, 0, value)}
                compact
                disabled={isCompositionLocked}
              />
              <PlayerNameField
                label="Joueur 4"
                value={team2Names[1]}
                placeholder="Joueur 4"
                onChange={(value) => onUpdateTeamName(2, 1, value)}
                compact
                disabled={isCompositionLocked}
              />
            </div>
            <div className="mt-4">
              <div className={setupKickerClass}>Qui commence dans ce duo ?</div>
              <div className="grid grid-cols-2 gap-2">
                {team2StarterOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onUpdateTeamStarter('team2', option.id)}
                    className={`setup-option-text rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-[0.12em] ${teamStarterIds.team2 === option.id ? setupActiveOptionClass : setupInactiveOptionClass}`}
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