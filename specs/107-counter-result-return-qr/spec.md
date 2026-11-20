---
id: 107-counter-result-return-qr
v2_id: V2-INT-04
titre: Retour du résultat d'un match lié par QR code (inter-appareils)
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Demande V2
famille: integrations
priorite: P2
difficulte: S
recommandation: optionnel
lot: 4
poids: 30
depend_de: [V2-QR-01, V2-INT-01]
remplace: []
remplacee_par: []
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 107 — Retour du résultat d'un match lié par QR code (inter-appareils)

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte
Demande V2 issue de l'audit des intégrations (rapport 08 §2.7, §5.2, limite L4 ; compte rendu V2 §C.10, §D.4). Le contrat `v=1` (spec 030) ne renvoie le résultat que par une navigation dans **l'onglet du compteur**. Le partenaire actuel (badarts.fr) ouvre le compteur dans un nouvel onglet et relaie le résultat par `BroadcastChannel`, ce qui ne fonctionne que sur le même appareil et le même navigateur. Quand la tablette de cible n'est pas l'appareil de l'organisateur, le résultat est ressaisi à la main.

## 2. Problématique
Le résultat d'un match lié ne peut pas quitter la tablette de cible vers l'appareil de l'organisateur sans navigation locale ni ressaisie.

## 3. Objectifs
- Permettre de transmettre le résultat d'un match lié à un autre appareil en un scan, sans serveur, sans compte et sans changer le contrat `v=1`.
- Ne rien changer au bouton « ENVOYER LE RÉSULTAT » ni au parcours de base.
- Coût récurrent : 0 €.

## 4. État actuel vérifié dans le code
- [vérifié] L'URL de résultat est construite et revalidée à l'affichage : `src/features/external-match/externalMatchLink.ts:438-462`, `App.tsx:270-277`.
- [vérifié] Le bouton d'envoi est porté par la prop `externalReturn` de `views/StatsView.tsx` ; il déclenche `leaveForPartner`, qui efface le contexte puis navigue (`App.tsx:279-288`, `:202-209`).
- [vérifié] Le retour automatique de 2 min est désactivé tant que le résultat n'est pas envoyé (spec 030, « Architectural decisions »).
- [vérifié] `qrcode` est une dépendance déclarée (`package.json`, bloc `dependencies`) mais utilisée seulement au build (`scripts/generate-app-qr.mjs:3`) ; aucun générateur côté client. La spec V2-QR-01 (092) propose un générateur chargé à la demande avec un type de payload `partner-result` dont le plafond est fixé ici.
- [vérifié] Le TTL de 12 h s'applique au contexte restauré (`externalMatchLink.ts:341-350`), pas à l'URL de résultat.
- [hypothèse] Une page de retour partenaire ouverte sur un autre appareil fonctionne si le partenaire ne dépend pas d'un état local à l'onglet ouvreur ; pour badarts.fr, la page affiche au minimum « Saisissez ce score à la main » avec le score (rapport 08 §2.7) [à confirmer par V2-INT-02 / 106].

## 5. Comportement cible
Sur l'écran de fin d'un match lié dont le résultat peut être envoyé, une action secondaire « Transmettre par QR code » ouvre un panneau qui affiche le QR code de **la même URL** que le bouton d'envoi, avec le domaine de destination et un lien copiable. L'organisateur scanne avec son appareil ; la page du partenaire s'ouvre chez lui. Sur la tablette, les joueurs indiquent ensuite « Résultat transmis » (le contexte est effacé, retour à la sélection de jeu) ou ferment le panneau (rien ne change). Le compteur ne sait pas si le scan a réussi : il ne prétend jamais le contraire.

## 6. Périmètre
### Inclus
- Panneau QR pour le résultat `completed` d'un match lié.
- Action « Résultat transmis » qui efface le contexte sans navigation.
- Libellés, accessibilité, tests.
### Exclu
- Tout nouveau paramètre du contrat ; tout appel réseau ; toute signature.
- QR d'abandon (`status=cancelled`) : question ouverte Q3.
- Matchs non liés (voir V2-SHARE-01 / 102 pour le récap partageable).
- Lecture d'un QR par le compteur (caméra).

## 7. User stories
- En tant qu'organisateur à la table de marque, je veux scanner le résultat affiché sur la tablette de cible, afin de ne pas ressaisir le score.
- En tant que joueur, je veux continuer à envoyer le résultat en un geste quand l'organisateur utilise la tablette, afin que rien ne change pour moi.
- En tant que partenaire, je veux recevoir exactement la même URL qu'avec le bouton, afin de ne rien modifier de mon côté.

## 8. Règles métier
- RM-01 Le texte encodé est la chaîne retournée par `buildExternalReturnUrl` au moment de l'ouverture du panneau, sans transformation.
- RM-02 Le panneau n'est proposé que si cette chaîne est non nulle (match terminé, lié, conforme, origine autorisée).
- RM-03 Le QR n'est ni persisté ni journalisé ; il disparaît à la fermeture du panneau, au changement d'écran et au rechargement.
- RM-04 Afficher le QR ne vaut pas envoi : le contexte reste présent, la sortie reste gardée par le dialogue « Résultat non envoyé ».
- RM-05 « Résultat transmis » efface le contexte comme un envoi, sans navigation.

## 9. Parcours utilisateurs
1. Fin d'un match lié → écran de statistiques avec « ENVOYER LE RÉSULTAT » (inchangé) et « Transmettre par QR code » (nouveau, secondaire).
2. Appui sur « Transmettre par QR code » → panneau : QR, « Vers {host} », lien copiable, « Résultat transmis », « Fermer ».
3. L'organisateur scanne ; la page du partenaire s'ouvre sur son appareil.
4. Appui sur « Résultat transmis » → confirmation courte → contexte effacé → sélection de jeu.

## 10. Exigences fonctionnelles
- FR-01 Ajouter à `StatsView` une action secondaire visible seulement si `externalReturn` est fourni.
- FR-02 Afficher le QR via le composant `QrCode` de V2-QR-01 (092) avec le type `partner-result`.
- FR-03 Fixer le plafond `partner-result` à 1 024 octets [proposé, à confirmer par mesure] ; au-delà, afficher seulement le lien copiable et un message non bloquant.
- FR-04 Afficher le domaine (`host`) de destination au-dessus du QR, comme le bouton.
- FR-05 Ajouter « Résultat transmis » qui appelle un nouveau gestionnaire d'`App.tsx` effaçant le contexte (même effet que `leaveForPartner` sans `setPartnerNavigationUrl`).
- FR-06 Garder actif le dialogue « Résultat non envoyé » tant que « Résultat transmis » n'est pas confirmé.
- FR-07 Libellés neutres en français dans `externalMatchLabels.fr.ts`.

## 11. Exigences non fonctionnelles
- NFR-01 Performance : aucun octet du générateur QR dans les chunks des écrans de jeu (hérité de 092).
- NFR-02 Lisibilité : QR noir sur blanc, ≥ 200 px CSS sur tablette, scannable à 1 m [à confirmer sur appareil].
- NFR-03 Accessibilité : `alt` « QR code du résultat pour {host} », focus visible, panneau fermable au clavier.
- NFR-04 Sécurité et confidentialité : aucune requête réseau ajoutée, CSP inchangée ; avertissement « Toute personne qui scanne ce code peut ouvrir la page du partenaire ».
- NFR-05 Coût récurrent : 0 €.

## 12. Cas nominaux et alternatifs
- Nominal : scan puis « Résultat transmis ».
- Alternatif : les joueurs ferment le panneau puis utilisent « ENVOYER LE RÉSULTAT » sur la tablette.
- Alternatif : lien copié et partagé par un autre moyen (messagerie) — hors contrôle du compteur.

## 13. Cas limites
- Rechargement pendant l'affichage : le panneau n'est pas rouvert ; le contexte est restauré s'il a moins de 12 h.
- Contexte de plus de 12 h dans un onglet jamais rechargé : le QR reste disponible (cohérent avec C4 de la Révision V2 de 030) ; la fraîcheur relève du jeton du partenaire.
- URL de retour longue (paramètres partenaire volumineux) : FR-03.
- Format sets, double, `stats=1` : même URL que le bouton.

## 14. Gestion des erreurs
- Chunk QR indisponible (hors ligne au premier usage) : message « QR code indisponible », lien copiable conservé.
- Presse-papiers refusé : sélectionner le texte du lien pour copie manuelle.

## 15. Impacts architecturaux
Présentation uniquement : nouveau composant `components/external-match/ExternalResultQrPanel.tsx`, prop étendue de `StatsView`, gestionnaire dans `App.tsx`. Le module pur `externalMatchLink.ts` n'est pas modifié. Le générateur reste derrière le port de 092. Aucune règle de jeu touchée.

## 16. Impacts sur les données et les interfaces
Aucun changement de `PersistedAppSession` ni du contrat `v=1`. Nouveau type de payload consommé : `partner-result` (défini par 092).

## 17. Compatibilité avec l'existant
Partenaires `v=1` inchangés ; le bouton d'envoi reste l'action principale ; sans lien, aucun changement.

## 18. Dépendances
- V2-QR-01 (092) : générateur QR client (bloquant).
- V2-INT-01 (030) : contrat figé et libellés neutres.
- V2-INT-02 (106) : validation du besoin (recommandée avant implémentation).
- Lien : V2-INT-08 (110) pour informer les partenaires.

## 19. Critères d'acceptation
- AC-01 Match lié X01 simple terminé 3-1 sur tablette (Chromium) → « Transmettre par QR code » visible ; le texte transmis à l'encodeur est strictement égal à l'URL du bouton (test de composant avec encodeur simulé).
- AC-02 Match non lié terminé → l'action n'existe pas.
- AC-03 Contexte présent mais match non conforme (joueurs modifiés dans le stockage) → l'action n'existe pas.
- AC-04 Panneau ouvert puis « SORTIE » → dialogue « Résultat non envoyé » affiché.
- AC-05 « Résultat transmis » confirmé → contexte absent de la session persistée, écran de sélection de jeu, aucune navigation externe (E2E).
- AC-06 Aucune requête réseau autre que le chunk QR same-origin pendant l'affichage (E2E, écoute des requêtes).
- AC-07 Scan réel sur iPhone et Android de l'organisateur ouvre la page de retour du simulateur partenaire avec les mêmes paramètres [terrain, à confirmer].

## 20. Scénarios de tests
- Unitaires/composants : `tests/unit/components/externalResultQrPanel.test.tsx` (AC-01 à AC-04), `statsViews.test.tsx` (présence conditionnelle).
- E2E : `tests/e2e/external-match-link.smoke.spec.ts` (AC-05, AC-06).
- Terrain : simulateur partenaire `docs/integration/partner-simulator/` servi en local (AC-07).

## 21. Exigences de non-régression
Les tests `tests/unit/externalMatch/*`, les tests golden de V2-INT-01 et les E2E du lien restent verts ; le bouton « ENVOYER LE RÉSULTAT » garde son libellé, sa place et son comportement.

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Un tiers scanne le QR et consomme le jeton | Moyen | Faible | Jeton à usage unique et validation humaine côté partenaire ; QR affiché sur action explicite |
| Page partenaire inutilisable sur un autre appareil | Moyen | Moyenne | Valider avec 106 ; guide partenaire |
| Les joueurs croient le résultat envoyé après simple affichage | Moyen | Moyenne | RM-04, « Résultat transmis » explicite |
| Poids du générateur | Faible | Faible | Chargement à la demande (092) |

## 23. Décisions architecturales
Pas de nouvel ADR. S'inscrit dans [ADR-0009](../../docs/adr/0009-integrations-pas-de-port-generique-premature.md) (« pas de port générique avant un deuxième canal », proposée) : canal de sortie supplémentaire sans changement de contrat. Si ce canal est accepté, il compte comme « 2ᵉ canal » déclencheur de V2-INT-03 (111).

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Disponibilité | (a) pour tout partenaire ; (b) seulement si le lien porte un paramètre additif optionnel `qr=1` | (a), après REX 106 ; (b) si un partenaire signale une page non utilisable sur un autre appareil | — |
| Q2 | Embarquer un générateur côté client (H.25) | via 092 / non | Via 092 uniquement | — |
| Q3 | QR aussi pour l'abandon (`cancelled`) | oui / non | Non dans un premier temps | — |
| Q4 | Confirmation de « Résultat transmis » | aucune / dialogue court | Dialogue court | — |

## 25. Traçabilité
Rapport 08 §2.5 (L4), §2.7, §5.2, §7 (V2-INT-04), §8 (D5, D9) ; compte rendu V2 §C.10, §F.7, §H.25 ; spec 030 ; spec 092 ; spec 106.
