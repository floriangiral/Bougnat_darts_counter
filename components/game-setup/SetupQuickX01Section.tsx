import React from 'react';

import type { InOutRule } from '../../types';
import { SetupLaunchButton } from './SetupLaunchButton';
import { setupLabelClass, setupSectionClass } from './setupViewStyles';

const SECOND_PLAYER_INPUT_ID = 'setup-quick-player-2';

// Ouverture et fermeture en mots simples, pour qu'un débutant sache ce qu'il va jouer.
const RULE_TEXT: Record<InOutRule, string> = { Open: 'libre', Double: 'sur un double', Master: 'double ou triple' };

const playerInputClass = 'setup-quick-player-input setup-name-text h-12 w-full min-w-0 rounded-xl border border-border-subtle bg-surface-inset px-3 text-base font-black text-fg placeholder:text-fg-disabled focus:border-brand-border';

interface SetupQuickX01SectionProps {
  playerNames: string[];
  startingScore: number;
  legsToWin: number;
  checkIn: InOutRule;
  checkOut: InOutRule;
  onUpdatePlayerName: (index: number, name: string) => void;
  onOpenAdvanced: () => void;
  onOpenRules: () => void;
  onStart: () => void;
}

/** Mode Rapide X01 : la partie proposée en évidence, les deux prénoms, puis le lancement. */
export const SetupQuickX01Section: React.FC<SetupQuickX01SectionProps> = ({
  playerNames,
  startingScore,
  legsToWin,
  checkIn,
  checkOut,
  onUpdatePlayerName,
  onOpenAdvanced,
  onOpenRules,
  onStart,
}) => (
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
      <p className="setup-quick-match-meta mt-2 text-base font-bold text-fg">
        Premier à {legsToWin} manches · 1 contre 1
      </p>
      <p className="setup-quick-match-rules mt-1 text-sm font-bold text-fg-muted">
        Départ {RULE_TEXT[checkIn]} · Fin {RULE_TEXT[checkOut]}
      </p>

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
      <div className="setup-player-names flex flex-col gap-1">
        <input
          type="text"
          aria-label="Joueur 1"
          placeholder="Joueur 1"
          value={playerNames[0] ?? ''}
          onChange={(event) => onUpdatePlayerName(0, event.target.value)}
          onFocus={(event) => event.target.select()}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            document.getElementById(SECOND_PLAYER_INPUT_ID)?.focus();
          }}
          enterKeyHint="next"
          className={playerInputClass}
        />
        <span aria-hidden="true" className="setup-quick-versus text-center text-[10px] font-black uppercase tracking-[0.3em] text-fg-faint">contre</span>
        <input
          id={SECOND_PLAYER_INPUT_ID}
          type="text"
          aria-label="Joueur 2"
          placeholder="Joueur 2"
          value={playerNames[1] ?? ''}
          onChange={(event) => onUpdatePlayerName(1, event.target.value)}
          onFocus={(event) => event.target.select()}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            onStart();
          }}
          enterKeyHint="go"
          className={playerInputClass}
        />
      </div>
    </section>

    <div className="setup-launch-slot mt-auto lg:mt-0">
      <SetupLaunchButton onStart={onStart} />
    </div>
  </div>
);
