import React, { useEffect, useMemo, useReducer, useState } from 'react';
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
  triathlonFlowReducer,
} from '../src/features/triathlon/triathlonFlow';
import { StartingPlayerOverlay } from '../components/game/StartingPlayerOverlay';
import { TriathlonGameHeader } from '../components/triathlon/TriathlonGameHeader';
import { TriathlonStandingCard } from '../components/triathlon/TriathlonStandingCard';
import { TriathlonTransitionRecap } from '../components/triathlon/TriathlonTransitionRecap';
import { TriathlonStatsModal } from '../components/triathlon/TriathlonStatsModal';

interface TriathlonGameViewProps {
  players: Player[];
  config: GameConfig;
  onExit: () => void;
  onFinish: (globalScores: Record<string, number>, results: TriathlonResults) => void;
}

export const TriathlonGameView: React.FC<TriathlonGameViewProps> = ({ players, config, onExit, onFinish }) => {
  const [flowState, dispatch] = useReducer(triathlonFlowReducer, undefined, createInitialTriathlonFlowState);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }));
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const { phase, results, startingCompetitorId, scorecards } = flowState;

  const triathlonCompetitors = useMemo(
    () => buildTriathlonCompetitors(players, config.isDoubles),
    [players, config.isDoubles]
  );

  useEffect(() => {
    dispatch({
      type: 'set_scorecards',
      scorecards: buildTriathlonScorecards({
        competitors: triathlonCompetitors,
        sourcePlayers: players,
        isDoubles: config.isDoubles,
      }),
    });
  }, [triathlonCompetitors, players, config.isDoubles]);

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
        initialStartingTeamId: config.isDoubles ? (startingCompetitorId as ("team1" | "team2" | undefined)) || undefined : undefined,
        teamStarterIds: config.teamStarterIds,
      }),
    [players, config.isDoubles, config.teamStarterIds, startingPlayerIndex, startingCompetitorId]
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
        initialStartingTeamId: config.isDoubles ? (startingCompetitorId as ("team1" | "team2" | undefined)) || undefined : undefined,
        teamStarterIds: config.teamStarterIds,
      }),
    [players, config.isDoubles, config.teamStarterIds, startingPlayerIndex, startingCompetitorId]
  );

  const cricketConfig: GameConfig = useMemo(
    () => ({
      ...config,
      initialStartingPlayerIndex: startingPlayerIndex,
      initialStartingTeamId: config.isDoubles ? (startingCompetitorId as ("team1" | "team2" | undefined)) || undefined : undefined,
      teamStarterIds: config.teamStarterIds,
    }),
    [config, startingPlayerIndex, startingCompetitorId]
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

  if (phase === 'STARTING_DRAW') {
    return (
      <div className="smartphone-triathlon-stage tablet-triathlon-root relative h-[100dvh] bg-black">
        <StartingPlayerOverlay
          options={triathlonCompetitors.map((entry) => ({ id: entry.id, label: entry.name }))}
          onSelect={handleStarterSelect}
          onCancel={onExit}
        />
      </div>
    );
  }

  if (phase === 'TRANSITION_CRICKET' || phase === 'TRANSITION_X01') {
    const isAfterCapital = phase === 'TRANSITION_CRICKET';
    const recapKey = isAfterCapital ? 'capital' : 'cricket';
    const recapLabel = isAfterCapital ? 'Capital' : 'Cricket';

    return (
      <div className="smartphone-triathlon-stage flex h-[100dvh] flex-col overflow-hidden bg-black text-white">
        <TriathlonGameHeader
          currentTime={currentTime}
          elapsedSeconds={elapsedSeconds}
          onShowStats={() => setShowStats(true)}
          onShowExitConfirm={() => setShowExitConfirm(true)}
        />
        <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto p-4 sm:gap-8 sm:p-6">
          <h1 className={`text-center text-3xl font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r ${isAfterCapital ? 'from-blue-500 to-cyan-500' : 'from-green-500 to-emerald-500'} sm:text-5xl`}>
            {isAfterCapital ? 'Capital termine' : 'Cricket termine'}
          </h1>
          <TriathlonTransitionRecap eventKey={recapKey} eventLabel={recapLabel} scorecards={rankedScorecards} />
          <TriathlonStandingCard scorecards={rankedScorecards} tieBreakWinnerId={results.tieBreakWinnerId} />
          <Button
            onClick={() => dispatch({ type: 'advance_phase', phase: isAfterCapital ? 'CRICKET' : 'X01' })}
            size="lg"
            className="h-14 w-full max-w-md border-none bg-gradient-to-r from-red-600 to-orange-600 text-lg uppercase shadow-lg shadow-red-900/40 hover:from-red-500 hover:to-orange-500 sm:h-20 sm:text-2xl"
          >
            Suivant
          </Button>
        </div>
        {showStats && (
          <TriathlonStatsModal
            scorecards={rankedScorecards}
            tieBreakWinnerId={results.tieBreakWinnerId}
            onClose={() => setShowStats(false)}
          />
        )}
        {showExitConfirm && (
          <div className="app-modal fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl border border-gray-700 bg-gray-900 p-6 text-center shadow-2xl">
              <h3 className="mb-2 text-2xl font-black italic uppercase text-white">Quitter ?</h3>
              <div className="mt-8 grid grid-cols-2 gap-3">
                <Button variant="secondary" onClick={() => setShowExitConfirm(false)}>Non</Button>
                <Button variant="danger" onClick={onExit}>Oui</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (phase === 'CAPITAL') {
    return (
      <div className="smartphone-triathlon-stage tablet-triathlon-root relative h-[100dvh] bg-black">
        <CapitalGameView
          players={players}
          config={capitalConfig}
          onFinish={handleCapitalFinish}
          onExit={onExit}
          skipStartingPlayerPrompt
        />
      </div>
    );
  }

  if (phase === 'CRICKET') {
    return (
      <div className="smartphone-triathlon-stage tablet-triathlon-root relative h-[100dvh] bg-black">
        <CricketGameView
          players={players}
          config={cricketConfig}
          onFinish={handleCricketFinish}
          onExit={onExit}
          skipStartingPlayerPrompt
        />
      </div>
    );
  }

  if (phase === 'X01') {
    return (
      <div className="smartphone-triathlon-stage tablet-triathlon-root relative h-[100dvh] bg-black">
        <MatchView
          initialMatch={x01Match}
          onFinish={() => {}}
          onFinishWithState={handleX01Finish}
          onExit={onExit}
          skipStartingPlayerPrompt
        />
      </div>
    );
  }

  return (
    <div className="smartphone-triathlon-stage tablet-triathlon-root relative h-[100dvh] bg-black">
      <MatchView
        initialMatch={tieBreakMatch}
        onFinish={() => {}}
        onFinishWithState={handleTieBreakFinish}
        onExit={onExit}
        skipStartingPlayerPrompt
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex justify-center p-4">
        <div className="rounded-2xl border border-orange-500/30 bg-black/95 px-5 py-3 text-center shadow-[0_0_30px_rgba(249,115,22,0.18)]">
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Tie-Break</div>
          <div className="mt-1 text-lg font-black uppercase text-white">501 supplementaire</div>
          <div className="mt-2 text-xs font-bold text-gray-400">
            Le gagnant du tir a la bulle ouvre ce match decisif.
          </div>
        </div>
      </div>

      {showExitConfirm && (
        <div className="app-modal fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-gray-700 bg-gray-900 p-6 text-center shadow-2xl">
            <h3 className="mb-2 text-2xl font-black italic uppercase text-white">Quitter ?</h3>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => setShowExitConfirm(false)}>Non</Button>
              <Button variant="danger" onClick={onExit}>Oui</Button>
            </div>
          </div>
        </div>
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
