---
id: 024-counter-spa-pageviews-retired
v2_id: null
type: fonctionnel
statut: retiree
validation: validee
statut_reel: "Retirée du périmètre v1.1 pour éviter des événements analytics métier dans le runtime open source."
traitement_propose: "Conserver retirée (fiche de traçabilité)."
decision_traitement: a-valider
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# Spec 024 — Pageviews SPA (retirée)

Fiche de traçabilité créée lors de la revue V2 du 2026-11-20 : le numéro 024 n'est jamais réutilisé.

- **Objet initial** : compter les pages vues d'une application monopage.
- **Motif du retrait** : éviter des événements analytics métier dans le runtime open source (v1.1).
- **État constaté** : Cloudflare Web Analytics est autorisé par la CSP (`public/_headers`) ; aucun événement métier n'est émis.
