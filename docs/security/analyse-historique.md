# Analyse locale de l'historique Gitleaks

Le 24 novembre 2026, Gitleaks 8.28.0 a analysé les références Git disponibles localement avec `--log-opts=--all` et `--redact`. Les exceptions existantes de `.gitleaksignore` étaient actives. Le rapport et le journal sont restés locaux ; aucune valeur détectée n'est recopiée ici.

Résultat : **24 détections non ignorées**, à qualifier avant toute nouvelle exception :

- 21 détections `generic-api-key` dans trois fichiers d'interface ou de test (sept occurrences historiques par fichier) ;
- deux détections `curl-auth-user` dans un ancien workflow, sur des commandes utilisant la variable de jeton Sonar ;
- une détection `generic-api-key` sur une valeur dont le caractère public et la configuration du service concerné restent à vérifier. Les détails sont à conserver dans un canal privé.

Les références disponibles localement ne prouvent pas que toutes les branches distantes ont été récupérées. L'analyse de toutes les branches, la décision pour chaque détection et la justification des exceptions existantes restent à compléter selon la [spec 118](../../specs/118-counter-sec-secrets-detection/spec.md). Si une valeur est un secret effectif, suivre le [runbook de rotation](rotation-secrets.md) ; ne pas la publier.
