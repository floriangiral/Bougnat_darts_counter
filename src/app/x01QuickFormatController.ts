import { isStandardX01QuickFormat, type X01QuickFormat } from '../features/game-setup/x01QuickFormat';
import { clearX01QuickFormat, readX01QuickFormat, writeX01QuickFormat } from '../infrastructure/local/x01QuickFormatStore';

// Spec 133 : unique point d'accès au format mémorisé de la partie rapide X01.

export const loadX01QuickFormat = (): X01QuickFormat | null => readX01QuickFormat();

/** RM-01 : le standard n'a pas besoin d'être mémorisé ; l'enregistrer reviendrait à effacer le format. */
export const rememberX01QuickFormat = (format: X01QuickFormat): void => {
  if (isStandardX01QuickFormat(format)) {
    clearX01QuickFormat();
    return;
  }
  writeX01QuickFormat(format);
};

/** RM-08 : « Revenir au standard » oublie le format mémorisé. */
export const forgetX01QuickFormat = (): void => clearX01QuickFormat();
