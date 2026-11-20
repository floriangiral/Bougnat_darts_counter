// Spec 073 : port d'orientation (application) ; l'adaptateur web vit dans src/infrastructure/web.
export type LockOrientation = 'landscape';

export interface OrientationPort {
  isSupported(): boolean;
  /** Résout `true` si le verrou est posé ; un refus de la plateforme n'est jamais une erreur visible. */
  lock(orientation: LockOrientation): Promise<boolean>;
  unlock(): void;
}
