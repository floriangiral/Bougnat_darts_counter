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
    expect(view.getByText('Annonce')).toBeDefined();
    fireEvent.click(button);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('toggles accessible start/stop controls and prioritizes the active appearance over errors', () => {
    const onToggle = vi.fn();
    const view = render(<VoiceScoringControl enabled isListening={false} onToggle={onToggle} stateLabel="Prêt" />);
    const start = view.getByRole('button', { name: 'Lancer l écoute vocale' });
    expect(start.getAttribute('aria-pressed')).toBe('false');
    expect(start.title).toBe('Prêt');
    expect(start.className).toContain('!bg-emerald-900/55');
    fireEvent.click(start);
    expect(onToggle).toHaveBeenCalledOnce();
    view.rerender(<VoiceScoringControl enabled isListening error="ancienne erreur" onToggle={onToggle} stateLabel="Ecoute" />);
    const stop = view.getByRole('button', { name: 'Arrêter l écoute vocale' });
    expect(stop.getAttribute('aria-pressed')).toBe('true');
    expect(stop.className).toContain('!bg-emerald-600/55');
    expect(stop.querySelector('.animate-pulse')).not.toBeNull();
    fireEvent.click(stop);
    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it('shows recoverable error styling and prevents activation while processing', () => {
    const onToggle = vi.fn();
    const view = render(<VoiceScoringControl enabled disabled error="Micro refusé" isListening={false} onToggle={onToggle} stateLabel="Traitement" />);
    const button = view.getByRole('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.className).toContain('!bg-amber-950/30');
    expect(button.querySelector('.animate-spin')).not.toBeNull();
    fireEvent.click(button);
    expect(onToggle).not.toHaveBeenCalled();
  });
});
