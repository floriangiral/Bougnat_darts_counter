
import React, { useId } from 'react';
import { X } from 'lucide-react';
import { Button, IconButton } from './Button';

interface ChangelogModalProps {
  onClose: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ onClose }) => {
  const titleId = useId();
  return (
    <dialog open aria-modal="true" aria-labelledby={titleId} data-modal-size="wide" className="app-modal tablet-modal fixed inset-0 z-50 m-0 flex h-full w-full max-h-none max-w-none items-center justify-center border-0 bg-overlay p-4 text-fg backdrop-blur-sm animate-in fade-in duration-200">
      <div className="changelog-panel bg-surface border border-border-strong rounded-2xl w-full max-w-md shadow-elevated flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-border bg-surface-sunken flex justify-between items-center rounded-t-2xl">
            <h3 id={titleId} className="changelog-title text-lg font-black italic text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-2 uppercase tracking-wider">
                Notes de version
            </h3>
            <IconButton label="Fermer les notes de version" onClick={onClose} className="h-10 w-10">
                <X className="h-5 w-5" aria-hidden="true" />
            </IconButton>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
            <div className="relative border-l-2 border-brand pl-4 ml-2">
                <div className="flex items-baseline justify-between">
                    <div className="changelog-version text-fg font-black text-lg">Correctifs de recette — à publier</div>
                    <span className="changelog-date text-xs text-fg-faint font-mono">26/11/2026</span>
                </div>
                <ul className="mt-2 text-sm text-fg-muted space-y-1 list-disc list-inside">
                    <li><b>Lien partenaire X01</b> : quatre joueurs en simple ne sont plus confondus avec deux doublettes ; le résultat conserve les quatre camps et leur classement.</li>
                    <li><b>Adresse de la page</b> : elle indique le jeu et l’étape (par exemple /cricket/partie) pour une mesure d’audience anonyme, sans cookie ; elle ne contient jamais de prénom ni de score.</li>
                </ul>
            </div>
            <div className="relative border-l-2 border-brand pl-4 ml-2">
                <div className="flex items-baseline justify-between">
                    <div className="changelog-version text-fg font-black text-lg">Compléments v2.1.0</div>
                    <span className="changelog-date text-xs text-fg-faint font-mono">24/11/2026</span>
                </div>
                <ul className="mt-2 text-sm text-fg-muted space-y-1 list-disc list-inside">
                    <li><b>X01</b> : la voix est désactivée par défaut et reste activable dans les réglages. Quand elle est coupée, une touche permet de déclarer directement un trop.</li>
                    <li><b>X01 sur téléphone</b> : le format de la partie reste lisible dans l’en-tête.</li>
                    <li><b>Partie rapide</b> : elle propose le dernier format joué à deux, et « Revenir au standard » ramène au 501 en 3 manches.</li>
                    <li><b>Préparation X01</b> : cartes alignées dans une colonne centrée, récapitulatif pleine largeur et même bouton de lancement en bas de l’écran, en partie rapide comme personnalisée.</li>
                    <li><b>Raccourcis X01 sur tablette</b> : dans les options de jeu, les scores reprennent l’ordre, les rangées et les couleurs du pavé numérique.</li>
                    <li><b>Micro et trop de score</b> : lorsque le vocal est activé, les deux touches partagent la colonne du pavé, chacune à la hauteur d’une touche numérique.</li>
                    <li><b>X01 à 3 ou 4 joueurs</b> : les blocs de score tournent dans le sens anti-horaire, le joueur suivant à gauche et le précédent à droite du joueur actif.</li>
                    <li><b>Ordre de passage et places à 3 ou 4 joueurs</b> : avant la partie, on désigne les n° 1 à 4, chaque carte affiche son numéro et chaque manche est ouverte par le numéro suivant. Après la victoire, on peut jouer la 2e place, puis la 3e (départage au bull à la limite de volées), ou terminer le match ; le classement, le partage et le lien partenaire en tiennent compte.</li>
                    <li><b>Pavé X01</b> : les textes des touches s’adaptent automatiquement à leur taille.</li>
                    <li><b>Statistiques sur tablette</b> : à 3 ou 4 joueurs, les valeurs s’ajustent à la largeur de leur colonne et ne se chevauchent plus.</li>
                    <li><b>Moyennes des adversaires en paysage</b> : sur tablette en paysage, les deux moyennes des joueurs en attente se partagent toute la largeur de leur carte au lieu de se coller.</li>
                </ul>
            </div>
            {/* v2.1.0 : première version 2 publiée, elle reprend aussi le contenu de la 2.0.0. */}
            <div className="relative border-l-2 border-brand pl-4 ml-2">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-brand border-2 border-border"></div>
                <div className="flex justify-between items-baseline mb-2">
                    <span className="changelog-version text-fg font-black text-lg">Version v2.1.0</span>
                    <span className="changelog-date text-xs text-fg-faint font-mono">23/11/2026</span>
                </div>
                <div className="space-y-4">
                    <div>
                        <h4 className="text-brand-fg-soft text-xs font-bold uppercase tracking-widest mb-1">Jouer plus vite</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-brand-fg-soft/50">
                            <li><b>Partie rapide X01</b> : 501, premier à 3 manches, départ libre et fin sur un double : entrez deux prénoms et lancez. Tout le reste se règle dans « Personnaliser la partie ».</li>
                            <li><b>Page Réglages</b> : thème, suggestions de finish, assistance vocale et raccourcis de score réunis au même endroit, depuis l’accueil.</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-brand-fg-soft text-xs font-bold uppercase tracking-widest mb-1">Nouveaux jeux et formats</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-brand-fg-soft/50">
                            <li><b>180 Around the Clock</b> : du 1 au 20, trois fléchettes par numéro, seul pour s’entraîner ou jusqu’à 4 joueurs.</li>
                            <li><b>X01 jusqu’à 4 joueurs</b> : en simple, chacun son tour.</li>
                            <li><b>Limite de volées</b> : en X01, fixez un nombre de volées par manche ; sans fermeture, une fléchette chacun et le plus près du bull gagne la manche.</li>
                            <li><b>Score personnalisé</b> : de 2 à 2501 points en X01.</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-brand-fg-soft text-xs font-bold uppercase tracking-widest mb-1">Sur tous les écrans</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-brand-fg-soft/50">
                            <li><b>Tablette</b> : en portrait, le joueur actif en grand et un grand pavé ; en paysage, joueurs et saisie côte à côte.</li>
                            <li><b>Téléphone</b> : jouable en paysage comme en portrait, pavé plus lisible et barre de 6 scores rapides.</li>
                            <li><b>Thème Auto, Sombre ou Clair</b> : le mode Auto suit votre appareil.</li>
                            <li><b>Application installable</b> : sur l’écran d’accueil, utilisable hors ligne après une première visite, sans mise à jour en pleine partie.</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-brand-fg-soft text-xs font-bold uppercase tracking-widest mb-1">Des règles plus justes</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-brand-fg-soft/50">
                            <li><b>X01</b> : sorties impossibles comptées comme un trop, ouverture Double ou Master appliquée, ordre de passage WDF, y compris en doublettes.</li>
                            <li><b>Cricket</b> : écran de victoire, dernière fléchette annulable, égalité reconnue.</li>
                            <li><b>Triathlon</b> : barème plus équilibré.</li>
                            <li><b>Gotcha et Capital</b> : les totaux impossibles en trois fléchettes sont refusés.</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-info-fg text-xs font-bold uppercase tracking-widest mb-1">Rien ne se perd</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-info-fg/50">
                            <li><b>Reprise de toutes les parties</b> : après un rechargement ou une fermeture, la partie reprend où elle en était, avec ses 20 dernières annulations.</li>
                            <li><b>Assistance vocale plus fiable</b> : annonces mieux comprises et un silence n’est plus affiché comme une panne du micro.</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-success-fg text-xs font-bold uppercase tracking-widest mb-1">Pour les organisateurs</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-success-fg/50">
                            <li><b>Match préparé par lien</b> : un organisateur (tournoi, ligue, club) ouvre un match X01 déjà configuré et récupère le résultat à la fin. Premier partenaire : badarts.fr.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* v1.1.5 */}
            <div className="relative border-l-2 border-brand pl-4 ml-2">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-brand border-2 border-border"></div>
                <div className="flex justify-between items-baseline mb-2">
                    <span className="changelog-version text-fg font-black text-lg">Version v1.1.5</span>
                    <span className="changelog-date text-xs text-fg-faint font-mono">19/11/2026</span>
                </div>
                <div className="space-y-4">
                    <div>
                        <h4 className="text-info-fg text-xs font-bold uppercase tracking-widest mb-1">Sécurité et maintenance</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-info-fg/50">
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
                    <span className="changelog-version text-fg font-black text-lg">Version v1.1.4</span>
                    <span className="changelog-date text-xs text-fg-faint font-mono">03/11/2026</span>
                </div>

                <div className="space-y-4">
                    <div>
                        <h4 className="text-info-fg text-xs font-bold uppercase tracking-widest mb-1">Sécurité</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-info-fg/50">
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
                    <span className="changelog-version text-fg font-black text-lg">Version v1.1.3</span>
                    <span className="changelog-date text-xs text-fg-faint font-mono">25/08/2026</span>
                </div>

                <div className="space-y-4">
                    <div>
                        <h4 className="text-info-fg text-xs font-bold uppercase tracking-widest mb-1">Qualité et sécurité</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-info-fg/50">
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
                    <span className="changelog-version text-fg font-black text-lg">Version v1.1.2</span>
                    <span className="changelog-date text-xs text-fg-faint font-mono">25/08/2026</span>
                </div>

                <div className="space-y-4">
                    <div>
                        <h4 className="text-info-fg text-xs font-bold uppercase tracking-widest mb-1">Corrections Capital</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-info-fg/50">
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
                    <span className="changelog-version text-fg font-black text-lg">Version v1.1.1</span>
                    <span className="changelog-date text-xs text-fg-faint font-mono">03/08/2026</span>
                </div>

                <div className="space-y-4">
                    <div>
                        <h4 className="text-info-fg text-xs font-bold uppercase tracking-widest mb-1">Patch release</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-info-fg/50">
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
                        <h4 className="text-info-fg text-xs font-bold uppercase tracking-widest mb-1">Release open source</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-info-fg/50">
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
                        <h4 className="text-info-fg text-xs font-bold uppercase tracking-widest mb-1">Fonctionnalités</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-info-fg/50">
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
                        <h4 className="text-info-fg text-xs font-bold uppercase tracking-widest mb-1">Fonctionnalités</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-info-fg/50">
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
            <Button onClick={onClose} className="modal-action w-full" variant="secondary">Fermer</Button>
        </div>
      </div>
    </dialog>
  );
};
