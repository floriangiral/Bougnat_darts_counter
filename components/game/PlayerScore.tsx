import React from 'react';

interface PlayerScoreProps {
  name: string;
  score: number;
  isActive: boolean;
  legsWon: number;
  stats?: {
    matchAvg: string;
    legAvg: string;
    legDarts: number;
    lastScore: number | null;
  };
}

export const PlayerScore: React.FC<PlayerScoreProps> = ({ name, score, isActive, legsWon, stats }) => {
  return (
    <div 
      className={`
        flex flex-col items-center justify-center p-3 md:p-4 rounded-xl border-2 transition-all duration-300 relative overflow-hidden
        ${isActive 
            ? 'bg-gray-800 border-orange-500 shadow-[0_0_25px_rgba(234,88,12,0.3)] scale-[1.02] z-10' 
            : 'bg-gray-900 border-gray-800 opacity-60 scale-100'}
      `}
    >
      {/* Background decoration for active player */}
      {isActive && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 animate-pulse"></div>
      )}

      {/* Legs Indicators */}
      <div className="absolute top-3 right-3 flex space-x-1">
          {Array.from({length: legsWon}).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-[0_0_5px_rgba(234,179,8,0.8)]"></div>
          ))}
      </div>

      <div className={`text-sm font-black uppercase tracking-wider mb-1 ${isActive ? 'text-orange-500' : 'text-gray-500'}`}>
          {name}
      </div>
      
      <div className={`text-6xl md:text-7xl font-mono font-black my-2 tracking-tighter ${isActive ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' : 'text-gray-600'}`}>
        {score}
      </div>

      {/* Darts Count for Current Leg */}
      <div className={`text-xs font-mono mb-2 ${isActive ? 'text-orange-200' : 'text-gray-600'}`}>
         {stats?.legDarts || 0} Darts
      </div>

      <div className="w-full grid grid-cols-3 gap-2 text-xs md:text-xs mt-2 px-1 border-t border-gray-700/50 pt-3">
        <div className="flex flex-col items-center">
             <span className="text-[10px] uppercase text-gray-500 font-bold">Last</span>
             <span className={`font-mono font-bold ${isActive ? 'text-white' : 'text-gray-500'}`}>{stats?.lastScore ?? '-'}</span>
        </div>
        <div className="flex flex-col items-center">
             <span className="text-[10px] uppercase text-gray-500 font-bold">Leg Ø</span>
             <span className={`font-mono font-bold ${isActive ? 'text-white' : 'text-gray-500'}`}>{stats?.legAvg || '0.0'}</span>
        </div>
        <div className="flex flex-col items-center">
             <span className="text-[10px] uppercase text-gray-500 font-bold">Match Ø</span>
             <span className={`font-mono font-bold ${isActive ? 'text-white' : 'text-gray-500'}`}>{stats?.matchAvg || '0.0'}</span>
        </div>
      </div>
    </div>
  );
};