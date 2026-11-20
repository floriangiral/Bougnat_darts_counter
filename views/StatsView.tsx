import React, { useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { StatsModal } from '../components/stats/StatsModal';
import { STATS_LABELS_FR } from '../src/presentation/stats/statsLabels.fr';
import { MatchState } from '../types';

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
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-gradient-to-br from-surface to-canvas text-fg">
      
      {/* HEADER SECTION */}
      <div className="shrink-0 px-4 pt-5 pb-4 text-center sm:pt-6">
         <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-brand via-brand-2 to-brand drop-shadow-[0_5px_15px_rgba(234,88,12,0.4)] sm:text-4xl md:text-6xl">
            {STATS_LABELS_FR.statsView.finished}
         </h1>
         <h2 className="text-lg md:text-xl text-fg-subtle font-bold uppercase tracking-widest mt-2 px-4">
            {STATS_LABELS_FR.statsView.winnerPrefix} <span className="text-fg">{winnerName}</span>
         </h2>
      </div>
      
      {/* STATS CONTENT SECTION */}
      <div className="mb-4 flex-1 w-full max-w-4xl mx-auto px-3 overflow-hidden sm:px-4">
         <div className="bg-surface-inset rounded-2xl border border-border h-full flex flex-col overflow-hidden shadow-2xl">
             <StatsModal match={match} title="STATISTIQUES DU MATCH" inline />
         </div>
      </div>

      {/* FOOTER ACTIONS SECTION */}
      {externalReturn ? (
        <div className="flex shrink-0 w-full max-w-lg mx-auto flex-col gap-3 px-4 pb-6 sm:px-6 sm:pb-8">
          <Button onClick={externalReturn.onReturn} variant="primary" size="lg" data-testid="stats-external-return"
            className="w-full shadow-orange-900/40">
            {STATS_LABELS_FR.statsView.sendResult}
          </Button>
          <p className="text-center text-xs font-bold uppercase tracking-widest text-fg-faint">
            {STATS_LABELS_FR.statsView.sendResultTo} <span className="text-fg-muted">{externalReturn.host}</span>
          </p>
          <Button onClick={onHome} variant="secondary" size="md" data-testid="stats-home" className="w-full">
            {STATS_LABELS_FR.statsView.exit}
          </Button>
        </div>
      ) : (
      <div className="grid shrink-0 w-full max-w-lg mx-auto grid-cols-1 gap-3 px-4 pb-6 sm:grid-cols-2 sm:gap-4 sm:px-6 sm:pb-8">
        <Button
            onClick={onRematch}
            variant="secondary"
            size="lg"
            data-testid="stats-rematch"
            className="w-full border-brand text-brand-fg hover:bg-brand-muted"
        >
            {STATS_LABELS_FR.statsView.rematch}
        </Button>
        <Button onClick={onHome} variant="primary" size="lg" data-testid="stats-home" className="w-full shadow-orange-900/40">
            {STATS_LABELS_FR.statsView.exit}
        </Button>
      </div>
      )}
    </div>
  );
};
