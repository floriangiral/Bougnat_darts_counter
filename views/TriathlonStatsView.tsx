import React from 'react';
import { Player, TriathlonResults } from '../types';
import { Button } from '../components/ui/Button';
import { STATS_LABELS_FR } from '../src/presentation/stats/statsLabels.fr';
import { sortTriathlonScorecards, TriathlonScorecard } from '../utils/triathlonScoring';

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
    results?.scorecards?.length > 0
      ? results.scorecards
      : players.map((player) => ({
          ...EMPTY_SCORECARD(player),
          totalScore: globalScores[player.id] || 0,
        }));

  const sortedScorecards = sortTriathlonScorecards(scorecards, results?.tieBreakWinnerId);
  const winner = sortedScorecards[0];

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-gray-950 via-black to-gray-900 p-4 text-white sm:p-6">
      <h1 className="mt-6 mb-2 text-center text-3xl font-black italic uppercase tracking-[0.12em] text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 sm:mt-8 sm:text-4xl sm:tracking-widest">
        {STATS_LABELS_FR.triathlon.finished}
      </h1>
      <p className="mb-6 text-center text-gray-400 sm:mb-8">
        {STATS_LABELS_FR.triathlon.finalScoreDescription}
      </p>
      {results?.tieBreakWinnerId && (
        <div className="mb-8 w-full max-w-4xl rounded-2xl border border-orange-500/25 bg-orange-500/10 p-4 text-center text-sm text-orange-100">
          {STATS_LABELS_FR.triathlon.finalTieBreakInfo}
        </div>
      )}

      <div className="mb-10 flex w-full max-w-4xl flex-col gap-4">
        {sortedScorecards.map((card, index) => (
          <div key={card.competitorId} className={`rounded-2xl border p-4 sm:p-5 ${index === 0 ? 'border-yellow-500/30 bg-yellow-500/10' : 'border-white/10 bg-white/[0.04]'}`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className={`text-xl font-black uppercase sm:text-2xl ${index === 0 ? 'text-yellow-300' : 'text-white'}`}>
                  {card.competitorName}
                  {index === 0 ? ' 👑' : ''}
                </div>
                <div className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">
                  Base {card.totalBasePoints} | Bonus {card.totalBonusPoints}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold uppercase tracking-[0.2em] text-gray-500">Score Final</div>
                <div className="text-3xl font-black text-orange-500 sm:text-4xl">{card.totalScore}/100</div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[card.capital, card.cricket, card.x01].map((event) => (
                <div key={event.key} className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">{event.label}</div>
                  <div className="mt-2 text-2xl font-black text-white">{event.totalPoints} pts</div>
                  <div className="mt-1 text-sm text-gray-400">Resultat {event.basePoints} + Bonus {event.bonusPoints}</div>
                  <div className="mt-3 text-xs leading-relaxed text-gray-500">{event.summary}</div>
                  {event.bonuses.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {event.bonuses.map((bonus, bonusIndex) => (
                        <div key={`${event.key}-${bonusIndex}`} className="rounded-lg border border-orange-500/15 bg-orange-500/10 px-3 py-2 text-xs text-orange-100">
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

      <div className="mb-10 w-full max-w-5xl overflow-x-auto rounded-2xl border border-gray-800 bg-gray-900/80">
        <table className="w-full min-w-[920px] text-left">
          <thead className="bg-gray-800/60 text-[10px] uppercase tracking-[0.22em] text-gray-400">
            <tr>
              <th className="p-4 font-black">{STATS_LABELS_FR.triathlon.competitor}</th>
              <th className="p-4 font-black text-center">Capital</th>
              <th className="p-4 font-black text-center">Cricket</th>
              <th className="p-4 font-black text-center">501</th>
              <th className="p-4 font-black text-center">Base</th>
              <th className="p-4 font-black text-center">Bonus</th>
              <th className="p-4 font-black text-right text-orange-400">{STATS_LABELS_FR.triathlon.total}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {sortedScorecards.map((card) => (
              <tr key={card.competitorId} className="hover:bg-white/[0.03]">
                <td className="p-4 font-bold text-white">
                  {card.competitorName}
                  {winner?.competitorId === card.competitorId ? ' 👑' : ''}
                </td>
                <td className="p-4 text-center text-gray-300">{card.capital.basePoints} + {card.capital.bonusPoints} = {card.capital.totalPoints}</td>
                <td className="p-4 text-center text-gray-300">{card.cricket.basePoints} + {card.cricket.bonusPoints} = {card.cricket.totalPoints}</td>
                <td className="p-4 text-center text-gray-300">{card.x01.basePoints} + {card.x01.bonusPoints} = {card.x01.totalPoints}</td>
                <td className="p-4 text-center font-bold text-white">{card.totalBasePoints}</td>
                <td className="p-4 text-center font-bold text-orange-300">+{card.totalBonusPoints}</td>
                <td className="p-4 text-right text-xl font-black text-orange-500">{card.totalScore}/100</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-auto grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <Button variant="secondary" onClick={onHome} data-testid="triathlon-stats-home" className="flex-1 py-4">{STATS_LABELS_FR.triathlon.mainMenu}</Button>
        <Button onClick={onRematch} data-testid="triathlon-stats-rematch" className="flex-1 border-none bg-gradient-to-r from-orange-600 to-red-600 py-4">{STATS_LABELS_FR.triathlon.rematch}</Button>
      </div>
    </div>
  );
};
