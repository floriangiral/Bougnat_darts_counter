// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { MatchSettingsModal } from '../../../components/match/MatchSettingsModal';

afterEach(cleanup);

function settings() {
  return {
    canCustomizeSideShortcuts: true, leftShortcutDrafts: ['26', '45'], rightShortcutDrafts: ['100', '180'],
    showHints: true, voiceAssistEnabled: true, voiceScoringAvailable: true, onClose: vi.fn(),
    onDismissVoiceProposal: vi.fn(), onResetShortcutDraft: vi.fn(), onShortcutDraftChange: vi.fn(),
    onToggleHints: vi.fn(), onToggleVoiceAssist: vi.fn(),
  };
}

describe('MatchSettingsModal', () => {
  it('edits and restores each shortcut with its side and index and forwards close', () => {
    const props = settings();
    const view = render(<MatchSettingsModal {...props} />);
    expect(view.getByRole('dialog', { name: 'Options de jeu' })).toBeTruthy();
    const inputs = view.getAllByRole('textbox');
    expect(inputs.map((node) => (node as HTMLInputElement).value)).toEqual(['26', '45', '100', '180']);
    inputs.forEach((input, index) => {
      fireEvent.change(input, { target: { value: '60' } });
      expect(props.onShortcutDraftChange).toHaveBeenLastCalledWith(index < 2 ? 'left' : 'right', index % 2, '60');
      fireEvent.blur(input);
      expect(props.onResetShortcutDraft).toHaveBeenLastCalledWith(index < 2 ? 'left' : 'right', index % 2);
    });
    fireEvent.click(view.getByRole('button', { name: 'Fermer' }));
    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it('toggles hints and dismisses pending voice proposals only when disabling assistance', () => {
    const props = settings();
    const view = render(<MatchSettingsModal {...props} />);
    const hints = view.getByText('Suggestions de finish').parentElement?.parentElement;
    const voice = view.getByText('Assistance vocale IA').parentElement?.parentElement;
    fireEvent.click(within(hints).getByRole('button', { name: 'Actif' }));
    expect(props.onToggleHints).toHaveBeenCalledOnce();
    fireEvent.click(within(voice).getByRole('button', { name: 'Actif' }));
    expect(props.onDismissVoiceProposal).toHaveBeenCalledOnce();
    expect(props.onToggleVoiceAssist).toHaveBeenCalledOnce();
    view.rerender(<MatchSettingsModal {...props} showHints={false} voiceAssistEnabled={false} />);
    expect(within(hints).getByRole('button', { name: 'Off' })).toBeTruthy();
    fireEvent.click(within(voice).getByRole('button', { name: 'Off' }));
    expect(props.onDismissVoiceProposal).toHaveBeenCalledOnce();
    expect(props.onToggleVoiceAssist).toHaveBeenCalledTimes(2);
  });

  it('omits unsupported voice controls and explains why shortcuts cannot be customized', () => {
    const view = render(<MatchSettingsModal {...settings()} voiceScoringAvailable={false} canCustomizeSideShortcuts={false} />);
    expect(view.queryByText('Assistance vocale IA')).toBeNull();
    expect(view.queryByRole('textbox')).toBeNull();
    expect(view.getByText(/La modification sera disponible automatiquement/)).toBeTruthy();
  });
});
