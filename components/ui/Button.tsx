import React from 'react';
import { KEYPAD_TONES, type ButtonSize, type ButtonVariant, type KeypadTone } from './buttonStyles';

export type { ButtonSize, ButtonVariant, KeypadTone } from './buttonStyles';

// Spec 064 (V2-DS-02) : point d'entrée unique des boutons, construit sur les tokens (spec 063).
// Focus visible par :focus-visible (jamais retiré), états homogènes, plancher tactile porté par
// la classe bd-touch-target (44 px téléphone, 48 px tablette, voir tailwind.css).

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Couleur métier d'une touche de pavé (spec 066), seulement pour variant="keypad". */
  tone?: KeypadTone;
  size?: ButtonSize;
}

const BASE = 'bd-touch-target font-black rounded flex items-center justify-center uppercase tracking-wide text-center leading-tight transition-[color,background-color,border-color,box-shadow,transform] duration-200 disabled:cursor-not-allowed disabled:opacity-60';

const VARIANTS: Record<Exclude<ButtonVariant, 'keypad'>, string> = {
  primary: 'border border-transparent bg-gradient-to-r from-brand-strong to-brand-2 text-on-brand shadow-brand hover:from-brand hover:to-danger',
  secondary: 'border border-border-strong bg-surface-raised text-fg-soft shadow-sm hover:border-fg-faint hover:bg-surface-strong',
  danger: 'border border-danger-border bg-danger-subtle text-danger-fg-soft hover:bg-danger-strong hover:text-on-danger',
  ghost: 'bg-transparent text-fg-subtle hover:bg-surface-tint hover:text-fg',
  success: 'border border-success-border bg-success-subtle text-success-fg hover:bg-success hover:text-on-success',
};


const SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-10 px-3 py-2 text-xs',
  md: 'min-h-12 px-5 py-3 text-sm sm:px-6',
  lg: 'min-h-14 px-6 py-4 text-base sm:px-8 sm:text-xl',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  tone = 'neutral',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}) => {
  const variantClass = variant === 'keypad' ? KEYPAD_TONES[tone] : VARIANTS[variant];
  return (
    <button
      type={type}
      data-variant={variant}
      data-tone={variant === 'keypad' ? tone : undefined}
      className={`${BASE} ${variantClass} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  /** Libellé accessible obligatoire (spec 064 FR-06). */
  label: string;
  tone?: 'neutral' | 'danger';
}

/** Bouton d'icône carré au plancher tactile (en-têtes de jeu : statistiques, réglages, quitter). */
export const IconButton: React.FC<IconButtonProps> = ({
  label,
  tone = 'neutral',
  className = '',
  type = 'button',
  children,
  ...props
}) => (
  <button
    type={type}
    aria-label={label}
    title={label}
    data-tone={tone}
    className={`bd-touch-target bd-icon-button inline-flex shrink-0 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
      tone === 'danger'
        ? 'border-danger-border bg-danger-subtle text-danger-fg hover:bg-danger-strong hover:text-on-danger'
        : 'border-border-strong bg-surface-raised text-fg-subtle hover:bg-surface-strong hover:text-fg'
    } ${className}`}
    {...props}
  >
    {children}
  </button>
);
