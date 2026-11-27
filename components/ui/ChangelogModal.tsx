
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
            <section aria-label="Version v2.2.0" className="border-l-2 border-brand pl-4 ml-2">
                <div className="flex justify-between items-baseline mb-2">
                    <span className="changelog-version text-fg font-black text-lg">Version v2.2.0</span>
                    <span className="changelog-date text-xs text-fg-faint font-mono">27/11/2026</span>
                </div>
                <h4 className="text-brand-fg-soft text-xs font-bold uppercase tracking-widest mb-2">Jouer à plusieurs</h4>
                <ul className="text-sm text-fg-muted space-y-2 list-disc list-inside marker:text-brand-fg-soft/50">
                    <li><b>Tout l’ordre de passage</b> : à partir de trois joueurs en simple, choisissez qui joue en premier, en deuxième, puis les suivants avant de commencer, dans tous les jeux sauf le Triathlon.</li>
                    <li><b>Un classement pour chacun</b> : Cricket, Gotcha, Killer et Capital affichent toutes les places à plusieurs, comme le X01 et le 180 Around the Clock. Le Triathlon conserve son propre classement.</li>
                    <li><b>Jouer les places en Cricket et Gotcha</b> : continuez après la victoire pour départager les autres joueurs sans remettre leurs scores à zéro. Vous pouvez aussi terminer : les places restantes sont calculées, avec ex æquo en cas d’égalité.</li>
                    <li><b>Places fixes en X01</b> : à 3 ou 4 joueurs, chacun garde sa place sur tous les écrans ; seul le cadre du joueur actif change. Le joueur qui a commencé est signalé.</li>
                </ul>
                <h4 className="text-brand-fg-soft text-xs font-bold uppercase tracking-widest mt-4 mb-2">Après le match X01</h4>
                <ul className="text-sm text-fg-muted space-y-2 list-disc list-inside marker:text-brand-fg-soft/50">
                    <li><b>Je prends la gagne</b> : comme au flipper ou au baby-foot, le vainqueur garde la table et un challenger remplace le perdant. La partie repart avec le même format et le challenger commence. Inscrivez les suivants dans la file d’attente : chacun son tour.</li>
                    <li><b>La feuille de match en image</b> : grand score ou podium, statistiques de tous les joueurs, date et QR code pour rejoindre l’application. Elle reste lisible une fois envoyée dans une messagerie, et le résumé en texte est toujours disponible.</li>
                    <li><b>Votre partie rapide X01</b> : votre dernière partie reste en mémoire avec son format et ses joueurs, en solo, de 2 à 4, en 2 contre 2 ou contre le robot et son niveau. Relancez une partie identique en un geste, ou revenez au format standard.</li>
                </ul>
                <h4 className="text-brand-fg-soft text-xs font-bold uppercase tracking-widest mt-4 mb-2">Plus de confort pour jouer</h4>
                <ul className="text-sm text-fg-muted space-y-2 list-disc list-inside marker:text-brand-fg-soft/50">
                    <li><b>Raccourcis X01 sur téléphone</b> : les scores rapides s’affichent sur davantage d’écrans, y compris dans le navigateur, quand la hauteur le permet. Toutes les touches restent assez grandes pour le doigt.</li>
                    <li><b>Accueil sur téléphone</b> : les éléments sont mieux regroupés et adaptés à l’espace disponible. Sur les petits écrans, tout reste accessible en défilant.</li>
                    <li><b>180 Around the Clock en solo</b> : suivez vos 20 tours dans une grille qui affiche les points de chaque numéro et se met à jour pendant la volée.</li>
                    <li><b>Saisie au 180 Around the Clock</b> : le bouton « Passer » disparaît ; saisissez chaque fléchette avec Triple, Double, Simple ou Miss. « Annuler » reste disponible.</li>
                </ul>
            </section>
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
                            <li><b>Partie rapide X01</b> : le format standard propose 501, premier à 3 manches, départ libre et fin sur un double : entrez deux prénoms et lancez. Pour choisir d’autres options, utilisez « Personnaliser la partie ».</li>
                            <li><b>Page Réglages</b> : thème, suggestions de finish, assistance vocale et raccourcis de score réunis au même endroit, depuis l’accueil.</li>
                            <li><b>Matchs organisés</b> : lors d’une compétition, l’organisation peut vous envoyer un lien qui ouvre votre match X01 déjà prêt, avec les prénoms et le format ; à la fin, le résultat lui est transmis.</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-brand-fg-soft text-xs font-bold uppercase tracking-widest mb-1">Nouveaux jeux et formats</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-brand-fg-soft/50">
                            <li><b>180 Around the Clock</b> : du 1 au 20, trois fléchettes par numéro, seul pour s’entraîner ou jusqu’à 4 joueurs.</li>
                            <li><b>X01 jusqu’à 4 joueurs</b> : en simple, chacun son tour.</li>
                            <li><b>Cricket jusqu’à 4 joueurs</b> : en simple, comme le Capital ; le 2 contre 2 reste disponible.</li>
                            <li><b>Un vrai classement à plusieurs</b> : en X01, au-delà de deux joueurs, la fin de partie affiche le classement complet, pas seulement le vainqueur. Après la victoire, vous pouvez continuer pour jouer la 2ᵉ place, puis la 3ᵉ ; sinon, les places sont attribuées d’après les manches gagnées et le score restant.</li>
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
                        <h4 className="text-brand-fg-soft text-xs font-bold uppercase tracking-widest mb-1">Plus de confort en X01</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-brand-fg-soft/50">
                            <li><b>Voix facultative</b> : elle est désactivée par défaut, peut être activée dans les réglages et une touche permet de signaler un trop sans parler.</li>
                            <li><b>Fin de partie</b> : retrouvez directement les statistiques, lancez une revanche ou partagez un résumé écrit du match.</li>
                            <li><b>Départage au bull</b> : à 3 ou 4 joueurs, il s’applique aussi aux places si la limite de volées est atteinte.</li>
                            <li><b>Sur téléphone et tablette</b> : format de partie, pavé, raccourcis et statistiques restent plus faciles à lire et à utiliser.</li>
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
                        <h4 className="text-info-fg text-xs font-bold uppercase tracking-widest mb-1">Sécurité</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-info-fg/50">
                            <li>Améliorations de sécurité sans changement des règles de jeu.</li>
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
                            <li>Mises à jour de sécurité.</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-success-fg text-xs font-bold uppercase tracking-widest mb-1">Accessibilité</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-success-fg/50">
                            <li>Améliorations pour rendre l’application plus accessible.</li>
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
                        <h4 className="text-info-fg text-xs font-bold uppercase tracking-widest mb-1">Stabilité</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-info-fg/50">
                            <li>Améliorations de stabilité, sans changement des règles de jeu.</li>
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
                        <h4 className="text-info-fg text-xs font-bold uppercase tracking-widest mb-1">Correction</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-info-fg/50">
                            <li>Correction d’un écran blanc au démarrage.</li>
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
                        <h4 className="text-info-fg text-xs font-bold uppercase tracking-widest mb-1">Application ouverte</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-info-fg/50">
                            <li>Bougnat Darts est libre et utilisable hors ligne.</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-success-fg text-xs font-bold uppercase tracking-widest mb-1">Améliorations</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-success-fg/50">
                            <li><b>Assistance vocale X01</b> : saisie vocale plus fiable.</li>
                            <li><b>Statistiques X01</b> : taux de réussite en sortie double calculé sur les véritables tentatives.</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-warning-fg text-xs font-bold uppercase tracking-widest mb-1">Corrections</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-warning-fg/50">
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
                            <li><b>Gotcha</b> et <b>Killer</b> : deux nouveaux jeux à découvrir.</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="text-success-fg text-xs font-bold uppercase tracking-widest mb-1">Stabilisation</h4>
                        <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside marker:text-success-fg/50">
                            <li><b>Raccourci installation</b> : bouton « Ajouter à l’écran d’accueil » sur la page principale.</li>
                            <li><b>Statistiques X01</b> : indication plus claire pour les sorties.</li>
                            <li><b>Affichage du score</b> : plus lisible sur petit écran, même avec le zoom de l’appareil.</li>
                            <li><b>Boutons</b> : meilleure réactivité.</li>
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
                            <li><b>Cricket</b> : jeu et navigation améliorés sur téléphone et ordinateur.</li>
                            <li><b>Capital</b> : adaptation plus propre des écrans et des transitions de partie.</li>
                            <li><b>Triathlon</b> : suivi des résultats plus lisible.</li>
                            <li><b>Assistance vocale X01</b> : aide à la saisie plus stable.</li>
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
