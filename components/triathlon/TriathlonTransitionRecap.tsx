import React from 'react';
import type { TriathlonScorecard } from '../../utils/triathlonScoring';

interface TriathlonTransitionRecapProps {
  eventKey: 'capital' | 'cricket';
  eventLabel: string;
  scorecards: TriathlonScorecard[];
}

export const TriathlonTransitionRecap: React.FC<TriathlonTransitionRecapProps> = ({ eventKey, eventLabel, scorecards }) => (
  <div className="w-full max-w-4xl rounded-2xl border border-border bg-surface p-5 shadow-2xl sm:p-8">
    <div className="mb-5 flex items-center justify-between gap-4">
      <div>
        <div className="text-[10px] font-black uppercase tracking-[0.24em] text-fg-faint">Récapitulatif de l’épreuve</div>
        <h2 className="mt-2 text-2xl font-black uppercase text-fg sm:text-3xl">{eventLabel}</h2>
      </div>
      <div className="text-right text-[10px] font-black uppercase tracking-[0.24em] text-fg-faint">
        Résultat + Bonus
      </div>
    </div>

    <div className="space-y-3">
      {scorecards.map((card) => {
        const event = card[eventKey];
        return (
          <div key={`${eventKey}-${card.competitorId}`} className="rounded-2xl border border-border-subtle bg-surface-tint p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-lg font-black uppercase text-fg">{card.competitorName}</div>
                <div className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-fg-faint">
                  {event.basePoints} points de résultat + {event.bonusPoints} points bonus
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-brand-fg">{event.totalPoints} pts</div>
                <div className="mt-1 text-xs text-fg-subtle">Total triathlon : {card.totalScore}/100</div>
              </div>
            </div>
            {event.bonuses.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {event.bonuses.map((bonus, index) => (
                  <div key={`${eventKey}-${card.competitorId}-${index}`} className="rounded-full border border-brand-border bg-brand-subtle px-3 py-1 text-xs text-brand-fg-faint">
                    <span className="font-black uppercase">{bonus.label}</span> +{bonus.points}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 text-xs text-fg-faint">Aucun bonus sur cette épreuve.</div>
            )}
          </div>
        );
      })}
    </div>
  </div>
);
