import React, { useState } from 'react';
import { Player, MatchState, CricketPlayerState, CapitalPlayerState } from '../types';
import { createMatch } from '../utils/gameLogic';
import { checkCricketWin } from '../utils/cricketLogic';
import { MatchView } from './MatchView';
import { CricketGameView } from './CricketGameView';
import { CapitalGameView } from './CapitalGameView';
import { Button } from '../components/ui/Button';

type TriathlonPhase = 'X01' | 'TRANSITION_CRICKET' | 'CRICKET' | 'TRANSITION_CAPITAL' | 'CAPITAL' | 'TIE_BREAKER';

interface TriathlonGameViewProps {
    players: Player[];
    onExit: () => void;
    onFinish: (globalScores: Record<string, number>, results: any) => void;
}

export const TriathlonGameView: React.FC<TriathlonGameViewProps> = ({ players, onExit, onFinish }) => {
    const [phase, setPhase] = useState<TriathlonPhase>('X01');
    const [globalScores, setGlobalScores] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {};
        players.forEach(p => initial[p.id] = 0);
        return initial;
    });
    const [results, setResults] = useState<any>({});
    const [tiedPlayers, setTiedPlayers] = useState<Player[]>([]);
    const [tieScores, setTieScores] = useState<Record<string, string>>({});

    const [x01Match] = useState<MatchState>(() =>
        createMatch(players, {
            startingScore: 501,
            checkIn: 'Open',
            checkOut: 'Double',
            matchMode: 'LEGS',
            legsToWin: 2, // Best of 3
            setsToWin: 1,
            isDoubles: false
        })
    );

    const handleX01Finish = (winnerId: string, finalState: MatchState) => {
        const newScores = { ...globalScores };
        players.forEach(p => {
            newScores[p.id] += (finalState.legsWon[p.id] || 0);
        });
        setGlobalScores(newScores);
        setResults(prev => ({ ...prev, x01: finalState }));
        setPhase('TRANSITION_CRICKET');
    };

    const handleCricketFinish = (cricketResults: CricketPlayerState[]) => {
        const winnerId = checkCricketWin(cricketResults);
        const newScores = { ...globalScores };
        if (winnerId) {
            newScores[winnerId] += 2;
        }
        setGlobalScores(newScores);
        setResults(prev => ({ ...prev, cricket: cricketResults, cricketWinnerId: winnerId }));
        setPhase('TRANSITION_CAPITAL');
    };

    const handleCapitalFinish = (capitalResults: CapitalPlayerState[]) => {
        const topScore = Math.max(...capitalResults.map(p => p.score));
        const winners = capitalResults.filter(p => p.score === topScore).map(p => p.id);
        const newScores = { ...globalScores };
        winners.forEach(id => newScores[id] += 3);
        setGlobalScores(newScores);

        const finalResults = { ...results, capital: capitalResults, capitalWinners: winners };
        setResults(finalResults);

        const maxGlobal = Math.max(...(Object.values(newScores) as number[]));
        const overallWinners = players.filter(p => newScores[p.id] === maxGlobal);

        if (overallWinners.length > 1) {
            setTiedPlayers(overallWinners);
            setPhase('TIE_BREAKER');
        } else {
            onFinish(newScores, finalResults);
        }
    };

    const handleTieBreakerSubmit = () => {
        let maxTie = -1;
        let winnerId = tiedPlayers[0].id;
        tiedPlayers.forEach(p => {
            const s = parseInt(tieScores[p.id] || '0');
            if (s > maxTie) { maxTie = s; winnerId = p.id; }
        });
        const finalScores = { ...globalScores };
        finalScores[winnerId] += 0.1; // Break the tie
        onFinish(finalScores, { ...results, tieBreakerWinner: winnerId });
    };

    const renderFloatingScoreboard = () => (
        <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-black/90 backdrop-blur-md border border-gray-700 rounded-3xl sm:rounded-full px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-6 shadow-[0_0_30px_rgba(0,0,0,0.8)] max-w-[calc(100vw-1.5rem)] overflow-x-auto">
            <div className="text-yellow-500 font-black italic text-xs sm:text-sm uppercase tracking-widest mr-1 sm:mr-2 flex items-center gap-2 whitespace-nowrap">
                <span>🏆</span> Triathlon
            </div>
            {players.map(p => (
                <div key={p.id} className="text-white font-bold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap">
                    {p.name}: <span className="text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded">{Math.floor(globalScores[p.id])} pts</span>
                </div>
            ))}
        </div>
    );

    if (phase === 'TRANSITION_CRICKET') {
        return (
            <div className="h-[100dvh] bg-black text-white flex flex-col items-center justify-center p-4 sm:p-6">
                <h1 className="text-3xl sm:text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500 mb-6 sm:mb-8 text-center uppercase">
                    Étape 1 Terminée !
                </h1>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-8 w-full max-w-md mb-8 sm:mb-12 shadow-2xl">
                    <h2 className="text-lg sm:text-xl text-gray-400 font-bold uppercase tracking-widest mb-5 sm:mb-6 text-center">Score Global</h2>
                    <div className="space-y-3 sm:space-y-4">
                        {players.sort((a,b) => globalScores[b.id] - globalScores[a.id]).map(p => (
                            <div key={p.id} className="flex justify-between items-center gap-4 bg-gray-800 p-3 sm:p-4 rounded-xl">
                                <span className="font-bold text-base sm:text-lg truncate">{p.name}</span>
                                <span className="text-xl sm:text-2xl font-black text-orange-500 whitespace-nowrap">{globalScores[p.id]} pts</span>
                            </div>
                        ))}
                    </div>
                </div>
                <Button onClick={() => setPhase('CRICKET')} size="lg" className="w-full max-w-md h-14 sm:h-20 text-lg sm:text-2xl uppercase shadow-lg shadow-green-900/40 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 border-none">
                    Étape 2 : Cricket ➔
                </Button>
            </div>
        );
    }

    if (phase === 'TRANSITION_CAPITAL') {
        return (
            <div className="h-[100dvh] bg-black text-white flex flex-col items-center justify-center p-4 sm:p-6">
                <h1 className="text-3xl sm:text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-500 mb-6 sm:mb-8 text-center uppercase">
                    Étape 2 Terminée !
                </h1>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-8 w-full max-w-md mb-6 sm:mb-8 shadow-2xl">
                    <h2 className="text-lg sm:text-xl text-gray-400 font-bold uppercase tracking-widest mb-5 sm:mb-6 text-center">Score Global</h2>
                    <div className="space-y-3 sm:space-y-4">
                        {players.sort((a,b) => globalScores[b.id] - globalScores[a.id]).map(p => (
                            <div key={p.id} className="flex justify-between items-center gap-4 bg-gray-800 p-3 sm:p-4 rounded-xl">
                                <span className="font-bold text-base sm:text-lg truncate">{p.name}</span>
                                <span className="text-xl sm:text-2xl font-black text-orange-500 whitespace-nowrap">{globalScores[p.id]} pts</span>
                            </div>
                        ))}
                    </div>
                </div>
                <p className="text-center text-sm sm:text-base text-gray-400 mb-6 sm:mb-8 max-w-md italic">
                    Le Capital vaut <strong className="text-orange-500">3 points</strong>. Tout est encore possible !
                </p>
                <Button onClick={() => setPhase('CAPITAL')} size="lg" className="w-full max-w-md h-14 sm:h-20 text-lg sm:text-2xl uppercase shadow-lg shadow-red-900/40 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 border-none">
                    Étape 3 : Capital ➔
                </Button>
            </div>
        );
    }

    if (phase === 'TIE_BREAKER') {
        return (
            <div className="h-[100dvh] bg-black text-white flex flex-col items-center justify-center p-4 sm:p-6">
                <h1 className="text-3xl sm:text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500 mb-4 text-center uppercase animate-pulse">
                    ÉGALITÉ PARFAITE !
                </h1>
                <p className="text-base sm:text-xl text-gray-300 mb-8 sm:mb-12 text-center max-w-md">
                    Mort subite : Lancez 3 fléchettes au centre (Bullseye). Le plus haut score l'emporte !
                </p>
                <div className="w-full max-w-md space-y-4 sm:space-y-6 mb-8 sm:mb-12">
                    {tiedPlayers.map(p => (
                        <div key={p.id} className="bg-gray-900 p-4 sm:p-6 rounded-2xl border border-gray-800 flex flex-col gap-4">
                            <label className="font-bold text-lg sm:text-xl text-center break-words">{p.name}</label>
                            <input
                                type="number"
                                placeholder="Score (ex: 50)"
                                value={tieScores[p.id] || ''}
                                onChange={e => setTieScores({...tieScores, [p.id]: e.target.value})}
                                className="bg-black border border-gray-700 rounded-xl p-3 sm:p-4 text-center text-2xl sm:text-3xl font-black text-orange-500 focus:outline-none focus:border-orange-500"
                            />
                        </div>
                    ))}
                </div>
                <Button onClick={handleTieBreakerSubmit} size="lg" className="w-full max-w-md h-14 sm:h-20 text-lg sm:text-2xl uppercase shadow-lg shadow-orange-900/40">
                    Valider le Vainqueur ➔
                </Button>
            </div>
        );
    }

    return (
        <div className="relative h-[100dvh] bg-black">
            {phase === 'X01' && (
                <MatchView
                    initialMatch={x01Match}
                    onFinish={() => {}} // Not used, we use onFinishWithState
                    onFinishWithState={handleX01Finish}
                    onExit={onExit}
                />
            )}
            
            {phase === 'CRICKET' && (
                <CricketGameView
                    players={players}
                    onFinish={handleCricketFinish}
                    onExit={onExit}
                />
            )}

            {phase === 'CAPITAL' && (
                <CapitalGameView
                    players={players}
                    onFinish={handleCapitalFinish}
                    onExit={onExit}
                />
            )}
        </div>
    );
};
