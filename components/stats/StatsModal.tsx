
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
  /** Titre visible ; masqué (mais lu par les lecteurs d'écran) quand l'écran hôte porte déjà son propre titre. */
  showHeader?: boolean;
}

type StatsTab = 'OVERVIEW' | 'SCORING';

type PickCells = (
  select: (stats: PresentedDetailedStats) => StatValue | null | undefined,
  detail?: (stats: PresentedDetailedStats) => string[],
) => StatCell[];

// Spec 052 : au-delà de 2 camps, chaque colonne garde une largeur lisible et le tableau défile horizontalement.
const getGridStyle = (columnCount: number, isWide: boolean): React.CSSProperties => ({
  gridTemplateColumns: isWide
    ? `minmax(7rem,1.2fr) repeat(${columnCount}, minmax(6.5rem,1fr))`
    : `minmax(0,1.2fr) repeat(${columnCount}, minmax(0,1fr))`,
});

const LAYOUT_CLASSES = {
  inline: {
    container: 'w-full h-full flex flex-col overflow-hidden',
    wrapper: 'st-panel w-full h-full flex flex-col',
    header: 'rounded-t-2xl',
  },
  modal: {
    container: 'stats-modal app-modal tablet-modal fixed inset-0 z-50 bg-overlay backdrop-blur-md flex flex-col items-center justify-center p-4',
    wrapper: 'st-panel bg-surface rounded-2xl w-full max-w-4xl border border-border-strong shadow-elevated flex flex-col max-h-[90vh] overflow-hidden',
    header: '',
  },
};

const MODAL_ATTRIBUTES = { role: 'dialog', 'aria-modal': 'true', 'data-modal-size': 'wide' } as const;

interface StatsTabButtonProps {
  tab: StatsTab;
  activeTab: StatsTab;
  onSelect: (tab: StatsTab) => void;
  children: React.ReactNode;
}

const StatsTabButton = ({ tab, activeTab, onSelect, children }: StatsTabButtonProps) => (
  <button
    type="button"
    onClick={() => onSelect(tab)}
    className={`st-tab flex-1 px-3 py-3 text-xs sm:text-sm font-black uppercase tracking-[0.22em] transition-colors ${activeTab === tab ? 'bg-surface-raised text-brand-fg border-b-2 border-brand' : 'text-fg-faint hover:text-fg-muted'}`}
  >
    {children}
  </button>
);

interface StatsColumnHeadersProps {
  competitorColumns: CompetitorColumn[];
  gridStyle: React.CSSProperties;
}

/** En-têtes de colonnes collants : vrai tableau (th scope="col") mis en page en grille. */
const StatsColumnHeaders = ({ competitorColumns, gridStyle }: StatsColumnHeadersProps) => (
  <thead className="sticky top-0 z-10 block">
    <tr className="st-head st-head--sticky bg-surface border-b border-border grid gap-2 px-2 sm:px-3 py-3 shadow-raised" style={gridStyle}>
      <th scope="col" className="st-head-metric text-left text-fg-disabled text-[9px] sm:text-[10px] font-bold uppercase tracking-widest flex items-end pb-1">{STATS_LABELS_FR.x01.columns.metric}</th>
      {(competitorColumns.length > 0 ? competitorColumns : [null]).map((competitor, index) => (
        <th
          key={competitor?.id ?? `empty-${index}`}
          scope="col"
          title={competitor?.label}
          data-competitor-id={competitor?.id}
          className="st-head-name text-center text-brand-fg text-[11px] sm:text-xs md:text-sm font-black uppercase tracking-wider px-1 flex items-end justify-center"
        >
          <FitText className="flex-1">{competitor?.label || '-'}</FitText>
        </th>
      ))}
    </tr>
  </thead>
);

interface OverviewRowsProps {
  match: MatchState;
  pick: PickCells;
  gridStyle: React.CSSProperties;
  columnCount: number;
}

const OverviewRows = ({ match, pick, gridStyle, columnCount }: OverviewRowsProps) => {
  const isSingleLegMatch = match.config.matchMode === 'LEGS' && match.config.legsToWin === 1;
  const labels = STATS_LABELS_FR.x01.overview;
  return (
    <>
      <StatRow label={labels.matchDuration}
          values={[{ id: 'match', value: match.duration ? formatDuration(match.duration) : '-' }]}
          gridStyle={gridStyle}
          columnCount={columnCount}
          singleValue
      />
      <StatRow label={labels.threeDartAverage}
          values={pick((stats) => stats.threeDartAverage || '-')}
          gridStyle={gridStyle}
          columnCount={columnCount}
          highlight
      />
      <StatRow label={labels.until170Average}
          values={pick((stats) => stats.nonCheckoutAverage || '-')}
          gridStyle={gridStyle}
          columnCount={columnCount}
      />
      <StatRow label={labels.checkoutRate}
          values={pick((stats) => stats.checkoutRate || '-', (stats) => [
            stats.checkoutSummary || '0/0 CHECKOUT',
            ...stats.checkoutBreakdown,
          ])}
          gridStyle={gridStyle}
          columnCount={columnCount}
      />
      <StatRow label={labels.highestCheckout}
          values={pick((stats) => stats.highestCheckout)}
          gridStyle={gridStyle}
          columnCount={columnCount}
      />
      <StatRow label={labels.highestScore}
          values={pick((stats) => stats.highestScore)}
          gridStyle={gridStyle}
          columnCount={columnCount}
      />
      <StatRow label={isSingleLegMatch ? labels.averageWinningDarts : labels.averageWinningLegDarts}
          values={pick((stats) => stats.averageWinningLegDarts || '-')}
          gridStyle={gridStyle}
          columnCount={columnCount}
          isLowBest={true}
      />
      <StatRow
          label={isSingleLegMatch ? labels.winningDarts : labels.bestWorstLeg}
          values={pick((stats) => (isSingleLegMatch
            ? stats.bestLegDarts
            : `${stats.bestLegDarts ?? '-'} / ${stats.worstLegDarts ?? '-'}`))}
          gridStyle={gridStyle}
          columnCount={columnCount}
      />
    </>
  );
};

export const StatsModal: React.FC<StatsModalProps> = ({ match, onClose, title = STATS_LABELS_FR.x01.title, inline = false, showHeader = true }) => {
  const [activeTab, setActiveTab] = useState<StatsTab>('OVERVIEW');
  const competitorColumns = buildCompetitorColumns(match);
  const columnCount = Math.max(1, competitorColumns.length);
  const isWide = competitorColumns.length > 2;
  const gridStyle = getGridStyle(columnCount, isWide);
  const tableStyle: React.CSSProperties | undefined = isWide ? { minWidth: `${8 + columnCount * 7}rem` } : undefined;
  const pick: PickCells = (select, detail) => competitorColumns.map((competitor) => ({
    id: competitor.id,
    value: select(competitor.stats) ?? '-',
    detail: detail?.(competitor.stats),
  }));
  const layout = inline ? LAYOUT_CLASSES.inline : LAYOUT_CLASSES.modal;
  const canClose = Boolean(onClose) && !inline;

  return (
    <div className={layout.container} {...(inline ? {} : MODAL_ATTRIBUTES)}>
      <div className={layout.wrapper}>
        
        {/* Header */}
        {showHeader ? (
          <div className={`st-header p-4 sm:p-6 border-b border-border flex justify-between items-center gap-3 bg-surface-sunken shrink-0 ${layout.header}`}>
             <h2 className="st-heading text-lg sm:text-xl md:text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-2 uppercase">
               {title}
             </h2>
             {canClose && <Button variant="ghost" size="sm" onClick={onClose} className="st-close text-fg-faint hover:text-fg">✕ {STATS_LABELS_FR.x01.actions.close}</Button>}
          </div>
        ) : (
          <h2 className="sr-only">{title}</h2>
        )}

        {/* Tabs */}
        <div className={`flex border-b border-border bg-surface shrink-0 ${showHeader ? '' : layout.header}`}>
           <StatsTabButton tab="OVERVIEW" activeTab={activeTab} onSelect={setActiveTab}>{STATS_LABELS_FR.x01.tabs.overview}</StatsTabButton>
           <StatsTabButton tab="SCORING" activeTab={activeTab} onSelect={setActiveTab}>{STATS_LABELS_FR.x01.tabs.scoring}</StatsTabButton>
        </div>

        {/* Content */}
        <div
          data-testid="x01-stats-scroll"
          className={`flex-1 bg-surface-inset relative flex flex-col custom-scrollbar ${isWide ? 'overflow-auto' : 'overflow-y-auto'}`}
        >
          <table className="flex flex-col" style={tableStyle} data-columns={competitorColumns.length}>
          <StatsColumnHeaders competitorColumns={competitorColumns} gridStyle={gridStyle} />

          <tbody className="st-rows block p-2 md:p-6 space-y-1">
            {activeTab === 'OVERVIEW' && (
              <OverviewRows match={match} pick={pick} gridStyle={gridStyle} columnCount={columnCount} />
            )}

            {activeTab === 'SCORING' && SCORE_COUNT_ROWS.map(({ label, key }, index) => (
                   <StatRow key={key} label={label}
                      values={pick((stats) => stats.scoreCounts[key])}
                      gridStyle={gridStyle}
                      columnCount={columnCount}
                      highlight={index === 0}
                   />
            ))}
          </tbody>
          </table>
        </div>

        {canClose && (
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
        <tr className={`st-row grid gap-2 items-center p-2.5 sm:p-3 rounded-lg border border-border/50 ${highlight ? 'bg-surface-raised' : 'bg-surface-inset'}`} style={gridStyle}>
             <th scope="row" className="text-left [font-weight:inherit]">
                <div className="st-label text-fg-subtle font-bold uppercase text-[10px] md:text-xs tracking-wider leading-snug">{label}</div>
                {subtext && <div className="text-[9px] sm:text-[10px] text-fg-disabled leading-snug">{subtext}</div>}
             </th>
             
             {singleValue ? (
                 <td
                   colSpan={columnCount}
                   className="st-value text-center font-mono font-black text-sm sm:text-base md:text-lg text-fg tracking-widest"
                   style={{ gridColumn: `span ${columnCount} / span ${columnCount}` }}
                 >
                     {values[0]?.value}
                 </td>
             ) : cells.map(({ id, value, detail = [] }) => {
                 const isBest = bestIds.has(id);
                 return (
                    <td key={id} data-competitor-id={id} data-state={isBest ? 'best' : undefined} className={`st-value text-center font-mono font-black text-sm sm:text-base md:text-lg ${isBest ? 'text-brand-fg' : 'text-fg'}`}>
                        <div>{value}</div>
                        {detail.length > 0 && (
                          <div className="st-detail mt-1.5 space-y-0.5 font-sans font-medium text-[9px] sm:text-[10px] md:text-xs tracking-normal text-fg-subtle">
                            {detail.map((line: string) => (
                              <div key={line}>{line}</div>
                            ))}
                          </div>
                        )}
                    </td>
                 );
             })}
        </tr>
    );
};
