// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { InstallAppButton } from '../../../components/ui/InstallAppButton';
import { useInstallPrompt } from '../../../src/features/app-install/useInstallPrompt';

vi.mock('../../../src/features/app-install/useInstallPrompt', () => ({ useInstallPrompt: vi.fn() }));
const usePrompt = vi.mocked(useInstallPrompt);
const openInstallFlow = vi.fn();
const closeGuide = vi.fn();

beforeEach(() => {
  usePrompt.mockReturnValue({
    platform: 'ios', shouldShowInstallButton: true, canPromptDirectly: false, isGuideOpen: false,
    guideTitle: 'Installer depuis Safari', guideSteps: ['Partager', 'Sur ecran d accueil'],
    openInstallFlow, closeGuide,
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('InstallAppButton', () => {
  it('hides installation when unavailable and starts the direct prompt when offered', () => {
    const initial = usePrompt();
    usePrompt.mockReturnValue({ ...initial, shouldShowInstallButton: false });
    const view = render(<InstallAppButton />);
    expect(view.container.firstChild).toBeNull();
    usePrompt.mockReturnValue({ ...initial, canPromptDirectly: true });
    view.rerender(<InstallAppButton buttonClassName="custom-install" />);
    const button = view.getByRole('button', { name: 'Creer Un Raccourci' });
    expect(button.className).toBe('custom-install');
    fireEvent.click(button);
    expect(openInstallFlow).toHaveBeenCalledOnce();
  });

  it('shows instructions modally, focuses close, handles dismissal and restores overflow', async () => {
    vi.useFakeTimers();
    const showModal = vi.fn(function (this: HTMLDialogElement) { this.open = true; });
    const close = vi.fn(function (this: HTMLDialogElement) { this.open = false; });
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: showModal });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: close });
    const initial = usePrompt();
    usePrompt.mockReturnValue({ ...initial, isGuideOpen: true });
    document.body.style.overflow = 'auto';
    const view = render(<InstallAppButton />);
    expect(view.getByRole('dialog', { name: 'Installer depuis Safari' })).toBeTruthy();
    expect(view.getAllByRole('listitem')).toHaveLength(2);
    expect(view.getByText('Sur ecran d accueil')).toBeTruthy();
    expect(showModal).toHaveBeenCalledOnce();
    expect(document.body.style.overflow).toBe('hidden');
    await act(() => Promise.resolve().then(() => { vi.runOnlyPendingTimers(); }));
    expect(document.activeElement).toBe(view.getByRole('button', { name: 'Fermer' }));
    fireEvent.click(view.getByRole('button', { name: 'Fermer' }));
    fireEvent.click(view.getByRole('button', { name: 'Fermer le guide d installation' }));
    const cancel = new Event('cancel', { bubbles: false, cancelable: true });
    fireEvent(view.getByRole('dialog'), cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(closeGuide).toHaveBeenCalledTimes(3);
    usePrompt.mockReturnValue(initial);
    view.rerender(<InstallAppButton />);
    expect(view.queryByRole('dialog')).toBeNull();
    expect(close).toHaveBeenCalledOnce();
    expect(document.body.style.overflow).toBe('auto');
    document.body.style.overflow = '';
  });
});
