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
    expect(view.getByText('Compléments v2.1.0')).toBeTruthy();
    expect(view.queryByText('Prochaine version')).toBeNull();
    expect(view.getByText('Version v2.1.0')).toBeTruthy();
    expect(view.getByText('Version v1.1.5')).toBeTruthy();
    expect(view.getByText('Version v1.1.4')).toBeTruthy();
    expect(view.getByText('Version v1.1.3')).toBeTruthy();
    expect(view.getByText('Version v1.1.2')).toBeTruthy();
    expect(view.getByText('Version v1.1.1')).toBeTruthy();
    expect(view.getByText('Version v1.0.2')).toBeTruthy();

    const releases = view.getAllByText(/^Version v/).map((element) => element.textContent);
    expect(releases[0]).toBe('Version v2.1.0');
    expect(view.queryByText('Version v2.0.0')).toBeNull();

    fireEvent.click(view.getByRole('button', { name: 'Fermer' }));

    expect(onClose).toHaveBeenCalledOnce();
    fireEvent.click(view.getByRole('button', { name: 'Fermer les notes de version' }));
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(view.getByRole('dialog', { name: 'Notes de version' })).toBeTruthy();
  });

  it('résume la version 2 pour les joueurs, partie rapide en tête', () => {
    const view = render(<ChangelogModal onClose={vi.fn()} />);
    const themes = view.getAllByRole('heading', { level: 4 }).map((heading) => heading.textContent);
    expect(themes.slice(0, 6)).toEqual([
      'Jouer plus vite',
      'Nouveaux jeux et formats',
      'Sur tous les écrans',
      'Des règles plus justes',
      'Rien ne se perd',
      'Pour les organisateurs',
    ]);
    expect(view.getByText('Partie rapide X01')).toBeTruthy();
    expect(view.getByText(/Préparation X01/)).toBeTruthy();
    expect(view.getByText('180 Around the Clock')).toBeTruthy();
    expect(view.getByText('Limite de volées')).toBeTruthy();
    expect(view.getByText('Match préparé par lien')).toBeTruthy();
    expect(view.queryByText('Mode portrait')).toBeNull();
  });
});
