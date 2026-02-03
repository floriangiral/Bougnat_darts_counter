
import React, { useState, useEffect } from 'react';
import { Player, CricketPlayerState, CricketTarget } from '../types';
import { initCricketState, processCricketHit, checkCricketWin } from '../utils/cricketLogic';
import { CricketScoreboard } from '../components/game/CricketScoreboard';
import { CricketKeypad } from '../components/game/CricketKeypad';
import { Button } from '../components/ui/Button';

interface CricketGameViewProps {
    players: Player[];
    onExit: () => void;
    onFinish: (results: CricketPlayerState[]) => void;
}

export const CricketGameView: React.FC<CricketGameViewProps> = ({ players, onExit, onFinish }) => {
    const [states, setStates] = useState<CricketPlayerState[]>(() => initCricketState(players));
    const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
    const [turnDartsThrown, setTurnDartsThrown] = useState(0);
    const [history, setHistory] = useState<CricketPlayerState[][]>([]); 
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [winnerId, setWinnerId] = useState<string | null>(null);

    const currentPlayer = states[currentPlayerIdx];

    const handleHit = (target: CricketTarget, multiplier: 1 | 2 | 3) => {
        if (winnerId) return;

        setHistory(prev => [...prev, JSON.parse(JSON.stringify(states))]);

        const result = processCricketHit(states, currentPlayer.id, target, multiplier);
        setStates(result.newStates);

        const win = checkCricketWin(result.newStates);
        if (win) {
            setWinnerId(win);
            return;
        }

        advanceTurn();
    };

    const handleMiss = () => {
        if (winnerId) return;
        setHistory(prev => [...prev, JSON.parse(JSON.stringify(states))]);
        
        setStates(prev => {
            const copy = [...prev];
            copy[currentPlayerIdx].dartsThrown += 1;
            copy[currentPlayerIdx].history.push({ target: null, multiplier: 1, isMiss: true, pointsScored: 0 });
            return copy;
        });

        advanceTurn();
    };

    const advanceTurn = () => {
        const nextDartsThrown = turnDartsThrown + 1;
        
        if (nextDartsThrown >= 3) {
            setTimeout(() => {
                setTurnDartsThrown(0);
                setCurrentPlayerIdx(prev => (prev + 1) % players.length);
                setHistory([]); 
            }, 500);
        } else {
            setTurnDartsThrown(nextDartsThrown);
        }
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        const lastState = history[history.length - 1];
        setStates(lastState);
        setHistory(prev => prev.slice(0, -1));
        if (turnDartsThrown > 0) setTurnDartsThrown(prev => prev - 1);
    };

    // --- RENDER ---

    if (winnerId) {
        const winner = states.find(p => p.id === winnerId)!;
        return (
            <div className="h-[100dvh] bg-black text-white flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
                 <h1 className="text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 mb-4 text-center drop-shadow-[0_0_15px_rgba(234,88,12,0.5)]">
                     VAINQUEUR
                 </h1>
                 <div className="text-4xl font-bold text-white mb-2 uppercase text-center">
                     {winner.name}
                 </div>
                 <div className="text-xl text-gray-400 font-mono mb-12 uppercase tracking-widest">
                     Score Final: {winner.score}
                 </div>
                 <Button onClick={() => onFinish(states)} size="lg" className="w-full max-w-xs h-20 text-2xl uppercase shadow-lg shadow-orange-900/40">
                     Voir les Stats ➔
                 </Button>
            </div>
        );
    }

    return (
        <div className="h-[100dvh] bg-gradient-to-br from-gray-900 to-black text-white flex flex-col overflow-hidden">
             {/* Header */}
            <div className="h-12 shrink-0 bg-gray-900 border-b border-gray-800 flex justify-between items-center px-4 z-20">
                <div className="font-black italic text-lg">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
                        CRICKET
                    </span>
                </div>
                <div className="flex gap-2">
                    <div className="flex gap-1 items-center mr-4">
                         {[1, 2, 3].map(i => (
                            <div key={i} className={`w-2.5 h-2.5 rounded-full border border-gray-600 ${i <= turnDartsThrown ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] border-orange-500' : 'bg-transparent'}`}></div>
                         ))}
                    </div>
                    <button onClick={() => setShowExitConfirm(true)} className="text-gray-500 hover:text-white px-2">✕</button>
                </div>
            </div>

            {/* Scoreboard - Takes available space */}
            <div className="flex-1 overflow-hidden relative">
                <CricketScoreboard players={states} currentPlayerId={currentPlayer.id} />
            </div>

            {/* Keypad Area - Fixed height for usability */}
            <div className="h-[45vh] shrink-0 z-30 pb-safe">
                <CricketKeypad 
                    onHit={handleHit} 
                    onMiss={handleMiss} 
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
        </div>
    );
};
