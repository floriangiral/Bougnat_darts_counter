// Spec 064 / 066 : variantes et tons métier des boutons, partagés par Button et les pavés de jeu.

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'keypad' | 'success' | 'rematch' | 'challenge';
export type KeypadTone = 'neutral' | 'double' | 'triple' | 'bull' | 'dbull' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export const KEYPAD_TONES: Record<KeypadTone, string> = {
  neutral: 'border border-border-subtle bg-surface-raised text-fg hover:border-border-strong hover:bg-surface-strong',
  double: 'border border-game-double/40 bg-surface-raised text-game-double-fg hover:bg-game-double-subtle',
  triple: 'border border-game-triple/40 bg-surface-raised text-game-triple-fg hover:bg-game-triple-subtle',
  bull: 'border border-game-bull/50 bg-game-bull text-on-game hover:brightness-110',
  dbull: 'border border-game-dbull/50 bg-game-dbull text-on-game hover:brightness-110',
  danger: 'border border-danger-border bg-danger-subtle text-danger-fg hover:bg-danger-strong hover:text-on-danger',
  success: 'border border-success-border bg-success text-on-success hover:brightness-110',
};
