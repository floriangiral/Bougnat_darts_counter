// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import {
  ExternalMatchConflictDialog,
  ExternalMatchLeaveDialog,
} from '../../../components/external-match/ExternalMatchDialogs';
import { SetupExternalMatchBanner } from '../../../components/game-setup/SetupExternalMatchBanner';
import { formatExternalMatchup } from '../../../src/presentation/externalMatch/externalMatchLabels.fr';

// Spec ref: spec:counter/external-match-link
afterEach(cleanup);

describe('formatExternalMatchup', () => {
  it('formats singles and doubles matchups in link order', () => {
    expect(formatExternalMatchup(['Alice', 'Bob'])).toBe('Alice vs Bob');
    expect(formatExternalMatchup(['Alice', 'Carl', 'Bob', 'Dan'])).toBe('Alice / Carl vs Bob / Dan');
  });
});

describe('SetupExternalMatchBanner', () => {
  it('names the external app and hints the doubles starter choice only in doubles', () => {
    const view = render(<SetupExternalMatchBanner host="badarts.fr" isDoubles={false} />);
    expect(view.getByTestId('setup-external-match-banner').textContent).toContain('Joueurs et format fixés par badarts.fr');
    expect(view.queryByText(/qui commence dans chaque duo/)).toBeNull();
    view.rerender(<SetupExternalMatchBanner host="badarts.fr" isDoubles />);
    expect(view.getByText(/qui commence dans chaque duo/)).toBeTruthy();
  });
});

describe('ExternalMatchLeaveDialog', () => {
  const callbacks = () => ({ onNotify: vi.fn(), onLeave: vi.fn(), onCancel: vi.fn() });

  it('offers to tell the external app about an abandon, leave silently or stay', () => {
    const props = callbacks();
    const view = render(<ExternalMatchLeaveDialog kind="abandon" host="badarts.fr" {...props} />);
    expect(view.getByRole('dialog', { name: 'Quitter le match du tournoi ?' })).toBeTruthy();
    expect(view.getByText(/ouvert depuis badarts.fr/)).toBeTruthy();
    expect(view.getByText('badarts.fr sera prévenu que le match est abandonné.')).toBeTruthy();
    fireEvent.click(view.getByTestId('external-leave-notify'));
    fireEvent.click(view.getByTestId('external-leave-confirm'));
    fireEvent.click(view.getByTestId('external-leave-cancel'));
    expect(props.onNotify).toHaveBeenCalledOnce();
    expect(props.onLeave).toHaveBeenCalledOnce();
    expect(props.onCancel).toHaveBeenCalledOnce();
    expect(view.getByTestId('external-leave-notify').textContent).toBe('Retour au tournoi');
    expect(view.getByTestId('external-leave-confirm').textContent).toBe('Quitter sans prévenir');
  });

  it('offers to send an unsent result before leaving', () => {
    const view = render(<ExternalMatchLeaveDialog kind="unsent-result" host="badarts.fr" {...callbacks()} />);
    expect(view.getByRole('dialog', { name: 'Résultat non envoyé' })).toBeTruthy();
    expect(view.getByTestId('external-leave-notify').textContent).toBe('Envoyer le résultat');
    expect(view.getByTestId('external-leave-confirm').textContent).toBe('Quitter sans envoyer');
    expect(view.getByText('Retour vers badarts.fr.')).toBeTruthy();
  });

  it('hides the notify action when there is nothing valid to send', () => {
    const view = render(<ExternalMatchLeaveDialog kind="abandon" host="badarts.fr" {...callbacks()} onNotify={null} />);
    expect(view.queryByTestId('external-leave-notify')).toBeNull();
    expect(view.getByTestId('external-leave-confirm')).toBeTruthy();
  });
});

describe('ExternalMatchConflictDialog', () => {
  it('protects a match in progress and shows the incoming match', () => {
    const onOpenLink = vi.fn();
    const onKeepCurrent = vi.fn();
    const view = render(
      <ExternalMatchConflictDialog
        conflict="match-in-progress"
        incomingPlayerNames={['Alice', 'Bob']}
        previousHost={null}
        onOpenLink={onOpenLink}
        onKeepCurrent={onKeepCurrent}
      />,
    );
    expect(view.getByRole('dialog', { name: 'Une partie est en cours' })).toBeTruthy();
    expect(view.getByText('Nouveau match : Alice vs Bob')).toBeTruthy();
    expect(view.getByTestId('external-conflict-keep').textContent).toBe('Reprendre la partie');
    fireEvent.click(view.getByTestId('external-conflict-keep'));
    fireEvent.click(view.getByTestId('external-conflict-open'));
    expect(onKeepCurrent).toHaveBeenCalledOnce();
    expect(onOpenLink).toHaveBeenCalledOnce();
  });

  it('warns about the unsent result of the previous linked match', () => {
    const view = render(
      <ExternalMatchConflictDialog
        conflict="unsent-result"
        incomingPlayerNames={['Alice', 'Carl', 'Bob', 'Dan']}
        previousHost="badarts.fr"
        onOpenLink={vi.fn()}
        onKeepCurrent={vi.fn()}
      />,
    );
    expect(view.getByRole('dialog', { name: 'Résultat précédent non envoyé' })).toBeTruthy();
    expect(view.getByText(/n'a pas été envoyé à badarts.fr/)).toBeTruthy();
    expect(view.getByText('Nouveau match : Alice / Carl vs Bob / Dan')).toBeTruthy();
    expect(view.getByTestId('external-conflict-keep').textContent).toBe("Envoyer d'abord le résultat");
    expect(view.getByText('Rouvrez ensuite le lien du nouveau match.')).toBeTruthy();
  });

  it('falls back to the match in progress copy without previous host', () => {
    const view = render(
      <ExternalMatchConflictDialog
        conflict="unsent-result"
        incomingPlayerNames={['Alice', 'Bob']}
        previousHost={null}
        onOpenLink={vi.fn()}
        onKeepCurrent={vi.fn()}
      />,
    );
    expect(view.getByRole('dialog', { name: 'Une partie est en cours' })).toBeTruthy();
  });
});
