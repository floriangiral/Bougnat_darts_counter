import React, { useState } from 'react';
import { CapitalDart, CapitalPlayerState } from '../types';
import { CAPITAL_TARGET_NAMES } from '../utils/capitalLogic';
import { Button } from '../components/ui/Button';
import { STATS_LABELS_FR } from '../src/presentation/stats/statsLabels.fr';
import { getCapitalFinalRanking } from '../src/features/capital/capitalGameModel';

interface CapitalStatsViewProps {
  results: CapitalPlayerState[];
  onHome: () => void;
  onRematch: () => void;
}

export const CapitalStatsView: React.FC<Readonly<CapitalStatsViewProps>> = ({ results, onHome, onRematch }) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(results[0]?.id ?? '');
  const selectedPlayer = results.find((p) => p.id === selectedPlayerId) ?? results[0];

  if (!selectedPlayer) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-6 bg-gradient-to-br from-surface to-canvas p-6 text-center text-fg">
        <div>
          <h2 className="text-2xl font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-2 sm:text-3xl">
            {STATS_LABELS_FR.capital.title}
          </h2>
          <p className="mt-4 text-sm font-medium text-fg-subtle sm:text-base">
            {STATS_LABELS_FR.capital.emptyState}
          </p>
        </div>
        <Button variant="secondary" onClick={onHome} data-testid="capital-stats-home-empty" className="h-14 w-full max-w-xs text-lg">
          {STATS_LABELS_FR.capital.backToMenu}
        </Button>
      </div>
    );
  }

  const playerRank = results.length > 2
    ? getCapitalFinalRanking(results).find((entry) => entry.item.id === selectedPlayer.id)?.rank
    : [...results].sort((a, b) => b.score - a.score).findIndex((player) => player.id === selectedPlayer.id) + 1;
  const successfulRounds = selectedPlayer.history.filter((entry) => entry.isSuccess);
  const failedRounds = selectedPlayer.history.filter((entry) => !entry.isSuccess);
  const completionRate = selectedPlayer.history.length > 0 ? Math.round((successfulRounds.length / selectedPlayer.history.length) * 100) : 0;
  const totalPointsWon = successfulRounds.reduce((sum, entry) => sum + entry.pointsScored, 0);
  const highestRound = successfulRounds.reduce((max, entry) => Math.max(max, entry.pointsScored), 0);
  const averageSuccess = successfulRounds.length > 0 ? (totalPointsWon / successfulRounds.length).toFixed(1) : '0.0';
  const totalDartsThrown = selectedPlayer.history.reduce((sum, entry) => sum + entry.darts.length, 0);
  const targetBreakdown = selectedPlayer.history.map((entry) => {
    const dartOccurrences = new Map<string, number>();
    const darts = entry.darts.map((dart) => {
      const dartIdentity = `${dart.value}-${dart.multiplier}`;
      const occurrence = dartOccurrences.get(dartIdentity) ?? 0;
      dartOccurrences.set(dartIdentity, occurrence + 1);
      return { dart, key: getDartKey(entry.target, dartIdentity, occurrence) };
    });

    return {
      id: entry.target,
      target: CAPITAL_TARGET_NAMES[entry.target],
      isSuccess: entry.isSuccess,
      pointsScored: entry.pointsScored,
      darts,
    };
  });

  return (
    <div className="stats-screen stats-capital flex h-[100dvh] flex-col overflow-hidden bg-gradient-to-br from-surface to-canvas p-3 text-fg sm:p-4">
      <h2 className="stats-hero-title mb-5 text-center text-2xl font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-2 sm:mb-6 sm:text-3xl">
        {STATS_LABELS_FR.capital.title}
      </h2>

      {/* Player Tabs */}
      <div className="stats-player-tabs no-scrollbar mb-4 flex shrink-0 gap-2 overflow-x-auto pb-2">
        {results.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelectedPlayerId(p.id)}
            aria-pressed={selectedPlayerId === p.id}
            className={`st-tab bd-touch-target 
              whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-all
              ${selectedPlayerId === p.id 
                ? 'bg-brand-strong text-on-brand shadow-glow-brand' 
                : 'bg-surface-raised text-fg-subtle hover:bg-surface-strong'}
            `}
          >
            {p.name} ({p.score})
          </button>
        ))}
      </div>

      {/* Stats Content */}
      <div className="stats-capital-body mb-4 flex-1 overflow-y-auto rounded-xl border border-border bg-surface-inset p-3 sm:p-4">
        <div className="mb-6 flex items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <div className="st-label text-fg-subtle font-bold uppercase">{STATS_LABELS_FR.capital.finalScore}</div>
            <div className="st-kicker mt-2 text-xs font-black uppercase tracking-[0.22em] text-fg-faint">{STATS_LABELS_FR.capital.rankingPrefix}{playerRank}</div>
          </div>
          <div className="st-score text-3xl font-black text-brand-fg sm:text-4xl">{selectedPlayer.score}</div>
        </div>

        <div className="stats-capital-cards mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label={STATS_LABELS_FR.capital.successfulChallenges} value={`${successfulRounds.length}/${selectedPlayer.history.length}`} accent="text-fg" />
          <StatCard label={STATS_LABELS_FR.capital.successRate} value={`${completionRate}%`} accent="text-brand-fg-soft" />
          <StatCard label={STATS_LABELS_FR.capital.pointsWon} value={String(totalPointsWon)} accent="text-success-fg" />
          <StatCard label={STATS_LABELS_FR.capital.penalties} value={String(failedRounds.length)} accent="text-danger-fg" />
          <StatCard label={STATS_LABELS_FR.capital.bestRound} value={String(highestRound)} accent="text-info-fg" />
          <StatCard label={STATS_LABELS_FR.capital.winningAverage} value={averageSuccess} accent="text-warning-fg" />
          <StatCard label={STATS_LABELS_FR.capital.dartsThrown} value={String(totalDartsThrown)} accent="text-fg-soft" />
        </div>

        <h3 className="st-label text-lg font-bold text-fg-muted mb-4 uppercase tracking-wider">{STATS_LABELS_FR.capital.challengeDetails}</h3>
        <div className="flex flex-col gap-2">
          {targetBreakdown.map((entry) => (
            <div key={entry.id} className={`st-row p-3 rounded-lg border ${entry.isSuccess ? 'bg-success-subtle border-success-border' : 'bg-danger-subtle border-danger-border'}`}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="st-row-title font-bold text-fg">{entry.target}</span>
                <span className={`st-row-title font-black ${entry.isSuccess ? 'text-success-fg' : 'text-danger-fg'}`}>
                  {entry.isSuccess ? `+${entry.pointsScored}` : STATS_LABELS_FR.capital.dividedByTwo}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {entry.darts.map(({ dart, key }) => (
                  <span key={key} className="st-chip text-xs font-mono bg-surface-raised px-2 py-1 rounded text-fg-muted">
                    {getDartLabel(dart)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="stats-actions grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <Button variant="secondary" onClick={onHome} data-testid="capital-stats-home" className="h-14 text-lg">{STATS_LABELS_FR.capital.mainMenu}</Button>
        <Button onClick={onRematch} data-testid="capital-stats-rematch" className="h-14 text-lg">
          {STATS_LABELS_FR.capital.replay}
        </Button>
      </div>
    </div>
  );
};

const getDartLabel = (dart: CapitalDart): string => {
  if (dart.value === 0) return STATS_LABELS_FR.capital.missedThrow;
  if (dart.value === 25) return dart.multiplier === 2 ? 'DB' : 'B';
  if (dart.multiplier === 1) return `S${dart.value}`;
  if (dart.multiplier === 2) return `D${dart.value}`;
  return `T${dart.value}`;
};

const getDartKey = (entryId: string, dartIdentity: string, occurrence: number): string =>
  `${entryId}-${dartIdentity}-${occurrence}`;

const StatCard = ({ label, value, accent }: Readonly<{ label: string; value: string; accent: string }>) => (
  <div className="st-box rounded-xl border border-border bg-surface-inset p-3">
    <div className="st-kicker text-[10px] font-black uppercase tracking-[0.18em] text-fg-faint">{label}</div>
    <div className={`st-value mt-2 text-2xl font-black ${accent}`}>{value}</div>
  </div>
);
