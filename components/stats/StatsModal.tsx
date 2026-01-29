import React, { useState } from 'react';
import { MatchState } from '../../types';
import { calculateDetailedStats, formatDuration } from '../../utils/gameLogic';
import { Button } from '../ui/Button';

interface StatsModalProps {
  match: MatchState;
  onClose?: () => void;
  title?: string;
}

export const StatsModal: React.FC<StatsModalProps> = ({ match, onClose, title = "MATCH STATS" }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SCORING'>('OVERVIEW');

  // Changed to fixed inset-0 to prevent layout context issues from parents
  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-4xl border border-gray-700 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-950 shrink-0">
           <h2 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 uppercase">
             {title}
           </h2>
           {onClose && <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-500 hover:text-white">✕ Close</Button>}
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
        <div className="flex-1 overflow-y-auto bg-gray-900/50 relative flex flex-col">
          
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
                      val1={calculateDetailedStats(match, match.players[0].id).threeDartAvg} 
                      val2={match.players[1] ? calculateDetailedStats(match, match.players[1].id).threeDartAvg : '-'} 
                      highlight
                  />
                  <StatRow label="First 9 Avg" 
                      val1={calculateDetailedStats(match, match.players[0].id).first9Avg} 
                      val2={match.players[1] ? calculateDetailedStats(match, match.players[1].id).first9Avg : '-'} 
                  />
                   <StatRow label="Checkout %" 
                      val1={calculateDetailedStats(match, match.players[0].id).checkoutPercent} 
                      val2={match.players[1] ? calculateDetailedStats(match, match.players[1].id).checkoutPercent : '-'} 
                      subtext="(Requires dart input)"
                  />
                  <StatRow label="Highest Checkout" 
                      val1={calculateDetailedStats(match, match.players[0].id).highestCheckout} 
                      val2={match.players[1] ? calculateDetailedStats(match, match.players[1].id).highestCheckout : '-'} 
                      isBest={true}
                  />
                  <StatRow label="Highest Score" 
                      val1={calculateDetailedStats(match, match.players[0].id).highestScore} 
                      val2={match.players[1] ? calculateDetailedStats(match, match.players[1].id).highestScore : '-'} 
                  />
                  <StatRow label="Best Leg (Darts)" 
                      val1={calculateDetailedStats(match, match.players[0].id).bestLegDarts ?? '-'} 
                      val2={match.players[1] ? calculateDetailedStats(match, match.players[1].id).bestLegDarts ?? '-' : '-'} 
                      isLowBest={true}
                  />
                  <StatRow label="Worst Leg (Darts)" 
                      val1={calculateDetailedStats(match, match.players[0].id).worstLegDarts ?? '-'} 
                      val2={match.players[1] ? calculateDetailedStats(match, match.players[1].id).worstLegDarts ?? '-' : '-'} 
                  />
               </>
            )}

            {activeTab === 'SCORING' && (
                <>
                   <StatRow label="180s" 
                      val1={calculateDetailedStats(match, match.players[0].id).scoreCounts.c180} 
                      val2={match.players[1] ? calculateDetailedStats(match, match.players[1].id).scoreCounts.c180 : '-'} 
                      highlight
                   />
                   <StatRow label="160+" 
                      val1={calculateDetailedStats(match, match.players[0].id).scoreCounts.c160} 
                      val2={match.players[1] ? calculateDetailedStats(match, match.players[1].id).scoreCounts.c160 : '-'} 
                   />
                   <StatRow label="140+" 
                      val1={calculateDetailedStats(match, match.players[0].id).scoreCounts.c140} 
                      val2={match.players[1] ? calculateDetailedStats(match, match.players[1].id).scoreCounts.c140 : '-'} 
                   />
                   <StatRow label="120+" 
                      val1={calculateDetailedStats(match, match.players[0].id).scoreCounts.c120} 
                      val2={match.players[1] ? calculateDetailedStats(match, match.players[1].id).scoreCounts.c120 : '-'} 
                   />
                   <StatRow label="100+" 
                      val1={calculateDetailedStats(match, match.players[0].id).scoreCounts.c100} 
                      val2={match.players[1] ? calculateDetailedStats(match, match.players[1].id).scoreCounts.c100 : '-'} 
                   />
                   <StatRow label="80+" 
                      val1={calculateDetailedStats(match, match.players[0].id).scoreCounts.c80} 
                      val2={match.players[1] ? calculateDetailedStats(match, match.players[1].id).scoreCounts.c80 : '-'} 
                   />
                   <StatRow label="60+" 
                      val1={calculateDetailedStats(match, match.players[0].id).scoreCounts.c60} 
                      val2={match.players[1] ? calculateDetailedStats(match, match.players[1].id).scoreCounts.c60 : '-'} 
                   />
                   <StatRow label="40+" 
                      val1={calculateDetailedStats(match, match.players[0].id).scoreCounts.c40} 
                      val2={match.players[1] ? calculateDetailedStats(match, match.players[1].id).scoreCounts.c40 : '-'} 
                   />
                </>
            )}
          </div>
        </div>

        {onClose && (
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
                <div className="text-gray-400 font-bold uppercase text-xs md:text-sm tracking-wider">{label}</div>
                {subtext && <div className="text-[9px] text-gray-600">{subtext}</div>}
             </div>
             
             {singleValue ? (
                 <div className="col-span-2 text-center font-mono font-black text-lg md:text-xl text-white tracking-widest">
                     {val1}
                 </div>
             ) : (
                 <>
                    <div className={`text-center font-mono font-black text-lg md:text-xl ${win1 ? 'text-orange-500' : 'text-white'}`}>
                        {val1}
                    </div>
                    
                    <div className={`text-center font-mono font-black text-lg md:text-xl ${win2 ? 'text-orange-500' : 'text-white'}`}>
                        {val2}
                    </div>
                 </>
             )}
        </div>
    );
}