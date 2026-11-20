
import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { BarChart3, LogOut } from 'lucide-react';
import { GameConfig, Player, CricketMatchSummary, CricketTarget } from '../types';
import { DEFAULT_CRICKET_ROUNDS, rankCricketCompetitors } from '../utils/cricketLogic';
import { CricketScoreboard } from '../components/game/CricketScoreboard';
import { CricketKeypad } from '../components/game/CricketKeypad';
import { Button } from '../components/ui/Button';
import { CricketStatsModal } from '../components/stats/CricketStatsModal';
import { StartingPlayerOverlay } from '../components/game/StartingPlayerOverlay';
import { buildDoublesRotation, formatDuration, getOrderedPlayersAndStarter } from '../src/application/scoring/matchLifecycle';
import {
    buildCricketCompetitors,
    buildCricketMatchSummary,
    createInitialCricketGameState,
    cricketGameReducer,
    getCricketCurrentCompetitorId,
} from '../src/features/cricket/cricketGameModel';
import { captureGameTiming } from '../src/features/game-session/gameTiming';
import type { CricketRuntimeSnapshot } from '../src/shared/session/persistedAppSession';

interface CricketGameViewProps {
    players: Player[];
    config: GameConfig;
    onExit: () => void;
    onFinish: (results: CricketMatchSummary) => void;
    skipStartingPlayerPrompt?: boolean;
    finishActionLabel?: string;
    /** Game restored after a reload (spec 010). */
    restoredState?: CricketRuntimeSnapshot | null;
    /** Called after each validated dart, never on a clock tick (spec 010). */
    onStateChange?: (snapshot: CricketRuntimeSnapshot) => void;
}

export const CricketGameView: React.FC<CricketGameViewProps> = ({
    players,
    config,
    onExit,
    onFinish,
    skipStartingPlayerPrompt = false,
    finishActionLabel = 'Voir les statistiques',
    restoredState = null,
    onStateChange,
}) => {
    const initialRotation = useMemo(() => getOrderedPlayersAndStarter(players, config), [players, config]);
    const initialStartingCompetitorId = useMemo(() => {
        if (config.isDoubles) {
            return config.initialStartingTeamId ?? players[0]?.teamId ?? null;
        }

        const starter = initialRotation.orderedPlayers[initialRotation.startingPlayerIndex] ?? players[0];
        return starter?.id ?? null;
    }, [config.isDoubles, config.initialStartingTeamId, initialRotation, players]);
    const competitors = useMemo(() => buildCricketCompetitors(players, config.isDoubles), [players, config.isDoubles]);
    const memberNamesByCompetitor = useMemo(
        () => Object.fromEntries(competitors.map((competitor) => [competitor.id, competitor.memberNames])),
        [competitors]
    );
    const cricketRoundsLimit = config.cricketRounds ?? DEFAULT_CRICKET_ROUNDS;

    const [gameState, dispatch] = useReducer(cricketGameReducer, null, () => restoredState?.state ?? createInitialCricketGameState({
        competitors,
        rotation: {
            orderedPlayers: initialRotation.orderedPlayers,
            currentThrowerIdx: initialRotation.startingPlayerIndex,
            startingCompetitorId: initialStartingCompetitorId,
        },
        hasGameStarted: skipStartingPlayerPrompt,
        isDoubles: config.isDoubles,
        roundsLimit: cricketRoundsLimit,
    }));
    const {
        orderedPlayers,
        states,
        aggregateStats,
        currentThrowerIdx,
        turnDartsThrown,
        history,
        winnerId,
        isFinished,
        hasGameStarted,
        startingCompetitorId,
    } = gameState;
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const hasSubmittedResultRef = useRef(false);
    const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }));
    const [elapsedSeconds, setElapsedSeconds] = useState(() => restoredState?.timing.elapsedSeconds ?? 0);
    const hasGameStartedRef = useRef(hasGameStarted);
    const elapsedSecondsRef = useRef(elapsedSeconds);

    const currentThrower = orderedPlayers[currentThrowerIdx];
    const currentCompetitorId = getCricketCurrentCompetitorId(gameState);
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
            { id: 'team1', label: 'Équipe 1' },
            { id: 'team2', label: 'Équipe 2' },
        ]
        : orderedPlayers.map((player, index) => ({ id: String(index), label: player.name }));

    useEffect(() => {
        dispatch({
            type: 'sync_rotation',
            orderedPlayers: initialRotation.orderedPlayers,
            currentThrowerIdx: initialRotation.startingPlayerIndex,
            startingCompetitorId: initialStartingCompetitorId,
        });
    }, [initialRotation, initialStartingCompetitorId]);

    const handleConfirmResult = () => {
        if (hasSubmittedResultRef.current) return;
        hasSubmittedResultRef.current = true;
        const legsWon = winnerId ? { [winnerId]: 1 } : {};
        onFinish(buildCricketMatchSummary(aggregateStats, winnerId, config, memberNamesByCompetitor, legsWon, {}, {}));
    };

    const handleHit = (target: CricketTarget, multiplier: 1 | 2 | 3) => {
        dispatch({ type: 'hit', target, multiplier });
    };

    const handleMiss = () => {
        dispatch({ type: 'misses', count: 1 });
    };

    const handleTripleMiss = () => {
        dispatch({ type: 'misses', count: 3 });
    };

    const handleUndo = () => {
        if (hasSubmittedResultRef.current) return;
        dispatch({ type: 'undo' });
    };

    const handleStarterSelect = (starterId: string) => {
        if (config.isDoubles) {
            dispatch({
                type: 'start',
                orderedPlayers: buildDoublesRotation(players, config.teamStarterIds ?? {}, starterId),
                currentThrowerIdx: 0,
                startingCompetitorId: starterId,
            });
            return;
        }
        const starterIndex = Number.parseInt(starterId, 10) || 0;
        dispatch({
            type: 'start',
            orderedPlayers,
            currentThrowerIdx: starterIndex,
            startingCompetitorId: orderedPlayers[starterIndex]?.id ?? players[starterIndex]?.id ?? null,
        });
    };

    useEffect(() => {
        hasGameStartedRef.current = hasGameStarted;
    }, [hasGameStarted]);

    useEffect(() => {
        elapsedSecondsRef.current = elapsedSeconds;
    }, [elapsedSeconds]);

    useEffect(() => {
        onStateChange?.({
            gameType: 'CRICKET',
            state: gameState,
            timing: captureGameTiming(elapsedSecondsRef.current, gameState.hasGameStarted && !gameState.isFinished),
        });
    }, [gameState, onStateChange]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }));
            if (hasGameStartedRef.current && !isFinished) {
                setElapsedSeconds((prev) => prev + 1);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [isFinished]);

    // --- RENDER ---

    if (isFinished) {
        const winner = competitors.find((competitor) => competitor.id === winnerId);
        const finalStandings = rankCricketCompetitors(aggregateStats, winnerId);
        const tiedLeaders = finalStandings.filter((entry) => entry.rank === 1).map((entry) => entry.competitor.name);
        return (
            <div className="flex h-[100dvh] flex-col items-center justify-center bg-black p-4 text-white animate-in fade-in duration-500 sm:p-6">
                 <h1 className="mb-4 text-center text-4xl font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 drop-shadow-[0_0_15px_rgba(234,88,12,0.5)] sm:text-6xl">
                     {winner ? 'VAINQUEUR' : 'Égalité'}
                 </h1>
                 <div className="mb-2 text-center text-2xl font-bold uppercase text-white sm:text-4xl">
                     {winner ? winner.name : tiedLeaders.join(' et ')}
                 </div>
                 <div className="mb-3 text-center text-base font-mono uppercase tracking-[0.18em] text-gray-400 sm:text-xl sm:tracking-widest">
                     {winner ? 'Match remporté' : 'Limite de tours atteinte'}
                 </div>
                 <div className="mb-12 text-center text-sm font-mono text-gray-500 sm:text-base" data-testid="cricket-final-score">
                     Score final : {finalStandings.map((entry) => `${entry.competitor.name} ${entry.competitor.score}`).join(' · ')}
                 </div>
                 <Button
                    onClick={handleConfirmResult}
                    size="lg"
                    data-testid="winner-view-stats"
                    className="w-full max-w-xs h-20 text-2xl uppercase shadow-lg shadow-orange-900/40"
                 >
                     {finishActionLabel} ➔
                 </Button>
                 {history.length > 0 && (
                    <Button
                        variant="secondary"
                        onClick={handleUndo}
                        data-testid="winner-view-undo"
                        className="mt-3 w-full max-w-xs h-12 text-base"
                    >
                        Annuler la dernière fléchette
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
                <dialog open aria-label="Quitter ?" className="app-modal fixed inset-0 z-[60] m-0 h-full w-full max-h-none max-w-none border-0 bg-black/90 text-white backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-gray-900 rounded-xl p-6 w-full max-w-sm text-center border border-gray-700 shadow-2xl">
                        <h3 className="text-2xl font-black text-white mb-2 italic uppercase">Quitter ?</h3>
                        <div className="grid grid-cols-2 gap-3 mt-8">
                            <Button variant="secondary" onClick={() => setShowExitConfirm(false)}>NON</Button>
                            <Button variant="danger" onClick={onExit}>OUI</Button>
                        </div>
                    </div>
                </dialog>
            )}

            {showStats && <CricketStatsModal players={aggregateStats} onClose={() => setShowStats(false)} />}
            {!skipStartingPlayerPrompt && !hasGameStarted && !isFinished && (
                <StartingPlayerOverlay options={starterOptions} onSelect={handleStarterSelect} onCancel={onExit} />
            )}
        </div>
    );
};
