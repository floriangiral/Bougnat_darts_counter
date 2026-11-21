import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// Spec ref: spec:counter/external-match-link (partner simulator, documentation tooling)
const ROOT = path.resolve(__dirname, '../../..');

type Scenario = {
  link: string;
  linkErrors: string;
  linkErrorsClass: string;
  returnValue: string;
  resultHidden: boolean;
  summary: string;
  summaryClass: string;
  checks: string[];
  rows: string[];
  usedTokens: string[];
};

// jsdom has no bundled types: it runs in a child process that prints JSON.
const SCRIPT = `
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
const html = fs.readFileSync('docs/integration/partner-simulator/index.html', 'utf8');
const input = JSON.parse(process.argv[1]);
const dom = new JSDOM(html, {
  url: input.url,
  runScripts: 'dangerously',
  beforeParse(window) {
    if (input.usedTokens) window.localStorage.setItem('bougnat-partner-simulator-used-tokens', JSON.stringify(input.usedTokens));
  },
});
const { document, Event } = dom.window;
const $ = (id) => document.getElementById(id);
for (const action of input.actions ?? []) {
  if (action.type === 'set') {
    $(action.id).value = action.value;
    $(action.id).dispatchEvent(new Event(action.event ?? 'input', { bubbles: true }));
  }
  if (action.type === 'click') $(action.id).click();
}
console.log(JSON.stringify({
  link: $('link').textContent,
  linkErrors: $('link-errors').textContent,
  linkErrorsClass: $('link-errors').className,
  returnValue: $('return').value,
  resultHidden: $('result').hidden,
  summary: $('result-summary').textContent,
  summaryClass: $('result-summary').className,
  checks: [...document.querySelectorAll('#result-checks li')].map((li) => li.className + ' ' + li.textContent),
  rows: [...document.querySelectorAll('#result-params tr')].map((tr) => [...tr.children].map((td) => td.textContent).join('=')),
  usedTokens: JSON.parse(dom.window.localStorage.getItem('bougnat-partner-simulator-used-tokens') ?? '[]'),
}));
`;

type Action =
  | { type: 'set'; id: string; value: string; event?: 'input' | 'change' }
  | { type: 'click'; id: string };

const simulate = (url: string, actions: Action[] = [], usedTokens?: string[]): Scenario => {
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', SCRIPT, JSON.stringify({ url, actions, usedTokens })], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  if (result.status !== 0) throw new Error(result.stderr);
  return JSON.parse(result.stdout) as Scenario;
};

const linkParams = (scenario: Scenario) => Object.fromEntries(new URL(scenario.link).searchParams);
const PAGE = 'http://192.168.1.20:7020/';

describe('partner simulator - link builder', () => {
  it('builds a v1 singles link to production with a single-use return URL to itself', () => {
    const scenario = simulate(PAGE);
    expect(scenario.link.startsWith('https://play.bougnatdarts.fr/?')).toBe(true);
    const params = linkParams(scenario);
    expect(params).toMatchObject({ v: '1', game: 'x01', p1: 'Alice', p2: 'Bob', start: '501', in: 'open', out: 'double', legs: '3' });
    expect(params).not.toHaveProperty('sets');
    expect(params).not.toHaveProperty('stats');
    const returnUrl = new URL(params.return);
    expect(returnUrl.origin).toBe('http://192.168.1.20:7020');
    expect(returnUrl.searchParams.get('match')).toMatch(/^demo-\d+$/);
    expect(returnUrl.searchParams.get('token')).toMatch(/^[0-9a-f]{16}$/);
    expect(scenario.linkErrors).toBe('');
    expect(scenario.resultHidden).toBe(true);
  });

  it('builds a doubles link with sets and stats', () => {
    const scenario = simulate(PAGE, [
      { type: 'set', id: 'mode', value: 'doubles', event: 'change' },
      { type: 'set', id: 'sets', value: '2' },
      { type: 'set', id: 'stats', value: '1' },
    ]);
    const params = linkParams(scenario);
    expect(params).toMatchObject({ t1p1: 'Alice', t1p2: 'Carl', t2p1: 'Bob', t2p2: 'Dan', sets: '2', stats: '1' });
    expect(params).not.toHaveProperty('p1');
  });

  it('uses a custom counter address and reports an invalid one', () => {
    const custom = simulate(PAGE, [
      { type: 'set', id: 'counter', value: 'custom', event: 'change' },
      { type: 'set', id: 'counter-custom', value: 'http://192.168.1.10:3000/' },
    ]);
    expect(custom.link.startsWith('http://192.168.1.10:3000/?v=1')).toBe(true);

    const invalid = simulate(PAGE, [
      { type: 'set', id: 'counter', value: 'custom', event: 'change' },
      { type: 'set', id: 'counter-custom', value: 'not a url' },
    ]);
    expect(invalid.link).toBe('-');
    expect(invalid.linkErrors).toContain('Adresse du compteur invalide.');
    expect(invalid.linkErrorsClass).toContain('ko');
  });

  it('reports a missing name, an invalid return URL and reserved return params', () => {
    expect(simulate(PAGE, [{ type: 'set', id: 'p2', value: '  ' }]).linkErrors).toContain('Nom manquant : p2');
    expect(simulate(PAGE, [{ type: 'set', id: 'return', value: 'nope' }]).linkErrors).toContain('URL de retour invalide.');
    const reserved = simulate(PAGE, [{ type: 'set', id: 'return', value: 'https://badarts.fr/m?winner=1&avg1=3' }]);
    expect(reserved.linkErrors).toContain('réservé');
    expect(reserved.linkErrors).toContain('winner');
    expect(reserved.linkErrors).toContain('avg1');
  });

  it('generates a new token on request', () => {
    const first = simulate(PAGE);
    const renewed = simulate(PAGE, [{ type: 'click', id: 'new-token' }]);
    expect(new URL(renewed.returnValue).searchParams.get('token')).not.toBe(new URL(first.returnValue).searchParams.get('token'));
    expect(new URL(linkParams(renewed).return).toString()).toBe(renewed.returnValue);
  });
});

describe('partner simulator - return viewer', () => {
  it('shows a completed result with consistent checks and remembers the token', () => {
    const scenario = simulate(`${PAGE}?match=demo-1&token=abc&v=1&status=completed&legs1=3&legs2=1&winner=1&avg1=55.20`);
    expect(scenario.resultHidden).toBe(false);
    expect(scenario.summary).toBe('Match terminé : 3 - 1, vainqueur 1.');
    expect(scenario.summaryClass).toBe('ok');
    expect(scenario.checks.every((check) => check.startsWith('ok '))).toBe(true);
    expect(scenario.checks).toHaveLength(5);
    expect(scenario.rows).toContain('winner=1');
    expect(scenario.usedTokens).toEqual(['abc']);
  });

  it('flags a token that was already used (duplicate result)', () => {
    const scenario = simulate(`${PAGE}?token=abc&v=1&status=completed&legs1=3&legs2=1&winner=1`, [], ['abc']);
    expect(scenario.checks.some((check) => check.startsWith('warn ✘ Jeton'))).toBe(true);
    expect(scenario.usedTokens).toEqual(['abc']);
  });

  it('flags a missing token, a wrong version and an inconsistent winner', () => {
    const scenario = simulate(`${PAGE}?v=2&status=completed&legs1=1&legs2=3&winner=1`);
    expect(scenario.checks).toEqual(expect.arrayContaining([
      'ko ✘ Version du contrat v=1',
      "warn ✘ Jeton présent dans l'URL de retour",
      'ko ✘ Le vainqueur a plus de manches que le perdant',
    ]));
  });

  it('checks the sets in the sets format', () => {
    const ok = simulate(`${PAGE}?token=s1&v=1&status=completed&legs1=4&legs2=5&sets1=2&sets2=1&winner=1`);
    expect(ok.checks).toContain('ok ✔ Le vainqueur a plus de sets que le perdant');
    const ko = simulate(`${PAGE}?token=s2&v=1&status=completed&legs1=4&legs2=5&sets1=1&sets2=2&winner=1`);
    expect(ko.checks).toContain('ko ✘ Le vainqueur a plus de sets que le perdant');
  });

  it('shows an abandoned match without score', () => {
    const scenario = simulate(`${PAGE}?token=c1&v=1&status=cancelled`);
    expect(scenario.summary).toBe('Match abandonné sur le compteur (status=cancelled) : aucun score.');
    expect(scenario.summaryClass).toBe('warn');
  });

  it('shows an unknown status', () => {
    const scenario = simulate(`${PAGE}?token=u1&v=1&status=paused`);
    expect(scenario.summary).toBe('Statut inconnu : paused');
    expect(scenario.summaryClass).toBe('ko');
  });

  it('keeps only the 50 last used tokens', () => {
    const previous = Array.from({ length: 60 }, (_, index) => `t${index}`);
    const scenario = simulate(`${PAGE}?token=new&v=1&status=cancelled`, [], previous);
    expect(scenario.usedTokens).toHaveLength(50);
    expect(scenario.usedTokens[49]).toBe('new');
  });

  it('renders received values as text (no HTML injection)', () => {
    const scenario = simulate(`${PAGE}?token=x1&v=1&status=${encodeURIComponent('<img src=x onerror=alert(1)>')}`);
    expect(scenario.summary).toBe('Statut inconnu : <img src=x onerror=alert(1)>');
    expect(scenario.rows).toContain('status=<img src=x onerror=alert(1)>');
  });
});
