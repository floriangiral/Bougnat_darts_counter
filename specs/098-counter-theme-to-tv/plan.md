# Plan — 098 Thème transmis à l'écran TV

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant
- Aucune diffusion : `src/features/x01/session/useSharedX01Session.ts`, `src/application/scoring/ports.ts` (port `SyncRepository`, vestige).
- `public/_headers:2` : CSP (ouverture réseau traitée par 087).
- Modules à venir : `src/features/theming` (093), `normalizeLogo` (095), contrat TV (084), vues TV (086).

## 2. Approche retenue (et alternatives écartées)
Message `branding` séparé, référencé par empreinte, construit et validé par un module pur partagé. Écartées : thème dans chaque snapshot (trafic, plafond) ; CSS envoyé à la TV (injection) ; logo de l'éditeur (100 Ko) tel quel (plafond 12 Ko).

## 3. Étapes
1. Aligner le contrat avec 084 (`brandingHash`, type `branding`).
2. Ajouter le profil `tv` à `normalizeLogo` (095).
3. Écrire `brandingMessage.ts` : construction canonique, empreinte, bornes, validation.
4. Contrôleur : émission à l'ouverture, à la reconnexion et au changement de thème.
5. TV : réception, validation, dérivation en mode TV, application, cache, écran d'attente.
6. Tests unitaires, E2E deux fenêtres, puis qualification sur TV (090).

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `src/features/theming/tv/brandingMessage.ts` | Nouveau (pur) |
| `src/infrastructure/web/logoProcessor.ts` | Profil `tv` |
| Publication TV (085/087) | Émission du message |
| Vue TV (086) | Réception, application, écran d'attente |
| `tests/unit/theming/tv/*.test.ts`, `tests/e2e/tv-branding.spec.ts` | Nouveaux tests |

## 5. Impacts UI / domaine / application / infrastructure
UI TV : variables de thème, logo, écran d'attente. Domaine de jeu : aucun. Application : construction du message. Infrastructure : transport inchangé (message opaque).

## 6. Stratégie de migration (données, sessions persistées, contrats)
Ajout au contrat TV v1 (ou champ optionnel compatible) ; aucune donnée persistée.

## 7. Stratégie de test
Unitaires exhaustifs (bornes, falsification) ; E2E deux fenêtres avec BroadcastChannel ; mesure de trafic (1 message par session) ; terrain sur TV réelles.

## 8. Non-régression
Snapshots TV (084), performance TV, rendu officiel sans thème.

## 9. Rollback / désactivation (feature flag le cas échéant)
Drapeau de 093 : aucun message `branding` émis, TV au thème officiel.

## 10. Documentation à mettre à jour avec l'implémentation
Contrat TV (084) et guide utilisateur « TV aux couleurs du lieu ».
