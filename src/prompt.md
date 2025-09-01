
  Contexte : Nous avons terminé avec succès la refactorisation architecturale du projet en suivant le plan_archi.md et les
  audits Gemini. Nous avons atteint une architecture saine, pure et robuste. Notre objectif est maintenant de construire de
  nouvelles fonctionnalités sur cette fondation, en maintenant impérativement le même niveau de qualité et de rigueur.

  Ta mission : Pour toute nouvelle fonctionnalité ou modification, tu dois désormais te conformer à la Constitution 
  Architecturale suivante. Chaque ligne de code que tu écriras devra respecter ces règles d'or, sans exception.

  ---

  CONSTITUTION ARCHITECTURALE DU PROJET

  Règle #1 : Le Domaine est Roi (Domain-Centric)
   * Toute nouvelle règle métier, logique de jeu ou calcul (ex: effets de statut, règles de furtivité, etc.) DOIT être
     implémentée dans la couche Domain.
   * Les entités (Combat, Character) sont les gardiennes des règles. Elles doivent être "riches" et contenir cette logique.
   * La couche Application (UseCases, Services) ne contient JAMAIS de logique métier. Son seul rôle est d'orchestrer les appels
     au domaine.

  Règle #2 : L'Orchestration est Stupide (Thin Application Layer)
   * Toute méthode d'un UseCase ou Service d'application qui modifie l'état du domaine DOIT suivre le pattern "3 lignes" :
       1. Appeler la méthode du domaine (const result = domain.doSomething()).
       2. Sauvegarder le nouvel état retourné (await repository.save(result.newState)).
       3. Retourner le résultat de l'action (return result.outcome).

  Règle #3 : La Présentation est Ignorante (Dumb Presentation)
   * La couche Présentation (composants React) ne communique JAMAIS directement avec les UseCases ou le Domaine.
   * Toute interaction entre l'UI et l'application passe EXCLUSIVEMENT par un hook React dédié (ex: useCombat,
     useCharacterSheet).
   * Les composants sont "stupides" : ils reçoivent des données et des fonctions via leurs props et se contentent de faire du
     rendu.

  Règle #4 : Tout est Pur et Immuable (Purity & Immutability)
   * Tous les états du domaine (Combat, Character, etc.) sont immuables. Toute modification retourne une NOUVELLE instance via
     une méthode with...().
   * Les services du domaine sont purs. Toute dépendance (ex: DiceRollingService) est injectée via le constructeur. Aucun appel
     statique, aucun effet de bord caché.

  Règle #5 : L'Injection est la Loi (Dependency Injection)
   * Toute dépendance (Repository, Service) est TOUJOURS injectée via le constructeur. Le DIContainer est la seule source de
     vérité pour la création d'objets complexes.

  ---

  TON NOUVEAU WORKFLOW OBLIGATOIRE

  Pour chaque nouvelle fonctionnalité que je te demanderai, tu devras suivre ce processus en 3 étapes :

  Étape 1 : Analyse d'Impact Architectural (PLAN)
  Avant d'écrire le code, tu me fourniras une brève analyse expliquant où chaque morceau de la nouvelle fonctionnalité va se
  situer, en justifiant tes choix par les règles de la Constitution.

   * Exemple : Pour "Utiliser une potion de soin" :
       * Logique de soin et validation : `Character.ts` (Règle #1)
       * Orchestration : Nouvelle méthode `useItem()` dans `CombatUseCase.ts` (Règle #2)
       * Exposition à l'UI : Nouvelle fonction dans le hook `useCombat` (Règle #3)

  Étape 2 : Plan d'Implémentation Détaillé (DESIGN)
  Une fois l'analyse validée, tu me fourniras un plan d'implémentation détaillé, comme tu l'as fait pour les actions de
  refactorisation.

  Étape 3 : Exécution et Rapport (EXECUTE & REPORT)
  Tu exécutes le plan et tu fournis un rapport de complétion incluant les validations (tsc, etc.).

  ---

  Ce document est notre contrat. Le respecter garantira que chaque ajout renforce le projet au lieu de diluer sa qualité.
  As-tu bien compris et t'engages-tu à suivre cette constitution et ce workflow pour toutes tes futures actions ?