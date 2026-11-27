import React from 'react';
import { FitText } from '../ui/FitText';

export type FinalRankingRow = {
  id: string;
  name: string;
  rank: number;
  /** Valeur affichée à droite : score, vies… */
  detail: string;
  played?: boolean;
};

interface FinalRankingListProps {
  rows: FinalRankingRow[];
  className?: string;
}

/** Spec 136 : classement complet affiché en fin de partie au-delà de deux joueurs. */
export const FinalRankingList: React.FC<FinalRankingListProps> = ({ rows, className = '' }) => (
  <section aria-labelledby="final-ranking-title" data-testid="final-ranking" className={`w-full max-w-md rounded-2xl border border-border-subtle bg-surface-tint p-3 text-left sm:p-4 ${className}`}>
    <h2 id="final-ranking-title" className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-fg sm:text-sm">Classement</h2>
    <ol className="grid gap-1.5">
      {rows.map((row) => (
        <li
          key={row.id}
          data-testid={`final-rank-${row.id}`}
          data-rank={row.rank}
          data-played={row.played ? 'true' : 'false'}
          className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-border-subtle bg-surface px-3 py-2"
        >
          <span className={`text-xl font-black tabular-nums ${row.rank === 1 ? 'text-game-win' : 'text-fg-subtle'}`}>{row.rank}</span>
          <FitText className="font-black text-fg">{row.name}</FitText>
          <span className="font-black tabular-nums text-fg-muted">{row.detail}</span>
        </li>
      ))}
    </ol>
  </section>
);
