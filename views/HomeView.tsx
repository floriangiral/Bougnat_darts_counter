import React, { useEffect, useId, useRef, useState } from 'react';
import { ChevronRight, Github, MessageCircle, QrCode } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ChangelogModal } from '../components/ui/ChangelogModal';
import { env } from '../src/lib/env';

interface HomeViewProps {
  onQuickGame: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onQuickGame,
}) => {
  const [showQr, setShowQr] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const qrCloseButtonRef = useRef<HTMLButtonElement | null>(null);
  const qrDialogId = useId();

  useEffect(() => {
    if (!showQr) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowQr(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    window.setTimeout(() => qrCloseButtonRef.current?.focus(), 0);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showQr]);

  const appUrl = env.VITE_APP_URL?.replace(/\/$/, '') || window.location.origin;
  const feedbackUrl = 'https://chat.whatsapp.com/JCGYsdiNaYHAGAIjTOIaKg?mode=gi_t';
  const githubIssuesUrl = 'https://github.com/floriangiral/Bougnat_darts_counter/issues';
  const qrUrl = '/app-qr.svg';

  const buildLabel =
    env.VITE_APP_VERSION && env.VITE_APP_VERSION !== 'dev'
      ? ` · build ${env.VITE_APP_VERSION.slice(0, 7)}`
      : '';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05070b] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.22),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(220,38,38,0.18),transparent_22%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.05),transparent_35%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-10 sm:px-6 sm:py-16 lg:py-20">
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
                      Application de scoring
                    </p>
                    <div className="h-[2px] w-8 rounded-full bg-gradient-to-l from-orange-500 via-red-500 to-transparent sm:w-12" />
                  </div>
                </div>
              </div>

            </div>

            <div className="mt-[20%] flex justify-center sm:mt-[18%]">
              <Button
                variant="primary"
                size="lg"
                onClick={onQuickGame}
                className="group h-14 w-full rounded-2xl px-5 text-base shadow-[0_16px_40px_rgba(234,88,12,0.3)] sm:h-16 sm:min-w-[230px] sm:px-6 sm:text-lg"
              >
                <span className="inline-flex items-center gap-3">
                  <span>Lancer une partie</span>
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
            Partager L'App
          </button>

          <div className="space-y-2 text-xs sm:text-sm">
            <p className="text-gray-500">Application officielle Bougnat Darts</p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setShowChangelog(true)}
                className="font-black text-orange-400 underline decoration-orange-400/50 underline-offset-4 transition-colors hover:text-orange-300"
              >
                {`v1.0.1${buildLabel} (Nouveautes)`}
              </button>
              <a
                href={feedbackUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Rejoindre le groupe WhatsApp de test"
                title="Rejoindre le groupe WhatsApp de test"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 transition-all hover:scale-105 hover:border-emerald-300/60 hover:bg-emerald-500/20 hover:text-white"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
              <a
                href={githubIssuesUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Ouvrir les issues GitHub"
                title="Ouvrir les issues GitHub"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-gray-200 transition-all hover:scale-105 hover:border-white/30 hover:bg-white/10 hover:text-white"
              >
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>
        </footer>
      </div>

      {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}

      {showQr && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowQr(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={qrDialogId}
            className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-[#0f141d] p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
          >
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Partager L'App</div>
            <p id={qrDialogId} className="mt-3 text-sm text-gray-300">
              Scanne ce QR code pour ouvrir Bougnat Darts sur ton appareil.
            </p>
            <div className="mt-5 flex justify-center rounded-[1.6rem] bg-white p-4 shadow-[0_18px_40px_rgba(255,255,255,0.08)]">
              <img
                src={qrUrl}
                alt="QR code pour ouvrir l'application"
                className="h-48 w-48"
                loading="lazy"
              />
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs text-gray-300">
              {appUrl}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="secondary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(appUrl);
                  } catch {
                    window.open(appUrl, '_blank', 'noopener,noreferrer');
                  }
                }}
                className="h-12 rounded-2xl"
              >
                Copier Le Lien
              </Button>
              <Button
                type="button"
                onClick={() => window.open(appUrl, '_blank', 'noopener,noreferrer')}
                className="h-12 rounded-2xl"
              >
                Ouvrir
              </Button>
            </div>
            <button
              ref={qrCloseButtonRef}
              type="button"
              onClick={() => setShowQr(false)}
              className="mt-5 inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-[11px] font-black uppercase tracking-[0.24em] text-gray-300 transition-colors hover:border-white/20 hover:text-white"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
