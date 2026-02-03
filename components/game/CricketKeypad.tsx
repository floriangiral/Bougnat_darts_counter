
import React from 'react';
import { Button } from '../ui/Button';
import { CricketTarget } from '../../types';

interface CricketKeypadProps {
    onHit: (target: CricketTarget, multiplier: 1 | 2 | 3) => void;
    onMiss: () => void;
    onUndo: () => void;
    canUndo: boolean;
}

export const CricketKeypad: React.FC<CricketKeypadProps> = ({ onHit, onMiss, onUndo, canUndo }) => {
    
    // Optimization: Layout designed to fill bottom 45% of screen perfectly
    // Grouped by row for easier thumb reach
    
    return (
        <div className="flex flex-col h-full gap-1 p-1 bg-gray-950 border-t border-gray-800 shadow-2xl">
            
            {/* Top Row: 20, 19, 18 - Most frequent */}
            <div className="flex-1 grid grid-cols-3 gap-1">
                {[20, 19, 18].map(num => (
                    <Button 
                        key={num}
                        onClick={() => onHit(num as CricketTarget, 1)}
                        className="text-4xl font-black bg-gray-800 hover:bg-gray-700 text-white border-b-4 border-gray-900 active:border-b-0 active:translate-y-1 transition-all"
                    >
                        {num}
                    </Button>
                ))}
            </div>

            {/* Second Row: 17, 16, 15 */}
            <div className="flex-1 grid grid-cols-3 gap-1">
                 {[17, 16, 15].map(num => (
                    <Button 
                        key={num}
                        onClick={() => onHit(num as CricketTarget, 1)}
                        className="text-4xl font-black bg-gray-800 hover:bg-gray-700 text-white border-b-4 border-gray-900 active:border-b-0 active:translate-y-1 transition-all"
                    >
                        {num}
                    </Button>
                ))}
            </div>

            {/* Special & Multipliers Row */}
            <div className="h-16 grid grid-cols-4 gap-1">
                <Button 
                    onClick={() => onHit(25, 1)}
                    className="bg-red-900/30 hover:bg-red-900/50 text-red-500 font-black text-xl border border-red-900/50"
                >
                    BULL
                </Button>
                <Button 
                    variant="secondary"
                    onClick={() => onHit(25, 2)}
                    className="bg-red-600 hover:bg-red-500 text-white font-black text-lg shadow-[0_0_10px_rgba(220,38,38,0.4)]"
                >
                    D-BULL
                </Button>
                {/* Multiplier Toggles (Actually hit 20/19/etc with multiplier applied logic is complex without selection state)
                    For simplicity in this keypad version, we create specific Multiplier MODES or just rows.
                    Wait, previous logic was direct hit. 
                    Let's adapt: We need to allow hitting D20, T20 etc. 
                    
                    BETTER MOBILE LAYOUT: 
                    Left side: Numbers grid. 
                    Right side: Multipliers (Double/Triple) acting as modifiers? No, that's slow.
                    
                    Let's stick to the grid but add dedicated Double/Triple strips below the numbers.
                */}
            </div>

            {/* Modifiers / Action Row - REFACTORED FOR SPEED */}
            {/* We need a way to hit T20 without 2 clicks if possible, OR make it easy. 
                Given screen constraint, 2-click (Select Modifier -> Select Number) or standard grid is best.
                Let's stick to the previous direct approach but optimized.
            */}
            
             <div className="flex-1 grid grid-cols-3 gap-1">
                {/* Double Strip */}
                <div className="grid grid-cols-1 gap-1">
                     <Button variant="secondary" className="flex-1 text-cyan-400 bg-gray-900 text-xs font-bold pointer-events-none border-none">DOUBLES</Button>
                     <div className="grid grid-cols-3 gap-0.5">
                        {[20,19,18,17,16,15].map(n => (
                            <button key={`d${n}`} onClick={() => onHit(n as CricketTarget, 2)} className="h-8 bg-gray-800 text-cyan-400 font-bold text-sm rounded border border-gray-700">{n}</button>
                        ))}
                     </div>
                </div>

                {/* Triple Strip */}
                <div className="grid grid-cols-1 gap-1">
                     <Button variant="secondary" className="flex-1 text-orange-400 bg-gray-900 text-xs font-bold pointer-events-none border-none">TRIPLES</Button>
                     <div className="grid grid-cols-3 gap-0.5">
                        {[20,19,18,17,16,15].map(n => (
                            <button key={`t${n}`} onClick={() => onHit(n as CricketTarget, 3)} className="h-8 bg-gray-800 text-orange-400 font-bold text-sm rounded border border-gray-700">{n}</button>
                        ))}
                     </div>
                </div>

                 {/* Actions */}
                 <div className="flex flex-col gap-1">
                    <Button variant="danger" onClick={onMiss} className="flex-1 text-xl font-bold">MISS</Button>
                    <Button variant="secondary" onClick={onUndo} disabled={!canUndo} className="h-10 text-sm font-bold text-gray-500">UNDO</Button>
                 </div>
            </div>
        </div>
    );
};
