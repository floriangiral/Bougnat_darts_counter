// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { MatchInputBar } from '../../../components/match/MatchInputBar';
import { MatchTopBar } from '../../../components/match/MatchTopBar';
import { MatchStatusPill } from '../../../components/match/MatchStatusPill';
import { MatchPlayerArea } from '../../../components/game/MatchPlayerArea';
import { StartingPlayerOverlay } from '../../../components/game/StartingPlayerOverlay';
import { createMatch } from '../../../src/application/scoring/matchLifecycle';

afterEach(cleanup);

describe('StartingPlayerOverlay', () => {
  it('selects a competitor by ID rather than label and allows cancelling', () => {
    const onSelect = vi.fn();
    const onCancel = vi.fn();
    const view = render(<StartingPlayerOverlay options={[{ id: 'team1', label: 'Alice / Anne' }, { id: 'team2', label: 'Bob / Bill' }]} onSelect={onSelect} onCancel={onCancel} />);
    expect(view.getByRole('dialog', { name: 'Qui commence ?' })).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: 'Alice / Anne' }));
    fireEvent.click(view.getByRole('button', { name: 'Bob / Bill' }));
    expect(onSelect.mock.calls).toEqual([['team1'], ['team2']]);
    fireEvent.click(view.getByRole('button', { name: 'Quitter' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('supports a custom prompt and an empty competitor list', () => {
    const view = render(<StartingPlayerOverlay title="Tir a la bulle" options={[]} onSelect={vi.fn()} onCancel={vi.fn()} />);
    expect(view.getByRole('dialog', { name: 'Tir a la bulle' })).toBeTruthy();
    expect(view.getAllByRole('button')).toHaveLength(1);
  });
});

describe('MatchInputBar', () => {
  it('prioritizes typed input over voice suggestions and gates undo by history', () => {
    const props = {
      canUndo: false, inputBuffer: '', proposedVoiceScoreValue: null as number | null,
      showVoicePanel: false, voiceDisplayText: 'Cent quatre-vingts', onUndo: vi.fn(),
    };
    const view = render(<MatchInputBar {...props} />);
    expect(view.getByText('---')).toBeTruthy();
    expect(view.queryByText(props.voiceDisplayText)).toBeNull();
    const undo = view.getByRole('button', { name: 'Retour ↶' });
    expect((undo as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(undo);
    expect(props.onUndo).not.toHaveBeenCalled();
    view.rerender(<MatchInputBar {...props} canUndo proposedVoiceScoreValue={0} showVoicePanel />);
    expect(view.getByText('0')).toBeTruthy();
    expect(view.getByText(props.voiceDisplayText)).toBeTruthy();
    fireEvent.click(undo);
    expect(props.onUndo).toHaveBeenCalledOnce();
    view.rerender(<MatchInputBar {...props} inputBuffer="60" proposedVoiceScoreValue={180} />);
    expect(view.getByText('60')).toBeTruthy();
    expect(view.queryByText('180')).toBeNull();
  });
});

describe('MatchTopBar', () => {
  it('renders both responsive format labels and clock values and forwards all controls', () => {
    const props = {
      currentTime: '16:20', elapsedTime: '01:30', formatText: 'Premier a 3 manches',
      compactFormatText: '3 manches', onExit: vi.fn(), onOpenSettings: vi.fn(), onOpenStats: vi.fn(),
    };
    const view = render(<MatchTopBar {...props} />);
    for (const text of ['16:20', '01:30', 'Premier a 3 manches', '3 manches']) expect(view.getByText(text)).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: 'Statistiques' }));
    fireEvent.click(view.getByRole('button', { name: 'Configuration' }));
    fireEvent.click(view.getByRole('button', { name: 'Quitter' }));
    expect(props.onOpenStats).toHaveBeenCalledOnce();
    expect(props.onOpenSettings).toHaveBeenCalledOnce();
    expect(props.onExit).toHaveBeenCalledOnce();
  });
});

describe('MatchStatusPill', () => {
  it('switches legs to sets, retains leg counts and shows checkout hints only when enabled', () => {
    const props = {
      currentScore: 170, isSetsMode: false, leftLegsWon: 2, leftSetsWon: 4,
      rightLegsWon: 1, rightSetsWon: 3, showHints: false,
    };
    const view = render(<MatchStatusPill {...props} />);
    expect(view.getByText('MANCHES')).toBeTruthy();
    expect(view.getByText('2')).toBeTruthy();
    expect(view.getByText('1')).toBeTruthy();
    expect(view.queryByText('Checkout Path')).toBeNull();
    view.rerender(<MatchStatusPill {...props} isSetsMode showHints />);
    for (const text of ['SETS', '4', '3', '(2)', '(1)', 'Checkout Path']) expect(view.getByText(text)).toBeTruthy();
  });
});

describe('MatchPlayerArea', () => {
  it('passes the current player score and remaining preview through to the score presentation', () => {
    const match = createMatch([
      { id: 'alice', name: 'Alice', teamId: 'team1' },
      { id: 'bob', name: 'Bob', teamId: 'team2' },
    ], { startingScore: 501, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS', legsToWin: 3, setsToWin: 1, isDoubles: false });
    const view = render(<MatchPlayerArea match={match} teamId="team1" remainingPreview={null} compactMobileBrowser={false} />);
    expect(view.getByText('Alice')).toBeTruthy();
    expect(view.getByText('501')).toBeTruthy();
    view.rerender(<MatchPlayerArea match={match} teamId="team1" remainingPreview={{ teamId: 'team1', score: 441 }} compactMobileBrowser />);
    expect(view.getByText('441')).toBeTruthy();
    expect(view.queryByText('501')).toBeNull();
    expect(match.currentLeg.scores.team1).toBe(501);
  });
});
