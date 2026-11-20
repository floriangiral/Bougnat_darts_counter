import React from 'react';

// Spec 010 (V2-FR-04, V2-FR-08): non-blocking notice about the local session, shown above the
// current screen; the game stays playable underneath.
export const SESSION_DISCARDED_MESSAGE = 'La partie précédente n’a pas pu être reprise.';
export const SESSION_NOT_SAVED_MESSAGE = 'Sauvegarde locale impossible : la partie continue, mais elle ne pourra pas être reprise après un rechargement.';

interface SessionNoticeProps {
  message: string;
  onClose: () => void;
}

export const SessionNotice: React.FC<SessionNoticeProps> = ({ message, onClose }) => (
  <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[90] flex justify-center px-4">
    <output
      className="pointer-events-auto flex max-w-md items-center gap-3 rounded-xl border border-orange-500/40 bg-gray-950/95 px-4 py-3 text-sm font-bold text-white shadow-2xl"
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded border border-white/15 px-3 py-1 text-xs font-black uppercase text-gray-200 hover:text-white"
      >
        OK
      </button>
    </output>
  </div>
);
