// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';

import { ChangelogModal } from '../../../components/ui/ChangelogModal';

afterEach(cleanup);

describe('ChangelogModal', () => {
  it('renders the current and historical release notes and closes', () => {
    const onClose = vi.fn();
    const view = render(<ChangelogModal onClose={onClose} />);

    expect(view.getByRole('heading', { name: 'Notes de version' })).toBeTruthy();
    expect(view.getByText('Version v2.0.0')).toBeTruthy();
    expect(view.getByText('Version v1.1.5')).toBeTruthy();
    expect(view.getByText('Version v1.1.4')).toBeTruthy();
    expect(view.getByText('Version v1.1.3')).toBeTruthy();
    expect(view.getByText('Version v1.1.2')).toBeTruthy();
    expect(view.getByText('Version v1.1.1')).toBeTruthy();
    expect(view.getByText('Version v1.0.2')).toBeTruthy();

    const releases = view.getAllByText(/^Version v/).map((element) => element.textContent);
    expect(releases[0]).toBe('Version v2.0.0');

    fireEvent.click(view.getByRole('button', { name: 'Fermer' }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  // Spec ref: spec:counter/external-match-link (v2.0.0 release notes)
  it('presents the v2.0.0 tournament match link features first', () => {
    const view = render(<ChangelogModal onClose={vi.fn()} />);
    expect(view.getByText('Match de tournoi par lien')).toBeTruthy();
    expect(view.getByText('Configuration verrouillee')).toBeTruthy();
    expect(view.getByText('Aucune partie perdue')).toBeTruthy();
  });
});
