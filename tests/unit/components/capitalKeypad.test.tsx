// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { CapitalKeypad } from '../../../components/game/CapitalKeypad';
import { CricketKeypad } from '../../../components/game/CricketKeypad';
import type { CapitalTarget, GameConfig, Player } from '../../../types';
import { CapitalGameView } from '../../../views/CapitalGameView';
import type { CapitalRuntimeSnapshot } from '../../../src/shared/session/persistedAppSession';

afterEach(cleanup);

function renderKeypad(target: CapitalTarget, canUndo = true) {
  const onDartInput = vi.fn();
  const onUndo = vi.fn();
  const onBackspace = vi.fn();
  return {
    ...render(<CapitalKeypad target={target} canUndo={canUndo} onDartInput={onDartInput} onUndo={onUndo} onBackspace={onBackspace} />),
    onDartInput,
    onUndo,
    onBackspace,
  };
}

describe('CapitalKeypad', () => {
  it('validates totals, limits input length and merges C and Retour into Annuler', () => {
    const view = renderKeypad('CAPITAL');
    const press = (name: string) => fireEvent.click(view.getByRole('button', { name }));
    expect(view.queryByRole('button', { name: 'C' })).toBeNull();
    press('OK');
    expect(view.onDartInput).not.toHaveBeenCalled();
    for (const digit of ['1', '8', '0', '9']) press(digit);
    press('OK');
    expect(view.onDartInput).toHaveBeenLastCalledWith({ value: 180, multiplier: 1 });
    expect(view.getByText('---')).toBeTruthy();

    press('9');
    press('9');
    press('9');
    press('OK');
    expect(view.onDartInput).toHaveBeenCalledTimes(1);
    // Saisie en cours : Annuler l'efface (ancienne touche C), sans revenir sur l'entrée validée.
    press('Annuler');
    expect(view.getByText('---')).toBeTruthy();
    expect(view.onBackspace).toHaveBeenCalledOnce();
    expect(view.onUndo).not.toHaveBeenCalled();
    press('4');
    press('5');
    expect(view.getByRole('button', { name: 'Annuler' }).dataset.undoIntent).toBe('clear-input');
    press('Annuler');
    expect(view.onBackspace).toHaveBeenCalledTimes(2);
    expect(view.onUndo).not.toHaveBeenCalled();
    // Aucune saisie : Annuler revient sur la dernière entrée validée (ancienne touche Retour).
    expect(view.getByRole('button', { name: 'Annuler' }).dataset.undoIntent).toBe('undo-last');
    press('Annuler');
    expect(view.onUndo).toHaveBeenCalledOnce();
    press('7');
    press('MISS');
    expect(view.onDartInput).toHaveBeenLastCalledWith({ value: 0, multiplier: 1 });
    expect(view.getByText('---')).toBeTruthy();
  });

  it('disables Annuler on the Capital digits only when there is neither input nor history', () => {
    const view = renderKeypad('CAPITAL', false);
    const undo = () => view.getByRole('button', { name: 'Annuler' });
    expect(undo().hasAttribute('disabled')).toBe(true);
    fireEvent.click(view.getByRole('button', { name: '3' }));
    expect(undo().hasAttribute('disabled')).toBe(false);
    fireEvent.click(undo());
    expect(view.getByText('---')).toBeTruthy();
    expect(undo().hasAttribute('disabled')).toBe(true);
    expect(view.onUndo).not.toHaveBeenCalled();
  });

  it('places Annuler left of OK in the bottom row of the Capital digits', () => {
    const view = renderKeypad('CAPITAL');
    const keys = Array.from(view.container.querySelectorAll<HTMLElement>('.capital-digit-grid > button')).map((key) => key.dataset.key);
    expect(keys.slice(-2)).toEqual(['undo', 'ok']);
    expect(keys).not.toContain('clear');
  });

  it.each(['20', '19', '18', '17', '16', '15', '14', '13'] as const)('emits fixed multipliers for target %s', (target) => {
    const view = renderKeypad(target);
    for (const [prefix, multiplier] of [['S', 1], ['D', 2], ['T', 3]] as const) {
      fireEvent.click(view.getByRole('button', { name: `${prefix}${target}` }));
      expect(view.onDartInput).toHaveBeenLastCalledWith({ value: Number(target), multiplier });
    }
    fireEvent.click(view.getByRole('button', { name: 'MISS' }));
    expect(view.onDartInput).toHaveBeenLastCalledWith({ value: 0, multiplier: 1 });
    fireEvent.click(view.getByRole('button', { name: 'Annuler' }));
    expect(view.onUndo).toHaveBeenCalledOnce();
  });

  it.each([
    ['CENTRE', 'BULL (25)', 25, 1],
    ['CENTRE', 'D-BULL (50)', 25, 2],
    ['DOUBLE', 'D20', 20, 2],
    ['DOUBLE', 'D-BULL (50)', 25, 2],
    ['TRIPLE', 'T19', 19, 3],
  ] as const)('handles %s action %s', (target, label, value, multiplier) => {
    const view = renderKeypad(target);
    fireEvent.click(view.getByRole('button', { name: label }));
    expect(view.onDartInput).toHaveBeenLastCalledWith({ value, multiplier });
    fireEvent.click(view.getByRole('button', { name: 'Annuler' }));
    expect(view.onUndo).toHaveBeenCalledOnce();
    fireEvent.click(view.getByRole('button', { name: 'MISS' }));
    expect(view.onDartInput).toHaveBeenLastCalledWith({ value: 0, multiplier: 1 });
  });

  it.each(['SUITE', 'COTE_A_COTE', 'COULEUR', '21_OU_MOINS'] as const)('resets the multiplier after a hit on %s', (target) => {
    const view = renderKeypad(target);
    fireEvent.click(view.getByRole('button', { name: 'DOUBLE' }));
    fireEvent.click(view.getByRole('button', { name: '20' }));
    expect(view.onDartInput).toHaveBeenLastCalledWith({ value: 20, multiplier: 2 });
    fireEvent.click(view.getByRole('button', { name: '20' }));
    expect(view.onDartInput).toHaveBeenLastCalledWith({ value: 20, multiplier: 1 });
    fireEvent.click(view.getByRole('button', { name: 'TRIPLE' }));
    expect(view.queryByRole('button', { name: 'BULL (25)' })).toBeNull();
    fireEvent.click(view.getByRole('button', { name: 'MISS' }));
    fireEvent.click(view.getByRole('button', { name: 'DOUBLE' }));
    fireEvent.click(view.getByRole('button', { name: 'D-BULL (50)' }));
    expect(view.onDartInput).toHaveBeenLastCalledWith({ value: 25, multiplier: 2 });
    fireEvent.click(view.getByRole('button', { name: 'SIMPLE' }));
    fireEvent.click(view.getByRole('button', { name: 'BULL (25)' }));
    expect(view.onDartInput).toHaveBeenLastCalledWith({ value: 25, multiplier: 1 });
  });

  it('preserves the multiplier for the 57 challenge and disables undo without history', () => {
    const view = renderKeypad('57', false);
    expect(view.getByRole('button', { name: 'Annuler' }).hasAttribute('disabled')).toBe(true);
    fireEvent.click(view.getByRole('button', { name: 'TRIPLE' }));
    expect(view.queryByRole('button', { name: /BULL/ })).toBeNull();
    fireEvent.click(view.getByRole('button', { name: '19' }));
    fireEvent.click(view.getByRole('button', { name: '1' }));
    expect(view.onDartInput.mock.calls).toEqual([
      [{ value: 19, multiplier: 3 }],
      [{ value: 1, multiplier: 3 }],
    ]);
    fireEvent.click(view.getByRole('button', { name: 'DOUBLE' }));
    fireEvent.click(view.getByRole('button', { name: 'D-BULL (50)' }));
    expect(view.onDartInput).toHaveBeenLastCalledWith({ value: 25, multiplier: 2 });
    fireEvent.click(view.getByRole('button', { name: 'SIMPLE' }));
    fireEvent.click(view.getByRole('button', { name: 'BULL (25)' }));
    expect(view.onDartInput).toHaveBeenLastCalledWith({ value: 25, multiplier: 1 });
    fireEvent.click(view.getByRole('button', { name: 'MISS' }));
    expect(view.onDartInput).toHaveBeenLastCalledWith({ value: 0, multiplier: 1 });
  });

  // Spec ref: specs/054-counter-impossible-totals-validation (AC-02, AC-03).
  it.each([163, 166, 169, 172, 173, 175, 176, 178, 179])(
    'refuses the unreachable Capital total %i with a message and keeps the input editable',
    (total) => {
      const view = renderKeypad('CAPITAL');
      const press = (name: string) => fireEvent.click(view.getByRole('button', { name }));
      for (const digit of String(total)) press(digit);
      press('OK');

      expect(view.onDartInput).not.toHaveBeenCalled();
      expect(view.getByRole('alert').textContent).toBe('SCORE IMPOSSIBLE');
      expect(view.getByText(String(total))).toBeTruthy();

      press('Annuler');
      expect(view.queryByRole('alert')).toBeNull();
      expect(view.getByText('---')).toBeTruthy();
      press('6');
      press('0');
      press('OK');
      expect(view.onDartInput).toHaveBeenLastCalledWith({ value: 60, multiplier: 1 });
      expect(view.queryByRole('alert')).toBeNull();
    },
  );

  // Spec ref: specs/054-counter-impossible-totals-validation (AC-05) et spec 066 (FR-02, FR-07) :
  // les tests lisent data-tone / data-multiplier, jamais une classe de couleur.
  const expectTone = (element: HTMLElement, tone: string, multiplier: string) => {
    expect(element.dataset.tone).toBe(tone);
    expect(element.dataset.multiplier).toBe(multiplier);
    expect(element.className).not.toMatch(/(^|\s)!|focus:outline-none/);
  };

  it('uses the shared target convention on every Capital keypad mode', () => {
    let view = renderKeypad('20');
    expectTone(view.getByRole('button', { name: 'S20' }), 'neutral', '1');
    expectTone(view.getByRole('button', { name: 'D20' }), 'double', '2');
    expectTone(view.getByRole('button', { name: 'T20' }), 'triple', '3');
    cleanup();

    view = renderKeypad('CENTRE');
    expectTone(view.getByRole('button', { name: 'BULL (25)' }), 'bull', '1');
    expectTone(view.getByRole('button', { name: 'D-BULL (50)' }), 'dbull', '2');
    cleanup();

    view = renderKeypad('DOUBLE');
    expectTone(view.getByRole('button', { name: 'D20' }), 'double', '2');
    expectTone(view.getByRole('button', { name: 'D-BULL (50)' }), 'dbull', '2');
    cleanup();

    view = renderKeypad('TRIPLE');
    expectTone(view.getByRole('button', { name: 'T20' }), 'triple', '3');
    cleanup();

    for (const target of ['SUITE', '57'] as const) {
      view = renderKeypad(target);
      const mode = (name: string) => view.getByRole('button', { name });
      expectTone(mode('DOUBLE'), 'double', '2');
      expectTone(mode('TRIPLE'), 'triple', '3');
      expect(mode('SIMPLE').getAttribute('aria-pressed')).toBe('true');
      expectTone(view.getByRole('button', { name: '20' }), 'neutral', '1');
      expectTone(mode('BULL (25)'), 'bull', '1');
      fireEvent.click(mode('DOUBLE'));
      expect(mode('DOUBLE').dataset.state).toBe('selected');
      expect(mode('SIMPLE').dataset.state).toBe('idle');
      expectTone(view.getByRole('button', { name: '20' }), 'double', '2');
      expectTone(mode('D-BULL (50)'), 'dbull', '2');
      fireEvent.click(mode('TRIPLE'));
      expect(mode('TRIPLE').getAttribute('aria-pressed')).toBe('true');
      expectTone(view.getByRole('button', { name: '20' }), 'triple', '3');
      cleanup();
    }
  });

  // Spec 066 AC-01 : la touche T20 a le même ton (et donc la même couleur calculée) au Cricket et au Capital.
  it('gives T20 the same triple tone and colour classes in Cricket and Capital', () => {
    const capital = renderKeypad('20');
    const capitalT20 = capital.getByRole('button', { name: 'T20' });
    const cricket = render(<CricketKeypad onHit={vi.fn()} onMiss={vi.fn()} onTripleMiss={vi.fn()} onUndo={vi.fn()} canUndo={false} />);
    const cricketT20 = cricket.getAllByRole('button', { name: '20' }).find((key) => key.dataset.multiplier === '3');

    expect(cricketT20?.dataset.tone).toBe('triple');
    expect(capitalT20.dataset.tone).toBe('triple');
    const colourClasses = (element: HTMLElement) => element.className.split(/\s+/).filter((name) => /(^|:)(bg|text|border)-/.test(name) && name.includes('game-')).sort();
    expect(colourClasses(capitalT20)).toEqual(colourClasses(cricketT20 as HTMLElement));
    expect(colourClasses(capitalT20).length).toBeGreaterThan(0);
  });
});

// Tablette portrait : le joueur actif passe en pleine largeur, les adversaires en grille (data-player-count),
// et un objectif long (« Bulle (25) ou D-Bulle (50) ») est réduit pour tenir sur une ligne (data-length).
describe('CapitalGameView — présentation tablette portrait', () => {
  const capitalPlayers: Player[] = ['Anne', 'Bruno', 'Chloé', 'Dina'].map((name) => ({ id: name.toLowerCase(), name, teamId: name.toLowerCase() }));
  const config = { startingScore: 501, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS', legsToWin: 1, setsToWin: 1, isDoubles: false, initialStartingPlayerIndex: 0 } as GameConfig;
  const renderView = (restoredState: CapitalRuntimeSnapshot | null = null) => render(
    <CapitalGameView players={capitalPlayers} config={config} onExit={vi.fn()} onFinish={vi.fn()} skipStartingPlayerPrompt restoredState={restoredState} />,
  );

  it('expose le nombre de joueurs, un seul joueur actif et la longueur de l’objectif', () => {
    const onStateChange = vi.fn<(snapshot: CapitalRuntimeSnapshot) => void>();
    const view = render(<CapitalGameView players={capitalPlayers} config={config} onExit={vi.fn()} onFinish={vi.fn()} skipStartingPlayerPrompt onStateChange={onStateChange} />);
    const list = view.container.querySelector('.capital-players') as HTMLElement;
    expect(list.dataset.playerCount).toBe('4');
    const states = Array.from(list.querySelectorAll<HTMLElement>('.capital-player')).map((card) => card.dataset.state);
    expect(states.filter((state) => state === 'active')).toHaveLength(1);
    expect(list.querySelector('[data-state="active"]')?.textContent).toContain('▶');
    expect(view.container.querySelector('.capital-objective-name')?.getAttribute('data-length')).toBe('short');

    const snapshot = onStateChange.mock.calls[0][0];
    cleanup();
    const atCentre = {
      ...snapshot,
      state: { ...snapshot.state, states: snapshot.state.states.map((player) => ({ ...player, targetIndex: 16 })) },
    };
    renderView(atCentre);
    expect(screen.getByText('Bulle (25) ou D-Bulle (50)').getAttribute('data-length')).toBe('long');
  });
});
