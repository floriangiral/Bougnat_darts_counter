---
id: 094-counter-theme-visual-editor
v2_id: V2-BRAND-02
titre: Éditeur visuel de thème
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Demande V2
famille: perso
priorite: P2
difficulte: M
recommandation: recommande
lot: 4
poids: 20
depend_de: [V2-BRAND-01]
remplace: []
remplacee_par: []
issue: '#268'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 094 — Éditeur visuel de thème

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte
Demande V2 §5.7 : un responsable de club ou un gérant de bar, sans compétence technique, doit pouvoir créer le thème de son lieu. Le rapport 05 (§6.2) propose un éditeur en un écran, avec presets, 1 à 3 couleurs et aperçu en direct ; le compte rendu (§C.7) insiste sur le garde-fou de simplicité : **entrée secondaire, jamais d'étape obligatoire**.

## 2. Problématique
Le modèle de thème (093) garantit la lisibilité mais n'offre aucune interface. Sans éditeur simple, la personnalisation reste inaccessible aux lieux ; avec un éditeur trop riche, on complexifie l'application et on multiplie les thèmes illisibles.

## 3. Objectifs
- Créer un thème lisible en moins de 2 minutes, en partant d'un preset.
- Voir immédiatement le rendu sur les écrans qui comptent (jeu, TV).
- Revenir aux couleurs Bougnat en un geste.
- Ne rien changer pour l'utilisateur qui ne personnalise pas.

## 4. État actuel vérifié dans le code
- [vérifié] Aucun écran de réglages globaux : seule la modale « Options de jeu » existe en cours de match (`components/match/MatchSettingsModal.tsx:53`, ouverte depuis `views/MatchView.tsx:817`).
- [vérifié] Le pied de page de l'accueil regroupe les actions secondaires (« Partager L'App » `views/HomeView.tsx:141`, bouton d'installation, changelog) : emplacement naturel d'une entrée discrète.
- [vérifié] Le parcours de base part du bouton « Lancer une partie » de l'accueil (`views/HomeView.tsx`, `onQuickGame`).
- [vérifié] Les vues sont chargées à la demande (`App.tsx:54-62`) : l'éditeur peut l'être aussi.
- [vérifié] Aucun composant n'utilise de token de couleur aujourd'hui (rapport 05 §2.2) : un aperçu fidèle suppose la migration des écrans concernés (V2-DS-03, 065).

## 5. Comportement cible
Un écran « Personnaliser (clubs et bars) », chargé à la demande, accessible depuis une entrée secondaire de l'accueil et depuis « Préparer une station » (100). Il présente : choix d'un preset ou « Partir de mes couleurs » ; couleur principale ; section « Avancé » repliée (couleur secondaire, accent, teinte de fond) ; nom du thème et du lieu ; logo (via 095) ; aperçus ; actions « Enregistrer », « Activer », « Restaurer les couleurs Bougnat », « Partager » (096). Chaque modification est validée par 093 et l'aperçu se met à jour.

## 6. Périmètre
### Inclus
Écran éditeur, presets, sélecteurs de couleur, champ hexadécimal, aperçus (accueil, X01 en cours, Cricket, TV), badges de contraste, bibliothèque locale (≤ 10 thèmes), activation, réinitialisation, suppression.
### Exclu
Pipette sur le logo (Q3), recadrage interactif du logo (P3), images de fond, polices, couleurs de jeu, partage (096), import du logo (095), mise en page libre.

## 7. User stories
- En tant que gérant de bar, je veux partir d'un preset proche de mes couleurs et l'ajuster, afin d'obtenir un résultat propre rapidement.
- En tant que responsable de club, je veux voir le rendu en partie et sur la TV avant d'activer le thème.
- En tant que joueur occasionnel, je ne veux voir aucune question de personnalisation en lançant une partie.

## 8. Règles métier
- RM-01 L'éditeur n'est jamais une étape du parcours « Lancer une partie » ; aucune invite au premier lancement.
- RM-02 Toute valeur saisie passe par la validation et la dérivation de 093 ; l'éditeur ne calcule aucune couleur lui-même.
- RM-03 Les couleurs de jeu ne sont pas éditables ; l'éditeur explique quand `game-active` ne suit pas la couleur du club.
- RM-04 L'éditeur n'est pas accessible pendant une partie ; la bascule sombre/clair en partie relève de 069.
- RM-05 La mention Bougnat Darts est visible dans les aperçus et n'a aucun contrôle associé (097).

## 9. Parcours utilisateurs
1. Accueil → pied de page → « Personnaliser (clubs et bars) ».
2. Choisir un preset (1 tap) ou « Partir de mes couleurs ».
3. Ajuster la couleur principale (sélecteur natif ou hex).
4. Facultatif : « Avancé » → couleur secondaire, accent, teinte de fond.
5. Saisir le nom du thème et du lieu ; facultatif : importer le logo (095).
6. Consulter les aperçus (onglets Accueil / X01 / Cricket / TV, sombre et clair).
7. « Enregistrer et activer » → retour à l'accueil aux couleurs du club.
8. À tout moment : « Restaurer les couleurs Bougnat ».

## 10. Exigences fonctionnelles
- FR-01 Entrée « Personnaliser (clubs et bars) » discrète dans le pied de page de l'accueil ; aucune autre entrée dans le parcours de base.
- FR-02 6 à 8 presets officiels (093 FR-09) présentés en vignettes avec nom et pastilles de couleur.
- FR-03 Couleur principale via `<input type="color">` et champ hex `#rrggbb` synchronisés ; saisie invalide signalée sans perte de la valeur précédente.
- FR-04 Section « Avancé » repliée par défaut (couleur secondaire, accent, teinte de fond), chaque champ effaçable (retour à la dérivation automatique).
- FR-05 Aperçus rendus avec les **vrais composants** et des données factices : accueil, X01 (joueur actif, bust), Cricket (cible fermée), TV (si 086 livrée, sinon vignette simplifiée) ; sombre et clair (clair seulement si 068 livrée).
- FR-06 Badge par aperçu : « Lisible », « Ajusté automatiquement », « Couleur de jeu non suivie » (issu du rapport de 093).
- FR-07 Bibliothèque locale : liste, renommer, dupliquer, supprimer (confirmation), activer ; plafond 10 avec message explicite.
- FR-08 « Restaurer les couleurs Bougnat » désactive le thème club en un geste, sans supprimer la bibliothèque.
- FR-09 Modifications non enregistrées : confirmation à la sortie.
- FR-10 Éditeur chargé à la demande ; aucun code de l'éditeur dans les chunks initiaux.

## 11. Exigences non fonctionnelles
- NFR-01 Mise à jour de l'aperçu ≤ 100 ms après saisie (dérivation mise en cache, sélecteur limité en fréquence) [à mesurer].
- NFR-02 Accessibilité : éditeur entièrement utilisable au clavier, libellés explicites, badges non portés par la seule couleur, cibles ≥ 48 px (V2-DS-02, 064).
- NFR-03 Tablette et téléphone : disposition en une colonne sur téléphone, aperçu à côté des réglages sur tablette paysage.
- NFR-04 `<input type="color">` sur iOS 12 [à confirmer] ; repli : champ hex seul.
- NFR-05 Coût récurrent : 0 €.

## 12. Cas nominaux et alternatifs
- Nominal : preset → ajustement → enregistrement → activation.
- Alternatif : « Partir de mes couleurs » sans preset.
- Alternatif : thème enregistré sans activation (préparation pour un autre appareil via 096).

## 13. Cas limites
- Bibliothèque pleine (10) : création refusée avec suggestion de suppression.
- Stockage indisponible : thème utilisable pour la session, avertissement.
- Couleur principale rouge ou verte : badge « Couleur de jeu non suivie » et explication.
- Fermeture de l'onglet en cours d'édition : brouillon perdu [à confirmer : brouillon persistant ou non].

## 14. Gestion des erreurs
Erreurs de 093 affichées en français à côté du champ concerné ; échec d'enregistrement → message et conservation de la saisie ; échec de chargement du chunk éditeur → message, retour à l'accueil.

## 15. Impacts architecturaux
Présentation uniquement (`src/presentation/theme/ThemeEditorView.tsx` et sous-composants) ; aucune logique de couleur hors de `src/features/theming` (093). Navigation : nouvel écran secondaire dans `App.tsx` / `src/app/appShell.ts`.

## 16. Impacts sur les données et les interfaces
Utilise la bibliothèque et la clé du thème actif de 093 ; aucun nouveau format.

## 17. Compatibilité avec l'existant
Accueil inchangé hormis une entrée dans le pied de page ; parcours de base, setup et écrans de jeu inchangés.

## 18. Dépendances
Bloquante : V2-BRAND-01 (093). Fortement liées : V2-DS-03 (065, écrans migrés pour un aperçu fidèle), V2-THEME-01 (068, aperçu clair), V2-TV-06 (086, aperçu TV), V2-BRAND-03 (095, logo), V2-BRAND-05 (097).

## 19. Critères d'acceptation
- AC-01 Accueil → « Lancer une partie » → jeu → prénoms → jouer : aucun écran ni question de personnalisation, avec ou sans thème club.
- AC-02 Depuis l'accueil, un utilisateur crée et active un thème à partir d'un preset en ≤ 6 interactions ; l'accueil s'affiche ensuite aux couleurs choisies.
- AC-03 Saisie `#12345` ou `bleu` dans le champ hex : message d'erreur, valeur précédente conservée.
- AC-04 Couleur principale rouge vif : le badge « Couleur de jeu non suivie » apparaît et l'aperçu X01 montre le joueur actif à la couleur officielle.
- AC-05 « Restaurer les couleurs Bougnat » : l'application revient au thème officiel, la bibliothèque reste intacte.
- AC-06 Onzième thème : création refusée avec message.
- AC-07 L'éditeur est inaccessible pendant une partie (aucune entrée dans les écrans de jeu).
- AC-08 Navigation complète au clavier avec focus visible ; lecteur d'écran annonçant les badges en texte.

## 20. Scénarios de tests
Composants (formulaire, synchronisation sélecteur/hex, badges, plafond) ; E2E (création, activation, restauration, parcours de base inchangé) ; tests manuels sur iPad, tablette Android, téléphone ; test utilisateur avec 2-3 responsables de lieu [à organiser].

## 21. Exigences de non-régression
Parcours de base, chunks initiaux, accueil (hors nouvelle entrée), écrans de jeu.

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Aperçu infidèle tant que les écrans ne sont pas migrés | Moyen | Élevée | Livrer après 065 ; sinon vignettes simplifiées signalées comme telles |
| Complexité perçue | Moyen | Moyenne | Presets en premier, section avancée repliée |
| Encombrement de l'accueil | Faible | Moyenne | Entrée unique, discrète, en pied de page |

## 23. Décisions architecturales
Aucun ADR propre ; respecte l'ADR « thème = tokens dérivés » de 093.

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Emplacement de l'entrée | Pied de page de l'accueil / menu « Préparer une station » seul / les deux | Les deux, toujours secondaires | À prendre |
| Q2 | Livrer l'éditeur avant la migration complète (065) ? | Attendre 065 / vignettes simplifiées | Attendre au moins la migration des écrans X01 et Cricket | À prendre |
| Q3 | Pipette « couleurs du logo » | En V2 / plus tard | Plus tard (P3), hors de cette spec | À prendre |
| Q4 | Brouillon persistant | Oui / non | Non (simplicité) | À prendre |
| Q5 | Libellé de l'entrée | « Personnaliser (clubs et bars) » / « Aux couleurs de mon club » / autre | « Personnaliser (clubs et bars) » | À prendre |

## 25. Traçabilité
Rapport 05 §4.3, §6.2, §6.6 ; compte rendu §C.7, H.16-H.17. Specs liées : 093, 095, 096, 097, 065, 068, 086, 100, 037.
