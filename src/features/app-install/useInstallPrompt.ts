import { useEffect, useMemo, useState } from 'react';
import {
  buildInstallPromptState,
  installGuideSteps,
  installGuideTitle,
  type InstallPlatform,
} from './installPromptModel';

interface BeforeInstallPromptChoice {
  outcome: 'accepted' | 'dismissed';
  platform: string;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<BeforeInstallPromptChoice>;
}

export interface UseInstallPromptState {
  platform: InstallPlatform;
  shouldShowInstallButton: boolean;
  canPromptDirectly: boolean;
  isGuideOpen: boolean;
  guideTitle: string;
  guideSteps: string[];
  openInstallFlow: () => Promise<void>;
  closeGuide: () => void;
}

const getIsStandaloneDisplay = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(display-mode: standalone)').matches
    : false;

const getIsNavigatorStandalone = () => {
  if (typeof window === 'undefined') return false;
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  return Boolean(navigatorWithStandalone.standalone);
};

const getUserAgent = () => (typeof window !== 'undefined' ? window.navigator.userAgent : '');

export const useInstallPrompt = (): UseInstallPromptState => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isStandaloneDisplay, setIsStandaloneDisplay] = useState<boolean>(() => getIsStandaloneDisplay());
  const [isNavigatorStandalone, setIsNavigatorStandalone] = useState<boolean>(() => getIsNavigatorStandalone());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const onMediaChange = (event: MediaQueryListEvent) => {
      setIsStandaloneDisplay(event.matches);
    };
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', onMediaChange);
      return () => mediaQuery.removeEventListener('change', onMediaChange);
    }
    mediaQuery.addListener(onMediaChange);
    return () => mediaQuery.removeListener(onMediaChange);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (event: Event) => {
      const installEvent = event as BeforeInstallPromptEvent;
      event.preventDefault();
      setDeferredPrompt(installEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    setIsNavigatorStandalone(getIsNavigatorStandalone());
  }, [isStandaloneDisplay]);

  const promptState = useMemo(
    () =>
      buildInstallPromptState({
        userAgent: getUserAgent(),
        hasBeforeInstallPrompt: deferredPrompt != null,
        isStandaloneDisplay,
        isNavigatorStandalone,
      }),
    [deferredPrompt, isNavigatorStandalone, isStandaloneDisplay],
  );

  const openInstallFlow = async () => {
    if (promptState.canPromptDirectly && deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (choice.outcome === 'accepted') {
        setIsGuideOpen(false);
        return;
      }
    }
    setIsGuideOpen(true);
  };

  return {
    platform: promptState.platform,
    shouldShowInstallButton: promptState.shouldShowInstallButton,
    canPromptDirectly: promptState.canPromptDirectly,
    isGuideOpen,
    guideTitle: installGuideTitle(promptState.platform),
    guideSteps: installGuideSteps(promptState.platform),
    openInstallFlow,
    closeGuide: () => setIsGuideOpen(false),
  };
};
