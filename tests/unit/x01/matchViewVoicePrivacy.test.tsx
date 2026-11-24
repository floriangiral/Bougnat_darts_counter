// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetCounterSettingsForTests } from '../../../src/app/counterSettingsController';
import { resetVoicePrivacyNoticeForTests } from '../../../src/app/voicePrivacyNoticeController';
import { createMatch } from '../../../src/application/scoring/matchLifecycle';
import { COUNTER_SETTINGS_STORAGE_KEY } from '../../../src/features/settings/counterSettings';
import { ViewportContext } from '../../../src/features/layout/useViewportClass';
import { resolveViewportClass, type ViewportClass } from '../../../src/features/layout/viewportClass';
import {
  serializeVoicePrivacyNoticeAcceptance,
  VOICE_PRIVACY_NOTICE_STORAGE_KEY,
  VOICE_PRIVACY_NOTICE_VERSION,
} from '../../../src/features/x01/voice/voicePrivacyNotice';
import type { MatchState, Player } from '../../../types';
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

const renderMatch = (viewport?: ViewportClass, startingScore = 501) => {
  const onStateChange = vi.fn<(snapshot: { match: MatchState }) => void>();
  const match = <MatchView
    initialMatch={createMatch(players, {
      startingScore, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS', legsToWin: 1, setsToWin: 1, isDoubles: false, initialStartingPlayerIndex: 0,
    })}
    skipStartingPlayerPrompt
    onStateChange={onStateChange}
    onFinish={vi.fn()}
    onExit={vi.fn()}
  />;
  return {
    ...render(viewport ? <ViewportContext.Provider value={viewport}>{match}</ViewportContext.Provider> : match),
    onStateChange,
  };
};

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
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Trop de score' }).disabled).toBe(true);
    fireEvent.click(voiceKey());

    expect(screen.getByRole('dialog', { name: 'Voix et confidentialité' })).toBeTruthy();
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(boundary.token).not.toHaveBeenCalled();
  });

  it('déclare un trop et libère le micro même lorsqu’une connexion vocale est en cours', async () => {
    const media = createFakeMediaStream();
    getUserMedia.mockResolvedValue(media.stream);
    localStorage.setItem(VOICE_PRIVACY_NOTICE_STORAGE_KEY, serializeVoicePrivacyNoticeAcceptance());
    const view = renderMatch(undefined, 40);
    await act(async () => {
      fireEvent.click(voiceKey());
      await Promise.resolve();
    });
    expect(getUserMedia).toHaveBeenCalledOnce();
    expect(boundary.connect).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('button', { name: 'Trop de score' }));
    expect(view.onStateChange.mock.lastCall![0].match.currentLeg.history).toEqual([
      expect.objectContaining({ isBust: true, remainingAfter: 40 }),
    ]);
    expect(media.track.stop).toHaveBeenCalled();
  });

  it('falls back to manual entry for the match after a refusal, with no token call (AC-02, RM-02)', async () => {
    renderMatch();
    fireEvent.click(voiceKey());
    fireEvent.click(screen.getByRole('button', { name: 'Saisie manuelle' }));
    await act(async () => { await Promise.resolve(); });

    expect(screen.queryByTestId('voice-privacy-notice')).toBeNull();
    expect(screen.getByRole('button', { name: 'Trop de score' }).classList.contains('row-span-2')).toBe(true);
    expect(screen.queryByRole('button', { name: 'Lancer l’écoute vocale' })).toBeNull();
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

describe.each([false, true])('MatchView — touche trop avec vocal activé : %s', (voiceAssist) => {
  it.each([
    { name: 'téléphone portrait', width: 390, height: 844, isTouch: true },
    { name: 'téléphone paysage', width: 844, height: 390, isTouch: true },
    { name: 'tablette portrait', width: 810, height: 1080, isTouch: true },
    { name: 'tablette arène', width: 1080, height: 810, isTouch: true },
    { name: 'bureau', width: 1440, height: 900, isTouch: false },
  ])('aligne les touches sur $name et permet de déclarer puis annuler un trop', ({ width, height, isTouch }) => {
    localStorage.setItem(COUNTER_SETTINGS_STORAGE_KEY, JSON.stringify({ v: 1, x01: { voiceAssist } }));
    const view = renderMatch(resolveViewportClass({ width, height, isTouch, accessMode: 'local' }), 40);
    const grid = screen.getByRole('group', { name: 'Pavé numérique' });
    const keys = within(grid);
    const bust = keys.getByRole<HTMLButtonElement>('button', { name: 'Trop de score' });
    const voice = keys.queryByRole('button', { name: 'Lancer l’écoute vocale' });
    expect(bust.parentElement).toBe(grid);
    expect(bust.classList.contains('row-span-2')).toBe(!voiceAssist);
    if (voiceAssist) {
      expect(voice?.parentElement).toBe(grid);
      expect(voice?.classList.contains('row-span-2')).toBe(false);
      expect(voice?.previousElementSibling).toBe(keys.getByTestId('x01-keypad-6'));
      expect(voice?.nextElementSibling).toBe(keys.getByTestId('x01-keypad-7'));
      expect(bust.previousElementSibling).toBe(keys.getByTestId('x01-keypad-9'));
    } else {
      expect(voice).toBeNull();
      expect(bust.previousElementSibling).toBe(keys.getByTestId('x01-keypad-6'));
    }

    expect(bust.disabled).toBe(false);
    fireEvent.click(bust);
    const latest = () => view.onStateChange.mock.lastCall![0].match;
    expect(latest().currentLeg.scores.team1).toBe(40);
    expect(latest().currentPlayerIndex).toBe(1);
    expect(latest().currentLeg.history).toEqual([
      expect.objectContaining({ isBust: true, score: 0, dartsThrown: 3, remainingAfter: 40 }),
    ]);
    fireEvent.click(keys.getByTestId('x01-keypad-undo'));
    expect(latest().currentLeg.history).toEqual([]);
    expect(latest().currentPlayerIndex).toBe(0);
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(boundary.token).not.toHaveBeenCalled();
  });
});
