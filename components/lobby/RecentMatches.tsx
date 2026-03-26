import React from 'react';
import type { MatchHistoryItem } from '../../src/types/lobby';

interface RecentMatchesProps {
  matches: MatchHistoryItem[];
}

export const RecentMatches: React.FC<RecentMatchesProps> = ({ matches }) => {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-[#0b1119]/92 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-6">
      <div className="mb-5">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">Historique Recent</p>
        <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">Derniers Matchs</h2>
      </div>

      <div className="space-y-3">
        {matches.length === 0 ? (
          <div className="rounded-[1.4rem] border border-dashed border-white/10 bg-[#0a1018] px-4 py-6 text-sm text-gray-400">
            Aucun match suivi pour le moment. Termine une partie sauvegardee pour alimenter ton historique recent.
          </div>
        ) : matches.map((match) => (
          <div key={match.id} className="rounded-[1.4rem] border border-white/8 bg-[#0a1018] px-4 py-4">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{match.mode}</div>
                <div className="mt-2 text-base font-black text-white">{match.opponentLabel}</div>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                  match.result === 'win'
                    ? 'border border-green-500/30 bg-green-500/10 text-green-300'
                    : 'border border-red-500/30 bg-red-500/10 text-red-300'
                }`}
              >
                {match.result === 'win' ? 'Victoire' : 'Defaite'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-black text-orange-300">{match.scoreLabel}</span>
              <span className="text-gray-500">{match.playedAt}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
