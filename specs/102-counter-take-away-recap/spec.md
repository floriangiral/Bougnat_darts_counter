---
id: 102-counter-take-away-recap
v2_id: V2-SHARE-01
titre: Partage texte du résultat X01
type: fonctionnel
statut: implementee
validation: validee
origine: Décision du product owner
famille: innovation
priorite: P2
difficulte: M
recommandation: recommande
lot: 4
poids: 20
depend_de: []
remplace: []
remplacee_par: []
issue: '#273'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-23
---

# 102 — Partage texte du résultat X01

> **Décision du product owner (2026-11-23)** : le partage natif d'un résumé texte est retenu ; la carte image, le QR, le JSON et la vue de lecture sont hors périmètre.

## 1. Objectif

Après une partie X01, les joueurs peuvent partager son résultat depuis l'écran de statistiques, sans compte ni serveur. Le parcours de revanche doit être immédiatement accessible depuis l'écran de vainqueur.

## 2. Parcours utilisateur

1. À la fin d'un match X01 classique, l'écran « Vainqueur » propose « Voir les stats » et « Revanche ».
2. À la fin d'un match partenaire, l'écran « Vainqueur » propose uniquement « Envoyer le résultat à [partenaire] » ; ni statistiques ni revanche ne sont proposées sur cet écran.
3. « Revanche » enregistre localement le match terminé puis relance une partie avec les mêmes joueurs et la même configuration.
4. « Voir les stats » ouvre l'écran de résultats. Son action « Revanche » est remplacée par « Partager » ; « Sortie » reste disponible.
5. « Envoyer le résultat à [partenaire] » transmet immédiatement le résultat final validé et retourne au partenaire ; le parcours ne transite pas par l'écran de statistiques.
6. « Partager » ouvre la feuille de partage native avec un résumé texte. Si le partage natif n'est pas disponible, le texte est copié dans le presse-papiers et une confirmation est affichée.

## 3. Périmètre

### Inclus

- Matchs X01 terminés (simple, doublettes, robot, de deux à quatre joueurs).
- Résumé en français : format et règles d'entrée/sortie, vainqueur, score final en manches ou en sets, durée, moyenne 3 fléchettes, meilleur score et meilleur checkout par joueur ou équipe.
- Partage via `navigator.share({ title, text })` ; repli presse-papiers si l'API est indisponible.
- Revanche depuis l'écran de vainqueur, avec sauvegarde locale du match terminé avant le redémarrage.

### Exclu

- Carte image, QR dynamique, URL de récap, export JSON/CSV et historique partageable.
- Partage des résultats Cricket, Capital et Triathlon.
- Envoi automatique à un service, compte, stockage serveur ou télémétrie.

## 4. Règles et exigences fonctionnelles

- FR-01 : sur un X01 classique, l'écran de vainqueur affiche « Voir les stats » (action principale) et « Revanche » (action secondaire).
- FR-02 : la revanche conserve les joueurs et la configuration, crée un nouvel état X01 et enregistre le match terminé dans l'historique local.
- FR-03 : l'écran de statistiques classique affiche « Partager » et « Sortie » ; le bouton « Revanche » n'y apparaît plus.
- FR-04 : le texte partagé est calculé à partir du match terminé et des statistiques existantes ; les équipes de doublettes sont présentées comme une seule entrée.
- FR-05 : le partage natif reçoit un titre et un texte, sans fichier ni URL.
- FR-06 : si `navigator.share` est absent, le texte est copié avec `navigator.clipboard.writeText` et un message de confirmation accessible est affiché.
- FR-07 : une annulation de la feuille native ne produit pas d'erreur visible ; les autres échecs sont signalés clairement.
- FR-08 : pour un match partenaire, l'écran de vainqueur affiche uniquement « Envoyer le résultat à [partenaire] » ; il ne propose ni statistiques ni « Revanche ».
- FR-09 : l'envoi partenaire utilise le match terminé transmis par la vue, jamais un instantané antérieur ; après sauvegarde, il conserve la navigation et la session validées par le contrat 030.
- FR-10 : le clic sur l'action partenaire envoie immédiatement les scores définitifs et retourne vers le partenaire sans écran intermédiaire.

## 5. Confidentialité et compatibilité

- Le compteur ne transmet pas le résumé à son propre serveur. Le partage n'a lieu qu'à la demande du joueur via la feuille système ou le presse-papiers.
- Aucun changement de dépendance, de CSP ou de backend.
- Sur iPhone, vérifier le partage natif en Safari et en PWA installée ; les navigateurs sans Web Share utilisent le presse-papiers si autorisé.
- Le retour automatique de l'écran de stats est suspendu tant que la feuille de partage native est ouverte.

## 6. Critères d'acceptation

- AC-01 : l'écran X01 vainqueur expose simultanément « Revanche » et « Voir les stats » ; le premier démarre une nouvelle partie et ne perd pas l'historique du match terminé.
- AC-02 : l'écran de stats normal propose « Partager » et « Sortie », sans « Revanche ».
- AC-03 : le texte est exact pour les manches, les sets, les doublettes et les matchs sans meilleur checkout.
- AC-04 : `navigator.share` reçoit le titre et le texte attendus ; son annulation est silencieuse.
- AC-05 : en absence de Web Share, le presse-papiers reçoit le même texte et l'interface confirme la copie ; un refus du presse-papiers affiche une erreur explicite.
- AC-06 : l'écran de vainqueur partenaire n'affiche que l'action nommée vers le partenaire ; le clic renvoie les scores définitifs attendus.
- AC-07 : l'envoi partenaire est déclenché depuis l'écran de vainqueur, sans étape de statistiques intermédiaire.
- AC-08 : après rechargement d'un résultat partenaire terminé, l'écran de vainqueur reste le point d'entrée d'envoi.
- AC-09 : la suite e2e existante du lien partenaire reste verte, avec les parcours ajustés à la nouvelle place du bouton.

## 7. Décisions validées

| Sujet | Décision |
|---|---|
| Plateforme de jeu V1 | X01 classique |
| Format de partage | Texte via Web Share |
| Repli | Copie presse-papiers, avec confirmation |
| Données | Vainqueur, score, format, durée et statistiques clés par concurrent |
| Doublettes | Résumé par équipe |
| Image, QR, JSON, autres jeux | Hors périmètre de cette évolution |
| Match partenaire | Envoi nommé et immédiat depuis l'écran de vainqueur ; pas de statistiques ni de revanche avant le retour partenaire |
| Télémétrie et backend | Aucun |
