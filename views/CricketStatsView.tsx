
import React from 'react';
import { Button } from '../components/ui/Button';
import { CricketMatchSummary } from '../types';

interface CricketStatsViewProps {
  results: CricketMatchSummary;
  onHome: () => void;
  onRematch: () => void;
}

export const CricketStatsView: React.FC<CricketStatsViewProps> = ({ results, onHome, onRematch }) => {
  const sorted = [...results.competitors].sort((a,b) => b.score - a.score);
  const winner = sorted.find((player) => player.id === results.winnerId) || sorted[0];

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-gradient-to-br from-gray-900 to-black text-white">
      
      {/* HEADER */}
      <div className="shrink-0 px-4 pt-6 pb-5 text-center sm:pt-8 sm:pb-6">
         <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-orange-500 via-red-500 to-orange-500 drop-shadow-[0_5px_15px_rgba(234,88,12,0.4)] sm:text-4xl md:text-6xl">
            CRICKET MASTER
         </h1>
         <h2 className="text-lg md:text-xl text-gray-400 font-bold uppercase tracking-widest mt-2 px-4">
            Vainqueur: <span className="text-white">{winner.name}</span>
         </h2>
      </div>

      {/* STATS CONTENT */}
      <div className="mb-4 flex-1 w-full max-w-4xl mx-auto overflow-y-auto px-3 custom-scrollbar sm:px-4">
         <div className="space-y-5 rounded-2xl border border-gray-800 bg-gray-900/50 p-4 shadow-2xl sm:p-6 sm:space-y-6">
             
             {sorted.map((p, index) => {
                 // Explicitly cast to number[] because Object.values might be inferred as unknown[] depending on TS config
                 const totalMarks = (Object.values(p.marks) as number[]).reduce((a, b) => a + b, 0);
                 const mpr = p.dartsThrown > 0 ? (totalMarks / (p.dartsThrown / 3)).toFixed(2) : "0.00";
                 
                 return (
                    <div key={p.id} className="border-b border-gray-800 pb-4 last:border-0">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${index === 0 ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-400'}`}>
                                    {index + 1}
                                </div>
                                <span className="truncate text-base font-bold text-white sm:text-lg">{p.name}</span>
                            </div>
                            <div className="text-2xl font-black text-orange-500 sm:text-3xl">
                                {p.score} <span className="text-xs text-gray-500 font-normal align-middle">PTS</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                            <StatBox label="Marks Per Round (MPR)" value={mpr} />
                            <StatBox label="Total Marks" value={totalMarks} />
                            <StatBox label="Darts Thrown" value={p.dartsThrown} />
                            <StatBox label="Point Accuracy" value={`${p.dartsThrown > 0 ? ((p.history.filter(h => !h.isMiss && h.pointsScored > 0).length / p.dartsThrown) * 100).toFixed(0) : 0}%`} />
                        </div>
                    </div>
                 );
             })}

         </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="grid shrink-0 w-full max-w-lg mx-auto grid-cols-1 gap-3 px-4 pb-6 sm:grid-cols-2 sm:gap-4 sm:px-6 sm:pb-8">
        <Button onClick={onRematch} variant="secondary" size="lg" className="w-full border-orange-600 text-orange-500 hover:bg-orange-900/20">
            REVANCHE
        </Button>
        <Button onClick={onHome} variant="primary" size="lg" className="w-full shadow-orange-900/40">
            SORTIE
        </Button>
      </div>
    </div>
  );
};

const StatBox = ({ label, value }: { label: string, value: string | number }) => (
    <div className="bg-gray-800/40 p-3 rounded-lg text-center border border-gray-700/50">
        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 truncate">{label}</div>
        <div className="font-mono font-bold text-white text-lg">{value}</div>
    </div>
);
