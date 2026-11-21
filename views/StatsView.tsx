import React, { useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { StatsModal } from '../components/stats/StatsModal';
import { STATS_LABELS_FR } from '../src/presentation/stats/statsLabels.fr';
import { presentX01Ranking } from '../src/presentation/stats/x01RankingPresenter.fr';
import { MatchState } from '../types';
import { FitText } from '../components/ui/FitText';

/** Spec 030: match opened from an external link, whose result can be sent back. */
export interface StatsExternalReturn {
  /** Host shown to the players (e.g. "badarts.fr") */
  host: string;
  onReturn: () => void;
}

interface StatsViewProps {
  winnerId: string;
  onHome: () => void;
  onRematch?: () => void;
  match: MatchState;
  externalReturn?: StatsExternalReturn | null;
}

export const StatsView: React.FC<StatsViewProps> = ({ winnerId, onHome, onRematch, match, externalReturn }) => {
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
      if (externalReturn) return;
      const timer = setTimeout(() => {
          onHome();
      }, 120000);
      return () => clearTimeout(timer);
  }, [onHome, externalReturn]);

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
      {externalReturn ? (
        <div className="stats-actions flex shrink-0 w-full max-w-lg mx-auto flex-col gap-3 px-4 pb-6 sm:px-6 sm:pb-8">
          <Button onClick={externalReturn.onReturn} variant="primary" size="lg" data-testid="stats-external-return"
            className="w-full shadow-brand">
            {STATS_LABELS_FR.statsView.sendResult}
          </Button>
          <p className="st-label text-center text-xs font-bold uppercase tracking-widest text-fg-faint">
            {STATS_LABELS_FR.statsView.sendResultTo} <span className="text-fg-muted">{externalReturn.host}</span>
          </p>
          <Button onClick={onHome} variant="secondary" size="md" data-testid="stats-home" className="w-full">
            {STATS_LABELS_FR.statsView.exit}
          </Button>
        </div>
      ) : (
      <div className="stats-actions grid shrink-0 w-full max-w-lg mx-auto grid-cols-1 gap-3 px-4 pb-6 sm:grid-cols-2 sm:gap-4 sm:px-6 sm:pb-8">
        <Button
            onClick={onRematch}
            variant="secondary"
            size="lg"
            data-testid="stats-rematch"
            className="w-full border-brand text-brand-fg hover:bg-brand-muted"
        >
            {STATS_LABELS_FR.statsView.rematch}
        </Button>
        <Button onClick={onHome} variant="primary" size="lg" data-testid="stats-home" className="w-full shadow-brand">
            {STATS_LABELS_FR.statsView.exit}
        </Button>
      </div>
      )}
    </div>
  );
};
