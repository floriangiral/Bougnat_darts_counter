# Plan

1. Stabiliser le parsing darts / score restant
2. Encapsuler les flux Deepgram dans un adapter UI
3. Renforcer la dégradation vers le manuel
4. Couvrir le flux par des tests unitaires explicites
5. Introduire une session vocale bornee au tour pour invalider les callbacks stale
6. Ajouter une couche d arbitrage metier des propositions vocales avant affichage UI
7. Formaliser les etats de readiness / erreur Deepgram et les mesurer en tests
