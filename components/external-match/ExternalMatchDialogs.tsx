// Spec: spec:counter/external-match-link
//
// Dialogs of the external match link: leaving a linked match (abandon or unsent result)
// and opening a new link over a match in progress. Pure composition, the decisions are
// taken by the caller through the callbacks.
import React from 'react';

import { Button } from '../ui/Button';
import type { ExternalLinkConflict } from '../../src/features/external-match/externalMatchStartup';
import { EXTERNAL_MATCH_LABELS_FR } from '../../src/presentation/externalMatch/externalMatchLabels.fr';

export type ExternalLeaveKind = 'abandon' | 'unsent-result';

interface DialogFrameProps {
  testId: string;
  title: string;
  children: React.ReactNode;
}

const DialogFrame: React.FC<DialogFrameProps> = ({ testId, title, children }) => (
  <dialog
    open
    aria-label={title}
    data-testid={testId}
    className="app-modal fixed inset-0 z-[70] m-0 flex h-full max-h-none w-full max-w-none items-center justify-center border-0 bg-black/90 p-4 text-white backdrop-blur-sm"
  >
    <div className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 p-6 text-center">
      <h3 className="mb-3 text-2xl font-black uppercase italic text-white">{title}</h3>
      {children}
    </div>
  </dialog>
);

interface ExternalMatchLeaveDialogProps {
  kind: ExternalLeaveKind;
  /** Host of the external app, e.g. "badarts.fr" */
  host: string;
  /** Sends the result (unsent-result) or tells the external app the match is abandoned; hidden when null */
  onNotify: (() => void) | null;
  /** Leaves locally without telling the external app */
  onLeave: () => void;
  onCancel: () => void;
}

export const ExternalMatchLeaveDialog: React.FC<ExternalMatchLeaveDialogProps> = ({
  kind,
  host,
  onNotify,
  onLeave,
  onCancel,
}) => {
  const copy = kind === 'unsent-result'
    ? EXTERNAL_MATCH_LABELS_FR.leave.unsentResult
    : EXTERNAL_MATCH_LABELS_FR.leave.abandon;

  return (
    <DialogFrame testId="external-leave-dialog" title={copy.title}>
      <p className="text-sm text-gray-300">{copy.message(host)}</p>
      <div className="mt-6 flex flex-col gap-3">
        {onNotify && (
          <>
            <Button variant="primary" onClick={onNotify} data-testid="external-leave-notify">
              {copy.notify}
            </Button>
            <p className="-mt-1 text-[11px] font-bold uppercase tracking-widest text-gray-500">{copy.notifyHint(host)}</p>
          </>
        )}
        <Button variant="danger" onClick={onLeave} data-testid="external-leave-confirm">
          {copy.leave}
        </Button>
        <Button variant="secondary" onClick={onCancel} data-testid="external-leave-cancel">
          {copy.cancel}
        </Button>
      </div>
    </DialogFrame>
  );
};

interface ExternalMatchConflictDialogProps {
  conflict: ExternalLinkConflict;
  /** Players of the incoming link, in link order */
  incomingPlayerNames: readonly string[];
  /** Host of the previous linked match (unsent-result only) */
  previousHost: string | null;
  onOpenLink: () => void;
  onKeepCurrent: () => void;
}

export const ExternalMatchConflictDialog: React.FC<ExternalMatchConflictDialogProps> = ({
  conflict,
  incomingPlayerNames,
  previousHost,
  onOpenLink,
  onKeepCurrent,
}) => {
  const labels = EXTERNAL_MATCH_LABELS_FR.conflict;
  const isUnsentResult = conflict === 'unsent-result' && previousHost !== null;
  const title = isUnsentResult ? labels.unsentResult.title : labels.matchInProgress.title;
  const message = isUnsentResult ? labels.unsentResult.message(previousHost) : labels.matchInProgress.message;

  return (
    <DialogFrame testId="external-conflict-dialog" title={title}>
      <p className="text-sm text-gray-300">{message}</p>
      <p className="mt-4 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-sm font-black text-orange-200">
        {labels.incoming(incomingPlayerNames)}
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <Button variant="secondary" onClick={onKeepCurrent} data-testid="external-conflict-keep">
          {isUnsentResult ? labels.unsentResult.keep : labels.matchInProgress.keep}
        </Button>
        {isUnsentResult && (
          <p className="-mt-1 text-[11px] font-bold uppercase tracking-widest text-gray-500">{labels.unsentResult.keepHint}</p>
        )}
        <Button variant="danger" onClick={onOpenLink} data-testid="external-conflict-open">
          {labels.open}
        </Button>
      </div>
    </DialogFrame>
  );
};
