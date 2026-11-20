
import React, { useState } from 'react';
import { MatchState } from '../../types';
import { calculateDetailedStats, calculateDetailedStatsForTeam, type ScoreCountKey } from '../../src/application/scoring/matchStats';
import { formatDuration } from '../../src/application/scoring/matchLifecycle';
import { STATS_LABELS_FR } from '../../src/presentation/stats/statsLabels.fr';
import { presentX01DetailedStats, type PresentedDetailedStats } from '../../src/presentation/stats/statsPresenter.fr';
import { Button } from '../ui/Button';
import { FitText } from '../ui/FitText';

type StatValue = string | number;

interface StatCell {
  id: string;
  value: StatValue;
  detail?: string[];
}

interface CompetitorColumn {
  id: string;
  label: string;
  stats: PresentedDetailedStats;
}

/** Une colonne par camp : chaque joueur en simple (1 à 4), chaque équipe en doublettes. */
const buildCompetitorColumns = (match: MatchState): CompetitorColumn[] => {
  if (match.config.isDoubles) {
    const teamIds = Array.from(new Set<string>(match.players.map((player) => player.teamId)));
    return teamIds.map((teamId) => ({
      id: teamId,
      label: match.players
        .filter((player) => player.teamId === teamId)
        .map((player) => player.name)
        .join(' / '),
      stats: presentX01DetailedStats(calculateDetailedStatsForTeam(match, teamId)),
    }));
  }
  return match.players.map((player) => ({
    id: player.id,
    label: player.name,
    stats: presentX01DetailedStats(calculateDetailedStats(match, player.id)),
  }));
};

interface StatsModalProps {
  match: MatchState;
  onClose?: () => void;
  title?: string;
  inline?: boolean;
}

export const StatsModal: React.FC<StatsModalProps> = ({ match, onClose, title = STATS_LABELS_FR.x01.title, inline = false }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SCORING'>('OVERVIEW');
  const competitorColumns = buildCompetitorColumns(match);
  const columnCount = Math.max(1, competitorColumns.length);
  // Spec 052 : au-delà de 2 camps, chaque colonne garde une largeur lisible et le tableau défile horizontalement.
  const isWide = competitorColumns.length > 2;
  const gridStyle: React.CSSProperties = {
    gridTemplateColumns: isWide
      ? `minmax(7rem,1.2fr) repeat(${columnCount}, minmax(6.5rem,1fr))`
      : `minmax(0,1.2fr) repeat(${columnCount}, minmax(0,1fr))`,
  };
  const tableStyle: React.CSSProperties | undefined = isWide ? { minWidth: `${8 + columnCount * 7}rem` } : undefined;
  const pick = (
    select: (stats: PresentedDetailedStats) => StatValue | null | undefined,
    detail?: (stats: PresentedDetailedStats) => string[],
  ): StatCell[] => competitorColumns.map((competitor) => ({
    id: competitor.id,
    value: select(competitor.stats) ?? '-',
    detail: detail?.(competitor.stats),
  }));

  const containerClasses = inline 
    ? "w-full h-full flex flex-col overflow-hidden" 
    : "stats-modal app-modal tablet-modal fixed inset-0 z-50 bg-overlay backdrop-blur-md flex flex-col items-center justify-center p-4";

  const wrapperClasses = inline
    ? "st-panel w-full h-full flex flex-col"
    : "st-panel bg-surface rounded-2xl w-full max-w-4xl border border-border-strong shadow-elevated flex flex-col max-h-[90vh] overflow-hidden";
  
  const isSingleLegMatch = match.config.matchMode === 'LEGS' && match.config.legsToWin === 1;

  return (
    <div className={containerClasses} role={inline ? undefined : 'dialog'} aria-modal={inline ? undefined : 'true'} data-modal-size={inline ? undefined : 'wide'}>
      <div className={wrapperClasses}>
        
        {/* Header */}
        <div className={`st-header p-4 sm:p-6 border-b border-border flex justify-between items-center gap-3 bg-surface-sunken shrink-0 ${inline ? 'rounded-t-2xl' : ''}`}>
           <h2 className="st-heading text-lg sm:text-xl md:text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-2 uppercase">
             {title}
           </h2>
           {onClose && !inline && <Button variant="ghost" size="sm" onClick={onClose} className="st-close text-fg-faint hover:text-fg">✕ {STATS_LABELS_FR.x01.actions.close}</Button>}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border bg-surface shrink-0">
           <button 
             type="button"
             onClick={() => setActiveTab('OVERVIEW')}
             className={`st-tab flex-1 px-3 py-3 text-xs sm:text-sm font-black uppercase tracking-[0.22em] transition-colors ${activeTab === 'OVERVIEW' ? 'bg-surface-raised text-brand-fg border-b-2 border-brand' : 'text-fg-faint hover:text-fg-muted'}`}
           >
             {STATS_LABELS_FR.x01.tabs.overview}
           </button>
           <button 
             type="button"
             onClick={() => setActiveTab('SCORING')}
             className={`st-tab flex-1 px-3 py-3 text-xs sm:text-sm font-black uppercase tracking-[0.22em] transition-colors ${activeTab === 'SCORING' ? 'bg-surface-raised text-brand-fg border-b-2 border-brand' : 'text-fg-faint hover:text-fg-muted'}`}
           >
             {STATS_LABELS_FR.x01.tabs.scoring}
           </button>
        </div>

        {/* Content */}
        <div
          data-testid="x01-stats-scroll"
          className={`flex-1 bg-surface-inset relative flex flex-col custom-scrollbar ${isWide ? 'overflow-auto' : 'overflow-y-auto'}`}
        >
          <div className="flex flex-col" style={tableStyle} data-columns={competitorColumns.length}>
          {/* Sticky Column Headers */}
          <div className="st-head st-head--sticky sticky top-0 z-10 bg-surface border-b border-border grid gap-2 px-2 sm:px-3 py-3 shadow-raised" style={gridStyle}>
               <div className="st-head-metric text-left text-fg-disabled text-[9px] sm:text-[10px] font-bold uppercase tracking-widest flex items-end pb-1">{STATS_LABELS_FR.x01.columns.metric}</div>
               {(competitorColumns.length > 0 ? competitorColumns : [null]).map((competitor, index) => (
                 <div
                   key={competitor?.id ?? `empty-${index}`}
                   role="columnheader"
                   title={competitor?.label}
                   data-competitor-id={competitor?.id}
                   className="st-head-name text-center text-brand-fg text-[11px] sm:text-xs md:text-sm font-black uppercase tracking-wider px-1 flex items-end justify-center"
                 >
                    <FitText className="flex-1">{competitor?.label || '-'}</FitText>
                 </div>
               ))}
          </div>

          <div className="st-rows p-2 md:p-6 space-y-1">
            {activeTab === 'OVERVIEW' && (
               <>
                  <StatRow label={STATS_LABELS_FR.x01.overview.matchDuration}
                      values={[{ id: 'match', value: match.duration ? formatDuration(match.duration) : '-' }]}
                      gridStyle={gridStyle}
                      columnCount={columnCount}
                      singleValue
                  />
                  <StatRow label={STATS_LABELS_FR.x01.overview.threeDartAverage}
                      values={pick((stats) => stats.threeDartAverage || '-')}
                      gridStyle={gridStyle}
                      columnCount={columnCount}
                      highlight
                  />
                  <StatRow label={STATS_LABELS_FR.x01.overview.until170Average}
                      values={pick((stats) => stats.nonCheckoutAverage || '-')}
                      gridStyle={gridStyle}
                      columnCount={columnCount}
                  />
                   <StatRow label={STATS_LABELS_FR.x01.overview.checkoutRate}
                      values={pick((stats) => stats.checkoutRate || '-', (stats) => [
                        stats.checkoutSummary || '0/0 CHECKOUT',
                        ...stats.checkoutBreakdown,
                      ])}
                      gridStyle={gridStyle}
                      columnCount={columnCount}
                  />
                  <StatRow label={STATS_LABELS_FR.x01.overview.highestCheckout}
                      values={pick((stats) => stats.highestCheckout)}
                      gridStyle={gridStyle}
                      columnCount={columnCount}
                  />
                  <StatRow label={STATS_LABELS_FR.x01.overview.highestScore}
                      values={pick((stats) => stats.highestScore)}
                      gridStyle={gridStyle}
                      columnCount={columnCount}
                  />
                  <StatRow label={isSingleLegMatch ? STATS_LABELS_FR.x01.overview.averageWinningDarts : STATS_LABELS_FR.x01.overview.averageWinningLegDarts}
                      values={pick((stats) => stats.averageWinningLegDarts || '-')}
                      gridStyle={gridStyle}
                      columnCount={columnCount}
                      isLowBest={true}
                  />
                  <StatRow
                      label={isSingleLegMatch ? STATS_LABELS_FR.x01.overview.winningDarts : STATS_LABELS_FR.x01.overview.bestWorstLeg}
                      values={pick((stats) => (isSingleLegMatch
                        ? stats.bestLegDarts
                        : `${stats.bestLegDarts ?? '-'} / ${stats.worstLegDarts ?? '-'}`))}
                      gridStyle={gridStyle}
                      columnCount={columnCount}
                  />
               </>
            )}

            {activeTab === 'SCORING' && SCORE_COUNT_ROWS.map(({ label, key }, index) => (
                   <StatRow key={key} label={label}
                      values={pick((stats) => stats.scoreCounts[key])}
                      gridStyle={gridStyle}
                      columnCount={columnCount}
                      highlight={index === 0}
                   />
            ))}
          </div>
          </div>
        </div>

        {onClose && !inline && (
            <div className="p-4 bg-surface-sunken border-t border-border md:hidden shrink-0">
                <Button className="st-footer-button w-full" onClick={onClose}>{STATS_LABELS_FR.x01.actions.close}</Button>
            </div>
        )}
      </div>
    </div>
  );
};

const SCORE_COUNT_ROWS: Array<{ label: string; key: ScoreCountKey }> = [
  { label: '180s / 171s', key: 'c180' },
  { label: '160+ / 152+', key: 'c160' },
  { label: '140+ / 133+', key: 'c140' },
  { label: '120+ / 114+', key: 'c120' },
  { label: '100+ / 95+', key: 'c100' },
  { label: '80+ / 76+', key: 'c80' },
  { label: '60+ / 57+', key: 'c60' },
];

/** Index des meilleures valeurs numériques ; aucune si une valeur manque ou si toutes sont égales. */
const getBestCellIds = (cells: StatCell[], isLowBest: boolean): Set<string> => {
  const numbers = cells.flatMap((cell) => (typeof cell.value === 'number' ? [cell.value] : []));
  if (numbers.length < 2 || numbers.length !== cells.length) return new Set();
  const best = isLowBest ? Math.min(...numbers) : Math.max(...numbers);
  if (numbers.every((value) => value === best)) return new Set();
  return new Set(cells.filter((cell) => cell.value === best).map((cell) => cell.id));
};

interface StatRowProps {
  label: string;
  values: StatCell[];
  gridStyle: React.CSSProperties;
  columnCount: number;
  highlight?: boolean;
  isLowBest?: boolean;
  subtext?: string;
  singleValue?: boolean;
}

const StatRow = ({ label, values, gridStyle, columnCount, highlight = false, isLowBest = false, subtext = "", singleValue = false }: StatRowProps) => {
    const bestIds = singleValue ? new Set<string>() : getBestCellIds(values, isLowBest);
    const cells = values.length > 0 ? values : [{ id: 'empty', value: '-' }];

    return (
        <div className={`st-row grid gap-2 items-center p-2.5 sm:p-3 rounded-lg border border-border/50 ${highlight ? 'bg-surface-raised' : 'bg-surface-inset'}`} style={gridStyle}>
             <div className="text-left">
                <div className="st-label text-fg-subtle font-bold uppercase text-[10px] md:text-xs tracking-wider leading-snug">{label}</div>
                {subtext && <div className="text-[9px] sm:text-[10px] text-fg-disabled leading-snug">{subtext}</div>}
             </div>
             
             {singleValue ? (
                 <div
                   className="st-value text-center font-mono font-black text-sm sm:text-base md:text-lg text-fg tracking-widest"
                   style={{ gridColumn: `span ${columnCount} / span ${columnCount}` }}
                 >
                     {values[0]?.value}
                 </div>
             ) : cells.map(({ id, value, detail = [] }) => {
                 const isBest = bestIds.has(id);
                 return (
                    <div key={id} data-competitor-id={id} data-state={isBest ? 'best' : undefined} className={`st-value text-center font-mono font-black text-sm sm:text-base md:text-lg ${isBest ? 'text-brand-fg' : 'text-fg'}`}>
                        <div>{value}</div>
                        {detail.length > 0 && (
                          <div className="st-detail mt-1.5 space-y-0.5 font-sans font-medium text-[9px] sm:text-[10px] md:text-xs tracking-normal text-fg-subtle">
                            {detail.map((line: string) => (
                              <div key={line}>{line}</div>
                            ))}
                          </div>
                        )}
                    </div>
                 );
             })}
        </div>
    );
}
