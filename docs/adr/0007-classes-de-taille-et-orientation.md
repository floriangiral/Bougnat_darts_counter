---
id: ADR-0007
titre: Mise en page par classes de taille et orientation
statut: proposee
date: 2026-11-20
specs_liees: [070, 071, 072, 073, 027, 028]
---

# ADR-0007 — Classes de taille et orientation

## Statut
Proposée.

## Contexte
Deux détections concurrentes (`src/features/tablet/tabletLayout.ts:22-56` et `views/MatchView.tsx:246-266`) ; un iPad 10,2" Safari paysage (1080×750) et une Galaxy Tab 1280×800 reçoivent la mise en page téléphone ; cascade CSS qui écrase le keypad (`src/styles/tailwind.css:198` vs `:535`).

## Décision proposée
Un résolveur unique fondé sur la **classe de taille (largeur 600/840/1200, hauteur 480/900) et l'orientation**, sans user-agent ni type d'appareil ; le pointeur tactile ne change que la taille minimale des cibles (48 px). Quatre recettes de mise en page (`stack`, `stack-wide`, `arena`, `phone-landscape`) consommées par un composant à zones commun à tous les jeux.

Orientation : verrou paysage uniquement sur Android en plein écran, invite non bloquante ailleurs, limitée aux écrans de jeu (arbitrage du product owner requis ; WCAG 1.3.4).
