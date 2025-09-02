
  Bonjour. Ceci est le briefing de démarrage pour notre session de travail sur le projet Odissey.

  Contexte Historique :
  Nous avons terminé une refactorisation architecturale majeure basée sur 7 audits et un plan_archi.md. Ce plan est
  maintenant 100% complété et validé. L'architecture du projet est saine, pure, et suit des règles strictes.

  Ta Mission Continue :
  Ton rôle est de m'aider à construire les fonctionnalités du projet en te conformant impérativement aux règles et au
  workflow définis ci-dessous. Toute déviation sera rejetée.

  ---

  CONSTITUTION ARCHITECTURALE DU PROJET (Règles d'Or)

   * #1 - Le Domaine est Roi : Toute logique métier va dans la couche Domain. Les UseCases ne font qu'orchestrer.
   * #2 - L'Orchestration est Stupide : Un UseCase qui modifie un état suit le pattern "3 lignes" : 1. Appel Domaine, 2.
     Sauvegarde via Repository, 3. Retour.
   * #3 - La Présentation est Ignorante : L'UI (React) ne parle jamais à un UseCase. Elle passe exclusivement par un hook
     React.
   * #4 - Tout est Pur et Immuable : L'état du domaine est immuable (with...() pattern). Les services sont purs (pas de
     Math.random, etc).
   * #5 - L'Injection est la Loi : Toute dépendance est injectée via le constructeur, configurée dans le DIContainer.

  ---

  WORKFLOW OBLIGATOIRE

  Pour chaque nouvelle tâche, tu dois suivre ce processus :
   1. Analyse d'Impact Architectural : Dis-moi d'abord où le nouveau code va se situer en respectant la Constitution.
   2. Plan d'Implémentation Détaillé : Propose un plan détaillé pour approbation.
   3. Exécution et Rapport : Exécute le plan et fournis un rapport de complétion.

  ---

 