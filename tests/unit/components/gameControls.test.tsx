// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, renderHook, within } from '@testing-library/react';
import {
  ConfirmExitDialog,
  GameActionButton,
  GameHeader,
  GameHeaderActions,
  GameUndoButton,
  KeypadActionRow,
  KeypadGrid,
  KeypadKey,
  KeypadPanel,
  resolveUndoIntent,
  useExitConfirmation,
} from '../../../components/game/controls';

afterEach(() => {
  cleanup();
});

describe('GameActionButton', () => {
  it('gives each action the same label, icon and colour role everywhere', () => {
    const view = render(
      <>
        <GameActionButton action="undo" />
        <GameActionButton action="validate" label="OK" />
        <GameActionButton action="pass" />
        <GameActionButton action="miss" label="3 MISS" />
      </>,
    );
    const undo = view.getByRole('button', { name: 'Annuler' });
    expect(undo).toHaveProperty('dataset.action', 'undo');
    expect(undo.dataset.variant).toBe('secondary');
    expect(undo.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    expect(undo.getAttribute('title')).toBe('Annuler la dernière saisie');

    const ok = view.getByRole('button', { name: 'OK' });
    expect(ok.dataset.action).toBe('validate');
    expect(ok.dataset.variant).toBe('primary');

    expect(view.getByRole('button', { name: 'Passer' }).dataset.variant).toBe('primary');

    const miss = view.getByRole('button', { name: '3 MISS' });
    expect(miss.dataset.variant).toBe('keypad');
    expect(miss.dataset.tone).toBe('danger');
    expect(miss.querySelector('svg')).toBeNull();
  });

  it('renders header actions as square icon buttons with a mandatory accessible name', () => {
    const onClick = vi.fn();
    const view = render(<GameActionButton action="exit" display="icon" onClick={onClick} />);
    const exit = view.getByRole('button', { name: 'Quitter' });
    expect(exit.getAttribute('aria-label')).toBe('Quitter');
    expect(exit.dataset.tone).toBe('danger');
    expect(exit.className).toContain('bd-game-action--icon');
    expect(exit.querySelector('svg')).not.toBeNull();
    fireEvent.click(exit);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('keeps native props such as disabled and data-testid', () => {
    const onClick = vi.fn();
    const view = render(<GameActionButton action="undo" disabled data-testid="x01-keypad-undo" onClick={onClick} />);
    const undo = view.getByTestId('x01-keypad-undo');
    expect(undo).toHaveProperty('disabled', true);
    fireEvent.click(undo);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('GameUndoButton (C et Retour fusionnés)', () => {
  function undoButton(hasPendingInput: boolean, canUndoLast: boolean) {
    const handlers = { onClearInput: vi.fn(), onUndoLast: vi.fn() };
    const view = render(
      <GameUndoButton data-testid="x01-keypad-undo" hasPendingInput={hasPendingInput} canUndoLast={canUndoLast} {...handlers} />,
    );
    return { button: view.getByRole('button', { name: 'Annuler' }), ...handlers };
  }

  it('resolves the intent: pending input first, then the last validated visit, else nothing', () => {
    expect(resolveUndoIntent({ hasPendingInput: true, canUndoLast: true })).toBe('clear-input');
    expect(resolveUndoIntent({ hasPendingInput: true, canUndoLast: false })).toBe('clear-input');
    expect(resolveUndoIntent({ hasPendingInput: false, canUndoLast: true })).toBe('undo-last');
    expect(resolveUndoIntent({ hasPendingInput: false, canUndoLast: false })).toBe('none');
  });

  it('clears the pending input without undoing the last visit', () => {
    const { button, onClearInput, onUndoLast } = undoButton(true, true);
    expect(button.dataset.undoIntent).toBe('clear-input');
    expect(button.getAttribute('title')).toBe('Effacer la saisie en cours');
    fireEvent.click(button);
    expect(onClearInput).toHaveBeenCalledOnce();
    expect(onUndoLast).not.toHaveBeenCalled();
  });

  it('undoes the last validated visit when nothing is being typed', () => {
    const { button, onClearInput, onUndoLast } = undoButton(false, true);
    expect(button.dataset.undoIntent).toBe('undo-last');
    expect(button).toHaveProperty('disabled', false);
    fireEvent.click(button);
    expect(onUndoLast).toHaveBeenCalledOnce();
    expect(onClearInput).not.toHaveBeenCalled();
  });

  it('is disabled when there is nothing to undo, or when the caller disables it', () => {
    const { button, onClearInput, onUndoLast } = undoButton(false, false);
    expect(button.dataset.undoIntent).toBe('none');
    expect(button).toHaveProperty('disabled', true);
    fireEvent.click(button);
    expect(onClearInput).not.toHaveBeenCalled();
    expect(onUndoLast).not.toHaveBeenCalled();

    cleanup();
    const view = render(<GameUndoButton disabled hasPendingInput canUndoLast onClearInput={vi.fn()} onUndoLast={vi.fn()} />);
    expect(view.getByRole('button', { name: 'Annuler' })).toHaveProperty('disabled', true);
  });
});

describe('GameHeader', () => {
  it('shows brand, badge, clock and the standard actions with the exit isolated on the right', () => {
    const handlers = { onExit: vi.fn(), onStats: vi.fn(), onSettings: vi.fn() };
    const view = render(
      <GameHeader
        game="x01"
        data-testid="game-header"
        badge="501 · Double Out"
        compactBadge="501 DO"
        clock={{ time: '21:04', elapsed: '12:34' }}
        indicators={<span data-testid="turn-dots" />}
        {...handlers}
      />,
    );
    const header = view.getByTestId('game-header');
    expect(header.dataset.game).toBe('x01');
    expect(header.textContent).toContain('BOUGNAT DARTS');
    expect(view.getByText('501 DO').className).toContain('sm:hidden');
    expect(view.getByText('501 · Double Out').className).toContain('sm:inline');
    expect(view.getByText('21:04')).toBeTruthy();
    expect(view.getByRole('timer', { name: 'Durée de la partie' }).textContent).toBe('12:34');
    const actions = view.getByRole('group', { name: 'Actions de la partie' });
    expect(within(actions).getByTestId('turn-dots')).toBeTruthy();
    expect(within(actions).getAllByRole('button').map((button) => button.getAttribute('aria-label'))).toEqual(['Statistiques', 'Réglages', 'Quitter']);
  });

  it('keeps the same frame when a game has no clock time, no badge variant or no settings', () => {
    const view = render(<GameHeader game="killer" badge="Killer" clock={{ elapsed: '03:21' }} onExit={vi.fn()} />);
    expect(view.getByText('Killer').className).not.toContain('sm:inline');
    expect(view.getByRole('timer').textContent).toBe('03:21');
    expect(view.getAllByRole('button').map((button) => button.getAttribute('aria-label'))).toEqual(['Quitter']);

    cleanup();
    const bare = render(<GameHeader game="gotcha" onExit={vi.fn()} />);
    expect(bare.queryByRole('timer')).toBeNull();
    expect(bare.container.querySelector('.bd-game-header-badge')).toBeNull();
  });
});

describe('GameHeaderActions', () => {
  it('orders stats, settings then an isolated exit, and omits absent actions', () => {
    const handlers = { onExit: vi.fn(), onStats: vi.fn(), onSettings: vi.fn() };
    const view = render(
      <GameHeaderActions {...handlers}>
        <span data-testid="turn-dots" />
      </GameHeaderActions>,
    );
    const group = view.getByRole('group', { name: 'Actions de la partie' });
    const buttons = within(group).getAllByRole('button');
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual(['Statistiques', 'Réglages', 'Quitter']);
    expect(group.firstElementChild).toBe(view.getByTestId('turn-dots'));
    expect(buttons[2].className).toContain('bd-game-header-exit');
    buttons.forEach((button) => fireEvent.click(button));
    expect(handlers.onStats).toHaveBeenCalledOnce();
    expect(handlers.onSettings).toHaveBeenCalledOnce();
    expect(handlers.onExit).toHaveBeenCalledOnce();

    cleanup();
    const minimal = render(<GameHeaderActions onExit={vi.fn()} />);
    expect(minimal.getAllByRole('button').map((button) => button.getAttribute('aria-label'))).toEqual(['Quitter']);
  });
});

describe('ConfirmExitDialog', () => {
  it('renders nothing while closed', () => {
    const view = render(<ConfirmExitDialog open={false} onCancel={vi.fn()} onConfirm={vi.fn()} />);
    expect(view.queryByRole('dialog')).toBeNull();
  });

  it('is a labelled dialog with Non (secondary, left, focused) then Oui (danger, right)', () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    const view = render(<ConfirmExitDialog open onCancel={onCancel} onConfirm={onConfirm} />);
    const dialog = view.getByRole('dialog', { name: 'Quitter la partie ?' });
    expect(dialog.getAttribute('aria-describedby')).toBeTruthy();
    expect(view.getByText('La partie en cours sera abandonnée.').id).toBe(dialog.getAttribute('aria-describedby'));
    const [no, yes] = within(dialog).getAllByRole('button');
    expect(no.textContent).toBe('Non');
    expect(no.dataset.variant).toBe('secondary');
    expect(yes.textContent).toBe('Oui');
    expect(yes.dataset.variant).toBe('danger');
    expect(document.activeElement).toBe(no);

    fireEvent.click(no);
    expect(onCancel).toHaveBeenCalledOnce();
    fireEvent.click(yes);
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('cancels on Escape, keeps the focus inside and returns it to the trigger', () => {
    const onCancel = vi.fn();
    const trigger = document.createElement('button');
    document.body.append(trigger);
    trigger.focus();
    const view = render(<ConfirmExitDialog open title="Quitter le match ?" onCancel={onCancel} onConfirm={vi.fn()} />);
    const dialog = view.getByRole('dialog', { name: 'Quitter le match ?' });
    const no = view.getByTestId('confirm-exit-cancel');
    const yes = view.getByTestId('confirm-exit-confirm');

    yes.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(no);
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(yes);
    fireEvent.keyDown(dialog, { key: 'Enter' });
    expect(onCancel).not.toHaveBeenCalled();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledOnce();

    view.rerender(<ConfirmExitDialog open={false} onCancel={onCancel} onConfirm={vi.fn()} />);
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});

describe('useExitConfirmation', () => {
  it('always asks before leaving and closes the dialog before calling onExit', () => {
    const onExit = vi.fn();
    const { result } = renderHook(() => useExitConfirmation(onExit));
    expect(result.current.dialogProps.open).toBe(false);

    act(() => result.current.requestExit());
    expect(result.current.dialogProps.open).toBe(true);
    expect(onExit).not.toHaveBeenCalled();
    act(() => result.current.dialogProps.onCancel());
    expect(result.current.dialogProps.open).toBe(false);

    act(() => result.current.requestExit());
    act(() => result.current.dialogProps.onConfirm());
    expect(result.current.dialogProps.open).toBe(false);
    expect(onExit).toHaveBeenCalledOnce();
  });
});

describe('KeypadKey', () => {
  it('exposes tone, multiplier, key id, size and grid placement', () => {
    const onClick = vi.fn();
    const view = render(
      <KeypadKey tone="dbull" multiplier={2} keyId="dbull" size="label" span={2} rowSpan={3} onClick={onClick}>
        D-BULL (50)
      </KeypadKey>,
    );
    const key = view.getByRole('button', { name: 'D-BULL (50)' });
    expect(key.dataset).toMatchObject({ variant: 'keypad', tone: 'dbull', multiplier: '2', key: 'dbull', size: 'label' });
    expect(key.getAttribute('type')).toBe('button');
    expect(key.hasAttribute('aria-pressed')).toBe(false);
    expect(key.hasAttribute('data-state')).toBe(false);
    expect(key.style.gridColumn).toBe('span 2 / span 2');
    expect(key.style.gridRow).toBe('span 3 / span 3');
    expect(key.className).toContain('bd-key');
    fireEvent.click(key);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('marks toggle keys with aria-pressed and data-state, explicit states taking precedence', () => {
    const view = render(
      <>
        <KeypadKey tone="triple" multiplier={3} selected>TRIPLE</KeypadKey>
        <KeypadKey tone="double" multiplier={2} selected={false}>DOUBLE</KeypadKey>
        <KeypadKey size="digit" state="finish" data-testid="x01-keypad-1">1</KeypadKey>
        <KeypadKey disabled state="taken">7</KeypadKey>
      </>,
    );
    const triple = view.getByRole('button', { name: 'TRIPLE', pressed: true });
    expect(triple.dataset.state).toBe('selected');
    const double = view.getByRole('button', { name: 'DOUBLE', pressed: false });
    expect(double.dataset.state).toBe('idle');
    const one = view.getByTestId('x01-keypad-1');
    expect(one.dataset).toMatchObject({ tone: 'neutral', size: 'digit', state: 'finish' });
    expect(one.hasAttribute('data-multiplier')).toBe(false);
    expect(one.style.gridColumn).toBe('');
    const taken = view.getByRole('button', { name: '7' });
    expect(taken).toHaveProperty('disabled', true);
    expect(taken.dataset.state).toBe('taken');
  });

  it('lets a game override a semantic attribute (X01 RESTE keeps data-tone="info")', () => {
    const view = render(<KeypadKey data-tone="info" size="label">RESTE</KeypadKey>);
    expect(view.getByRole('button', { name: 'RESTE' }).dataset.tone).toBe('info');
  });
});

describe('KeypadGrid, KeypadPanel and KeypadActionRow', () => {
  it('drives the grid template through data attributes and CSS variables', () => {
    const view = render(
      <KeypadPanel data-testid="panel">
        <KeypadGrid columns={4} rows={4} label="Total de la visite" data-testid="digits">
          <KeypadKey>1</KeypadKey>
        </KeypadGrid>
        <KeypadGrid columns="auto" maxColumns={7} fill={false} data-testid="targets">
          <KeypadKey>20</KeypadKey>
        </KeypadGrid>
      </KeypadPanel>,
    );
    expect(view.getByTestId('panel').className).toContain('bd-keypad');
    const digits = view.getByRole('group', { name: 'Total de la visite' });
    expect(digits.dataset).toMatchObject({ columns: '4', rows: '4', fill: 'true' });
    expect(digits.style.getPropertyValue('--bd-keypad-cols')).toBe('4');
    expect(digits.style.getPropertyValue('--bd-keypad-rows')).toBe('4');

    const targets = view.getByTestId('targets');
    expect(targets.hasAttribute('role')).toBe(false);
    expect(targets.dataset).toMatchObject({ columns: 'auto', fill: 'false' });
    expect(targets.hasAttribute('data-rows')).toBe(false);
    expect(targets.style.getPropertyValue('--bd-keypad-cols')).toBe('');
    expect(targets.style.getPropertyValue('--bd-keypad-max-cols')).toBe('7');
  });

  it('always places Annuler first and the turn-ending action last, game keys in between', () => {
    const view = render(
      <KeypadActionRow
        columns={4}
        data-testid="capital-keypad-actions"
        validate={<GameActionButton action="miss" />}
        undo={<GameActionButton action="undo" />}
      >
        <KeypadKey tone="bull" multiplier={1} span={2}>BULL (25)</KeypadKey>
      </KeypadActionRow>,
    );
    const row = view.getByRole('group', { name: 'Actions du tour' });
    expect(row).toBe(view.getByTestId('capital-keypad-actions'));
    expect(row.style.getPropertyValue('--bd-action-cols')).toBe('4');
    expect(within(row).getAllByRole('button').map((button) => button.textContent)).toEqual(['Annuler', 'BULL (25)', 'MISS']);

    cleanup();
    const auto = render(<KeypadActionRow undo={<GameActionButton action="undo" />} validate={<GameActionButton action="validate" />} />);
    const autoRow = auto.getByRole('group');
    expect(autoRow.hasAttribute('data-columns')).toBe(false);
    expect(within(autoRow).getAllByRole('button').map((button) => button.textContent)).toEqual(['Annuler', 'Valider']);
  });
});
