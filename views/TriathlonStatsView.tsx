import React from 'react';
import { Player, TriathlonResults } from '../types';
import { Button } from '../components/ui/Button';
import { STATS_LABELS_FR } from '../src/presentation/stats/statsLabels.fr';
import { sortTriathlonScorecards, TriathlonScorecard } from '../utils/triathlonScoring';
import { resolveTriathlonScoringVersion, TRIATHLON_SCORING_VERSION } from '../src/features/triathlon/triathlonScoringVersion';

interface TriathlonStatsViewProps {
  players: Player[];
  globalScores: Record<string, number>;
  results: TriathlonResults;
  onHome: () => void;
  onRematch: () => void;
}

const EMPTY_SCORECARD = (player: Player): TriathlonScorecard => ({
  competitorId: player.id,
  competitorName: player.name,
  capital: { key: 'capital', label: 'Capital', basePoints: 0, bonusPoints: 0, totalPoints: 0, summary: '', bonuses: [] },
  cricket: { key: 'cricket', label: 'Cricket', basePoints: 0, bonusPoints: 0, totalPoints: 0, summary: '', bonuses: [] },
  x01: { key: 'x01', label: '501', basePoints: 0, bonusPoints: 0, totalPoints: 0, summary: '', bonuses: [] },
  totalBasePoints: 0,
  totalBonusPoints: 0,
  totalScore: 0,
});

export const TriathlonStatsView: React.FC<TriathlonStatsViewProps> = ({ players, globalScores, results, onHome, onRematch }) => {
  const scorecards: TriathlonScorecard[] =
    results?.scorecards && results.scorecards.length > 0
      ? results.scorecards
      : players.map((player) => ({
          ...EMPTY_SCORECARD(player),
          totalScore: globalScores[player.id] || 0,
        }));

  const sortedScorecards = sortTriathlonScorecards(scorecards, results?.tieBreakWinnerId);
  const winner = sortedScorecards[0];
  const scoringVersion = resolveTriathlonScoringVersion(results?.scoringVersion);

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-surface-sunken via-canvas to-surface p-4 text-fg sm:p-6">
      <h1 className="mt-6 mb-2 text-center text-3xl font-black italic uppercase tracking-[0.12em] text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 sm:mt-8 sm:text-4xl sm:tracking-widest">
        {STATS_LABELS_FR.triathlon.finished}
      </h1>
      <p className="mb-2 text-center text-fg-subtle">
        {STATS_LABELS_FR.triathlon.finalScoreDescription}
      </p>
      <p data-testid="triathlon-scoring-version" className="mb-6 text-center text-xs font-black uppercase tracking-[0.2em] text-fg-faint sm:mb-8">
        {STATS_LABELS_FR.triathlon.scoringVersion(scoringVersion)}
        {scoringVersion !== TRIATHLON_SCORING_VERSION && (
          <span className="mt-1 block font-normal normal-case tracking-normal">{STATS_LABELS_FR.triathlon.legacyScoringNotice}</span>
        )}
      </p>
      {results?.tieBreakWinnerId && (
        <div className="mb-8 w-full max-w-4xl rounded-2xl border border-brand-border bg-brand-subtle p-4 text-center text-sm text-brand-fg-faint">
          {STATS_LABELS_FR.triathlon.finalTieBreakInfo}
        </div>
      )}

      <div className="mb-10 flex w-full max-w-4xl flex-col gap-4">
        {sortedScorecards.map((card, index) => (
          <div key={card.competitorId} className={`rounded-2xl border p-4 sm:p-5 ${index === 0 ? 'border-warning-border bg-warning-subtle' : 'border-border-subtle bg-surface-tint'}`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className={`text-xl font-black uppercase sm:text-2xl ${index === 0 ? 'text-warning-fg' : 'text-fg'}`}>
                  {card.competitorName}
                  {index === 0 ? ' 👑' : ''}
                </div>
                <div className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-fg-faint">
                  Base {card.totalBasePoints} | Bonus {card.totalBonusPoints}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold uppercase tracking-[0.2em] text-fg-faint">Score Final</div>
                <div className="text-3xl font-black text-brand-fg sm:text-4xl">{card.totalScore}/100</div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[card.capital, card.cricket, card.x01].map((event) => (
                <div key={event.key} className="rounded-xl border border-border-subtle bg-surface-inset p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-fg-faint">{event.label}</div>
                  <div className="mt-2 text-2xl font-black text-fg">{event.totalPoints} pts</div>
                  <div className="mt-1 text-sm text-fg-subtle">Résultat {event.basePoints} + Bonus {event.bonusPoints}</div>
                  <div className="mt-3 text-xs leading-relaxed text-fg-faint">{event.summary}</div>
                  {event.bonuses.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {event.bonuses.map((bonus, bonusIndex) => (
                        <div key={`${event.key}-${bonusIndex}`} className="rounded-lg border border-brand-border bg-brand-subtle px-3 py-2 text-xs text-brand-fg-faint">
                          <span className="font-black uppercase">{bonus.label}</span> : +{bonus.points} ({bonus.detail})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-10 w-full max-w-5xl overflow-x-auto rounded-2xl border border-border bg-surface-glass">
        <table className="w-full min-w-[920px] text-left">
          <thead className="bg-surface-inset text-[10px] uppercase tracking-[0.22em] text-fg-subtle">
            <tr>
              <th className="p-4 font-black">{STATS_LABELS_FR.triathlon.competitor}</th>
              <th className="p-4 font-black text-center">Capital</th>
              <th className="p-4 font-black text-center">Cricket</th>
              <th className="p-4 font-black text-center">501</th>
              <th className="p-4 font-black text-center">Base</th>
              <th className="p-4 font-black text-center">Bonus</th>
              <th className="p-4 font-black text-right text-brand-fg-soft">{STATS_LABELS_FR.triathlon.total}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedScorecards.map((card) => (
              <tr key={card.competitorId} className="hover:bg-surface-tint">
                <td className="p-4 font-bold text-fg">
                  {card.competitorName}
                  {winner?.competitorId === card.competitorId ? ' 👑' : ''}
                </td>
                <td className="p-4 text-center text-fg-muted">{card.capital.basePoints} + {card.capital.bonusPoints} = {card.capital.totalPoints}</td>
                <td className="p-4 text-center text-fg-muted">{card.cricket.basePoints} + {card.cricket.bonusPoints} = {card.cricket.totalPoints}</td>
                <td className="p-4 text-center text-fg-muted">{card.x01.basePoints} + {card.x01.bonusPoints} = {card.x01.totalPoints}</td>
                <td className="p-4 text-center font-bold text-fg">{card.totalBasePoints}</td>
                <td className="p-4 text-center font-bold text-brand-fg-faint">+{card.totalBonusPoints}</td>
                <td className="p-4 text-right text-xl font-black text-brand-fg">{card.totalScore}/100</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-auto grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <Button variant="secondary" onClick={onHome} data-testid="triathlon-stats-home" className="flex-1 py-4">{STATS_LABELS_FR.triathlon.mainMenu}</Button>
        <Button onClick={onRematch} data-testid="triathlon-stats-rematch" className="flex-1 border-none bg-gradient-to-r from-brand-strong to-brand-2 py-4">{STATS_LABELS_FR.triathlon.rematch}</Button>
      </div>
    </div>
  );
};
