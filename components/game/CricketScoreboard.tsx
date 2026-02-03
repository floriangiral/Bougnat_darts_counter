
import React from 'react';
import { CricketPlayerState, CricketTarget } from '../../types';
import { CRICKET_TARGETS } from '../../utils/cricketLogic';

interface CricketScoreboardProps {
    players: CricketPlayerState[];
    currentPlayerId: string;
}

export const CricketScoreboard: React.FC<CricketScoreboardProps> = ({ players, currentPlayerId }) => {
    
    // Condensed columns for mobile: 1fr for players, 40px for center target
    const gridCols = players.length === 2 ? 'grid-cols-[1fr_45px_1fr]' 
                   : players.length === 3 ? 'grid-cols-[1fr_45px_1fr_1fr]'
                   : 'grid-cols-[1fr_45px_1fr_1fr_1fr]'; 

    const renderMark = (count: number, isClosedByAll: boolean) => {
        let content = null;
        // Optimization: Use text symbols instead of complex SVGs for performance/cleanliness
        if (count === 0) content = <span className="opacity-0">.</span>;
        else if (count === 1) content = <span className="text-2xl md:text-4xl font-sans">/</span>;
        else if (count === 2) content = <span className="text-2xl md:text-4xl font-sans">X</span>;
        else if (count >= 3) content = (
            <div className="relative flex items-center justify-center w-6 h-6 md:w-8 md:h-8">
                 <span className="absolute text-2xl md:text-4xl font-sans">X</span>
                 <div className="absolute inset-0 rounded-full border-2 border-current"></div>
            </div>
        );

        return (
            <div className={`flex items-center justify-center w-full h-full font-black transition-all duration-300 ${
                isClosedByAll ? 'text-gray-700' : 
                count >= 3 ? 'text-green-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.6)]' : 
                'text-white'
            }`}>
                {content}
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col w-full h-full bg-black/40 backdrop-blur-sm p-1 overflow-hidden">
            
            {/* Header: Player Names & Scores - Compacted */}
            <div className={`grid ${gridCols} gap-1 mb-1 shrink-0`}>
                {players.map((p, idx) => (
                    <div 
                        key={p.id} 
                        className={`
                            flex flex-col items-center justify-center py-1 px-1 rounded-t-md border-b-2 transition-all
                            ${idx % 2 !== 0 && players.length === 2 ? 'order-3' : ''} 
                            ${p.id === currentPlayerId 
                                ? 'bg-gray-800 border-orange-500 shadow-[0_0_10px_rgba(234,88,12,0.2)]' 
                                : 'bg-gray-900/40 border-gray-700 opacity-60'}
                        `}
                    >
                        <div className={`text-[10px] md:text-sm font-bold uppercase truncate max-w-full leading-tight ${p.id === currentPlayerId ? 'text-orange-500' : 'text-gray-400'}`}>
                            {p.name}
                        </div>
                        <div className="text-xl md:text-3xl font-mono font-black text-white leading-none mt-0.5">
                            {p.score}
                        </div>
                    </div>
                ))}
                
                {/* Center Column Header Spacer */}
                {players.length === 2 && <div className="order-2"></div>}
            </div>

            {/* The Grid - Flex grow to fill space */}
            <div className="flex-1 flex flex-col justify-evenly">
                {CRICKET_TARGETS.map((target) => {
                    const isClosedByAll = players.every(p => p.marks[target] >= 3);
                    
                    return (
                        <div key={target} className={`grid ${gridCols} gap-1 flex-1 min-h-[40px] mb-0.5 last:mb-0`}>
                             
                             {/* Player 1 Marks */}
                             <div className={`bg-gray-800/40 rounded flex items-center justify-center border-l-2 ${players[0].id === currentPlayerId ? 'border-orange-500/50 bg-gray-800/60' : 'border-transparent'}`}>
                                 {renderMark(players[0].marks[target], isClosedByAll)}
                             </div>

                             {/* Target Label */}
                             {players.length === 2 ? (
                                 <div className="order-2 flex items-center justify-center bg-gray-900/80 rounded border border-gray-800/50">
                                     <span className={`font-black text-lg md:text-2xl ${isClosedByAll ? 'text-gray-700 line-through decoration-2' : 'text-orange-500'}`}>
                                         {target === 25 ? 'B' : target}
                                     </span>
                                 </div>
                             ) : null}

                             {/* Other Players */}
                             {players.slice(1).map((p, idx) => (
                                 <div key={p.id} className={`bg-gray-800/40 rounded flex items-center justify-center border-r-2 ${p.id === currentPlayerId ? 'border-orange-500/50 bg-gray-800/60' : 'border-transparent'} ${players.length === 2 ? 'order-3' : ''}`}>
                                     {renderMark(p.marks[target], isClosedByAll)}
                                 </div>
                             ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
