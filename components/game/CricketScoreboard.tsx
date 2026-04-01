
import React from 'react';
import { CricketPlayerState, CricketTarget } from '../../types';
import { CRICKET_TARGETS } from '../../utils/cricketLogic';

interface CricketScoreboardProps {
    players: CricketPlayerState[];
    currentPlayerId: string;
    displayedRound?: number;
    currentPlayerTurnDartsThrown?: number;
    startingCompetitorId?: string | null;
    memberNamesByCompetitor?: Record<string, string[]>;
    currentThrowerName?: string;
    isDoubles?: boolean;
    roundsLimit?: number;
}

export const CricketScoreboard: React.FC<CricketScoreboardProps> = ({
    players,
    currentPlayerId,
    displayedRound,
    currentPlayerTurnDartsThrown = 0,
    startingCompetitorId = null,
    memberNamesByCompetitor = {},
    currentThrowerName,
    isDoubles = false,
    roundsLimit = 20,
}) => {
    const columnStyle = {
        gridTemplateColumns: `repeat(${players.length}, minmax(0, 1fr))`,
    };
    const currentPlayer = players.find((player) => player.id === currentPlayerId) ?? players[0];
    const currentRound = displayedRound ?? (currentPlayer ? Math.min(Math.floor(currentPlayer.dartsThrown / 3) + 1, roundsLimit) : 1);

    const renderMark = (count: number, isClosedByAll: boolean) => {
        let content = null;
        // Optimization: Use text symbols instead of complex SVGs for performance/cleanliness
        if (count === 0) content = <span className="opacity-0">.</span>;
        else if (count === 1) content = <span className="text-xl sm:text-2xl md:text-3xl font-sans">/</span>;
        else if (count === 2) content = <span className="text-xl sm:text-2xl md:text-3xl font-sans">X</span>;
        else if (count >= 3) content = (
            <div className="relative flex h-5 w-5 items-center justify-center sm:h-6 sm:w-6 md:h-7 md:w-7">
                 <span className="absolute text-xl sm:text-2xl md:text-3xl font-sans">X</span>
                 <div className="absolute inset-0 rounded-full border-[1.5px] border-current sm:border-2"></div>
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
            <div className="mb-1 sm:px-0 sm:py-0 rounded-xl border border-white/8 bg-white/[0.035] px-2 py-1 sm:rounded-none sm:border-0 sm:bg-transparent">
                <div className="text-center text-[10px] font-black uppercase leading-none tracking-[0.14em] text-gray-200 sm:hidden">
                    TOUR {currentRound}/{roundsLimit}
                </div>
                <div className="mt-3 hidden gap-2 sm:grid" style={columnStyle}>
                    {players.map((player) => {
                        const isCurrent = player.id === currentPlayerId;
                        const dartsInCurrentRound = isCurrent ? currentPlayerTurnDartsThrown : player.dartsThrown % 3;
                        const roundNumber = Math.min(Math.floor((player.dartsThrown - dartsInCurrentRound) / 3) + 1, roundsLimit);
                        const progressPercent = Math.min((((roundNumber - 1) + dartsInCurrentRound / 3) / roundsLimit) * 100, 100);

                        return (
                            <div
                                key={`${player.id}-round-progress`}
                                className={`rounded-xl border px-2 py-1.5 ${isCurrent ? 'border-orange-500/30 bg-orange-500/8' : 'border-white/8 bg-black/20'}`}
                            >
                                <div className="flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[0.14em]">
                                    <span className={`${isCurrent ? 'text-orange-300' : 'text-gray-400'}`}>Tour {roundNumber}/{roundsLimit}</span>
                                    <span className={`${isCurrent ? 'text-white' : 'text-gray-500'}`}>{dartsInCurrentRound}/3</span>
                                </div>
                                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                                    <div
                                        className={`h-full rounded-full transition-all duration-300 ${isCurrent ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-slate-400 to-slate-200'}`}
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            {/* Header: Player Names & Scores - Compacted */}
            <div className="mb-1 flex min-h-[32px] shrink-0 gap-1 md:min-h-[34px]">
                <div className="grid min-h-0 flex-1 gap-1" style={columnStyle}>
                    {players.map((p) => (
                        <div 
                            key={p.id} 
                            className={`
                                flex w-full min-h-[32px] min-w-0 self-stretch flex-col items-center justify-center rounded-xl border px-1 py-1 transition-all md:min-h-[34px]
                                ${p.id === currentPlayerId 
                                    ? 'border-orange-500/35 bg-slate-800/95 shadow-[0_0_16px_rgba(234,88,12,0.16)]' 
                                    : 'border-white/6 bg-slate-950/55 opacity-70'}
                            `}
                        >
                            <div className={`relative w-full px-5 text-[10px] font-bold uppercase leading-tight sm:px-6 sm:text-[11px] md:text-xs ${p.id === currentPlayerId ? 'text-orange-400' : 'text-gray-400'}`}>
                                <span className="block truncate text-center">{p.name}</span>
                                {startingCompetitorId === p.id && (
                                    <span
                                        title="A commencé la partie"
                                        className={`absolute right-0 top-1/2 inline-flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full border text-[8px] font-black uppercase tracking-[0.12em] sm:h-5 sm:w-5 sm:text-[9px] ${
                                            p.id === currentPlayerId
                                                ? 'border-orange-400/70 bg-orange-500 text-black'
                                                : 'border-orange-500/35 bg-orange-500/10 text-orange-300'
                                        }`}
                                    >
                                        D
                                    </span>
                                )}
                            </div>
                            {isDoubles && memberNamesByCompetitor[p.id] && (
                                <div className={`mt-0.5 max-w-full truncate text-[8px] font-bold uppercase tracking-[0.08em] sm:text-[9px] ${p.id === currentPlayerId ? 'text-white' : 'text-gray-500'}`}>
                                    {p.id === currentPlayerId && currentThrowerName ? currentThrowerName : memberNamesByCompetitor[p.id].join(' / ')}
                                </div>
                            )}
                            <div className="mt-0.5 text-sm font-mono font-black leading-none text-white sm:text-base md:text-lg">
                                {p.score}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="w-[34px] shrink-0 rounded-xl border border-white/6 bg-[#101827]/95 md:w-[38px]" />
            </div>

            {/* The Grid - Flex grow to fill space */}
            <div className="flex flex-1 flex-col justify-evenly">
                {CRICKET_TARGETS.map((target) => {
                    const isClosedByAll = players.every(p => p.marks[target] >= 3);
                    
                    return (
                        <div key={target} className="mb-1 flex min-h-[32px] flex-1 gap-1 last:mb-0 md:min-h-[34px]">
                             <div className="grid min-h-0 flex-1 gap-1" style={columnStyle}>
                               {players.map((p) => (
                                 <div key={p.id} className={`flex items-center justify-center rounded-xl border border-white/6 bg-slate-800/55 ${p.id === currentPlayerId ? 'border-orange-500/35 bg-slate-800/80' : 'border-transparent'}`}>
                                     {renderMark(p.marks[target], isClosedByAll)}
                                 </div>
                               ))}
                             </div>

                             <div className="flex w-[34px] shrink-0 items-center justify-center rounded-xl border border-white/6 bg-[#101827]/95 md:w-[38px]">
                                 <span className={`text-base font-black sm:text-lg md:text-xl ${isClosedByAll ? 'text-gray-700 line-through decoration-2' : 'text-orange-400'}`}>
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
