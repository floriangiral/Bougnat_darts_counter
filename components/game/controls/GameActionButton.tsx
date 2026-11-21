import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Button, IconButton, type ButtonVariant } from '../../ui/Button';
import { GAME_ACTIONS, type GameAction } from './gameActions';

export interface GameActionButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  action: GameAction;
  /** `full` : libellé + icône (rangées d'actions, pavés) ; `icon` : bouton carré d'en-tête. */
  display?: 'full' | 'icon';
  /** Libellé visible propre au jeu (« OK » en X01, « 3 MISS » en Cricket…), nom accessible compris. */
  label?: string;
  /** Icône de remplacement ; `null` la retire (touche courte comme « C »). */
  icon?: LucideIcon | null;
  /** Rôle de couleur de remplacement, réservé aux cas documentés dans docs/design-system.md. */
  appearance?: Exclude<ButtonVariant, 'ghost'>;
}

/**
 * Commande de jeu standard : même libellé, même icône, même rôle de couleur dans tous les jeux.
 * Les tailles (planchers 44/48/64 px) sont portées par src/styles/layout/game-controls.css.
 */
export const GameActionButton: React.FC<GameActionButtonProps> = ({
  action,
  display = 'full',
  label,
  icon,
  appearance,
  title,
  className = '',
  children,
  ...props
}) => {
  const spec = GAME_ACTIONS[action];
  const text = label ?? spec.label;
  const Icon = icon === undefined ? spec.icon : icon;

  if (display === 'icon') {
    const HeaderIcon = Icon ?? spec.icon;
    return (
      <IconButton
        label={text}
        tone={spec.iconTone}
        data-action={action}
        className={`bd-game-action bd-game-action--icon ${className}`}
        {...props}
      >
        {HeaderIcon && <HeaderIcon aria-hidden="true" className="bd-game-action-icon" />}
      </IconButton>
    );
  }

  const variant = appearance ?? spec.variant;
  return (
    <Button
      variant={variant}
      tone={variant === 'keypad' ? spec.tone : undefined}
      title={title ?? spec.title}
      data-action={action}
      className={`bd-game-action gap-2 px-2 py-1 ${className}`}
      {...props}
    >
      {Icon && <Icon aria-hidden="true" className="bd-game-action-icon shrink-0" />}
      <span className="bd-game-action-label">{text}</span>
      {children}
    </Button>
  );
};
