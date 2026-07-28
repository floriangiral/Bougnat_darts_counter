import React from 'react';
import { BarChart3, CalendarDays, Gauge, Sparkles } from 'lucide-react';
import type { CoachHomeAction, CoachSessionPlan } from '../src/application/coach';

type CoachHomeViewProps = {
  onSelectAction: (action: CoachHomeAction) => void;
  onBack: () => void;
  pending: boolean;
  error: string | null;
  plan: CoachSessionPlan | null;
  coachDevConnected: boolean;
  coachDevAvailable: boolean;
  onConnectCoachDev: () => void;
  onDisconnectCoachDev: () => void;
};

const actions: Array<{ id: CoachHomeAction; label: string; description: string; icon: React.ReactNode }> = [
  {
    id: 'continue_program',
    label: 'Continuer mon programme de progression',
    description: 'Recommandation adaptee a votre etat de progression.',
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    id: 'work_skill',
    label: 'Travailler une competence',
    description: 'Focus precis sur une competence prioritaire.',
    icon: <Gauge className="h-5 w-5" />,
  },
  {
    id: 'prepare_competition',
    label: 'Preparer une competition',
    description: 'Charge ciblee pour arriver pret le jour J.',
    icon: <CalendarDays className="h-5 w-5" />,
  },
  {
    id: 'full_assessment',
    label: 'Faire une evaluation complete',
    description: 'Mesure globale pour recalibrer votre progression.',
    icon: <BarChart3 className="h-5 w-5" />,
  },
];

export const CoachHomeView: React.FC<CoachHomeViewProps> = ({ onSelectAction, onBack, pending, error, plan, coachDevConnected, coachDevAvailable, onConnectCoachDev, onDisconnectCoachDev }) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060b10] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(34,197,94,0.2),transparent_30%),radial-gradient(circle_at_90%_18%,rgba(14,165,233,0.16),transparent_26%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.04),transparent_34%)]" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-200 transition hover:border-cyan-300/40 hover:bg-white/[0.08]"
          >
            Retour
          </button>
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/80">Coach IA</span>
        </div>

        <div className="mt-8 text-center">
          <h1 className="text-balance text-3xl font-black uppercase tracking-[0.08em] text-white sm:text-4xl">Progression intelligente</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-300 sm:text-base">
            Choisissez votre objectif. Le Coach IA genere ensuite votre seance sans chat et sans saisie libre.
          </p>
        </div>

        {coachDevConnected && (
          <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-100" data-testid="coach-dev-session">
            <span className="font-black uppercase tracking-[0.14em]">Compte Coach dev connecte</span>
            <button
              type="button"
              onClick={onDisconnectCoachDev}
              className="rounded-lg border border-emerald-200/40 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-50 hover:bg-black/35"
            >
              Deconnecter
            </button>
          </div>
        )}

        {coachDevAvailable && !coachDevConnected && (
          <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-cyan-300/30 bg-cyan-500/10 px-4 py-3 text-xs text-cyan-100" data-testid="coach-dev-session-off">
            <span className="font-black uppercase tracking-[0.14em]">Compte Coach dev deconnecte</span>
            <button
              type="button"
              onClick={onConnectCoachDev}
              className="rounded-lg border border-cyan-200/40 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-50 hover:bg-black/35"
            >
              Connecter
            </button>
          </div>
        )}

        <div className="mt-8 grid gap-3 sm:mt-10">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={pending}
              onClick={() => onSelectAction(action.id)}
              className="group w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="flex items-start gap-4">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 text-cyan-200">
                  {action.icon}
                </span>
                <span>
                  <span className="block text-sm font-black uppercase tracking-[0.08em] text-white sm:text-base">{action.label}</span>
                  <span className="mt-1 block text-sm text-gray-300">{action.description}</span>
                </span>
              </div>
            </button>
          ))}
        </div>

        {pending && (
          <div className="mt-4 rounded-xl border border-cyan-300/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100" data-testid="coach-generation-loading">
            Generation de seance en cours...
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-100" data-testid="coach-generation-error">
            {error}
          </div>
        )}

        {plan && (
          <div className="mt-5 rounded-2xl border border-emerald-300/25 bg-emerald-500/10 p-5" data-testid="coach-generated-plan">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200/90">Plan genere</div>
            <div className="mt-1 text-lg font-black uppercase tracking-[0.08em] text-white">Seance {plan.action.replaceAll('_', ' ')}</div>
            <div className="mt-3 text-sm text-gray-100">{plan.rationale}</div>
            <div className="mt-4 grid gap-2">
              {plan.selectedExercises.map((exercise) => (
                <div key={exercise.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                  <div className="text-sm font-black uppercase tracking-[0.06em] text-white">{exercise.name}</div>
                  <div className="mt-1 text-xs text-gray-300">{exercise.durationMinutes} min - {exercise.objective}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
