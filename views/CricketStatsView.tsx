
import React from 'react';
import { Button } from '../components/ui/Button';
import { STATS_LABELS_FR } from '../src/presentation/stats/statsLabels.fr';
import { CricketMatchSummary } from '../types';
import { rankCricketCompetitors } from '../utils/cricketLogic';

interface CricketStatsViewProps {
  results: CricketMatchSummary;
  onHome: () => void;
  onRematch: () => void;
}

export const CricketStatsView: React.FC<CricketStatsViewProps> = ({ results, onHome, onRematch }) => {
  const ranking = rankCricketCompetitors(results.competitors, results.winnerId);
  const winner = ranking.find((entry) => entry.competitor.id === results.winnerId)?.competitor;
  const tiedLeaders = ranking.filter((entry) => entry.rank === 1).map((entry) => entry.competitor.name);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-gradient-to-br from-surface to-canvas text-fg">
      
      {/* HEADER */}
      <div className="shrink-0 px-4 pt-6 pb-5 text-center sm:pt-8 sm:pb-6">
         <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-brand via-brand-2 to-brand drop-shadow-[0_5px_15px_rgba(234,88,12,0.4)] sm:text-4xl md:text-6xl">
            {STATS_LABELS_FR.cricket.finished}
         </h1>
         <h2 className="text-lg md:text-xl text-fg-subtle font-bold uppercase tracking-widest mt-2 px-4">
            {winner ? (
              <>{STATS_LABELS_FR.cricket.winnerPrefix} <span className="text-fg">{winner.name}</span></>
            ) : (
              <>{STATS_LABELS_FR.cricket.draw} : <span className="text-fg">{tiedLeaders.join(' et ')}</span></>
            )}
         </h2>
      </div>

      {/* STATS CONTENT */}
      <div className="mb-4 flex-1 w-full max-w-4xl mx-auto overflow-y-auto px-3 custom-scrollbar sm:px-4">
         <div className="space-y-5 rounded-2xl border border-border bg-surface-inset p-4 shadow-2xl sm:p-6 sm:space-y-6">
             
             {ranking.map(({ competitor: p, rank }) => {
                 // Explicitly cast to number[] because Object.values might be inferred as unknown[] depending on TS config
                 const totalMarks = (Object.values(p.marks)).reduce((a, b) => a + b, 0);
                 const mpr = p.dartsThrown > 0 ? (totalMarks / (p.dartsThrown / 3)).toFixed(2) : "0.00";
                 
                 return (
                    <div key={p.id} className="border-b border-border pb-4 last:border-0">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${rank === 1 ? 'bg-yellow-500 text-fg-inverse' : 'bg-surface-strong text-fg-subtle'}`}>
                                    {rank}
                                </div>
                                <span className="truncate text-base font-bold text-fg sm:text-lg">{p.name}</span>
                            </div>
                            <div className="text-2xl font-black text-brand-fg sm:text-3xl">
                                {p.score} <span className="text-xs text-fg-faint font-normal align-middle">PTS</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                            <StatBox label={STATS_LABELS_FR.cricket.metricLabels.mpr} value={mpr} />
                            <StatBox label={STATS_LABELS_FR.cricket.metricLabels.totalMarks} value={totalMarks} />
                            <StatBox label={STATS_LABELS_FR.cricket.metricLabels.dartsThrown} value={p.dartsThrown} />
                            <StatBox label={STATS_LABELS_FR.cricket.metricLabels.pointAccuracy} value={`${p.dartsThrown > 0 ? ((p.history.filter(h => !h.isMiss && h.pointsScored > 0).length / p.dartsThrown) * 100).toFixed(0) : 0}%`} />
                        </div>
                    </div>
                 );
             })}

         </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="grid shrink-0 w-full max-w-lg mx-auto grid-cols-1 gap-3 px-4 pb-6 sm:grid-cols-2 sm:gap-4 sm:px-6 sm:pb-8">
        <Button
            onClick={onRematch}
            variant="secondary"
            size="lg"
            data-testid="cricket-stats-rematch"
            className="w-full border-brand text-brand-fg hover:bg-brand-muted"
        >
            {STATS_LABELS_FR.cricket.rematch}
        </Button>
        <Button onClick={onHome} variant="primary" size="lg" data-testid="cricket-stats-home" className="w-full shadow-orange-900/40">
            {STATS_LABELS_FR.cricket.exit}
        </Button>
      </div>
    </div>
  );
};

const StatBox = ({ label, value }: { label: string, value: string | number }) => (
    <div className="bg-surface-inset p-3 rounded-lg text-center border border-border-strong/50">
        <div className="text-[10px] text-fg-faint font-bold uppercase tracking-wider mb-1 truncate">{label}</div>
        <div className="font-mono font-bold text-fg text-lg">{value}</div>
    </div>
);
