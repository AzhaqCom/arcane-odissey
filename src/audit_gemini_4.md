# Audit d'Architecture par Gemini - Partie 4

Cette partie de l'audit se concentre sur la fin de l'analyse du domaine et sur des éléments clés de la couche `Application` : les mappers, les services et les cas d'utilisation.

---

### Fichiers analysés pour ce rapport :

- `domain/entities/ActionValidator.ts`
- `domain/entities/BehaviorSystem.ts`
- `domain/services/AbilityCalculationService.ts`
- `domain/services/TacticalCalculationService.ts`
- `application/mappers/CharacterMapper.ts`
- `application/mappers/EnemyMapper.ts`
- `application/services/CombatOrchestrationService.ts`
- `application/usecases/SceneUseCase.ts`

---

## Nouvelles Violations et Observations

### Règle #3 : Logique Métier dans le Domaine

Une violation massive de cette règle a été identifiée, représentant le problème architectural le plus grave du projet à ce jour.

1.  **`application/services/CombatOrchestrationService.ts`**
    *   **Violation** : Ce service contient une implémentation complète de la logique de combat, qui devrait résider exclusivement dans le domaine. Il gère :
        *   Les jets d'attaque (`DiceRollingService.rollD20()`).
        *   La condition de réussite d'une attaque (`attackRoll >= target.baseAC`).
        *   Le calcul des dégâts (`DiceRollingService.rollD6()`).
        *   La logique de consommation des emplacements de sorts.
    *   **Impact** : **CRITIQUE**. C'est une négation fondamentale du principe de la Clean Architecture. L'agrégat `Combat` du domaine, qui devrait être le gardien de ces règles, est contourné. La couche `Application` dicte les règles du jeu, ce qui la rend fragile, difficile à tester et fortement couplée à l'implémentation.
    *   **Correctif Suggéré** : Le service doit être entièrement refactorisé. Sa seule responsabilité est d'orchestrer. Une méthode comme `performWeaponAttack` devrait se résumer à :
        1.  Récupérer l'état du combat.
        2.  Appeler la méthode de domaine correspondante : `combat.performWeaponAttack(...)`.
        3.  Sauvegarder le nouvel état du combat retourné par le domaine.

### Incohérences Architecturales

1.  **Duplication de la couche d'orchestration de combat**
    *   **Observation** : Le projet contient à la fois un `CombatUseCase.ts` et un `CombatOrchestrationService.ts`. Les deux ont des responsabilités qui se chevauchent et tous deux contiennent des violations de logique métier. Le hook `useCombat` dépend de `CombatOrchestrationService`.
    *   **Impact** : Élevé. Cette duplication crée de la confusion, du code redondant et un risque élevé de divergence de la logique. Il n'y a pas de source de vérité unique pour l'orchestration du combat.
    *   **Correctif Suggéré** : Il est impératif de fusionner ces deux logiques en un seul `CombatUseCase`. Ce `UseCase` unifié doit être nettoyé de toute logique métier (en la déplaçant dans le domaine, comme suggéré ci-dessus) et devenir le seul point d'entrée pour toutes les actions de combat initiées par la couche `Présentation`.

### Points Positifs et Bonnes Pratiques

Il est important de noter que ce lot de fichiers contenait également des exemples de code de très haute qualité qui respectent parfaitement les directives.

-   **Services de Domaine Purs** : `AbilityCalculationService.ts` et `TacticalCalculationService.ts` sont de parfaits exemples de services de domaine : ils sont purs, sans état et encapsulent une logique métier spécifique.
-   **Mappers Conformes** : `CharacterMapper.ts` et `EnemyMapper.ts` appliquent la Règle #5 à la lettre. Ils sont bien situés et leur rôle de traducteur de données est clair.
-   **Cas d'Utilisation Exemplaire** : `SceneUseCase.ts` est un excellent modèle pour les autres cas d'utilisation. Il orchestre les appels entre les dépôts et le domaine sans jamais implémenter de logique métier lui-même. C'est exactement le rôle que la couche `Application` doit jouer.

---

## Conclusion de l'Audit (Partie 4)

Cette analyse est un tournant. Elle a identifié le problème le plus critique du projet (`CombatOrchestrationService`) tout en confirmant que les compétences et les modèles pour bien faire sont déjà présents ailleurs dans le code (`SceneUseCase`, mappers, services de domaine purs).

La priorité absolue doit être de refactoriser la couche d'orchestration du combat pour la rendre "stupide", en déplaçant toute la logique métier dans l'agrégat `Combat` et ses services de domaine. Cela corrigera la violation la plus grave et alignera le projet sur ses propres directives d'architecture.
