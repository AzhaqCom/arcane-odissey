# Audit d'Architecture par Gemini

Ce document détaille les violations des principes d'architecture définis dans `ARCHITECTURE_GUIDELINES.md` que j'ai pu observer dans le code source.

---

## Violations Identifiées

### Règle #2 : Immutabilité Stricte

Le principe d'immutabilité n'est pas respecté dans plusieurs entités clés du domaine, ce qui peut entraîner des effets de bord et des incohérences d'état.

1.  **`domain/entities/GameSession.ts`**
    *   **Violation** : La méthode `setFlag` modifie directement la map interne `_flags` (`this._flags.set(key, value);`).
    *   **Impact** : Critique. Cela brise le contrat d'immutabilité de l'agrégat `GameSession`. Toute modification d'état doit retourner une nouvelle instance de `GameSession`.
    *   **Correctif Suggéré** : La méthode `setFlag` devrait retourner une nouvelle `GameSession` avec une nouvelle `Map` de flags.

2.  **`domain/entities/Character.ts`**
    *   **Violation** : Les propriétés `currentHP` et `preparedSpells` sont publiques et mutables.
    *   **Impact** : Élevé. L'état vital du personnage peut être modifié de n'importe où dans l'application, contournant la logique métier du domaine (par exemple, des méthodes comme `takeDamage` ou `heal` qui devraient exister et retourner une nouvelle instance de `Character`).
    *   **Correctif Suggéré** : Rendre ces propriétés `readonly` et introduire des méthodes (`withHP`, `withPreparedSpells`) qui retournent une nouvelle instance de `Character` avec les valeurs mises à jour.

3.  **`domain/entities/Combat.ts`**
    *   **Violation** : L'interface `CombatEntity` (qui représente un participant au combat) contient de nombreuses propriétés mutables (`currentHP`, `position`, `initiative`, etc.).
    *   **Impact** : Élevé. L'état des entités de combat est susceptible d'être muté directement par les services de combat, ce qui va à l'encontre du pattern `with...` mis en place sur l'agrégat `Combat`.
    *   **Correctif Suggéré** : Rendre les propriétés de `CombatEntity` `readonly` et ajuster les services (`CombatActionService`, `CombatStateService`) pour qu'ils gèrent la création de nouvelles instances de `CombatEntity` lors des modifications.

### Règle #3 : Logique Métier dans le Domaine

De la logique métier critique a été trouvée dans la couche `Application`, la rendant dépendante de l'implémentation et difficile à tester en isolation.

1.  **`application/usecases/CombatUseCase.ts`**
    *   **Violation** : La logique pour les actions de combat de base est implémentée ici au lieu d'être dans le domaine.
        *   Calcul de l'initiative (`Math.floor(Math.random() * 20) + 1 + modifier`).
        *   Jet d'attaque (`DiceRollingService.rollD20()`).
        *   Vérification de la réussite d'une attaque (`attackRoll >= target.baseAC`).
        *   Calcul des dégâts (`DiceRollingService.rollD6()`).
    *   **Impact** : Critique. Les règles fondamentales du jeu sont en dehors du sanctuaire du domaine. Le `CombatUseCase` ne devrait qu'orchestrer les appels (ex: `combat.performAttack(...)`) et non définir *comment* une attaque fonctionne.
    *   **Correctif Suggéré** : Déplacer toute cette logique dans l'entité `Combat` ou des services de domaine spécialisés (`DamageCalculationService`, `InitiativeService`, etc.) qui sont ensuite utilisés par l'agrégat `Combat`.

2.  **`application/usecases/GameUseCase.ts`**
    *   **Violation** :
        *   La logique de repos (quantité de PV restaurés, durée en minutes) est définie dans le `GameUseCase`.
        *   Le cas d'utilisation appelle des méthodes qui retournent une nouvelle instance (`changePhase`, `advanceTime`) mais n'assigne pas le résultat à sa variable `this.currentSession`, ce qui signifie que l'état n'est jamais réellement mis à jour.
    *   **Impact** : Élevé. Les règles de repos sont de la logique métier. L'ignorance des retours des méthodes immuables est un bug qui empêche le bon fonctionnement de l'application.
    *   **Correctif Suggéré** : Déplacer la logique de repos dans l'entité `GameSession`. Corriger les appels en faisant `this.currentSession = this.currentSession.with...()`.

### Règle #4 : Présentation "Stupide"

La couche de présentation effectue des appels directs au domaine, créant un couplage interdit entre l'UI et la logique métier.

1.  **`presentation/hooks/useCombat.ts`**
    *   **Violation** : La fonction `executeAITurn` dans le hook appelle directement la méthode `combat.executeAITurn()` sur l'entité du domaine.
    *   **Impact** : Critique. La présentation ne doit **jamais** interagir directement avec le domaine. Elle doit passer par un cas d'utilisation de la couche `Application` (ex: `combatUseCase.executeAITurn()`). Cela viole la règle de dépendance fondamentale de la Clean Architecture.
    *   **Correctif Suggéré** : L'appel doit être fait via le `CombatUseCase`, qui se chargera d'appeler le domaine. Le hook ne fait que recevoir le résultat.

---

## Conclusion de l'Audit

Le projet a une base solide et montre une volonté claire de suivre les principes de l'Architecture Hexagonale. Cependant, plusieurs violations critiques ont été identifiées, principalement liées à des fuites de logique métier en dehors du domaine et à une application incomplète du principe d'immutabilité.

La correction de ces points est essentielle pour garantir la maintenabilité, la testabilité et la robustesse de l'application à long terme.
