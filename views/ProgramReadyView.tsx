import React from 'react';
import { ArrowLeft, CalendarDays, CheckCircle2, Sparkles, Target, Timer } from 'lucide-react';
import type { TrainingProgram } from '../src/application/coach';

type ProgramReadyViewProps = {
  program: TrainingProgram | null;
  pending: boolean;
  onStart: () => void;
  onBack: () => void;
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Debutant',
  intermediate: 'Intermediaire',
  advanced: 'Avance',
};

const formatDate = (value: string): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};

export const ProgramReadyView: React.FC<ProgramReadyViewProps> = ({ program, pending, onStart, onBack }) => {
  const cycle = program?.cycles?.[0] ?? null;
  const session = cycle?.sessions?.[0] ?? null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060b10] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(34,197,94,0.22),transparent_32%),radial-gradient(circle_at_88%_16%,rgba(14,165,233,0.16),transparent_28%)]" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-200 hover:bg-white/[0.08]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Retour
          </button>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200/80">
            <Sparkles className="h-3.5 w-3.5" /> Programme
          </span>
        </div>

        {pending && !program ? (
          <div className="mt-16 flex flex-1 flex-col items-center justify-center text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-emerald-300" />
            <div className="mt-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-300">
              Generation de votre programme
            </div>
          </div>
        ) : !program || !cycle ? (
          <div className="mt-16 flex flex-1 flex-col items-center justify-center text-center">
            <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              Programme indisponible pour le moment. Revenez a l accueil du Coach.
            </div>
            <button
              type="button"
              onClick={onBack}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-gray-200 hover:bg-white/[0.08]"
            >
              <ArrowLeft className="h-4 w-4" /> Accueil Coach
            </button>
          </div>
        ) : (
          <div className="mt-8 flex flex-1 flex-col" data-testid="program-ready">
            <div className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-5 py-7 text-center">
              <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-300" />
              <h1 className="mt-3 text-2xl font-black uppercase tracking-[0.06em] text-white">
                Votre programme est pret
              </h1>
              <div className="mt-2 inline-flex items-center gap-1.5 text-sm font-black uppercase tracking-[0.12em] text-emerald-100">
                <Target className="h-4 w-4" /> Niveau: {LEVEL_LABELS[program.level] ?? program.level ?? 'A definir'}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200/80">
                  Cycle {cycle.cycleOrder}
                </div>
                {cycle.startsOn || cycle.endsOn ? (
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDate(cycle.startsOn)} - {formatDate(cycle.endsOn)}
                  </div>
                ) : null}
              </div>
              <div className="mt-1 text-lg font-black uppercase tracking-[0.04em] text-white">{cycle.focus}</div>
            </div>

            {session ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200/80">
                  Seance {session.order}
                </div>
                <div className="mt-1 text-base font-black text-white">{session.name}</div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-300">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5">
                    <Target className="h-3.5 w-3.5 text-cyan-200" /> {session.focus}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5">
                    <Timer className="h-3.5 w-3.5 text-emerald-200" /> {session.durationMinutes} min
                  </span>
                </div>
              </div>
            ) : null}

            <div className="mt-auto pt-8">
              <button
                type="button"
                onClick={onStart}
                data-testid="program-start"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300/30 bg-emerald-500/15 px-5 py-3.5 text-sm font-black uppercase tracking-[0.14em] text-emerald-50 hover:bg-emerald-500/25"
              >
                <Sparkles className="h-4 w-4" /> Commencer ma progression
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
