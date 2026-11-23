// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  acceptVoicePrivacyNotice,
  hasAcceptedVoicePrivacyNotice,
  resetVoicePrivacyNoticeForTests,
} from '../../../src/app/voicePrivacyNoticeController';
import { VoicePrivacyNotice } from '../../../src/features/x01/voice/VoicePrivacyNotice';
import {
  isVoicePrivacyNoticeAccepted,
  serializeVoicePrivacyNoticeAcceptance,
  VOICE_PRIVACY_NOTICE_COPY,
  VOICE_PRIVACY_NOTICE_STORAGE_KEY,
  VOICE_PRIVACY_NOTICE_VERSION,
} from '../../../src/features/x01/voice/voicePrivacyNotice';
import { readVoicePrivacyNoticeAccepted, writeVoicePrivacyNoticeAccepted } from '../../../src/infrastructure/local/voicePrivacyNoticeStore';

afterEach(() => {
  cleanup();
  resetVoicePrivacyNoticeForTests();
  localStorage.clear();
  vi.restoreAllMocks();
});

const throwingStorage = {
  getItem: () => { throw new Error('denied'); },
  setItem: () => { throw new Error('quota'); },
};

describe('voicePrivacyNotice — acceptation versionnée (spec 080 FR-01)', () => {
  it('accepts only the current version of the notice', () => {
    expect(isVoicePrivacyNoticeAccepted(serializeVoicePrivacyNoticeAcceptance())).toBe(true);
    expect(isVoicePrivacyNoticeAccepted(serializeVoicePrivacyNoticeAcceptance(VOICE_PRIVACY_NOTICE_VERSION + 1))).toBe(false);
    expect(isVoicePrivacyNoticeAccepted(JSON.stringify({ v: VOICE_PRIVACY_NOTICE_VERSION, accepted: 'yes' }))).toBe(false);
    expect(isVoicePrivacyNoticeAccepted(null)).toBe(false);
    expect(isVoicePrivacyNoticeAccepted('null')).toBe(false);
    expect(isVoicePrivacyNoticeAccepted('{corrupted')).toBe(false);
  });

  it('shows the notice again when a new version replaces the accepted one (RM-04)', () => {
    localStorage.setItem(VOICE_PRIVACY_NOTICE_STORAGE_KEY, serializeVoicePrivacyNoticeAcceptance(VOICE_PRIVACY_NOTICE_VERSION - 1));
    expect(hasAcceptedVoicePrivacyNotice()).toBe(false);
  });

  it('stores the acceptance on the device and never blocks when storage is unavailable', () => {
    expect(readVoicePrivacyNoticeAccepted()).toBe(false);
    writeVoicePrivacyNoticeAccepted();
    expect(readVoicePrivacyNoticeAccepted()).toBe(true);
    expect(readVoicePrivacyNoticeAccepted(throwingStorage)).toBe(false);
    expect(() => writeVoicePrivacyNoticeAccepted(throwingStorage)).not.toThrow();
    expect(readVoicePrivacyNoticeAccepted(null)).toBe(false);
  });

  it('keeps the acceptance for the session when storage refuses the write (private browsing)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    expect(hasAcceptedVoicePrivacyNotice()).toBe(false);
    acceptVoicePrivacyNotice();
    expect(hasAcceptedVoicePrivacyNotice()).toBe(true);
    resetVoicePrivacyNoticeForTests();
    expect(hasAcceptedVoicePrivacyNotice()).toBe(false);
  });

  it('reads an earlier acceptance from the device', () => {
    acceptVoicePrivacyNotice();
    resetVoicePrivacyNoticeForTests();
    expect(hasAcceptedVoicePrivacyNotice()).toBe(true);
  });
});

describe('VoicePrivacyNotice — fiche', () => {
  it('explains where the voice goes and offers the two choices, focus on the manual entry', () => {
    const onAccept = vi.fn();
    const onDecline = vi.fn();
    render(<VoicePrivacyNotice mode="consent" onAccept={onAccept} onDecline={onDecline} />);
    const dialog = screen.getByRole('dialog', { name: VOICE_PRIVACY_NOTICE_COPY.title });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.textContent).toContain('Ta voix est envoyée à Deepgram pour être transcrite, uniquement pendant l’écoute.');
    expect(dialog.textContent).toContain('États-Unis');
    expect(dialog.textContent).toContain('exclue de l’entraînement');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Saisie manuelle' }));

    fireEvent.click(screen.getByRole('button', { name: 'Activer le micro' }));
    expect(onAccept).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Saisie manuelle' }));
    expect(onDecline).toHaveBeenCalledOnce();
  });

  it('treats Escape as the manual entry and keeps the keyboard focus inside the notice', () => {
    const onDecline = vi.fn();
    render(<VoicePrivacyNotice mode="consent" onAccept={vi.fn()} onDecline={onDecline} />);
    const dialog = screen.getByTestId('voice-privacy-notice');
    const decline = screen.getByRole('button', { name: 'Saisie manuelle' });
    const accept = screen.getByRole('button', { name: 'Activer le micro' });

    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(accept);
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(decline);
    fireEvent.keyDown(dialog, { key: 'Enter' });
    expect(onDecline).not.toHaveBeenCalled();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onDecline).toHaveBeenCalledOnce();
  });

  it('only offers to close in information mode and restores the focus to its trigger', () => {
    const trigger = document.createElement('button');
    document.body.append(trigger);
    trigger.focus();
    const onClose = vi.fn();
    const view = render(<VoicePrivacyNotice mode="info" onClose={onClose} />);
    expect(screen.queryByRole('button', { name: 'Activer le micro' })).toBeNull();
    const close = screen.getByRole('button', { name: 'Fermer' });
    expect(document.activeElement).toBe(close);
    fireEvent.keyDown(screen.getByTestId('voice-privacy-notice'), { key: 'Tab' });
    expect(document.activeElement).toBe(close);
    fireEvent.keyDown(screen.getByTestId('voice-privacy-notice'), { key: 'Escape' });
    fireEvent.click(close);
    expect(onClose).toHaveBeenCalledTimes(2);
    view.unmount();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});
