// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { formatDuration } from '../../../src/application/scoring/matchLifecycle';
import type { CapitalPlayerState, CricketMatchSummary, GameConfig, Player } from '../../../types';
import { CricketGameView } from '../../../views/CricketGameView';
import { TriathlonGameView } from '../../../views/TriathlonGameView';

vi.mock('../../../views/CapitalGameView', () => ({
  CapitalGameView: ({ players, onFinish }: { players: Player[]; onFinish: (results: CapitalPlayerState[]) => void }) => (
    <button
      type="button"
      onClick={() => onFinish(players.map((player) => ({ id: player.id, name: player.name, score: 0, targetIndex: 0, history: [] })))}
    >
      Terminer le Capital
    </button>
  ),
}));

const players: Player[] = [
  { id: 'anne', name: 'Anne', teamId: 'team1' },
  { id: 'zoe', name: 'Zoé', teamId: 'team2' },
];

const buildConfig = (cricketRounds = 20): GameConfig => ({
  startingScore: 501,
  checkIn: 'Open',
  checkOut: 'Double',
  matchMode: 'LEGS',
  legsToWin: 3,
  setsToWin: 1,
  isDoubles: false,
  cricketRounds,
  initialStartingPlayerIndex: 0,
});

const click = (element: HTMLElement) => {
  act(() => {
    fireEvent.click(element);
  });
};

const triple = (target: 20 | 19 | 18 | 17 | 16 | 15) => click(screen.getAllByRole('button', { name: String(target) })[2]);
const tripleMiss = () => click(screen.getByRole('button', { name: '3 MISS' }));
const bull = () => click(screen.getByRole('button', { name: 'BULL' }));
const doubleBull = () => click(screen.getByRole('button', { name: 'D-BULL' }));

// Anne ferme tout en trois tours pendant que Zoé rate tout ; la fléchette gagnante est le BULL final.
const playUntilAnneWins = () => {
  triple(20);
  triple(19);
  triple(18);
  tripleMiss();
  triple(17);
  triple(16);
  triple(15);
  tripleMiss();
  doubleBull();
  bull();
};

const renderCricket = (config = buildConfig()) => {
  const onFinish = vi.fn<(results: CricketMatchSummary) => void>();
  render(<CricketGameView players={players} config={config} onExit={vi.fn()} onFinish={onFinish} skipStartingPlayerPrompt />);
  return { onFinish };
};

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('CricketGameView — fin de partie', () => {
  it("affiche l'écran de victoire sans transmettre le résultat avant validation", () => {
    const { onFinish } = renderCricket();

    playUntilAnneWins();

    expect(screen.getByText('Match remporté')).toBeTruthy();
    expect(screen.getByText('Anne')).toBeTruthy();
    expect(onFinish).not.toHaveBeenCalled();
  });

  it('annule la fléchette gagnante, reprend le chrono et ne valide le résultat qu’une seule fois', () => {
    vi.useFakeTimers();
    const { onFinish } = renderCricket();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    playUntilAnneWins();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    click(screen.getByRole('button', { name: 'Annuler la dernière fléchette' }));

    expect(screen.queryByText('Match remporté')).toBeNull();
    expect(screen.getByText(formatDuration(3))).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText(formatDuration(5))).toBeTruthy();
    expect(onFinish).not.toHaveBeenCalled();

    // Même lanceuse, même fléchette : le BULL rejoué termine à nouveau la partie.
    bull();
    const validate = screen.getByRole('button', { name: /Voir les statistiques/ });
    click(validate);
    click(validate);

    expect(onFinish).toHaveBeenCalledOnce();
    const summary = onFinish.mock.calls[0][0];
    expect(summary.winnerId).toBe('anne');
    expect(summary.legsWon).toEqual({ anne: 1 });
    expect(summary.competitors.find((competitor) => competitor.id === 'anne')?.marks[25]).toBe(3);
    expect(summary.competitors.find((competitor) => competitor.id === 'anne')?.dartsThrown).toBe(8);
  });

  it('déclare une égalité à la limite de tours au lieu de départager par le prénom', () => {
    const { onFinish } = renderCricket(buildConfig(1));

    tripleMiss();
    tripleMiss();

    expect(screen.getByText('Égalité')).toBeTruthy();
    expect(screen.queryByText('Match remporté')).toBeNull();
    expect(onFinish).not.toHaveBeenCalled();

    click(screen.getByRole('button', { name: /Voir les statistiques/ }));

    expect(onFinish).toHaveBeenCalledOnce();
    expect(onFinish.mock.calls[0][0].winnerId).toBeNull();
    expect(onFinish.mock.calls[0][0].legsWon).toEqual({});
  });
});

describe('TriathlonGameView — fin du Cricket', () => {
  it("affiche l'écran de fin du Cricket puis lance l'épreuve suivante à la validation", () => {
    render(<TriathlonGameView players={players} config={buildConfig()} onExit={vi.fn()} onFinish={vi.fn()} />);
    click(screen.getByRole('button', { name: 'Anne' }));
    click(screen.getByRole('button', { name: 'Terminer le Capital' }));
    click(screen.getByRole('button', { name: 'Suivant' }));

    playUntilAnneWins();

    expect(screen.getByText('Match remporté')).toBeTruthy();
    expect(screen.queryByText('Cricket terminé')).toBeNull();
    expect(screen.queryByRole('button', { name: /Voir les statistiques/ })).toBeNull();

    click(screen.getByRole('button', { name: /Épreuve suivante/ }));

    expect(screen.getByText('Cricket terminé')).toBeTruthy();
  });
});
