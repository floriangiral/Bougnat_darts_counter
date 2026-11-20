// Spec: spec:counter/home-install-shortcut
import React, { useEffect, useId, useRef } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { useInstallPrompt } from '../../src/features/app-install/useInstallPrompt';

interface InstallAppButtonProps {
  buttonClassName?: string;
}

export const InstallAppButton: React.FC<InstallAppButtonProps> = ({
  buttonClassName = "bd-touch-target inline-flex h-14 w-[18.5rem] max-w-[92vw] items-center justify-center gap-3 rounded-full border border-border-subtle bg-surface-tint px-5 text-[11px] font-black uppercase tracking-[0.34em] text-fg-muted transition-all hover:border-brand-border hover:bg-surface-tint-strong hover:text-fg",
}) => {
  const {
    shouldShowInstallButton,
    canPromptDirectly,
    isGuideOpen,
    guideTitle,
    guideSteps,
    openInstallFlow,
    closeGuide,
  } = useInstallPrompt();
  const dialogId = useId();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isGuideOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
  }, [closeGuide, isGuideOpen]);

  if (!shouldShowInstallButton) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void openInstallFlow()}
        className={buttonClassName}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-muted to-danger-subtle text-brand-fg-faint">
          {canPromptDirectly ? <Download className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
        </div>
        Créer un raccourci
      </button>

      {isGuideOpen && (
        <dialog
          ref={dialogRef}
          aria-labelledby={dialogId}
          onCancel={(event) => {
            event.preventDefault();
            closeGuide();
          }}
          className="fixed inset-0 z-50 m-0 flex h-full w-full max-w-none items-center justify-center overflow-visible border-0 bg-transparent p-4 text-fg-soft [&::backdrop]:bg-scrim [&::backdrop]:backdrop-blur-sm"
        >
          <button
            type="button"
            aria-label="Fermer le guide d’installation"
            className="absolute inset-0 z-0 cursor-default"
            onClick={closeGuide}
          />
          <div className="relative z-10 w-full max-w-sm rounded-[2rem] border border-border-subtle bg-surface p-6 text-center shadow-elevated">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-fg-faint">Installer l’app</div>
            <p id={dialogId} className="mt-3 text-sm text-fg-soft">
              {guideTitle}
            </p>
            <ol className="mt-5 space-y-2 rounded-2xl border border-border-subtle bg-surface-tint p-4 text-left text-sm text-fg-soft">
              {guideSteps.map((step, index) => (
                <li key={`${step}-${index}`} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-muted text-[11px] font-black text-brand-fg-faint">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-fg-subtle">
              Une fois ajoutée, l’app démarre depuis l’écran d’accueil comme une application classique.
            </p>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeGuide}
              className="bd-touch-target mt-4 inline-flex h-12 w-full items-center justify-center rounded-2xl border border-transparent bg-gradient-to-r from-brand-strong to-brand-2 px-5 py-3 text-sm font-black uppercase tracking-wide text-on-brand shadow-brand transition-all duration-200 hover:from-brand hover:to-brand-2"
            >
              Fermer
            </button>
          </div>
        </dialog>
      )}
    </>
  );
};
