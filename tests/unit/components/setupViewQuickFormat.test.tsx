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

// Spec 133 : la partie rapide propose la dernière partie lancée (format, composition, prénoms, robot).
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
const inputValues = (view: View) => view.getAllByRole('textbox').map((input) => (input as HTMLInputElement).value);

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

  it('mémorise un match à 4 joueurs avec ses prénoms et le relance à l’identique (AC-03, AC-07)', () => {
    const first = renderQuick();
    fireEvent.click(first.view.getByTestId('setup-quick-customize'));
    fireEvent.click(first.view.getByTestId('setup-player-count').querySelectorAll('button')[3]);
    ['Alice', 'Bruno', 'Chloé', 'David'].forEach((name, index) => {
      fireEvent.change(first.view.getByPlaceholderText(`Joueur ${index + 1}`), { target: { value: name } });
    });
    fireEvent.click(first.view.getByRole('button', { name: '701' }));
    chooseLegs(first.view, '1');
    launch(first.view);
    expect(first.onStart).toHaveBeenCalledOnce();
    cleanup();

    const second = renderQuick();
    expect(quickFormatText(second.view)).toBe('Premier à 1 manche · 4 joueurs');
    expect(second.view.getByTestId('setup-quick-match').textContent).toContain('701');
    expect(inputValues(second.view)).toEqual(['Alice', 'Bruno', 'Chloé', 'David']);
    expect(second.view.getByTestId('setup-quick-reset-standard')).toBeTruthy();
    launch(second.view);
    expect(second.onStart.mock.calls[0][0].map((player) => player.name)).toEqual(['Alice', 'Bruno', 'Chloé', 'David']);
    expect(second.onStart.mock.calls[0][1]).toMatchObject({ startingScore: 701, legsToWin: 1, isDoubles: false });
  });

  it('mémorise le robot et son niveau, sans le prénom tiré au sort du robot (Q7)', () => {
    const first = renderQuick();
    fireEvent.change(first.view.getByPlaceholderText('Joueur 1'), { target: { value: 'Alice' } });
    fireEvent.click(first.view.getByTestId('setup-quick-customize'));
    fireEvent.click(first.view.getByRole('checkbox', { name: /robot/i }));
    fireEvent.click(first.view.getByText('Club'));
    launch(first.view);
    expect(first.onStart.mock.calls[0][0][1]).toMatchObject({ isBot: true, botLevel: 'CLUB' });
    cleanup();

    const second = renderQuick();
    expect(quickFormatText(second.view)).toBe('Premier à 3 manches · Contre le robot Club');
    expect(second.view.getByTestId('setup-quick-bot').textContent).toBe('Robot Club');
    expect(inputValues(second.view)).toEqual(['Alice']);
    launch(second.view);
    expect(second.onStart.mock.calls[0][0]).toEqual([
      expect.objectContaining({ name: 'Alice' }),
      expect.objectContaining({ isBot: true, botLevel: 'CLUB' }),
    ]);
  });

  it('mémorise un 2 contre 2 avec ses équipes, et le solo', () => {
    remember({ isDoubles: true, team1Names: ['Alice', 'Bruno'], team2Names: ['Chloé', 'David'] });
    const doubles = renderQuick();
    expect(quickFormatText(doubles.view)).toBe('Premier à 3 manches · 2 contre 2');
    const teams = doubles.view.getByTestId('setup-quick-teams');
    expect(teams.textContent).toContain('Équipe 1');
    expect(inputValues(doubles.view)).toEqual(['Alice', 'Bruno', 'Chloé', 'David']);
    fireEvent.change(doubles.view.getByRole('textbox', { name: 'Équipe 2, joueur 2' }), { target: { value: 'Denis' } });
    launch(doubles.view);
    expect(doubles.onStart.mock.calls[0][0].map((player) => `${player.teamId}:${player.name}`)).toEqual([
      'team1:Alice', 'team1:Bruno', 'team2:Chloé', 'team2:Denis',
    ]);
    expect(doubles.onStart.mock.calls[0][1]).toMatchObject({ isDoubles: true });
    cleanup();
    expect(inputValues(renderQuick().view)).toEqual(['Alice', 'Bruno', 'Chloé', 'Denis']);
    cleanup();

    remember({ playerNames: ['Alice'] });
    const solo = renderQuick();
    expect(quickFormatText(solo.view)).toBe('Premier à 3 manches · Solo');
    expect(inputValues(solo.view)).toEqual(['Alice']);
  });

  it('enchaîne les prénoms avec Entrée puis lance la partie', () => {
    remember({ playerNames: ['A', 'B', 'C'] });
    const { view, onStart } = renderQuick();
    const inputs = view.getAllByRole('textbox');
    fireEvent.keyDown(inputs[0], { key: 'Enter' });
    expect(document.activeElement).toBe(inputs[1]);
    fireEvent.keyDown(inputs[1], { key: 'a' });
    expect(onStart).not.toHaveBeenCalled();
    fireEvent.keyDown(inputs[2], { key: 'Enter' });
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('relit l’ancien format mémorisé comme un 1 contre 1 (RM-09)', () => {
    window.localStorage.setItem(X01_QUICK_FORMAT_STORAGE_KEY, JSON.stringify({
      v: 1, startingScore: 301, matchMode: 'LEGS', legsToWin: 2, setsToWin: 3, checkIn: 'Open', checkOut: 'Double', maxVisitsPerLeg: null,
    }));
    const { view } = renderQuick();
    expect(quickFormatText(view)).toBe('Premier à 2 manches · 1 contre 1');
    expect(view.getByTestId('setup-quick-match').textContent).toContain('301');
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

  it('« ← Partie rapide » garde aussi un format à 3 joueurs (RM-04)', () => {
    remember({ legsToWin: 2 });
    const { view } = renderQuick();
    fireEvent.click(view.getByTestId('setup-quick-customize'));
    fireEvent.click(view.getByTestId('setup-player-count').querySelectorAll('button')[2]);
    chooseLegs(view, '5');
    fireEvent.click(view.getByRole('button', { name: '← Partie rapide' }));
    expect(quickFormatText(view)).toBe('Premier à 5 manches · 3 joueurs');
    expect(view.getAllByRole('textbox')).toHaveLength(3);
  });

  it('« ← Partie rapide » reprend la partie mémorisée quand la partie en cours ne peut pas être lancée', () => {
    remember({ legsToWin: 2, playerNames: ['Alice', 'Bruno'] });
    const { view } = renderQuick();
    fireEvent.click(view.getByTestId('setup-quick-customize'));
    fireEvent.click(view.getByTestId('setup-player-count').querySelectorAll('button')[2]);
    chooseLegs(view, 'Perso');
    const dialog = view.getByRole('dialog');
    fireEvent.change(within(dialog).getByRole('textbox'), { target: { value: '100' } });
    expect(view.getByText('Saisis entre 1 et 99 manches pour valider cette option.')).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Fermer' }));
    expect(view.getByRole('button', { name: /Lancer La Partie/i }).hasAttribute('disabled')).toBe(true);
    fireEvent.click(view.getByRole('button', { name: '← Partie rapide' }));
    expect(quickFormatText(view)).toBe('Premier à 2 manches · 1 contre 1');
    expect(inputValues(view)).toEqual(['Alice', 'Bruno']);
  });

  it('« Revenir au standard » rétablit le 1 contre 1 en 501, 3 manches, et garde les deux premiers prénoms (AC-08, AC-09)', () => {
    remember({ legsToWin: 2, checkOut: 'Master', playerNames: ['Alice', 'Bruno', 'Chloé', 'David'] });
    const { view, onStart } = renderQuick();

    fireEvent.click(view.getByTestId('setup-quick-reset-standard'));
    expect(quickFormatText(view)).toBe('Premier à 3 manches · 1 contre 1');
    expect(view.getByTestId('setup-quick-match').textContent).toContain('Fin sur un double');
    expect(inputValues(view)).toEqual(['Alice', 'Bruno']);
    expect(view.queryByTestId('setup-quick-reset-standard')).toBeNull();
    expect(storedFormat()).toContain('"playerNames":["Alice","Bruno"]');
    cleanup();

    const reopened = renderQuick(onStart);
    expect(quickFormatText(reopened.view)).toBe('Premier à 3 manches · 1 contre 1');
    expect(reopened.view.queryByTestId('setup-quick-reset-standard')).toBeNull();
    launch(reopened.view);
    expect(onStart.mock.calls[0][1]).toMatchObject({ startingScore: 501, legsToWin: 3, checkOut: 'Double' });
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

  it('mémorise le standard quand il est lancé depuis la partie rapide (AC-11, RM-03)', () => {
    remember({ legsToWin: 2 });
    const first = renderQuick();
    fireEvent.click(first.view.getByTestId('setup-quick-customize'));
    chooseLegs(first.view, '3');
    fireEvent.click(first.view.getByRole('button', { name: '← Partie rapide' }));
    launch(first.view);
    expect(first.onStart.mock.calls[0][1]).toMatchObject({ startingScore: 501, legsToWin: 3, checkOut: 'Double' });
    expect(storedFormat()).toContain('"legsToWin":3');
    cleanup();

    const second = renderQuick();
    expect(quickFormatText(second.view)).toBe('Premier à 3 manches · 1 contre 1');
    expect(second.view.queryByTestId('setup-quick-reset-standard')).toBeNull();
  });
});
