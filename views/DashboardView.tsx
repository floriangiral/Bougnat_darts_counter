import React from 'react';
import { Button } from '../components/ui/Button';
import { getUserProfile } from '../src/lib/userProfile';

interface DashboardViewProps {
  user: any;
  onPlay: () => void;
  onHistory: () => void;
  onStats: () => void;
  onProfile: () => void;
  onLogout: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user, onPlay, onHistory, onStats, onProfile, onLogout,
}) => {
  const { username, avatarUrl } = getUserProfile(user);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4 sm:p-6 flex flex-col">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative">
            <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.4)] bg-gray-800 sm:h-16 sm:w-16">
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900" />
          </div>
          <div>
            <h1 className="text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 sm:text-2xl">
              BONJOUR,
            </h1>
            <h2 className="text-lg font-black text-orange-500 uppercase tracking-wider sm:text-xl">
              {username}
            </h2>
          </div>
        </div>

        <button onClick={onLogout} className="self-end text-gray-500 hover:text-white transition-colors sm:self-auto">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>

      <div className="mb-8 transform transition-transform hover:scale-[1.02]">
        <Button
          onClick={onPlay}
          className="relative w-full overflow-hidden border-t border-orange-400/20 py-7 text-2xl shadow-2xl shadow-orange-900/30 group sm:py-10 sm:text-4xl"
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          <span className="relative z-10 flex items-center gap-3 sm:gap-4">
            <span className="text-3xl group-hover:rotate-12 transition-transform duration-300 sm:text-5xl">🎯</span>
            JOUER
          </span>
        </Button>
      </div>

      <div className="grid w-full max-w-lg grid-cols-1 gap-4 mx-auto sm:grid-cols-2">
        <MenuCard title="Mes Stats" icon="📊" desc="Moyennes et records" onClick={onStats} color="blue" />
        <MenuCard title="Historique" icon="clock" desc="Journal des matchs" onClick={onHistory} color="green" isSvg />
        <MenuCard title="Mon Compte" icon="user" desc="Details du profil" onClick={onProfile} color="purple" isSvg />
      </div>

      <div className="mt-auto text-center pt-8 pb-4">
        <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">
          Membre du Bougnat Darts Club
        </p>
      </div>
    </div>
  );
};

const MenuCard = ({ title, icon, desc, onClick, color, isSvg = false }: any) => {
  const colors: any = {
    blue: 'hover:border-blue-500/50 hover:shadow-blue-900/20',
    green: 'hover:border-green-500/50 hover:shadow-green-900/20',
    purple: 'hover:border-purple-500/50 hover:shadow-purple-900/20',
  };

  return (
    <button
      onClick={onClick}
      className={`
        bg-gray-800/40 border border-gray-800 rounded-xl p-4 text-left transition-all duration-300 hover:bg-gray-800 group
        ${colors[color]} hover:shadow-lg hover:-translate-y-1
      `}
    >
      <div className="mb-3 text-3xl text-gray-400 group-hover:text-white transition-colors">
        {isSvg ? <Icon name={icon} /> : icon}
      </div>
      <div className="font-black text-lg text-gray-200 group-hover:text-white uppercase leading-none mb-1">
        {title}
      </div>
      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
        {desc}
      </div>
    </button>
  );
};

const Icon = ({ name }: { name: string }) => {
  if (name === 'clock') {
    return <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  }
  if (name === 'user') {
    return <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
  }
  return null;
};
