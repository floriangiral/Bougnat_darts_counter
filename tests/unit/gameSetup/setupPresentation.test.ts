import { describe, expect, it } from 'vitest';

import { getRulesContent } from '../../../src/features/game-setup/setupPresentation';

describe('setup rules content', () => {
  it.each([
    ['CAPITAL', 'Capital', 6, 'Capital : le joueur saisit directement le score total de sa visite.'],
    ['TRIATHLON', 'Triathlon', 12, 'Le Triathlon enchaîne 3 épreuves dans cet ordre : Capital, Cricket puis 501.'],
    ['KILLER', 'Killer', 6, 'Chaque joueur commence avec 3 vies.'],
    ['GOTCHA', 'Gotcha', 6, 'Tout le monde commence à zéro et monte vers le score cible.'],
  ] as const)('returns independent rule lists for %s', (gameType, name, count, rule) => {
    const first = getRulesContent(gameType, 20, 'Open', 'Double');
    const second = getRulesContent(gameType, 10, 'Master', 'Open');
    expect(first.title).toBe(`Règles du ${name}`);
    expect(first.items).toHaveLength(count);
    expect(first.items).toContain(rule);
    expect(first).toEqual(second);
    expect(first.items).not.toBe(second.items);
    first.items.splice(0, first.items.length);
    expect(getRulesContent(gameType, 20, 'Open', 'Double')).toEqual(second);
  });

  it('keeps X01 rules dependent on check-in and check-out settings', () => {
    const open = getRulesContent('X01', 20, 'Open', 'Double');
    const master = getRulesContent('X01', 20, 'Master', 'Open');
    expect(open.items[2]).toBe('Check-in actuel : Open. Le score commence immédiatement.');
    expect(master.items[2]).toBe('Check-in actuel : Master. Le score ne commence qu’après une ouverture valide.');
    expect(master.items[3]).toBe('Check-out actuel : Open. Il faut donc terminer selon cette règle pour valider la victoire.');
  });

  it('details the versioned Triathlon scale in the displayed rules', () => {
    const items = getRulesContent('TRIATHLON', 20, 'Open', 'Double').items;
    expect(items).toContain('Barème v2 sur 100 points (501 sur 34, Cricket sur 33, Capital sur 33) : chaque épreuve donne des points de résultat, complétés par des bonus de performance.');
    expect(items).toContain('Cricket : vainqueur 20 pts, perdant 14 pts, égalité 17 pts chacun. Bonus : meilleur MPR +5, fermeture complète des 7 cibles +4, plus de numéros fermés +4.');
    expect(items.find((item) => item.startsWith('501 : victoire'))).toContain('défaite en position de sortie 14 pts');
  });

  it('keeps the configured round limit in Cricket rules', () => {
    expect(getRulesContent('CRICKET', 30, 'Open', 'Double').items.at(-1)).toBe(
      'La partie est limitée à 30 tours par joueur ou équipe, avec 3 fléchettes par tour.',
    );
  });
});
