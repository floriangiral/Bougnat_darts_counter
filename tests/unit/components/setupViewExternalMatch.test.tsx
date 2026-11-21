// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';

import { SetupView } from '../../../views/SetupView';
import { createMatch } from '../../../src/application/scoring/matchLifecycle';
import {
  createExternalMatchContext,
  matchFollowsExternalLink,
  parseExternalMatchLink,
} from '../../../src/features/external-match/externalMatchLink';
import type { GameConfig, Player } from '../../../types';

// Spec ref: spec:counter/external-match-link (setup locked by an external link)
afterEach(cleanup);

const POLICY = { origins: ['https://badarts.fr'], allowPrivateNetworkHttp: false };
const RETURN = 'https://badarts.fr/match/12';

const parse = (params: Record<string, string>) => {
  const parsed = parseExternalMatchLink(
    `?${new URLSearchParams({ game: 'x01', return: RETURN, ...params }).toString()}`,
    POLICY,
  );
  if (!parsed) throw new Error('link should be valid');
  return parsed;
};

const renderSetup = (params: Record<string, string>, host: string | null = 'badarts.fr') => {
  const linkValue = parse(params);
  const onStart = vi.fn<(players: Player[], config: GameConfig) => void>();
  const onBack = vi.fn();
  const view = render(
    <SetupView
      gameType="X01"
      onStart={onStart}
      onBack={onBack}
      prefilledPlayerNames={linkValue.playerNames}
      prefilledConfig={linkValue.config}
      externalMatchHost={host}
    />,
  );
  const start = () => {
    fireEvent.click(view.getByRole('button', { name: /Lancer La Partie/i }));
    expect(onStart).toHaveBeenCalledOnce();
    const [players, config] = onStart.mock.calls[0];
    return { players, config };
  };
  return { view, linkValue, onStart, onBack, start };
};

const isDisabled = (element: Element) => element.matches(':disabled');

describe('SetupView locked by an external match link', () => {
  it('shows the banner and disables names, score, format and rules', () => {
    const { view } = renderSetup({ p1: 'Alice', p2: 'Bob', start: '301', legs: '2' });

    expect(view.getByTestId('setup-external-match-banner').textContent).toContain('badarts.fr');
    view.getAllByRole('textbox').forEach((input) => expect(isDisabled(input)).toBe(true));
    ['301', '501', '701', 'Simple', 'Doublettes'].forEach((name) => {
      view.getAllByRole('button', { name }).forEach((button) => expect(isDisabled(button)).toBe(true));
    });
    view.getAllByRole('button', { name: /Ouverture|Fermeture|Open|Double|Master/i })
      .forEach((button) => expect(isDisabled(button)).toBe(true));
    expect(view.queryByRole('checkbox', { name: 'Jouer contre un robot' })).toBeNull();
  });

  it('keeps back, rules and launch available', () => {
    const { view, onBack } = renderSetup({ p1: 'Alice', p2: 'Bob' });
    fireEvent.click(view.getByRole('button', { name: /Retour/i }));
    expect(onBack).toHaveBeenCalledOnce();
    expect(isDisabled(view.getByRole('button', { name: /Voir les règles/i }))).toBe(false);
    expect(isDisabled(view.getByRole('button', { name: /Lancer La Partie/i }))).toBe(false);
  });

  it('starts a singles match that follows the link (the result can be sent)', () => {
    const { start, linkValue } = renderSetup({ p1: 'Alice', p2: 'Bob', start: '301', legs: '2', in: 'double', out: 'master' });
    const { players, config } = start();

    expect(players.map(({ id, name, teamId }) => ({ id, name, teamId }))).toEqual([
      { id: 'p1', name: 'Alice', teamId: 'p1' },
      { id: 'p2', name: 'Bob', teamId: 'p2' },
    ]);
    expect(config).toMatchObject({ startingScore: 301, legsToWin: 2, checkIn: 'Double', checkOut: 'Master', matchMode: 'LEGS', isDoubles: false });
    expect(matchFollowsExternalLink(createExternalMatchContext(linkValue), createMatch(players, config))).toBe(true);
  });

  it('starts a doubles match that follows the link, whatever the starter of each pair', () => {
    const { view, start, linkValue } = renderSetup({ t1p1: 'Alice', t1p2: 'Carl', t2p1: 'Bob', t2p2: 'Dan' });
    expect(view.getAllByRole('textbox')).toHaveLength(4);
    expect(view.getByText(/qui commence dans chaque duo/)).toBeTruthy();

    const carl = view.getAllByRole('button', { name: 'Carl' })[0];
    expect(isDisabled(carl)).toBe(false);
    fireEvent.click(carl);

    const { players, config } = start();
    expect(config.isDoubles).toBe(true);
    expect(config.teamStarterIds?.team1).toBe('t1p2');
    expect(matchFollowsExternalLink(createExternalMatchContext(linkValue), createMatch(players, config))).toBe(true);
  });

  it('starts a sets match that follows the link', () => {
    const { start, linkValue } = renderSetup({ p1: 'Alice', p2: 'Bob', sets: '2', legs: '3' });
    const { players, config } = start();
    expect(config).toMatchObject({ matchMode: 'SETS', setsToWin: 2, legsToWin: 3 });
    expect(matchFollowsExternalLink(createExternalMatchContext(linkValue), createMatch(players, config))).toBe(true);
  });

  it('starts a custom start score match that follows the link', () => {
    const { start, linkValue } = renderSetup({ p1: 'Alice', p2: 'Bob', start: '170', legs: '7' });
    const { players, config } = start();
    expect(config).toMatchObject({ startingScore: 170, legsToWin: 7 });
    expect(matchFollowsExternalLink(createExternalMatchContext(linkValue), createMatch(players, config))).toBe(true);
  });
});

describe('SetupView without external match', () => {
  it('keeps every control editable and shows no banner', () => {
    const { view } = renderSetup({ p1: 'Alice', p2: 'Bob' }, null);
    expect(view.queryByTestId('setup-external-match-banner')).toBeNull();
    view.getAllByRole('textbox').forEach((input) => expect(isDisabled(input)).toBe(false));
    view.getAllByRole('button', { name: '301' }).forEach((button) => expect(isDisabled(button)).toBe(false));
    expect(view.getByRole('checkbox', { name: 'Jouer contre un robot' })).toBeTruthy();
  });

  it('lets the players change the composition (the result would then be refused)', () => {
    const { view, start, linkValue } = renderSetup({ p1: 'Alice', p2: 'Bob' }, null);
    fireEvent.change(view.getByPlaceholderText('Joueur 2'), { target: { value: 'Robert' } });
    const { players, config } = start();
    expect(matchFollowsExternalLink(createExternalMatchContext(linkValue), createMatch(players, config))).toBe(false);
  });
});
