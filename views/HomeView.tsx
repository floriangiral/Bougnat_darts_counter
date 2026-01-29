import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { checkConnection } from '../lib/supabase';

interface HomeViewProps {
  onQuickGame: () => void;
  onLogin: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onQuickGame, onLogin }) => {
  const [imageError, setImageError] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [dbStatus, setDbStatus] = useState<'checking' | 'ok' | 'error'>('checking');

  useEffect(() => {
    checkConnection().then(isConnected => {
      setDbStatus(isConnected ? 'ok' : 'error');
    });
  }, []);

  const appUrl = "https://bougnat-darts-dartmaster-x01-532599512173.us-west1.run.app/";
  // Generate a high-contrast QR code (black on white) for reliable scanning in dark environments
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(appUrl)}&bgcolor=ffffff&margin=5`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-8 bg-gradient-to-br from-gray-900 to-black overflow-y-auto">
      
      {/* Logo Section */}
      <div className="flex flex-col items-center transform transition-all duration-700 hover:scale-105 min-h-[200px] justify-center shrink-0">
        {!imageError ? (
            <img 
                src="/logo.svg" 
                alt="Bougnat Darts" 
                className="w-full max-w-[280px] md:max-w-[400px] h-auto object-contain drop-shadow-[0_0_30px_rgba(234,88,12,0.4)]"
                onError={() => setImageError(true)}
            />
        ) : (
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
      <div className="flex flex-col w-full max-w-xs space-y-4 z-10 shrink-0">
        <Button 
            variant="primary" 
            size="lg" 
            onClick={onQuickGame} 
            className="w-full h-16 text-xl font-black uppercase tracking-wider bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 border-none shadow-[0_5px_15px_rgba(234,88,12,0.4)]"
        >
          Quick Game
        </Button>
        
        <div className="relative group">
            <Button 
                variant="secondary" 
                size="lg" 
                disabled={true}
                className="w-full h-16 text-lg font-bold uppercase tracking-wider border-gray-700 opacity-50 cursor-not-allowed flex items-center justify-center gap-3"
            >
              <span className="text-xl">👤</span>
              <span>Login / Sign Up</span>
            </Button>
            {/* Value Prop Badge */}
            <div className="absolute -top-3 -right-2 bg-gray-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-lg transform rotate-3 border border-gray-500/30">
                COMING SOON
            </div>
        </div>
      </div>

      {/* QR Code Toggle Section */}
      <div className="flex flex-col items-center space-y-4 shrink-0 w-full pt-4">
          <button 
            onClick={() => setShowQr(!showQr)}
            className="text-gray-500 hover:text-orange-500 text-xs uppercase font-bold tracking-[0.2em] transition-colors flex items-center gap-2 group"
          >
             <span className="text-xl group-hover:scale-110 transition-transform">📱</span> {showQr ? 'Hide App Link' : 'Get the App'}
          </button>

          {showQr && (
            <div className="bg-white p-2 rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.15)] animate-in fade-in zoom-in duration-300">
                <img 
                    src={qrUrl} 
                    alt="Scan to open App" 
                    className="w-32 h-32 md:w-40 md:h-40"
                    loading="lazy"
                />
            </div>
          )}
      </div>

      {/* Footer Info & Connection Status */}
      <div className="text-gray-600 text-[10px] text-center font-mono shrink-0 flex flex-col items-center gap-2">
        <p>Powered by DartMaster Engine • v1.1.0</p>
        
        {/* DB Status Indicator */}
        <div className="flex items-center gap-2 bg-gray-900/50 px-3 py-1 rounded-full border border-gray-800">
            <div className={`w-2 h-2 rounded-full ${
                dbStatus === 'checking' ? 'bg-yellow-500 animate-pulse' :
                dbStatus === 'ok' ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.6)]' :
                'bg-red-500'
            }`}></div>
            <span className="uppercase tracking-widest font-bold text-[9px] text-gray-500">
                {dbStatus === 'checking' ? 'CONNECTING...' :
                 dbStatus === 'ok' ? 'SYSTEM ONLINE' : 
                 'OFFLINE MODE'}
            </span>
        </div>
      </div>
    </div>
  );
};