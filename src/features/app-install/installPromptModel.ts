// Spec: spec:counter/home-install-shortcut
export type InstallPlatform = 'ios' | 'android' | 'other';

export interface InstallPromptInput {
  userAgent: string;
  hasBeforeInstallPrompt: boolean;
  isStandaloneDisplay: boolean;
  isNavigatorStandalone: boolean;
}

export interface InstallPromptState {
  platform: InstallPlatform;
  isStandalone: boolean;
  canPromptDirectly: boolean;
  shouldShowInstallButton: boolean;
}

const IOS_UA_REGEX = /iphone|ipad|ipod/i;
const ANDROID_UA_REGEX = /android/i;
const MAC_OS_UA_REGEX = /macintosh/i;
const MOBILE_UA_REGEX = /mobile/i;

export const resolveInstallPlatform = (userAgent: string): InstallPlatform => {
  const ua = String(userAgent || '');
  // iPadOS desktop mode reports "Macintosh" while still being a touch mobile browser.
  if (IOS_UA_REGEX.test(ua) || (MAC_OS_UA_REGEX.test(ua) && MOBILE_UA_REGEX.test(ua))) {
    return 'ios';
  }
  if (ANDROID_UA_REGEX.test(ua)) {
    return 'android';
  }
  return 'other';
};

export const buildInstallPromptState = (input: InstallPromptInput): InstallPromptState => {
  const platform = resolveInstallPlatform(input.userAgent);
  const isStandalone = Boolean(input.isStandaloneDisplay || input.isNavigatorStandalone);
  const canPromptDirectly = Boolean(!isStandalone && input.hasBeforeInstallPrompt);
  // Keep the CTA visible when not installed, even if UA detection is ambiguous
  // (e.g. simulator/devtools mode, in-app browsers), with a generic fallback guide.
  const hasManualGuidance = true;
  return {
    platform,
    isStandalone,
    canPromptDirectly,
    shouldShowInstallButton: !isStandalone && (canPromptDirectly || hasManualGuidance),
  };
};

export const installGuideTitle = (platform: InstallPlatform): string => {
  if (platform === 'ios') return 'Installer sur iPhone / iPad';
  if (platform === 'android') return 'Installer sur Android';
  return 'Installer sur l ecran d accueil';
};

export const installGuideSteps = (platform: InstallPlatform): string[] => {
  if (platform === 'ios') {
    return [
      'Ouvre cette page dans Safari.',
      'Appuie sur le bouton Partager en bas de l ecran.',
      "Choisis Sur l ecran d accueil.",
      'Valide avec Ajouter.',
    ];
  }
  if (platform === 'android') {
    return [
      'Ouvre cette page dans Chrome ou Edge.',
      'Appuie sur le menu du navigateur (⋮).',
      "Choisis Installer l application ou Ajouter a l ecran d accueil.",
      'Valide avec Installer / Ajouter.',
    ];
  }
  return [
    'Ouvre le menu de ton navigateur.',
    "Cherche l action Installer ou Ajouter a l ecran d accueil.",
    'Valide la creation du raccourci.',
  ];
};
