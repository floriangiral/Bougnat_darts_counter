
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, LogOut } from 'lucide-react';
import { GameConfig, Player, CricketMatchSummary, CricketPlayerState, CricketTarget } from '../types';
import {
    DEFAULT_CRICKET_ROUNDS,
    checkCricketWin,
    haveAllPlayersReachedCricketRoundLimit,
    initCricketState,
    processCricketHit,
    resolveCricketWinnerOnRounds,
} from '../utils/cricketLogic';
import { CricketScoreboard } from '../components/game/CricketScoreboard';
import { CricketKeypad } from '../components/game/CricketKeypad';
import { Button } from '../components/ui/Button';
import { CricketStatsModal } from '../components/stats/CricketStatsModal';
import { StartingPlayerOverlay } from '../components/game/StartingPlayerOverlay';
import { buildDoublesRotation, formatDuration, getOrderedPlayersAndStarter } from '../src/application/scoring/matchLifecycle';
import {
    advanceCricketTurn,
    appendAggregateCricketHit,
    buildCricketCompetitors,
    buildCricketHistorySnapshot,
    buildCricketMatchSummary,
    type CricketHistorySnapshot,
    initAggregateCricketStats,
} from '../src/features/cricket/cricketGameModel';

interface CricketGameViewProps {
    players: Player[];
    config: GameConfig;
    onExit: () => void;
    onFinish: (results: CricketMatchSummary) => void;
    skipStartingPlayerPrompt?: boolean;
}

export const CricketGameView: React.FC<CricketGameViewProps> = ({ players, config, onExit, onFinish, skipStartingPlayerPrompt = false }) => {
    const initialRotation = useMemo(() => getOrderedPlayersAndStarter(players, config), [players, config]);
    const initialStartingCompetitorId = useMemo(() => {
        if (config.isDoubles) {
            return config.initialStartingTeamId ?? players[0]?.teamId ?? null;
        }

        const starter = initialRotation.orderedPlayers[initialRotation.startingPlayerIndex] ?? players[0];
        return starter?.id ?? null;
    }, [config.isDoubles, config.initialStartingTeamId, initialRotation, players]);
    const [orderedPlayers, setOrderedPlayers] = useState<Player[]>(initialRotation.orderedPlayers);
    const competitors = useMemo(() => buildCricketCompetitors(players, config.isDoubles), [players, config.isDoubles]);
    const memberNamesByCompetitor = useMemo(
        () => Object.fromEntries(competitors.map((competitor) => [competitor.id, competitor.memberNames])),
        [competitors]
    );

    const [states, setStates] = useState<CricketPlayerState[]>(() =>
        initCricketState(competitors.map((competitor) => ({ id: competitor.id, name: competitor.name, teamId: competitor.id })))
    );
    const [aggregateStats, setAggregateStats] = useState<CricketPlayerState[]>(() => initAggregateCricketStats(competitors));
    const [currentThrowerIdx, setCurrentThrowerIdx] = useState(initialRotation.startingPlayerIndex);
    const [turnDartsThrown, setTurnDartsThrown] = useState(0);
    const [history, setHistory] = useState<CricketHistorySnapshot[]>([]); 
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [winnerId, setWinnerId] = useState<string | null>(null);
    const [hasGameStarted, setHasGameStarted] = useState(skipStartingPlayerPrompt);
    const [startingCompetitorId, setStartingCompetitorId] = useState<string | null>(initialStartingCompetitorId);
    const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }));
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const hasGameStartedRef = useRef(hasGameStarted);
    const cricketRoundsLimit = config.cricketRounds ?? DEFAULT_CRICKET_ROUNDS;

    const currentThrower = orderedPlayers[currentThrowerIdx];
    const currentCompetitorId = config.isDoubles ? currentThrower.teamId : currentThrower.id;
    const currentCompetitor = states.find((state) => state.id === currentCompetitorId) ?? states[0];
    const displayedThrower = currentThrower;
    const displayedCompetitor = currentCompetitor;
    const displayedTurnDartsThrown = turnDartsThrown;
    const displayedRoundNumber = Math.min(
        Math.floor((displayedCompetitor.dartsThrown - displayedTurnDartsThrown) / 3) + 1,
        cricketRoundsLimit
    );
    const starterOptions = config.isDoubles
        ? [
            { id: 'team1', label: 'Equipe 1' },
            { id: 'team2', label: 'Equipe 2' },
        ]
        : orderedPlayers.map((player, index) => ({ id: String(index), label: player.name }));

    useEffect(() => {
        if (hasGameStartedRef.current) return;
        setOrderedPlayers(initialRotation.orderedPlayers);
        setCurrentThrowerIdx(initialRotation.startingPlayerIndex);
        setStartingCompetitorId(initialStartingCompetitorId);
    }, [initialRotation, initialStartingCompetitorId]);

    const finishMatch = (
        finalWinnerId: string,
        finalCompetitors: CricketPlayerState[],
        nextLegsWon: Record<string, number>,
        nextSetsWon: Record<string, number>,
        nextSetLegsWon: Record<string, number>
    ) => {
        setWinnerId(finalWinnerId);
        onFinish(buildCricketMatchSummary(finalCompetitors, finalWinnerId, config, memberNamesByCompetitor, nextLegsWon, nextSetsWon, nextSetLegsWon));
    };

    const handleLegWin = (legWinnerId: string, finalCompetitors: CricketPlayerState[]) => {
        finishMatch(legWinnerId, finalCompetitors, { [legWinnerId]: 1 }, {}, {});
    };

    const handleHit = (target: CricketTarget, multiplier: 1 | 2 | 3) => {
        if (winnerId || !hasGameStarted) return;

        setHistory((prev) => [
            ...prev,
            buildCricketHistorySnapshot(states, aggregateStats, currentThrowerIdx, turnDartsThrown, orderedPlayers, winnerId),
        ]);

        const result = processCricketHit(states, currentCompetitorId, target, multiplier);
        const nextAggregateStats = appendAggregateCricketHit(aggregateStats, currentCompetitorId, target, multiplier, result.pointsScored, false);
        setStates(result.newStates);
        setAggregateStats(nextAggregateStats);

        const win = checkCricketWin(result.newStates);
        if (win) {
            handleLegWin(win, nextAggregateStats);
            return;
        }

        if (haveAllPlayersReachedCricketRoundLimit(result.newStates, cricketRoundsLimit)) {
            const winnerOnRounds = resolveCricketWinnerOnRounds(nextAggregateStats);
            if (winnerOnRounds) {
                handleLegWin(winnerOnRounds, nextAggregateStats);
                return;
            }
        }

        advanceTurn();
    };

    const handleMisses = (requestedMissCount: number) => {
        if (winnerId || !hasGameStarted) return;
        const missCount = Math.max(1, Math.min(requestedMissCount, 3 - turnDartsThrown));

        setHistory((prev) => [
            ...prev,
            buildCricketHistorySnapshot(states, aggregateStats, currentThrowerIdx, turnDartsThrown, orderedPlayers, winnerId),
        ]);

        const nextStates = states.map((entry) => {
            if (entry.id !== currentCompetitorId) {
                return entry;
            }

            return {
                ...entry,
                dartsThrown: entry.dartsThrown + missCount,
                history: [
                    ...entry.history,
                    ...Array.from({ length: missCount }, () => ({ target: null, multiplier: 1 as const, isMiss: true, pointsScored: 0 })),
                ],
            };
        });

        let nextAggregateStats = aggregateStats;
        for (let i = 0; i < missCount; i += 1) {
            nextAggregateStats = appendAggregateCricketHit(nextAggregateStats, currentCompetitorId, null, 1, 0, true);
        }

        setStates(nextStates);
        setAggregateStats(nextAggregateStats);

        if (haveAllPlayersReachedCricketRoundLimit(nextStates, cricketRoundsLimit)) {
            const winnerOnRounds = resolveCricketWinnerOnRounds(nextAggregateStats);
            if (winnerOnRounds) {
                handleLegWin(winnerOnRounds, nextAggregateStats);
                return;
            }
        }

        advanceTurn(missCount);
    };

    const handleMiss = () => {
        handleMisses(1);
    };

    const handleTripleMiss = () => {
        handleMisses(3);
    };

    const advanceTurn = (dartsAdded: number = 1) => {
        const turnTransition = advanceCricketTurn(turnDartsThrown, orderedPlayers.length, dartsAdded);

        setTurnDartsThrown(turnTransition.nextTurnDartsThrown);
        if (turnTransition.shouldAdvanceThrower) {
            setCurrentThrowerIdx(prev => (prev + turnTransition.nextThrowerOffset) % orderedPlayers.length);
        }
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        const lastState = history[history.length - 1];
        setStates(lastState.states);
        setAggregateStats(lastState.aggregateStats);
        setCurrentThrowerIdx(lastState.currentThrowerIdx);
        setTurnDartsThrown(lastState.turnDartsThrown);
        setOrderedPlayers(lastState.orderedPlayers);
        setWinnerId(lastState.winnerId);
        setHistory(prev => prev.slice(0, -1));
    };

    const handleStarterSelect = (starterId: string) => {
        if (config.isDoubles) {
            const nextPlayers = buildDoublesRotation(players, config.teamStarterIds ?? {}, starterId);
            setOrderedPlayers(nextPlayers);
            setCurrentThrowerIdx(0);
            setStartingCompetitorId(starterId);
        } else {
            const starterIndex = parseInt(starterId, 10) || 0;
            setCurrentThrowerIdx(starterIndex);
            setStartingCompetitorId(orderedPlayers[starterIndex]?.id ?? players[starterIndex]?.id ?? null);
        }
        setHasGameStarted(true);
    };

    useEffect(() => {
        hasGameStartedRef.current = hasGameStarted;
    }, [hasGameStarted]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }));
            if (hasGameStartedRef.current && !winnerId) {
                setElapsedSeconds((prev) => prev + 1);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [winnerId]);

    // --- RENDER ---

    if (winnerId) {
        const winner = competitors.find(p => p.id === winnerId);
        return (
            <div className="flex h-[100dvh] flex-col items-center justify-center bg-black p-4 text-white animate-in fade-in duration-500 sm:p-6">
                 <h1 className="mb-4 text-center text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 drop-shadow-[0_0_15px_rgba(234,88,12,0.5)] sm:text-6xl">
                     VAINQUEUR
                 </h1>
                 <div className="mb-2 text-center text-2xl font-bold uppercase text-white sm:text-4xl">
                     {winner?.name}
                 </div>
                 <div className="mb-12 text-center text-base font-mono uppercase tracking-[0.18em] text-gray-400 sm:text-xl sm:tracking-widest">
                     Match remporte
                 </div>
                 <Button
                          onClick={() => onFinish(buildCricketMatchSummary(aggregateStats, winnerId, config, memberNamesByCompetitor, { [winnerId]: 1 }, {}, {}))}
                    size="lg"
                    data-testid="winner-view-stats"
                    className="w-full max-w-xs h-20 text-2xl uppercase shadow-lg shadow-orange-900/40"
                 >
                     Voir les Stats ➔
                 </Button>
                 {history.length > 0 && (
                    <Button
                        variant="secondary"
                        onClick={handleUndo}
                        className="mt-3 w-full max-w-xs h-12 text-base uppercase"
                    >
                        Retour
                    </Button>
                 )}
            </div>
        );
    }

    return (
        <div className="tablet-cricket-root flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-[#06080d] text-white">
             <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.14),transparent_24%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent_18%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.03),transparent_28%)]" />
             <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:28px_28px]" />
             {/* Header */}
            <div className="tablet-cricket-header laptop-compact-topbar relative z-20 flex min-h-[72px] shrink-0 items-center justify-between border-b border-gray-800 bg-[#101827]/95 px-4 py-3 backdrop-blur-md sm:min-h-[82px] sm:px-5">
                <div className="font-black italic text-base sm:text-lg md:text-xl">
                    <span className="text-white">BOUGNAT</span> <span className="text-orange-500">DARTS</span>
                </div>
                <div className="laptop-compact-timer flex min-w-[92px] flex-col items-center justify-center sm:min-w-[112px]">
                    <div className="mb-1 text-[11px] leading-none text-gray-500 font-mono md:text-xs">{currentTime}</div>
                    <div className="text-base font-bold leading-none tracking-[0.18em] text-orange-500 font-mono sm:text-lg md:text-xl">{formatDuration(elapsedSeconds)}</div>
                </div>
                <div className="laptop-compact-topbar-actions flex items-center gap-2">
                    <div className="hidden rounded border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-gray-300 sm:block">
                        Tour {displayedRoundNumber}/{cricketRoundsLimit}
                    </div>
                    <div className="mr-2 flex items-center gap-1 sm:mr-4">
                         {[1, 2, 3].map(i => (
                            <div key={i} className={`h-2.5 w-2.5 rounded-full border border-gray-600 ${i <= turnDartsThrown ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] border-orange-500' : 'bg-transparent'}`}></div>
                         ))}
                    </div>
                    <button
                        onClick={() => setShowStats(true)}
                        className="inline-flex h-[38px] w-[38px] items-center justify-center rounded border border-gray-700 bg-gray-800 text-[11px] font-bold uppercase text-white transition-colors hover:bg-gray-700 sm:h-[40px] sm:w-[40px] sm:text-xs"
                        aria-label="Statistiques"
                        title="Statistiques"
                    >
                        <BarChart3 className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setShowExitConfirm(true)}
                        className="inline-flex h-[38px] w-[38px] items-center justify-center rounded border border-red-900/30 text-red-500 transition-colors hover:bg-red-950/30 sm:h-[40px] sm:w-[40px]"
                        aria-label="Quitter"
                        title="Quitter"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Scoreboard - Takes available space */}
            <div className="tablet-cricket-scoreboard relative z-10 min-h-0 flex-1 overflow-hidden px-2 pt-2 sm:px-3 sm:pt-3">
                <CricketScoreboard
                    players={states}
                    currentPlayerId={displayedCompetitor.id}
                    displayedRound={displayedRoundNumber}
                    currentPlayerTurnDartsThrown={displayedTurnDartsThrown}
                    startingCompetitorId={startingCompetitorId}
                    memberNamesByCompetitor={memberNamesByCompetitor}
                    currentThrowerName={displayedThrower.name}
                    isDoubles={config.isDoubles}
                    roundsLimit={cricketRoundsLimit}
                />
            </div>

            {/* Keypad Area - Fixed height for usability */}
            <div className="tablet-cricket-control-area legacy-cricket-keypad-area relative z-30 h-[clamp(18rem,38svh,28rem)] shrink-0 pb-safe md:h-[clamp(19rem,40svh,30rem)]">
                <CricketKeypad 
                    onHit={handleHit} 
                    onMiss={handleMiss} 
                    onTripleMiss={handleTripleMiss}
                    onUndo={handleUndo} 
                    canUndo={history.length > 0} 
                />
            </div>

            {/* Exit Confirmation */}
            {showExitConfirm && (
                <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-gray-900 rounded-xl p-6 w-full max-w-sm text-center border border-gray-700 shadow-2xl">
                        <h3 className="text-2xl font-black text-white mb-2 italic uppercase">Quitter ?</h3>
                        <div className="grid grid-cols-2 gap-3 mt-8">
                            <Button variant="secondary" onClick={() => setShowExitConfirm(false)}>NON</Button>
                            <Button variant="danger" onClick={onExit}>OUI</Button>
                        </div>
                    </div>
                </div>
            )}

            {showStats && <CricketStatsModal players={aggregateStats} onClose={() => setShowStats(false)} />}
            {!skipStartingPlayerPrompt && !hasGameStarted && !winnerId && (
                <StartingPlayerOverlay options={starterOptions} onSelect={handleStarterSelect} onCancel={onExit} />
            )}
        </div>
    );
};
