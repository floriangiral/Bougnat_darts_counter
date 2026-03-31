import React, { useEffect, useMemo, useReducer, useState } from 'react';
import { Player, MatchState, CricketMatchSummary, CapitalPlayerState, GameConfig, BullAttempt, TriathlonResults } from '../types';
import { createMatch, formatDuration } from '../utils/gameLogic';
import { MatchView } from './MatchView';
import { CricketGameView } from './CricketGameView';
import { CapitalGameView } from './CapitalGameView';
import { Button } from '../components/ui/Button';
import { buildTriathlonScorecards, getTriathlonWinnerId, sortTriathlonScorecards, TriathlonScorecard } from '../utils/triathlonScoring';

type TriathlonPhase =
  | 'STARTING_DRAW'
  | 'CAPITAL'
  | 'TRANSITION_CRICKET'
  | 'CRICKET'
  | 'TRANSITION_X01'
  | 'X01'
  | 'TIE_BREAK_X01';

type BullAttempt = 'DOUBLE_BULL' | 'BULL' | 'MISS';

interface TriathlonGameViewProps {
  players: Player[];
  config: GameConfig;
  onExit: () => void;
  onFinish: (globalScores: Record<string, number>, results: TriathlonResults) => void;
}

const buildTriathlonCompetitors = (players: Player[], isDoubles: boolean): Player[] => {
  if (!isDoubles) {
    return players.map((player) => ({
      id: player.id,
      name: player.name,
      teamId: player.id,
    }));
  }

  const teamIds = Array.from(new Set(players.map((player) => player.teamId)));
  return teamIds.map((teamId, index) => ({
    id: teamId,
    name: `Equipe ${index + 1}`,
    teamId,
  }));
};

const getAttemptValue = (attempt: BullAttempt | undefined) => {
  if (attempt === 'DOUBLE_BULL') return 50;
  if (attempt === 'BULL') return 25;
  return 0;
};

const buildScoresFromScorecards = (scorecards: TriathlonScorecard[]) =>
  Object.fromEntries(scorecards.map((card) => [card.competitorId, card.totalScore]));

const SCORE_SECTIONS = [
  { key: 'capital' as const, label: 'Capital' },
  { key: 'cricket' as const, label: 'Cricket' },
  { key: 'x01' as const, label: '501' },
];

type TriathlonFlowState = {
  phase: TriathlonPhase;
  results: TriathlonResults;
  startingCompetitorId: string | null;
  starterDrawAttempts: Record<string, BullAttempt | undefined>;
  starterDrawMessage: string;
  scorecards: TriathlonScorecard[];
};

type TriathlonFlowAction =
  | { type: 'set_scorecards'; scorecards: TriathlonScorecard[] }
  | { type: 'advance_phase'; phase: Extract<TriathlonPhase, 'CRICKET' | 'X01'> }
  | { type: 'starter_attempts_updated'; attempts: Record<string, BullAttempt | undefined>; message?: string }
  | { type: 'starter_resolved'; starterId: string | null; attempts: Record<string, BullAttempt | undefined>; triathlonCompetitors: Player[] }
  | { type: 'capital_finished'; capital: CapitalPlayerState[]; triathlonCompetitors: Player[]; scorecards: TriathlonScorecard[] }
  | { type: 'cricket_finished'; cricket: CricketMatchSummary; triathlonCompetitors: Player[]; scorecards: TriathlonScorecard[] }
  | { type: 'x01_finished'; x01: MatchState; triathlonCompetitors: Player[]; scorecards: TriathlonScorecard[]; requiresTieBreak: boolean }
  | { type: 'tiebreak_finished'; tieBreakMatch: MatchState; tieBreakWinnerId: string | null; triathlonCompetitors: Player[] };

const INITIAL_STARTER_DRAW_MESSAGE = 'Une fleche a la bulle pour determiner le premier lanceur.';

const createInitialTriathlonFlowState = (): TriathlonFlowState => ({
  phase: 'STARTING_DRAW',
  results: {},
  startingCompetitorId: null,
  starterDrawAttempts: {},
  starterDrawMessage: INITIAL_STARTER_DRAW_MESSAGE,
  scorecards: [],
});

const triathlonFlowReducer = (state: TriathlonFlowState, action: TriathlonFlowAction): TriathlonFlowState => {
  switch (action.type) {
    case 'set_scorecards':
      return {
        ...state,
        scorecards: action.scorecards,
      };
    case 'advance_phase':
      return {
        ...state,
        phase: action.phase,
      };
    case 'starter_attempts_updated':
      return {
        ...state,
        starterDrawAttempts: action.attempts,
        starterDrawMessage: action.message ?? state.starterDrawMessage,
      };
    case 'starter_resolved':
      return {
        ...state,
        phase: 'CAPITAL',
        startingCompetitorId: action.starterId,
        starterDrawAttempts: action.attempts,
        results: {
          ...state.results,
          startingBull: {
            attempts: action.attempts,
            starterId: action.starterId,
            triathlonCompetitors: action.triathlonCompetitors,
          },
        },
      };
    case 'capital_finished':
      return {
        ...state,
        phase: 'TRANSITION_CRICKET',
        results: {
          ...state.results,
          capital: action.capital,
          triathlonCompetitors: action.triathlonCompetitors,
        },
        scorecards: action.scorecards,
      };
    case 'cricket_finished':
      return {
        ...state,
        phase: 'TRANSITION_X01',
        results: {
          ...state.results,
          cricket: action.cricket,
          triathlonCompetitors: action.triathlonCompetitors,
        },
        scorecards: action.scorecards,
      };
    case 'x01_finished':
      return {
        ...state,
        phase: action.requiresTieBreak ? 'TIE_BREAK_X01' : state.phase,
        results: {
          ...state.results,
          x01: action.x01,
          triathlonCompetitors: action.triathlonCompetitors,
        },
        scorecards: action.scorecards,
      };
    case 'tiebreak_finished':
      return {
        ...state,
        results: {
          ...state.results,
          tieBreakMatch: action.tieBreakMatch,
          tieBreakWinnerId: action.tieBreakWinnerId,
          triathlonCompetitors: action.triathlonCompetitors,
        },
      };
    default:
      return state;
  }
};

export const TriathlonGameView: React.FC<TriathlonGameViewProps> = ({ players, config, onExit, onFinish }) => {
  const [flowState, dispatch] = useReducer(triathlonFlowReducer, undefined, createInitialTriathlonFlowState);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }));
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const { phase, results, startingCompetitorId, starterDrawAttempts, starterDrawMessage, scorecards } = flowState;

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
        initialStartingTeamId: config.isDoubles ? startingCompetitorId || undefined : undefined,
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
        initialStartingTeamId: config.isDoubles ? startingCompetitorId || undefined : undefined,
        teamStarterIds: config.teamStarterIds,
      }),
    [players, config.isDoubles, config.teamStarterIds, startingPlayerIndex, startingCompetitorId]
  );

  const cricketConfig: GameConfig = useMemo(
    () => ({
      ...config,
      initialStartingPlayerIndex: startingPlayerIndex,
      initialStartingTeamId: config.isDoubles ? startingCompetitorId || undefined : undefined,
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

  const updateScorecards = (nextResults: TriathlonResults) => {
    const nextScorecards = buildTriathlonScorecards({
      competitors: triathlonCompetitors,
      sourcePlayers: players,
      isDoubles: config.isDoubles,
      capitalResults: nextResults.capital ?? null,
      cricketSummary: nextResults.cricket ?? null,
      x01Match: nextResults.x01 ?? null,
    });
    return nextScorecards;
  };

  const finalizeTriathlon = (nextResults: TriathlonResults, nextScorecards: TriathlonScorecard[]) => {
    const ordered = sortTriathlonScorecards(nextScorecards, nextResults.tieBreakWinnerId);
    const topScore = ordered[0]?.totalScore ?? 0;
    const tiedCompetitors = ordered.filter((card) => card.totalScore === topScore);

    if (tiedCompetitors.length > 1 && !nextResults.tieBreakWinnerId) {
      return false;
    }

    const winnerId = getTriathlonWinnerId(nextScorecards, nextResults.tieBreakWinnerId);
    onFinish(buildScoresFromScorecards(nextScorecards), {
      ...nextResults,
      finalWinnerId: winnerId,
      scorecards: nextScorecards,
      triathlonCompetitors,
    });
    return true;
  };

  const handleStarterAttempt = (competitorId: string, attempt: BullAttempt) => {
    const nextAttempts = { ...starterDrawAttempts, [competitorId]: attempt };

    const pendingCompetitors = triathlonCompetitors.filter((entry) => nextAttempts[entry.id] === undefined);
    if (pendingCompetitors.length > 0) {
      dispatch({ type: 'starter_attempts_updated', attempts: nextAttempts });
      return;
    }

    const maxValue = Math.max(...triathlonCompetitors.map((entry) => getAttemptValue(nextAttempts[entry.id])));
    const leaders = triathlonCompetitors.filter((entry) => getAttemptValue(nextAttempts[entry.id]) === maxValue);

    if (leaders.length > 1) {
      dispatch({
        type: 'starter_attempts_updated',
        attempts: Object.fromEntries(leaders.map((entry) => [entry.id, undefined])),
        message: 'Egalite sur le tir a la bulle. Relance uniquement entre les equipes ou joueurs a egalite.',
      });
      return;
    }

    const starterId = leaders[0]?.id || triathlonCompetitors[0]?.id || null;
    dispatch({
      type: 'starter_resolved',
      starterId,
      attempts: nextAttempts,
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
    const finalized = finalizeTriathlon(nextResults, nextScorecards);
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
    finalizeTriathlon(nextResults, scorecards);
  };

  const renderTriathlonHeader = () => (
    <div className="z-20 flex min-h-[78px] shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900 px-3 py-3 sm:min-h-[88px] sm:px-4 sm:py-4">
      <div className="flex flex-col gap-1">
        <div className="font-black italic text-base sm:text-lg md:text-xl">
          <span className="text-white">BOUGNAT</span> <span className="text-orange-500">DARTS</span>
        </div>
      </div>
      <div className="flex min-w-[92px] flex-col items-center justify-center sm:min-w-[112px]">
        <div className="mb-1 text-[11px] leading-none font-mono text-gray-500 md:text-xs">{currentTime}</div>
        <div className="text-base font-bold leading-none tracking-[0.18em] font-mono text-orange-500 sm:text-lg md:text-xl">{formatDuration(elapsedSeconds)}</div>
      </div>
      <div className="flex gap-1.5 sm:gap-2">
        <button onClick={() => setShowStats(true)} className="rounded border border-gray-700 bg-gray-800 px-3 py-2 text-[11px] font-bold uppercase text-white sm:px-3.5 sm:py-2 sm:text-xs">
          Stats
        </button>
        <button onClick={() => setShowExitConfirm(true)} className="rounded border border-red-900/30 px-3 py-2 text-[11px] font-bold uppercase text-red-500 sm:px-3.5 sm:py-2 sm:text-xs">
          Quitter
        </button>
      </div>
    </div>
  );

  const renderStandingCard = () => (
    <div className="w-full max-w-xl rounded-2xl border border-gray-800 bg-gray-900 p-5 shadow-2xl sm:p-8">
      <h2 className="mb-5 text-center text-lg font-bold uppercase tracking-widest text-gray-400 sm:mb-6 sm:text-xl">
        Classement Triathlon
      </h2>
      <div className="space-y-3 sm:space-y-4">
        {rankedScorecards.map((card) => (
          <div key={card.competitorId} className="rounded-xl bg-gray-800 p-3 sm:p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="truncate text-base font-bold sm:text-lg">{card.competitorName}</span>
              <span className="whitespace-nowrap text-xl font-black text-orange-500 sm:text-2xl">{card.totalScore}/100</span>
            </div>
            <div className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
              Base {card.totalBasePoints} | Bonus {card.totalBonusPoints}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {SCORE_SECTIONS.map((section) => {
                const event = card[section.key];
                return (
                  <div key={section.key} className="rounded-xl border border-white/8 bg-black/20 px-3 py-2">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">{section.label}</div>
                    <div className="mt-1 text-sm font-black text-white">{event.totalPoints} pts</div>
                    <div className="text-[10px] text-gray-400">{event.basePoints} + {event.bonusPoints}</div>
                  </div>
                );
              })}
            </div>
            {results.tieBreakWinnerId === card.competitorId && (
              <div className="mt-3 text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">
                Gagnant du 501 tie-break
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderTransitionRecap = (eventKey: 'capital' | 'cricket', eventLabel: string) => (
    <div className="w-full max-w-4xl rounded-2xl border border-gray-800 bg-gray-900 p-5 shadow-2xl sm:p-8">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Recap De L Epreuve</div>
          <h2 className="mt-2 text-2xl font-black uppercase text-white sm:text-3xl">{eventLabel}</h2>
        </div>
        <div className="text-right text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">
          Resultat + Bonus
        </div>
      </div>

      <div className="space-y-3">
        {rankedScorecards.map((card) => {
          const event = card[eventKey];
          return (
            <div key={`${eventKey}-${card.competitorId}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-lg font-black uppercase text-white">{card.competitorName}</div>
                  <div className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">
                    {event.basePoints} points de resultat + {event.bonusPoints} points bonus
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-orange-500">{event.totalPoints} pts</div>
                  <div className="mt-1 text-xs text-gray-400">Total triathlon : {card.totalScore}/100</div>
                </div>
              </div>
              {event.bonuses.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {event.bonuses.map((bonus, index) => (
                    <div key={`${eventKey}-${card.competitorId}-${index}`} className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs text-orange-100">
                      <span className="font-black uppercase">{bonus.label}</span> +{bonus.points}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 text-xs text-gray-500">Aucun bonus sur cette epreuve.</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderStatsModal = () => (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
      <div className="flex h-[min(90vh,760px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-800 bg-gray-950 px-4 py-4 sm:px-6">
          <h3 className="text-lg font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 sm:text-2xl">
            Statistiques Triathlon
          </h3>
          <button onClick={() => setShowStats(false)} className="rounded border border-gray-700 bg-gray-800 px-3 py-2 text-[11px] font-bold uppercase text-white sm:text-xs">
            Fermer
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mb-4 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4 text-sm text-orange-100">
            Score total sur 100 : points de resultat + bonus de performance sur Capital, Cricket et 501.
            {results.tieBreakWinnerId ? ' Egalite finale departagee par un 501 supplementaire.' : ''}
          </div>
          <div className="space-y-4">
            {rankedScorecards.map((card) => (
              <div key={card.competitorId} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div className="truncate text-lg font-black uppercase text-white">
                    {card.competitorName}
                    {results.tieBreakWinnerId === card.competitorId ? ' • Tie-Break' : ''}
                  </div>
                  <div className="text-2xl font-black text-orange-500">{card.totalScore}/100</div>
                </div>
                <div className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                  Base {card.totalBasePoints} | Bonus {card.totalBonusPoints}
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {SCORE_SECTIONS.map((section) => {
                    const event = card[section.key];
                    return (
                      <div key={section.key} className="rounded-xl border border-white/8 bg-black/20 p-3">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">{section.label}</div>
                        <div className="mt-2 text-lg font-black text-white">{event.totalPoints} pts</div>
                        <div className="mt-1 text-xs text-gray-400">Resultat {event.basePoints} + Bonus {event.bonusPoints}</div>
                        <div className="mt-2 text-xs leading-relaxed text-gray-500">{event.summary}</div>
                        {event.bonuses.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {event.bonuses.map((bonus, index) => (
                              <div key={`${event.key}-${index}`} className="rounded-lg border border-orange-500/15 bg-orange-500/10 px-3 py-2 text-xs text-orange-100">
                                <span className="font-black uppercase">{bonus.label}</span> : +{bonus.points} ({bonus.detail})
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (phase === 'STARTING_DRAW') {
    const drawEntries =
      Object.keys(starterDrawAttempts).length > 0
        ? triathlonCompetitors.filter((entry) => starterDrawAttempts[entry.id] === undefined)
        : triathlonCompetitors;

    return (
      <div className="flex h-[100dvh] flex-col overflow-hidden bg-black text-white">
        {renderTriathlonHeader()}
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4 sm:gap-8 sm:p-6">
          <h1 className="text-center text-3xl font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500 sm:text-5xl">
            Tir a la bulle
          </h1>
          <p className="max-w-2xl text-center text-sm text-gray-300 sm:text-base">{starterDrawMessage}</p>
          <div className="grid w-full max-w-4xl gap-4 sm:grid-cols-2">
            {drawEntries.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-gray-800 bg-gray-900 p-4 shadow-2xl sm:p-5">
                <div className="mb-4 text-center text-lg font-black uppercase text-white">{entry.name}</div>
                <div className="grid grid-cols-3 gap-3">
                  <Button onClick={() => handleStarterAttempt(entry.id, 'DOUBLE_BULL')} className="h-14 border-none bg-gradient-to-r from-red-600 to-orange-600 text-sm font-black uppercase">
                    D-Bull
                  </Button>
                  <Button onClick={() => handleStarterAttempt(entry.id, 'BULL')} className="h-14 border-none bg-gradient-to-r from-green-600 to-emerald-600 text-sm font-black uppercase">
                    Bull
                  </Button>
                  <Button variant="secondary" onClick={() => handleStarterAttempt(entry.id, 'MISS')} className="h-14 text-sm font-black uppercase">
                    Miss
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        {showStats && renderStatsModal()}
      </div>
    );
  }

  if (phase === 'TRANSITION_CRICKET' || phase === 'TRANSITION_X01') {
    const isAfterCapital = phase === 'TRANSITION_CRICKET';
    const recapKey = isAfterCapital ? 'capital' : 'cricket';
    const recapLabel = isAfterCapital ? 'Capital' : 'Cricket';

    return (
      <div className="flex h-[100dvh] flex-col overflow-hidden bg-black text-white">
        {renderTriathlonHeader()}
        <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto p-4 sm:gap-8 sm:p-6">
          <h1 className={`text-center text-3xl font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r ${isAfterCapital ? 'from-blue-500 to-cyan-500' : 'from-green-500 to-emerald-500'} sm:text-5xl`}>
            {isAfterCapital ? 'Capital termine' : 'Cricket termine'}
          </h1>
          {renderTransitionRecap(recapKey, recapLabel)}
          {renderStandingCard()}
          <Button
            onClick={() => dispatch({ type: 'advance_phase', phase: isAfterCapital ? 'CRICKET' : 'X01' })}
            size="lg"
            className="h-14 w-full max-w-md border-none bg-gradient-to-r from-red-600 to-orange-600 text-lg uppercase shadow-lg shadow-red-900/40 hover:from-red-500 hover:to-orange-500 sm:h-20 sm:text-2xl"
          >
            Suivant
          </Button>
        </div>
        {showStats && renderStatsModal()}
      </div>
    );
  }

  if (phase === 'CAPITAL') {
    return (
      <div className="relative h-[100dvh] bg-black">
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
      <div className="relative h-[100dvh] bg-black">
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
      <div className="relative h-[100dvh] bg-black">
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
    <div className="relative h-[100dvh] bg-black">
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
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-gray-700 bg-gray-900 p-6 text-center shadow-2xl">
            <h3 className="mb-2 text-2xl font-black italic uppercase text-white">Quitter ?</h3>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => setShowExitConfirm(false)}>Non</Button>
              <Button variant="danger" onClick={onExit}>Oui</Button>
            </div>
          </div>
        </div>
      )}

      {showStats && renderStatsModal()}
    </div>
  );
};
