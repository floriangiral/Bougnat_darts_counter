// Spec: spec:counter/home-install-shortcut
import React, { useEffect, useId, useRef } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { useInstallPrompt } from '../../src/features/app-install/useInstallPrompt';

interface InstallAppButtonProps {
  buttonClassName?: string;
}

export const InstallAppButton: React.FC<InstallAppButtonProps> = ({
  buttonClassName = "inline-flex h-14 w-[18.5rem] max-w-[92vw] items-center justify-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-5 text-[11px] font-black uppercase tracking-[0.34em] text-gray-300 transition-all hover:border-orange-400/30 hover:bg-white/[0.07] hover:text-white",
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
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isGuideOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeGuide();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
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
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 text-orange-300">
          {canPromptDirectly ? <Download className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
        </div>
        Creer Un Raccourci
      </button>

      {isGuideOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeGuide();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogId}
            className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-[#0f141d] p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
          >
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Installer L App</div>
            <p id={dialogId} className="mt-3 text-sm text-gray-200">
              {guideTitle}
            </p>
            <ol className="mt-5 space-y-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left text-sm text-gray-200">
              {guideSteps.map((step, index) => (
                <li key={`${step}-${index}`} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-[11px] font-black text-orange-200">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-gray-400">
              Une fois ajoutee, l app demarre depuis l ecran d accueil comme une application classique.
            </p>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeGuide}
              className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-2xl border border-transparent bg-gradient-to-r from-orange-600 to-red-600 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-[0_4px_15px_rgba(234,88,12,0.4)] transition-all duration-200 hover:from-orange-500 hover:to-red-500"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
};
