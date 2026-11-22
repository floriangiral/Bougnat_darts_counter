// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';

import { VoiceScoringControl } from '../../../src/features/x01/voice/VoiceScoringControl';

afterEach(cleanup);

describe('VoiceScoringControl', () => {
  it('renders an unavailable control that cannot be activated', () => {
    const onToggle = vi.fn();
    const view = render(<VoiceScoringControl enabled={false} isListening={false} onToggle={onToggle} stateLabel="Indisponible" />);
    const button = view.getByRole('button', { name: 'Scoring vocal désactivé' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.title).toBe('Scoring vocal désactivé');
    expect(button.dataset.state).toBe('unavailable');
    expect(view.getByText('Annonce')).toBeDefined();
    fireEvent.click(button);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('toggles accessible start/stop controls and prioritizes the active appearance over errors', () => {
    const onToggle = vi.fn();
    const view = render(<VoiceScoringControl enabled isListening={false} onToggle={onToggle} stateLabel="Prêt" />);
    const start = view.getByRole('button', { name: 'Lancer l’écoute vocale' });
    expect(start.getAttribute('aria-pressed')).toBe('false');
    expect(start.title).toBe('Prêt');
    expect(start.dataset.state).toBe('ready');
    expect(start.className).not.toContain('!');
    fireEvent.click(start);
    expect(onToggle).toHaveBeenCalledOnce();
    view.rerender(<VoiceScoringControl enabled isListening error="ancienne erreur" onToggle={onToggle} stateLabel="Écoute" />);
    const stop = view.getByRole('button', { name: 'Arrêter l’écoute vocale' });
    expect(stop.getAttribute('aria-pressed')).toBe('true');
    expect(stop.dataset.state).toBe('listening');
    expect(stop.querySelector('.animate-pulse')).not.toBeNull();
    fireEvent.click(stop);
    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it('shows recoverable error styling and prevents activation while processing', () => {
    const onToggle = vi.fn();
    const view = render(<VoiceScoringControl enabled disabled error="Micro refusé" isListening={false} onToggle={onToggle} stateLabel="Traitement" />);
    const button = view.getByRole('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.dataset.state).toBe('error');
    expect(button.querySelector('.animate-spin')).not.toBeNull();
    fireEvent.click(button);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('spells the listening and error states on the key itself', () => {
    const onToggle = vi.fn();
    const view = render(<VoiceScoringControl enabled isListening onToggle={onToggle} stateLabel="Écoute" />);
    expect(view.getByText('À l’écoute')).toBeTruthy();
    expect(view.getByText('touche pour arrêter').className).toContain('x01-voice-hint');
    view.rerender(<VoiceScoringControl enabled error="Micro refusé" isListening={false} onToggle={onToggle} stateLabel="Erreur" />);
    const button = view.getByRole('button', { name: 'Lancer l’écoute vocale' });
    expect(button.title).toBe('Erreur : Micro refusé');
    expect(view.getByText('Micro en erreur')).toBeTruthy();
    expect(view.getByText('touche pour réessayer')).toBeTruthy();
    view.rerender(<VoiceScoringControl enabled isListening={false} onToggle={onToggle} stateLabel="Prêt" />);
    expect(view.getByText('ton score').className).not.toContain('x01-voice-hint');
  });

  it('keeps the key ready after a listening delay without announcement (not a microphone failure)', () => {
    const view = render(
      <VoiceScoringControl enabled error="Aucune annonce détectée. Relance l’écoute." issue="timeout" isListening={false} onToggle={vi.fn()} stateLabel="Scoring vocal" />,
    );
    const button = view.getByRole('button', { name: 'Lancer l’écoute vocale' });
    expect(button.dataset.state).toBe('ready');
    expect(view.queryByText('Micro en erreur')).toBeNull();
    expect(view.getByText('ton score')).toBeTruthy();
    view.rerender(<VoiceScoringControl enabled error="Micro indisponible ou refusé." issue="microphone" isListening={false} onToggle={vi.fn()} stateLabel="Erreur" />);
    expect(view.getByText('Micro en erreur')).toBeTruthy();
  });
});
