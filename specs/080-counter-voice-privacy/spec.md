---
id: 080-counter-voice-privacy
v2_id: V2-VOICE-09
titre: Voix — confidentialité (UE, mip_opt_out, information)
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Demande V2
famille: voix
priorite: P0
difficulte: S
recommandation: recommande
lot: 0
poids: 60
depend_de: []
remplace: []
remplacee_par: []
issue: '#208'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 080 — Voix — confidentialité (UE, mip_opt_out, information)

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte
Demande V2 et rapport d'audit 04 (§2.3, §2.8, P15, §8 V2-VOICE-09, §9.4) ; compte rendu §C.1 (« aucune information utilisateur sur l'envoi de l'audio, région US, `mip_opt_out` non activé ») et §H.5. La voix envoie la parole du joueur à un sous-traitant (Deepgram) ; l'application revendique gratuité, absence de compte et absence de publicité, ce qui rend la transparence d'autant plus nécessaire.

## 2. Problématique
L'utilisateur n'est informé nulle part que sa voix quitte l'appareil, vers un service situé par défaut aux États-Unis, potentiellement utilisé pour améliorer les modèles du fournisseur.

## 3. Objectifs
- O1 — Informer clairement avant la première écoute, sans compte ni étape ajoutée au parcours de base.
- O2 — Exclure l'audio du programme d'amélioration des modèles du fournisseur (`mip_opt_out`).
- O3 — Traiter l'audio dans l'UE si l'option est validée (endpoint UE).
- O4 — Documenter le traitement (README, `SECURITY.md`, page de confidentialité).

## 4. État actuel vérifié dans le code
- [vérifié] Configuration d'écoute sans `mip_opt_out` (`src/features/x01/voice/voiceConfig.ts:19-35`) ; documentation Deepgram : « Add `mip_opt_out=true` … to be excluded » [EXT 2026-11-20].
- [vérifié] Endpoint par défaut `api.deepgram.com` : le SDK `@deepgram/sdk` 5.20 ne déclare qu'un environnement `Production` (`node_modules/@deepgram/sdk/dist/esm/environments.mjs`) ; l'endpoint UE `api.eu.deepgram.com` existe [EXT, page tarifs, section GDPR] mais n'est pas utilisé.
- [vérifié] CSP `connect-src 'self' https://api.deepgram.com wss://api.deepgram.com …` (`public/_headers:2`) : l'endpoint UE serait bloqué sans modification.
- [vérifié] Jeton émis par `https://api.deepgram.com/v1/auth/grant` (`lib/deepgramToken.ts:19`) ; validité d'un jeton US sur l'endpoint UE [à confirmer].
- [vérifié] Aucune information dans l'UI : le réglage dit seulement « Assistance vocale IA … Active par défaut » (`components/match/MatchSettingsModal.tsx:89-91`) ; recherche `confidentialit|privacy|rgpd|gdpr` dans `README.md`, `SECURITY.md`, `docs/*.md` : aucun résultat pertinent ; `README.md:24` présente la voix sans mention du traitement.
- [vérifié] Les keyterms partent en paramètres d'URL du WebSocket (`voiceConfig.ts:2-17`) : aucun prénom aujourd'hui (à préserver, spec 075).
- [vérifié] Les journaux d'erreur de production ne contiennent pas de transcript (`src/features/x01/voice/voiceStreamingLogger.ts:11-12` ; appels `useDeepgramStreaming.ts:194,444,482,499,590`) [vérifié sur les champs passés].

## 5. Comportement cible
Au premier appui sur le micro (ou à la première activation du mode mains libres), une fiche courte s'affiche : « Ta voix est envoyée à Deepgram pour être transcrite, uniquement pendant l'écoute. Bougnat Darts ne l'enregistre pas. [Région]. [Exclusion de l'entraînement]. Tu peux couper la voix à tout moment. » — boutons « Activer le micro » / « Saisie manuelle ». Le choix est mémorisé sur l'appareil. La connexion utilise `mip_opt_out=true` et, si validé, l'endpoint UE.

## 6. Périmètre
### Inclus
Fiche d'information, mémorisation locale, `mip_opt_out`, endpoint UE (si Q1), CSP, documentation, règle « aucun prénom envoyé ».
### Exclu
Politique de confidentialité générale du site vitrine (hors repo) ; diffusion TV (spec 087) ; mesures (spec 074).

## 7. User stories
- En tant que joueur, je veux savoir où part ma voix avant d'autoriser le micro.
- En tant que club, je veux pouvoir dire à mes membres que l'audio n'est pas conservé ni utilisé pour entraîner un modèle.

## 8. Règles métier
- RM-01 — Aucune écoute sans affichage préalable de la fiche (une fois par appareil et par version de la fiche).
- RM-02 — Refuser n'a aucune conséquence sur le jeu (saisie manuelle).
- RM-03 — Aucun prénom ni identifiant de joueur n'est envoyé au fournisseur (ni keyterm, ni métadonnée).
- RM-04 — Toute nouvelle finalité ou nouveau sous-traitant (moteur de la spec 078, Web Speech « serveur ») exige une nouvelle version de la fiche.

## 9. Parcours utilisateurs
1. Premier appui micro → fiche → « Activer le micro » → invite système → écoute.
2. Premier appui micro → fiche → « Saisie manuelle » → retour au pavé, voix désactivée pour le match.
3. Réglages du match → lien « En savoir plus sur la voix » → fiche.

## 10. Exigences fonctionnelles
- FR-01 — Fiche d'information (texte validé par le PO) avant la première écoute ; versionnée ; mémorisée localement (`voicePrivacyNotice.v1`).
- FR-02 — `mip_opt_out: 'true'` ajouté à la configuration d'écoute.
- FR-03 — (Si Q1 = UE) environnement personnalisé du SDK vers `api.eu.deepgram.com` / `wss://api.eu.deepgram.com`, jeton obtenu de façon compatible [à confirmer], CSP mise à jour, route locale de développement alignée.
- FR-04 — Lien « En savoir plus » dans les réglages du match.
- FR-05 — Documentation : section « Voix et confidentialité » dans `README.md`, `SECURITY.md` (sous-traitant, données, durée), page dédiée dans `docs/`.
- FR-06 — Test garantissant l'absence de prénom dans la configuration d'écoute.

## 11. Exigences non fonctionnelles
- NFR-01 Aucune étape ajoutée au parcours ouvrir → jeu → prénoms → jouer (fiche au premier appui micro seulement).
- NFR-02 Coût : `mip_opt_out` et endpoint UE — impact tarifaire [à confirmer auprès de Deepgram] ; aucun coût côté application.
- NFR-03 Fiche lisible (contraste, taille), accessible au clavier et au lecteur d'écran.

## 12. Cas nominaux et alternatifs
Nominal : parcours 1. Alternatifs : refus (2), consultation (3).

## 13. Cas limites
Stockage local indisponible (navigation privée) → fiche à chaque session ; nouvelle version de fiche → réaffichage ; mode mains libres activé directement → fiche avant l'ouverture du micro.

## 14. Gestion des erreurs
Endpoint UE indisponible → cause `connection`, retour au manuel ; aucune bascule silencieuse vers les États-Unis (Q2).

## 15. Impacts architecturaux
Configuration de l'adaptateur Deepgram (infrastructure) ; fiche en présentation ; préférence locale. Domaine inchangé.

## 16. Impacts sur les données et les interfaces
Nouvelle clé locale versionnée ; aucune donnée transmise en plus.

## 17. Compatibilité avec l'existant
Comportement vocal identique après acceptation ; CSP élargie au seul domaine UE du même fournisseur.

## 18. Dépendances
Aucune bloquante. Liens : V2-VOICE-10 / 006 (la route de jeton peut devoir viser l'UE), V2-VOICE-05 / 076 (fiche avant écoute continue), V2-VOICE-07 / 078 (nouveaux moteurs), V2-DOC-01 / 034 (documentation).

## 19. Critères d'acceptation
- AC-01 — Premier appui micro sur un appareil vierge → fiche affichée, aucun `getUserMedia` avant le choix (test composant).
- AC-02 — Après acceptation, la fiche ne réapparaît pas ; après refus, aucun appel au jeton.
- AC-03 — La configuration d'écoute contient `mip_opt_out` (test unitaire de `buildDeepgramListenConfig`).
- AC-04 — (Si UE) le WebSocket vise `wss://api.eu.deepgram.com` et la CSP l'autorise ; une session réelle en preview transcrit correctement.
- AC-05 — Aucun prénom dans la configuration d'écoute (test FR-06).
- AC-06 — `README.md`, `SECURITY.md` et la page dédiée décrivent sous-traitant, finalité, région, conservation, désactivation.

## 20. Scénarios de tests
Unitaires (configuration), composants (fiche, mémorisation), E2E simulé (refus, acceptation), vérification preview de l'endpoint UE.

## 21. Exigences de non-régression
Parcours vocal existant, keypad, CSP (aucune autre origine ajoutée).

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Jeton US refusé par l'endpoint UE | Voix cassée | Moyenne [à confirmer] | Vérification en preview, grant sur l'endpoint UE |
| Surcoût de l'option UE | Budget | Faible [à confirmer] | Demande écrite au fournisseur avant activation |
| Fiche perçue comme friction | Moins d'usage | Faible | Texte court, une seule fois |

## 23. Décisions architecturales
Aucun ADR nouveau ; ADR 0008 : l'adaptateur porte la région et les options de confidentialité.

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Région | US (actuel) ; UE | UE, après vérification jeton et tarif (H.5) | — |
| Q2 | Bascule US si l'UE est indisponible | Oui ; non | Non (retour au manuel) | — |
| Q3 | Voix activée par défaut | Oui (actuel) ; opt-in | Oui, la fiche au premier appui suffisant à l'information | — |
| Q4 | Rétention côté fournisseur | Documentée d'après la doc publique ; engagement contractuel | Documenter la doc publique datée [à confirmer], demander un engagement si possible | — |

## 25. Traçabilité
Rapport 04 (§2.3, §2.8, P15, §9.4) ; compte rendu §C.1, §D.1, §H.5 ; specs 006, 034, 074, 075, 076, 078 ; ADR 0008.
