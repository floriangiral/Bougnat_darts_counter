---
id: 131-counter-x01-bust-voice-default
v2_id: V2-GAMES-32
titre: Bouton trop X01 et voix désactivée par défaut
type: fonctionnel
statut: en-cours
validation: en-attente
origine: Demande explicite du product owner (2026-11-23)
famille: jeux
priorite: P1
difficulte: M
recommandation: recommande
lot: 2
poids: 30
depend_de: []
issue: à créer
verifie_au_commit: à renseigner
derniere_revue: 2026-11-23
---

# 131 — Bouton trop X01 et voix désactivée par défaut

## Décision

Le product owner a validé le comportement décrit dans la conversation et demandé son implémentation. La voix est désactivée par défaut, reste activable dans les réglages et conserve les préférences existantes. Lorsqu'elle est désactivée ou indisponible, le pavé X01 affiche à la place de sa touche un bouton « Trop de score ». Un appui déclare immédiatement un trop, sans confirmation, uniquement lorsqu'il est possible selon les règles et le score restant.

## Règles et critères d'acceptation

- La volée est enregistrée comme un trop de trois fléchettes, sans modifier le score du camp ; le joueur suivant joue selon la rotation habituelle.
- La déclaration par le bouton ne déclenche aucune animation de trop ; la saisie ordinaire conserve ses messages.
- La possibilité du trop tient compte des fléchettes, de l'ouverture et de la règle de sortie ; le bouton et le moteur refusent un trop impossible.
- L'annulation restaure la volée et la limite de volées fonctionne comme pour les autres trops ; les parties partenaires respectent les droits de saisie.
- Un score en cours de saisie est effacé ; la commande est indisponible lorsque le pavé est verrouillé.
- L'activation vocale rétablit la touche micro et son parcours de confidentialité.
- Les réglages stockés restent inchangés : seul le défaut sans préférence passe à désactivé.
- Les tests couvrent le moteur, la commande et les réglages ; les textes et notes de version sont mis à jour.

## Hors périmètre

Modification des règles des autres jeux ou changement des choix déjà enregistrés.
