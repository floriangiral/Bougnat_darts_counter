
import React from 'react';
import { Button } from './Button';

interface ChangelogModalProps {
  onClose: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-800 bg-gray-950 flex justify-between items-center rounded-t-2xl">
            <h3 className="text-lg font-black italic text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500 uppercase tracking-wider">
                Notes de version
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-2xl leading-none">&times;</button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
            
            {/* FUTURE - Version 2.0 */}
            <div className="relative border-l-2 border-blue-500/50 border-dashed pl-4 ml-2 bg-blue-900/10 rounded-r-lg p-2">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-gray-900 animate-pulse"></div>
                <div className="flex justify-between items-baseline mb-2">
                    <span className="text-blue-400 font-black text-lg italic">Prochainement : Bêta 2.0</span>
                    <span className="text-[10px] bg-blue-900 text-blue-300 px-2 py-0.5 rounded border border-blue-800 uppercase font-bold">Roadmap</span>
                </div>
                
                <div className="space-y-2">
                    <p className="text-xs text-gray-400 mb-2">Fonctionnalités en cours de développement :</p>
                    <ul className="text-sm text-gray-300 space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-blue-500 mt-0.5">📱</span>
                            <span><b>QR Code Stats :</b> Export des stats de fin de match vers mobile.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">📡</span>
                            <span><b>Live Spectateur :</b> QR Code pour suivre le match en direct (Cast).</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">🎮</span>
                            <span><b>Nouveaux Modes :</b> Cricket, Tour d'horloge (Around the Clock), Shanghai.</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* CURRENT - Version 1.0 */}
            <div className="relative border-l-2 border-orange-500 pl-4 ml-2">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-orange-500 border-2 border-gray-900"></div>
                <div className="flex justify-between items-baseline mb-2">
                    <span className="text-white font-black text-lg">Version Bêta 1.0</span>
                    <span className="text-xs text-gray-500 font-mono">02/02/2026</span>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <h4 className="text-cyan-500 text-xs font-bold uppercase tracking-widest mb-1">✨ Fonctionnalités</h4>
                        <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside marker:text-cyan-500/50">
                            <li>Lancement officiel de l'App Bougnat Darts.</li>
                            <li>Moteur X01 complet (301, 501, 701, 1001).</li>
                            <li>Support du mode <b>Double In / Double Out</b>.</li>
                            <li>Reconnaissance Vocale native (Web Speech API).</li>
                            <li>Mode "Doubles" (2v2) avec gestion des tours.</li>
                            <li>Calcul des statistiques en temps réel (Avg, Checkout %).</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="text-green-500 text-xs font-bold uppercase tracking-widest mb-1">🚀 Améliorations</h4>
                        <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside marker:text-green-500/50">
                            <li>Optimisation massive de l'affichage mobile (Scores 25vw).</li>
                            <li>Fluidité de l'interface en 60fps.</li>
                            <li>Synchronisation Cloud via Supabase.</li>
                        </ul>
                    </div>

                    <div>
                         <h4 className="text-purple-500 text-xs font-bold uppercase tracking-widest mb-1">🐛 Correctifs</h4>
                         <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside marker:text-purple-500/50">
                            <li>Correction du positionnement de la pilule de score sur petits écrans.</li>
                            <li>Stabilisation de l'écoute active du micro.</li>
                         </ul>
                    </div>
                </div>
            </div>

            {/* Version Alpha (History) */}
            <div className="relative border-l-2 border-gray-800 pl-4 ml-2 opacity-50 grayscale hover:grayscale-0 transition-all">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gray-700 border-2 border-gray-900"></div>
                <div className="flex justify-between items-baseline mb-2">
                    <span className="text-gray-400 font-bold text-sm">Version Alpha 0.2</span>
                    <span className="text-xs text-gray-600 font-mono">Janvier 2026</span>
                </div>
                <p className="text-xs text-gray-500">
                    Prototype initial, tests de design et mise en place de l'architecture React.
                </p>
            </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-950 rounded-b-2xl">
            <Button onClick={onClose} className="w-full" variant="secondary">Fermer</Button>
        </div>
      </div>
    </div>
  );
};
