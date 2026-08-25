// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';

import { ChangelogModal } from '../../../components/ui/ChangelogModal';

describe('ChangelogModal', () => {
  it('renders the current and historical release notes and closes', () => {
    const onClose = vi.fn();
    const view = render(<ChangelogModal onClose={onClose} />);

    expect(view.getByRole('heading', { name: 'Notes de version' })).toBeTruthy();
    expect(view.getByText('Version v1.1.3')).toBeTruthy();
    expect(view.getByText('Version v1.1.2')).toBeTruthy();
    expect(view.getByText('Version v1.1.1')).toBeTruthy();
    expect(view.getByText('Version v1.0.2')).toBeTruthy();

    fireEvent.click(view.getByRole('button', { name: 'Fermer' }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
