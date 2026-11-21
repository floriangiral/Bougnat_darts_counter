// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { GameScreenLayout } from '../../../components/layout/GameScreenLayout';

afterEach(cleanup);

const zones = (container: HTMLElement) =>
  [...container.querySelectorAll('[data-testid="game-screen"] > [data-zone]')].map((node) => node.getAttribute('data-zone'));

describe('GameScreenLayout (spec 072)', () => {
  it('rend les zones dans l’ordre visuel et de focus, sans bandeau par défaut', () => {
    const { container, getByTestId } = render(
      <GameScreenLayout
        game="cricket"
        header={<button type="button">Quitter</button>}
        players={<span>Scores</span>}
        input={<button type="button">Valider</button>}
        inputProps={{ className: 'pb-safe', 'data-mobile-shortcuts': 'true' }}
      >
        <dialog open>Superposition</dialog>
      </GameScreenLayout>,
    );

    const root = getByTestId('game-screen');
    expect(root.dataset.game).toBe('cricket');
    expect(root.className).toContain('game-screen');
    expect(zones(container)).toEqual(['header', 'players', 'input']);
    const input = container.querySelector('[data-zone="input"]') as HTMLElement;
    expect(input.className).toBe('pb-safe');
    expect(input.dataset.mobileShortcuts).toBe('true');
    expect(root.querySelector('dialog')?.textContent).toBe('Superposition');
    expect(root.querySelector('[data-slot]')).toBeNull();
  });

  it('expose les emplacements voix et diffusion TV quand ils sont fournis (FR-09)', () => {
    const { container } = render(
      <GameScreenLayout
        game="x01"
        header="En-tête"
        players="Joueurs"
        input="Saisie"
        band={<span>Phase 2/3</span>}
        voiceStatus={<span>Écoute</span>}
        broadcastStatus={<span>TV</span>}
      />,
    );

    expect(zones(container)).toEqual(['header', 'band', 'players', 'input']);
    expect(container.querySelector('[data-slot="voice-status"]')?.textContent).toBe('Écoute');
    expect(container.querySelector('[data-slot="broadcast-status"]')?.textContent).toBe('TV');
  });
});
