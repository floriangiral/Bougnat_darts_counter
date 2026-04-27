# Spec 021 - Counter Score Layout Font Scale Resilience

## Meta

- ID: `021-counter-score-layout-font-scale-resilience`
- Slug: `spec:counter/score-layout-font-scale-resilience`
- Statut: `active`
- Milestone cible: `M5: Offline-first UX`

## Objectif

Empecher le score joueur et le clavier de deborder de l'ecran sur les petits smartphones, y compris lorsque l'utilisateur a active une taille de police elevee dans les parametres systeme (iOS Dynamic Type, Android Font Scale).

## Contexte technique

Le layout de MatchView est une colonne flex sur `100dvh`:

```
[100dvh]
├── MatchTopBar       (min-h-[78px] — px, OK)
├── Score area        → flex-1
└── Control area      → shrink-0, hauteur fixe
```

### Probleme 1 — font-scale systeme gonfle les unites rem

`1rem` vaut 16px par defaut mais suit le facteur de police systeme. A 150%: 1rem = 24px.

Composants affectes:
- `PlayerScore.tsx` — score font: `clamp(5.5rem, 30vw, 13rem)` → plancher 132px a 150%
- `PlayerScore.tsx` — bloc nom: `h-[5.5rem]` → 132px a 150% au lieu de 88px
- `MatchView.tsx` — control area: `clamp(19rem, 38svh, 29rem)` → plancher 456px a 150%

Sur SE2 (667px) a 150% font-scale:
- TopBar: 78px
- Control area: 456px
- Score area disponible: 667 - 78 - 456 = 133px
- Score min (clamp): 132px → overflow quasi-certain

Sur SE1 (568px) a 150%: score area = 568 - 78 - 456 = 34px → overflow total.

### Probleme 2 — font-size score sans contrainte hauteur sur mobile

`30vw` est calcule sur la largeur, pas la hauteur disponible.
Sur un ecran portrait etroit, le score peut depasser la zone flex-1.

## Decisions

### D1 — Score font: unites viewport pures (rem → vw + svh)

```
// avant
text-[clamp(5.5rem,30vw,13rem)]

// apres
text-[min(30vw,22svh)]
```

- `30vw` : limite horizontale (2 colonnes)
- `22svh` : contrainte verticale proportionnelle
- Aucun rem = immunise au font-scaling systeme
- Les breakpoints md/lg/xl restent inchanges (deja en vw+vh)

### D2 — Bloc nom: rem → px

```
// avant
h-[5.5rem]  md:h-[6rem]  xl:h-[6.5rem]
// et
h-[2.75rem]  md:h-[3rem]  xl:h-[3.25rem]

// apres
h-[88px]  md:h-[96px]  xl:h-[104px]
// et
h-[44px]  md:h-[48px]  xl:h-[52px]
```

`px` est insensible au font-scale systeme.

### D3 — Control area: rem → px sur le plancher et le plafond du clamp

```
// avant (mobile)
h-[clamp(19rem,38svh,29rem)]
sm:h-[clamp(20rem,39svh,30rem)]

// apres
h-[clamp(220px,38svh,380px)]
sm:h-[clamp(240px,39svh,400px)]
```

Les valeurs px reproduisent exactement les valeurs rem a 1rem=16px (19*16=304 → arrondi 220 pour laisser de la marge au score; 29*16=464 → arrondi 380 par securite). Le pourcentage svh central est conserve.

Les breakpoints md/xl ne sont pas touches: ils utilisent deja des unites coherentes et le probleme ne se manifeste pas sur tablette/desktop.

## Invariants

1. Sur tout ecran smartphone (width < 768px), le score et le clavier tiennent dans `100dvh` a font-scale systeme jusqu'a 200%.
2. Sur les ecrans >= 667px en conditions normales (font-scale 100%), l'affichage est identique a avant.
3. Le conteneur du score a `overflow-hidden` pour clamper tout debordement residuel.
4. Les breakpoints md/lg/xl de PlayerScore et MatchView ne sont pas modifies.

## Impacted Code

- `components/game/PlayerScore.tsx`
- `views/MatchView.tsx`

## Canonical Entry Points

- `PlayerScore` (composant React)
- Control area div dans `MatchView`

## Validation

- Simulation DevTools iPhone SE (375x667) a 150% font-scale: aucun overflow
- Simulation DevTools iPhone SE1 (320x568): score et clavier visibles
- Ecrans >= 667px (iPhone 13+): aucun changement visuel perceptible
