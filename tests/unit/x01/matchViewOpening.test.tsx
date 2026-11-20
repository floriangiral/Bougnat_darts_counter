// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMatch } from '../../../src/application/scoring/matchLifecycle';
import type { DeepgramUtterance } from '../../../src/features/x01/voice/dartsSpeechTypes';
import type { GameConfig, InOutRule, MatchState, Player } from '../../../types';

const voice = vi.hoisted(() => ({ onUtterance: null as ((utterance: DeepgramUtterance) => void) | null }));

vi.mock('../../../src/lib/env', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/lib/env')>();
  return { ...actual, env: { ...actual.env, VITE_ENABLE_VOICE_SCORING: true } };
});

vi.mock('../../../src/features/x01/voice/useDeepgramStreaming', () => ({
  useDeepgramStreaming: (options: { onUtterance: (utterance: DeepgramUtterance) => void }) => {
    voice.onUtterance = options.onUtterance;
    return { error: null, issue: null, isListening: false, liveTranscript: '', reset: () => undefined, start: async () => undefined, state: 'idle', stop: () => undefined };
  },
}));

const { MatchView } = await import('../../../views/MatchView');

type Snapshot = { match: MatchState; hasGameStarted: boolean; elapsedSeconds: number };

const players: Player[] = [
  { id: 'p1', name: 'Alice', teamId: 'team1' },
  { id: 'p2', name: 'Bruno', teamId: 'team2' },
];

const buildConfig = (checkIn: InOutRule): GameConfig => ({
  startingScore: 501, checkIn, checkOut: 'Double', matchMode: 'LEGS', legsToWin: 1, setsToWin: 1, isDoubles: false, initialStartingPlayerIndex: 0,
});

const renderMatch = (checkIn: InOutRule) => {
  const onStateChange = vi.fn<(snapshot: Snapshot) => void>();
  render(
    <MatchView
      initialMatch={createMatch(players, buildConfig(checkIn))}
      skipStartingPlayerPrompt
      onStateChange={onStateChange}
      onFinish={vi.fn()}
      onExit={vi.fn()}
    />,
  );
  return () => onStateChange.mock.lastCall![0].match;
};

const pointer = (element: HTMLElement, type: 'pointerdown' | 'pointerup') => {
  const event = new Event(type, { bubbles: true });
  Object.defineProperty(event, 'isPrimary', { value: true });
  act(() => {
    element.dispatchEvent(event);
  });
};

const typeDigits = (value: number) => {
  String(value).split('').forEach((digit) => {
    const key = screen.getByTestId(`x01-keypad-${digit}`);
    pointer(key, 'pointerdown');
    pointer(key, 'pointerup');
  });
};

const enterScore = (value: number) => {
  typeDigits(value);
  fireEvent.click(screen.getByTestId('x01-keypad-ok'));
};

afterEach(() => {
  cleanup();
  voice.onUtterance = null;
});

describe('MatchView — ouverture Double-In / Master-In (attestation)', () => {
  it('ne compte la première visite qu’après confirmation de l’ouverture', () => {
    const latest = renderMatch('Double');
    expect(screen.getAllByText('Ouverture : double requis')).toHaveLength(2);

    enterScore(60);
    expect(screen.getByTestId('opening-confirm-modal').textContent).toContain('Ouverture réussie sur un double : 60 points comptés ?');
    fireEvent.click(screen.getByTestId('opening-confirm-no'));
    expect(latest().currentLeg.scores.team1).toBe(501);
    expect(latest().currentLeg.history).toEqual([expect.objectContaining({ score: 0, isBust: false })]);

    enterScore(0);
    enterScore(60);
    fireEvent.click(screen.getByTestId('opening-confirm-yes'));
    expect(latest().currentLeg.scores.team1).toBe(441);
    expect(screen.getAllByText('Ouverture : double requis')).toHaveLength(1);
  });

  it('refuse une ouverture impossible et le bouton RESTE avant l’ouverture', () => {
    const latest = renderMatch('Double');

    enterScore(171);
    expect(screen.getByText('OUVERTURE IMPOSSIBLE')).toBeTruthy();
    expect(screen.queryByTestId('opening-confirm-modal')).toBeNull();

    fireEvent.click(screen.getByTestId('x01-keypad-clear'));
    typeDigits(441);
    fireEvent.click(screen.getByTestId('x01-keypad-remaining'));
    expect(screen.getByText('OUVERTURE REQUISE')).toBeTruthy();
    expect(latest().currentLeg.history).toHaveLength(0);
  });

  it('fait passer la proposition vocale par la même confirmation d’ouverture', () => {
    const latest = renderMatch('Master');
    expect(screen.getAllByText('Ouverture : double ou triple requis')).toHaveLength(2);

    act(() => {
      voice.onUtterance?.({ transcript: '60', confidence: 0.99, trigger: 'speech_final' });
    });
    fireEvent.click(screen.getByTestId('x01-keypad-ok'));

    expect(screen.getByTestId('opening-confirm-modal').textContent).toContain('Ouverture réussie sur un double ou un triple : 60 points comptés ?');
    fireEvent.click(screen.getByTestId('opening-confirm-yes'));
    expect(latest().currentLeg.scores.team1).toBe(441);
  });

  it('laisse le X01 Open inchangé', () => {
    const latest = renderMatch('Open');
    expect(screen.queryByText(/Ouverture :/)).toBeNull();
    enterScore(60);
    expect(screen.queryByTestId('opening-confirm-modal')).toBeNull();
    expect(latest().currentLeg.scores.team1).toBe(441);
  });
});
