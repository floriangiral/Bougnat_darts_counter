import React from 'react';
import { Check } from 'lucide-react';
import type { TriathlonPhase } from '../../src/features/triathlon/triathlonFlow';

type StepState = 'done' | 'current' | 'next' | 'upcoming';

const STEPS = [
  { key: 'capital', label: 'Capital' },
  { key: 'cricket', label: 'Cricket' },
  { key: 'x01', label: '501' },
] as const;

const TIE_BREAK_STEP = { key: 'tie-break', label: 'Départage' } as const;

const PHASE_STEP_INDEX: Record<TriathlonPhase, number> = {
  STARTING_DRAW: 0,
  CAPITAL: 0,
  TRANSITION_CRICKET: 1,
  CRICKET: 1,
  TRANSITION_X01: 2,
  X01: 2,
  TIE_BREAK_X01: 3,
};

const isWaitingPhase = (phase: TriathlonPhase) =>
  phase === 'STARTING_DRAW' || phase === 'TRANSITION_CRICKET' || phase === 'TRANSITION_X01';

// Indices non colorés : coche (terminée), ▶ et aria-current (en cours), « À suivre », opacité (à venir).
const STEP_TONES: Record<StepState, string> = {
  done: 'border-border-subtle bg-surface-tint text-fg-muted',
  current: 'border-game-triathlon-a bg-game-triathlon-a/15 text-game-triathlon-fg',
  next: 'border-dashed border-game-triathlon-a bg-surface-tint text-fg-soft',
  upcoming: 'border-border-subtle text-fg-faint',
};

const getStepState = (index: number, currentIndex: number, waiting: boolean): StepState => {
  if (index < currentIndex) return 'done';
  if (index > currentIndex) return 'upcoming';
  return waiting ? 'next' : 'current';
};

interface TriathlonPhaseBandProps {
  phase: TriathlonPhase;
}

/** Bandeau de progression des épreuves du Triathlon (spec 072 FR-06), au-dessus de l'épreuve en cours. */
export const TriathlonPhaseBand: React.FC<TriathlonPhaseBandProps> = ({ phase }) => {
  const currentIndex = PHASE_STEP_INDEX[phase];
  const isTieBreak = phase === 'TIE_BREAK_X01';
  const waiting = isWaitingPhase(phase);
  const steps = isTieBreak ? [...STEPS, TIE_BREAK_STEP] : STEPS;
  const eventNumber = Math.min(currentIndex + 1, STEPS.length);

  return (
    <nav
      aria-label="Progression du Triathlon"
      data-testid="triathlon-phase-band"
      data-phase={phase}
      className="triathlon-band flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border bg-surface px-2 py-1 sm:px-4"
    >
      <p className="shrink-0 text-[10px] font-black uppercase tracking-[0.2em] text-game-triathlon-fg sm:text-xs">
        Triathlon <span className="text-fg-subtle">· Épreuve {eventNumber}/{STEPS.length}</span>
      </p>
      <ol className="flex min-w-0 flex-wrap items-center gap-1">
        {steps.map((step, index) => {
          const state = getStepState(index, currentIndex, waiting);
          return (
            <li
              key={step.key}
              data-step={step.key}
              data-state={state}
              aria-current={state === 'current' ? 'step' : undefined}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] sm:text-xs ${STEP_TONES[state]}`}
            >
              {state === 'done' && <Check aria-hidden="true" className="h-3 w-3" />}
              {state === 'current' && <span aria-hidden="true">▶</span>}
              {step.label}
              {state === 'done' && <span className="sr-only"> (terminée)</span>}
              {state === 'next' && <span className="font-bold normal-case tracking-normal"> · à suivre</span>}
            </li>
          );
        })}
      </ol>
      {isTieBreak && (
        <p data-testid="triathlon-tie-break-note" className="min-w-0 text-[10px] font-bold text-fg-subtle sm:text-xs">
          <span className="font-black uppercase text-game-triathlon-fg">501 supplémentaire</span>
          {' '}: le gagnant du tir à la bulle ouvre ce match décisif.
        </p>
      )}
    </nav>
  );
};
