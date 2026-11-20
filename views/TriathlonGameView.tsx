import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Player, MatchState, CricketMatchSummary, CapitalPlayerState, GameConfig, TriathlonResults } from '../types';
import { createMatch } from '../src/application/scoring/matchLifecycle';
import { MatchView } from './MatchView';
import { CricketGameView } from './CricketGameView';
import { CapitalGameView } from './CapitalGameView';
import { Button } from '../components/ui/Button';
import { buildTriathlonScorecards, sortTriathlonScorecards } from '../utils/triathlonScoring';
import {
  buildTriathlonCompetitors,
  createInitialTriathlonFlowState,
  finalizeTriathlonResults,
  rebuildScorecards,
  triathlonFlowReducer,
} from '../src/features/triathlon/triathlonFlow';
import { captureGameTiming } from '../src/features/game-session/gameTiming';
import type {
  CapitalRuntimeSnapshot,
  CricketRuntimeSnapshot,
  MatchRuntimeSnapshot,
  TriathlonRuntimeSnapshot,
  TriathlonStageRuntime,
} from '../src/shared/session/persistedAppSession';
import { StartingPlayerOverlay } from '../components/game/StartingPlayerOverlay';
import { TriathlonGameHeader } from '../components/triathlon/TriathlonGameHeader';
import { TriathlonStandingCard } from '../components/triathlon/TriathlonStandingCard';
import { TriathlonTransitionRecap } from '../components/triathlon/TriathlonTransitionRecap';
import { TriathlonStatsModal } from '../components/triathlon/TriathlonStatsModal';
import { TriathlonPhaseBand } from '../components/triathlon/TriathlonPhaseBand';

interface TriathlonGameViewProps {
  players: Player[];
  config: GameConfig;
  onExit: () => void;
  onFinish: (globalScores: Record<string, number>, results: TriathlonResults) => void;
  /** Triathlon restored after a reload, embedded event included (spec 010). */
  restoredState?: TriathlonRuntimeSnapshot | null;
  /** Called after each validated action of the flow or of the embedded game, never on a clock tick (spec 010). */
  onStateChange?: (snapshot: TriathlonRuntimeSnapshot) => void;
}

type StartingTeamId = GameConfig['initialStartingTeamId'];
type StagePhase = TriathlonStageRuntime['phase'];

/** Runtime of the embedded event restored after a reload, only for the event being mounted. */
type StageRuntimeOf<P extends StagePhase> = P extends 'CAPITAL'
  ? CapitalRuntimeSnapshot
  : P extends 'CRICKET'
    ? CricketRuntimeSnapshot
    : MatchRuntimeSnapshot;

const restoredRuntimeFor = <P extends StagePhase>(stage: TriathlonStageRuntime | null, phase: P): StageRuntimeOf<P> | null =>
  (stage?.phase === phase ? (stage.runtime as StageRuntimeOf<P>) : null);

const startingTeamIdFor = (isDoubles: boolean, startingCompetitorId: string | null): StartingTeamId =>
  (isDoubles && startingCompetitorId ? (startingCompetitorId as StartingTeamId) : undefined);

export const TriathlonGameView: React.FC<TriathlonGameViewProps> = ({ players, config, onExit, onFinish, restoredState = null, onStateChange }) => {
  const [flowState, dispatch] = useReducer(triathlonFlowReducer, null, () => restoredState?.flow ?? createInitialTriathlonFlowState());
  // The embedded game only receives the restored snapshot of the event that was in progress.
  const [restoredStage] = useState<TriathlonStageRuntime | null>(() => restoredState?.stage ?? null);
  const [stage, setStage] = useState<TriathlonStageRuntime | null>(() => restoredState?.stage ?? null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }));
  const [elapsedSeconds, setElapsedSeconds] = useState(() => restoredState?.timing.elapsedSeconds ?? 0);
  const elapsedSecondsRef = useRef(elapsedSeconds);
  const { phase, results, startingCompetitorId, scorecards } = flowState;

  const triathlonCompetitors = useMemo(
    () => buildTriathlonCompetitors(players, config.isDoubles),
    [players, config.isDoubles]
  );

  // Scorecards are always rebuilt from the finished events with the current scoring rules, so a
  // restored Triathlon never mixes two scoring versions.
  useEffect(() => {
    dispatch({
      type: 'set_scorecards',
      scorecards: rebuildScorecards(triathlonCompetitors, players, config.isDoubles, results),
    });
  }, [triathlonCompetitors, players, config.isDoubles, results]);

  useEffect(() => {
    elapsedSecondsRef.current = elapsedSeconds;
  }, [elapsedSeconds]);

  useEffect(() => {
    onStateChange?.({
      gameType: 'TRIATHLON',
      flow: flowState,
      stage: stage?.phase === flowState.phase ? stage : null,
      timing: captureGameTiming(elapsedSecondsRef.current, flowState.phase !== 'STARTING_DRAW'),
    });
  }, [flowState, onStateChange, stage]);

  const handleCapitalState = useCallback((runtime: CapitalRuntimeSnapshot) => setStage({ phase: 'CAPITAL', runtime }), []);
  const handleCricketState = useCallback((runtime: CricketRuntimeSnapshot) => setStage({ phase: 'CRICKET', runtime }), []);
  const handleX01State = useCallback((runtime: MatchRuntimeSnapshot) => setStage({ phase: 'X01', runtime }), []);
  const handleTieBreakState = useCallback((runtime: MatchRuntimeSnapshot) => setStage({ phase: 'TIE_BREAK_X01', runtime }), []);
  const restoredCapital = restoredRuntimeFor(restoredStage, 'CAPITAL');
  const restoredCricket = restoredRuntimeFor(restoredStage, 'CRICKET');
  const restoredX01 = restoredRuntimeFor(restoredStage, 'X01');
  const restoredTieBreak = restoredRuntimeFor(restoredStage, 'TIE_BREAK_X01');
  const startingTeamId = startingTeamIdFor(config.isDoubles, startingCompetitorId);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }));
      if (phase !== 'STARTING_DRAW') {
        setElapsedSeconds((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  const rankedScorecards = useMemo(
    () => sortTriathlonScorecards(scorecards, results.tieBreakWinnerId),
    [scorecards, results.tieBreakWinnerId]
  );

  const startingPlayerIndex = config.isDoubles
    ? Math.max(0, players.findIndex((player) => player.teamId === startingCompetitorId))
    : Math.max(0, players.findIndex((player) => player.id === startingCompetitorId));

  const x01Match: MatchState = useMemo(
    () =>
      createMatch(players, {
        startingScore: 501,
        checkIn: 'Open',
        checkOut: 'Double',
        matchMode: 'LEGS',
        legsToWin: 1,
        setsToWin: 1,
        isDoubles: config.isDoubles,
        initialStartingPlayerIndex: startingPlayerIndex,
        initialStartingTeamId: startingTeamId,
        teamStarterIds: config.teamStarterIds,
      }),
    [players, config.isDoubles, config.teamStarterIds, startingPlayerIndex, startingTeamId]
  );

  const tieBreakMatch: MatchState = useMemo(
    () =>
      createMatch(players, {
        startingScore: 501,
        checkIn: 'Open',
        checkOut: 'Double',
        matchMode: 'LEGS',
        legsToWin: 1,
        setsToWin: 1,
        isDoubles: config.isDoubles,
        initialStartingPlayerIndex: startingPlayerIndex,
        initialStartingTeamId: startingTeamId,
        teamStarterIds: config.teamStarterIds,
      }),
    [players, config.isDoubles, config.teamStarterIds, startingPlayerIndex, startingTeamId]
  );

  const cricketConfig: GameConfig = useMemo(
    () => ({
      ...config,
      initialStartingPlayerIndex: startingPlayerIndex,
      initialStartingTeamId: startingTeamId,
      teamStarterIds: config.teamStarterIds,
    }),
    [config, startingPlayerIndex, startingTeamId]
  );

  const capitalConfig: GameConfig = useMemo(
    () => ({
      ...config,
      isDoubles: false,
      initialStartingPlayerIndex: startingPlayerIndex,
      initialStartingTeamId: undefined,
    }),
    [config, startingPlayerIndex]
  );

  const updateScorecards = (nextResults: TriathlonResults) =>
    buildTriathlonScorecards({
      competitors: triathlonCompetitors,
      sourcePlayers: players,
      isDoubles: config.isDoubles,
      capitalResults: nextResults.capital ?? null,
      cricketSummary: nextResults.cricket ?? null,
      x01Match: nextResults.x01 ?? null,
    });

  const handleStarterSelect = (starterId: string) => {
    dispatch({
      type: 'starter_resolved',
      starterId: starterId || triathlonCompetitors[0]?.id || null,
      attempts: {},
      triathlonCompetitors,
    });
  };

  const handleCapitalFinish = (capitalResults: CapitalPlayerState[]) => {
    const nextResults: TriathlonResults = {
      ...results,
      capital: capitalResults,
      triathlonCompetitors,
    };
    const nextScorecards = updateScorecards(nextResults);
    dispatch({
      type: 'capital_finished',
      capital: capitalResults,
      triathlonCompetitors,
      scorecards: nextScorecards,
    });
  };

  const handleCricketFinish = (summary: CricketMatchSummary) => {
    const nextResults: TriathlonResults = {
      ...results,
      cricket: summary,
      triathlonCompetitors,
    };
    const nextScorecards = updateScorecards(nextResults);
    dispatch({
      type: 'cricket_finished',
      cricket: summary,
      triathlonCompetitors,
      scorecards: nextScorecards,
    });
  };

  const handleX01Finish = (_winnerId: string, finalState: MatchState) => {
    const nextResults: TriathlonResults = {
      ...results,
      x01: finalState,
      triathlonCompetitors,
    };
    const nextScorecards = updateScorecards(nextResults);
    const finalized = finalizeTriathlonResults(nextResults, nextScorecards, triathlonCompetitors, onFinish);
    dispatch({
      type: 'x01_finished',
      x01: finalState,
      triathlonCompetitors,
      scorecards: nextScorecards,
      requiresTieBreak: !finalized,
    });
  };

  const handleTieBreakFinish = (_winnerId: string, finalState: MatchState) => {
    const nextResults: TriathlonResults = {
      ...results,
      tieBreakMatch: finalState,
      tieBreakWinnerId: finalState.matchWinnerId,
      triathlonCompetitors,
    };
    dispatch({
      type: 'tiebreak_finished',
      tieBreakMatch: finalState,
      tieBreakWinnerId: finalState.matchWinnerId,
      triathlonCompetitors,
    });
    finalizeTriathlonResults(nextResults, scorecards, triathlonCompetitors, onFinish);
  };

  const isTransition = phase === 'TRANSITION_CRICKET' || phase === 'TRANSITION_X01';
  const isAfterCapital = phase === 'TRANSITION_CRICKET';

  const renderStage = () => {
    if (phase === 'STARTING_DRAW') {
      return (
        <StartingPlayerOverlay
          options={triathlonCompetitors.map((entry) => ({ id: entry.id, label: entry.name }))}
          onSelect={handleStarterSelect}
          onCancel={onExit}
        />
      );
    }

    if (isTransition) {
      return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-canvas text-fg">
          <TriathlonGameHeader
            currentTime={currentTime}
            elapsedSeconds={elapsedSeconds}
            onShowStats={() => setShowStats(true)}
            onShowExitConfirm={() => setShowExitConfirm(true)}
          />
          <div className="triathlon-transition flex flex-1 flex-col items-center gap-6 overflow-y-auto p-4 sm:gap-8 sm:p-6">
            <h1
              data-testid="triathlon-transition-title"
              className={`text-center text-3xl font-black italic uppercase sm:text-5xl ${isAfterCapital ? 'text-game-capital-fg' : 'text-game-cricket-fg'}`}
            >
              {isAfterCapital ? 'Capital terminé' : 'Cricket terminé'}
            </h1>
            <TriathlonTransitionRecap
              eventKey={isAfterCapital ? 'capital' : 'cricket'}
              eventLabel={isAfterCapital ? 'Capital' : 'Cricket'}
              scorecards={rankedScorecards}
            />
            <TriathlonStandingCard scorecards={rankedScorecards} tieBreakWinnerId={results.tieBreakWinnerId} />
            <Button
              onClick={() => dispatch({ type: 'advance_phase', phase: isAfterCapital ? 'CRICKET' : 'X01' })}
              size="lg"
              className="w-full max-w-md shrink-0 rounded-xl text-lg sm:min-h-20 sm:text-2xl"
            >
              Suivant
            </Button>
          </div>
        </div>
      );
    }

    if (phase === 'CAPITAL') {
      return (
        <CapitalGameView
          players={players}
          config={capitalConfig}
          onFinish={handleCapitalFinish}
          onExit={onExit}
          skipStartingPlayerPrompt
          restoredState={restoredCapital}
          onStateChange={handleCapitalState}
        />
      );
    }

    if (phase === 'CRICKET') {
      return (
        <CricketGameView
          players={players}
          config={cricketConfig}
          onFinish={handleCricketFinish}
          onExit={onExit}
          skipStartingPlayerPrompt
          finishActionLabel="Épreuve suivante"
          restoredState={restoredCricket}
          onStateChange={handleCricketState}
        />
      );
    }

    if (phase === 'X01') {
      return (
        <MatchView
          initialMatch={restoredX01?.match ?? x01Match}
          onFinish={() => {}}
          onFinishWithState={handleX01Finish}
          onExit={onExit}
          skipStartingPlayerPrompt
          restoredState={restoredX01}
          onStateChange={handleX01State}
        />
      );
    }

    return (
      <MatchView
        initialMatch={restoredTieBreak?.match ?? tieBreakMatch}
        onFinish={() => {}}
        onFinishWithState={handleTieBreakFinish}
        onExit={onExit}
        skipStartingPlayerPrompt
        restoredState={restoredTieBreak}
        onStateChange={handleTieBreakState}
      />
    );
  };

  // Spec 072 FR-06 : un seul habillage plein écran ; chaque épreuve garde sa propre recette (GameScreenLayout)
  // dans la scène, sous le bandeau de progression. La structure ne dépend pas de la recette (FR-10).
  return (
    <div className="triathlon-screen" data-game="triathlon" data-phase={phase} data-testid="triathlon-screen">
      <TriathlonPhaseBand phase={phase} />
      <div className="triathlon-stage">{renderStage()}</div>

      {showExitConfirm && (
        <dialog open aria-label="Quitter le Triathlon ?" className="app-modal tablet-modal fixed inset-0 z-[80] m-0 flex h-full w-full max-h-none max-w-none items-center justify-center border-0 bg-scrim p-4 text-fg backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border-strong bg-surface p-6 text-center shadow-elevated">
            <h2 className="mb-2 text-2xl font-black italic uppercase text-fg">Quitter ?</h2>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => setShowExitConfirm(false)}>Non</Button>
              <Button variant="danger" onClick={onExit}>Oui</Button>
            </div>
          </div>
        </dialog>
      )}

      {showStats && (
        <TriathlonStatsModal
          scorecards={rankedScorecards}
          tieBreakWinnerId={results.tieBreakWinnerId}
          onClose={() => setShowStats(false)}
        />
      )}
    </div>
  );
};
