
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
    return (
        <div className="flex h-full min-h-0 flex-col gap-1.5 border-t border-gray-800 bg-gray-950 p-1.5 shadow-2xl sm:gap-2 sm:p-2">
            
            {/* Top Row: 20, 19, 18 - Most frequent */}
            <div className="grid min-h-0 flex-1 grid-cols-3 gap-1 sm:gap-2">
                {[20, 19, 18].map(num => (
                    <Button 
                        key={num}
                        onClick={() => onHit(num as CricketTarget, 1)}
                        className="h-full min-h-0 px-1 py-1 text-xl font-black bg-gray-800 text-white border-b-2 border-gray-900 transition-all active:translate-y-0.5 active:border-b-0 hover:bg-gray-700 sm:text-4xl"
                    >
                        {num}
                    </Button>
                ))}
            </div>

            {/* Second Row: 17, 16, 15 */}
            <div className="grid min-h-0 flex-1 grid-cols-3 gap-1 sm:gap-2">
                 {[17, 16, 15].map(num => (
                    <Button 
                        key={num}
                        onClick={() => onHit(num as CricketTarget, 1)}
                        className="h-full min-h-0 px-1 py-1 text-xl font-black bg-gray-800 text-white border-b-2 border-gray-900 transition-all active:translate-y-0.5 active:border-b-0 hover:bg-gray-700 sm:text-4xl"
                    >
                        {num}
                    </Button>
                ))}
            </div>

            {/* Special & Multipliers Row */}
            <div className="grid h-11 shrink-0 grid-cols-2 gap-1 sm:h-14 sm:grid-cols-4 sm:gap-2">
                <Button 
                    onClick={() => onHit(25, 1)}
                    className="min-h-0 px-2 py-1 text-xs font-black bg-red-900/30 text-red-500 border border-red-900/50 hover:bg-red-900/50 sm:text-xl"
                >
                    BULL
                </Button>
                <Button 
                    variant="secondary"
                    onClick={() => onHit(25, 2)}
                    className="min-h-0 px-2 py-1 text-[10px] font-black bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.4)] hover:bg-red-500 sm:text-lg"
                >
                    D-BULL
                </Button>
                <Button 
                    variant="danger"
                    onClick={onMiss}
                    className="min-h-0 px-2 py-1 text-xs font-bold sm:text-lg"
                >
                    MISS
                </Button>
                <Button 
                    variant="secondary"
                    onClick={onUndo}
                    disabled={!canUndo}
                    className="min-h-0 px-2 py-1 text-[10px] font-bold text-gray-500 sm:text-sm"
                >
                    UNDO
                </Button>
            </div>
            
             <div className="grid min-h-0 flex-[1.15] grid-cols-3 gap-1 sm:gap-2">
                {/* Double Strip */}
                <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-1">
                     <Button variant="secondary" className="pointer-events-none min-h-0 border-none px-1 py-1 bg-gray-900 text-[10px] font-bold text-cyan-400 sm:text-xs">DOUBLES</Button>
                     <div className="grid min-h-0 grid-cols-3 grid-rows-2 gap-0.5 sm:gap-1">
                        {[20,19,18,17,16,15].map(n => (
                            <button key={`d${n}`} onClick={() => onHit(n as CricketTarget, 2)} className="h-full min-h-0 rounded border border-gray-700 bg-gray-800 px-1 py-1 text-[10px] font-bold text-cyan-400 transition-colors hover:bg-cyan-900/40 sm:text-sm">{n}</button>
                        ))}
                     </div>
                </div>

                {/* Triple Strip */}
                <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-1">
                     <Button variant="secondary" className="pointer-events-none min-h-0 border-none px-1 py-1 bg-gray-900 text-[10px] font-bold text-orange-400 sm:text-xs">TRIPLES</Button>
                     <div className="grid min-h-0 grid-cols-3 grid-rows-2 gap-0.5 sm:gap-1">
                        {[20,19,18,17,16,15].map(n => (
                            <button key={`t${n}`} onClick={() => onHit(n as CricketTarget, 3)} className="h-full min-h-0 rounded border border-gray-700 bg-gray-800 px-1 py-1 text-[10px] font-bold text-orange-400 transition-colors hover:bg-orange-900/40 sm:text-sm">{n}</button>
                        ))}
                     </div>
                </div>

                 {/* Singles reminder / quick lane */}
                 <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-1">
                    <Button variant="secondary" className="pointer-events-none min-h-0 border-none px-1 py-1 bg-gray-900 text-[10px] font-bold text-white/70 sm:text-xs">SINGLES</Button>
                    <div className="grid min-h-0 grid-cols-2 grid-rows-3 gap-0.5 sm:gap-1">
                        {[20, 19, 18, 17, 16, 15].map(n => (
                            <button key={`s${n}`} onClick={() => onHit(n as CricketTarget, 1)} className="h-full min-h-0 rounded border border-gray-700 bg-gray-800 px-1 py-1 text-xs font-bold text-white transition-colors hover:bg-gray-700 sm:text-sm">
                                {n}
                            </button>
                        ))}
                    </div>
                 </div>
            </div>
        </div>
    );
};
