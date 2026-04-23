# Plan

1. Verrouiller le perimetre v1.0.0 scoring-only dans docs et specs
2. Isoler les points d'entree offline-first (app shell, queue, persistence locale)
3. Encapsuler les appels distants derriere des ports/adapters optionnels
4. Renforcer les tests de non-regression sur queue et sessions locales
