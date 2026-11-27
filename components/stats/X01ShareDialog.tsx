import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Button } from '../ui/Button';
import {
  buildX01ShareContent,
  copyText,
  describeX01Result,
  downloadImage,
  forgetX01ResultImage,
  getX01ShareCapabilities,
  loadX01ResultImage,
  shareImage,
  shareText,
} from '../../src/features/x01/share/x01ResultShare';
import type { X01ResultImage } from '../../src/features/x01/share/x01ResultShare';
import type { MatchState } from '../../types';

interface X01ShareDialogProps {
  match: MatchState;
  winnerId: string;
  returnFocus: HTMLElement | null;
  onClose: () => void;
}

const SHARE_IMAGE_FEEDBACK = {
  unavailable: 'Le partage d’image n’est pas disponible sur cet appareil.',
  error: 'Impossible de partager l’image. Veuillez réessayer.',
};
const COPY_FEEDBACK = {
  copied: 'Résultat copié dans le presse-papiers.',
  unavailable: 'Le presse-papiers n’est pas disponible.',
  error: 'Impossible de copier le texte. Veuillez réessayer.',
};
const SHARE_TEXT_FEEDBACK = {
  copied: 'Résultat copié dans le presse-papiers.',
  unavailable: 'Le partage et le presse-papiers ne sont pas disponibles.',
  error: 'Impossible de partager le texte. Veuillez réessayer.',
};

export const X01ShareDialog: React.FC<X01ShareDialogProps> = ({ match, winnerId, returnFocus, onClose }) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [image, setImage] = useState<X01ResultImage | null>(null);
  const [imageError, setImageError] = useState(false);
  const [message, setMessage] = useState('');
  const [capabilities] = useState(getX01ShareCapabilities);
  const { title, text } = useMemo(() => buildX01ShareContent(match, winnerId), [match, winnerId]);
  const description = useMemo(() => describeX01Result(match, winnerId), [match, winnerId]);

  useEffect(() => {
    dialogRef.current?.querySelector<HTMLButtonElement>('[data-close]')?.focus();
    return () => {
      if (returnFocus?.isConnected) returnFocus.focus();
    };
  }, [returnFocus]);

  // Génération avant tout clic : le partage natif doit partir directement du geste de l'utilisateur.
  useEffect(() => {
    let active = true;
    setImage(null);
    setImageError(false);
    loadX01ResultImage(match).then(
      (value) => { if (active) setImage(value); },
      () => { if (active) setImageError(true); },
    );
    return () => { active = false; };
  }, [match, attempt]);

  const run = async (operation: () => Promise<string>, feedback: Record<string, string>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setMessage('');
    try {
      const result = await operation();
      setMessage(feedback[result] ?? '');
    } catch {
      setMessage('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const save = () => {
    if (!image) return;
    setMessage(downloadImage(image.file, image.url)
      ? 'Téléchargement de l’image demandé.'
      : 'Impossible de télécharger l’image. Veuillez réessayer.');
  };

  const share = () => {
    if (image) void run(() => shareImage(image.file), SHARE_IMAGE_FEEDBACK);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (!busyRef.current) onClose();
    } else if (event.key === 'Tab') {
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled)') ?? []);
      if (focusable.length === 0) return;
      if (event.shiftKey && document.activeElement === focusable[0]) {
        event.preventDefault();
        focusable.at(-1)?.focus();
      } else if (!event.shiftKey && document.activeElement === focusable.at(-1)) {
        event.preventDefault();
        focusable[0].focus();
      }
    }
  };

  const imageDisabled = !image || busy;

  let preview: React.ReactNode;
  if (image) {
    preview = (
      <img
        src={image.url}
        alt={`Aperçu de l’image du résultat X01 : ${description}`}
        onError={() => {
          forgetX01ResultImage(match);
          setImage(null);
          setImageError(true);
        }}
        className="h-auto w-full"
      />
    );
  } else if (imageError) {
    preview = (
      <div role="alert">
        <p>Impossible de générer ou d’afficher l’image.</p>
        <Button onClick={() => setAttempt((value) => value + 1)} disabled={busy} variant="secondary" size="sm">Réessayer</Button>
      </div>
    );
  } else {
    preview = <output className="block">Génération de l’image…</output>;
  }

  return (
    <dialog
      ref={dialogRef}
      open
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={handleKeyDown}
      className="app-modal tablet-modal fixed inset-0 z-[90] m-0 flex h-full max-h-none w-full max-w-none items-center justify-center border-0 bg-scrim p-4 text-fg backdrop-blur-sm"
    >
      {/* L'aperçu défile avec la fenêtre, entre en-tête et actions fixes : les boutons rendent la zone défilable au clavier. */}
      <div data-testid="x01-share-scroll" className="max-h-full w-full max-w-lg overflow-y-auto rounded-xl border border-border-strong bg-surface shadow-elevated">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-surface p-4 pb-3">
          <h2 id={titleId} className="text-xl font-black">Partager le résultat</h2>
          <Button data-close onClick={onClose} disabled={busy} variant="secondary" size="sm">Fermer</Button>
        </div>
        <div className="px-4">{preview}</div>
        <div data-testid="x01-share-actions" className="sticky bottom-0 z-10 bg-surface p-4 pt-3">
          <div className="grid grid-cols-1 gap-2">
            {capabilities.shareFiles
              ? <Button disabled={imageDisabled} onClick={share} variant="primary">Partager l’image</Button>
              : <Button disabled={imageDisabled} onClick={save} variant="primary">Enregistrer l’image</Button>}
            <div className="flex flex-wrap gap-2 [&>*]:min-w-[8rem] [&>*]:flex-1">
              {capabilities.shareFiles && capabilities.saveAlongsideShare && (
                <Button disabled={imageDisabled} onClick={save} variant="secondary" size="sm">Enregistrer l’image</Button>
              )}
              <Button disabled={busy} onClick={() => { void run(() => copyText(text), COPY_FEEDBACK); }} variant="secondary" size="sm">Copier le texte</Button>
              {capabilities.shareText && (
                <Button disabled={busy} onClick={() => { void run(() => shareText(title, text), SHARE_TEXT_FEEDBACK); }} variant="secondary" size="sm">Partager le texte</Button>
              )}
            </div>
          </div>
          <p aria-live="polite" className="mt-2 text-sm">{message}</p>
        </div>
      </div>
    </dialog>
  );
};
