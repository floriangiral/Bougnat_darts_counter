import { describe, expect, it } from 'vitest';

import {
  buildInstallPromptState,
  resolveInstallPlatform,
} from '../../../src/features/app-install/installPromptModel';

describe('installPromptModel', () => {
  it('detects iOS from iPhone user-agent', () => {
    const platform = resolveInstallPlatform(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
    );
    expect(platform).toBe('ios');
  });

  it('detects iPadOS in desktop mode as iOS', () => {
    const platform = resolveInstallPlatform(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    );
    expect(platform).toBe('ios');
  });

  it('keeps install CTA visible on iOS without native prompt', () => {
    const state = buildInstallPromptState({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148 Safari/604.1',
      hasBeforeInstallPrompt: false,
      isStandaloneDisplay: false,
      isNavigatorStandalone: false,
    });

    expect(state.platform).toBe('ios');
    expect(state.canPromptDirectly).toBe(false);
    expect(state.shouldShowInstallButton).toBe(true);
  });

  it('enables direct prompt on Android when beforeinstallprompt is available', () => {
    const state = buildInstallPromptState({
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel Tablet) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
      hasBeforeInstallPrompt: true,
      isStandaloneDisplay: false,
      isNavigatorStandalone: false,
    });

    expect(state.platform).toBe('android');
    expect(state.canPromptDirectly).toBe(true);
    expect(state.shouldShowInstallButton).toBe(true);
  });

  it('hides install CTA when app already runs in standalone mode', () => {
    const state = buildInstallPromptState({
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/124.0.0.0 Mobile Safari/537.36',
      hasBeforeInstallPrompt: true,
      isStandaloneDisplay: true,
      isNavigatorStandalone: false,
    });

    expect(state.isStandalone).toBe(true);
    expect(state.canPromptDirectly).toBe(false);
    expect(state.shouldShowInstallButton).toBe(false);
  });

  it('keeps install CTA visible for unknown user-agent when not standalone', () => {
    const state = buildInstallPromptState({
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
      hasBeforeInstallPrompt: false,
      isStandaloneDisplay: false,
      isNavigatorStandalone: false,
    });

    expect(state.platform).toBe('other');
    expect(state.shouldShowInstallButton).toBe(true);
  });
});
