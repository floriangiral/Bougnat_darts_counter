import React from 'react';
import { Bot } from 'lucide-react';

import type { InOutRule, MatchMode, X01BotLevel } from '../../types';
import { getX01BotDisplayName } from '../../src/features/game-setup/setupViewModel';
import { SetupLaunchButton } from './SetupLaunchButton';
import { setupLabelClass, setupSectionClass } from './setupViewStyles';

const PLAYER_INPUT_ID_PREFIX = 'setup-quick-player-';

// Ouverture et fermeture en mots simples, pour qu'un débutant sache ce qu'il va jouer.
const RULE_TEXT: Record<InOutRule, string> = { Open: 'libre', Double: 'sur un double', Master: 'double ou triple' };

const playerInputClass = 'setup-quick-player-input setup-name-text h-12 w-full min-w-0 rounded-xl border border-border-subtle bg-surface-inset px-3 text-base font-black text-fg placeholder:text-fg-disabled focus:border-brand-border';
const versusClass = 'setup-quick-versus text-center text-[10px] font-black uppercase tracking-[0.3em] text-fg-faint';
const teamTitleClass = 'text-[10px] font-black uppercase tracking-[0.24em] text-fg-subtle';

const plural = (count: number, singular: string, pluralForm: string) => `${count} ${count > 1 ? pluralForm : singular}`;

// Spec 133 RM-06 : la carte décrit le format réellement proposé (manches ou sets).
const describeMatchFormat = (matchMode: MatchMode, legsToWin: number, setsToWin: number) => (
  matchMode === 'SETS'
    ? `Premier à ${plural(setsToWin, 'set', 'sets')} de ${plural(legsToWin, 'manche', 'manches')}`
    : `Premier à ${plural(legsToWin, 'manche', 'manches')}`
);

// Spec 133 RM-06 : la composition mémorisée est annoncée avec le format.
const describeLineup = (isDoubles: boolean, playAgainstBot: boolean, playerCount: number, botLevel: X01BotLevel) => {
  if (isDoubles) return '2 contre 2';
  if (playAgainstBot) return `Contre le ${getX01BotDisplayName(botLevel).replace(/^Robot/, 'robot')}`;
  if (playerCount === 1) return 'Solo';
  if (playerCount === 2) return '1 contre 1';
  return `${playerCount} joueurs`;
};

interface NameSlot {
  key: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (name: string) => void;
}

interface SetupQuickX01SectionProps {
  playerNames: string[];
  team1Names: string[];
  team2Names: string[];
  isDoubles: boolean;
  playAgainstBot: boolean;
  botLevel: X01BotLevel;
  startingScore: number;
  matchMode: MatchMode;
  legsToWin: number;
  setsToWin: number;
  checkIn: InOutRule;
  checkOut: InOutRule;
  maxVisitsPerLeg: number | null;
  /** Spec 133 RM-08 : « Revenir au standard » n'apparaît que hors standard. */
  isStandardFormat: boolean;
  onResetStandard: () => void;
  onUpdatePlayerName: (index: number, name: string) => void;
  onUpdateTeamName: (team: 1 | 2, index: number, name: string) => void;
  onOpenAdvanced: () => void;
  onOpenRules: () => void;
  onStart: () => void;
}

const buildNameSlots = ({
  playerNames, team1Names, team2Names, isDoubles, playAgainstBot, onUpdatePlayerName, onUpdateTeamName,
}: Pick<SetupQuickX01SectionProps, 'playerNames' | 'team1Names' | 'team2Names' | 'isDoubles' | 'playAgainstBot' | 'onUpdatePlayerName' | 'onUpdateTeamName'>): NameSlot[] => {
  if (isDoubles) {
    // Mêmes numéros par défaut qu'au lancement : équipe 1 = joueurs 1 et 2, équipe 2 = joueurs 3 et 4.
    return ([[1, team1Names], [2, team2Names]] as const).flatMap(([team, names]) => names.slice(0, 2).map((value, index) => ({
      key: `team${team}-${index}`,
      label: `Équipe ${team}, joueur ${index + 1}`,
      placeholder: `Joueur ${(team - 1) * 2 + index + 1}`,
      value,
      onChange: (name: string) => onUpdateTeamName(team, index, name),
    })));
  }
  const names = playAgainstBot ? playerNames.slice(0, 1) : playerNames;
  return names.map((value, index) => ({
    key: `player-${index}`,
    label: `Joueur ${index + 1}`,
    placeholder: `Joueur ${index + 1}`,
    value,
    onChange: (name: string) => onUpdatePlayerName(index, name),
  }));
};

interface NameInputProps {
  slot: NameSlot;
  index: number;
  isLast: boolean;
  onStart: () => void;
}

const NameInput: React.FC<NameInputProps> = ({ slot, index, isLast, onStart }) => (
  <input
    id={`${PLAYER_INPUT_ID_PREFIX}${index + 1}`}
    type="text"
    aria-label={slot.label}
    placeholder={slot.placeholder}
    value={slot.value}
    onChange={(event) => slot.onChange(event.target.value)}
    onFocus={(event) => event.target.select()}
    onKeyDown={(event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      if (isLast) onStart();
      else document.getElementById(`${PLAYER_INPUT_ID_PREFIX}${index + 2}`)?.focus();
    }}
    enterKeyHint={isLast ? 'go' : 'next'}
    className={playerInputClass}
  />
);

/** Mode Rapide X01 : la partie proposée en évidence, les deux prénoms, puis le lancement. */
export const SetupQuickX01Section: React.FC<SetupQuickX01SectionProps> = ({
  playerNames,
  team1Names,
  team2Names,
  isDoubles,
  playAgainstBot,
  botLevel,
  startingScore,
  matchMode,
  legsToWin,
  setsToWin,
  checkIn,
  checkOut,
  maxVisitsPerLeg,
  isStandardFormat,
  onResetStandard,
  onUpdatePlayerName,
  onUpdateTeamName,
  onOpenAdvanced,
  onOpenRules,
  onStart,
}) => {
  const slots = buildNameSlots({ playerNames, team1Names, team2Names, isDoubles, playAgainstBot, onUpdatePlayerName, onUpdateTeamName });
  const input = (index: number) => (
    <NameInput key={slots[index].key} slot={slots[index]} index={index} isLast={index === slots.length - 1} onStart={onStart} />
  );
  // Une seule colonne en solo, à deux ou contre le robot ; deux colonnes à 3-4 joueurs et en doublettes
  // pour garder « Lancer la partie » visible : n° 1 en haut à gauche, n° 2 en haut à droite, etc.
  let names: React.ReactNode;
  if (isDoubles) {
    names = (
      <div data-testid="setup-quick-teams" className="grid grid-cols-2 gap-2">
        {[0, 1].map((team) => (
          <div key={team} className="flex min-w-0 flex-col gap-2">
            <span className={teamTitleClass}>Équipe {team + 1}</span>
            {input(team * 2)}
            {input(team * 2 + 1)}
          </div>
        ))}
      </div>
    );
  } else if (playAgainstBot) {
    names = (
      <div className="flex flex-col gap-1">
        {input(0)}
        <span aria-hidden="true" className={versusClass}>contre</span>
        <div data-testid="setup-quick-bot" className="setup-name-text flex h-12 items-center gap-2 rounded-xl border border-brand-border bg-brand-subtle px-3 text-base font-black text-fg">
          <Bot aria-hidden="true" className="h-4 w-4 shrink-0 text-brand-fg-faint" />
          {getX01BotDisplayName(botLevel)}
        </div>
      </div>
    );
  } else if (slots.length === 2) {
    names = (
      <div className="flex flex-col gap-1">
        {input(0)}
        <span aria-hidden="true" className={versusClass}>contre</span>
        {input(1)}
      </div>
    );
  } else {
    names = <div className={slots.length > 2 ? 'grid grid-cols-2 gap-2' : 'flex flex-col gap-1'}>{slots.map((_, index) => input(index))}</div>;
  }

  return (
    // Colonne centrée, lancement poussé en bas ; écran large : partie proposée à gauche, joueurs et lancement à droite.
    <div data-testid="setup-quick" className="setup-quick setup-column mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 lg:grid lg:max-w-5xl lg:flex-none lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:items-start lg:gap-5">
      <section
        data-testid="setup-quick-match"
        aria-labelledby="setup-quick-match-title"
        className={`${setupSectionClass} border-brand-border lg:row-span-2`}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="setup-quick-match-title" className={`${setupLabelClass} mb-0`}>Partie proposée</h2>
          <button
            type="button"
            onClick={onOpenRules}
            className="setup-quick-rule-button bd-touch-target text-[10px] font-black uppercase tracking-[0.24em] text-fg-subtle transition-colors hover:text-fg"
          >
            Règles
          </button>
        </div>

        <p className="flex items-baseline gap-3">
          <span className="setup-quick-score font-mono text-5xl font-black leading-none tracking-tight text-fg sm:text-7xl">{startingScore}</span>
          <span className="text-sm font-black uppercase tracking-[0.2em] text-brand-fg">X01</span>
        </p>
        <p data-testid="setup-quick-format" className="setup-quick-match-meta mt-2 text-base font-bold text-fg">
          {describeMatchFormat(matchMode, legsToWin, setsToWin)} · {describeLineup(isDoubles, playAgainstBot, playerNames.length, botLevel)}
        </p>
        <p className="setup-quick-match-rules mt-1 text-sm font-bold text-fg-muted">
          Départ {RULE_TEXT[checkIn]} · Fin {RULE_TEXT[checkOut]}
          {maxVisitsPerLeg !== null && ` · ${maxVisitsPerLeg} volées par manche`}
        </p>
        {!isStandardFormat && (
          <button
            type="button"
            data-testid="setup-quick-reset-standard"
            onClick={onResetStandard}
            className="setup-quick-reset-standard bd-touch-target mt-1 text-sm font-black text-brand-fg underline underline-offset-4 transition-colors hover:text-fg"
          >
            Revenir au standard
          </button>
        )}

        {/* Seule entrée vers les réglages complets, au plus près de ce qu'elle modifie. */}
        <button
          type="button"
          data-testid="setup-quick-customize"
          onClick={onOpenAdvanced}
          className="setup-quick-customize bd-touch-target mt-3 flex w-full items-center justify-between gap-3 border-t border-border-subtle pt-3 text-left"
        >
          <span>
            <span className="setup-quick-customize-title block text-sm font-black text-fg">Personnaliser la partie</span>
            <span className="setup-quick-customize-description block text-xs font-bold text-fg-muted">Score, manches, joueurs, robot, règles</span>
          </span>
          <span aria-hidden="true" className="text-xl font-black text-brand-fg">›</span>
        </button>
      </section>

      <section aria-labelledby="setup-quick-players-title" className={`setup-quick-players ${setupSectionClass}`}>
        <h2 id="setup-quick-players-title" className={setupLabelClass}>Qui joue ?</h2>
        <div className="setup-player-names">{names}</div>
      </section>

      <div className="setup-launch-slot mt-auto lg:mt-0">
        <SetupLaunchButton onStart={onStart} />
      </div>
    </div>
  );
};
