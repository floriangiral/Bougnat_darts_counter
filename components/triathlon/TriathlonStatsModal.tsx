import React from 'react';
import { STATS_LABELS_FR } from '../../src/presentation/stats/statsLabels.fr';
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
  <div className="fixed inset-0 z-[85] flex items-center justify-center bg-overlay p-4 backdrop-blur-sm">
    <div className="flex h-[min(90vh,760px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border-strong bg-surface shadow-2xl">
      <div className="flex items-center justify-between border-b border-border bg-surface-sunken px-4 py-4 sm:px-6">
        <h3 className="text-lg font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-2 sm:text-2xl">
          {STATS_LABELS_FR.triathlon.modalTitle}
        </h3>
        <button onClick={onClose} className="rounded border border-border-strong bg-surface-raised px-3 py-2 text-[11px] font-bold uppercase text-fg sm:text-xs">
          Fermer
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mb-4 rounded-2xl border border-brand-border bg-brand-subtle p-4 text-sm text-brand-fg-faint">
          Score total sur 100 : points de résultat + bonus de performance sur Capital, Cricket et 501.
          {tieBreakWinnerId ? ' Égalité finale départagée par un 501 supplémentaire.' : ''}
        </div>
        <div className="space-y-4">
          {scorecards.map((card) => (
            <div key={card.competitorId} className="rounded-2xl border border-border-subtle bg-surface-tint p-4">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div className="truncate text-lg font-black uppercase text-fg">
                  {card.competitorName}
                  {tieBreakWinnerId === card.competitorId ? ` • ${STATS_LABELS_FR.triathlon.tieBreak}` : ''}
                </div>
                <div className="text-2xl font-black text-brand-fg">{card.totalScore}/100</div>
              </div>
              <div className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-fg-faint">
                Base {card.totalBasePoints} | Bonus {card.totalBonusPoints}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {SCORE_SECTIONS.map((section) => {
                  const event = card[section.key];
                  return (
                    <div key={section.key} className="rounded-xl border border-border-subtle bg-surface-inset p-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-fg-faint">{section.label}</div>
                      <div className="mt-2 text-lg font-black text-fg">{event.totalPoints} pts</div>
                      <div className="mt-1 text-xs text-fg-subtle">Résultat {event.basePoints} + Bonus {event.bonusPoints}</div>
                      <div className="mt-2 text-xs leading-relaxed text-fg-faint">{event.summary}</div>
                      {event.bonuses.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {event.bonuses.map((bonus, index) => (
                            <div key={`${section.key}-${index}`} className="rounded-lg border border-brand-border bg-brand-subtle px-3 py-2 text-xs text-brand-fg-faint">
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
