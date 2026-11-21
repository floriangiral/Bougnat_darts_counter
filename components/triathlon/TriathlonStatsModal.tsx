import React from 'react';
import { X } from 'lucide-react';
import { IconButton } from '../ui/Button';
import { STATS_LABELS_FR } from '../../src/presentation/stats/statsLabels.fr';
import type { TriathlonScorecard } from '../../utils/triathlonScoring';
import { FitText } from '../ui/FitText';

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
  <dialog
    open
    aria-modal="true"
    aria-labelledby="triathlon-stats-title"
    data-modal-size="wide"
    className="stats-modal app-modal tablet-modal fixed inset-0 z-[85] m-0 flex h-full w-full max-h-none max-w-none items-center justify-center border-0 bg-scrim p-4 text-fg backdrop-blur-sm"
  >
    <div className="triathlon-stats-dialog st-panel flex h-[min(90vh,760px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border-strong bg-surface text-fg shadow-elevated">
      <div className="st-header flex items-center justify-between border-b border-border bg-surface-sunken px-4 py-4 sm:px-6">
        <h3 id="triathlon-stats-title" className="st-heading text-lg font-black italic uppercase text-brand-fg sm:text-2xl">
          {STATS_LABELS_FR.triathlon.modalTitle}
        </h3>
        <IconButton label="Fermer" onClick={onClose}>
          <X aria-hidden="true" className="h-5 w-5" />
        </IconButton>
      </div>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="st-text mb-4 rounded-2xl border border-brand-border bg-brand-subtle p-4 text-sm text-brand-fg-faint">
          Score total sur 100 : points de résultat + bonus de performance sur Capital, Cricket et 501.
          {tieBreakWinnerId ? ' Égalité finale départagée par un 501 supplémentaire.' : ''}
        </div>
        <div className="space-y-4">
          {scorecards.map((card) => (
            <div key={card.competitorId} className="rounded-2xl border border-border-subtle bg-surface-tint p-4">
              <div className="mb-3 flex items-center justify-between gap-4">
                <FitText as="div" className="st-name flex-1 text-lg font-black uppercase text-fg">
                  {card.competitorName}
                  {tieBreakWinnerId === card.competitorId ? ` • ${STATS_LABELS_FR.triathlon.tieBreak}` : ''}
                </FitText>
                <div className="st-score text-2xl font-black text-brand-fg">{card.totalScore}/100</div>
              </div>
              <div className="st-kicker mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-fg-faint">
                Base {card.totalBasePoints} | Bonus {card.totalBonusPoints}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {SCORE_SECTIONS.map((section) => {
                  const event = card[section.key];
                  return (
                    <div key={section.key} className="st-box rounded-xl border border-border-subtle bg-surface-inset p-3">
                      <div className="st-kicker text-[10px] font-black uppercase tracking-[0.18em] text-fg-faint">{section.label}</div>
                      <div className="st-value mt-2 text-lg font-black text-fg">{event.totalPoints} pts</div>
                      <div className="st-text mt-1 text-xs text-fg-subtle">Résultat {event.basePoints} + Bonus {event.bonusPoints}</div>
                      <div className="st-detail mt-2 text-xs leading-relaxed text-fg-faint">{event.summary}</div>
                      {event.bonuses.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {event.bonuses.map((bonus, index) => (
                            <div key={`${section.key}-${index}`} className="st-detail rounded-lg border border-brand-border bg-brand-subtle px-3 py-2 text-xs text-brand-fg-faint">
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
  </dialog>
);
