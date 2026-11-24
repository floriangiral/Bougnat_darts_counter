import React, { useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { CricketPlayerState } from '../../types';
import { CRICKET_TARGETS } from '../../utils/cricketLogic';
import { FitText } from '../ui/FitText';

interface CricketStatsModalProps {
  players: CricketPlayerState[];
  onClose: () => void;
}

type CricketStatLine = {
  label: string;
  values: Array<string | number>;
};

const buildPlayerStats = (player: CricketPlayerState) => {
  const totalMarks = (Object.values(player.marks)).reduce((sum, value) => sum + value, 0);
  const rounds = player.dartsThrown / 3;
  const mpr = rounds > 0 ? (totalMarks / rounds).toFixed(2) : '0.00';
  const scoringHits = player.history.filter((entry) => !entry.isMiss && entry.pointsScored > 0);
  const bulls = player.history.filter((entry) => entry.target === 25 && !entry.isMiss).length;
  const doubles = player.history.filter((entry) => entry.multiplier === 2 && !entry.isMiss).length;
  const triples = player.history.filter((entry) => entry.multiplier === 3 && !entry.isMiss).length;
  const singles = player.history.filter((entry) => entry.multiplier === 1 && !entry.isMiss).length;
  const closedNumbers = CRICKET_TARGETS.filter((target) => player.marks[target] >= 3).length;
  const extraMarks = player.history.reduce((sum, entry) => {
    if (entry.isMiss || entry.target === null) return sum;
    const rawMarks = entry.multiplier;
    if (entry.pointsScored <= 0) return sum;
    return sum + rawMarks - Math.ceil(entry.pointsScored / entry.target);
  }, 0);

  return {
    score: player.score,
    dartsThrown: player.dartsThrown,
    totalMarks,
    mpr,
    closedNumbers,
    scoringHits: scoringHits.length,
    bulls,
    singles,
    doubles,
    triples,
    extraMarks,
  };
};

export const CricketStatsModal: React.FC<CricketStatsModalProps> = ({ players, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'detail'>('overview');

  const stats = useMemo(() => players.map((player) => ({ player, stat: buildPlayerStats(player) })), [players]);
  // Comme le X01 (spec 052) : au-delà de 2 colonnes, chaque colonne garde une largeur lisible et le tableau défile.
  const isWide = stats.length > 2;
  const statsGridStyle = useMemo(
    () => ({
      gridTemplateColumns: isWide
        ? `minmax(7rem,1.2fr) repeat(${stats.length}, minmax(5.5rem,1fr))`
        : `minmax(0,1.2fr) repeat(${stats.length}, minmax(0,1fr))`,
      '--st-cols': stats.length,
    } as React.CSSProperties),
    [isWide, stats.length]
  );
  const tableStyle: React.CSSProperties | undefined = isWide ? { minWidth: `${8 + stats.length * 6}rem` } : undefined;

  const overviewLines: CricketStatLine[] = [
    { label: 'Score', values: stats.map(({ stat }) => stat.score) },
    { label: 'Marks totaux', values: stats.map(({ stat }) => stat.totalMarks) },
    { label: 'MPR', values: stats.map(({ stat }) => stat.mpr) },
    { label: 'Fléchettes lancées', values: stats.map(({ stat }) => stat.dartsThrown) },
    { label: 'Numéros fermés', values: stats.map(({ stat }) => stat.closedNumbers) },
  ];

  const detailLines: CricketStatLine[] = [
    { label: 'Touches scorantes', values: stats.map(({ stat }) => stat.scoringHits) },
    { label: 'Singles', values: stats.map(({ stat }) => stat.singles) },
    { label: 'Doubles', values: stats.map(({ stat }) => stat.doubles) },
    { label: 'Triples', values: stats.map(({ stat }) => stat.triples) },
    { label: 'Bull / D-Bull', values: stats.map(({ stat }) => stat.bulls) },
    { label: 'Marks bonus', values: stats.map(({ stat }) => stat.extraMarks) },
  ];

  const lines = activeTab === 'overview' ? overviewLines : detailLines;

  return (
    <dialog open aria-label="Statistiques Cricket" data-modal-size="wide" className="stats-modal app-modal tablet-modal fixed inset-0 z-50 m-0 flex h-full w-full max-h-none max-w-none items-center justify-center border-0 bg-scrim p-4 text-fg backdrop-blur-md">
      <div className="st-panel flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[1.75rem] border border-border-subtle bg-surface shadow-elevated">
        <div className="st-header flex items-center justify-between gap-3 border-b border-border-subtle bg-surface-sunken px-5 py-4">
          <div>
            <h2 className="st-heading text-xl font-black italic uppercase text-fg sm:text-2xl">
              <span className="text-fg">Bougnat</span> <span className="text-brand-fg">Darts</span>
            </h2>
            <p className="st-kicker mt-1 text-[11px] font-black uppercase tracking-[0.22em] text-fg-subtle">Statistiques Cricket</p>
          </div>
          <Button variant="danger" size="sm" onClick={onClose} className="st-close text-[11px] sm:text-xs">
            Quitter
          </Button>
        </div>

        <div className="flex border-b border-border-subtle bg-surface-sunken">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            aria-pressed={activeTab === 'overview'}
            className={`st-tab bd-touch-target flex-1 px-4 py-3 text-xs font-black uppercase tracking-[0.22em] ${activeTab === 'overview' ? 'border-b-2 border-brand text-brand-fg-soft' : 'text-fg-faint'}`}
          >
            Vue générale
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('detail')}
            aria-pressed={activeTab === 'detail'}
            className={`st-tab bd-touch-target flex-1 px-4 py-3 text-xs font-black uppercase tracking-[0.22em] ${activeTab === 'detail' ? 'border-b-2 border-brand text-brand-fg-soft' : 'text-fg-faint'}`}
          >
            Détail des touches
          </button>
        </div>

        <div
          data-testid="cricket-stats-scroll"
          data-columns={stats.length}
          className={`p-3 sm:p-5 ${isWide ? 'overflow-auto' : 'overflow-y-auto'}`}
        >
          <div style={tableStyle}>
            <div className="st-head mb-3 grid gap-2 px-2" style={statsGridStyle}>
              <div className="st-head-metric text-[10px] font-black uppercase tracking-[0.22em] text-fg-faint">Mesure</div>
              {stats.map(({ player }) => (
                <FitText as="div" key={player.id} className="st-head-name text-center text-xs font-black uppercase tracking-[0.14em] text-fg sm:text-sm">
                  {player.name}
                </FitText>
              ))}
            </div>

            <div className="space-y-2">
              {lines.map((line) => (
                <div key={line.label} className="st-row grid items-center gap-2 rounded-2xl border border-border-subtle bg-surface-tint px-3 py-3" style={statsGridStyle}>
                  <div className="st-label text-[11px] font-bold uppercase tracking-[0.14em] text-fg-subtle">{line.label}</div>
                  {line.values.map((value, index) => (
                    <div key={`${line.label}-${index}`} className="st-value text-center font-mono text-lg font-black text-fg sm:text-xl">
                      {value}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border-subtle bg-surface-sunken p-4 md:hidden">
          <Button className="st-footer-button w-full" onClick={onClose}>Fermer</Button>
        </div>
      </div>
    </dialog>
  );
};
