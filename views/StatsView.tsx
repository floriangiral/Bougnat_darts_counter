import React, { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { StatsModal } from '../components/stats/StatsModal';
import { STATS_LABELS_FR } from '../src/presentation/stats/statsLabels.fr';
import { presentX01Ranking } from '../src/presentation/stats/x01RankingPresenter.fr';
import { presentX01ResultHeader } from '../src/presentation/stats/x01ResultHeader.fr';
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
  const resultHeader = presentX01ResultHeader(match, winnerId);
  const showScoreboard = resultHeader.sides.length === 2;

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

  useEffect(() => {
    if (!shareMessage) return;
    const timer = setTimeout(() => setShareMessage(''), 3000);
    return () => clearTimeout(timer);
  }, [shareMessage]);

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
      
      {/* HEADER SECTION — bandeau de résultat compact : les statistiques restent le contenu principal. */}
      <div className="stats-hero stats-hero--compact shrink-0 px-3 pt-3 pb-2 text-center sm:px-4">
         <h1 className="stats-hero-title text-xs font-black italic uppercase tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-brand via-brand-2 to-brand">
            {STATS_LABELS_FR.statsView.finished}
         </h1>
         <h2 className={showScoreboard ? 'sr-only' : 'stats-hero-winner mt-1 inline-flex min-w-0 items-center gap-1.5 text-lg font-black text-fg'}>
            {!showScoreboard && <Trophy aria-hidden="true" className="h-[1em] w-[1em] shrink-0 self-center text-game-win" />}
            <span className="sr-only">{STATS_LABELS_FR.statsView.winnerPrefix} </span>
            <span className="[overflow-wrap:anywhere]">{winnerName}</span>
         </h2>
         {showScoreboard && (
           <div
             data-testid="x01-scoreboard"
             className="stats-scoreboard stats-wide mx-auto mt-2 grid w-full max-w-4xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-2xl border border-border bg-surface-raised px-3 py-2.5 shadow-elevated sm:gap-4 sm:px-5"
           >
             {resultHeader.sides.map((side, index) => (
               <React.Fragment key={side.id}>
                 {index === 1 && (
                   <div className="stats-scoreboard-score flex items-baseline gap-1.5 font-mono text-3xl font-black tabular-nums leading-none sm:text-4xl">
                     <span className="sr-only">{`Score final : ${resultHeader.sides[0].count} ${resultHeader.unitLabel} à ${side.count}`}</span>
                     <span aria-hidden="true" className={resultHeader.sides[0].isWinner ? 'text-game-win' : 'text-fg-muted'}>{resultHeader.sides[0].count}</span>
                     <span aria-hidden="true" className="text-xl text-fg-faint">–</span>
                     <span aria-hidden="true" className={side.isWinner ? 'text-game-win' : 'text-fg-muted'}>{side.count}</span>
                   </div>
                 )}
                 <div
                   data-competitor-id={side.id}
                   data-state={side.isWinner ? 'winner' : undefined}
                   className={`flex min-w-0 flex-col ${index === 0 ? 'items-start text-left' : 'items-end text-right'}`}
                 >
                   <FitText as="div" className={`stats-scoreboard-name w-full text-base font-black sm:text-lg ${side.isWinner ? 'text-fg' : 'text-fg-muted'}`}>
                     {side.name}
                   </FitText>
                   <div className={`st-kicker mt-0.5 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${side.isWinner ? 'text-game-win' : 'text-fg-faint'}`}>
                     {side.isWinner ? (
                       <>
                         <Trophy aria-hidden="true" className="h-3 w-3 shrink-0" />
                         {STATS_LABELS_FR.statsView.winnerTag}
                       </>
                     ) : resultHeader.unitLabel}
                   </div>
                 </div>
               </React.Fragment>
             ))}
           </div>
         )}
         <p data-testid="x01-result-meta" className="st-label mt-1.5 text-[11px] font-bold uppercase tracking-wider text-fg-subtle">
           {resultHeader.formatLabel} · {resultHeader.durationLabel}
         </p>
         {showRanking && (
           <section aria-labelledby="x01-ranking-title" className="stats-wide mx-auto mt-2 w-full max-w-4xl">
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
      <div className="stats-wide flex-1 w-full max-w-4xl mx-auto px-3 overflow-hidden sm:px-4">
         <div className="bg-surface-inset rounded-2xl border border-border h-full flex flex-col overflow-hidden shadow-elevated">
             <StatsModal match={match} title={STATS_LABELS_FR.x01.title} inline showHeader={false} />
         </div>
      </div>

      {/* FOOTER ACTIONS SECTION — une seule rangée compacte pour laisser la place aux statistiques. */}
      <div className="stats-actions stats-actions--compact relative grid shrink-0 w-full max-w-lg mx-auto grid-cols-1 gap-2 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4">
        <p
          aria-live="polite"
          className="pointer-events-none absolute inset-x-3 bottom-full mb-2 flex justify-center"
        >
          {(partnerToast || shareMessage) && (
            <span
              data-testid="stats-toast"
              className="st-label rounded-full border border-border-strong bg-surface-raised px-3 py-1.5 text-center text-xs font-bold text-fg shadow-elevated"
            >
              {partnerToast || shareMessage}
            </span>
          )}
        </p>
        {partnerResultStatus?.state === 'failed' && (
          <section
            role="alert"
            data-testid="partner-send-failed"
            className="rounded-xl border border-warning-border bg-warning-subtle p-2 text-center"
          >
            <p className="st-label mb-2 text-xs font-bold text-fg">
              {STATS_LABELS_FR.statsView.partnerSendFailed}
            </p>
            <div className={`grid gap-2 ${onRetryPartner ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {onRetryPartner && (
                <Button
                  onClick={onRetryPartner}
                  variant="secondary"
                  size="sm"
                  data-testid="partner-send-retry"
                >
                  {STATS_LABELS_FR.statsView.partnerRetry}
                </Button>
              )}
              <Button
                onClick={() => { void handleNotifyOrganization(); }}
                variant="secondary"
                size="sm"
                data-testid="partner-notify-organization"
                disabled={isSharing}
              >
                {STATS_LABELS_FR.statsView.partnerNotifyOrganization}
              </Button>
            </div>
          </section>
        )}
        <div className={`grid gap-2 ${onRematch ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {onRematch && (
            <Button
              onClick={onRematch}
              variant="secondary"
              size="sm"
              data-testid="stats-rematch"
              className="w-full sm:text-sm"
            >
              {STATS_LABELS_FR.statsView.rematch}
            </Button>
          )}
          <Button
            onClick={() => { void handleShare(); }}
            variant="secondary"
            size="sm"
            data-testid="stats-share"
            disabled={isSharing}
            className="w-full sm:text-sm"
          >
            {STATS_LABELS_FR.statsView.share}
          </Button>
          <Button onClick={onHome} variant="primary" size="sm" data-testid="stats-home" className="w-full sm:text-sm">
            {STATS_LABELS_FR.statsView.exit}
          </Button>
        </div>
      </div>
    </div>
  );
};
