
import React from 'react';
import { CricketPlayerState, CricketTarget } from '../../types';
import { CRICKET_TARGETS } from '../../utils/cricketLogic';

interface CricketScoreboardProps {
    players: CricketPlayerState[];
    currentPlayerId: string;
    startingCompetitorId?: string | null;
    memberNamesByCompetitor?: Record<string, string[]>;
    currentThrowerName?: string;
    isDoubles?: boolean;
}

export const CricketScoreboard: React.FC<CricketScoreboardProps> = ({
    players,
    currentPlayerId,
    startingCompetitorId = null,
    memberNamesByCompetitor = {},
    currentThrowerName,
    isDoubles = false,
}) => {
    const columnStyle = {
        gridTemplateColumns: `repeat(${players.length}, minmax(0, 1fr))`,
    };

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
        <div className="flex h-full w-full flex-1 flex-col overflow-hidden rounded-[1.5rem] border border-white/8 bg-[#0b1019]/88 p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-md">
            
            {/* Header: Player Names & Scores - Compacted */}
            <div className="mb-1 grid gap-1 shrink-0" style={columnStyle}>
                {players.map((p) => (
                    <div 
                        key={p.id} 
                        className={`
                            flex flex-col items-center justify-center rounded-t-xl border-b-2 px-1 py-2 transition-all
                            ${p.id === currentPlayerId 
                                ? 'bg-slate-800/95 border-orange-500 shadow-[0_0_16px_rgba(234,88,12,0.16)]' 
                                : 'bg-slate-950/55 border-slate-700/80 opacity-70'}
                        `}
                    >
                        <div className={`max-w-full truncate text-xs font-bold uppercase leading-tight sm:text-sm md:text-base ${p.id === currentPlayerId ? 'text-orange-400' : 'text-gray-400'}`}>
                            <span className="inline-flex max-w-full items-center gap-2">
                                <span className="truncate">{p.name}</span>
                                {startingCompetitorId === p.id && (
                                    <span
                                        title="A commencé la partie"
                                        className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full border px-1.5 text-[9px] font-black uppercase tracking-[0.12em] md:h-6 md:min-w-6 md:text-[10px] ${
                                            p.id === currentPlayerId
                                                ? 'border-orange-400/70 bg-orange-500 text-black'
                                                : 'border-orange-500/35 bg-orange-500/10 text-orange-300'
                                        }`}
                                    >
                                        D
                                    </span>
                                )}
                            </span>
                        </div>
                        {isDoubles && memberNamesByCompetitor[p.id] && (
                            <div className={`mt-1 max-w-full truncate text-[10px] font-bold uppercase tracking-[0.12em] ${p.id === currentPlayerId ? 'text-white' : 'text-gray-500'}`}>
                                {p.id === currentPlayerId && currentThrowerName ? currentThrowerName : memberNamesByCompetitor[p.id].join(' / ')}
                            </div>
                        )}
                        <div className="mt-1 text-2xl font-mono font-black leading-none text-white md:text-3xl">
                            {p.score}
                        </div>
                    </div>
                ))}
            </div>

            {/* The Grid - Flex grow to fill space */}
            <div className="flex flex-1 flex-col justify-evenly">
                {CRICKET_TARGETS.map((target) => {
                    const isClosedByAll = players.every(p => p.marks[target] >= 3);
                    
                    return (
                        <div key={target} className="mb-1 flex min-h-[42px] flex-1 gap-1 last:mb-0 sm:min-h-[48px]">
                             <div className="grid min-h-0 flex-1 gap-1" style={columnStyle}>
                               {players.map((p) => (
                                 <div key={p.id} className={`flex items-center justify-center rounded-xl border border-white/6 bg-slate-800/55 ${p.id === currentPlayerId ? 'border-orange-500/35 bg-slate-800/80' : 'border-transparent'}`}>
                                     {renderMark(p.marks[target], isClosedByAll)}
                                 </div>
                               ))}
                             </div>

                             <div className="flex w-[42px] shrink-0 items-center justify-center rounded-xl border border-white/6 bg-[#101827]/95 sm:w-[48px]">
                                 <span className={`text-xl font-black md:text-2xl ${isClosedByAll ? 'text-gray-700 line-through decoration-2' : 'text-orange-400'}`}>
                                     {target === 25 ? 'B' : target}
                                 </span>
                             </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
