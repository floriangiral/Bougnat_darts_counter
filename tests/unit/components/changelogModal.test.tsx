// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';

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
    expect(view.getByText('Version v2.2.0')).toBeTruthy();
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
    expect(releases.slice(0, 2)).toEqual(['Version v2.2.0', 'Version v2.1.0']);
    expect(view.queryByText('Version v2.0.0')).toBeNull();

    fireEvent.click(view.getByRole('button', { name: 'Fermer' }));

    expect(onClose).toHaveBeenCalledOnce();
    fireEvent.click(view.getByRole('button', { name: 'Fermer les notes de version' }));
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(view.getByRole('dialog', { name: 'Notes de version' })).toBeTruthy();
  });

  it('présente les nouveautés 2.2.0 pour les joueurs sans faux titre chronologique', () => {
    const view = render(<ChangelogModal onClose={vi.fn()} />);
    const release = within(view.getByRole('region', { name: 'Version v2.2.0' }));
    const themes = view.getAllByRole('heading', { level: 4 }).map((heading) => heading.textContent);
    expect(themes.slice(0, 9)).toEqual([
      'Jouer à plusieurs',
      'Après le match X01',
      'Plus de confort pour jouer',
      'Jouer plus vite',
      'Nouveaux jeux et formats',
      'Sur tous les écrans',
      'Des règles plus justes',
      'Rien ne se perd',
      'Plus de confort en X01',
    ]);
    expect(view.queryByText(/^Après la v\d/)).toBeNull();
    expect(release.getByText('Tout l’ordre de passage')).toBeTruthy();
    expect(release.getByText('Un classement pour chacun')).toBeTruthy();
    expect(release.getByText('Jouer les places en Cricket et Gotcha')).toBeTruthy();
    expect(release.getByText('Places fixes en X01')).toBeTruthy();
    expect(release.getByText('Votre partie rapide X01')).toBeTruthy();
    expect(release.getByText('La feuille de match en image')).toBeTruthy();
    expect(release.getByText('Je prends la gagne')).toBeTruthy();
    expect(release.getByText('27/11/2026')).toBeTruthy();
    expect(release.getByText('Raccourcis X01 sur téléphone')).toBeTruthy();
    expect(release.getByText('Accueil sur téléphone')).toBeTruthy();
    expect(release.getByText('180 Around the Clock en solo')).toBeTruthy();
    expect(release.getByText('Saisie au 180 Around the Clock')).toBeTruthy();
    expect(view.getByText('Partie rapide X01')).toBeTruthy();
    expect(view.getByText(/format de partie, pavé, raccourcis et statistiques/)).toBeTruthy();
    expect(view.getByText('180 Around the Clock')).toBeTruthy();
    expect(view.getByText('Limite de volées')).toBeTruthy();
    expect(view.queryByText('Mode portrait')).toBeNull();
  });

  it('présente les changements jouables avant les notes 2.1.0, sans annonces techniques', () => {
    const view = render(<ChangelogModal onClose={vi.fn()} />);
    const dialog = view.getByRole('dialog');
    const release = within(view.getByRole('region', { name: 'Version v2.2.0' }));
    const content = dialog.textContent ?? '';

    expect(content.indexOf('Version v2.2.0')).toBeLessThan(content.indexOf('Version v2.1.0'));
    expect(content.indexOf('Version v2.1.0')).toBeLessThan(content.indexOf('Version v1.1.5'));
    expect(release.getByText(/choisissez qui joue en premier.*sauf le Triathlon/)).toBeTruthy();
    expect(release.getByText(/Cricket, Gotcha, Killer et Capital affichent toutes les places/)).toBeTruthy();
    expect(release.getByText(/continuez après la victoire.*ex æquo/)).toBeTruthy();
    expect(release.getByText(/chacun garde sa place sur tous les écrans/)).toBeTruthy();
    expect(release.getByText(/dernière partie reste en mémoire avec son format et ses joueurs.*contre le robot/)).toBeTruthy();
    expect(release.getByText(/grand score ou podium, statistiques de tous les joueurs, date et QR code/)).toBeTruthy();
    expect(release.getByText(/le vainqueur garde la table et un challenger remplace le perdant/)).toBeTruthy();
    expect(release.getByText(/scores rapides s’affichent sur davantage d’écrans/)).toBeTruthy();
    expect(release.getByText(/éléments sont mieux regroupés/)).toBeTruthy();
    expect(release.getByText(/suivez vos 20 tours dans une grille/)).toBeTruthy();
    expect(release.getByText(/bouton « Passer » disparaît.*« Annuler » reste disponible/)).toBeTruthy();
    expect(view.getByText(/partagez un résumé écrit du match/)).toBeTruthy();
    expect(view.getByText(/le challenge est validé uniquement avec un total strictement inférieur à 21/)).toBeTruthy();

    expect(content).not.toMatch(/Correctifs de recette|Compléments v2\.1\.0|26\/11\/2026|24\/11\/2026/i);
    expect(content).not.toMatch(/recette|préprod|URL|mesure d.audience|analytics|anti.horaire|badarts/i);
    expect(content).not.toMatch(/Sonar|CodeQL|IndexedDB|runtime|dépendances|\bReact\b|\bVite\b|coverage|build|setup/i);
    expect(view.getAllByText('Version v2.2.0')).toHaveLength(1);
    expect(view.getAllByText('Version v2.1.0')).toHaveLength(1);
    expect(view.getAllByText('Jouer les places en Cricket et Gotcha')).toHaveLength(1);
  });
});
