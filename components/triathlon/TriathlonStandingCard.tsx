import React from 'react';
import type { TriathlonScorecard } from '../../utils/triathlonScoring';
import { FitText } from '../ui/FitText';

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
  <div className="triathlon-standing w-full max-w-xl rounded-2xl border border-border bg-surface p-5 shadow-elevated sm:p-8">
    <h2 className="mb-5 text-center text-lg font-bold uppercase tracking-widest text-fg-subtle sm:mb-6 sm:text-xl">
      Classement Triathlon
    </h2>
    <div className="space-y-3 sm:space-y-4">
      {scorecards.map((card, index) => (
        <div key={card.competitorId} data-rank={index + 1} className="rounded-xl border border-border-subtle bg-surface-raised p-3 sm:p-4">
          <div className="flex items-center justify-between gap-4">
            <FitText className="triathlon-standing-name flex-1 text-base font-bold text-fg sm:text-lg">{card.competitorName}</FitText>
            <span className="triathlon-standing-total whitespace-nowrap text-xl font-black text-brand-fg sm:text-2xl">{card.totalScore}/100</span>
          </div>
          <div className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-fg-faint">
            Base {card.totalBasePoints} | Bonus {card.totalBonusPoints}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {SCORE_SECTIONS.map((section) => {
              const event = card[section.key];
              return (
                <div key={section.key} className="rounded-xl border border-border-subtle bg-surface-inset px-3 py-2">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-fg-faint">{section.label}</div>
                  <div className="mt-1 text-sm font-black text-fg">{event.totalPoints} pts</div>
                  <div className="text-[10px] text-fg-subtle">{event.basePoints} + {event.bonusPoints}</div>
                </div>
              );
            })}
          </div>
          {tieBreakWinnerId === card.competitorId && (
            <div data-state="win" className="mt-3 text-[10px] font-black uppercase tracking-[0.22em] text-game-win">
              Gagnant du 501 tie-break
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);
