Contexte : Nous avons résolu avec succès le problème de désynchronisation en implémentant le "Plan E" (Combat Session
  Pattern). Notre base est maintenant saine et robuste.

  Mission : Ta mission est de me fournir un plan d'action complet et détaillé pour rendre le combat entièrement jouable. Ce
  plan doit impérativement s'appuyer sur le code existant et respecter la Constitution Architecturale.

  Le plan doit être divisé en deux phases principales (nous verrons les sorts dans une troisième phase).

  ---

  Analyse Préliminaire (Étape Essentielle)

  Avant de proposer le plan, tu dois analyser le code existant pour identifier la logique métier qui peut être réutilisée ou
  qui doit être déplacée. Porte une attention particulière aux fichiers suivants :
   * src/domain/entities/Combat.ts
   * src/domain/services/DamageCalculationService.ts
   * src/domain/services/DiceRollingService.ts
   * src/domain/services/CombatActionService.ts
   * src/domain/entities/TacticalGrid.ts

  ---

  Phase 1 : Rendre le tour de l'IA fonctionnel

  L'objectif est que les entités contrôlées par l'IA puissent agir de manière autonome sur la grille de combat.

  Exigences fonctionnelles :
   1. Actions de l'IA : Une IA doit pouvoir effectuer deux types d'actions par tour : se déplacer et attaquer. L'ordre n'est pas
      fixe (elle peut attaquer puis bouger, ou bouger puis attaquer).
   2. Mécanique d'Attaque : Le processus d'attaque doit suivre des lancers de dés :
       * Jet pour Toucher : L'attaquant lance un dé pour savoir si son attaque touche la cible.
       * Jet pour Blesser : Si l'attaque touche, l'attaquant lance un dé pour savoir si la cible est blessée.
       * Application des Dégâts : Si la cible est blessée, les dégâts de l'arme sont appliqués.

  Exigences architecturales :
   1. Dépréciation : Toute méthode existante dont la logique est reprise mais qui viole notre architecture (ex: un service
      contenant de la logique qui devrait être dans une entité) doit être conservée mais marquée comme @deprecated. Le
      commentaire de dépréciation doit expliquer pourquoi et indiquer la nouvelle méthode qui la remplace.
   2. Nouvelles Méthodes : Toute la nouvelle logique doit être implémentée dans des méthodes pures et immutables au sein de nos
      entités du domaine (probablement CombatSession et/ou Combat). Par exemple, CombatSession.executeAIAttackAction(...).
   3. Plan Détaillé : Pour cette phase, je veux que tu listes :
       * Les méthodes exactes à marquer comme @deprecated.
       * La signature et le contenu des nouvelles méthodes à créer dans les entités du domaine.
       * Comment ces nouvelles méthodes utiliseront les services existants (comme DiceRollingService) via l'injection de
         dépendances.

  ---

  Phase 2 : Activer les actions du joueur

  L'objectif est de permettre au joueur d'effectuer les mêmes actions de base que l'IA.

  Exigences fonctionnelles :
   1. Actions du Joueur : Le joueur doit pouvoir choisir une de ses unités et lui ordonner de se déplacer sur la grille ou
      d'attaquer une cible ennemie avec son arme équipée.

  Exigences architecturales :
   1. Flux d'Interaction : Décris comment le flux Présentation -> Application -> Domaine sera mis à jour pour gérer ces
      nouvelles actions.
   2. Plan Détaillé : Pour cette phase, je veux que tu listes :
       * Les modifications nécessaires dans le CombatUseCase pour exposer ces nouvelles actions (ex: performMoveAction,
         performAttackAction).
       * Comment le hook useCombat appellera ces nouvelles méthodes du UseCase.
       * Comment le CombatUseCase utilisera les méthodes du domaine (créées en Phase 1) pour exécuter les actions du joueur.

  Je m'attends à un plan qui soit non seulement une liste de tâches, mais un véritable guide stratégique pour
  l'implémentation. Tu noteras ce plan dans ia.md