import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, Trophy } from 'lucide-react';
import { Button } from '../ui/Button';
import { FitText } from '../ui/FitText';
import {
  getChallengerContext,
  getChallengerFieldCount,
  getLeavingNames,
  getRemainingNames,
  validateChallengers,
  type TakeTheTableRequest,
} from '../../src/features/x01/challenger/x01Challenger';
import {
  addToChallengerQueue,
  computeWaitingList,
  includesChallengerName,
  moveUpInChallengerQueue,
  prefillChallengers,
  removeFromChallengerQueue,
  sanitizeChallengerQueue,
  X01_CHALLENGER_NAME_MAX_LENGTH,
  X01_CHALLENGER_QUEUE_MAX,
} from '../../src/features/x01/challenger/x01ChallengerQueue';
import { formatX01RankLabel } from '../../src/presentation/stats/x01RankingPresenter.fr';
import {
  formatChallengerError,
  formatLeavingLabel,
  formatNextInQueue,
  formatQueueAddError,
  X01_CHALLENGER_LABELS_FR as LABELS,
} from '../../src/presentation/stats/x01ChallengerLabels.fr';
import type { MatchState } from '../../types';

// Spec 137 : fenêtre « Qui prend la gagne ? » (RM-02, RM-04, RM-09 à RM-17, NFR-01 à NFR-03).

interface X01ChallengerDialogProps {
  match: MatchState;
  queue: readonly string[];
  returnFocus: HTMLElement | null;
  onLaunch: (request: TakeTheTableRequest) => void;
  onClose: () => void;
}

const inputClass = 'h-12 w-full min-w-0 rounded-xl border bg-surface-inset px-3 text-base font-black text-fg placeholder:text-fg-disabled focus:border-brand-border';
const smallButtonClass = 'min-h-11 shrink-0';
const sectionTitleClass = 'text-[11px] font-black uppercase tracking-[0.2em] text-fg-subtle';

export const X01ChallengerDialog: React.FC<X01ChallengerDialogProps> = ({ match, queue, returnFocus, onLaunch, onClose }) => {
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const context = useMemo(() => getChallengerContext(match), [match]);
  const [leaverIds, setLeaverIds] = useState<string[]>(context.defaultLeaverIds);
  const [draftQueue, setDraftQueue] = useState<string[]>(() => sanitizeChallengerQueue(queue));
  const [challengerNames, setChallengerNames] = useState<string[]>(() => prefillChallengers(
    draftQueue,
    getChallengerFieldCount(context, context.defaultLeaverIds),
    getRemainingNames(context, context.defaultLeaverIds),
  ));
  const [activeField, setActiveField] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [queueInput, setQueueInput] = useState('');
  const [queueError, setQueueError] = useState('');

  const remainingNames = getRemainingNames(context, leaverIds);
  const leavingNames = getLeavingNames(context, leaverIds);
  const errors = validateChallengers(challengerNames, remainingNames);
  const waitingList = computeWaitingList(draftQueue, challengerNames);
  const isQueueFull = waitingList.length >= X01_CHALLENGER_QUEUE_MAX;
  const orderedLeaverIds = context.leaverOptions.map((option) => option.id).filter((id) => leaverIds.includes(id));

  useEffect(() => {
    dialogRef.current?.querySelector<HTMLInputElement>('[data-challenger-field]')?.focus();
    return () => {
      if (returnFocus?.isConnected) returnFocus.focus();
    };
  }, [returnFocus]);

  const fieldId = (index: number) => `${baseId}-challenger-${index}`;
  const focusField = (index: number) => document.getElementById(fieldId(index))?.focus();

  const updateChallenger = (index: number, value: string) => {
    setChallengerNames((names) => names.map((name, position) => (position === index ? value : name)));
  };

  const toggleLeaver = (id: string, checked: boolean) => {
    if (checked) {
      const nextLeavers = [...leaverIds, id];
      const nextRemaining = getRemainingNames(context, nextLeavers);
      const next = computeWaitingList(draftQueue, challengerNames).find((name) => !includesChallengerName(nextRemaining, name)) ?? '';
      setLeaverIds(nextLeavers);
      setChallengerNames((names) => [...names, next]);
      return;
    }
    // RM-04 : la dernière case cochée ne se décoche pas.
    if (leaverIds.length <= 1) return;
    setLeaverIds(leaverIds.filter((leaverId) => leaverId !== id));
    setChallengerNames((names) => names.slice(0, -1));
    if (activeField !== null && activeField >= challengerNames.length - 1) setActiveField(null);
  };

  const applyShortcut = (name: string) => {
    const emptyIndex = challengerNames.findIndex((value) => value.trim().length === 0);
    const target = activeField ?? (emptyIndex >= 0 ? emptyIndex : null);
    if (target !== null) updateChallenger(target, name);
  };

  const addToQueue = (name: string) => {
    const result = addToChallengerQueue(draftQueue, name, { tableNames: remainingNames, challengerNames });
    if (!result.ok) {
      setQueueError(formatQueueAddError(result.error, name));
      return false;
    }
    setDraftQueue(result.queue);
    setQueueError('');
    return true;
  };

  const toggleLeaverInQueue = (name: string) => {
    if (includesChallengerName(draftQueue, name)) {
      setDraftQueue(removeFromChallengerQueue(draftQueue, name));
      setQueueError('');
    } else {
      addToQueue(name);
    }
  };

  const submitQueueInput = () => {
    if (addToQueue(queueInput)) setQueueInput('');
  };

  const launch = () => {
    setSubmitted(true);
    const firstInvalid = errors.findIndex((error) => error !== null);
    if (firstInvalid >= 0) {
      focusField(firstInvalid);
      return;
    }
    onLaunch({
      leaverIds: orderedLeaverIds,
      challengerNames: challengerNames.map((name) => name.trim()),
      queue: sanitizeChallengerQueue(waitingList),
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    } else if (event.key === 'Tab') {
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)') ?? []);
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

  const fieldLabel = (index: number) => {
    if (context.mode === 'doubles') return LABELS.challengerTeamPlayer(index + 1);
    return challengerNames.length > 1 ? LABELS.challengerNumbered(index + 1) : LABELS.challenger;
  };

  const leaverToggles = leavingNames.filter((name) => !includesChallengerName(challengerNames.filter(Boolean), name));

  return (
    <dialog
      ref={dialogRef}
      open
      aria-modal="true"
      aria-labelledby={titleId}
      data-testid="x01-challenger-dialog"
      onKeyDown={handleKeyDown}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="app-modal tablet-modal fixed inset-0 z-[90] m-0 flex h-full max-h-none w-full max-w-none items-center justify-center border-0 bg-scrim p-3 text-fg backdrop-blur-sm sm:p-4"
    >
      <div className="flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border-strong bg-surface shadow-elevated">
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <h2 id={titleId} className="text-xl font-black">{LABELS.title}</h2>

          <div data-testid="x01-challenger-winner" className="mt-3 flex min-w-0 items-center gap-2 rounded-xl border border-game-win bg-surface-raised px-3 py-2">
            <Trophy aria-hidden="true" className="h-5 w-5 shrink-0 text-game-win" />
            <FitText as="span" className="flex-1 text-base font-black">{context.winner.name}</FitText>
            <span className="shrink-0 text-[11px] font-black uppercase tracking-widest text-game-win">{LABELS.winnerTag}</span>
          </div>

          {context.mode === 'multi' ? (
            <fieldset className="mt-3">
              <legend className={sectionTitleClass}>{LABELS.leaversLegend}</legend>
              <div className="mt-1 grid gap-1">
                {context.leaverOptions.map((option) => {
                  const checked = leaverIds.includes(option.id);
                  return (
                    <label key={option.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-surface-tint">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={checked && leaverIds.length <= 1}
                        onChange={(event) => toggleLeaver(option.id, event.target.checked)}
                        className="h-5 w-5 shrink-0 accent-challenge"
                      />
                      <span className="w-12 shrink-0 text-xs font-bold text-fg-subtle">{formatX01RankLabel(option.rank, option.isTied)}</span>
                      <FitText as="span" className="flex-1 text-sm font-black">{option.name}</FitText>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ) : (
            <p data-testid="x01-challenger-leaving" className="mt-3 text-sm font-bold text-fg-muted">{formatLeavingLabel(leavingNames)}</p>
          )}

          <div className="mt-3 grid gap-3">
            {context.mode === 'doubles' && <p className={sectionTitleClass}>{LABELS.challengerTeam}</p>}
            {challengerNames.map((name, index) => {
              const error = submitted ? errors[index] : null;
              const errorId = `${fieldId(index)}-error`;
              const isLast = index === challengerNames.length - 1;
              return (
                <div key={fieldId(index)} className="grid gap-1">
                  <label htmlFor={fieldId(index)} className="text-sm font-bold text-fg-soft">{fieldLabel(index)}</label>
                  <input
                    id={fieldId(index)}
                    data-challenger-field
                    type="text"
                    value={name}
                    maxLength={X01_CHALLENGER_NAME_MAX_LENGTH}
                    autoComplete="off"
                    enterKeyHint={isLast ? 'go' : 'next'}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : undefined}
                    onFocus={() => setActiveField(index)}
                    onChange={(event) => updateChallenger(index, event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter') return;
                      event.preventDefault();
                      if (isLast) launch();
                      else focusField(index + 1);
                    }}
                    className={`${inputClass} ${error ? 'border-danger-border' : 'border-border-subtle'}`}
                  />
                  {error && (
                    <p id={errorId} role="alert" className="text-sm font-bold text-danger-fg">{formatChallengerError(error)}</p>
                  )}
                </div>
              );
            })}
          </div>

          {leavingNames.length > 0 && (
            <div role="group" aria-label={LABELS.shortcuts} className="mt-2 flex flex-wrap gap-2">
              {leavingNames.map((name, index) => (
                <Button
                  key={`${name}-${index}`}
                  variant="secondary"
                  size="sm"
                  aria-label={LABELS.shortcutLabel(name)}
                  onClick={() => applyShortcut(name)}
                  className={`${smallButtonClass} normal-case`}
                >
                  {name}
                </Button>
              ))}
            </div>
          )}

          <section aria-labelledby={`${baseId}-queue`} className="mt-4 border-t border-border-subtle pt-3">
            <h3 id={`${baseId}-queue`} className={sectionTitleClass}>{LABELS.queueTitle}</h3>
            <p data-testid="x01-challenger-next" aria-live="polite" className="mt-1 text-sm font-bold text-fg">{formatNextInQueue(waitingList)}</p>
            {waitingList.length > 0 && (
              <ol data-testid="x01-challenger-queue" className="mt-2 grid gap-1">
                {waitingList.map((name, index) => (
                  <li key={name} className="flex min-w-0 items-center gap-2 rounded-lg bg-surface-tint px-2 py-1">
                    <span aria-hidden="true" className="w-5 shrink-0 text-xs font-bold text-fg-subtle">{index + 1}.</span>
                    <FitText as="span" className="flex-1 text-sm font-black">{name}</FitText>
                    {index > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={LABELS.queueMoveUpLabel(name)}
                        onClick={() => setDraftQueue(moveUpInChallengerQueue(draftQueue, name, challengerNames))}
                        className={smallButtonClass}
                      >
                        {LABELS.queueMoveUp}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={LABELS.queueRemoveLabel(name)}
                      onClick={() => {
                        setDraftQueue(removeFromChallengerQueue(draftQueue, name));
                        setQueueError('');
                      }}
                      className={smallButtonClass}
                    >
                      {LABELS.queueRemove}
                    </Button>
                  </li>
                ))}
              </ol>
            )}
            <div className="mt-2 grid gap-1">
              <label htmlFor={`${baseId}-queue-input`} className="text-sm font-bold text-fg-soft">{LABELS.queueAddLabel}</label>
              <div className="flex gap-2">
                <input
                  id={`${baseId}-queue-input`}
                  type="text"
                  value={queueInput}
                  maxLength={X01_CHALLENGER_NAME_MAX_LENGTH}
                  autoComplete="off"
                  enterKeyHint="done"
                  aria-invalid={queueError ? true : undefined}
                  aria-describedby={queueError ? `${baseId}-queue-error` : undefined}
                  onFocus={() => setActiveField(null)}
                  onChange={(event) => setQueueInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter') return;
                    event.preventDefault();
                    submitQueueInput();
                  }}
                  className={`${inputClass} ${queueError ? 'border-danger-border' : 'border-border-subtle'}`}
                />
                <Button variant="secondary" size="sm" onClick={submitQueueInput} className={`${smallButtonClass} h-12`}>
                  {LABELS.queueAdd}
                </Button>
              </div>
              {queueError && (
                <p id={`${baseId}-queue-error`} role="alert" className="text-sm font-bold text-danger-fg">{queueError}</p>
              )}
            </div>
            {leaverToggles.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {leaverToggles.map((name) => {
                  const pressed = includesChallengerName(draftQueue, name);
                  return (
                    <Button
                      key={name}
                      variant="secondary"
                      size="sm"
                      aria-pressed={pressed}
                      disabled={!pressed && isQueueFull}
                      onClick={() => toggleLeaverInQueue(name)}
                      className={`${smallButtonClass} normal-case ${pressed ? 'border-challenge-border text-challenge-fg' : ''}`}
                    >
                      {pressed && <Check aria-hidden="true" className="mr-1 h-4 w-4 shrink-0" />}
                      {LABELS.queueAddLeaver(name)}
                    </Button>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-border-subtle bg-surface p-3">
          <Button variant="secondary" size="sm" onClick={onClose} className="min-h-11 w-full">{LABELS.cancel}</Button>
          <Button variant="challenge" size="sm" onClick={launch} data-testid="x01-challenger-launch" className="min-h-11 w-full">{LABELS.launch}</Button>
        </div>
      </div>
    </dialog>
  );
};
