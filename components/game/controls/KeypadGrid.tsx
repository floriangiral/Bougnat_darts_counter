import React from 'react';

type DivProps = React.HTMLAttributes<HTMLDivElement> & Record<`data-${string}`, unknown>;

type CssVars = React.CSSProperties & Record<`--${string}`, string | number>;

export interface KeypadPanelProps extends DivProps {
  children: React.ReactNode;
}

/**
 * Surface du clavier : remplit la zone input de GameScreenLayout (colonne : affichage éventuel, grille,
 * rangée d'actions), mêmes marges et mêmes espacements dans tous les jeux.
 */
export const KeypadPanel: React.FC<KeypadPanelProps> = ({ className = '', children, ...props }) => (
  <div className={`bd-keypad flex h-full min-h-0 flex-col ${className}`} {...props}>
    {children}
  </div>
);

export interface KeypadGridProps extends DivProps {
  /** Nombre de colonnes, ou `auto` : autant que le plancher tactile le permet, au plus maxColumns. */
  columns: number | 'auto';
  maxColumns?: number;
  /** Rangées de hauteur égale ; sinon rangées automatiques au plancher de touche. */
  rows?: number;
  /** Nom du groupe (role="group"), ex. « Numéro touché ». */
  label?: string;
  /** Remplit la hauteur restante du KeypadPanel (par défaut). */
  fill?: boolean;
  children: React.ReactNode;
}

export const KeypadGrid: React.FC<KeypadGridProps> = ({
  columns,
  maxColumns,
  rows,
  label,
  fill = true,
  className = '',
  style,
  children,
  ...props
}) => {
  const vars: CssVars = {};
  if (columns !== 'auto') vars['--bd-keypad-cols'] = columns;
  if (maxColumns !== undefined) vars['--bd-keypad-max-cols'] = maxColumns;
  if (rows !== undefined) vars['--bd-keypad-rows'] = rows;
  return (
    <div
      role={label ? 'group' : undefined}
      aria-label={label}
      data-columns={columns}
      data-rows={rows}
      data-fill={fill ? 'true' : 'false'}
      className={`bd-keypad-grid ${className}`}
      style={{ ...vars, ...style }}
      {...props}
    >
      {children}
    </div>
  );
};

export interface KeypadActionRowProps extends DivProps {
  /** Commande d'annulation, toujours en première position (à gauche). */
  undo?: React.ReactNode;
  /** Commande qui termine le tour (Valider, OK, Passer…), toujours en dernière position (à droite). */
  validate?: React.ReactNode;
  /** Commandes intermédiaires propres au jeu (BULL (25), MISS, 3 MISS…). */
  children?: React.ReactNode;
  /** Gabarit explicite (nombre de colonnes) quand une commande occupe plusieurs colonnes. */
  columns?: number;
  label?: string;
}

/** Rangée d'actions du bas du clavier : Annuler à gauche, Valider à droite, adjacents en tablette. */
export const KeypadActionRow: React.FC<KeypadActionRowProps> = ({
  undo,
  validate,
  children,
  columns,
  label = 'Actions du tour',
  className = '',
  style,
  ...props
}) => {
  const vars: CssVars = columns === undefined ? {} : { '--bd-action-cols': columns };
  return (
    <div
      role="group"
      aria-label={label}
      data-columns={columns}
      className={`bd-keypad-action-row ${className}`}
      style={{ ...vars, ...style }}
      {...props}
    >
      {undo}
      {children}
      {validate}
    </div>
  );
};
