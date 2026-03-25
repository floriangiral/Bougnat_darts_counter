import React, { useState, useEffect } from 'react';
import { ChevronRight, QrCode } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { checkConnection } from '../lib/supabase';
import { ChangelogModal } from '../components/ui/ChangelogModal';
import { MenuUserBadge } from '../components/ui/MenuUserBadge';
import { env } from '../src/lib/env';

interface HomeViewProps {
  onQuickGame: () => void;
  onLogin: () => void;
  user?: any;
  onUserMenu?: () => void;
  onLogout?: () => void;
  secondaryLabel?: string;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onQuickGame,
  onLogin,
  user,
  onUserMenu,
  onLogout,
  secondaryLabel,
}) => {
  const [showQr, setShowQr] = useState(false);
  const [dbStatus, setDbStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [showChangelog, setShowChangelog] = useState(false);

  useEffect(() => {
    checkConnection().then((isConnected) => {
      setDbStatus(isConnected ? 'ok' : 'error');
    });
  }, []);

  const appUrl = 'https://bougnat-darts-professional-darts-scorer-532599512173.us-west1.run.app/';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(appUrl)}&bgcolor=ffffff&margin=5`;

  const statusLabel =
    dbStatus === 'checking' ? 'Connexion...' :
    dbStatus === 'ok' ? 'Systeme en ligne' :
    'Mode hors ligne';

  const statusTone =
    dbStatus === 'checking' ? 'bg-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.7)]' :
    dbStatus === 'ok' ? 'bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.7)]' :
    'bg-red-500 shadow-[0_0_14px_rgba(239,68,68,0.6)]';

  const footerStatusLabel =
    dbStatus === 'checking' ? 'Connexion...' :
    dbStatus === 'ok' ? 'Systeme En Ligne' :
    'Mode Hors Ligne';
  const buildLabel =
    env.VITE_APP_VERSION && env.VITE_APP_VERSION !== 'dev'
      ? ` · build ${env.VITE_APP_VERSION.slice(0, 7)}`
      : '';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05070b] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.22),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(220,38,38,0.18),transparent_22%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.05),transparent_35%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-10 sm:px-6 sm:py-16 lg:py-20">
        {user && (
          <div className="mb-6 flex justify-end">
            <MenuUserBadge user={user} onClick={onUserMenu} onLogout={onLogout} />
          </div>
        )}

        <div className="flex flex-1 items-center justify-center">
          <section className="space-y-8">
            <div className="space-y-5">
              <div className="relative">
                <div className="absolute -left-2 top-2 h-20 w-20 rounded-full bg-orange-500/20 blur-3xl sm:-left-6 sm:top-4 sm:h-24 sm:w-24" />
                <div className="relative flex flex-col items-center">
                  <div className="flex w-full flex-col items-center leading-none">
                    <h1 className="whitespace-nowrap text-[clamp(2.65rem,14vw,6.1rem)] font-black italic text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-300 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] transform -skew-x-6">
                      BOUGNAT
                    </h1>
                    <h2 className="mt-1 block whitespace-nowrap overflow-visible pb-2 pr-1 text-[clamp(2.25rem,12vw,5.15rem)] leading-[0.95] font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 tracking-tight transform -skew-x-12 drop-shadow-[0_0_25px_rgba(234,88,12,0.6)] sm:mt-2 sm:pb-3 sm:pr-2">
                      DARTS
                    </h2>
                  </div>
                  <div className="mt-3 flex w-full flex-wrap items-center justify-center gap-3 sm:flex-nowrap sm:gap-4">
                    <div className="h-[2px] w-8 rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-transparent sm:w-12" />
                    <p className="bg-gradient-to-r from-orange-100 via-white to-orange-300 bg-clip-text text-[10px] font-black uppercase tracking-[0.22em] text-transparent sm:text-[12px] sm:tracking-[0.38em]">
                      Application de score de flechettes
                    </p>
                    <div className="hidden h-[2px] w-12 rounded-full bg-gradient-to-l from-orange-500 via-red-500 to-transparent sm:block" />
                  </div>
                </div>
              </div>

              <p className="mx-auto max-w-2xl text-center text-sm leading-7 text-gray-300 sm:text-base lg:text-lg">
                Pret a jouer ? Lance ta partie immediatement, analyse tes stats en temps reel et reste
                concentre grace a une interface lisible, meme dans les conditions de jeu les plus sombres.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
              <Button
                variant="primary"
                size="lg"
                onClick={onQuickGame}
                className="group h-14 w-full rounded-2xl px-5 text-base shadow-[0_16px_40px_rgba(234,88,12,0.3)] sm:h-16 sm:min-w-[230px] sm:px-6 sm:text-lg"
              >
                <span className="inline-flex items-center gap-3">
                  <span>Partie Rapide</span>
                  <ChevronRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </Button>

              <Button
                variant="secondary"
                size="lg"
                onClick={onLogin}
                className="group h-14 w-full rounded-2xl border-white/10 bg-white/[0.045] px-5 text-base text-white shadow-[0_10px_28px_rgba(0,0,0,0.18)] backdrop-blur-sm hover:border-orange-400/30 hover:bg-white/[0.08] sm:h-16 sm:min-w-[230px] sm:px-6 sm:text-lg"
              >
                <span className="inline-flex items-center gap-3">
                  <span>{secondaryLabel || 'Connexion / Inscription'}</span>
                  <ChevronRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </Button>
            </div>
          </section>
        </div>

        <footer className="mt-10 flex flex-col items-center gap-5 text-center">
          <button
            onClick={() => setShowQr(!showQr)}
            className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-[11px] font-black uppercase tracking-[0.34em] text-gray-300 transition-all hover:border-orange-400/30 hover:bg-white/[0.07] hover:text-white"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 text-orange-300">
              <QrCode className="h-4 w-4" />
            </div>
            Ouvrir L'App
          </button>

          {showQr && (
            <div className="flex flex-col items-center rounded-[1.6rem] bg-white p-4 shadow-[0_18px_40px_rgba(255,255,255,0.08)] animate-in fade-in zoom-in duration-300">
              <img
                src={qrUrl}
                alt="Scan to open App"
                className="h-36 w-36 sm:h-40 sm:w-40"
                loading="lazy"
              />
            </div>
          )}

          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-gray-400">
            <span className={`h-3 w-3 rounded-full ${statusTone}`} />
            {footerStatusLabel}
          </div>

          <div className="space-y-2 text-xs sm:text-sm">
            <p className="text-gray-500">Propulse par le moteur Bougnat Darts XP</p>
            <button
              onClick={() => setShowChangelog(true)}
              className="font-black text-orange-400 underline decoration-orange-400/50 underline-offset-4 transition-colors hover:text-orange-300"
            >
              {`v1.0.0-beta.3${buildLabel} (Nouveautes)`}
            </button>
          </div>
        </footer>
      </div>

      {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
    </div>
  );
};
