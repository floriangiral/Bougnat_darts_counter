import React from 'react';
import { Button } from '../components/ui/Button';

interface DashboardViewProps {
  user: any;
  onPlay: () => void;
  onHistory: () => void;
  onStats: () => void;
  onProfile: () => void;
  onSettings: () => void;
  onLogout: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  user, onPlay, onHistory, onStats, onProfile, onSettings, onLogout 
}) => {
  // Extract username from metadata or fallback to email
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Player';
  
  // Use explicit seed if available, otherwise fallback to username
  const seed = user?.user_metadata?.avatar_seed || username;
  
  // Generate Avatar URL based on seed (DiceBear API)
  const avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6 flex flex-col">
      
      {/* --- HEADER SECTION --- */}
      <div className="flex justify-between items-center mb-8">
         <div className="flex items-center gap-4">
            <div className="relative">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.4)] bg-gray-800">
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
            </div>
            <div>
                <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                    HELLO,
                </h1>
                <h2 className="text-xl font-black text-orange-500 uppercase tracking-wider">
                    {username}
                </h2>
            </div>
         </div>
         
         <button onClick={onLogout} className="text-gray-500 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
         </button>
      </div>

      {/* --- MAIN ACTION --- */}
      <div className="mb-8 transform transition-transform hover:scale-[1.02]">
        <Button 
            onClick={onPlay} 
            className="w-full py-10 text-4xl shadow-2xl shadow-orange-900/30 border-t border-orange-400/20 relative overflow-hidden group"
        >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
            <span className="relative z-10 flex items-center gap-4">
                <span className="text-5xl group-hover:rotate-12 transition-transform duration-300">🎯</span> 
                PLAY NOW
            </span>
        </Button>
      </div>

      {/* --- GRID MENU --- */}
      <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto w-full">
         
         <MenuCard 
            title="My Stats" 
            icon="📊" 
            desc="Averages & PBs" 
            onClick={onStats} 
            color="blue"
         />
         
         <MenuCard 
            title="History" 
            icon="clock" 
            desc="Match Logs" 
            onClick={onHistory} 
            color="green"
            isSvg
         />

         <MenuCard 
            title="My Account" 
            icon="user" 
            desc="Profile Details" 
            onClick={onProfile} 
            color="purple"
            isSvg
         />

         <MenuCard 
            title="Settings" 
            icon="cog" 
            desc="App Config" 
            onClick={onSettings} 
            color="gray"
            isSvg
         />

      </div>

      {/* --- FOOTER --- */}
      <div className="mt-auto text-center pt-8 pb-4">
          <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">
              Bougnat Darts Club Member
          </p>
      </div>
    </div>
  );
};

// Helper Component for the Grid
const MenuCard = ({ title, icon, desc, onClick, color, isSvg = false }: any) => {
    const colors: any = {
        blue: "hover:border-blue-500/50 hover:shadow-blue-900/20",
        green: "hover:border-green-500/50 hover:shadow-green-900/20",
        purple: "hover:border-purple-500/50 hover:shadow-purple-900/20",
        gray: "hover:border-gray-500/50 hover:shadow-gray-900/20",
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
                {isSvg ? (
                    <Icon name={icon} />
                ) : (
                    icon
                )}
            </div>
            <div className="font-black text-lg text-gray-200 group-hover:text-white uppercase leading-none mb-1">
                {title}
            </div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                {desc}
            </div>
        </button>
    );
}

const Icon = ({ name }: { name: string }) => {
    if (name === 'clock') {
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    }
    if (name === 'user') {
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
    }
    if (name === 'cog') {
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    }
    return null;
}