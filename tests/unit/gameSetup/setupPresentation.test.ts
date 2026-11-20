import { describe, expect, it } from 'vitest';

import { getRulesContent } from '../../../src/features/game-setup/setupPresentation';

describe('setup rules content', () => {
  it.each([
    ['CAPITAL', 'Capital', 6, 'Capital : le joueur saisit directement le score total de sa visite.'],
    ['TRIATHLON', 'Triathlon', 9, 'Le Triathlon enchaîne 3 épreuves dans cet ordre : Capital, Cricket puis 501.'],
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

  it('keeps the configured round limit and its tie-break in Cricket rules', () => {
    const { items } = getRulesContent('CRICKET', 30, 'Open', 'Double');
    expect(items.at(-2)).toBe('La partie est limitée à 30 tours par joueur ou équipe, avec 3 fléchettes par tour.');
    expect(items.at(-1)).toBe(
      'À la limite de tours, le meilleur score l’emporte, puis le plus de numéros fermés, puis le plus de marques ; en cas d’égalité parfaite, l’égalité est déclarée.',
    );
  });
});
