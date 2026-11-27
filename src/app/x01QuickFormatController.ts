import type { X01QuickFormat } from '../features/game-setup/x01QuickFormat';
import { readX01QuickFormat, writeX01QuickFormat } from '../infrastructure/local/x01QuickFormatStore';

// Spec 133 : unique point d'accès à la dernière partie X01 mémorisée de la partie rapide.

export const loadX01QuickFormat = (): X01QuickFormat | null => readX01QuickFormat();

/** RM-01 : chaque partie lancée, standard compris, est mémorisée avec ses prénoms. */
export const rememberX01QuickFormat = (format: X01QuickFormat): void => writeX01QuickFormat(format);
