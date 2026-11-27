// @vitest-environment jsdom
// Spec 137 : actions de l'écran de fin X01 (AC-01, AC-10, AC-11, AC-15).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { StatsView } from '../../../views/StatsView';
import { createMatch } from '../../../src/application/scoring/matchLifecycle';
import { ViewportContext } from '../../../src/features/layout/useViewportClass';
import { resolveViewportClass } from '../../../src/features/layout/viewportClass';
import type { TakeTheTableRequest } from '../../../src/features/x01/challenger/x01Challenger';
import type { GameConfig, MatchState, Player } from '../../../types';

vi.mock('../../../src/presentation/stats/x01ResultImage.fr', () => ({
  createX01ResultImage: vi.fn(() => new Promise(() => undefined)),
}));

vi.mock('../../../components/stats/StatsModal', () => ({
  StatsModal: ({ title }: { title: string }) => <div>{title}</div>,
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const config: GameConfig = {
  startingScore: 501, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS', legsToWin: 1, setsToWin: 1, isDoubles: false,
};
const players: Player[] = [
  { id: 'alice', name: 'Alice', teamId: 'alice' },
  { id: 'bob', name: 'Bob', teamId: 'bob' },
];
const finished = (): MatchState => ({ ...createMatch(players, config), status: 'finished', matchWinnerId: 'alice' });

const viewportOf = (width: number, height: number, isTouch = true) =>
  resolveViewportClass({ width, height, isTouch, accessMode: 'local' });

const renderStats = ({
  viewport = viewportOf(390, 844),
  withRematch = true,
  withChallenge = true,
  onHome = vi.fn(),
  onTakeTheTable = vi.fn<(request: TakeTheTableRequest) => void>(),
} = {}) => {
  render(
    <ViewportContext.Provider value={viewport}>
      <StatsView
        match={finished()}
        winnerId="alice"
        onHome={onHome}
        onRematch={withRematch ? vi.fn() : undefined}
        onTakeTheTable={withChallenge ? onTakeTheTable : undefined}
        challengerQueue={['Léa']}
      />
    </ViewportContext.Provider>,
  );
  return { onHome, onTakeTheTable, row: screen.getByTestId('stats-actions-row') };
};

describe('StatsView — Je prends la gagne', () => {
  it('ordonne Revanche, Je prends la gagne, Partager, Sortie avec leurs variantes (AC-01)', () => {
    const { row } = renderStats();
    const buttons = [...row.querySelectorAll('button')];
    expect(buttons.map((button) => [button.textContent, button.dataset.variant])).toEqual([
      ['REVANCHE', 'rematch'],
      ['JE PRENDS LA GAGNE', 'challenge'],
      ['PARTAGER', 'secondary'],
      ['SORTIE', 'primary'],
    ]);
    expect(buttons.every((button) => button.querySelector('.fit-text'))).toBe(true);
  });

  it.each([
    ['téléphone en portrait', viewportOf(390, 844), 'grid', 'grid-cols-2', 'min-h-11', 'max-w-lg'],
    ['petit téléphone en portrait', viewportOf(360, 640), 'grid', 'grid-cols-2', 'min-h-11', 'max-w-lg'],
    ['téléphone en paysage', viewportOf(844, 390), 'row-wide', 'grid-cols-4', 'min-h-11', 'max-w-4xl'],
    ['tablette en portrait', viewportOf(768, 1024), 'row-wide', 'grid-cols-4', 'min-h-12', 'max-w-4xl'],
    ['tablette en paysage', viewportOf(1024, 768), 'row-wide', 'grid-cols-4', 'min-h-12', 'max-w-4xl'],
    ['ordinateur', viewportOf(1440, 900, false), 'row-wide', 'grid-cols-4', 'min-h-12', 'max-w-4xl'],
  ])('dispose les quatre actions sur %s (AC-15)', (_label, viewport, layout, columns, height, width) => {
    const { row } = renderStats({ viewport });
    const actions = row.parentElement as HTMLElement;
    expect(actions.dataset.actionsLayout).toBe(layout);
    expect(actions.className).toContain(width);
    expect(row.className).toContain(columns);
    for (const button of row.querySelectorAll('button')) expect(button.className).toContain(height);
  });

  it('garde la rangée unique avec trois boutons ou moins', () => {
    const { row } = renderStats({ withChallenge: false });
    expect(row.parentElement?.dataset.actionsLayout).toBe('row');
    expect(row.className).toContain('grid-cols-3');
    expect(screen.queryByTestId('stats-take-the-table')).toBeNull();
  });

  it('suspend la sortie automatique pendant la fenêtre, puis la relance à la fermeture (AC-10, AC-11)', () => {
    vi.useFakeTimers();
    const { onHome } = renderStats();
    const trigger = screen.getByTestId('stats-take-the-table');
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Qui prend la gagne ?' })).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(180_000);
    });
    expect(onHome).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    act(() => {
      vi.advanceTimersByTime(119_000);
    });
    expect(onHome).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(onHome).toHaveBeenCalledOnce();
  });

  it('transmet la demande de lancement avec la file préremplie', () => {
    const { onTakeTheTable } = renderStats();
    fireEvent.click(screen.getByTestId('stats-take-the-table'));
    expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'Challenger' }).value).toBe('Léa');
    fireEvent.click(screen.getByTestId('x01-challenger-launch'));
    expect(onTakeTheTable).toHaveBeenCalledExactlyOnceWith({ leaverIds: ['bob'], challengerNames: ['Léa'], queue: [] });
  });
});
