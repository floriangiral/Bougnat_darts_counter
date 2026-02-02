
import React, { useState } from 'react';
import { MatchState } from '../../types';
import { calculateDetailedStats, formatDuration } from '../../utils/gameLogic';
import { Button } from '../ui/Button';

interface StatsModalProps {
  match: MatchState;
  onClose?: () => void;
  title?: string;
  inline?: boolean;
}

export const StatsModal: React.FC<StatsModalProps> = ({ match, onClose, title = "MATCH STATS", inline = false }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SCORING'>('OVERVIEW');

  // Pre-calculate stats once to avoid repeated calculations in render
  const p1Stats = calculateDetailedStats(match, match.players[0].id);
  const p2Stats = match.players[1] ? calculateDetailedStats(match, match.players[1].id) : null;

  const containerClasses = inline 
    ? "w-full h-full flex flex-col overflow-hidden" 
    : "fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4";

  const wrapperClasses = inline
    ? "w-full h-full flex flex-col"
    : "bg-gray-900 rounded-2xl w-full max-w-4xl border border-gray-700 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh] overflow-hidden";
  
  // Logic to determine if it's a single leg match to adapt labels
  const isSingleLegMatch = match.config.matchMode === 'LEGS' && match.config.legsToWin === 1;

  return (
    <div className={containerClasses}>
      <div className={wrapperClasses}>
        
        {/* Header */}
        <div className={`p-6 border-b border-gray-800 flex justify-between items-center bg-gray-950 shrink-0 ${inline ? 'rounded-t-2xl' : ''}`}>
           <h2 className="text-xl md:text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 uppercase">
             {title}
           </h2>
           {onClose && !inline && <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-500 hover:text-white">✕ Close</Button>}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 bg-gray-900 shrink-0">
           <button 
             onClick={() => setActiveTab('OVERVIEW')}
             className={`flex-1 py-4 text-sm font-black uppercase tracking-widest transition-colors ${activeTab === 'OVERVIEW' ? 'bg-gray-800 text-orange-500 border-b-2 border-orange-500' : 'text-gray-500 hover:text-gray-300'}`}
           >
             Overview
           </button>
           <button 
             onClick={() => setActiveTab('SCORING')}
             className={`flex-1 py-4 text-sm font-black uppercase tracking-widest transition-colors ${activeTab === 'SCORING' ? 'bg-gray-800 text-orange-500 border-b-2 border-orange-500' : 'text-gray-500 hover:text-gray-300'}`}
           >
             Scoring
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-900/50 relative flex flex-col custom-scrollbar">
          
          {/* Sticky Column Headers */}
          <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800 grid grid-cols-[1fr_1fr_1fr] gap-2 px-3 py-3 shadow-lg">
               <div className="text-left text-gray-600 text-[10px] font-bold uppercase tracking-widest flex items-end pb-1">Metric</div>
               <div className="text-center text-orange-500 text-xs md:text-sm font-black uppercase tracking-wider truncate px-1 flex items-end justify-center">
                  {match.players[0].name}
               </div>
               <div className="text-center text-orange-500 text-xs md:text-sm font-black uppercase tracking-wider truncate px-1 flex items-end justify-center">
                  {match.players[1] ? match.players[1].name : '-'}
               </div>
          </div>

          <div className="p-2 md:p-6 space-y-1">
            {activeTab === 'OVERVIEW' && (
               <>
                  <StatRow label="Match Duration" 
                      val1={match.duration ? formatDuration(match.duration) : '-'} 
                      val2="" 
                      singleValue
                  />
                  <StatRow label="3-Dart Avg" 
                      val1={p1Stats.threeDartAvg} 
                      val2={p2Stats ? p2Stats.threeDartAvg : '-'} 
                      highlight
                  />
                  <StatRow label="First 9 Avg" 
                      val1={p1Stats.first9Avg} 
                      val2={p2Stats ? p2Stats.first9Avg : '-'} 
                  />
                   <StatRow label="Checkout %" 
                      val1={p1Stats.checkoutPercent} 
                      val2={p2Stats ? p2Stats.checkoutPercent : '-'} 
                      subtext="(Requires dart input)"
                  />
                  <StatRow label="Highest Checkout" 
                      val1={p1Stats.highestCheckout} 
                      val2={p2Stats ? p2Stats.highestCheckout : '-'} 
                      isBest={true}
                  />
                  <StatRow label="Highest Score" 
                      val1={p1Stats.highestScore} 
                      val2={p2Stats ? p2Stats.highestScore : '-'} 
                  />
                  <StatRow label={isSingleLegMatch ? "Winning Darts" : "Best Leg (Darts)"}
                      val1={p1Stats.bestLegDarts ?? '-'} 
                      val2={p2Stats ? p2Stats.bestLegDarts ?? '-' : '-'} 
                      isLowBest={true}
                  />
                  {/* Hide Worst Leg if it is a single leg match, as it duplicates Best Leg */}
                  {!isSingleLegMatch && (
                      <StatRow label="Worst Leg (Darts)" 
                          val1={p1Stats.worstLegDarts ?? '-'} 
                          val2={p2Stats ? p2Stats.worstLegDarts ?? '-' : '-'} 
                      />
                  )}
               </>
            )}

            {activeTab === 'SCORING' && (
                <>
                   <StatRow label="180s" 
                      val1={p1Stats.scoreCounts.c180} 
                      val2={p2Stats ? p2Stats.scoreCounts.c180 : '-'} 
                      highlight
                   />
                   <StatRow label="160+" 
                      val1={p1Stats.scoreCounts.c160} 
                      val2={p2Stats ? p2Stats.scoreCounts.c160 : '-'} 
                   />
                   <StatRow label="140+" 
                      val1={p1Stats.scoreCounts.c140} 
                      val2={p2Stats ? p2Stats.scoreCounts.c140 : '-'} 
                   />
                   <StatRow label="120+" 
                      val1={p1Stats.scoreCounts.c120} 
                      val2={p2Stats ? p2Stats.scoreCounts.c120 : '-'} 
                   />
                   <StatRow label="100+" 
                      val1={p1Stats.scoreCounts.c100} 
                      val2={p2Stats ? p2Stats.scoreCounts.c100 : '-'} 
                   />
                   <StatRow label="80+" 
                      val1={p1Stats.scoreCounts.c80} 
                      val2={p2Stats ? p2Stats.scoreCounts.c80 : '-'} 
                   />
                   <StatRow label="60+" 
                      val1={p1Stats.scoreCounts.c60} 
                      val2={p2Stats ? p2Stats.scoreCounts.c60 : '-'} 
                   />
                   <StatRow label="40+" 
                      val1={p1Stats.scoreCounts.c40} 
                      val2={p2Stats ? p2Stats.scoreCounts.c40 : '-'} 
                   />
                </>
            )}
          </div>
        </div>

        {onClose && !inline && (
            <div className="p-4 bg-gray-950 border-t border-gray-800 md:hidden shrink-0">
                <Button className="w-full" onClick={onClose}>Close</Button>
            </div>
        )}
      </div>
    </div>
  );
};

// Helper Subcomponent for Rows
const StatRow = ({ label, val1, val2, highlight = false, isBest = false, isLowBest = false, subtext = "", singleValue = false }: any) => {
    let win1 = false;
    let win2 = false;

    if (!singleValue && val1 !== '-' && val2 !== '-' && typeof val1 === 'number' && typeof val2 === 'number') {
        if (isLowBest) {
            win1 = val1 < val2;
            win2 = val2 < val1;
        } else {
            win1 = val1 > val2;
            win2 = val2 > val1;
        }
    }

    return (
        <div className={`grid grid-cols-[1fr_1fr_1fr] gap-2 items-center p-3 rounded-lg border border-gray-800/50 ${highlight ? 'bg-gray-800' : 'bg-gray-800/30'}`}>
             <div className="text-left">
                <div className="text-gray-400 font-bold uppercase text-[10px] md:text-xs tracking-wider">{label}</div>
                {subtext && <div className="text-[9px] text-gray-600">{subtext}</div>}
             </div>
             
             {singleValue ? (
                 <div className="col-span-2 text-center font-mono font-black text-sm md:text-lg text-white tracking-widest">
                     {val1}
                 </div>
             ) : (
                 <>
                    <div className={`text-center font-mono font-black text-sm md:text-lg ${win1 ? 'text-orange-500' : 'text-white'}`}>
                        {val1}
                    </div>
                    
                    <div className={`text-center font-mono font-black text-sm md:text-lg ${win2 ? 'text-orange-500' : 'text-white'}`}>
                        {val2}
                    </div>
                 </>
             )}
        </div>
    );
}
