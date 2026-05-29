import React, { useEffect, useState } from 'react';
import { Bot, Swords, Users } from 'lucide-react';

import type { GameType } from '../../utils/arenaFlow';
import type { PlayerAccountLinkSelection, X01BotLevel } from '../../types';
import type { PlayerAccountSearchResult } from '../../src/features/player-account/playerAccountTypes';
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
  accountSearchEnabled?: boolean;
  playerAccountLinks?: PlayerAccountLinkSelection[];
  team1AccountLinks?: PlayerAccountLinkSelection[];
  team2AccountLinks?: PlayerAccountLinkSelection[];
  selectedAccountIds?: string[];
  onUpdatePlayerAccountLink?: (index: number, link: PlayerAccountLinkSelection) => void;
  onUpdateTeamAccountLink?: (team: 1 | 2, index: number, link: PlayerAccountLinkSelection) => void;
  onSearchPlayerAccounts?: (query: string) => Promise<PlayerAccountSearchResult[]>;
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
  accountSearchEnabled = false,
  playerAccountLinks = [],
  team1AccountLinks = [],
  team2AccountLinks = [],
  selectedAccountIds = [],
  onSetDoubles,
  onSetPlayerCount,
  onUpdatePlayerName,
  onUpdateTeamName,
  onUpdateTeamStarter,
  onToggleBot,
  onSetBotLevel,
  onUpdatePlayerAccountLink,
  onUpdateTeamAccountLink,
  onSearchPlayerAccounts,
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
              onClick={() => onSetDoubles(false)}
              className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all ${!isDoubles ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
            >
              <Users className="mr-2 inline h-4 w-4" />
              Simple
            </button>
            <button
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
              <div key={index} className="space-y-2">
                <PlayerNameField
                  label={`Joueur ${index + 1}`}
                  value={name}
                  placeholder={`Joueur ${index + 1}`}
                  onChange={(value) => onUpdatePlayerName(index, value)}
                />
                <PlayerAccountLinkField
                  enabled={accountSearchEnabled}
                  link={playerAccountLinks[index]}
                  selectedAccountIds={selectedAccountIds}
                  onChange={(link) => onUpdatePlayerAccountLink?.(index, link)}
                  onSearch={onSearchPlayerAccounts}
                />
              </div>
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
              <PlayerAccountLinkField enabled={accountSearchEnabled} link={team1AccountLinks[0]} selectedAccountIds={selectedAccountIds} onChange={(link) => onUpdateTeamAccountLink?.(1, 0, link)} onSearch={onSearchPlayerAccounts} compact />
              <PlayerNameField
                label="Joueur 2"
                value={team1Names[1]}
                placeholder="Joueur 2"
                onChange={(value) => onUpdateTeamName(1, 1, value)}
                compact
              />
              <PlayerAccountLinkField enabled={accountSearchEnabled} link={team1AccountLinks[1]} selectedAccountIds={selectedAccountIds} onChange={(link) => onUpdateTeamAccountLink?.(1, 1, link)} onSearch={onSearchPlayerAccounts} compact />
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
              <PlayerAccountLinkField enabled={accountSearchEnabled} link={team2AccountLinks[0]} selectedAccountIds={selectedAccountIds} onChange={(link) => onUpdateTeamAccountLink?.(2, 0, link)} onSearch={onSearchPlayerAccounts} compact />
              <PlayerNameField
                label="Joueur 4"
                value={team2Names[1]}
                placeholder="Joueur 4"
                onChange={(value) => onUpdateTeamName(2, 1, value)}
                compact
              />
              <PlayerAccountLinkField enabled={accountSearchEnabled} link={team2AccountLinks[1]} selectedAccountIds={selectedAccountIds} onChange={(link) => onUpdateTeamAccountLink?.(2, 1, link)} onSearch={onSearchPlayerAccounts} compact />
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

const emptyAccountLink: PlayerAccountLinkSelection = { enabled: false };

const PlayerAccountLinkField: React.FC<{
  enabled: boolean;
  compact?: boolean;
  link?: PlayerAccountLinkSelection;
  selectedAccountIds: string[];
  onChange?: (link: PlayerAccountLinkSelection) => void;
  onSearch?: (query: string) => Promise<PlayerAccountSearchResult[]>;
}> = ({ enabled, compact = false, link = emptyAccountLink, selectedAccountIds, onChange, onSearch }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlayerAccountSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLinked = Boolean(link.enabled);
  const selectedId = link.player_id;

  useEffect(() => {
    if (!isLinked || !enabled || !onSearch || query.trim().length < 4) {
      setResults([]);
      setIsSearching(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    setError(null);
    const timeout = window.setTimeout(() => {
      void onSearch(query)
        .then((items) => {
          if (cancelled) return;
          setResults(items);
        })
        .catch(() => {
          if (cancelled) return;
          setResults([]);
          setError('Recherche joueur indisponible.');
        })
        .finally(() => {
          if (!cancelled) setIsSearching(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [enabled, isLinked, onSearch, query]);

  const toggle = (checked: boolean) => {
    if (!checked) {
      setQuery('');
      setResults([]);
      onChange?.({ enabled: false });
      return;
    }
    onChange?.({ enabled: true });
  };

  const selectResult = (result: PlayerAccountSearchResult) => {
    onChange?.({
      enabled: true,
      player_id: result.player_id,
      display_name: result.display_name,
      nickname: result.nickname,
      public_slug: result.public_slug,
      club_name: result.club_name,
      avatar_url: result.avatar_url,
    });
    setQuery(result.display_name);
    setResults([]);
  };

  return (
    <div className={`rounded-2xl border border-white/10 bg-black/20 ${compact ? 'px-3 py-3' : 'px-4 py-3'}`}>
      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={isLinked}
          onChange={(event) => toggle(event.target.checked)}
          disabled={!enabled}
          className="h-4 w-4 rounded border-white/20 bg-white/10 accent-orange-600 disabled:opacity-40"
        />
        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-200">J'ai un compte joueur</span>
      </label>

      {!enabled && isLinked ? (
        <div className="mt-2 text-xs leading-5 text-orange-100">Connecte-toi pour rechercher un compte joueur.</div>
      ) : null}

      {isLinked ? (
        <div className="mt-3 space-y-2">
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (link.player_id) onChange?.({ enabled: true });
            }}
            placeholder="Pseudo, nom ou email"
            className="h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm font-semibold text-white outline-none placeholder:text-gray-600 focus:border-orange-300/45"
            disabled={!enabled}
          />
          {query.trim().length > 0 && query.trim().length < 4 ? (
            <div className="text-xs leading-5 text-gray-500">Saisis au moins 4 caracteres pour rechercher.</div>
          ) : null}
          {isSearching ? <div className="text-xs leading-5 text-gray-400">Recherche...</div> : null}
          {error ? <div className="text-xs leading-5 text-orange-100">{error}</div> : null}
          {selectedId ? (
            <div className="rounded-xl border border-emerald-300/20 bg-emerald-500/10 px-3 py-2 text-xs leading-5 text-emerald-100">
              Compte selectionne : <span className="font-black">{link.display_name}</span>
            </div>
          ) : null}
          {results.length ? (
            <div className="space-y-2">
              {results.map((result) => {
                const alreadySelected = selectedAccountIds.includes(result.player_id) && result.player_id !== selectedId;
                return (
                  <button
                    key={result.player_id}
                    type="button"
                    onClick={() => selectResult(result)}
                    disabled={alreadySelected}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-left transition-colors hover:border-orange-300/30 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="block text-sm font-black text-white">{result.display_name}</span>
                    <span className="block text-xs leading-5 text-gray-400">
                      {[result.nickname, result.club_name, alreadySelected ? 'Deja selectionne' : ''].filter(Boolean).join(' · ')}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
