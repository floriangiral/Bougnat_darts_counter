import React, { useEffect, useId, useRef, useState } from 'react';
import { Button } from '../ui/Button';
import { createX01ResultImage } from '../../src/presentation/stats/x01ResultImage.fr';
import { buildX01ShareContent } from '../../src/presentation/stats/x01ShareText.fr';
import { copyText } from '../../src/infrastructure/web/copyText';
import { canShareImage, downloadImage, imageDataUrl, shareImage } from '../../src/infrastructure/web/shareImage';
import { shareText } from '../../src/infrastructure/web/shareText';
import type { MatchState } from '../../types';

interface X01ShareDialogProps {
  match: MatchState;
  winnerId: string;
  returnFocus: HTMLElement | null;
  onClose: () => void;
}

export const X01ShareDialog: React.FC<X01ShareDialogProps> = ({ match, winnerId, returnFocus, onClose }) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [image, setImage] = useState<{ file: File; url: string } | null>(null);
  const [imageError, setImageError] = useState(false);
  const [message, setMessage] = useState('');
  const { title, text } = buildX01ShareContent(match, winnerId);

  useEffect(() => {
    dialogRef.current?.querySelector<HTMLButtonElement>('[data-close]')?.focus();
    return () => {
      if (returnFocus?.isConnected) returnFocus.focus();
    };
  }, [returnFocus]);

  useEffect(() => {
    let active = true;
    setImage(null);
    setImageError(false);
    const generate = async () => {
      try {
        const file = await createX01ResultImage(match);
        const url = await imageDataUrl(file);
        if (active) setImage({ file, url });
      } catch {
        if (active) setImageError(true);
      }
    };
    void generate();
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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (!busyRef.current) onClose();
    } else if (event.key === 'Tab') {
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]') ?? []);
      if (focusable.length === 0) return;
      if (event.shiftKey && document.activeElement === focusable[0]) {
        event.preventDefault();
        focusable[focusable.length - 1].focus();
      } else if (!event.shiftKey && document.activeElement === focusable[focusable.length - 1]) {
        event.preventDefault();
        focusable[0].focus();
      }
    }
  };

  const imageAvailable = image !== null && canShareImage(image.file);

  return (
    <dialog
      ref={dialogRef}
      open
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={handleKeyDown}
      className="app-modal tablet-modal fixed inset-0 z-[90] m-0 flex h-full max-h-none w-full max-w-none items-center justify-center border-0 bg-scrim p-4 text-fg backdrop-blur-sm"
    >
      <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-xl border border-border-strong bg-surface p-4 shadow-elevated">
        <div className="flex items-center justify-between gap-2">
          <h2 id={titleId} className="text-xl font-black">Partager le résultat</h2>
          <Button data-close onClick={onClose} disabled={busy} variant="secondary" size="sm">Fermer</Button>
        </div>
        {image ? (
          <div role="region" aria-label="Aperçu défilable de l’image" tabIndex={0} className="my-3 max-h-[45dvh] overflow-y-auto">
            <img
              src={image.url}
              alt="Aperçu de l’image du résultat X01 et de ses statistiques"
              onError={() => {
                setImage(null);
                setImageError(true);
              }}
              className="h-auto w-full"
            />
          </div>
        ) : imageError ? (
          <div className="my-3" role="alert">
            <p>Impossible de générer ou d’afficher l’image.</p>
            <Button onClick={() => setAttempt((value) => value + 1)} disabled={busy} variant="secondary" size="sm">Réessayer</Button>
          </div>
        ) : <p className="my-3" role="status">Génération de l’image…</p>}
        {image && !imageAvailable && <p>Le partage d’image n’est pas disponible sur cet appareil.</p>}
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button disabled={!imageAvailable || busy} onClick={() => {
            if (image) void run(() => shareImage(image.file), {
              unavailable: 'Le partage d’image n’est pas disponible sur cet appareil.',
              error: 'Impossible de partager l’image. Veuillez réessayer.',
            });
          }} variant="secondary" size="sm">Partager l’image</Button>
          <Button disabled={!image || busy} onClick={() => {
            if (image) setMessage(downloadImage(image.file, image.url)
              ? 'Téléchargement de l’image demandé.'
              : 'Impossible de télécharger l’image. Veuillez réessayer.');
          }} variant="secondary" size="sm">Enregistrer l’image</Button>
          <Button disabled={busy} onClick={() => {
            void run(() => copyText(text), {
              copied: 'Résultat copié dans le presse-papiers.',
              unavailable: 'Le presse-papiers n’est pas disponible.',
              error: 'Impossible de copier le texte. Veuillez réessayer.',
            });
          }} variant="secondary" size="sm">Copier le texte</Button>
          <Button disabled={busy} onClick={() => {
            void run(() => shareText(title, text), {
              copied: 'Résultat copié dans le presse-papiers.',
              unavailable: 'Le partage et le presse-papiers ne sont pas disponibles.',
              error: 'Impossible de partager le texte. Veuillez réessayer.',
            });
          }} variant="secondary" size="sm">Partager le texte</Button>
        </div>
        <p aria-live="polite" className="mt-2 text-sm">{message}</p>
      </div>
    </dialog>
  );
};
