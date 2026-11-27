# Runbook post-release et retour arrière

> Spec [033](../../specs/033-counter-release-v2-0-0-publication/spec.md) (FR-07, reliquat de la spec 007), issue #211.
> **Brouillon à valider par le product owner** : la spec 033 est encore au statut `a-valider`.

Au 2026-11-27, la 2.2.0 est en préparation, ni taguée ni promue en production ; la dernière GitHub Release est la 2.1.0 et la production reste en 1.1.4. La recette et les contrôles du futur candidat sont suivis dans la [gate 2.2.0](checklist.md#gate-220) et [#361](https://github.com/floriangiral/Bougnat_darts_counter/issues/361).

## Chaîne de livraison

`main` → workflow **Deploy Preview** (`confirm_branch=main`, `confirm_target=preprod`) → branche miroir `preprod` → workflow **Promote Production** lancé depuis `preprod` (`confirm_branch=preprod`, `confirm_target=production`) → branche miroir `production`.

Cloudflare Pages construit et sert chaque branche miroir :

- preprod : `https://preprod.bougnat-darts-counter.pages.dev` (alias de la branche ; `ccdc74ab.bougnat-darts-counter.pages.dev` est un ancien déploiement figé, à ne pas utiliser)
- production : `https://play.bougnatdarts.fr`

Un merge sur `main` ne déploie rien : les promotions restent manuelles.

## Suivi après publication

### J+1

- Ouvrir la production sur téléphone, tablette et PC : accueil, une partie X01 et une partie Cricket jusqu'à la fin, sans erreur dans la console.
- Vérifier que la version affichée sur l'accueil est la bonne et que le changelog in-app présente la nouvelle version.
- Lien partenaire : ouvrir un lien de match depuis le simulateur avec l'origine de production déclarée, vérifier le retour du résultat.
- Scoring vocal : consommation Deepgram du jour cohérente avec l'usage (pas d'emballement de jetons).
- Relire les retours des testeurs et les issues ouvertes depuis la publication.

### J+7

- Refaire le contrôle J+1 sur les appareils signalés par les joueurs.
- Bilan de la consommation Deepgram sur la semaine.
- Consigner le bilan dans les notes de la version (section « Suivi ») et fermer ou reporter nommément les points ouverts.

Quand ils existeront, ce suivi renverra au runbook de rotation des secrets (spec 118, #301) et au tableau de bord hebdomadaire (spec 127, #314) (DSO-FR-03).

## Quand revenir en arrière

Revenir à la version précédente si l'un de ces cas apparaît en production et qu'aucun correctif ne peut être promu dans l'heure :

- une partie ne peut plus être jouée ou terminée (X01 ou Cricket) sur un type d'appareil courant ;
- une session sauvegardée fait planter l'application au chargement ;
- le lien partenaire renvoie un résultat faux ou vers une origine non autorisée ;
- une fuite de secret ou une consommation Deepgram anormale.

Un défaut d'affichage gênant mais contournable se corrige en avant (correctif + nouvelle promotion), sans retour arrière.

## Procédure de retour arrière

1. **Cloudflare Pages (le plus rapide)** : dans le projet Pages, onglet *Deployments*, filtrer l'environnement *Production*, choisir le dernier déploiement de la version précédente et lancer *Rollback to this deployment*. Effet immédiat, aucune branche modifiée.
2. **Remettre la branche miroir en cohérence** : tant que `production` pointe sur la nouvelle version, la prochaine construction Pages la remettrait en ligne. Repousser le commit de la version précédente sur `production` (pour 2.1.0 → 1.1.4 : `c101ba4`), par une personne habilitée, ou relancer la promotion depuis une branche `preprod` revenue au bon commit.
3. **Partenaire** : prévenir badarts.fr si le lien de match est concerné (la 1.1.4 ne connaît pas le lien `v=1` : les liens s'ouvrent sur l'accueil sans pré-remplissage).
4. **Tracer** : ouvrir une issue « Retour arrière vX.Y.Z », avec la cause, l'heure et la décision ; garder le tag de la version retirée.

**Cas 2.2.0 → 1.1.4** : la compatibilité des sessions n'est pas établie par le test historique ci-dessous. Vérifier la reprise et les pertes éventuelles sur le candidat 2.2.0, et confirmer la version de repli alors en production, avant toute promotion ; consigner les preuves dans la gate et #361.

### Effets connus d'un retour 2.1.0 → 1.1.4

Vérifié le 2026-11-21 sur la 2.0.0 (voir [checklist](checklist.md), T013) ; la 2.1.0 ne change pas le schéma de session :

- les deux versions partagent la clé `bougnat-app-session-v1` et la base IndexedDB `bougnat-counter-local` (version 1) : aucune erreur au chargement ;
- une partie **X01** en cours est reprise à l'identique ;
- une partie **Cricket** (et, par extension, tout jeu autre que X01) en cours est perdue : la 1.1.4 rouvre le jeu remis à zéro ;
- les réglages propres à la version 2, comme le thème, sont ignorés par la 1.1.4 ;
- une partie X01 limitée en volées (2.1.0) se poursuit sans limite : la 1.1.4 ignore `maxVisitsPerLeg`.
