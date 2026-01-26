import React, { useState } from 'react';
import { Button } from '../components/ui/Button';

interface HomeViewProps {
  onQuickGame: () => void;
  onLogin: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onQuickGame, onLogin }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-10 bg-gradient-to-br from-gray-900 to-black">
      
      {/* Logo Section */}
      <div className="flex flex-col items-center transform transition-all duration-700 hover:scale-105 min-h-[250px] justify-center">
        {!imageError ? (
            <img 
                src="/logo.svg" 
                alt="Bougnat Darts" 
                className="w-full max-w-[320px] md:max-w-[450px] h-auto object-contain drop-shadow-[0_0_30px_rgba(234,88,12,0.4)]"
                onError={() => setImageError(true)}
            />
        ) : (
            // Fallback Text Logo if image fails
            <div className="flex flex-col items-center">
                <h1 className="text-6xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">
                BOUGNAT
                </h1>
                <h2 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 tracking-tighter transform -skew-x-12 -mt-4 drop-shadow-[0_0_15px_rgba(234,88,12,0.6)]">
                DARTS
                </h2>
            </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col w-full max-w-xs space-y-4 z-10">
        <Button 
            variant="primary" 
            size="lg" 
            onClick={onQuickGame} 
            className="w-full h-16 text-xl font-black uppercase tracking-wider bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 border-none shadow-[0_5px_15px_rgba(234,88,12,0.4)]"
        >
          Quick Game
        </Button>
        <Button 
            variant="secondary" 
            size="lg" 
            onClick={onLogin} 
            className="w-full h-16 text-xl font-bold uppercase tracking-wider border-gray-700 hover:bg-gray-800"
        >
          Login
        </Button>
      </div>

      <div className="absolute bottom-6 text-gray-600 text-xs text-center font-mono">
        <p>Powered by DartMaster Engine • v1.0.1</p>
      </div>
    </div>
  );
};