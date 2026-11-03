// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { SetupPlayersSection } from '../../../components/game-setup/SetupPlayersSection';
import { PlayerNameField } from '../../../components/game-setup/PlayerNameField';

afterEach(cleanup);

function setup(overrides: Partial<ComponentProps<typeof SetupPlayersSection>> = {}) {
  const props: ComponentProps<typeof SetupPlayersSection> = {
    gameType: 'X01', isDoubles: false, playerNames: ['Alice', 'Bob'],
    team1Names: ['Alice', 'Anne'], team2Names: ['Bob', 'Bill'],
    teamStarterIds: { team1: 't1p1', team2: 't2p1' }, playAgainstBot: false, botLevel: 'AMATEUR',
    onSetDoubles: vi.fn(), onSetPlayerCount: vi.fn(), onUpdatePlayerName: vi.fn(),
    onUpdateTeamName: vi.fn(), onUpdateTeamStarter: vi.fn(), onToggleBot: vi.fn(),
    onSetBotLevel: vi.fn(), ...overrides,
  };
  return { ...render(<SetupPlayersSection {...props} />), props };
}

describe('PlayerNameField', () => {
  it('selects the current name on focus and forwards edits without changing a controlled value', () => {
    const onChange = vi.fn();
    const view = render(<PlayerNameField label="Joueur 1" value="Alice" placeholder="Nom" onChange={onChange} />);
    const input = view.getByRole('textbox') as HTMLInputElement;
    fireEvent.focus(input);
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(5);
    fireEvent.change(input, { target: { value: 'Anne' } });
    expect(onChange).toHaveBeenCalledWith('Anne');
    expect(input.value).toBe('Alice');
    view.rerender(<PlayerNameField label="Joueur 1" value="Anne" placeholder="Nom" onChange={onChange} compact />);
    expect(input.value).toBe('Anne');
    expect(input.className).toContain('text-sm');
  });
});

describe('SetupPlayersSection', () => {
  it('edits singles, switches modes and selects player counts and the bot opponent', () => {
    const view = setup();
    fireEvent.change(view.getByPlaceholderText('Joueur 2'), { target: { value: 'Bobby' } });
    expect(view.props.onUpdatePlayerName).toHaveBeenCalledWith(1, 'Bobby');
    fireEvent.click(view.getByRole('button', { name: 'Simple' }));
    fireEvent.click(view.getByRole('button', { name: 'Doublettes' }));
    expect(view.props.onSetDoubles).toHaveBeenNthCalledWith(1, false);
    expect(view.props.onSetDoubles).toHaveBeenNthCalledWith(2, true);
    fireEvent.click(view.getByRole('button', { name: '2' }));
    expect(view.props.onSetPlayerCount).toHaveBeenCalledWith(2);
    fireEvent.click(view.getByRole('checkbox', { name: 'Jouer contre un robot' }));
    expect(view.props.onToggleBot).toHaveBeenCalledWith(true);
  });

  it('shows only the human name in bot mode and forwards bot level selections', () => {
    const view = setup({ playAgainstBot: true });
    expect(view.getAllByRole('textbox')).toHaveLength(1);
    expect(view.getByText('Adversaire robot')).toBeTruthy();
    expect(view.getByText('Robot Amateur')).toBeTruthy();
    const levels = view.getAllByRole('checkbox').slice(1);
    expect(levels).toHaveLength(5);
    fireEvent.click(levels[4]);
    expect(view.props.onSetBotLevel).toHaveBeenCalledWith('PRO');
    fireEvent.click(view.getByRole('checkbox', { name: 'Jouer contre un robot' }));
    expect(view.props.onToggleBot).toHaveBeenCalledWith(false);
  });

  it('edits all doubles names and chooses each duo starter without bot controls', () => {
    const view = setup({ isDoubles: true });
    for (let index = 0; index < 4; index++) {
      fireEvent.change(view.getByPlaceholderText(`Joueur ${index + 1}`), { target: { value: `Name ${index}` } });
      expect(view.props.onUpdateTeamName).toHaveBeenLastCalledWith(index < 2 ? 1 : 2, index % 2, `Name ${index}`);
    }
    fireEvent.click(view.getByRole('button', { name: 'Anne' }));
    fireEvent.click(view.getByRole('button', { name: 'Bill' }));
    expect(view.props.onUpdateTeamStarter).toHaveBeenCalledWith('team1', 't1p2');
    expect(view.props.onUpdateTeamStarter).toHaveBeenCalledWith('team2', 't2p2');
    expect(view.queryByRole('checkbox')).toBeNull();
  });

  it('omits unsupported doubles and bot controls for Capital', () => {
    const view = setup({ gameType: 'CAPITAL' });
    expect(view.queryByRole('button', { name: 'Doublettes' })).toBeNull();
    expect(view.queryByRole('checkbox')).toBeNull();
    expect(view.getAllByRole('textbox')).toHaveLength(2);
  });
});
