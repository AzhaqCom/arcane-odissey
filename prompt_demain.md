 [DEBUT DE PROMPT]

  SUBJECT: SYNCHRONISATION DE CONTEXTE ET ORDRE D'EXÉCUTION

  PRIORITÉ : ABSOLUE

  ---

  1.0 - RECALAGE DE CONTEXTE SYSTÈME

  Session précédente, nous avons validé un plan d'action détaillé, que tu as toi-même produit, ce plan se nomme ia.md pour rendre le combat jouable.
  Ce plan, que nous nommerons "le Plan Directeur", a été audité et approuvé. Il constitue désormais la seule et unique source 
  de vérité pour toutes les opérations à venir. Ton rôle est d'exécuter ce Plan Directeur avec une précision chirurgicale.

  ---

  2.0 - RAPPEL DE LA CONSTITUTION ARCHITECTURALE (NON-NÉGOCIABLE)

  Avant toute chose, ré-intègre les 5 règles d'or suivantes. Elles sont la loi fondamentale du projet. Toute proposition de
  code qui viole l'une de ces règles, même de manière subtile, sera considérée comme un échec critique de la mission.

   * Règle #1 : Le Domaine est Roi (Domain-Centric)
       * Toute logique métier réside exclusivement dans la couche domain. Les entités sont riches, les services applicatifs
         sont des orchestrateurs purs.

   * Règle #2 : L'Orchestration est Stupide (Thin Application Layer)
       * Toute méthode de UseCase qui modifie l'état suit impérativement le pattern "3 lignes" : 1. Récupérer/Créer l'entité,
         2. Appeler la méthode du domaine (qui retourne un nouvel état immuable), 3. Persister le nouvel état via le
         Repository.

   * Règle #3 : La Présentation est Ignorante (Dumb Presentation)
       * L'UI communique uniquement via les hooks React dédiés. Aucune logique métier dans les composants.

   * Règle #4 : Tout est Pur et Immuable (Purity & Immutability)
       * Tous les états du domaine sont immuables. Toute modification génère une nouvelle instance. Tous les services du
         domaine sont purs et leurs dépendances sont injectées.

   * Règle #5 : L'Injection est la Loi (Dependency Injection)
       * Aucune instanciation manuelle (new ...) de dépendances (Services, Repositories) dans les classes du domaine ou de
         l'application. Tout est injecté via constructeur.

  ---

  3.0 - MISSION IMMÉDIATE ET ORDRE D'EXÉCUTION

  Ta mission est de commencer l'exécution de la Phase 1 du Plan Directeur.

  Ton premier objectif est la tâche "1.1 - NETTOYAGE ARCHITECTURAL".

  Tu vas procéder dans l'ordre exact défini par le plan :

   1. Première Action : Tu commenceras par la suppression des méthodes dépréciées. Propose-moi le code pour modifier
      CombatUseCase.ts afin de supprimer la méthode executeAITurn (lignes 217-226 du plan).
   2. Seconde Action : Après validation, tu proposeras la modification de useCombat.ts pour supprimer la méthode executeAITurn
      (lignes 248-271 du plan).
   3. Troisième Action : Après validation, tu proposeras la modification du constructeur de Combat.ts pour y injecter les
      dépendances (queryService, aiService, stateService) et supprimer les instanciations directes, comme spécifié dans le Plan
      Directeur.

  Directive d'exécution : Propose une seule action (une modification de fichier) à la fois. Attends ma confirmation avant de
  passer à l'action suivante. La qualité et la précision du code doivent être identiques à celles présentées dans le Plan
  Directeur.

  Je n'attends aucune question, seulement l'exécution précise de la première action.