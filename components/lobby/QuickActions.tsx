import React from 'react';
import { ChevronRight, Play, RefreshCw, Swords, UsersRound } from 'lucide-react';

type QuickAction = {
  label: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
};

interface QuickActionsProps {
  onNewGame: () => void;
  onResume: () => void;
  onJoinWithCode: () => void;
  onChallengeFriend: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onNewGame,
  onResume,
  onJoinWithCode,
  onChallengeFriend,
}) => {
  const actions: QuickAction[] = [
    { label: 'Nouvelle Partie', description: 'Lancer directement la configuration d\'arena', icon: <Play className="h-5 w-5" />, onClick: onNewGame },
    { label: 'Reprendre', description: 'Continuer ton dernier parcours prepare', icon: <RefreshCw className="h-5 w-5" />, onClick: onResume },
    { label: 'Rejoindre Avec Un Code', description: 'Rejoindre rapidement une salle privee', icon: <UsersRound className="h-5 w-5" />, onClick: onJoinWithCode },
    { label: 'Defier Un Ami', description: 'Lancer un duel direct et competitif', icon: <Swords className="h-5 w-5" />, onClick: onChallengeFriend },
  ];

  return (
    <section className="rounded-[2rem] border border-white/10 bg-[#101722]/86 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-6">
      <div className="mb-4">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">Actions Rapides</p>
        <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">A Toi L'Oche</h2>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="group rounded-[1.5rem] border border-white/8 bg-black/20 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-orange-400/30 hover:bg-white/[0.05]"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 text-orange-300">
              {action.icon}
            </div>
            <div className="mb-2 text-sm font-black uppercase tracking-[0.16em] text-white">{action.label}</div>
            <div className="text-sm leading-6 text-gray-400">{action.description}</div>
            <div className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-orange-300">
              Ouvrir
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};
