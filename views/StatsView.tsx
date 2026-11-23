import React, { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { StatsModal } from '../components/stats/StatsModal';
import { STATS_LABELS_FR } from '../src/presentation/stats/statsLabels.fr';
import { presentX01Ranking } from '../src/presentation/stats/x01RankingPresenter.fr';
import { buildX01ShareContent } from '../src/presentation/stats/x01ShareText.fr';
import { shareText } from '../src/infrastructure/web/shareText';
import { MatchState } from '../types';
import { FitText } from '../components/ui/FitText';
import type { PartnerResultStatus } from '../src/shared/session/persistedAppSession';

interface StatsViewProps {
  winnerId: string;
  onHome: () => void;
  onRematch?: () => void;
  partnerResultStatus?: PartnerResultStatus | null;
  onRetryPartner?: () => void;
  match: MatchState;
  isExternalMatch?: boolean;
}

export const StatsView: React.FC<StatsViewProps> = ({
  winnerId,
  onHome,
  onRematch,
  partnerResultStatus = null,
  onRetryPartner,
  match,
  isExternalMatch = false,
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [partnerToast, setPartnerToast] = useState('');
  const winnerPlayers = match.players.filter((player) => player.teamId === winnerId);
  const winnerName = match.config.isDoubles
    ? winnerPlayers.map((player) => player.name).join(' / ') || 'Équipe gagnante'
    : winnerPlayers[0]?.name || STATS_LABELS_FR.statsView.unknownWinner;
  // Spec 052 (RM-03) : le classement n'apparaît qu'au-delà de 2 camps ; à 2, l'écran reste inchangé.
  const ranking = presentX01Ranking(match);
  const showRanking = ranking.length > 2;

  // Auto-exit after 2 minutes of inactivity (extended from 1m). Not for an external
  // match: the result button must stay available until the players send it.
  useEffect(() => {
      if (isExternalMatch || isSharing) return;
      const timer = setTimeout(() => {
          onHome();
      }, 120000);
      return () => clearTimeout(timer);
  }, [onHome, isExternalMatch, isSharing]);

  useEffect(() => {
    if (partnerResultStatus?.state !== 'sent') {
      setPartnerToast('');
      return;
    }

    setPartnerToast(`Résultat envoyé vers ${partnerResultStatus.host}.`);
    const timer = setTimeout(() => setPartnerToast(''), 2000);
    return () => clearTimeout(timer);
  }, [partnerResultStatus]);

  const shareMatchResult = async (note?: string) => {
    setShareMessage('');
    setIsSharing(true);
    const { title, text } = buildX01ShareContent(match, winnerId);
    const result = await shareText(title, note ? `${text}\n\n${note}` : text);
    if (result === 'copied') setShareMessage(STATS_LABELS_FR.statsView.shareCopied);
    else if (result === 'unavailable') setShareMessage(STATS_LABELS_FR.statsView.shareUnavailable);
    else if (result === 'error') setShareMessage(STATS_LABELS_FR.statsView.shareFailed);
    setIsSharing(false);
  };

  const handleShare = () => shareMatchResult();
  const handleNotifyOrganization = () =>
    shareMatchResult(`À transmettre à ${partnerResultStatus?.host ?? 'l’organisation'}.`);

  return (
    <div className="stats-screen flex h-[100dvh] flex-col overflow-hidden bg-gradient-to-br from-surface to-canvas text-fg">
      
      {/* HEADER SECTION */}
      <div className="stats-hero shrink-0 px-4 pt-5 pb-4 text-center sm:pt-6">
         <h1 className="stats-hero-title text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-brand via-brand-2 to-brand drop-shadow-glow-brand sm:text-4xl md:text-6xl">
            {STATS_LABELS_FR.statsView.finished}
         </h1>
         <h2 className="stats-hero-winner text-lg md:text-xl text-fg-subtle font-bold uppercase tracking-widest mt-2 px-4">
            {STATS_LABELS_FR.statsView.winnerPrefix} <span className="text-fg [overflow-wrap:anywhere]">{winnerName}</span>
         </h2>
         {showRanking && (
           <section aria-labelledby="x01-ranking-title" className="stats-wide mx-auto mt-4 w-full max-w-4xl">
             <h3 id="x01-ranking-title" className="sr-only">{STATS_LABELS_FR.statsView.ranking}</h3>
             <ol data-testid="x01-ranking" className="grid grid-cols-2 gap-2 text-left sm:grid-cols-4">
               {ranking.map((entry) => (
                 <li
                   key={entry.competitorId}
                   data-competitor-id={entry.competitorId}
                   data-rank={entry.rank}
                   data-state={entry.isMatchWinner ? 'winner' : undefined}
                   className={`stats-rank-card min-w-0 rounded-xl border px-3 py-2 ${entry.isMatchWinner ? 'border-game-win bg-surface-raised' : 'border-border-subtle bg-surface-tint'}`}
                 >
                   <div className={`st-kicker flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${entry.isMatchWinner ? 'text-game-win' : 'text-fg-subtle'}`}>
                     {entry.isMatchWinner && <Trophy aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />}
                     {entry.rankLabel}
                   </div>
                   <FitText as="div" className="st-name text-sm font-black text-fg sm:text-base">{entry.name}</FitText>
                   <div className="st-label text-[11px] font-bold text-fg-muted">{entry.detail}</div>
                 </li>
               ))}
             </ol>
           </section>
         )}
      </div>
      
      {/* STATS CONTENT SECTION */}
      <div className="stats-wide mb-4 flex-1 w-full max-w-4xl mx-auto px-3 overflow-hidden sm:px-4">
         <div className="bg-surface-inset rounded-2xl border border-border h-full flex flex-col overflow-hidden shadow-elevated">
             <StatsModal match={match} title="STATISTIQUES DU MATCH" inline />
         </div>
      </div>

      {/* FOOTER ACTIONS SECTION */}
      <div className="stats-actions grid shrink-0 w-full max-w-lg mx-auto grid-cols-1 gap-3 px-4 pb-6 sm:px-6 sm:pb-8">
        {partnerResultStatus?.state === 'failed' && (
          <section
            role="alert"
            data-testid="partner-send-failed"
            className="rounded-xl border border-warning-border bg-warning-subtle p-3 text-center"
          >
            <p className="st-label mb-3 text-sm font-bold text-fg">
              {STATS_LABELS_FR.statsView.partnerSendFailed}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {onRetryPartner && (
                <Button
                  onClick={onRetryPartner}
                  variant="secondary"
                  size="lg"
                  data-testid="partner-send-retry"
                >
                  {STATS_LABELS_FR.statsView.partnerRetry}
                </Button>
              )}
              <Button
                onClick={() => { void handleNotifyOrganization(); }}
                variant="secondary"
                size="lg"
                data-testid="partner-notify-organization"
                disabled={isSharing}
              >
                {STATS_LABELS_FR.statsView.partnerNotifyOrganization}
              </Button>
            </div>
          </section>
        )}
        {onRematch && (
          <Button
            onClick={onRematch}
            variant="secondary"
            size="lg"
            data-testid="stats-rematch"
            className="w-full"
          >
            {STATS_LABELS_FR.statsView.rematch}
          </Button>
        )}
        <Button
          onClick={() => { void handleShare(); }}
          variant="secondary"
          size="lg"
          data-testid="stats-share"
          disabled={isSharing}
          className="w-full border-brand text-brand-fg hover:bg-brand-muted"
        >
          {STATS_LABELS_FR.statsView.share}
        </Button>
        <p aria-live="polite" className="st-label min-h-4 text-center text-xs font-bold text-fg-muted">
          {partnerToast || shareMessage}
        </p>
        <Button onClick={onHome} variant="primary" size="lg" data-testid="stats-home" className="w-full shadow-brand">
          {STATS_LABELS_FR.statsView.exit}
        </Button>
      </div>
    </div>
  );
};
