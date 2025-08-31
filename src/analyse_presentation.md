  Rapport d'Analyse de la Couche src/presentation

  Principes Clés Violés :
   * Présentation "Stupide" : La couche Presentation ne contient aucune logique métier.
   * Logique Métier dans le Domaine : Toute la logique métier doit résider exclusivement dans la couche Domain.
   * Immutabilité Stricte : Les méthodes qui modifient l'état doivent retourner une nouvelle instance.

  ---

  1. C:\Users\Arnaud\Documents\thetwo-main\dnd\src\presentation\containers\CombatContainer.tsx

   * Problème Majeur : Ce conteneur gère une logique trop complexe qui devrait être déléguée aux couches Application ou Domain.
       * `mapDomainPhaseToUI()` : Contient une logique de décision (currentEntity?.type === 'player') pour mapper les phases du
         domaine vers des phases UI spécifiques.
       * `getCombatPanelProps()` :
           * Récupération d'armes et de sorts : La logique de récupération des weapons et spells à partir des weaponRepository et
              spellRepository en se basant sur l'inventaire du personnage est une logique de récupération et de transformation de
              données qui appartient à la couche Application (via un UseCase ou un QueryService).
           * Le "TEMPORAIRE: Fallback" indique une logique métier de gestion de données manquantes.
       * `onCellClick` : Ce gestionnaire d'événements contient une logique de jeu complexe :
           * Recherche d'entités : La recherche d'un ennemi à une position spécifique
             (Array.from(combat.entities.values()).find(...)) est une requête sur le domaine qui devrait être encapsulée dans un
             service de requête du Domain ou de l'Application.
           * Calcul de portée : La vérification de la portée des armes (distance <= weaponRange) et la détermination de
             weaponRange sont des règles de jeu qui appartiennent au Domain.
       * `console.error` : Utilisation directe de console.error, ce qui va à l'encontre de la philosophie "Zéro console.log" en
         production.
   * Violations :
       * Présentation "Stupide" : Le conteneur ne se contente pas d'orchestrer l'UI ; il effectue des requêtes complexes et
         applique des règles de jeu.
       * Logique Métier dans le Domaine : Les calculs de portée, la recherche d'entités et la gestion de l'inventaire sont de la
         logique métier.
   * Recommandation : Dégraisser ce conteneur. Les données nécessaires à l'affichage (armes/sorts équipés, entités à une
     position) devraient être préparées par des Use Cases ou des Query Services dans la couche Application et passées en props.
     Les règles de jeu (calcul de portée) doivent être dans le Domain.

  ---

  2. C:\Users\Arnaud\Documents\thetwo-main\dnd\src\presentation\hooks\useCombat.ts

   * Problème : La fonction executeAITurn ne respecte pas le principe d'immutabilité et la séparation des responsabilités.
       * Elle appelle directement une méthode sur l'entité combat (combat.executeAITurn()) qui est décrite comme "méthode
         mutable legacy".
   * Violations :
       * Immutabilité Stricte : Si combat.executeAITurn() modifie l'objet combat directement, cela viole la règle
         d'immutabilité.
       * "Seulement orchestration et mise à jour d'état" : Le hook est censé déléguer les actions à CombatOrchestrationService.
         L'exécution du tour de l'IA devrait passer par ce service, qui retournerait un nouvel état de combat.
   * Recommandation : Refactoriser executeAITurn pour qu'il utilise le CombatOrchestrationService (ou un nouveau AIUseCase si la
     logique IA est complexe) qui doit retourner une nouvelle instance de Combat après l'exécution du tour de l'IA.

  ---

  Problèmes Mineurs / Potentiels (à surveiller) :

   * `C:\Users\Arnaud\Documents\thetwo-main\dnd\src\presentation\components\CombatGrid.tsx` : Le calcul des reachableCells
     pourrait être argumenté comme de la logique tactique qui pourrait être fournie par le Domain ou l'Application.
   * `C:\Users\Arnaud\Documents\thetwo-main\dnd\src\presentation\components\DebugDataPanel.tsx` : L'accès direct aux
     repositories et l'utilisation intensive de logger.ui sont acceptables pour un panneau de débogage, mais seraient
     problématiques dans un composant de production.
   * `C:\Users\Arnaud\Documents\thetwo-main\dnd\src\presentation\components\GameApp.tsx` : La fonction initializeGame contient
     une orchestration assez lourde. Bien que ce soit un composant racine, une encapsulation plus poussée dans un service de la
     couche Application pourrait être envisagée si sa complexité augmente.
   * `C:\Users\Arnaud\Documents\thetwo-main\dnd\src\presentation\components\TimeDisplay.tsx` : La logique de détermination de la
     période de la journée (getTimeOfDay) est une logique d'affichage simple, mais si elle devenait plus complexe ou liée à des
     règles de jeu, elle devrait être déplacée.
   * Utilisation générale de `logger.ui` : Bien que l'utilisation du logger soit correcte, sa présence dans de nombreux
     composants de présentation pourrait être réduite si les messages sont générés plus en amont dans les couches Application ou
     Domain.