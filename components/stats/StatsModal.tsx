
import React, { useState } from 'react';
import { MatchState } from '../../types';
import { calculateDetailedStats, calculateDetailedStatsForTeam } from '../../src/application/scoring/matchStats';
import { formatDuration } from '../../src/application/scoring/matchLifecycle';
import { STATS_LABELS_FR } from '../../src/presentation/stats/statsLabels.fr';
import { presentX01DetailedStats } from '../../src/presentation/stats/statsPresenter.fr';
import { Button } from '../ui/Button';

interface StatsModalProps {
  match: MatchState;
  onClose?: () => void;
  title?: string;
  inline?: boolean;
}

export const StatsModal: React.FC<StatsModalProps> = ({ match, onClose, title = STATS_LABELS_FR.x01.title, inline = false }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SCORING'>('OVERVIEW');
  const teamIds = Array.from(new Set<string>(match.players.map((player) => player.teamId))).slice(0, 2);
  const competitorColumns = match.config.isDoubles
    ? teamIds.map((teamId) => ({
        id: teamId,
        label: match.players
          .filter((player) => player.teamId === teamId)
          .map((player) => player.name)
          .join(' / '),
        sublabel: match.players
          .filter((player) => player.teamId === teamId)
          .map((player) => player.name)
          .join(' / '),
        stats: presentX01DetailedStats(calculateDetailedStatsForTeam(match, teamId)),
      }))
    : match.players.slice(0, 2).map((player) => ({
        id: player.id,
        label: player.name,
        sublabel: '',
        stats: presentX01DetailedStats(calculateDetailedStats(match, player.id)),
      }));

  const firstCompetitor = competitorColumns[0];
  const secondCompetitor = competitorColumns[1];

  const containerClasses = inline 
    ? "w-full h-full flex flex-col overflow-hidden" 
    : "app-modal tablet-modal fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4";

  const wrapperClasses = inline
    ? "w-full h-full flex flex-col"
    : "bg-gray-900 rounded-2xl w-full max-w-4xl border border-gray-700 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh] overflow-hidden";
  
  // Logic to determine if it's a single leg match to adapt labels
  const isSingleLegMatch = match.config.matchMode === 'LEGS' && match.config.legsToWin === 1;

  return (
    <div className={containerClasses} role={inline ? undefined : 'dialog'} aria-modal={inline ? undefined : 'true'}>
      <div className={wrapperClasses}>
        
        {/* Header */}
        <div className={`p-4 sm:p-6 border-b border-gray-800 flex justify-between items-center gap-3 bg-gray-950 shrink-0 ${inline ? 'rounded-t-2xl' : ''}`}>
           <h2 className="text-lg sm:text-xl md:text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 uppercase">
             {title}
           </h2>
           {onClose && !inline && <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-500 hover:text-white">✕ {STATS_LABELS_FR.x01.actions.close}</Button>}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 bg-gray-900 shrink-0">
           <button 
             onClick={() => setActiveTab('OVERVIEW')}
             className={`flex-1 px-3 py-3 text-xs sm:text-sm font-black uppercase tracking-[0.22em] transition-colors ${activeTab === 'OVERVIEW' ? 'bg-gray-800 text-orange-500 border-b-2 border-orange-500' : 'text-gray-500 hover:text-gray-300'}`}
           >
             {STATS_LABELS_FR.x01.tabs.overview}
           </button>
           <button 
             onClick={() => setActiveTab('SCORING')}
             className={`flex-1 px-3 py-3 text-xs sm:text-sm font-black uppercase tracking-[0.22em] transition-colors ${activeTab === 'SCORING' ? 'bg-gray-800 text-orange-500 border-b-2 border-orange-500' : 'text-gray-500 hover:text-gray-300'}`}
           >
             {STATS_LABELS_FR.x01.tabs.scoring}
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-900/50 relative flex flex-col custom-scrollbar">
          
          {/* Sticky Column Headers */}
          <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800 grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 px-2 sm:px-3 py-3 shadow-lg">
               <div className="text-left text-gray-600 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest flex items-end pb-1">{STATS_LABELS_FR.x01.columns.metric}</div>
               <div className="text-center text-orange-500 text-[11px] sm:text-xs md:text-sm font-black uppercase tracking-wider truncate px-1 flex items-end justify-center">
                  {firstCompetitor?.label || '-'}
               </div>
               <div className="text-center text-orange-500 text-[11px] sm:text-xs md:text-sm font-black uppercase tracking-wider truncate px-1 flex items-end justify-center">
                  {secondCompetitor?.label || '-'}
               </div>
          </div>

          <div className="p-2 md:p-6 space-y-1">
            {activeTab === 'OVERVIEW' && (
               <>
                  <StatRow label={STATS_LABELS_FR.x01.overview.matchDuration}
                      val1={match.duration ? formatDuration(match.duration) : '-'} 
                      val2="" 
                      singleValue
                  />
                  <StatRow label={STATS_LABELS_FR.x01.overview.threeDartAverage}
                      val1={firstCompetitor?.stats.threeDartAverage || '-'} 
                      val2={secondCompetitor?.stats.threeDartAverage || '-'} 
                      highlight
                  />
                  <StatRow label={STATS_LABELS_FR.x01.overview.until170Average}
                      val1={firstCompetitor?.stats.nonCheckoutAverage || '-'} 
                      val2={secondCompetitor?.stats.nonCheckoutAverage || '-'} 
                  />
                   <StatRow label={STATS_LABELS_FR.x01.overview.checkoutRate}
                      val1={firstCompetitor?.stats.checkoutRate || '-'} 
                      val2={secondCompetitor?.stats.checkoutRate || '-'} 
                      detail1={[
                        firstCompetitor?.stats.checkoutSummary || '0/0 CHECKOUT',
                        ...(firstCompetitor?.stats.checkoutBreakdown || []),
                      ]}
                      detail2={[
                        secondCompetitor?.stats.checkoutSummary || '0/0 CHECKOUT',
                        ...(secondCompetitor?.stats.checkoutBreakdown || []),
                      ]}
                  />
                  <StatRow label={STATS_LABELS_FR.x01.overview.highestCheckout}
                      val1={firstCompetitor?.stats.highestCheckout ?? '-'} 
                      val2={secondCompetitor?.stats.highestCheckout ?? '-'} 
                      isBest={true}
                  />
                  <StatRow label={STATS_LABELS_FR.x01.overview.highestScore}
                      val1={firstCompetitor?.stats.highestScore ?? '-'} 
                      val2={secondCompetitor?.stats.highestScore ?? '-'} 
                  />
                  <StatRow label={isSingleLegMatch ? STATS_LABELS_FR.x01.overview.averageWinningDarts : STATS_LABELS_FR.x01.overview.averageWinningLegDarts}
                      val1={firstCompetitor?.stats.averageWinningLegDarts || '-'} 
                      val2={secondCompetitor?.stats.averageWinningLegDarts || '-'} 
                      isLowBest={true}
                  />
                  <StatRow
                      label={isSingleLegMatch ? STATS_LABELS_FR.x01.overview.winningDarts : STATS_LABELS_FR.x01.overview.bestWorstLeg}
                      val1={isSingleLegMatch
                        ? (firstCompetitor?.stats.bestLegDarts ?? '-')
                        : `${firstCompetitor?.stats.bestLegDarts ?? '-'} / ${firstCompetitor?.stats.worstLegDarts ?? '-'}`}
                      val2={isSingleLegMatch
                        ? (secondCompetitor?.stats.bestLegDarts ?? '-')
                        : `${secondCompetitor?.stats.bestLegDarts ?? '-'} / ${secondCompetitor?.stats.worstLegDarts ?? '-'}`}
                  />
               </>
            )}

            {activeTab === 'SCORING' && (
                <>
                   <StatRow label="180s / 171s" 
                      val1={firstCompetitor?.stats.scoreCounts.c180 ?? '-'} 
                      val2={secondCompetitor?.stats.scoreCounts.c180 ?? '-'} 
                      highlight
                   />
                   <StatRow label="160+ / 152+" 
                      val1={firstCompetitor?.stats.scoreCounts.c160 ?? '-'} 
                      val2={secondCompetitor?.stats.scoreCounts.c160 ?? '-'} 
                   />
                   <StatRow label="140+ / 133+" 
                      val1={firstCompetitor?.stats.scoreCounts.c140 ?? '-'} 
                      val2={secondCompetitor?.stats.scoreCounts.c140 ?? '-'} 
                   />
                   <StatRow label="120+ / 114+" 
                      val1={firstCompetitor?.stats.scoreCounts.c120 ?? '-'} 
                      val2={secondCompetitor?.stats.scoreCounts.c120 ?? '-'} 
                   />
                   <StatRow label="100+ / 95+" 
                      val1={firstCompetitor?.stats.scoreCounts.c100 ?? '-'} 
                      val2={secondCompetitor?.stats.scoreCounts.c100 ?? '-'} 
                   />
                   <StatRow label="80+ / 76+" 
                      val1={firstCompetitor?.stats.scoreCounts.c80 ?? '-'} 
                      val2={secondCompetitor?.stats.scoreCounts.c80 ?? '-'} 
                   />
                   <StatRow label="60+ / 57+" 
                      val1={firstCompetitor?.stats.scoreCounts.c60 ?? '-'} 
                      val2={secondCompetitor?.stats.scoreCounts.c60 ?? '-'} 
                   />
                </>
            )}
          </div>
        </div>

        {onClose && !inline && (
            <div className="p-4 bg-gray-950 border-t border-gray-800 md:hidden shrink-0">
                <Button className="w-full" onClick={onClose}>{STATS_LABELS_FR.x01.actions.close}</Button>
            </div>
        )}
      </div>
    </div>
  );
};

// Helper Subcomponent for Rows
const StatRow = ({ label, val1, val2, highlight = false, isBest = false, isLowBest = false, subtext = "", singleValue = false, detail1 = [], detail2 = [] }: any) => {
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
        <div className={`grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 items-center p-2.5 sm:p-3 rounded-lg border border-gray-800/50 ${highlight ? 'bg-gray-800' : 'bg-gray-800/30'}`}>
             <div className="text-left">
                <div className="text-gray-400 font-bold uppercase text-[10px] md:text-xs tracking-wider leading-snug">{label}</div>
                {subtext && <div className="text-[9px] sm:text-[10px] text-gray-600 leading-snug">{subtext}</div>}
             </div>
             
             {singleValue ? (
                 <div className="col-span-2 text-center font-mono font-black text-sm sm:text-base md:text-lg text-white tracking-widest">
                     {val1}
                 </div>
             ) : (
                 <>
                    <div className={`text-center font-mono font-black text-sm sm:text-base md:text-lg ${win1 ? 'text-orange-500' : 'text-white'}`}>
                        <div>{val1}</div>
                        {detail1.length > 0 && (
                          <div className="mt-1.5 space-y-0.5 font-sans font-medium text-[9px] sm:text-[10px] md:text-xs tracking-normal text-gray-400">
                            {detail1.map((line: string) => (
                              <div key={line}>{line}</div>
                            ))}
                          </div>
                        )}
                    </div>
                    
                    <div className={`text-center font-mono font-black text-sm sm:text-base md:text-lg ${win2 ? 'text-orange-500' : 'text-white'}`}>
                        <div>{val2}</div>
                        {detail2.length > 0 && (
                          <div className="mt-1.5 space-y-0.5 font-sans font-medium text-[9px] sm:text-[10px] md:text-xs tracking-normal text-gray-400">
                            {detail2.map((line: string) => (
                              <div key={line}>{line}</div>
                            ))}
                          </div>
                        )}
                    </div>
                 </>
             )}
        </div>
    );
}
