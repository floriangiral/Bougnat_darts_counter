// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';

import { SetupMatchSection } from '../../../components/game-setup/SetupMatchSection';
import { SetupTargetScoreSection } from '../../../components/game-setup/SetupTargetScoreSection';
import { SetupX01RulesSection } from '../../../components/game-setup/SetupX01RulesSection';

afterEach(() => {
  cleanup();
});

describe('SetupTargetScoreSection', () => {
  it('renders X01 presets and forwards preset and custom selections', () => {
    const onPresetSelect = vi.fn();
    const onOpenCustomScore = vi.fn();

    const view = render(
      <SetupTargetScoreSection
        gameType="X01"
        presets={[301, 501]}
        startingScore={501}
        customScoreStr=""
        hasCustomScoreValue={false}
        isCustomActive={false}
        isCustomScoreValid
        onPresetSelect={onPresetSelect}
        onOpenCustomScore={onOpenCustomScore}
      />
    );

    fireEvent.click(view.getByRole('button', { name: '301' }));
    fireEvent.click(view.getByRole('button', { name: 'Perso' }));

    expect(onPresetSelect).toHaveBeenCalledWith(301);
    expect(onOpenCustomScore).toHaveBeenCalledOnce();
    expect(view.getByText('Score De Depart')).toBeTruthy();
  });

  it('renders Gotcha custom state and validation feedback', () => {
    const view = render(
      <SetupTargetScoreSection
        gameType="GOTCHA"
        presets={[301]}
        startingScore={301}
        customScoreStr=""
        hasCustomScoreValue={false}
        isCustomActive
        isCustomScoreValid={false}
        onPresetSelect={vi.fn()}
        onOpenCustomScore={vi.fn()}
      />
    );

    expect(view.getByText('Score Cible')).toBeTruthy();
    expect(view.getByRole('button', { name: 'PERSO' })).toBeTruthy();
    expect(view.getByText(/valeur de 2 ou plus/)).toBeTruthy();
  });

  it('does not render for unsupported game types', () => {
    const view = render(
      <SetupTargetScoreSection
        gameType="CRICKET"
        presets={[301]}
        startingScore={301}
        customScoreStr=""
        hasCustomScoreValue={false}
        isCustomActive={false}
        isCustomScoreValid
        onPresetSelect={vi.fn()}
        onOpenCustomScore={vi.fn()}
      />
    );

    expect(view.container.firstChild).toBeNull();
  });
});

describe('SetupMatchSection', () => {
  it('renders legs mode and forwards mode, preset, and custom actions', () => {
    const onSetMatchMode = vi.fn();
    const onSetLegsToWin = vi.fn();
    const onOpenCustomLegs = vi.fn();

    const view = render(
      <SetupMatchSection
        matchMode="LEGS"
        legsToWin={3}
        setsToWin={3}
        presetLegsOptions={[1, 3, 5]}
        isCustomLegsActive
        hasCustomLegsValue
        customLegsStr="7"
        isCustomLegsValid
        onSetMatchMode={onSetMatchMode}
        onSetLegsToWin={onSetLegsToWin}
        onSetSetsToWin={vi.fn()}
        onOpenCustomLegs={onOpenCustomLegs}
      />
    );

    fireEvent.click(view.getByRole('button', { name: 'Sets' }));
    fireEvent.click(view.getByRole('button', { name: '5' }));
    fireEvent.click(view.getByRole('button', { name: '7' }));

    expect(onSetMatchMode).toHaveBeenCalledWith('SETS');
    expect(onSetLegsToWin).toHaveBeenCalledWith(5);
    expect(onOpenCustomLegs).toHaveBeenCalledOnce();
  });

  it('renders sets mode and forwards set and leg targets', () => {
    const onSetSetsToWin = vi.fn();
    const onSetLegsToWin = vi.fn();

    const view = render(
      <SetupMatchSection
        matchMode="SETS"
        legsToWin={3}
        setsToWin={3}
        presetLegsOptions={[1, 3, 5]}
        isCustomLegsActive={false}
        hasCustomLegsValue={false}
        customLegsStr=""
        isCustomLegsValid
        onSetMatchMode={vi.fn()}
        onSetLegsToWin={onSetLegsToWin}
        onSetSetsToWin={onSetSetsToWin}
        onOpenCustomLegs={vi.fn()}
      />
    );

    fireEvent.click(view.getAllByRole('button', { name: '5' })[1]);
    fireEvent.click(view.getAllByRole('button', { name: '3' })[0]);

    expect(onSetSetsToWin).toHaveBeenCalledWith(3);
    expect(onSetLegsToWin).toHaveBeenCalledWith(5);
  });
});

describe('SetupX01RulesSection', () => {
  it('renders descriptions and forwards check-in and check-out rules', () => {
    const onSetCheckIn = vi.fn();
    const onSetCheckOut = vi.fn();

    const view = render(
      <SetupX01RulesSection
        checkIn="Open"
        checkOut="Double"
        onSetCheckIn={onSetCheckIn}
        onSetCheckOut={onSetCheckOut}
      />
    );

    fireEvent.click(view.getAllByRole('button', { name: 'Double' })[0]);
    const checkOutSection = view.getByText('Fermeture').parentElement;
    fireEvent.click(within(checkOutSection!).getByRole('button', { name: 'Master' }));

    expect(onSetCheckIn).toHaveBeenCalledWith('Double');
    expect(onSetCheckOut).toHaveBeenCalledWith('Master');
    expect(view.getByText('Le score commence immediatement.')).toBeTruthy();

    view.rerender(
      <SetupX01RulesSection
        checkIn="Double"
        checkOut="Master"
        onSetCheckIn={onSetCheckIn}
        onSetCheckOut={onSetCheckOut}
      />
    );

    expect(view.getByText('Un double est requis pour ouvrir le score.')).toBeTruthy();
    expect(view.getByText('Fin sur un double, un triple ou le bull.')).toBeTruthy();
  });
});
