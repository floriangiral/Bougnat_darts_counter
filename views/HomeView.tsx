// Spec: spec:counter/release-v1.1-stabilization
import React, { useEffect, useId, useRef, useState } from 'react';
import { ChevronRight, ExternalLink, QrCode } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ChangelogModal } from '../components/ui/ChangelogModal';
import { InstallAppButton } from '../components/ui/InstallAppButton';
import { ThemeSelector } from '../components/ui/ThemeSelector';
import { env } from '../src/lib/env';

interface HomeViewProps {
  onQuickGame: () => void;
}

export const HomeView: React.FC<Readonly<HomeViewProps>> = ({
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
  const githubRepositoryUrl = 'https://github.com/floriangiral/Bougnat_darts_counter';
  const shareUrl = appUrl;
  const qrUrl = `/app-qr.svg?appUrl=${encodeURIComponent(shareUrl)}`;
  const normalizedAppEnv = env.VITE_APP_ENV.trim().toLowerCase();
  const homePillButtonClassName =
    "bd-touch-target inline-flex h-14 w-[18.5rem] max-w-[92vw] items-center justify-center gap-3 rounded-full border border-border-subtle bg-surface-tint px-5 text-[11px] font-black uppercase tracking-[0.34em] text-fg-muted transition-all hover:border-brand-border hover:bg-surface-tint-strong hover:text-fg";

  const buildLabel =
    env.VITE_APP_VERSION && env.VITE_APP_VERSION !== 'dev'
      ? ` · build ${env.VITE_APP_VERSION.slice(0, 7)}`
      : '';
  const appVersionLabel = __APP_SEMVER__ || 'dev';
  const isPreprodEnvironment = ['preprod', 'preview', 'staging'].includes(normalizedAppEnv);
  const isDevEnvironment = ['local', 'dev', 'development'].includes(normalizedAppEnv);
  let environmentBadgeLabel = '';
  if (isPreprodEnvironment) {
    environmentBadgeLabel = 'PREPROD';
  } else if (isDevEnvironment) {
    environmentBadgeLabel = 'DEV';
  }
  const environmentBadgeClassName = isPreprodEnvironment
    ? 'border-brand-border bg-brand-muted text-brand-fg-faint'
    : 'border-info-border bg-info-subtle text-info-fg';
  const showEnvironmentBadge = Boolean(environmentBadgeLabel);

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas text-fg">
      {showEnvironmentBadge && (
        <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex justify-center px-4">
          {/* The badge normalizes common deployment aliases so preprod/dev stays visible across build systems. */}
          <div className={`inline-flex max-w-[calc(100vw-2rem)] items-center rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] shadow-raised ${environmentBadgeClassName}`}>
            <span className="mr-2 h-2 w-2 rounded-full bg-current" />
            {environmentBadgeLabel}
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-ambient-hot" />
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(var(--bd-surface-tint)_1px,transparent_1px),linear-gradient(90deg,var(--bd-surface-tint)_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-10 sm:px-6 sm:py-16 lg:py-20">
        <div className="flex flex-1 items-center justify-center">
          <section className="space-y-8">
            <div className="space-y-5">
              <div className="relative">
                <div className="absolute -left-2 top-2 h-20 w-20 rounded-full bg-brand-muted blur-3xl sm:-left-6 sm:top-4 sm:h-24 sm:w-24" />
                <div className="relative flex flex-col items-center">
                  <div className="flex w-full flex-col items-center leading-none">
                    <h1 className="legacy-home-logo-top whitespace-nowrap text-[clamp(2.65rem,14vw,6.1rem)] font-black italic text-transparent bg-clip-text bg-gradient-to-br from-fg via-fg to-fg-muted drop-shadow-text transform -skew-x-6">
                      BOUGNAT
                    </h1>
                    <h2 className="legacy-home-logo-bottom mt-1 block whitespace-nowrap overflow-visible pb-2 pr-1 text-[clamp(2.25rem,12vw,5.15rem)] leading-[0.95] font-black text-transparent bg-clip-text bg-gradient-to-r from-brand via-brand-2 to-brand-strong tracking-tight transform -skew-x-12 drop-shadow-glow-brand sm:mt-2 sm:pb-3 sm:pr-2">
                      DARTS
                    </h2>
                  </div>
                  <div className="mt-3 flex w-full flex-wrap items-center justify-center gap-3 sm:flex-nowrap sm:gap-4">
                    <div className="h-[2px] w-8 rounded-full bg-gradient-to-r from-brand via-brand-2 to-transparent sm:w-12" />
                    <p className="bg-gradient-to-r from-brand via-fg to-brand bg-clip-text text-[10px] font-black uppercase tracking-[0.22em] text-transparent sm:text-[12px] sm:tracking-[0.38em]">
                      Application de scoring
                    </p>
                    <div className="h-[2px] w-8 rounded-full bg-gradient-to-l from-brand via-brand-2 to-transparent sm:w-12" />
                  </div>
                </div>
              </div>

            </div>

            <div className="mt-[20%] flex justify-center sm:mt-[18%]">
              <Button
                variant="primary"
                size="lg"
                onClick={onQuickGame}
                className="group h-14 w-full rounded-2xl px-5 text-base sm:h-16 sm:min-w-[230px] sm:px-6 sm:text-lg"
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
            type="button"
            onClick={() => setShowQr(!showQr)}
            className={homePillButtonClassName}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-muted to-danger-subtle text-brand-fg-faint">
              <QrCode className="h-4 w-4" />
            </div>
            Partager L'App
          </button>
          <InstallAppButton buttonClassName={homePillButtonClassName} />
          <ThemeSelector />

          <div className="space-y-2 text-xs sm:text-sm">
            <p className="text-fg-faint">Application officielle Bougnat Darts</p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setShowChangelog(true)}
                className="bd-touch-target inline-flex items-center font-black text-brand-fg-soft underline decoration-brand-fg-soft/50 underline-offset-4 transition-colors hover:text-brand-fg-faint"
              >
                {`v${appVersionLabel}${buildLabel} (Nouveautés)`}
              </button>
              <a
                href={githubRepositoryUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Ouvrir le repository GitHub"
                title="Ouvrir le repository GitHub"
                className="bd-touch-target inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface-tint text-fg-soft transition-all hover:scale-105 hover:border-border-strong hover:bg-surface-tint-strong hover:text-fg"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </footer>
      </div>

      {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}

      {showQr && (
        <dialog
          open
          aria-labelledby={qrDialogId}
          className="fixed inset-0 z-50 m-0 flex h-full w-full max-h-none max-w-none items-center justify-center border-0 bg-scrim p-4 text-fg backdrop-blur-sm"
        >
          <button
            type="button"
            aria-label="Fermer le partage"
            className="absolute inset-0 cursor-default"
            onClick={() => setShowQr(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-[2rem] border border-border-subtle bg-surface p-6 text-center shadow-elevated">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-fg-faint">Partager L'App</div>
            <p id={qrDialogId} className="mt-3 text-sm text-fg-muted">
              Scanne ce QR code pour ouvrir Bougnat Darts sur ton appareil.
            </p>
            <div className="mt-5 flex justify-center rounded-[1.6rem] border border-border-subtle bg-paper p-4">
              <img
                src={qrUrl}
                alt="QR code pour ouvrir l'application"
                className="h-48 w-48"
                loading="lazy"
              />
            </div>
            <div className="mt-4 rounded-2xl border border-border-subtle bg-surface-tint px-4 py-3 text-xs text-fg-muted">
              <a
                href={shareUrl}
                target="_blank"
                rel="noreferrer"
                className="break-all text-brand-fg-faint underline decoration-brand-fg-soft/30 underline-offset-4 transition-colors hover:text-brand-fg-faint"
              >
                {shareUrl}
              </a>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => { void copyShareLink(); }}
                className="h-12 rounded-2xl"
              >
                Copier Le Lien
              </Button>
              <Button
                type="button"
                onClick={() => window.open(shareUrl, '_blank', 'noopener,noreferrer')}
                className="h-12 rounded-2xl"
              >
                Ouvrir
              </Button>
            </div>
            <button
              ref={qrCloseButtonRef}
              type="button"
              onClick={() => setShowQr(false)}
              className="bd-touch-target mt-5 inline-flex items-center justify-center rounded-full border border-border-subtle bg-surface-tint px-5 py-3 text-[11px] font-black uppercase tracking-[0.24em] text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
            >
              Fermer
            </button>
          </div>
        </dialog>
      )}
    </div>
  );
};
