import React, { useState } from 'react';
import { CapitalPlayerState } from '../types';
import { CAPITAL_TARGET_NAMES } from '../utils/capitalLogic';
import { Button } from '../components/ui/Button';
import { STATS_LABELS_FR } from '../src/presentation/stats/statsLabels.fr';

interface CapitalStatsViewProps {
  results: CapitalPlayerState[];
  onHome: () => void;
  onRematch: () => void;
}

export const CapitalStatsView: React.FC<CapitalStatsViewProps> = ({ results, onHome, onRematch }) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(results[0]?.id ?? '');
  const selectedPlayer = results.find((p) => p.id === selectedPlayerId) ?? results[0];

  if (!selectedPlayer) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-6 bg-gradient-to-br from-gray-900 to-black p-6 text-center text-white">
        <div>
          <h2 className="text-2xl font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500 sm:text-3xl">
            {STATS_LABELS_FR.capital.title}
          </h2>
          <p className="mt-4 text-sm font-medium text-gray-400 sm:text-base">
            {STATS_LABELS_FR.capital.emptyState}
          </p>
        </div>
        <Button variant="secondary" onClick={onHome} data-testid="capital-stats-home-empty" className="h-14 w-full max-w-xs text-lg">
          {STATS_LABELS_FR.capital.backToMenu}
        </Button>
      </div>
    );
  }

  const rankedResults = [...results].sort((a, b) => b.score - a.score);
  const playerRank = rankedResults.findIndex((player) => player.id === selectedPlayer.id) + 1;
  const successfulRounds = selectedPlayer.history.filter((entry) => entry.isSuccess);
  const failedRounds = selectedPlayer.history.filter((entry) => !entry.isSuccess);
  const completionRate = selectedPlayer.history.length > 0 ? Math.round((successfulRounds.length / selectedPlayer.history.length) * 100) : 0;
  const totalPointsWon = successfulRounds.reduce((sum, entry) => sum + entry.pointsScored, 0);
  const highestRound = successfulRounds.reduce((max, entry) => Math.max(max, entry.pointsScored), 0);
  const averageSuccess = successfulRounds.length > 0 ? (totalPointsWon / successfulRounds.length).toFixed(1) : '0.0';
  const totalDartsThrown = selectedPlayer.history.reduce((sum, entry) => sum + entry.darts.length, 0);
  const targetBreakdown = selectedPlayer.history.map((entry, index) => ({
    id: `${entry.target}-${index}`,
    target: CAPITAL_TARGET_NAMES[entry.target],
    isSuccess: entry.isSuccess,
    pointsScored: entry.pointsScored,
    darts: entry.darts,
  }));

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-gradient-to-br from-gray-900 to-black p-3 text-white sm:p-4">
      <h2 className="mb-5 text-center text-2xl font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500 sm:mb-6 sm:text-3xl">
        {STATS_LABELS_FR.capital.title}
      </h2>

      {/* Player Tabs */}
      <div className="no-scrollbar mb-4 flex shrink-0 gap-2 overflow-x-auto pb-2">
        {results.map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedPlayerId(p.id)}
            className={`
              whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-all
              ${selectedPlayerId === p.id 
                ? 'bg-orange-600 text-white shadow-[0_0_10px_rgba(234,88,12,0.5)]' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}
            `}
          >
            {p.name} ({p.score})
          </button>
        ))}
      </div>

      {/* Stats Content */}
      <div className="mb-4 flex-1 overflow-y-auto rounded-xl border border-gray-800 bg-gray-900/50 p-3 sm:p-4">
        <div className="mb-6 flex items-center justify-between gap-3 border-b border-gray-800 pb-4">
          <div>
            <div className="text-gray-400 font-bold uppercase">{STATS_LABELS_FR.capital.finalScore}</div>
            <div className="mt-2 text-xs font-black uppercase tracking-[0.22em] text-gray-500">{STATS_LABELS_FR.capital.rankingPrefix}{playerRank}</div>
          </div>
          <div className="text-3xl font-black text-orange-500 sm:text-4xl">{selectedPlayer.score}</div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label={STATS_LABELS_FR.capital.successfulChallenges} value={`${successfulRounds.length}/${selectedPlayer.history.length}`} accent="text-white" />
          <StatCard label={STATS_LABELS_FR.capital.successRate} value={`${completionRate}%`} accent="text-orange-400" />
          <StatCard label={STATS_LABELS_FR.capital.pointsWon} value={String(totalPointsWon)} accent="text-green-400" />
          <StatCard label={STATS_LABELS_FR.capital.penalties} value={String(failedRounds.length)} accent="text-red-400" />
          <StatCard label={STATS_LABELS_FR.capital.bestRound} value={String(highestRound)} accent="text-cyan-300" />
          <StatCard label={STATS_LABELS_FR.capital.winningAverage} value={averageSuccess} accent="text-amber-300" />
          <StatCard label={STATS_LABELS_FR.capital.dartsThrown} value={String(totalDartsThrown)} accent="text-gray-100" />
        </div>

        <h3 className="text-lg font-bold text-gray-300 mb-4 uppercase tracking-wider">{STATS_LABELS_FR.capital.challengeDetails}</h3>
        <div className="flex flex-col gap-2">
          {targetBreakdown.map((entry) => (
            <div key={entry.id} className={`p-3 rounded-lg border ${entry.isSuccess ? 'bg-green-900/20 border-green-900/50' : 'bg-red-900/20 border-red-900/50'}`}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="font-bold text-white">{entry.target}</span>
                <span className={`font-black ${entry.isSuccess ? 'text-green-400' : 'text-red-400'}`}>
                  {entry.isSuccess ? `+${entry.pointsScored}` : STATS_LABELS_FR.capital.dividedByTwo}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {entry.darts.map((d, i) => (
                  <span key={i} className="text-xs font-mono bg-gray-800 px-2 py-1 rounded text-gray-300">
                    {d.value === 0 ? STATS_LABELS_FR.capital.missedThrow : d.value === 25 ? (d.multiplier === 2 ? 'DB' : 'B') : `${d.multiplier === 1 ? 'S' : d.multiplier === 2 ? 'D' : 'T'}${d.value}`}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <Button variant="secondary" onClick={onHome} data-testid="capital-stats-home" className="h-14 text-lg">{STATS_LABELS_FR.capital.mainMenu}</Button>
        <Button onClick={onRematch} data-testid="capital-stats-rematch" className="h-14 text-lg bg-gradient-to-r from-orange-600 to-red-600 border-none shadow-lg shadow-orange-900/50 hover:from-orange-500 hover:to-red-500">
          {STATS_LABELS_FR.capital.replay}
        </Button>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, accent }: { label: string; value: string; accent: string }) => (
  <div className="rounded-xl border border-gray-800 bg-gray-950/70 p-3">
    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">{label}</div>
    <div className={`mt-2 text-2xl font-black ${accent}`}>{value}</div>
  </div>
);
