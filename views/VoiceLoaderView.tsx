import React, { useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface VoiceLoaderViewProps {
  onLoaded: () => void;
  onSkip: () => void;
}

export const VoiceLoaderView: React.FC<VoiceLoaderViewProps> = ({ onLoaded, onSkip }) => {
  const { isModelLoaded, isModelMissing, isLoadingModel, logs, error } = useSpeechRecognition();

  useEffect(() => {
    if (isModelLoaded) {
      const timer = setTimeout(() => {
        onLoaded();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isModelLoaded, onLoaded]);

  return (
    <div className="min-h-screen bg-black font-mono text-green-500 p-6 flex flex-col relative overflow-hidden">
        
        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_4px,3px_100%]"></div>
        
        <div className="z-10 mb-6 border-b border-green-900 pb-2 flex justify-between items-end">
            <div>
                <h1 className="text-xl font-bold uppercase tracking-widest">System Boot</h1>
                <h2 className="text-xs text-green-800">Voice Recognition Engine v0.3</h2>
            </div>
            <div className={`text-xs font-bold px-2 py-1 rounded ${isLoadingModel ? 'bg-yellow-900/50 text-yellow-500' : isModelLoaded ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-500'}`}>
                {isLoadingModel ? 'SEARCHING...' : isModelLoaded ? 'READY' : 'ERROR'}
            </div>
        </div>

        <div className="flex-1 bg-gray-900/50 border border-green-900/50 rounded p-4 overflow-y-auto mb-6 custom-scrollbar font-mono text-xs md:text-sm shadow-inner z-10">
            {logs.length === 0 && <div className="animate-pulse">Initializing path hunter...</div>}
            
            {logs.map((log, idx) => (
                <div key={idx} className={`mb-1 break-words ${log.includes('❌') ? 'text-red-500' : log.includes('✅') ? 'text-green-400 font-bold' : ''}`}>
                    <span className="opacity-50 mr-2">{'>'}</span>
                    {log}
                </div>
            ))}
            
            <div className="animate-pulse inline-block w-2 h-4 bg-green-500 align-middle ml-1"></div>
        </div>

        <div className="z-10 flex flex-col gap-3">
            {isModelMissing && (
                <div className="bg-red-900/20 border border-red-800 p-4 rounded text-red-400 text-xs mb-2">
                    <strong className="block mb-2 text-red-500 text-sm uppercase">⚠️ Model Unreachable</strong>
                    Impossible de trouver le fichier du modèle vocal.
                    
                    <div className="mt-3 bg-black/50 p-2 rounded border border-red-900/50 font-mono text-[10px] md:text-xs text-gray-400 leading-relaxed">
                        <div>Le système a tenté de charger le fichier depuis plusieurs emplacements (local et externe) sans succès.</div>
                        <br/>
                        <div>Cela peut être dû à une restriction réseau ou une mauvaise configuration du déploiement.</div>
                    </div>
                </div>
            )}

            {isModelLoaded ? (
                 <Button onClick={onLoaded} className="w-full bg-green-600 hover:bg-green-500 text-black border-none shadow-[0_0_15px_rgba(34,197,94,0.6)] animate-pulse">
                    LAUNCH MATCH
                 </Button>
            ) : (
                <Button variant="secondary" onClick={onSkip} className="w-full border-green-900 text-green-700 hover:text-green-400 hover:bg-green-900/20">
                    {isLoadingModel ? 'CANCEL & PLAY OFFLINE' : 'CONTINUE WITHOUT VOICE'}
                </Button>
            )}
        </div>
    </div>
  );
};