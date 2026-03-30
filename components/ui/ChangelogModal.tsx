
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
            
            {/* FUTURE - Version beta.5 */}
            <div className="relative border-l-2 border-blue-500/50 border-dashed pl-4 ml-2 bg-blue-900/10 rounded-r-lg p-2">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-gray-900 animate-pulse"></div>
                <div className="flex justify-between items-baseline mb-2">
                    <span className="text-blue-400 font-black text-lg italic">Prochainement : v1.0.0-beta.5</span>
                    <span className="text-[10px] bg-blue-900 text-blue-300 px-2 py-0.5 rounded border border-blue-800 uppercase font-bold">Roadmap</span>
                </div>
                
                <div className="space-y-2">
                    <p className="text-xs text-gray-400 mb-2">Fonctionnalités en cours de développement :</p>
                    <ul className="text-sm text-gray-300 space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-blue-500 mt-0.5">🎯</span>
                            <span><b>Lobby Upgrade :</b> Navigation, gestion de room et parcours multijoueur encore plus fluides.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">📡</span>
                            <span><b>Live Match View :</b> Possibilité de suivre les matchs en direct depuis un autre ecran.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">📱</span>
                            <span><b>QR Code Stats :</b> Scan en fin de partie pour retrouver ses stats sur telephone.</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* CURRENT - Version beta.4 */}
            <div className="relative border-l-2 border-orange-500 pl-4 ml-2">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-orange-500 border-2 border-gray-900"></div>
                <div className="flex justify-between items-baseline mb-2">
                    <span className="text-white font-black text-lg">Version v1.0.0-beta.4</span>
                    <span className="text-xs text-gray-500 font-mono">30/03/2026</span>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <h4 className="text-cyan-500 text-xs font-bold uppercase tracking-widest mb-1">✨ Fonctionnalités</h4>
                        <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside marker:text-cyan-500/50">
                            <li>Ajout d'un premier <b>AI Scoring</b> sur <b>X01</b> avec transcription Deepgram en streaming.</li>
                            <li>Intégration d'un <b>parser darts/X01 contextualisé</b> pour comprendre score du tour, séquence de fléchettes et score restant.</li>
                            <li>Activation / désactivation de l'<b>assistance vocale</b> directement dans la configuration de match X01.</li>
                            <li>Validation finale du score vocal via le <b>flux de scoring existant</b> pour conserver un garde-fou utilisateur.</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="text-green-500 text-xs font-bold uppercase tracking-widest mb-1">🚀 Améliorations</h4>
                        <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside marker:text-green-500/50">
                            <li><b>Refonte compacte</b> de la barre de scoring X01 pour mobile, laptop et desktop.</li>
                            <li>Passage de Tailwind a un <b>build integre Vite/PostCSS</b> au lieu du CDN.</li>
                            <li>Amélioration du demarrage micro/audio avec <b>AudioWorklet</b> et reduction de la latence d'ecoute.</li>
                            <li>Uniformisation du libellé <b>Retour</b> sur les ecrans de jeu.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Version beta.1 (History) */}
            <div className="relative border-l-2 border-gray-800 pl-4 ml-2 opacity-50 grayscale hover:grayscale-0 transition-all">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gray-700 border-2 border-gray-900"></div>
                <div className="flex justify-between items-baseline mb-2">
                    <span className="text-gray-400 font-bold text-sm">Version v1.0.0-beta.1</span>
                    <span className="text-xs text-gray-600 font-mono">02/02/2026</span>
                </div>
                <p className="text-xs text-gray-500">
                    Lancement officiel. Moteur X01 complet, Reconnaissance Vocale native, Mode Doubles (2v2).
                </p>
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
