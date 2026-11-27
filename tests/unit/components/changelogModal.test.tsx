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
    expect(view.queryByText('Prochaine version')).toBeNull();
    expect(view.queryByText('La V2 en préparation')).toBeNull();
    expect(view.queryByText(/La prochaine grande version/)).toBeNull();
    expect(view.getByText('Version v2.1.0')).toBeTruthy();
    expect(view.getByRole('dialog').textContent).not.toMatch(/badarts/i);
    expect(view.getByText('Cricket jusqu’à 4 joueurs')).toBeTruthy();
    expect(view.getByText('Un vrai classement à plusieurs')).toBeTruthy();
    expect(view.getByText('Matchs organisés')).toBeTruthy();
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
    expect(themes.slice(0, 7)).toEqual([
      'Après la v2.1.0',
      'Jouer plus vite',
      'Nouveaux jeux et formats',
      'Sur tous les écrans',
      'Des règles plus justes',
      'Rien ne se perd',
      'Plus de confort en X01',
    ]);
    expect(view.getByText('Partie rapide X01')).toBeTruthy();
    expect(view.getByText(/format de partie, pavé, raccourcis et statistiques/)).toBeTruthy();
    expect(view.getByText('180 Around the Clock')).toBeTruthy();
    expect(view.getByText('Limite de volées')).toBeTruthy();
    expect(view.queryByText('Mode portrait')).toBeNull();
  });
});
