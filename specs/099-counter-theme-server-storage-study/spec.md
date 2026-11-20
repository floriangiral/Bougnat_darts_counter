---
id: 099-counter-theme-server-storage-study
v2_id: V2-BRAND-07
titre: Étude — stockage serveur des thèmes (code court)
type: etude
statut: a-valider
validation: en-attente
origine: Étude exploratoire
famille: perso
priorite: P3
difficulte: M
recommandation: deconseille
lot: 5
poids: 5
depend_de: [V2-BRAND-04]
remplace: []
remplacee_par: []
issue: '#294'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 099 — Étude : stockage serveur des thèmes (code court)

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

Une étude ne crée aucune exigence : elle produit une recommandation et, si elle est retenue, une ou plusieurs specs fonctionnelles et/ou un ADR.

**Recommandation de l'audit : déconseillé en V2.**

## 1. Contexte et origine
Le partage sans compte (096) couvre le besoin par fichier (thème complet, logo compris) et par lien/QR (couleurs et nom). Un **code court** (ex. `K7M-4QX`) adossé à un stockage serveur permettrait de transmettre aussi le logo en un scan. Le rapport 05 (§6.4) et le compte rendu (§D.3) classent cette option en « étude P3 », non recommandée en V2. Cette étude fixe les conditions dans lesquelles elle pourrait être rouverte.

## 2. Questions à trancher
- Q1 Le besoin est-il avéré (demandes réelles de clubs après livraison de 096) ?
- Q2 Le projet accepte-t-il de devenir **hébergeur de contenu** (logos, noms) sous le domaine Bougnat ?
- Q3 Le principe « pas de backend métier » (`CONTRIBUTING.md:9`) admet-il un stockage de contenus utilisateurs, même non métier ?
- Q4 Quel coût récurrent et quel dispositif anti-abus sont acceptables ?
- Q5 Une alternative sans stockage durable suffit-elle (transfert éphémère) ?

## 3. État actuel vérifié dans le code
- [vérifié] Le seul code serveur est la Pages Function de jeton Deepgram (`functions/api/deepgram/`), routée par `public/_routes.json:3` (`/api/*`).
- [vérifié] `CONTRIBUTING.md:9` : « ne pas reintroduire de dependance runtime a un backend metier dans le perimetre supporte ». La revue croisée note que ce texte n'interdit pas explicitement un service optionnel non métier : décision par ADR.
- [vérifié] CSP `connect-src` limitée à `'self'`, Deepgram et Cloudflare Insights (`public/_headers:2`) : un service same-origin (`/api/themes`) ne demanderait pas d'ouverture CSP.
- [vérifié] Aucun stockage serveur (KV, R2, D1) n'est configuré.

## 4. Contraintes
Gratuité pour l'utilisateur ; aucun compte ; aucune publicité ; fonctionnement dégradé acceptable hors ligne ; Clean Architecture (le partage reste un adaptateur, jamais une dépendance du jeu) ; coûts récurrents à chiffrer et à plafonner ; RGPD et obligations d'hébergeur.

## 5. Options étudiées
| Option | Description | Avantages | Inconvénients | Coût récurrent | Complexité |
|---|---|---|---|---|---|
| A. Statu quo (096) | Fichier + lien/QR, aucun serveur | 0 €, aucune modération, hors ligne | Logo par fichier séparé | 0 € | Nulle |
| B. Code court KV + R2 | `POST /api/themes` stocke le JSON (KV) et le logo (R2), renvoie un code ; `GET` le restitue | Un scan transmet tout | Hébergement de contenu, modération, abus, RGPD, opérations | Gratuit sous quotas ; au-delà Workers Paid (≥ 5 $/mois) | M |
| C. Transfert éphémère | Code valable 10 min, contenu en mémoire (Durable Object du relais TV 087 si autorisé), aucune persistance | Pas de contenu durable, modération quasi nulle | Dépend du relais ; les deux appareils doivent être en ligne en même temps | Inclus dans le budget du relais | M |
| D. Hébergement par le club | Le club publie son fichier sur son site ; lien vers ce fichier | Aucun stockage Bougnat | Ouverture de `connect-src` à des origines arbitraires, fuite d'IP, disponibilité | 0 € | M |
| E. Service tiers (gist, cloud) | Stockage chez un tiers | Rien à opérer | Compte tiers, sous-traitant, dépendance | Variable | M |

## 6. Critères d'évaluation et analyse
- **Tarifs Cloudflare KV** [confirmé, https://developers.cloudflare.com/kv/platform/pricing/, consulté le 2026-11-20] : plan gratuit 100 000 lectures/jour, **1 000 écritures/jour**, 1 Go stocké ; au-delà d'une limite quotidienne, les opérations échouent jusqu'à 00:00 UTC. Plan payant : 10 M lectures et 1 M écritures/mois inclus, puis 0,50 $ / M lectures et 5 $ / M écritures.
- **Tarifs R2** [confirmé par le rapport 05 le 2026-11-20, non revérifié ici : la page n'a pas pu être chargée] : 10 Go-mois, 1 M opérations de classe A et 10 M de classe B gratuits par mois, sortie gratuite.
- **Plan Workers payant** : minimum 5 $/mois [envisageable, d'après la tarification publique citée par le rapport 05].
- **Coût estimé option B** : 0 € tant que < 1 000 créations/jour ; risque principal = **coupure** en cas d'abus plutôt que facture ; ~5 $/mois (60 $/an) si passage au plan payant pour éviter la coupure.
- **Obligations d'hébergeur** : stocker des logos et noms fournis par des tiers fait de l'opérateur un hébergeur ; le règlement européen sur les services numériques (DSA) prévoit notamment un mécanisme de signalement pour les services d'hébergement [à confirmer juridiquement, niveau non documenté ici].
- **Modération** : un logo offensant ou contrefaisant servi sous `play.bougnatdarts.fr` engage l'image du projet ; option B exige signalement, suppression et limitation de débit (Turnstile ou équivalent).
- **RGPD** : un nom de lieu peut contenir un nom de personne ; journaux d'IP ; durée de conservation et purge à définir.
- **Valeur ajoutée** : faible tant que 096 n'a pas été éprouvé ; le flux « QR couleurs + fichier logo sur le groupe du club » couvre le cas principal (rapport 05 §6.4).

## 7. Recommandation (non validée)
**Déconseillé en V2.** Rester sur l'option A (096). Rouvrir l'étude seulement si (1) au moins 3 lieux distincts signalent le manque après livraison de 096 [seuil à valider], **et** (2) le relais TV (087) est autorisé et livré ; privilégier alors l'option **C (transfert éphémère, sans stockage)**, qui évite la modération et les obligations d'hébergeur. L'option B ne serait envisagée qu'après un ADR explicite sur la frontière serveur (Q2, Q3), un budget plafonné et un dispositif de signalement.

## 8. Protocole de vérification (PoC, mesures, terrain)
- Après livraison de 096 : recueillir les retours de 5 à 10 lieux pilotes (sans télémétrie intrusive) sur la difficulté réelle du transfert du logo.
- Si réouverture : PoC de l'option C sur le relais 087 (code 6 caractères, TTL 10 min, usage unique, contenu ≤ 120 Ko), mesure du nombre de requêtes et du taux d'échec.
- Revue juridique légère des obligations d'hébergeur avant toute option B.

## 9. Livrables attendus de l'étude
Décision du PO (A maintenu ou réouverture) ; si réouverture : ADR « frontière serveur pour le partage », spec fonctionnelle de l'option retenue, chiffrage plafonné.

## 10. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Contenu illicite hébergé | Élevé | Faible à moyenne | Ne pas stocker (A ou C) |
| Quota gratuit épuisé par abus | Moyen | Moyenne | Limitation de débit, plan payant plafonné |
| Glissement vers un backend métier | Moyen | Faible | ADR, service optionnel non requis pour jouer |
| Investissement sans demande réelle | Moyen | Élevée | Seuil de réouverture |

## 11. Questions ouvertes et décisions à prendre
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Pas de serveur de partage en V2 ? | Confirmer / ouvrir maintenant | Confirmer | À prendre |
| Q2 | Seuil de réouverture | 3 lieux / 10 lieux / jamais | 3 lieux distincts | À prendre |
| Q3 | Option privilégiée si réouverture | B (stockage) / C (éphémère) | C | À prendre |
| Q4 | Frontière serveur | ADR commun avec la TV (083) / ADR dédié | ADR commun avec 083 | À prendre |

## 12. Traçabilité
Rapport 05 §6.4 ; rapport 07 (relais, §5.4) ; compte rendu §D.3, H.4, H.16 ; `CONTRIBUTING.md:9`. Specs liées : 083, 087, 096.
