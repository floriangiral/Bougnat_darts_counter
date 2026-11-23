// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetCounterSettingsForTests } from '../../../src/app/counterSettingsController';
import { resetVoicePrivacyNoticeForTests } from '../../../src/app/voicePrivacyNoticeController';
import { createMatch } from '../../../src/application/scoring/matchLifecycle';
import { COUNTER_SETTINGS_STORAGE_KEY } from '../../../src/features/settings/counterSettings';
import {
  serializeVoicePrivacyNoticeAcceptance,
  VOICE_PRIVACY_NOTICE_STORAGE_KEY,
  VOICE_PRIVACY_NOTICE_VERSION,
} from '../../../src/features/x01/voice/voicePrivacyNotice';
import type { Player } from '../../../types';
import { createFakeMediaStream, installAudioFakes } from './voiceBrowserFakes';

// Spec 080 AC-01 / AC-02 : la vraie garde (MatchView + useDeepgramStreaming) est exercée ; seules les
// frontières réseau (route du jeton, SDK) et navigateur (micro, audio) sont simulées.
const boundary = vi.hoisted(() => ({ token: vi.fn(), connect: vi.fn() }));

vi.mock('../../../src/lib/env', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/lib/env')>();
  return { ...actual, env: { ...actual.env, VITE_ENABLE_VOICE_SCORING: true } };
});
vi.mock('../../../src/features/x01/voice/deepgramClient', () => ({ fetchDeepgramAccessToken: boundary.token }));
vi.mock('@deepgram/sdk', () => ({
  DeepgramClient: class {
    listen = { v1: { connect: boundary.connect } };
  },
}));

const { MatchView } = await import('../../../views/MatchView');

const players: Player[] = [
  { id: 'p1', name: 'Alice', teamId: 'team1' },
  { id: 'p2', name: 'Bruno', teamId: 'team2' },
];

let getUserMedia: ReturnType<typeof vi.fn>;

const renderMatch = () => render(
  <MatchView
    initialMatch={createMatch(players, {
      startingScore: 501, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS', legsToWin: 1, setsToWin: 1, isDoubles: false, initialStartingPlayerIndex: 0,
    })}
    skipStartingPlayerPrompt
    onFinish={vi.fn()}
    onExit={vi.fn()}
  />,
);

const voiceKey = () => screen.getByRole('button', { name: 'Lancer l’écoute vocale' });

beforeEach(() => {
  localStorage.setItem(COUNTER_SETTINGS_STORAGE_KEY, JSON.stringify({ v: 1, x01: { voiceAssist: true } }));
  vi.spyOn(console, 'debug').mockImplementation(() => {});
  installAudioFakes();
  getUserMedia = vi.fn().mockResolvedValue(createFakeMediaStream().stream);
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } });
  boundary.token.mockResolvedValue({ accessToken: 'short-lived-token', expiresIn: 60 });
  boundary.connect.mockReturnValue(new Promise(() => {}));
});

afterEach(() => {
  cleanup();
  resetVoicePrivacyNoticeForTests();
  resetCounterSettingsForTests();
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  boundary.token.mockReset();
  boundary.connect.mockReset();
});

describe('MatchView — fiche voix et confidentialité (spec 080)', () => {
  it('shows the notice on the first microphone press without asking for the token or the microphone (AC-01)', () => {
    renderMatch();
    expect(screen.queryByTestId('voice-privacy-notice')).toBeNull();
    fireEvent.click(voiceKey());

    expect(screen.getByRole('dialog', { name: 'Voix et confidentialité' })).toBeTruthy();
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(boundary.token).not.toHaveBeenCalled();
  });

  it('falls back to manual entry for the match after a refusal, with no token call (AC-02, RM-02)', async () => {
    renderMatch();
    fireEvent.click(voiceKey());
    fireEvent.click(screen.getByRole('button', { name: 'Saisie manuelle' }));
    await act(async () => { await Promise.resolve(); });

    expect(screen.queryByTestId('voice-privacy-notice')).toBeNull();
    expect(screen.getByRole('button', { name: 'Trop de score' })).toBeTruthy();
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(boundary.token).not.toHaveBeenCalled();
    expect(localStorage.getItem(VOICE_PRIVACY_NOTICE_STORAGE_KEY)).toBeNull();
  });

  it('starts listening right after the acceptance and does not show the notice again (AC-02)', async () => {
    const view = renderMatch();
    fireEvent.click(voiceKey());
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Activer le micro' }));
      await Promise.resolve();
    });

    expect(screen.queryByTestId('voice-privacy-notice')).toBeNull();
    expect(getUserMedia).toHaveBeenCalledOnce();
    expect(localStorage.getItem(VOICE_PRIVACY_NOTICE_STORAGE_KEY)).toBe(serializeVoicePrivacyNoticeAcceptance());

    view.unmount();
    resetVoicePrivacyNoticeForTests();
    renderMatch();
    await act(async () => {
      fireEvent.click(voiceKey());
      await Promise.resolve();
    });
    expect(screen.queryByTestId('voice-privacy-notice')).toBeNull();
    expect(getUserMedia).toHaveBeenCalledTimes(2);
  });

  it('shows the notice again after a new version of it (RM-01)', () => {
    localStorage.setItem(VOICE_PRIVACY_NOTICE_STORAGE_KEY, serializeVoicePrivacyNoticeAcceptance(VOICE_PRIVACY_NOTICE_VERSION - 1));
    renderMatch();
    fireEvent.click(voiceKey());
    expect(screen.getByTestId('voice-privacy-notice')).toBeTruthy();
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it('opens the notice from the match options and re-arms the voice when the option is switched (FR-04)', () => {
    renderMatch();
    fireEvent.click(voiceKey());
    fireEvent.click(screen.getByRole('button', { name: 'Saisie manuelle' }));

    fireEvent.click(screen.getByRole('button', { name: /Configuration|Réglages/ }));
    fireEvent.click(screen.getByRole('button', { name: 'En savoir plus sur la voix' }));
    const notice = screen.getByTestId('voice-privacy-notice');
    expect(notice.getAttribute('data-mode')).toBe('info');
    fireEvent.click(screen.getByTestId('voice-privacy-close'));
    expect(screen.queryByTestId('voice-privacy-notice')).toBeNull();

    const voiceOption = screen.getByText('Assistance vocale IA').parentElement?.parentElement;
    if (!voiceOption) throw new Error('Missing voice option');
    fireEvent.click(voiceOption.querySelector('[aria-pressed]')!);
    fireEvent.click(voiceOption.querySelector('[aria-pressed]')!);
    expect(screen.getByRole('button', { name: 'Lancer l’écoute vocale' })).toBeTruthy();
    expect(boundary.token).not.toHaveBeenCalled();
  });
});
