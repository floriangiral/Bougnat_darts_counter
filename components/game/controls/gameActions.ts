// Commandes de jeu unifiées (demande PO du 2026-11-20) : une action = un libellé, une icône et un rôle
// de couleur, identiques dans tous les jeux et toutes les recettes d'affichage. Aucune règle de jeu ici.
import { BarChart3, Check, LogOut, Settings, SkipForward, Undo2, type LucideIcon } from 'lucide-react';
import type { ButtonVariant, KeypadTone } from '../../ui/buttonStyles';

// Pas d'action « clear » : sur les pavés numériques, l'effacement de la saisie est fusionné dans « Annuler »
// (voir undoIntent.ts et GameUndoButton).
export type GameAction = 'exit' | 'undo' | 'validate' | 'pass' | 'miss' | 'stats' | 'settings';

export interface GameActionSpec {
  /** Libellé visible et nom accessible par défaut. */
  label: string;
  /** Infobulle (précise l'effet quand le libellé est court). */
  title?: string;
  icon: LucideIcon | null;
  /** Rôle de couleur d'une commande pleine (rangée d'actions, pavé). */
  variant: Exclude<ButtonVariant, 'ghost'>;
  /** Ton métier quand variant = keypad. */
  tone?: KeypadTone;
  /** Ton de l'icône d'en-tête. */
  iconTone: 'neutral' | 'danger';
}

export const GAME_ACTIONS: Record<GameAction, GameActionSpec> = {
  exit: { label: 'Quitter', icon: LogOut, variant: 'danger', iconTone: 'danger' },
  undo: { label: 'Annuler', title: 'Annuler la dernière saisie', icon: Undo2, variant: 'secondary', iconTone: 'neutral' },
  validate: { label: 'Valider', icon: Check, variant: 'primary', iconTone: 'neutral' },
  pass: { label: 'Passer', title: 'Passer les fléchettes restantes', icon: SkipForward, variant: 'primary', iconTone: 'neutral' },
  miss: { label: 'MISS', title: 'Fléchette hors cible', icon: null, variant: 'keypad', tone: 'danger', iconTone: 'danger' },
  stats: { label: 'Statistiques', icon: BarChart3, variant: 'secondary', iconTone: 'neutral' },
  settings: { label: 'Réglages', icon: Settings, variant: 'secondary', iconTone: 'neutral' },
};

/** Libellés du dialogue unique de sortie (même texte dans tous les jeux). */
export const EXIT_DIALOG_COPY = {
  title: 'Quitter la partie ?',
  description: 'La partie en cours sera abandonnée.',
  cancel: 'Non',
  confirm: 'Oui',
} as const;
