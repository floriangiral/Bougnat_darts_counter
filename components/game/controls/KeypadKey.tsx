import React from 'react';
import type { KeypadTone } from '../../ui/buttonStyles';
import { getKeypadKeyClass, getMultiplierModeClass, type KeypadMultiplier } from '../multiplierStyles';

export type KeypadKeySize = 'digit' | 'target' | 'label';

export interface KeypadKeyProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Ton métier (spec 066) : simple neutre, double cyan, triple orange, Bull vert, D-Bull rouge. */
  tone?: KeypadTone;
  /** Multiplicateur porté par la touche (data-multiplier). */
  multiplier?: KeypadMultiplier;
  /** Identifiant stable de la touche (data-key), indépendant du libellé. */
  keyId?: string;
  /** Touche bascule (sélecteur SIMPLE / DOUBLE / TRIPLE) : aria-pressed + data-state selected|idle. */
  selected?: boolean;
  /** État métier explicite (finish, taken, own…) ; prioritaire sur l'état de sélection. */
  state?: string;
  /** Typographie commune : chiffre (pavé numérique), cible (20, D16…), libellé (BULL (25), MISS…). */
  size?: KeypadKeySize;
  /** Nombre de colonnes / rangées occupées dans KeypadGrid. */
  span?: number;
  rowSpan?: number;
}

const getDataState = (state: string | undefined, selected: boolean | undefined): string | undefined => {
  if (state !== undefined) return state;
  if (selected === undefined) return undefined;
  return selected ? 'selected' : 'idle';
};

const getGridPlacement = (span?: number, rowSpan?: number): React.CSSProperties => ({
  ...(span && span > 1 ? { gridColumn: `span ${span} / span ${span}` } : {}),
  ...(rowSpan && rowSpan > 1 ? { gridRow: `span ${rowSpan} / span ${rowSpan}` } : {}),
});

/**
 * Touche de pavé commune à tous les jeux : rayons, typographie, états pressé / désactivé / sélectionné et
 * planchers tactiles identiques ; les tailles suivent la recette d'affichage (game-controls.css).
 * Les comportements propres au jeu (appui long X01, pointerdown immédiat…) passent par les props natives.
 */
export const KeypadKey: React.FC<KeypadKeyProps> = ({
  tone = 'neutral',
  multiplier,
  keyId,
  selected,
  state,
  size = 'target',
  span,
  rowSpan,
  className = '',
  style,
  type = 'button',
  children,
  ...props
}) => {
  const extra = `bd-key ${className}`;
  const classes = selected !== undefined && multiplier !== undefined
    ? getMultiplierModeClass(multiplier, selected, extra)
    : getKeypadKeyClass(tone, extra);
  return (
    <button
      type={type}
      data-variant="keypad"
      data-tone={tone}
      data-multiplier={multiplier === undefined ? undefined : String(multiplier)}
      data-key={keyId}
      data-state={getDataState(state, selected)}
      data-size={size}
      aria-pressed={selected}
      className={classes}
      style={{ ...getGridPlacement(span, rowSpan), ...style }}
      {...props}
    >
      {children}
    </button>
  );
};
