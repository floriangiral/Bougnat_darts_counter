import React, { useEffect, useId, useRef } from 'react';

import { Button } from '../../../../components/ui/Button';
import { VOICE_PRIVACY_NOTICE_COPY } from './voicePrivacyNoticeModel';

type VoicePrivacyNoticeProps =
  | { mode: 'consent'; onAccept: () => void; onDecline: () => void }
  | { mode: 'info'; onClose: () => void };

// Button (components/ui) ne transmet pas de ref : les choix sont retrouvés par attribut.
const getChoices = (dialog: HTMLDialogElement | null) =>
  Array.from(dialog?.querySelectorAll<HTMLButtonElement>('[data-privacy-choice]') ?? []);

/**
 * Spec 080 : fiche d'information affichée avant la première écoute (mode « consent ») ou depuis les
 * options de la partie (mode « info »). Échap équivaut à « Saisie manuelle » ou à « Fermer » ; le focus
 * reste dans la fiche et revient au déclencheur à la fermeture.
 */
export const VoicePrivacyNotice: React.FC<VoicePrivacyNoticeProps> = (props) => {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dismiss = props.mode === 'consent' ? props.onDecline : props.onClose;

  useEffect(() => {
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    getChoices(dialogRef.current)[0]?.focus();
    return () => {
      if (trigger?.isConnected) trigger.focus();
    };
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      dismiss();
      return;
    }
    if (event.key !== 'Tab') return;
    const choices = getChoices(dialogRef.current);
    const first = choices[0];
    const last = choices.at(-1);
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      open
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      data-testid="voice-privacy-notice"
      data-mode={props.mode}
      onKeyDown={handleKeyDown}
      className="app-modal tablet-modal fixed inset-0 z-[95] m-0 flex h-full max-h-none w-full max-w-none items-center justify-center border-0 bg-scrim p-4 text-fg backdrop-blur-sm"
    >
      <div className="bd-confirm-card w-full max-w-md rounded-xl border border-border-strong bg-surface p-6 shadow-elevated">
        <h2 id={titleId} className="bd-confirm-title mb-3 text-2xl font-black uppercase italic text-fg">
          {VOICE_PRIVACY_NOTICE_COPY.title}
        </h2>
        <div id={descriptionId} className="space-y-3 text-base leading-snug text-fg-muted">
          {VOICE_PRIVACY_NOTICE_COPY.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
        {props.mode === 'consent' ? (
          <div className="bd-confirm-actions mt-6 grid grid-cols-2 gap-3">
            <Button variant="secondary" data-privacy-choice="decline" data-testid="voice-privacy-decline" onClick={props.onDecline} className="bd-confirm-button">
              {VOICE_PRIVACY_NOTICE_COPY.decline}
            </Button>
            <Button variant="success" data-privacy-choice="accept" data-testid="voice-privacy-accept" onClick={props.onAccept} className="bd-confirm-button">
              {VOICE_PRIVACY_NOTICE_COPY.accept}
            </Button>
          </div>
        ) : (
          <div className="bd-confirm-actions mt-6 grid">
            <Button variant="secondary" data-privacy-choice="close" data-testid="voice-privacy-close" onClick={props.onClose} className="bd-confirm-button">
              {VOICE_PRIVACY_NOTICE_COPY.close}
            </Button>
          </div>
        )}
      </div>
    </dialog>
  );
};
