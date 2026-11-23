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
verifie_au_commit: 0b6b680
derniere_revue: 2026-11-23
---

# 102 — Partage texte du résultat X01

> **Décision du product owner (2026-11-23)** : le partage natif d'un résumé texte est retenu ; la carte image, le QR, le JSON et la vue de lecture sont hors périmètre.

## 1. Objectif

Après une partie X01 classique, les joueurs arrivent directement sur l'écran de statistiques, où ils peuvent partager le résultat, relancer une revanche ou quitter, sans compte ni serveur. L'écran de vainqueur intermédiaire est supprimé hors match partenaire.

## 2. Parcours utilisateur

1. À la fin d'un match X01 classique, l'écran de vainqueur est sauté et l'écran de statistiques s'ouvre directement.
2. À la fin d'un match partenaire, le compteur ouvre automatiquement l'URL de retour dans un nouvel onglet et affiche directement les statistiques dans l'onglet du compteur ; aucun écran intermédiaire ni bouton d'envoi n'est affiché.
3. Les stats classiques proposent « Revanche », « Partager » et « Sortie ». « Revanche » enregistre localement le match terminé puis relance une partie avec les mêmes joueurs et la même configuration.
4. « Partager » ouvre la feuille native avec un résumé texte. Si le partage natif n'est pas disponible, le texte est copié dans le presse-papiers et une confirmation est affichée.
5. Si l'ouverture du retour partenaire échoue ou est bloquée, les statistiques proposent « Réessayer » et « Prévenir l’organisation ». Ce dernier partage le résumé du match via les mécanismes natifs ou le presse-papiers ; il ne contacte pas directement l'organisation.
6. Après l'ouverture du retour partenaire, un message non bloquant de 2 secondes informe les joueurs que le résultat a été envoyé vers le partenaire.

## 3. Périmètre

### Inclus

- Matchs X01 terminés (simple, doublettes, robot, de deux à quatre joueurs).
- Résumé en français : format et règles d'entrée/sortie, vainqueur, score final en manches ou en sets, durée, moyenne 3 fléchettes, meilleur score et meilleur checkout par joueur ou équipe.
- Partage via `navigator.share({ title, text })` ; repli presse-papiers si l'API est indisponible.
- Revanche depuis les statistiques des matchs classiques, avec sauvegarde locale du match terminé avant le redémarrage.

### Exclu

- Carte image, QR dynamique, URL de récap, export JSON/CSV et historique partageable.
- Partage des résultats Cricket, Capital et Triathlon.
- Envoi automatique à un service, compte, stockage serveur ou télémétrie.

## 4. Règles et exigences fonctionnelles

- FR-01 : après un X01 classique, le compteur affiche directement l'écran de statistiques sans écran de vainqueur intermédiaire.
- FR-02 : la revanche conserve les joueurs et la configuration, crée un nouvel état X01 et enregistre le match terminé dans l'historique local.
- FR-03 : l'écran de statistiques X01 affiche « Revanche », « Partager » et « Sortie ».
- FR-04 : le texte partagé est calculé à partir du match terminé et des statistiques existantes ; les équipes de doublettes sont présentées comme une seule entrée.
- FR-05 : le partage natif reçoit un titre et un texte, sans fichier ni URL.
- FR-06 : si `navigator.share` est absent, le texte est copié avec `navigator.clipboard.writeText` et un message de confirmation accessible est affiché.
- FR-07 : une annulation de la feuille native ne produit pas d'erreur visible ; les autres échecs sont signalés clairement.
- FR-08 : pour un match partenaire, le compteur ouvre automatiquement le retour partenaire à la fin du match et affiche directement les statistiques ; aucun écran intermédiaire, bouton d'envoi ou bouton « Revanche » n'est proposé.
- FR-09 : l'envoi partenaire utilise le match terminé transmis par la vue, jamais un instantané antérieur ; l'onglet du compteur reste sur les statistiques.
- FR-10 : si l'ouverture du retour échoue, les statistiques proposent « Réessayer » et « Prévenir l’organisation » ; ce dernier partage le résumé et ne notifie pas directement un contact.
- FR-11 : après l'ouverture du retour, un message non bloquant est affiché pendant 2 secondes. Il indique l'ouverture du retour, pas un accusé de réception du partenaire.

## 5. Confidentialité et compatibilité

- Le compteur ne transmet pas le résumé à son propre serveur. Le partage n'a lieu qu'à la demande du joueur via la feuille système ou le presse-papiers.
- Aucun changement de dépendance, de CSP ou de backend.
- Sur iPhone, vérifier le partage natif en Safari et en PWA installée ; les navigateurs sans Web Share utilisent le presse-papiers si autorisé.
- Le retour automatique de l'écran de stats est suspendu tant que la feuille de partage native est ouverte.

## 6. Critères d'acceptation

- AC-01 : après un X01 classique, l'écran de stats s'ouvre directement et propose « Revanche », « Partager » et « Sortie ».
- AC-02 : « Revanche » démarre une nouvelle partie avec les mêmes joueurs et règles, sans perdre l'historique du match terminé.
- AC-03 : le texte est exact pour les manches, les sets, les doublettes et les matchs sans meilleur checkout.
- AC-04 : `navigator.share` reçoit le titre et le texte attendus ; son annulation est silencieuse.
- AC-05 : en absence de Web Share, le presse-papiers reçoit le même texte et l'interface confirme la copie ; un refus du presse-papiers affiche une erreur explicite.
- AC-06 : la fin d'un match partenaire ouvre l'URL de retour dans un nouvel onglet et affiche directement les statistiques dans le compteur, sans revanche ni écran intermédiaire.
- AC-07 : si l'ouverture du retour échoue, « Réessayer » relance l'ouverture et « Prévenir l’organisation » partage le résumé du match.
- AC-08 : après rechargement d'un résultat partenaire envoyé, les statistiques restent affichées sans revanche ; après rechargement d'un résultat non envoyé, les actions de secours restent disponibles.
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
| Match partenaire | Envoi automatique à la fin, stats directes ; actions de secours Réessayer / Prévenir l’organisation en cas d'échec |
| Télémétrie et backend | Aucun |
