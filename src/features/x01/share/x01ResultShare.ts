import type { MatchState } from '../../../../types';
import { createX01ResultImage } from '../../../presentation/stats/x01ResultImage.fr';
import { describeX01Result } from '../../../presentation/stats/x01ResultImageModel.fr';
import { buildX01ShareContent } from '../../../presentation/stats/x01ShareText.fr';
import { canShareImageFiles, downloadImage, imageDataUrl, isIosStandaloneApp, shareImage } from '../../../infrastructure/web/shareImage';
import { canShareText, shareText } from '../../../infrastructure/web/shareText';
import { copyText } from '../../../infrastructure/web/copyText';

export interface X01ResultImage {
  file: File;
  /** Aperçu en `data:` : compatible avec la CSP (`img-src` sans `blob:`). */
  url: string;
}

const images = new WeakMap<MatchState, Promise<X01ResultImage>>();

/**
 * Image du match, générée une seule fois par instance de match terminé : rouvrir la fenêtre de
 * partage réutilise le fichier. Un échec n'est pas mis en cache, pour permettre de réessayer.
 */
export const loadX01ResultImage = (match: MatchState): Promise<X01ResultImage> => {
  const cached = images.get(match);
  if (cached) return cached;
  const pending = createX01ResultImage(match).then(async (file) => ({ file, url: await imageDataUrl(file) }));
  images.set(match, pending);
  pending.catch(() => {
    if (images.get(match) === pending) images.delete(match);
  });
  return pending;
};

/** Oublie une image dont l'aperçu n'a pas pu être affiché. */
export const forgetX01ResultImage = (match: MatchState): void => {
  images.delete(match);
};

export interface X01ShareCapabilities {
  /** Partage natif de fichiers : action principale « Partager l'image », sinon « Enregistrer l'image ». */
  shareFiles: boolean;
  /** Feuille native texte ; sans elle, « Partager le texte » doublerait « Copier le texte ». */
  shareText: boolean;
  /**
   * Enregistrement proposé en plus du partage, sauf dans l'application installée iOS : le lien de
   * téléchargement y ouvre l'image en plein écran sans retour à l'application, et la feuille de
   * partage propose déjà « Enregistrer l'image ».
   */
  saveAlongsideShare: boolean;
}

export const getX01ShareCapabilities = (): X01ShareCapabilities => ({
  shareFiles: canShareImageFiles(),
  shareText: canShareText(),
  saveAlongsideShare: !isIosStandaloneApp(),
});

export { buildX01ShareContent, copyText, describeX01Result, downloadImage, shareImage, shareText };
