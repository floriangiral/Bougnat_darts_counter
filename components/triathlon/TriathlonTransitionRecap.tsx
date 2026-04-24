import React from 'react';
import type { TriathlonScorecard } from '../../utils/triathlonScoring';

interface TriathlonTransitionRecapProps {
  eventKey: 'capital' | 'cricket';
  eventLabel: string;
  scorecards: TriathlonScorecard[];
}

export const TriathlonTransitionRecap: React.FC<TriathlonTransitionRecapProps> = ({ eventKey, eventLabel, scorecards }) => (
  <div className="w-full max-w-4xl rounded-2xl border border-gray-800 bg-gray-900 p-5 shadow-2xl sm:p-8">
    <div className="mb-5 flex items-center justify-between gap-4">
      <div>
        <div className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Recap De L Epreuve</div>
        <h2 className="mt-2 text-2xl font-black uppercase text-white sm:text-3xl">{eventLabel}</h2>
      </div>
      <div className="text-right text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">
        Resultat + Bonus
      </div>
    </div>

    <div className="space-y-3">
      {scorecards.map((card) => {
        const event = card[eventKey];
        return (
          <div key={`${eventKey}-${card.competitorId}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-lg font-black uppercase text-white">{card.competitorName}</div>
                <div className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">
                  {event.basePoints} points de resultat + {event.bonusPoints} points bonus
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-orange-500">{event.totalPoints} pts</div>
                <div className="mt-1 text-xs text-gray-400">Total triathlon : {card.totalScore}/100</div>
              </div>
            </div>
            {event.bonuses.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {event.bonuses.map((bonus, index) => (
                  <div key={`${eventKey}-${card.competitorId}-${index}`} className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs text-orange-100">
                    <span className="font-black uppercase">{bonus.label}</span> +{bonus.points}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 text-xs text-gray-500">Aucun bonus sur cette epreuve.</div>
            )}
          </div>
        );
      })}
    </div>
  </div>
);
