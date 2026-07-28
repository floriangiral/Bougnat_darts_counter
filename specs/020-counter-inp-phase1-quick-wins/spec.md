# Spec 020 - Counter INP Phase 1 Quick Wins

## Meta

- ID: `020-counter-inp-phase1-quick-wins`
- Slug: `spec:counter/inp-phase1-quick-wins`
- Statut: `active`
- Milestone cible: `M8: Performance & UX Polish`

## Objectif

Faire passer l'Interaction to Next Paint (INP) mobile sous les 200ms (seuil "Good" Core Web Vitals) en eliminant les blocages du thread principal sur le chemin critique d'interaction du clavier de saisie.

Mesure de depart: INP P75 mobile = 296ms (zone orange, seuil Good < 200ms).

## Contexte technique

L'INP mesure le temps entre l'interaction utilisateur (tap, click) et la prochaine frame peinte par le navigateur. Sur le Keypad X01:

- `onClick` sur mobile declenche ~50ms apres `onPointerDown` (delai desambiguation double-tap)
- `localStorage.setItem` est synchrone et bloque le thread principal (~20-60ms sur mobile)
- `persistAppSession` est appele a chaque render de match runtime, soit plusieurs fois par seconde en cours de partie

## Perimetre - Phase 1

Trois corrections independantes et non-invasives:

### 1.1 - onPointerDown sur le Keypad X01

Remplacer `onClick` par `onPointerDown` sur tous les boutons de saisie pure (chiffres 0-9, shortcuts gauche/droite). Elimine le delai tactile de ~50ms.

Contraintes:
- Les boutons 1/2/3 conservent leur mecanique long-press (appui > 450ms = checkout shortcut)
- `longPressTriggered` migre de `useState` vers `useRef` pour eviter les fermetures stales dans `onPointerUp`
- Les boutons RESTE, CLEAR (C), OK restent sur `onClick` (actions de soumission/annulation, delai acceptable)
- Garde `isPrimary` sur les handlers pointer pour eviter les declenchements multi-touch accidentels

### 1.2 - Suppression du double-write localStorage synchrone

Dans `IndexedDBSessionRepository.saveAppSession`, supprimer l'appel direct `writeLocalStorageJson(APP_SESSION_STORAGE_KEY, session)` qui est redondant avec `writeFallbackJson` (meme cle, meme stockage).

Contrainte: `getRestoredAppSession` (lecture synchrone au boot) reste fonctionnel car `writeFallbackJson` ecrit dans `this.storage = window.localStorage`.

### 1.3 - Debounce de persistAppSession

Dans `appShell.ts`, envelopper `persistAppSession` dans un debounce de 300ms. En cours de partie, les appels sont groupes; seul le dernier etat est persiste.

Contrainte: le debounce s'applique uniquement a l'ecriture asynchrone; `clearPersistedAppSession` reste synchrone et non-debounce.

## Invariants

1. La session est toujours coherente apres un rechargement de page (meme si la derniere ecriture debounce n'a pas encore fire).
2. Les digits tapes sur le keypad declenchent leur action sur le premier contact, sans double-declenchement.
3. Le long-press sur les boutons 1/2/3 continue de fonctionner apres 450ms sans declencher la saisie chiffre.
4. L'action de clear (C) et l'action d'entree (OK) restent sur click (pas de regression sur le chemin submit).

## Impacted Code

- `components/game/Keypad.tsx`
- `src/infrastructure/local/IndexedDBSessionRepository.ts`
- `src/app/appShell.ts`

## Canonical Entry Points

- `Keypad` (React component)
- `IndexedDBSessionRepository.saveAppSession`
- `persistAppSession` (appShell)

## Key Tests

- `tests/unit/application/indexedDbSessionRepository.test.ts` (existant + nouveau cas)
- `tests/unit/app/persistAppSession.test.ts` (nouveau)

## Validation

- INP P75 mobile < 200ms apres deploiement
- Aucun test unitaire existant casse
- Persistance de session correcte apres reload
- Long-press checkout fonctionne sur les boutons 1/2/3
