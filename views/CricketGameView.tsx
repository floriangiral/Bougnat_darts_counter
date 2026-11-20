
import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { GameConfig, Player, CricketMatchSummary, CricketTarget } from '../types';
import { DEFAULT_CRICKET_ROUNDS, rankCricketCompetitors } from '../utils/cricketLogic';
import { CricketScoreboard } from '../components/game/CricketScoreboard';
import { CricketKeypad } from '../components/game/CricketKeypad';
import { Button } from '../components/ui/Button';
import { ConfirmExitDialog, GameHeader, useExitConfirmation } from '../components/game/controls';
import { GameScreenLayout } from '../components/layout/GameScreenLayout';
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
import { FitText } from '../components/ui/FitText';

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
    /** Bandeau optionnel sous l'en-tête (progression de phase du Triathlon, spec 072 FR-06). */
    band?: React.ReactNode;
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
    band,
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
    const exitConfirmation = useExitConfirmation(onExit);
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
            <div className="flex h-[100dvh] flex-col items-center justify-center bg-canvas p-4 text-fg animate-in fade-in duration-500 sm:p-6">
                 <h1 className="mb-4 text-center text-4xl font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-2 drop-shadow-glow-brand sm:text-6xl">
                     {winner ? 'VAINQUEUR' : 'Égalité'}
                 </h1>
                 <FitText as="div" className="mb-2 w-full text-center text-2xl font-bold uppercase text-fg sm:text-4xl">
                     {winner ? winner.name : tiedLeaders.join(' et ')}
                 </FitText>
                 <div className="mb-3 text-center text-base font-mono uppercase tracking-[0.18em] text-fg-subtle sm:text-xl sm:tracking-widest">
                     {winner ? 'Match remporté' : 'Limite de tours atteinte'}
                 </div>
                 <div className="mb-12 text-center text-sm font-mono text-fg-faint sm:text-base" data-testid="cricket-final-score">
                     Score final : {finalStandings.map((entry) => `${entry.competitor.name} ${entry.competitor.score}`).join(' · ')}
                 </div>
                 <Button
                    onClick={handleConfirmResult}
                    size="lg"
                    data-testid="winner-view-stats"
                    className="w-full max-w-xs h-20 text-2xl uppercase shadow-brand"
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
        <GameScreenLayout
            game="cricket"
            className="bg-ambient"
            band={band}
            playersProps={{ className: 'relative z-10 overflow-hidden px-2 pt-2 sm:px-3 sm:pt-3' }}
            inputProps={{ className: 'legacy-cricket-keypad-area relative z-30 h-[clamp(18rem,38svh,28rem)] pb-safe md:h-[clamp(19rem,40svh,30rem)]' }}
            header={(
                <GameHeader
                    game="cricket"
                    badge={`Cricket · Tour ${displayedRoundNumber}/${cricketRoundsLimit}`}
                    compactBadge={`Tour ${displayedRoundNumber}/${cricketRoundsLimit}`}
                    clock={{ time: currentTime, elapsed: formatDuration(elapsedSeconds) }}
                    indicators={(
                        <div className="cricket-turn-dots mr-1 flex items-center gap-1 sm:mr-2" role="img" aria-label={`${turnDartsThrown} fléchette(s) lancée(s) sur 3`}>
                            {[1, 2, 3].map(i => (
                                <div
                                    key={i}
                                    data-state={i <= turnDartsThrown ? 'thrown' : 'pending'}
                                    className={`cricket-turn-dot h-2.5 w-2.5 rounded-full border ${i <= turnDartsThrown ? 'border-brand bg-brand shadow-glow-brand' : 'border-border-strong bg-transparent'}`}
                                />
                            ))}
                        </div>
                    )}
                    onStats={() => setShowStats(true)}
                    onExit={exitConfirmation.requestExit}
                />
            )}
            players={(
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
            )}
            input={(
                <CricketKeypad
                    onHit={handleHit}
                    onMiss={handleMiss}
                    onTripleMiss={handleTripleMiss}
                    onUndo={handleUndo}
                    canUndo={history.length > 0}
                />
            )}
        >
            <ConfirmExitDialog {...exitConfirmation.dialogProps} />

            {showStats && <CricketStatsModal players={aggregateStats} onClose={() => setShowStats(false)} />}
            {!skipStartingPlayerPrompt && !hasGameStarted && !isFinished && (
                <StartingPlayerOverlay options={starterOptions} onSelect={handleStarterSelect} onCancel={onExit} />
            )}
        </GameScreenLayout>
    );
};
