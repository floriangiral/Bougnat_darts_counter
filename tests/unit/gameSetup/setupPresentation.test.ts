import { describe, expect, it } from 'vitest';

import { getRulesContent } from '../../../src/features/game-setup/setupPresentation';

describe('setup rules content', () => {
  it.each([
    ['CAPITAL', 'Capital', 6, 'Capital : le joueur saisit directement le score total de sa visite.'],
    ['TRIATHLON', 'Triathlon', 9, 'Le Triathlon enchaine 3 epreuves dans cet ordre : Capital, Cricket puis 501.'],
    ['KILLER', 'Killer', 6, 'Chaque joueur commence avec 3 vies.'],
    ['GOTCHA', 'Gotcha', 6, 'Tout le monde commence a zero et monte vers le score cible.'],
  ] as const)('returns independent rule lists for %s', (gameType, name, count, rule) => {
    const first = getRulesContent(gameType, 20, 'Open', 'Double');
    const second = getRulesContent(gameType, 10, 'Master', 'Open');
    expect(first.title).toBe(`Regles Du ${name}`);
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
    expect(open.items[2]).toBe('Check-in actuel : Open. Le score commence immediatement.');
    expect(master.items[2]).toBe('Check-in actuel : Master. Le score ne commence qu apres une ouverture valide.');
    expect(master.items[3]).toBe('Check-out actuel : Open. Il faut donc terminer selon cette regle pour valider la victoire.');
  });

  it('keeps the configured round limit in Cricket rules', () => {
    expect(getRulesContent('CRICKET', 30, 'Open', 'Double').items.at(-1)).toBe(
      'La partie est limitee a 30 tours par joueur ou equipe, avec 3 fleches par tour.',
    );
  });
});
