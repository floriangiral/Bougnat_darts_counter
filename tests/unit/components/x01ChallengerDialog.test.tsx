// @vitest-environment jsdom
// Spec 137 : fenêtre « Qui prend la gagne ? » (AC-05, AC-07 à AC-10, AC-17).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { X01ChallengerDialog } from '../../../components/stats/X01ChallengerDialog';
import { createMatch } from '../../../src/application/scoring/matchLifecycle';
import type { TakeTheTableRequest } from '../../../src/features/x01/challenger/x01Challenger';
import type { GameConfig, MatchState, Player } from '../../../types';

afterEach(cleanup);

const config: GameConfig = {
  startingScore: 501, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS', legsToWin: 1, setsToWin: 1, isDoubles: false,
};
const single = (name: string, id = name.toLowerCase()): Player => ({ id, name, teamId: id });

const finish = (players: Player[], winnerId: string, scores: Record<string, number>, matchConfig = config): MatchState => {
  const match = createMatch(players, matchConfig);
  return {
    ...match,
    status: 'finished',
    matchWinnerId: winnerId,
    currentLeg: { ...match.currentLeg, winnerId, scores: { ...match.currentLeg.scores, ...scores, [winnerId]: 0 } },
  };
};

const duel = () => finish([single('Alice'), single('Bob')], 'alice', { bob: 120 });
const fourPlayers = () => finish(
  [single('Bob'), single('Chloé', 'chloe'), single('Alice'), single('David')],
  'alice',
  { bob: 40, chloe: 100, david: 300 },
);
const doubles = () => finish([
  { id: 't1p2', name: 'Bob', teamId: 'team1' },
  { id: 't2p1', name: 'Chloé', teamId: 'team2' },
  { id: 't1p1', name: 'Alice', teamId: 'team1' },
  { id: 't2p2', name: 'David', teamId: 'team2' },
], 'team1', { team2: 80 }, { ...config, isDoubles: true });

const renderDialog = (match: MatchState, queue: string[] = [], returnFocus: HTMLElement | null = null) => {
  const onLaunch = vi.fn<(request: TakeTheTableRequest) => void>();
  const onClose = vi.fn();
  const view = render(<X01ChallengerDialog match={match} queue={queue} returnFocus={returnFocus} onLaunch={onLaunch} onClose={onClose} />);
  return { ...view, onLaunch, onClose, dialog: screen.getByRole('dialog', { name: 'Qui prend la gagne ?' }) };
};

const type = (element: HTMLElement, value: string) => fireEvent.change(element, { target: { value } });
const queueInput = () => screen.getByRole('textbox', { name: 'Ajouter à la file' });
const next = () => screen.getByTestId('x01-challenger-next').textContent;
const queueNames = () => screen.queryByTestId('x01-challenger-queue')?.querySelectorAll('li') ?? [];

describe('X01ChallengerDialog', () => {
  it('nomme la fenêtre, affiche le vainqueur avec trophée et texte, et place le focus dans le champ (AC-17)', () => {
    const { dialog } = renderDialog(duel());
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    const winner = screen.getByTestId('x01-challenger-winner');
    expect(winner.textContent).toContain('Alice');
    expect(winner.textContent).toContain('Vainqueur');
    expect(winner.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByTestId('x01-challenger-leaving').textContent).toBe('Bob sort');
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Challenger' }));
    expect(next()).toBe('File vide');
  });

  it('refuse un champ vide ou un doublon avec un message annoncé et relié (AC-07)', () => {
    const { onLaunch } = renderDialog(duel());
    const field = screen.getByRole('textbox', { name: 'Challenger' });
    fireEvent.click(screen.getByRole('button', { name: 'Lancer' }));
    expect(screen.getByRole('alert').textContent).toBe('Saisis le prénom du challenger.');
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(field.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id);
    type(field, '   ');
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(screen.getByRole('alert').textContent).toBe('Saisis le prénom du challenger.');
    type(field, 'alice');
    expect(screen.getByRole('alert').textContent).toBe('alice joue déjà : choisis un autre prénom, par exemple « alice B. ».');
    expect(onLaunch).not.toHaveBeenCalled();
    type(field, 'Bob');
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(onLaunch).toHaveBeenCalledExactlyOnceWith({ leaverIds: ['bob'], challengerNames: ['Bob'], queue: [] });
  });

  it('gère la file : ajout, sortant en un geste, refus, retrait, montée puis lancement (AC-08)', () => {
    const { onLaunch } = renderDialog(duel());
    type(screen.getByRole('textbox', { name: 'Challenger' }), 'Paul');
    type(queueInput(), 'Léa');
    fireEvent.keyDown(queueInput(), { key: 'Enter' });
    expect(onLaunch).not.toHaveBeenCalled();
    type(queueInput(), 'Zoé');
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));
    const addBob = screen.getByRole('button', { name: 'Ajouter Bob en fin de file' });
    expect(addBob.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(addBob);
    expect(addBob.getAttribute('aria-pressed')).toBe('true');
    expect(next()).toBe('Prochain : Léa, puis Zoé, puis Bob');

    for (const [name, message] of [['léa', 'léa est déjà dans la file.'], ['Alice', 'Alice est à la table.'], ['paul', 'paul est à la table.'], [' ', 'Saisis un prénom à ajouter à la file.']]) {
      type(queueInput(), name);
      fireEvent.keyDown(queueInput(), { key: 'Enter' });
      expect(screen.getByRole('alert').textContent).toBe(message);
      expect(queueInput().getAttribute('aria-invalid')).toBe('true');
    }

    fireEvent.click(screen.getByRole('button', { name: 'Retirer Zoé de la file' }));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Monter Léa' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Monter Bob' }));
    expect([...queueNames()].map((item) => item.textContent)).toEqual([
      expect.stringContaining('Bob'), expect.stringContaining('Léa'),
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Lancer' }));
    expect(onLaunch).toHaveBeenCalledExactlyOnceWith({ leaverIds: ['bob'], challengerNames: ['Paul'], queue: ['Bob', 'Léa'] });
  });

  it('retire le sortant de la file par un second appui et masque le bouton s’il devient challenger', () => {
    renderDialog(duel());
    const addBob = screen.getByRole('button', { name: 'Ajouter Bob en fin de file' });
    fireEvent.click(addBob);
    fireEvent.click(addBob);
    expect(next()).toBe('File vide');
    fireEvent.click(screen.getByRole('button', { name: 'Mettre Bob en challenger' }));
    expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'Challenger' }).value).toBe('Bob');
    expect(screen.queryByRole('button', { name: 'Ajouter Bob en fin de file' })).toBeNull();
  });

  it('propose le premier de la file et le remet en tête s’il est remplacé (AC-09)', () => {
    const { onLaunch } = renderDialog(duel(), ['Alice', 'Léa', 'Zoé']);
    const field = screen.getByRole<HTMLInputElement>('textbox', { name: 'Challenger' });
    expect(field.value).toBe('Léa');
    expect(next()).toBe('Prochain : Alice, puis Zoé');
    type(field, 'Max');
    expect(next()).toBe('Prochain : Alice, puis Léa, puis Zoé');
    fireEvent.click(screen.getByRole('button', { name: 'Lancer' }));
    expect(onLaunch).toHaveBeenCalledWith(expect.objectContaining({ challengerNames: ['Max'], queue: ['Alice', 'Léa', 'Zoé'] }));
  });

  it('refuse un 13e prénom et désactive l’ajout du sortant quand la file est pleine', () => {
    renderDialog(duel(), Array.from({ length: 13 }, (_, index) => `Joueur ${index + 1}`));
    type(screen.getByRole('textbox', { name: 'Challenger' }), 'Paul');
    type(queueInput(), 'Max');
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));
    expect(screen.getByRole('alert').textContent).toBe('File complète (12 prénoms).');
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Ajouter Bob en fin de file' }).disabled).toBe(true);
  });

  it('ferme sans effet par Annuler, Échap ou un appui hors de la fenêtre et rend le focus (AC-10)', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    const { onClose, onLaunch, unmount } = renderDialog(duel(), [], trigger);
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Challenger' }), { key: 'Escape' });
    fireEvent.click(screen.getByTestId('x01-challenger-backdrop'));
    fireEvent.click(screen.getByTestId('x01-challenger-winner'));
    expect(onClose).toHaveBeenCalledTimes(3);
    expect(onLaunch).not.toHaveBeenCalled();
    unmount();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it('garde le focus dans la fenêtre au clavier', () => {
    const { dialog } = renderDialog(duel());
    const focusable = dialog.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
    fireEvent.keyDown(first, { key: 'a' });
    expect(document.activeElement).toBe(last);
  });

  it('à 4 joueurs, coche le dernier, ajoute ou retire un champ par sortant et lance dans l’ordre (AC-04, AC-05)', () => {
    const { onLaunch } = renderDialog(fourPlayers(), ['Paul', 'Léa', 'Max']);
    const group = screen.getByRole('group', { name: 'Qui sort ?' });
    expect(within(group).queryByRole('checkbox', { name: /Alice/ })).toBeNull();
    const david = within(group).getByRole<HTMLInputElement>('checkbox', { name: /David/ });
    const chloe = within(group).getByRole<HTMLInputElement>('checkbox', { name: /Chloé/ });
    expect(david.checked).toBe(true);
    expect(david.disabled).toBe(true);
    expect(within(group).getByRole('checkbox', { name: /Bob/ }).closest('label')?.textContent).toContain('2e');
    expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'Challenger' }).value).toBe('Paul');

    fireEvent.click(chloe);
    expect(david.disabled).toBe(false);
    expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'Challenger 1' }).value).toBe('Paul');
    expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'Challenger 2' }).value).toBe('Léa');
    expect(screen.getByRole('button', { name: 'Mettre Chloé en challenger' })).toBeTruthy();
    expect(next()).toBe('Prochain : Max');

    fireEvent.click(david);
    expect(screen.queryByRole('textbox', { name: 'Challenger 2' })).toBeNull();
    fireEvent.click(chloe);
    expect(chloe.checked).toBe(true);
    fireEvent.click(david);
    fireEvent.click(screen.getByRole('button', { name: 'Lancer' }));
    expect(onLaunch).toHaveBeenCalledExactlyOnceWith({ leaverIds: ['chloe', 'david'], challengerNames: ['Paul', 'Léa'], queue: ['Max'] });
  });

  it('en 2 contre 2, fait sortir l’équipe perdante, passe au champ suivant par Entrée et remplit par raccourci (AC-06)', () => {
    const { onLaunch } = renderDialog(doubles());
    expect(screen.getByTestId('x01-challenger-leaving').textContent).toBe('Chloé / David sortent');
    const first = screen.getByRole('textbox', { name: /joueur 1 \(lance en premier\)/ });
    const second = screen.getByRole('textbox', { name: 'Équipe challenger, joueur 2' });
    type(first, 'Paul');
    fireEvent.keyDown(first, { key: 'Enter' });
    expect(document.activeElement).toBe(second);
    fireEvent.click(screen.getByRole('button', { name: 'Mettre David en challenger' }));
    expect((second as HTMLInputElement).value).toBe('David');
    fireEvent.keyDown(second, { key: 'Enter' });
    expect(onLaunch).toHaveBeenCalledExactlyOnceWith({ leaverIds: ['team2'], challengerNames: ['Paul', 'David'], queue: [] });
  });

  it('remplit le premier champ vide par raccourci quand aucun champ n’est actif', () => {
    renderDialog(doubles());
    fireEvent.focus(queueInput());
    fireEvent.click(screen.getByRole('button', { name: 'Mettre Chloé en challenger' }));
    expect(screen.getByRole<HTMLInputElement>('textbox', { name: /joueur 1/ }).value).toBe('Chloé');
    fireEvent.focus(queueInput());
    fireEvent.click(screen.getByRole('button', { name: 'Mettre David en challenger' }));
    expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'Équipe challenger, joueur 2' }).value).toBe('David');
    fireEvent.focus(queueInput());
    fireEvent.click(screen.getByRole('button', { name: 'Mettre Chloé en challenger' }));
    expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'Équipe challenger, joueur 2' }).value).toBe('David');
  });
});
