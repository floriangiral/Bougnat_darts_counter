// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';

import { SetupView } from '../../../views/SetupView';
import type { GameConfig, Player } from '../../../types';
import {
  serializeX01QuickFormat,
  STANDARD_X01_QUICK_FORMAT,
  X01_QUICK_FORMAT_STORAGE_KEY,
} from '../../../src/features/game-setup/x01QuickFormat';

type OnStart = (players: Player[], config: GameConfig) => void;
type View = ReturnType<typeof render>;

// Spec 133 : la partie rapide propose le dernier format joué en 1 contre 1.
beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

const renderQuick = (onStart = vi.fn<OnStart>()) => ({
  onStart,
  view: render(<SetupView gameType="X01" onStart={onStart} onBack={vi.fn()} />),
});

const remember = (format: Partial<typeof STANDARD_X01_QUICK_FORMAT>) => {
  window.localStorage.setItem(X01_QUICK_FORMAT_STORAGE_KEY, serializeX01QuickFormat({ ...STANDARD_X01_QUICK_FORMAT, ...format }));
};

const storedFormat = () => window.localStorage.getItem(X01_QUICK_FORMAT_STORAGE_KEY);

const chooseLegs = (view: View, legs: string) => {
  const legsBlock = view.getByText('Manches pour gagner le match').parentElement as HTMLElement;
  fireEvent.click(within(legsBlock).getByRole('button', { name: legs }));
};

const quickFormatText = (view: View) => view.getByTestId('setup-quick-format').textContent;
const launch = (view: View) => fireEvent.click(view.getByRole('button', { name: /Lancer La Partie/i }));

describe('SetupView — partie rapide sur le dernier format (spec 133)', () => {
  it('propose le format joué depuis l’écran complet au retour sur X01 (AC-01)', () => {
    const first = renderQuick();
    fireEvent.click(first.view.getByTestId('setup-quick-customize'));
    chooseLegs(first.view, '2');
    launch(first.view);
    expect(first.onStart.mock.calls[0][1]).toMatchObject({ legsToWin: 2 });
    expect(storedFormat()).toContain('"legsToWin":2');
    cleanup();

    const second = renderQuick();
    expect(quickFormatText(second.view)).toBe('Premier à 2 manches · 1 contre 1');
    launch(second.view);
    expect(second.onStart.mock.calls[0][1]).toMatchObject({ startingScore: 501, legsToWin: 2, checkOut: 'Double' });
  });

  it('relance à l’identique un 701 Master Out en sets avec limite de volées (AC-02, RM-06)', () => {
    remember({ startingScore: 701, checkOut: 'Master', matchMode: 'SETS', setsToWin: 2, legsToWin: 3, maxVisitsPerLeg: 15 });
    const { view, onStart } = renderQuick();

    expect(view.getByTestId('setup-quick-match').textContent).toContain('701');
    expect(quickFormatText(view)).toBe('Premier à 2 sets de 3 manches · 1 contre 1');
    expect(view.getByTestId('setup-quick-match').textContent).toContain('Fin double ou triple · 15 volées par manche');
    launch(view);
    expect(onStart.mock.calls[0][1]).toMatchObject({
      startingScore: 701, checkOut: 'Master', matchMode: 'SETS', setsToWin: 2, legsToWin: 3, maxVisitsPerLeg: 15,
    });
  });

  it('accorde « manche » et « set » au singulier', () => {
    remember({ matchMode: 'SETS', setsToWin: 1, legsToWin: 1 });
    expect(quickFormatText(renderQuick().view)).toBe('Premier à 1 set de 1 manche · 1 contre 1');
    cleanup();
    remember({ legsToWin: 1 });
    expect(quickFormatText(renderQuick().view)).toBe('Premier à 1 manche · 1 contre 1');
  });

  it('ne mémorise ni un match à 3 joueurs ni un match contre le robot (AC-03)', () => {
    remember({ legsToWin: 2 });
    const before = storedFormat();

    const threePlayers = renderQuick();
    fireEvent.click(threePlayers.view.getByTestId('setup-quick-customize'));
    fireEvent.click(threePlayers.view.getByTestId('setup-player-count').querySelectorAll('button')[2]);
    chooseLegs(threePlayers.view, '5');
    launch(threePlayers.view);
    expect(threePlayers.onStart).toHaveBeenCalledOnce();
    expect(storedFormat()).toBe(before);
    cleanup();

    const bot = renderQuick();
    fireEvent.click(bot.view.getByTestId('setup-quick-customize'));
    fireEvent.click(bot.view.getByRole('checkbox', { name: /robot/i }));
    chooseLegs(bot.view, '4');
    launch(bot.view);
    expect(bot.onStart).toHaveBeenCalledOnce();
    expect(bot.onStart.mock.calls[0][0].some((player) => player.isBot)).toBe(true);
    expect(storedFormat()).toBe(before);
  });

  it('ignore le format mémorisé pour un lien partenaire et ne le modifie pas (AC-04, RM-05)', () => {
    remember({ legsToWin: 2 });
    const before = storedFormat();
    const onStart = vi.fn<OnStart>();
    const view = render(
      <SetupView
        gameType="X01"
        onStart={onStart}
        onBack={vi.fn()}
        externalMatchHost="partenaire.example"
        prefilledPlayerNames={['Alice', 'Bruno']}
        prefilledConfig={{ startingScore: 301, legsToWin: 4 }}
      />,
    );
    launch(view);
    expect(onStart.mock.calls[0][1]).toMatchObject({ startingScore: 301, legsToWin: 4 });
    expect(storedFormat()).toBe(before);
  });

  it('propose le standard sans format mémorisé ou avec un stockage illisible (RM-02, AC-06)', () => {
    window.localStorage.setItem(X01_QUICK_FORMAT_STORAGE_KEY, '{illisible');
    const { view } = renderQuick();
    expect(quickFormatText(view)).toBe('Premier à 3 manches · 1 contre 1');
    expect(view.queryByTestId('setup-quick-reset-standard')).toBeNull();
  });

  it('« ← Partie rapide » garde le format en cours, prénoms compris (Q3, RM-04)', () => {
    const { view, onStart } = renderQuick();
    fireEvent.change(view.getByPlaceholderText('Joueur 1'), { target: { value: 'Alice' } });
    fireEvent.click(view.getByTestId('setup-quick-customize'));
    fireEvent.click(view.getByRole('button', { name: '701' }));
    chooseLegs(view, '4');

    fireEvent.click(view.getByRole('button', { name: '← Partie rapide' }));
    expect(view.getByTestId('setup-quick-match').textContent).toContain('701');
    expect(quickFormatText(view)).toBe('Premier à 4 manches · 1 contre 1');
    expect((view.getByPlaceholderText('Joueur 1') as HTMLInputElement).value).toBe('Alice');

    launch(view);
    expect(onStart.mock.calls[0][1]).toMatchObject({ startingScore: 701, legsToWin: 4 });
    expect(storedFormat()).toContain('"startingScore":701');
  });

  it('« ← Partie rapide » depuis un format à 3 joueurs reprend le format mémorisé', () => {
    remember({ legsToWin: 2 });
    const { view } = renderQuick();
    fireEvent.click(view.getByTestId('setup-quick-customize'));
    fireEvent.click(view.getByTestId('setup-player-count').querySelectorAll('button')[2]);
    chooseLegs(view, '5');
    fireEvent.click(view.getByRole('button', { name: '← Partie rapide' }));
    expect(quickFormatText(view)).toBe('Premier à 2 manches · 1 contre 1');
    expect(view.getAllByRole('textbox')).toHaveLength(2);
  });

  it('« Revenir au standard » rétablit 501 en 3 manches, garde les prénoms et oublie le format (AC-08, AC-09)', () => {
    remember({ legsToWin: 2, checkOut: 'Master' });
    const { view, onStart } = renderQuick();
    fireEvent.change(view.getByPlaceholderText('Joueur 1'), { target: { value: 'Alice' } });

    fireEvent.click(view.getByTestId('setup-quick-reset-standard'));
    expect(quickFormatText(view)).toBe('Premier à 3 manches · 1 contre 1');
    expect(view.getByTestId('setup-quick-match').textContent).toContain('Fin sur un double');
    expect((view.getByPlaceholderText('Joueur 1') as HTMLInputElement).value).toBe('Alice');
    expect(view.queryByTestId('setup-quick-reset-standard')).toBeNull();
    expect(storedFormat()).toBeNull();

    launch(view);
    expect(onStart.mock.calls[0][1]).toMatchObject({ startingScore: 501, legsToWin: 3, checkOut: 'Double' });
    expect(storedFormat()).toBeNull();
  });

  it('mémorise le nouveau format lancé depuis la partie rapide après personnalisation (AC-10, RM-03)', () => {
    remember({ legsToWin: 2 });
    const first = renderQuick();
    fireEvent.click(first.view.getByTestId('setup-quick-customize'));
    chooseLegs(first.view, '4');
    fireEvent.click(first.view.getByRole('button', { name: '← Partie rapide' }));
    launch(first.view);
    expect(first.onStart.mock.calls[0][1]).toMatchObject({ legsToWin: 4 });
    cleanup();

    expect(quickFormatText(renderQuick().view)).toBe('Premier à 4 manches · 1 contre 1');
  });

  it('efface le format mémorisé quand le standard est lancé depuis la partie rapide (AC-11, RM-03)', () => {
    remember({ legsToWin: 2 });
    const first = renderQuick();
    fireEvent.click(first.view.getByTestId('setup-quick-customize'));
    chooseLegs(first.view, '3');
    fireEvent.click(first.view.getByRole('button', { name: '← Partie rapide' }));
    launch(first.view);
    expect(first.onStart.mock.calls[0][1]).toMatchObject({ startingScore: 501, legsToWin: 3, checkOut: 'Double' });
    expect(storedFormat()).toBeNull();
    cleanup();

    const second = renderQuick();
    expect(quickFormatText(second.view)).toBe('Premier à 3 manches · 1 contre 1');
    expect(second.view.queryByTestId('setup-quick-reset-standard')).toBeNull();
  });
});
