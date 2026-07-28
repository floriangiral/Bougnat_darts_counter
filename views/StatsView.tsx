import React, { useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { StatsModal } from '../components/stats/StatsModal';
import { STATS_LABELS_FR } from '../src/presentation/stats/statsLabels.fr';
import { MatchState } from '../types';
import type { TournamentSubmissionRecord } from '../src/application/scoring/tournamentScoring';

interface StatsViewProps {
  winnerId: string;
  onHome: () => void;
  onRematch?: () => void;
  match: MatchState; 
  tournamentSubmission?: TournamentSubmissionRecord | null;
}

const getTournamentSubmissionStatus = (status: TournamentSubmissionRecord['status']) => {
  switch (status) {
    case 'submitted':
      return 'Resultat tournoi: envoye';
    case 'pending':
      return 'Resultat tournoi: en attente';
    case 'draft':
      return 'Resultat tournoi: brouillon local';
    case 'unauthorized':
      return 'Resultat tournoi: session expiree';
    case 'network_error':
      return 'Resultat tournoi: erreur reseau';
    case 'conflict':
      return 'Resultat tournoi: conflit';
    case 'rejected':
      return 'Resultat tournoi: refus';
    default:
      return 'Resultat tournoi: erreur';
  }
};

const getTournamentSubmissionStatusClass = (status: TournamentSubmissionRecord['status']) => {
  if (status === 'submitted') return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100';
  if (status === 'pending' || status === 'draft') return 'border-cyan-300/30 bg-cyan-500/10 text-cyan-100';
  if (status === 'network_error' || status === 'unauthorized') return 'border-orange-300/30 bg-orange-500/10 text-orange-100';
  if (status === 'conflict') return 'border-violet-300/30 bg-violet-500/10 text-violet-100';
  if (status === 'rejected' || status === 'error') return 'border-red-300/30 bg-red-500/10 text-red-100';
  return 'border-orange-300/30 bg-orange-500/10 text-orange-100';
};

export const StatsView: React.FC<StatsViewProps> = ({ winnerId, onHome, onRematch, match, tournamentSubmission }) => {
  const winnerPlayers = match.players.filter((player) => player.teamId === winnerId);
  const winnerName = match.config.isDoubles
    ? winnerPlayers.map((player) => player.name).join(' / ') || 'Équipe gagnante'
    : winnerPlayers[0]?.name || STATS_LABELS_FR.statsView.unknownWinner;

  // Auto-exit after 2 minutes of inactivity (extended from 1m)
  useEffect(() => {
      const timer = setTimeout(() => {
          onHome();
      }, 120000); 
      return () => clearTimeout(timer);
  }, [onHome]);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-gradient-to-br from-gray-900 to-black text-white">
      
      {/* HEADER SECTION */}
      <div className="shrink-0 px-4 pt-5 pb-4 text-center sm:pt-6">
         <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-orange-500 via-red-500 to-orange-500 drop-shadow-[0_5px_15px_rgba(234,88,12,0.4)] sm:text-4xl md:text-6xl">
            {STATS_LABELS_FR.statsView.finished}
         </h1>
         <h2 className="text-lg md:text-xl text-gray-400 font-bold uppercase tracking-widest mt-2 px-4">
            {STATS_LABELS_FR.statsView.winnerPrefix} <span className="text-white">{winnerName}</span>
         </h2>
      </div>
      
      {/* STATS CONTENT SECTION */}
      <div className="mb-4 flex-1 w-full max-w-4xl mx-auto px-3 overflow-hidden sm:px-4">
      {tournamentSubmission ? (
        <div
          data-testid="tournament-submission-status"
          className={`mb-3 rounded-xl border px-4 py-3 text-sm font-semibold ${getTournamentSubmissionStatusClass(tournamentSubmission.status)}`}
        >
          {getTournamentSubmissionStatus(tournamentSubmission.status)}
             {tournamentSubmission.errorMessage ? ` - ${tournamentSubmission.errorMessage}` : ''}
        </div>
      ) : null}
         <div className="bg-gray-900/50 rounded-2xl border border-gray-800 h-full flex flex-col overflow-hidden shadow-2xl">
             <StatsModal match={match} title="STATISTIQUES DU MATCH" inline />
         </div>
      </div>

      {/* FOOTER ACTIONS SECTION */}
      <div className="grid shrink-0 w-full max-w-lg mx-auto grid-cols-1 gap-3 px-4 pb-6 sm:grid-cols-2 sm:gap-4 sm:px-6 sm:pb-8">
        <Button
            onClick={onRematch}
            variant="secondary"
            size="lg"
            data-testid="stats-rematch"
            className="w-full border-orange-600 text-orange-500 hover:bg-orange-900/20"
        >
            {STATS_LABELS_FR.statsView.rematch}
        </Button>
        <Button onClick={onHome} variant="primary" size="lg" data-testid="stats-home" className="w-full shadow-orange-900/40">
            {STATS_LABELS_FR.statsView.exit}
        </Button>
      </div>
    </div>
  );
};
