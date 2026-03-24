
import React from 'react';

interface PlayerScoreProps {
  name: string;
  currentThrowerName?: string;
  score: number;
  isActive: boolean;
  legsWon: number;
  setsWon?: number;
  stats?: {
    matchAvg: string;
    legAvg: string;
    legDarts: number;
    lastScore: number | null;
  };
}

export const PlayerScore: React.FC<PlayerScoreProps> = ({ name, currentThrowerName, score, isActive, legsWon, setsWon, stats }) => {
  return (
    <div 
      className={`
        relative flex h-full min-h-0 w-full flex-col items-center justify-between pb-2 pt-2 transition-colors duration-300 md:pb-10 md:pt-4
        ${isActive 
            ? 'bg-gray-800 text-white' 
            : 'bg-transparent text-gray-500'}
      `}
    >
      {/* Active Indicator Bar (Top) */}
      {isActive && (
        <div className="absolute top-0 inset-x-0 h-1 md:h-2 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.8)]"></div>
      )}

      {/* Name & Thrower */}
      <div className="z-10 flex max-w-full flex-col items-center px-2 text-center shrink-0">
          <div className={`max-w-full truncate text-xs font-black uppercase tracking-[0.24em] md:text-xl md:tracking-widest ${isActive ? 'text-orange-500' : 'text-gray-600'}`}>
              {name}
          </div>
          {isActive && currentThrowerName && (
              <div className="text-[10px] md:text-xs font-bold text-black bg-orange-500 px-2 py-0.5 rounded-full mt-1 animate-pulse">
                  {currentThrowerName}
              </div>
          )}
      </div>

      {/* THE SCORE - Massive scaling on Mobile (30vw) and Tablet (30vw) to fill 90% width of column */}
      <div className="flex min-h-0 w-full flex-1 items-center justify-center pb-4 sm:pb-6 md:pb-0">
        <div className={`
            z-10 font-mono font-black leading-none tracking-tighter transition-all duration-300
            text-[clamp(4rem,22vw,11rem)] md:text-[clamp(5.5rem,16vw,15rem)]
            ${isActive ? 'text-white drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]' : 'text-gray-700'}
        `}>
            {score}
        </div>
      </div>

      {/* Stats Row - 2 Lines on Mobile, 1 Line on Desktop */}
      <div className="z-10 w-full px-2 pb-2 md:px-6 md:pb-0">
        <div className={`grid grid-cols-2 gap-x-1 gap-y-2 border-t py-2 text-[9px] font-mono uppercase tracking-wider md:grid-cols-4 md:gap-4 md:text-xs ${isActive ? 'border-gray-600' : 'border-gray-800/50'}`}>
            
            {/* Leg Avg - Row 1 Col 1 */}
            <div className="flex flex-col items-center">
                 <span className="text-gray-500 font-bold mb-0.5 scale-90">Leg Avg</span>
                 <span className={`text-sm md:text-base font-black ${isActive ? 'text-white' : 'text-gray-500'}`}>{stats?.legAvg || '0.0'}</span>
            </div>

            {/* Match Avg - Row 1 Col 2 (Border Left) */}
            <div className="flex flex-col items-center border-l border-gray-700/50">
                 <span className="text-gray-500 font-bold mb-0.5 scale-90">Match Avg</span>
                 <span className={`text-sm md:text-base font-black ${isActive ? 'text-white' : 'text-gray-500'}`}>{stats?.matchAvg || '0.0'}</span>
            </div>

            {/* Darts Thrown - Row 2 Col 1 (No Border on Mobile, Border Left on Desktop) */}
            <div className="flex flex-col items-center md:border-l border-gray-700/50">
                 <span className="text-gray-500 font-bold mb-0.5 scale-90">Darts</span>
                 <span className={`text-sm md:text-base font-black ${isActive ? 'text-white' : 'text-gray-500'}`}>{stats?.legDarts || 0}</span>
            </div>

            {/* Last Score - Row 2 Col 2 (Border Left) */}
            <div className="flex flex-col items-center border-l border-gray-700/50">
                 <span className="text-gray-500 font-bold mb-0.5 scale-90">Last</span>
                 <span className={`text-sm md:text-base font-black ${isActive ? 'text-orange-500' : 'text-gray-500'}`}>{stats?.lastScore ?? '-'}</span>
            </div>
        </div>
      </div>
      
      {/* Background visual cue for inactive player to separate columns */}
      {!isActive && (
          <div className="absolute right-0 top-10 bottom-10 w-px bg-gray-800 md:hidden"></div>
      )}
    </div>
  );
};
