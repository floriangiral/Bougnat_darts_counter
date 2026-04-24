import React from 'react';
import type { TriathlonScorecard } from '../../utils/triathlonScoring';

const SCORE_SECTIONS = [
  { key: 'capital' as const, label: 'Capital' },
  { key: 'cricket' as const, label: 'Cricket' },
  { key: 'x01' as const, label: '501' },
];

interface TriathlonStandingCardProps {
  scorecards: TriathlonScorecard[];
  tieBreakWinnerId?: string | null;
}

export const TriathlonStandingCard: React.FC<TriathlonStandingCardProps> = ({ scorecards, tieBreakWinnerId }) => (
  <div className="w-full max-w-xl rounded-2xl border border-gray-800 bg-gray-900 p-5 shadow-2xl sm:p-8">
    <h2 className="mb-5 text-center text-lg font-bold uppercase tracking-widest text-gray-400 sm:mb-6 sm:text-xl">
      Classement Triathlon
    </h2>
    <div className="space-y-3 sm:space-y-4">
      {scorecards.map((card) => (
        <div key={card.competitorId} className="rounded-xl bg-gray-800 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-4">
            <span className="truncate text-base font-bold sm:text-lg">{card.competitorName}</span>
            <span className="whitespace-nowrap text-xl font-black text-orange-500 sm:text-2xl">{card.totalScore}/100</span>
          </div>
          <div className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
            Base {card.totalBasePoints} | Bonus {card.totalBonusPoints}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {SCORE_SECTIONS.map((section) => {
              const event = card[section.key];
              return (
                <div key={section.key} className="rounded-xl border border-white/8 bg-black/20 px-3 py-2">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">{section.label}</div>
                  <div className="mt-1 text-sm font-black text-white">{event.totalPoints} pts</div>
                  <div className="text-[10px] text-gray-400">{event.basePoints} + {event.bonusPoints}</div>
                </div>
              );
            })}
          </div>
          {tieBreakWinnerId === card.competitorId && (
            <div className="mt-3 text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">
              Gagnant du 501 tie-break
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);
