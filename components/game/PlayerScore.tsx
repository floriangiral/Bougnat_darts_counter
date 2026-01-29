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
        relative flex flex-col items-center justify-between h-full w-full transition-colors duration-300 pb-2 md:pb-16 pt-2 md:pt-4
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
      <div className="flex flex-col items-center z-10 shrink-0">
          <div className={`text-sm md:text-xl font-black uppercase tracking-widest ${isActive ? 'text-orange-500' : 'text-gray-600'}`}>
              {name}
          </div>
          {isActive && currentThrowerName && (
              <div className="text-[10px] md:text-xs font-bold text-black bg-orange-500 px-2 py-0.5 rounded-full mt-1 animate-pulse">
                  {currentThrowerName}
              </div>
          )}
      </div>

      {/* THE SCORE - Compact Font on Mobile */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        <div className={`
            font-mono font-black leading-none tracking-tighter z-10 transition-all duration-300
            text-[15vw] md:text-[12vw] lg:text-[160px]
            ${isActive ? 'text-white drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]' : 'text-gray-700'}
        `}>
            {score}
        </div>
      </div>

      {/* Stats Row - 2 Lines on Mobile, 1 Line on Desktop */}
      <div className="w-full px-2 md:px-6 z-10 pb-12 md:pb-0">
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-1 md:gap-4 text-[9px] md:text-xs font-mono uppercase tracking-wider py-2 border-t ${isActive ? 'border-gray-600' : 'border-gray-800/50'}`}>
            
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