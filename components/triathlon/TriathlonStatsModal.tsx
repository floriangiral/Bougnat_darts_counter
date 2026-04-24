import React from 'react';
import type { TriathlonScorecard } from '../../utils/triathlonScoring';

const SCORE_SECTIONS = [
  { key: 'capital' as const, label: 'Capital' },
  { key: 'cricket' as const, label: 'Cricket' },
  { key: 'x01' as const, label: '501' },
];

interface TriathlonStatsModalProps {
  scorecards: TriathlonScorecard[];
  tieBreakWinnerId?: string | null;
  onClose: () => void;
}

export const TriathlonStatsModal: React.FC<TriathlonStatsModalProps> = ({ scorecards, tieBreakWinnerId, onClose }) => (
  <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
    <div className="flex h-[min(90vh,760px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl">
      <div className="flex items-center justify-between border-b border-gray-800 bg-gray-950 px-4 py-4 sm:px-6">
        <h3 className="text-lg font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 sm:text-2xl">
          Statistiques Triathlon
        </h3>
        <button onClick={onClose} className="rounded border border-gray-700 bg-gray-800 px-3 py-2 text-[11px] font-bold uppercase text-white sm:text-xs">
          Fermer
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mb-4 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4 text-sm text-orange-100">
          Score total sur 100 : points de resultat + bonus de performance sur Capital, Cricket et 501.
          {tieBreakWinnerId ? ' Egalite finale departagee par un 501 supplementaire.' : ''}
        </div>
        <div className="space-y-4">
          {scorecards.map((card) => (
            <div key={card.competitorId} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div className="truncate text-lg font-black uppercase text-white">
                  {card.competitorName}
                  {tieBreakWinnerId === card.competitorId ? ' • Tie-Break' : ''}
                </div>
                <div className="text-2xl font-black text-orange-500">{card.totalScore}/100</div>
              </div>
              <div className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                Base {card.totalBasePoints} | Bonus {card.totalBonusPoints}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {SCORE_SECTIONS.map((section) => {
                  const event = card[section.key];
                  return (
                    <div key={section.key} className="rounded-xl border border-white/8 bg-black/20 p-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">{section.label}</div>
                      <div className="mt-2 text-lg font-black text-white">{event.totalPoints} pts</div>
                      <div className="mt-1 text-xs text-gray-400">Resultat {event.basePoints} + Bonus {event.bonusPoints}</div>
                      <div className="mt-2 text-xs leading-relaxed text-gray-500">{event.summary}</div>
                      {event.bonuses.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {event.bonuses.map((bonus, index) => (
                            <div key={`${section.key}-${index}`} className="rounded-lg border border-orange-500/15 bg-orange-500/10 px-3 py-2 text-xs text-orange-100">
                              <span className="font-black uppercase">{bonus.label}</span> : +{bonus.points} ({bonus.detail})
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
