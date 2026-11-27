import React, { useEffect, useId, useRef, useState } from 'react';
import { Bug, CircleAlert, Heart, Lightbulb, X } from 'lucide-react';
import { Button, IconButton } from '../ui/Button';
import {
  buildFeedbackPayload,
  FEEDBACK_CATEGORIES,
  FEEDBACK_CATEGORY_LABELS,
  FEEDBACK_MESSAGE_MAX_LENGTH,
  isFeedbackMessageValid,
  sendFeedback,
  type FeedbackCategory,
  type FeedbackPayload,
  type FeedbackSendResult,
} from '../../src/features/feedback/feedbackClient';

const ICONS: Record<FeedbackCategory, typeof Bug> = {
  bug: Bug,
  probleme: CircleAlert,
  idee: Lightbulb,
  bravo: Heart,
};

type FailureResult = Exclude<FeedbackSendResult, 'sent'>;

const FAILURE_MESSAGES: Record<FailureResult, string> = {
  invalid: 'Message refusé : vérifie son contenu.',
  'rate-limited': 'Trop de messages envoyés. Réessaie plus tard.',
  unavailable: 'L’envoi de messages n’est pas disponible pour le moment.',
  error: 'Le message n’a pas pu être envoyé. Vérifie ta connexion et réessaie.',
};

const isFailure = (status: Status): status is FailureResult => status in FAILURE_MESSAGES;

type Status = 'idle' | 'sending' | FeedbackSendResult;

interface FeedbackDialogProps {
  appVersion: string;
  onClose: () => void;
  send?: (payload: FeedbackPayload) => Promise<FeedbackSendResult>;
}

export const FeedbackDialog: React.FC<Readonly<FeedbackDialogProps>> = ({
  appVersion,
  onClose,
  send = sendFeedback,
}) => {
  const titleId = useId();
  const messageId = useId();
  const counterId = useId();
  const categoryName = useId();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [category, setCategory] = useState<FeedbackCategory>('idee');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const sending = status === 'sending';

  useEffect(() => {
    textareaRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const close = () => {
    if (!sending) onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending || !isFeedbackMessageValid(message)) return;
    setStatus('sending');
    setStatus(await send(buildFeedbackPayload(category, message, appVersion)));
  };

  return (
    <dialog
      open
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={handleKeyDown}
      data-testid="feedback-dialog"
      className="app-modal tablet-modal fixed inset-0 z-50 m-0 flex h-full w-full max-h-none max-w-none items-center justify-center border-0 bg-scrim p-4 text-fg backdrop-blur-sm"
    >
      <button
        type="button"
        aria-label="Fermer le message"
        tabIndex={-1}
        className="absolute inset-0 cursor-default"
        onClick={close}
      />
      <div className="relative z-10 flex max-h-full w-full max-w-md flex-col overflow-y-auto rounded-[2rem] border border-border-subtle bg-surface p-6 shadow-elevated">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-fg-faint">Un mot pour nous</div>
            <h2 id={titleId} className="mt-2 text-lg font-black text-fg">Écrire à l’équipe</h2>
          </div>
          <IconButton label="Fermer" onClick={close} disabled={sending} className="h-10 w-10">
            <X className="h-5 w-5" aria-hidden="true" />
          </IconButton>
        </div>

        {status === 'sent' ? (
          <div className="mt-6 space-y-5 text-center">
            <output className="block text-sm text-fg-muted">
              Merci ! Ton message a bien été envoyé.
            </output>
            <Button variant="secondary" onClick={onClose} className="w-full rounded-2xl">
              Fermer
            </Button>
          </div>
        ) : (
          <form onSubmit={(event) => { void submit(event); }} className="mt-5 space-y-4">
            <fieldset disabled={sending}>
              <legend className="sr-only">Type de message</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {FEEDBACK_CATEGORIES.map((value) => {
                  const Icon = ICONS[value];
                  const checked = category === value;
                  return (
                    <label
                      key={value}
                      data-state={checked ? 'checked' : 'unchecked'}
                      className={`bd-touch-target inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-full border px-3 text-[11px] font-black uppercase tracking-[0.12em] transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus-ring ${
                        checked
                          ? 'border-transparent bg-brand-strong text-on-brand'
                          : 'border-border-subtle bg-surface-tint text-fg-subtle hover:text-fg'
                      }`}
                    >
                      <input
                        type="radio"
                        name={categoryName}
                        value={value}
                        checked={checked}
                        onChange={() => setCategory(value)}
                        className="sr-only"
                      />
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      <span>{FEEDBACK_CATEGORY_LABELS[value]}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label htmlFor={messageId} className="sr-only">Ton message</label>
              <textarea
                ref={textareaRef}
                id={messageId}
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                  if (status !== 'sending') setStatus('idle');
                }}
                maxLength={FEEDBACK_MESSAGE_MAX_LENGTH}
                rows={5}
                readOnly={sending}
                aria-describedby={counterId}
                placeholder="Un bug, une idée, un mot gentil… on lit tout."
                className="w-full resize-none rounded-2xl border border-border-subtle bg-surface-sunken px-4 py-3 text-sm text-fg placeholder:text-fg-faint focus:border-brand-border focus:outline-none"
              />
              <p id={counterId} className="mt-1 text-right text-[11px] text-fg-faint">
                {message.length} / {FEEDBACK_MESSAGE_MAX_LENGTH}
              </p>
            </div>

            <p className="text-[11px] text-fg-faint">
              Ton message est transmis à DartsHub, qui nous le fait suivre par e-mail. N’y mets pas d’informations personnelles.
            </p>

            {isFailure(status) && (
              <p role="alert" className="text-sm text-danger-fg">{FAILURE_MESSAGES[status]}</p>
            )}

            <Button
              type="submit"
              disabled={sending || !isFeedbackMessageValid(message)}
              className="w-full rounded-2xl"
            >
              {sending ? 'Envoi…' : 'Envoyer'}
            </Button>
          </form>
        )}
      </div>
    </dialog>
  );
};
