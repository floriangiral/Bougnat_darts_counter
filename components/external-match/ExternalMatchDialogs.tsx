// Spec: spec:counter/external-match-link
//
// Dialogs of the external match link: leaving a linked match (abandon or unsent result)
// and opening a new link over a match in progress. Pure composition, the decisions are
// taken by the caller through the callbacks.
import React from 'react';

import { Button } from '../ui/Button';
import type { ExternalLinkIssue } from '../../src/features/external-match/externalMatchLink';
import type { ExternalLinkConflict } from '../../src/features/external-match/externalMatchStartup';
import {
  EXTERNAL_MATCH_LABELS_FR,
  getInvalidExternalLinkMessage,
} from '../../src/presentation/externalMatch/externalMatchLabels.fr';

export type ExternalLeaveKind = 'abandon' | 'unsent-result';

interface DialogFrameProps {
  testId: string;
  title: string;
  children: React.ReactNode;
}

// Above every game overlay, including the starting player overlay (z-[120]): leaving a
// linked match from "Qui commence ?" opens the leave dialog, which must not be hidden.
const DialogFrame: React.FC<DialogFrameProps> = ({ testId, title, children }) => (
  <dialog
    open
    aria-label={title}
    data-testid={testId}
    data-modal-size="medium"
    className="app-modal tablet-modal fixed inset-0 z-[130] m-0 flex h-full max-h-none w-full max-w-none items-center justify-center border-0 bg-overlay p-4 text-fg backdrop-blur-sm"
  >
    <div className="external-dialog-panel w-full max-w-md rounded-xl border border-border-strong bg-surface p-6 text-center">
      <h3 className="modal-title mb-3 text-2xl font-black uppercase italic text-fg">{title}</h3>
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
      <p className="text-sm text-fg-muted">{copy.message(host)}</p>
      <div className="mt-6 flex flex-col gap-3">
        {onNotify && (
          <>
            <Button variant="primary" onClick={onNotify} data-testid="external-leave-notify">
              {copy.notify(host)}
            </Button>
            <p className="-mt-1 text-[11px] font-bold uppercase tracking-widest text-fg-faint">{copy.notifyHint(host)}</p>
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
      <p className="text-sm text-fg-muted">{message}</p>
      <p className="mt-4 rounded-lg border border-brand-border bg-brand-subtle px-3 py-2 text-sm font-black text-brand-fg-faint">
        {labels.incoming(incomingPlayerNames)}
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <Button variant="secondary" onClick={onKeepCurrent} data-testid="external-conflict-keep">
          {isUnsentResult ? labels.unsentResult.keep : labels.matchInProgress.keep}
        </Button>
        {isUnsentResult && (
          <p className="-mt-1 text-[11px] font-bold uppercase tracking-widest text-fg-faint">{labels.unsentResult.keepHint}</p>
        )}
        <Button variant="danger" onClick={onOpenLink} data-testid="external-conflict-open">
          {labels.open}
        </Button>
      </div>
    </DialogFrame>
  );
};

interface ExternalLinkIssueDialogProps {
  issue: ExternalLinkIssue;
  /** Host of a rejected return URL, when known */
  returnHost?: string;
  onClose: () => void;
}

export const ExternalLinkIssueDialog: React.FC<ExternalLinkIssueDialogProps> = ({ issue, returnHost, onClose }) => {
  const labels = EXTERNAL_MATCH_LABELS_FR.invalidLink;
  return (
    <DialogFrame testId="external-link-issue-dialog" title={labels.title}>
      <p className="text-sm font-bold text-fg" data-issue={issue}>{getInvalidExternalLinkMessage(issue, returnHost)}</p>
      <p className="mt-3 text-xs text-fg-subtle">{labels.footer}</p>
      <div className="mt-6 flex flex-col gap-3">
        <Button variant="primary" onClick={onClose} data-testid="external-link-issue-close">
          {labels.close}
        </Button>
      </div>
    </DialogFrame>
  );
};
