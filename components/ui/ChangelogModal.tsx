
import React from 'react';
import { Button } from './Button';

interface ChangelogModalProps {
  onClose: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-overlay backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-border-strong rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-border bg-surface-sunken flex justify-between items-center rounded-t-2xl">
            <h3 className="text-lg font-black italic text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-2 uppercase tracking-wider">
                Notes de version
            </h3>
            <button onClick={onClose} className="text-fg-faint hover:text-fg transition-colors text-2xl leading-none">&times;</button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
            {/* v2.0.0 */}
            <div className="relative border-l-2 border-brand pl-4 ml-2">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-brand border-2 border-border"></div>
                <div className="flex justify-between items-baseline mb-2">
                    <span className="text-fg font-black text-lg">Version v2.0.0</span>
                    <span className="text-xs text-fg-faint font-mono">19/11/2026</span>
                </div>
                <div className="space-y-4">
                    <div>
                        <h4 className="text-brand-fg-soft text-xs font-bold uppercase tracking-widest mb-1">Nouveautés</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-brand-fg-soft/50">
                            <li><b>Match organisé par lien</b> : un organisateur (tournoi, ligue, club) ouvre un match X01 déjà configuré (joueurs, format, règles) depuis son application et récupère le résultat à la fin.</li>
                            <li><b>Configuration verrouillée</b> : joueurs et format d’un match lié ne peuvent plus être modifiés par erreur.</li>
                            <li><b>Statistiques en option</b> : moyennes, 180 et meilleurs checkouts peuvent accompagner le résultat envoyé.</li>
                            <li><b>Application installable</b> : le compteur s’installe sur l’écran d’accueil, s’ouvre hors ligne après une première visite et ne se met jamais à jour pendant une partie.</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-brand-fg-soft text-xs font-bold uppercase tracking-widest mb-1">Sur téléphone</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-brand-fg-soft/50">
                            <li><b>Barre de raccourcis</b> : 6 scores rapides au-dessus du pavé, modifiables et masquables dans les options de jeu.</li>
                            <li><b>Pavé plus lisible</b> : les touches ne se chevauchent plus et sont alignées avec des écarts réguliers, sur téléphone, tablette et PC.</li>
                            <li><b>Mode portrait</b> : en paysage, le compteur demande de tourner le téléphone, sans perdre la partie.</li>
                            <li><b>Score toujours visible</b> : sur les petits écrans et les PC à fenêtre basse, le score se réduit au lieu d’être coupé.</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-brand-fg-soft text-xs font-bold uppercase tracking-widest mb-1">Règles et parties</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-brand-fg-soft/50">
                            <li><b>Reprise de toutes les parties</b> : X01, Cricket, Capital, Triathlon, Killer et Gotcha reprennent après un rechargement, avec les 20 dernières annulations.</li>
                            <li><b>Ordre de passage WDF</b> : en doublettes, chaque équipe garde son ordre d’une manche à l’autre et chaque set impair est ouvert par le camp qui a commencé le match.</li>
                            <li><b>Sorties X01 conformes</b> : les sorties impossibles (180, 177…) et un reste de 1 en Double ou Master Out comptent comme un trop.</li>
                            <li><b>Ouverture Double et Master In</b> : l’ouverture est maintenant appliquée, après confirmation.</li>
                            <li><b>Cricket</b> : l’écran de victoire s’affiche, la fléchette gagnante peut être annulée et une égalité parfaite est déclarée.</li>
                            <li><b>Triathlon</b> : nouveau barème v2, plus juste pour le perdant et pour le Cricket.</li>
                            <li><b>Scores impossibles</b> : Gotcha et Capital refusent les totaux irréalisables en trois fléchettes.</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-cyan-500 text-xs font-bold uppercase tracking-widest mb-1">Sécurité et fiabilité</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-cyan-500/50">
                            <li><b>Sites partenaires</b> : seuls les sites déclarés peuvent recevoir un résultat, en https.</li>
                            <li><b>Aucune partie perdue</b> : un lien ne remplace jamais une partie en cours sans confirmation, et quitter un match lié demande toujours confirmation.</li>
                            <li><b>Lien invalide</b> : le compteur explique pourquoi un lien est refusé.</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-success-fg text-xs font-bold uppercase tracking-widest mb-1">Compatibilité</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-success-fg/50">
                            <li><b>Gameplay</b> : assistance vocale inchangée ; sans lien, le compteur fonctionne comme avant, avec les corrections de règles ci-dessus.</li>
                            <li><b>Partenaires</b> : contrat de lien versionné, guide d’intégration et simulateur fournis.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* v1.1.5 */}
            <div className="relative border-l-2 border-brand pl-4 ml-2">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-brand border-2 border-border"></div>
                <div className="flex justify-between items-baseline mb-2">
                    <span className="text-fg font-black text-lg">Version v1.1.5</span>
                    <span className="text-xs text-fg-faint font-mono">19/11/2026</span>
                </div>
                <div className="space-y-4">
                    <div>
                        <h4 className="text-cyan-500 text-xs font-bold uppercase tracking-widest mb-1">Sécurité et maintenance</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-cyan-500/50">
                            <li><b>Dépendances</b> : correctifs de sécurité Undici et mise à jour du socle React, Vite et des outils de validation.</li>
                            <li><b>Installation</b> : versions Node et npm alignées, dépendance dépréciée retirée et contrôles de non-régression renforcés.</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-success-fg text-xs font-bold uppercase tracking-widest mb-1">Compatibilité</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-success-fg/50">
                            <li><b>Gameplay</b> : règles de scoring, sessions locales et assistance vocale optionnelle conservées.</li>
                            <li><b>Navigateurs</b> : parcours Chromium et WebKit vérifiés, avec maintien du build legacy.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* v1.1.4 */}
            <div className="relative border-l-2 border-brand pl-4 ml-2">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-brand border-2 border-border"></div>
                <div className="flex justify-between items-baseline mb-2">
                    <span className="text-fg font-black text-lg">Version v1.1.4</span>
                    <span className="text-xs text-fg-faint font-mono">03/11/2026</span>
                </div>

                <div className="space-y-4">
                    <div>
                        <h4 className="text-cyan-500 text-xs font-bold uppercase tracking-widest mb-1">Sécurité</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-cyan-500/50">
                            <li><b>Dépendances</b> : mises à jour de sécurité pour corriger les alertes npm concernant les dépendances directes et transitives.</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-success-fg text-xs font-bold uppercase tracking-widest mb-1">Qualité et stabilité</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-success-fg/50">
                            <li><b>Maintenance</b> : refactorings Sonar, améliorations d’accessibilité et remplacement d’API obsolètes.</li>
                            <li><b>Gameplay</b> : aucune modification des règles de scoring.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* v1.1.3 */}
            <div className="relative border-l-2 border-brand pl-4 ml-2">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-brand border-2 border-border"></div>
                <div className="flex justify-between items-baseline mb-2">
                    <span className="text-fg font-black text-lg">Version v1.1.3</span>
                    <span className="text-xs text-fg-faint font-mono">25/08/2026</span>
                </div>

                <div className="space-y-4">
                    <div>
                        <h4 className="text-cyan-500 text-xs font-bold uppercase tracking-widest mb-1">Qualité et sécurité</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-cyan-500/50">
                            <li><b>Dette SonarCloud</b> : correction des issues de qualité sans modification du comportement métier.</li>
                            <li><b>CI</b> : rapports de couverture, Quality Gate et contrôles statiques renforcés.</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-success-fg text-xs font-bold uppercase tracking-widest mb-1">Stabilisation</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-success-fg/50">
                            <li><b>Persistance locale</b> : initialisation IndexedDB différée pour clarifier le cycle de vie.</li>
                            <li><b>Tests</b> : couverture des composants Setup, du changelog et des parcours techniques.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* v1.1.2 */}
            <div className="relative border-l-2 border-brand pl-4 ml-2">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-brand border-2 border-border"></div>
                <div className="flex justify-between items-baseline mb-2">
                    <span className="text-fg font-black text-lg">Version v1.1.2</span>
                    <span className="text-xs text-fg-faint font-mono">25/08/2026</span>
                </div>

                <div className="space-y-4">
                    <div>
                        <h4 className="text-cyan-500 text-xs font-bold uppercase tracking-widest mb-1">Corrections Capital</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-cyan-500/50">
                            <li><b>Moins de 21</b> : le challenge est validé uniquement avec un total strictement inférieur à 21.</li>
                            <li><b>Bull et D-Bull</b> : les valeurs 25 et 50 sont affichées et validées correctement.</li>
                            <li><b>3 à côté</b> : une bulle simple doit être accompagnée d’une cible adjacente pour valider le challenge.</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-success-fg text-xs font-bold uppercase tracking-widest mb-1">Architecture</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-success-fg/50">
                            <li><b>Configuration</b> : l’écran de setup est découpé en sections dédiées pour alléger le composant principal.</li>
                            <li><b>CI et sécurité</b> : le scan CodeQL couvre aussi la branche develop et la configuration preprod est consolidée.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* v1.1.1 */}
            <div className="relative border-l-2 border-brand pl-4 ml-2">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-brand border-2 border-border"></div>
                <div className="flex justify-between items-baseline mb-2">
                    <span className="text-fg font-black text-lg">Version v1.1.1</span>
                    <span className="text-xs text-fg-faint font-mono">03/08/2026</span>
                </div>

                <div className="space-y-4">
                    <div>
                        <h4 className="text-cyan-500 text-xs font-bold uppercase tracking-widest mb-1">Patch release</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-cyan-500/50">
                            <li><b>Version d'accueil dynamique</b> : le label de release lit maintenant automatiquement la version applicative au build, sans hardcode.</li>
                            <li><b>Documentation release</b> : notes, coverage map et références techniques alignées sur le patch `v1.1.1`.</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-success-fg text-xs font-bold uppercase tracking-widest mb-1">Corrections runtime</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-success-fg/50">
                            <li><b>Démarrage React</b> : correction de l’écran blanc lié à une incompatibilité de versions entre `react` et `react-dom`.</li>
                            <li><b>Config Vite</b> : compatibilité native renforcée (import explicite `.ts` et remplacement de `__dirname`).</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* v1.1 */}
            <div className="relative border-l-2 border-border-strong pl-4 ml-2">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-surface-strong border-2 border-border"></div>
                <div className="flex justify-between items-baseline mb-2">
                    <span className="text-fg-muted font-black text-lg">Version v1.1</span>
                    <span className="text-xs text-fg-disabled font-mono">29/04/2026</span>
                </div>

                <div className="space-y-4">
                    <div>
                        <h4 className="text-cyan-500 text-xs font-bold uppercase tracking-widest mb-1">Release open source</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-cyan-500/50">
                            <li><b>Version stable v1.1</b> : périmètre open source clarifié autour du scoring local, des jeux supportés et de l’offline-first.</li>
                            <li><b>Repository public</b> : lien GitHub footer aligné sur le dépôt officiel Bougnat Darts Counter.</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-success-fg text-xs font-bold uppercase tracking-widest mb-1">Améliorations</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-success-fg/50">
                            <li><b>Voice scoring X01</b> : sessions vocales mieux bornées, incidents runtime plus lisibles et propositions mieux arbitrées.</li>
                            <li><b>Architecture</b> : refactors validés sur Setup, Triathlon, Capital, Cricket et flux Deepgram pour une base plus maintenable.</li>
                            <li><b>React 19</b> : runtime frontend aligné sur la nouvelle base React sans rouvrir le scope produit.</li>
                            <li><b>Stats X01</b> : taux de checkout Double Out recalibré sur les vraies tentatives de finish.</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-warning-fg text-xs font-bold uppercase tracking-widest mb-1">Corrections</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-warning-fg/50">
                            <li>Suppression du faux contrat d'environnement tournoi côté runtime supporté.</li>
                            <li>Mode bot <b>PRO</b> affiche maintenant <b>+ de 85 de moyenne</b> et les bots ont des prénoms aléatoires.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* v1.0.2 */}
            <div className="relative border-l-2 border-border-strong pl-4 ml-2">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-surface-strong border-2 border-border"></div>
                <div className="flex justify-between items-baseline mb-2">
                    <span className="text-fg-subtle font-black text-lg">Version v1.0.2</span>
                    <span className="text-xs text-fg-disabled font-mono">27/04/2026</span>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <h4 className="text-cyan-500 text-xs font-bold uppercase tracking-widest mb-1">Fonctionnalités</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-cyan-500/50">
                            <li><b>Gotcha</b> : nouveau mode avec règles métier complètes, setup dédié et intégration dans le flux de partie.</li>
                            <li><b>Killer</b> : mode Killer disponible dans la sélection et le runtime de partie.</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="text-success-fg text-xs font-bold uppercase tracking-widest mb-1">Stabilisation</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-success-fg/50">
                            <li><b>Raccourci installation</b> : bouton « Ajouter à l’écran d’accueil » sur la page principale.</li>
                            <li><b>Stats X01</b> : label "CHECKOUT" plus explicite pour les sorties.</li>
                            <li><b>Score layout</b> : affichage du score résilient au zoom système de l’OS, plus de débordement sur petit écran.</li>
                            <li><b>Performance</b> : réactivité des boutons améliorée.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* v1.0.1 */}
            <div className="relative border-l-2 border-border pl-4 ml-2">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-surface-raised border-2 border-border"></div>
                <div className="flex justify-between items-baseline mb-2">
                    <span className="text-fg-faint font-black text-lg">Version v1.0.1</span>
                    <span className="text-xs text-fg-disabled font-mono">24/04/2026</span>
                </div>

                <div className="space-y-4">
                    <div>
                        <h4 className="text-cyan-500 text-xs font-bold uppercase tracking-widest mb-1">Fonctionnalités</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-cyan-500/50">
                            <li><b>X01</b> : parcours de saisie et de score rendu plus fluide sur les écrans principaux.</li>
                            <li><b>Cricket</b> : expérience de jeu et navigation mieux alignées entre mobile et desktop.</li>
                            <li><b>Capital</b> : adaptation plus propre des écrans et des transitions de partie.</li>
                            <li><b>Triathlon</b> : présentation plus modulaire pour garder le suivi des résultats lisible.</li>
                            <li><b>Assistance vocale IA X01</b> : aide à la saisie conservée avec une interface plus stable.</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-success-fg text-xs font-bold uppercase tracking-widest mb-1">Stabilisation</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-success-fg/50">
                            <li>Amélioration de la sécurité des flux locaux et réduction des surfaces inutiles.</li>
                            <li>Code simplifié et mieux découpé pour faciliter la lisibilité et la maintenance.</li>
                            <li>Refonte progressive de l’architecture pour préparer les prochaines évolutions sans casser l’existant.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface-sunken rounded-b-2xl">
            <Button onClick={onClose} className="w-full" variant="secondary">Fermer</Button>
        </div>
      </div>
    </div>
  );
};
