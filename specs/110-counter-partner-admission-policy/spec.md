---
id: 110-counter-partner-admission-policy
v2_id: V2-INT-08
titre: Politique d'admission, de compatibilité et de révocation des partenaires
type: gouvernance
statut: a-valider
validation: en-attente
origine: Recommandation architecturale
famille: integrations
priorite: P2
difficulte: S
recommandation: recommande
lot: 4
poids: 20
depend_de: [V2-INT-01]
remplace: []
remplacee_par: []
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 110 — Politique d'admission, de compatibilité et de révocation des partenaires

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte
Recommandation architecturale de l'audit des intégrations (rapport 08 §6 P10, §7 V2-INT-08, §8 D6 ; compte rendu V2 §C.10). Ajouter une origine partenaire à `wrangler.jsonc` est aujourd'hui une simple PR (guide partenaire `docs/integration/external-match-link.md:19-32`) : aucun critère, aucune procédure de retrait, aucun registre public, aucun engagement de compatibilité écrit.

## 2. Problématique
Sans règle écrite, l'admission d'un partenaire dépend d'une appréciation au cas par cas, la révocation n'est pas prévue et les partenaires ne savent pas ce que le compteur garantit dans le temps.

## 3. Objectifs
- Critères d'admission publics, vérifiables, compatibles avec gratuité, absence de publicité et absence de compte.
- Procédure d'ajout (préprod puis production) et de révocation, avec délais.
- Engagements de compatibilité du contrat `v=1` et des versions futures.
- Registre public des partenaires.

## 4. État actuel vérifié dans le code
- [vérifié] Origines déclarées : `https://badarts.fr` en préprod et production (`wrangler.jsonc:17`, `:29`).
- [vérifié] Outillage : `scripts/lib/externalReturnOrigins.mjs:27-62` refuse les entrées invalides, non `https`, avec identifiants, avec chemin, dupliquées, ou `localhost` en environnement déployé ; contrôles par `npm run wrangler:check`, `scripts/deployment-check.mjs:84` et le build Pages.
- [vérifié] À l'exécution, seule l'origine exacte est acceptée (`src/features/external-match/externalMatchLink.ts:135-140`) ; `www.badarts.fr` et `badarts.fr` sont deux origines (guide l. 27-28).
- [vérifié] `CONTRIBUTING.md:24` impose de décrire toute évolution du contrat dans la spec 030 et le guide ; un changement incompatible impose une nouvelle version.
- [vérifié] Le README annonce badarts.fr comme « premier partenaire déclaré » (`README.md:76`) ; il n'existe pas de registre.
- [à confirmer] Si la spec 031 (V2-REL-02) livre un service worker, un bundle en cache pourrait conserver une ancienne liste d'origines jusqu'à sa mise à jour.

## 5. Comportement cible
Un partenaire candidat dépose une demande (gabarit d'issue), qui est instruite selon des critères publics, décidée par le product owner, testée en préprod puis activée en production et inscrite au registre. Le partenaire est informé des évolutions du contrat. Une origine peut être retirée selon une procédure écrite, en urgence si nécessaire.

## 6. Périmètre
### Inclus
- Critères, procédure d'ajout, registre, engagements de compatibilité, révocation, communication.
### Exclu
- Toute prise de contact sortante (V2-INT-09 / 112, sur autorisation).
- Contrat technique (`v=1` : spec 030 ; `v=2` : 108 ; BDT : 109).
- Contrats commerciaux ou rémunération.

## 7. User stories
- En tant que développeur d'un outil de club, je veux connaître les conditions d'admission, afin de préparer ma demande.
- En tant que mainteneur, je veux une liste de contrôle, afin d'instruire une demande en moins d'une heure.
- En tant que joueur, je veux savoir quels sites peuvent recevoir mes résultats, afin de faire confiance au lien.

## 8. Règles métier
- RM-01 Une origine n'est admise que par décision écrite du product owner.
- RM-02 L'admission ne crée aucune obligation de compte, de paiement ou de publicité pour les joueurs du compteur.
- RM-03 Aucune exclusivité n'est accordée.
- RM-04 Le compteur n'affiche que le domaine du partenaire (pas de logo, pas de libellé de marque en `v=1`).
- RM-05 Un partenaire ne peut pas se prévaloir d'une certification des scores par Bougnat Darts.

## 9. Parcours utilisateurs
1. Le partenaire lit le guide et la politique, puis ouvre une issue « Demande de partenaire ».
2. Le mainteneur vérifie les critères (liste §10) et transmet au product owner.
3. Décision ; PR `wrangler.jsonc` (préprod) ; essai avec le simulateur ou l'application du partenaire.
4. PR production ; inscription au registre ; notification au partenaire.

## 10. Exigences fonctionnelles
- FR-01 Critères obligatoires : origine `https` exacte (sans chemin ni joker) ; mentions légales et contact de confidentialité publiés sur le site ; validation humaine des résultats avant publication ; traitement idempotent des retours ; page de retour qui ne réexpose pas les paramètres reçus à des tiers.
- FR-02 Critère recommandé (obligatoire selon Q1) : jeton à usage unique et à durée courte dans l'URL de retour. La politique rappelle que ce jeton **corrèle** le retour à un match et empêche le rejeu, mais **ne certifie pas** le score, et qu'aucun secret ne peut être protégé côté compteur.
- FR-03 Le TTL de 12 h du compteur porte sur le contexte restauré, pas sur l'URL entrante : la politique exige que la fraîcheur soit garantie par le jeton du partenaire.
- FR-04 Procédure d'ajout en deux temps : préprod (`env.preview.vars`) puis production (`env.production.vars`), chacune par PR passant `npm run wrangler:check`.
- FR-05 Registre public (`docs/integration/partners.md`) : domaine, date d'admission, environnements, contact technique, statut (actif, suspendu, retiré).
- FR-06 Engagements de compatibilité : `v=1` figé avec ajouts optionnels (V2-INT-01) ; préavis d'au moins 12 mois avant l'arrêt d'une version de contrat [proposé] ; journal des évolutions du contrat dans le guide.
- FR-07 Révocation ordinaire : motifs (inactivité de 12 mois, domaine expiré ou transféré, non-respect des critères), préavis de 30 jours [proposé], PR de retrait, registre mis à jour.
- FR-08 Révocation d'urgence : motifs (redirection ouverte sur la page de retour, compromission, usage abusif), retrait immédiat par PR et redéploiement, notification a posteriori.
- FR-09 Communication : canal de notification des évolutions (abonnement aux releases GitHub ou contact technique du registre).

## 11. Exigences non fonctionnelles
- NFR-01 Transparence : registre et politique publics, en français.
- NFR-02 Délai : instruction d'une demande complète en moins de 10 jours ouvrés [proposé].
- NFR-03 Confidentialité : la politique explique que les prénoms transitent dans l'URL et rappelle les obligations du partenaire comme responsable de ses traitements [qualification juridique à confirmer].
- NFR-04 Coût récurrent : 0 €.

## 12. Cas nominaux et alternatifs
- Nominal : demande conforme, admission en préprod puis en production.
- Alternatif : demande incomplète → retour au partenaire avec la liste des critères manquants.
- Alternatif : plateforme multi-clubs (ex. DartsHub) → une origine pour la plateforme, pas une par club.

## 13. Cas limites
- Sous-domaine supplémentaire (`www`) : nouvelle entrée, même instruction simplifiée.
- Changement de domaine du partenaire : nouvelle admission, ancienne origine retirée après bascule.
- Partenaire commercial : admissible si RM-02 et RM-03 sont respectées (question Q2).

## 14. Gestion des erreurs
- Une origine invalide dans `wrangler.jsonc` est déjà bloquée par l'outillage (§4).
- Retrait mal propagé (cache) : vérifier l'origine effective sur l'environnement déployé après redéploiement.

## 15. Impacts architecturaux
Aucun sur le code applicatif. Éventuel contrôle d'outillage (cohérence registre ↔ `wrangler.jsonc`) dans `scripts/` (question Q4).

## 16. Impacts sur les données et les interfaces
Nouveau document `docs/integration/partners.md` ; gabarit d'issue `.github/ISSUE_TEMPLATE/partner-request.yml`. Contrat inchangé.

## 17. Compatibilité avec l'existant
badarts.fr est inscrit au registre par reprise de l'existant ; s'il ne remplit pas un critère obligatoire (jeton, selon Q1), un délai de mise en conformité lui est proposé sans retrait immédiat.

## 18. Dépendances
- V2-INT-01 (030) : contrat figé, guide à jour.
- Liens : V2-INT-02 (106), V2-INT-09 (112), V2-DOC-02 (035, organisation documentaire), V2-REL-02 (031, cache du service worker).

## 19. Critères d'acceptation
- AC-01 La politique est publiée dans le guide partenaire et liée depuis le README.
- AC-02 Le registre liste badarts.fr avec date, environnements et statut, cohérent avec `wrangler.jsonc`.
- AC-03 Le gabarit d'issue « Demande de partenaire » reprend les critères FR-01 et FR-02.
- AC-04 Une révocation d'essai sur la préprod (origine fictive ajoutée puis retirée) est menée de bout en bout en moins d'une heure, durée consignée.
- AC-05 La politique contient les phrases sur le jeton (corrélation, pas certification) et sur le TTL (contexte restauré, pas URL entrante).

## 20. Scénarios de tests
- Outillage existant : `tests/unit/tooling/externalReturnOrigins.test.ts`.
- Optionnel (Q4) : test du contrôle de cohérence registre ↔ `wrangler.jsonc`.
- Procédure : exercice de révocation en préprod (AC-04).

## 21. Exigences de non-régression
Aucune modification du contrat `v=1` ni des règles de l'outillage existant.

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Politique trop exigeante, aucun partenaire | Moyen | Moyenne | Critères minimaux, le reste en recommandé |
| Registre désynchronisé | Faible | Moyenne | Contrôle d'outillage (Q4) |
| Révocation lente à cause d'un cache | Moyen | Faible | Vérification après redéploiement ; coordination avec 031 |

## 23. Décisions architecturales
S'inscrit dans [ADR-0009](../../docs/adr/0009-integrations-pas-de-port-generique-premature.md) (« pas de port générique avant un deuxième canal », proposée). Pas d'ADR propre.

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Jeton partenaire obligatoire | obligatoire / recommandé | Obligatoire pour les nouveaux partenaires, délai pour badarts.fr | — |
| Q2 | Partenaires commerciaux | admis / refusés | Admis si RM-02 et RM-03 | — |
| Q3 | Qui instruit | product owner seul / mainteneur puis product owner | Mainteneur puis décision du product owner | — |
| Q4 | Contrôle d'outillage registre ↔ `wrangler.jsonc` | oui / non | Oui si plus de 3 partenaires | — |
| Q5 | Préavis d'arrêt d'une version | 6 / 12 / 24 mois | 12 mois | — |

## 25. Traçabilité
Rapport 08 §2.4, §2.9 (D5, D7), §6 (P9, P10), §7, §8 (D6, D7) ; compte rendu V2 §C.10, §H.20, §H.21 ; spec 030 ; guide partenaire ; `CONTRIBUTING.md:24`.
