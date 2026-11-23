// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';

import { SetupView } from '../../../views/SetupView';
import type { GameType } from '../../../utils/arenaFlow';
import type { GameConfig, Player } from '../../../types';

type OnStart = (players: Player[], config: GameConfig) => void;

// Présentation tablette des pages hors jeu : crochets data-* consommés par src/styles/screens/tablet-pages.css.
afterEach(cleanup);

const renderSetup = (gameType: GameType) => render(<SetupView gameType={gameType} onStart={vi.fn()} onBack={vi.fn()} />);

// X01 s'ouvre en mode Rapide : l'écran complet est derrière « Avancé ».
const renderAdvancedSetup = (gameType: GameType) => {
  const view = renderSetup(gameType);
  if (gameType === 'X01') fireEvent.click(view.getByTestId('setup-quick-customize'));
  return view;
};

describe('SetupView — présentation tablette', () => {
  it.each([
    ['X01', 'true'],
    ['CRICKET', 'true'],
    ['CAPITAL', 'false'],
    ['GOTCHA', 'false'],
  ] as const)('%s expose data-setup-options="%s" (deux colonnes seulement avec format/règles)', (gameType, expected) => {
    const view = renderAdvancedSetup(gameType);
    expect(view.container.querySelector('.setup-main')?.getAttribute('data-setup-options')).toBe(expected);
  });

  it('ouvre les règles dans une modale large et centrée', () => {
    const view = renderAdvancedSetup('X01');
    fireEvent.click(view.getByRole('button', { name: /Voir les règles/i }));
    const dialog = view.getByRole('dialog');
    expect(dialog.getAttribute('data-modal-size')).toBe('wide');
    expect(dialog.className).toContain('tablet-modal');
    expect(dialog.className).toContain('items-center');
  });

  it('ouvre le score personnalisé dans une modale moyenne et centrée', () => {
    const view = renderAdvancedSetup('X01');
    fireEvent.click(view.getAllByRole('button', { name: 'Perso' })[0]);
    const dialog = view.getByTestId('custom-score-modal');
    expect(dialog.getAttribute('data-modal-size')).toBe('medium');
    expect(dialog.className).toContain('justify-center');
  });
});

describe('SetupView — mode Rapide X01', () => {
  it('ouvre en Rapide et lance la partie standard avec les deux prénoms', () => {
    const onStart = vi.fn<OnStart>();
    const view = render(<SetupView gameType="X01" onStart={onStart} onBack={vi.fn()} />);

    expect(view.getByTestId('setup-quick')).toBeTruthy();
    expect(view.queryByTestId('setup-quick-mode-back')).toBeNull();
    expect(view.container.querySelector('.setup-main')).toBeNull();
    const proposedMatch = view.getByTestId('setup-quick-match').textContent;
    expect(proposedMatch).toContain('501');
    expect(proposedMatch).toContain('Premier à 3 manches · 1 contre 1');
    expect(proposedMatch).toContain('Départ libre · Fin sur un double');
    expect(view.queryByRole('button', { name: /Voir les règles/ })).toBeNull();
    fireEvent.click(view.getByRole('button', { name: 'Règles' }));
    expect(view.getByRole('dialog')).toBeTruthy();

    fireEvent.change(view.getByPlaceholderText('Joueur 1'), { target: { value: 'Alice' } });
    fireEvent.keyDown(view.getByPlaceholderText('Joueur 1'), { key: 'Enter' });
    expect(document.activeElement).toBe(view.getByPlaceholderText('Joueur 2'));
    fireEvent.change(view.getByPlaceholderText('Joueur 2'), { target: { value: 'Bruno' } });
    fireEvent.keyDown(view.getByPlaceholderText('Joueur 2'), { key: 'Enter' });

    expect(onStart).toHaveBeenCalledOnce();
    const [players, config] = onStart.mock.calls[0];
    expect(players.map((player) => player.name)).toEqual(['Alice', 'Bruno']);
    expect(config).toMatchObject({
      startingScore: 501, matchMode: 'LEGS', legsToWin: 3, checkIn: 'Open', checkOut: 'Double', isDoubles: false,
    });
    expect(config.maxVisitsPerLeg).toBeUndefined();
  });

  it('revient au standard en repassant en Rapide, en gardant les deux premiers prénoms', () => {
    const onStart = vi.fn<OnStart>();
    const view = render(<SetupView gameType="X01" onStart={onStart} onBack={vi.fn()} />);

    fireEvent.change(view.getByPlaceholderText('Joueur 1'), { target: { value: 'Alice' } });
    fireEvent.click(view.getByRole('button', { name: /Personnaliser la partie/ }));
    expect(view.queryByTestId('setup-quick')).toBeNull();
    fireEvent.click(view.getByRole('button', { name: '701' }));
    fireEvent.click(view.getByTestId('setup-player-count').querySelectorAll('button')[2]);
    fireEvent.click(view.getAllByRole('button', { name: 'Master' })[1]);

    fireEvent.click(view.getByRole('button', { name: '← Partie rapide' }));
    expect(view.getByTestId('setup-quick-match').textContent).toContain('Premier à 3 manches');
    expect(view.getByTestId('setup-quick-match').textContent).toContain('Départ libre · Fin sur un double');
    expect((view.getByPlaceholderText('Joueur 1') as HTMLInputElement).value).toBe('Alice');

    fireEvent.click(view.getByRole('button', { name: /Lancer La Partie/i }));
    const [players, config] = onStart.mock.calls[0];
    expect(players).toHaveLength(2);
    expect(config).toMatchObject({ startingScore: 501, checkOut: 'Double' });
  });

  it('n’affiche pas le mode Rapide pour un autre jeu ni pour un lien partenaire', () => {
    const cricket = renderSetup('CRICKET');
    expect(cricket.queryByTestId('setup-quick')).toBeNull();
    cleanup();

    const external = render(
      <SetupView
        gameType="X01"
        onStart={vi.fn()}
        onBack={vi.fn()}
        externalMatchHost="partenaire.example"
        prefilledPlayerNames={['Alice', 'Bruno']}
        prefilledConfig={{ startingScore: 301, legsToWin: 2 }}
      />,
    );
    expect(external.queryByTestId('setup-quick')).toBeNull();
    expect(external.queryByTestId('setup-quick-mode-back')).toBeNull();
    expect(external.container.querySelector('.setup-main')).not.toBeNull();
  });
});
