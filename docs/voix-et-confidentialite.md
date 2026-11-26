# Voix et confidentialité

> Page de référence de la [spec 080](../specs/080-counter-voice-privacy/spec.md) (V2-VOICE-09). Dernière mise à jour : 2026-11-23.
> Les engagements du fournisseur sont repris de sa documentation publique consultée le 2026-11-23 ; ils ne font l'objet d'aucun engagement contractuel propre à Bougnat Darts **[à confirmer]**.

L'assistance vocale est une option du X01 : on annonce son score au lieu de le taper. Elle est **active par défaut** mais n'ouvre jamais le micro sans que le joueur ait d'abord lu une fiche d'information. La saisie au pavé reste toujours disponible, sans service externe.

## Ce que voit le joueur

- **Au premier appui sur la touche micro** d'un appareil, une fiche « Voix et confidentialité » s'affiche :

  > Ta voix est envoyée à Deepgram pour être transcrite, uniquement pendant l'écoute. Bougnat Darts ne l'enregistre pas.
  > La transcription a lieu aux États-Unis. Ta voix est exclue de l'entraînement des modèles de Deepgram et aucun prénom n'est transmis.
  > Tu peux couper la voix à tout moment dans les options de la partie.

  Deux choix : **« Activer le micro »** (l'écoute démarre aussitôt, après l'autorisation du navigateur) ou **« Saisie manuelle »** (la voix est coupée pour ce match, le jeu continue au pavé). Échap équivaut à « Saisie manuelle ».
- **Avant ce choix, rien ne part** : ni demande de jeton à `/api/deepgram/token`, ni accès au micro, ni connexion au fournisseur.
- **L'acceptation est mémorisée sur l'appareil** (clé locale `bougnat-voice-privacy-notice`, valeur `{"v":1,"accepted":true}`), sans compte. Un refus n'est pas mémorisé : la fiche est reproposée au match suivant. Si le stockage local est indisponible (navigation privée stricte), l'acceptation ne vaut que pour la session en cours.
- **Toute nouvelle version de la fiche** (nouvelle finalité, nouveau sous-traitant, changement de région) est réaffichée une fois, même après une acceptation antérieure.
- **À tout moment**, les options de la partie X01 donnent accès au lien « En savoir plus sur la voix » (même fiche, en lecture) et au réglage « Assistance vocale IA », aussi présent dans la page Réglages de l'accueil.

## Ce qui est transmis, à qui et pourquoi

| Élément | Détail |
|---|---|
| Sous-traitant | Deepgram, Inc. (reconnaissance vocale en temps réel, modèle `nova-3`, français). |
| Finalité | Transcrire l'annonce du score pour proposer une saisie, que le joueur valide comme au pavé. |
| Données envoyées | Le son capté par le micro, **uniquement pendant l'écoute** (après un appui sur la touche micro, jusqu'à l'annonce, l'arrêt ou le délai d'écoute). |
| Paramètres d'écoute | Langue, format audio et un vocabulaire fixe de fléchettes (`single`, `double`, `bulle`, `miss`…). **Aucun prénom ni identifiant de joueur** (ni mot-clé, ni étiquette, ni métadonnée) ; un test unitaire le garantit. |
| Exclusion de l'entraînement | Chaque session d'écoute est ouverte avec `mip_opt_out=true` : la requête est exclue du programme d'amélioration des modèles de Deepgram. |
| Région | **États-Unis** (point d'accès global `api.deepgram.com`). Le passage à l'UE est décidé mais pas encore livré, voir ci-dessous. |
| Authentification | Un jeton éphémère (55 secondes) est délivré par une fonction Cloudflare Pages (`functions/api/deepgram/token.ts`) ; la clé Deepgram reste côté serveur et n'est jamais exposée au navigateur. |

## Conservation

- **Bougnat Darts** n'enregistre pas l'audio. La transcription n'existe qu'en mémoire, le temps de proposer le score ; elle n'est ni stockée ni journalisée (les journaux d'erreur de production ne contiennent aucune transcription).
- **Deepgram**, d'après sa page publique « Your Data at Deepgram » (consultée le 2026-11-23) **[à confirmer]** :
  - avec `mip_opt_out=true`, l'audio et la transcription ne sont conservés que le temps nécessaire au traitement de la requête (« zero data retention ») ;
  - les métadonnées de requête et journaux d'usage (sans audio ni transcription) restent consultables 90 jours, puis sous forme agrégée ;
  - sans cette option, l'audio et la transcription seraient conservés pour améliorer les modèles, ce que Bougnat Darts désactive.

## Région UE : décision et état

Décision du product owner (2026-11-23) : traiter l'audio dans l'UE **sous réserve** d'une vérification préalable, et **sans bascule vers les États-Unis** si l'UE est indisponible (retour à la saisie manuelle).

État au 2026-11-23 : **non livré**, l'application utilise encore le point d'accès global (États-Unis). Restent à faire (tâches T005 et T006 de la spec 080) :

1. Vérifier en préversion, avec une vraie clé, qu'un jeton éphémère obtenu par `/v1/auth/grant` ouvre bien `wss://api.eu.deepgram.com/v1/listen` (la documentation publique indique que les clés et jetons existants fonctionnent sur le point d'accès UE **[à confirmer]**), et l'éventuel impact tarifaire **[à confirmer auprès de Deepgram]**.
2. Puis, si la vérification est concluante : configurer le SDK sur `https://api.eu.deepgram.com` / `wss://api.eu.deepgram.com`, aligner la route de jeton et la route locale de développement, élargir la CSP (`connect-src`) au seul domaine UE et publier une **nouvelle version de la fiche** (« La transcription a lieu dans l'Union européenne »).

D'après la documentation publique de Deepgram, le point d'accès UE ne redirige jamais une requête hors de l'UE (une indisponibilité fait échouer la requête), et la garantie de résidence complète suppose aussi `mip_opt_out=true`, déjà actif.

## Pour les contributeurs

- Fiche : `src/features/x01/voice/VoicePrivacyNotice.tsx` ; texte et version : `src/features/x01/voice/voicePrivacyNoticeModel.ts` (incrémenter `VOICE_PRIVACY_NOTICE_VERSION` à chaque changement de finalité, de sous-traitant ou de région).
- Mémorisation : `src/infrastructure/local/voicePrivacyNoticeStore.ts`, contrôleur `src/app/voicePrivacyNoticeController.ts`.
- Garde : `views/MatchView.tsx` affiche la fiche ; `useDeepgramStreaming` refuse aussi, de lui-même, de demander jeton ou micro tant que la fiche n'est pas acceptée.
- Configuration d'écoute : `src/features/x01/voice/voiceConfig.ts` (`mip_opt_out`, vocabulaire fixe).
- Tests : `tests/unit/x01/voiceConfig.test.ts`, `voicePrivacyNotice.test.tsx`, `matchViewVoicePrivacy.test.tsx`, `useDeepgramStreaming.test.tsx`, E2E `tests/e2e/voice-privacy.smoke.spec.ts`.

Sources fournisseur (consultées le 2026-11-23) : [Your Data at Deepgram](https://developers.deepgram.com/trust-security/your-data), [Regional endpoints](https://developers.deepgram.com/reference/regional-endpoints).
