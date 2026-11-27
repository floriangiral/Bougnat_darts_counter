// @vitest-environment jsdom
import { createRequire } from 'node:module';
import { describe, expect, it, vi } from 'vitest';
import type { GameConfig, MatchState, Player, Turn } from '../../../../types';
import { createMatch } from '../../../../src/application/scoring/matchLifecycle';
import { buildX01ResultImageModel } from '../../../../src/presentation/stats/x01ResultImageModel.fr';
import { createX01ResultImage, renderX01ResultSvg } from '../../../../src/presentation/stats/x01ResultImage.fr';
import qr from '../../../../src/presentation/stats/x01ResultQr.svg?raw';

const config: GameConfig = {
  startingScore: 301, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS',
  setsToWin: 1, legsToWin: 2, isDoubles: false,
};
const players: Player[] = [
  { id: 'a', teamId: 'a', name: 'Alice' },
  { id: 'b', teamId: 'b', name: 'Bob', isBot: true },
  { id: 'c', teamId: 'c', name: 'Chloé' },
  { id: 'd', teamId: 'd', name: 'David' },
];
const turn = (playerId: string, score: number, remainingAfter: number, dartsThrown = 3): Turn =>
  ({ playerId, score, remainingAfter, dartsThrown, isBust: false });

const finished = (roster = players, game = config): MatchState => {
  const match = createMatch(roster, game);
  return {
    ...match,
    status: 'finished',
    matchWinnerId: roster[0].teamId,
    duration: 123,
    legsWon: { [roster[0].teamId]: 1 },
    currentLeg: {
      ...match.currentLeg,
      winnerId: roster[0].teamId,
      scores: Object.fromEntries(roster.map((p, index) => [p.teamId, index === 0 ? 0 : 100])),
      history: [
        turn(roster[0].id, 180, 121), turn(roster[1]?.id ?? roster[0].id, 140, 161),
        turn(roster[2]?.id ?? roster[0].id, 100, 201), turn(roster[3]?.id ?? roster[0].id, 60, 241),
        turn(roster[0].id, 121, 0, 3),
      ],
    },
  };
};

describe('image du résultat X01', () => {
  it('contient chaque camp, ses mesures et ses scores différents ainsi que les égalités', () => {
    const model = buildX01ResultImageModel(finished());
    const ranking = model.sections.find((section) => section.title === 'Classement');
    expect(ranking?.lines).toEqual(expect.arrayContaining([
      expect.stringContaining('2e ex aequo · Bob (robot)'),
      expect.stringContaining('2e ex aequo · Chloé'),
      expect.stringContaining('2e ex aequo · David'),
    ]));
    const sections = model.sections.slice(2);
    expect(model.sections[0].lines).toContain('Alice : 1 manche');
    expect(sections.map((section) => section.title)).toEqual(['Alice', 'Bob (robot)', 'Chloé', 'David']);
    expect(sections.map((section) => section.lines.find((line) => line.startsWith('Meilleur score'))))
      .toEqual(['Meilleur score : 180', 'Meilleur score : 140', 'Meilleur score : 100', 'Meilleur score : 60']);
    expect(sections[0].lines).toContain('180s / 171s : 1');
    expect(sections[1].lines).toContain('140+ / 133+ : 1');
    expect(sections[2].lines).toContain('100+ / 95+ : 1');
    expect(sections[3].lines).toContain('60+ / 57+ : 1');
    expect(sections[0].lines).toContain('3 fléchettes : 1/1');
    expect(sections[0].lines).toContain('Durée du match : 02:03');
  });

  it('respecte les places jouées et les sets, et accepte un match solo', () => {
    const match = finished(players, { ...config, matchMode: 'SETS', checkIn: 'Double' });
    match.setsWon = { a: 2, b: 1, c: 0, d: 0 };
    match.placement = { finishedTeamIds: ['a', 'c'] };
    const model = buildX01ResultImageModel(match);
    expect(model.sections[0].lines.join(' ')).toContain('Entrée double');
    expect(model.sections[0].lines).toContain('Alice : 2 sets');
    expect(model.sections[1].lines[1]).toContain('2e · Chloé · place jouée');
    expect(model.sections[1].lines[2]).toContain('calculé');
    const solo = buildX01ResultImageModel(finished([players[0]]));
    expect(solo.sections.map((section) => section.title)).toEqual(['Résultat', 'Alice']);
  });

  it('ne présente pas un départage au bull comme un checkout ou une manche finie aux fléchettes', () => {
    const match = finished(players.slice(0, 2), { ...config, maxVisitsPerLeg: 1 });
    match.currentLeg = {
      ...match.currentLeg,
      decidedByBullOff: true,
      scores: { a: 121, b: 161 },
      history: [turn('a', 180, 121), turn('b', 140, 161)],
    };
    const alice = buildX01ResultImageModel(match).sections.find((section) => section.title === 'Alice');
    expect(alice?.lines).toContain('Meilleur checkout : 0');
    expect(alice?.lines).toContain('Moyenne manche gagnante (fléchettes) : 0');
    expect(alice?.lines).toContain('Meilleure / Pire manche : - / -');
  });

  it('sépare les équipes des quatre individus sans leur attribuer les manches', () => {
    const roster = players.map((player, index) => ({ ...player, teamId: index % 2 ? 't2' : 't1' }));
    const match = finished(roster, { ...config, startingScore: 100, isDoubles: true });
    const first = {
      ...match.currentLeg, winnerId: 't1',
      history: [turn('c', 40, 60), turn('a', 60, 0, 2)],
    };
    match.completedLegs = [first];
    match.currentLeg = { ...first, history: [turn('a', 60, 40), turn('c', 40, 0, 1)] };
    const sections = buildX01ResultImageModel(match).sections;
    expect(sections.map((section) => section.title)).toEqual([
      'Résultat', 'Équipe 1 · Alice / Chloé', 'Statistiques individuelles · Alice',
      'Statistiques individuelles · Chloé', 'Équipe 2 · Bob (robot) / David',
      'Statistiques individuelles · Bob (robot)', 'Statistiques individuelles · David',
    ]);
    expect(sections[1].lines).toContain('Meilleur checkout : 60');
    expect(sections[2].lines).toContain('Meilleur checkout : 60');
    expect(sections[3].lines).toContain('Meilleur checkout : 40');
    expect(sections[2].lines).toContain('2 fléchettes : 1/1');
    expect(sections[3].lines).toContain('1 fléchette : 1/1');
    expect(sections[2].lines.some((line) => line.includes('Non applicable (manches gagnées en équipe)'))).toBe(true);
    const image = renderX01ResultSvg(buildX01ResultImageModel(match));
    expect(image.width * image.height).toBeLessThan(16_000_000);
    expect(image.height).toBeLessThan(16384);
  });

  it('embarque exactement le QR officiel avec une marge de quatre modules', async () => {
    const qrcode = createRequire(import.meta.url)('qrcode') as {
      toString: (value: string, options: object) => Promise<string>;
    };
    expect(qr).toBe(await qrcode.toString('https://play.bougnatdarts.fr', { type: 'svg', margin: 4, errorCorrectionLevel: 'M' }));
    expect(qr).toContain('viewBox="0 0 37 37"');
    expect(qr).toContain('M4 4.5');
  });

  it('échappe et conserve les noms longs, dimensionne la hauteur et refuse un rendu trop grand', () => {
    const name = `A<&"🚀${'très-long-'.repeat(35)}`;
    const model = buildX01ResultImageModel(finished([{ ...players[0], name }]));
    const result = renderX01ResultSvg(model, (text) => Array.from(text).length * 15);
    expect(result.svg).toContain('A&lt;&amp;&quot;🚀');
    expect(result.svg).toContain('fireGrad');
    expect(result.svg).toContain('viewBox="0 0 37 37"');
    expect(result.height).toBeGreaterThan(900);
    expect(result.svg).not.toContain('A<&"');
    expect(() => renderX01ResultSvg({ heading: 'X', sections: [{ title: 'X', lines: ['x'.repeat(100000)] }] }, (text) => text.length * 20)).toThrow('limites');
    expect(() => buildX01ResultImageModel({ ...finished(), status: 'active' })).toThrow('non terminé');
  });

  it('privilégie une coupure entre les mots quand une ligne est trop longue', () => {
    const model = { heading: 'X', sections: [{ title: 'X', lines: [`${'un '.repeat(11)}orange banane`] }] };
    const result = renderX01ResultSvg(model, (text) => Array.from(text).length * 22);
    expect(result.svg).toContain('>orange banane</text>');
  });

  it('retourne un File PNG et propage les limites de génération', async () => {
    const context = {
      font: '',
      measureText: (value: string) => ({ width: value.length * 14 }),
      drawImage: vi.fn(),
      getImageData: () => ({ data: new Uint8ClampedArray([0, 0, 0, 255]) }),
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(new Blob(['png'], { type: 'image/png' })));
    class FakeImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(value: string) {
        expect(value.startsWith('data:image/svg+xml')).toBe(true);
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal('Image', FakeImage);
    try {
      const file = await createX01ResultImage(finished());
      expect(file).toMatchObject({ name: 'bougnat-darts-resultat-x01.png', type: 'image/png' });
      expect(context.drawImage).toHaveBeenCalledOnce();
      vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(null));
      await expect(createX01ResultImage(finished())).rejects.toThrow('PNG complet');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
