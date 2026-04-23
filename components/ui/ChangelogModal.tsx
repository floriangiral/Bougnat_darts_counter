
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
            <div className="relative border-l-2 border-orange-500 pl-4 ml-2">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-orange-500 border-2 border-gray-900"></div>
                <div className="flex justify-between items-baseline mb-2">
                    <span className="text-white font-black text-lg">Version v1.0.0</span>
                    <span className="text-xs text-gray-500 font-mono">23/04/2026</span>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <h4 className="text-cyan-500 text-xs font-bold uppercase tracking-widest mb-1">Fonctionnalites</h4>
                        <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside marker:text-cyan-500/50">
                            <li><b>X01</b> : mode classique configurable avec check-in/check-out, manches/sets et doublettes.</li>
                            <li><b>Cricket</b> : gestion des fermetures, des marques et du score par cible.</li>
                            <li><b>Capital</b> : enchainement de challenges et comptage adapte a chaque epreuve.</li>
                            <li><b>Triathlon</b> : parcours multi-jeux Capital + Cricket + 501 avec resultat final consolide.</li>
                            <li><b>Assistance vocale IA X01</b> : transcription Deepgram et proposition de score avant validation.</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="text-green-500 text-xs font-bold uppercase tracking-widest mb-1">Stabilisation</h4>
                        <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside marker:text-green-500/50">
                            <li>Release <b>stable v1.0.0</b> avec historique de changelog reinitialise pour le nouveau cycle.</li>
                            <li>Experience home, match et navigation harmonisee pour mobile et desktop.</li>
                            <li>Socle applicatif refactorise pour faciliter la maintenance et les prochaines evolutions.</li>
                        </ul>
                    </div>
                </div>
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
