
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
            {/* v1.1.1 */}
            <div className="relative border-l-2 border-orange-500 pl-4 ml-2">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-orange-500 border-2 border-gray-900"></div>
                <div className="flex justify-between items-baseline mb-2">
                    <span className="text-white font-black text-lg">Version v1.1.1</span>
                    <span className="text-xs text-gray-500 font-mono">03/08/2026</span>
                </div>

                <div className="space-y-4">
                    <div>
                        <h4 className="text-cyan-500 text-xs font-bold uppercase tracking-widest mb-1">Patch release</h4>
                        <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside marker:text-cyan-500/50">
                            <li><b>Version d'accueil dynamique</b> : le label de release lit maintenant automatiquement la version applicative au build, sans hardcode.</li>
                            <li><b>Documentation release</b> : notes, coverage map et references techniques alignees sur le patch `v1.1.1`.</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-green-500 text-xs font-bold uppercase tracking-widest mb-1">Corrections runtime</h4>
                        <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside marker:text-green-500/50">
                            <li><b>Demarrage React</b> : correction du blanc ecran lie a un mismatch de versions entre `react` et `react-dom`.</li>
                            <li><b>Config Vite</b> : compatibilite native renforcee (import explicite `.ts` et remplacement de `__dirname`).</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* v1.1 */}
            <div className="relative border-l-2 border-gray-700 pl-4 ml-2">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gray-700 border-2 border-gray-900"></div>
                <div className="flex justify-between items-baseline mb-2">
                    <span className="text-gray-300 font-black text-lg">Version v1.1</span>
                    <span className="text-xs text-gray-600 font-mono">29/04/2026</span>
                </div>

                <div className="space-y-4">
                    <div>
                        <h4 className="text-cyan-500 text-xs font-bold uppercase tracking-widest mb-1">Release open source</h4>
                        <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside marker:text-cyan-500/50">
                            <li><b>Version stable v1.1</b> : perimetre open source clarifie autour du scoring local, des jeux supportes et de l offline-first.</li>
                            <li><b>Repository public</b> : lien GitHub footer aligne sur le depot officiel Bougnat Darts Counter.</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-green-500 text-xs font-bold uppercase tracking-widest mb-1">Ameliorations</h4>
                        <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside marker:text-green-500/50">
                            <li><b>Voice scoring X01</b> : sessions vocales mieux bornees, incidents runtime plus lisibles et propositions mieux arbitrees.</li>
                            <li><b>Architecture</b> : refactors valides sur Setup, Triathlon, Capital, Cricket et flux Deepgram pour une base plus maintenable.</li>
                            <li><b>React 19</b> : runtime frontend aligne sur la nouvelle base React sans reouvrir le scope produit.</li>
                            <li><b>Stats X01</b> : taux de checkout Double Out recalibre sur les vraies tentatives de finish.</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-yellow-500 text-xs font-bold uppercase tracking-widest mb-1">Corrections</h4>
                        <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside marker:text-yellow-500/50">
                            <li>Suppression du faux contrat d'environnement tournoi cote runtime supporte.</li>
                            <li>Mode bot <b>PRO</b> affiche maintenant <b>+ de 85 de moyenne</b> et les bots ont des prenoms aleatoires.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* v1.0.2 */}
            <div className="relative border-l-2 border-gray-700 pl-4 ml-2">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gray-700 border-2 border-gray-900"></div>
                <div className="flex justify-between items-baseline mb-2">
                    <span className="text-gray-400 font-black text-lg">Version v1.0.2</span>
                    <span className="text-xs text-gray-600 font-mono">27/04/2026</span>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <h4 className="text-cyan-500 text-xs font-bold uppercase tracking-widest mb-1">Fonctionnalites</h4>
                        <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside marker:text-cyan-500/50">
                            <li><b>Gotcha</b> : nouveau mode avec regles metier completes, setup dedie et integration dans le flux de partie.</li>
                            <li><b>Killer</b> : mode Killer disponible dans la selection et le runtime de partie.</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="text-green-500 text-xs font-bold uppercase tracking-widest mb-1">Stabilisation</h4>
                        <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside marker:text-green-500/50">
                            <li><b>Raccourci installation</b> : bouton "Ajouter a l'ecran d'accueil" sur la page principale.</li>
                            <li><b>Stats X01</b> : label "CHECKOUT" plus explicite pour les sorties.</li>
                            <li><b>Score layout</b> : affichage du score resilient au zoom systeme de l'OS, plus de debordement sur petit ecran.</li>
                            <li><b>Performance</b> : reactivite des boutons amelioree.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* v1.0.1 */}
            <div className="relative border-l-2 border-gray-800 pl-4 ml-2">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gray-800 border-2 border-gray-900"></div>
                <div className="flex justify-between items-baseline mb-2">
                    <span className="text-gray-500 font-black text-lg">Version v1.0.1</span>
                    <span className="text-xs text-gray-600 font-mono">24/04/2026</span>
                </div>

                <div className="space-y-4">
                    <div>
                        <h4 className="text-cyan-500 text-xs font-bold uppercase tracking-widest mb-1">Fonctionnalites</h4>
                        <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside marker:text-cyan-500/50">
                            <li><b>X01</b> : parcours de saisie et de score rendu plus fluide sur les ecrans principaux.</li>
                            <li><b>Cricket</b> : experience de jeu et navigation mieux alignees entre mobile et desktop.</li>
                            <li><b>Capital</b> : adaptation plus propre des ecrans et des transitions de partie.</li>
                            <li><b>Triathlon</b> : presentation plus modulaire pour garder le suivi des resultats lisible.</li>
                            <li><b>Assistance vocale IA X01</b> : aide a la saisie conservee avec une interface plus stable.</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-green-500 text-xs font-bold uppercase tracking-widest mb-1">Stabilisation</h4>
                        <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside marker:text-green-500/50">
                            <li>Amelioration de la securite des flux locaux et reduction des surfaces inutiles.</li>
                            <li>Code simplifie et mieux decoupe pour faciliter la lisibilite et la maintenance.</li>
                            <li>Refonte progressive de l architecture pour preparer les prochaines evolutions sans casser l existant.</li>
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
