# Audit d'Architecture par Gemini - Partie 3

Ce document poursuit l'analyse du projet en se concentrant sur les services de domaine, notamment ceux liés à l'IA, aux requêtes et aux calculs.

---

### Fichiers analysés pour ce rapport :

- `domain/entities/AIDecisionMaker.ts`
- `domain/entities/ThreatAssessment.ts`
- `domain/entities/ActionPrioritizer.ts`
- `domain/services/CombatAIService.ts`
- `domain/services/CombatQueryService.ts`
- `domain/services/DiceRollingService.ts`
- `domain/services/InitiativeService.ts`
- `domain/services/GameNarrativeService.ts`

---

## Nouvelles Violations et Observations

### Règle #3 : Logique Métier dans le Domaine (Problème de Pureté)

Un problème fondamental de pureté a été identifié, rendant une grande partie du domaine difficile à tester, même si la logique est au bon endroit.

1.  **`DiceRollingService.ts` : Source d'impureté**
    *   **Violation** : Le service, qui devrait encapsuler et contrôler l'aléatoire, utilise `Math.random()` directement dans ses méthodes statiques. Cela propage l'impureté à tous les autres services et entités qui en dépendent.
    *   **Impact** : Critique. La testabilité de toute la logique de combat (dégâts, initiative, décisions de l'IA) est compromise. Il est impossible de vérifier de manière fiable le comportement de la logique métier si les lancers de dés ne sont pas prévisibles pendant les tests.
    *   **Correctif Suggéré** : Transformer `DiceRollingService`. Il ne doit plus être statique. Il devrait accepter dans son constructeur une interface `IRandomNumberGenerator`. En production, vous injecterez une classe qui utilise `Math.random()`. En test, vous injecterez un "mock" qui retourne des nombres contrôlés (ex: `return 20;`).

2.  **Services dépendants du `DiceRollingService`**
    *   **Violation** : `InitiativeService.ts` et les services d'IA (`ActionPrioritizer.ts`, etc.) deviennent impurs par transitivité, car ils dépendent de `DiceRollingService` ou de méthodes (`calculateDamage`) qui en dépendent.
    *   **Impact** : Élevé. L'ensemble de la chaîne de décision de l'IA devient non déterministe et donc très complexe à déboguer et à valider.

3.  **`GameNarrativeService.ts`**
    *   **Violation** : La méthode `createWelcomeMessage` utilise `Math.random()` directement pour choisir un message.
    *   **Impact** : Mineur, mais symptomatique du même problème de pureté. Pour tester cette fonction, il faudrait une approche similaire à celle du `DiceRollingService`.

### Problèmes de Conception des Services de Domaine

Au-delà de la pureté, certains services présentent des patrons de conception qui pourraient être améliorés pour augmenter la robustesse du code.

1.  **Services avec état (`AIDecisionMaker.ts`, `ThreatAssessment.ts`)**
    *   **Observation** : Ces services sont instanciés avec une référence à un objet `Combat` (`this.combat = combat`), ce qui les lie à l'état d'un combat spécifique.
    *   **Impact** : Moyen. Cela peut rendre le code plus difficile à suivre. Un service "stateless" (sans état interne), où l'état sur lequel il opère (`combat`) est passé en paramètre de chaque méthode, est généralement plus simple, plus prévisible et plus facile à réutiliser.
    *   **Suggestion** : Refactoriser ces services pour qu'ils n'aient pas d'état interne. Passez l'objet `combat` en argument des méthodes qui en ont besoin (ex: `decideAction(combat, entityId)`).

2.  **Injection de Dépendances Fragile (`CombatAIService.ts`)**
    *   **Observation** : Le service utilise des méthodes comme `getQueryService()` qui lèvent une exception si elles ne sont pas "patchées" à l'exécution. 
    *   **Impact** : Élevé. C'est un anti-pattern. Le contrat d'une classe n'est pas clair et les dépendances sont cachées. Une erreur de configuration ne sera détectée qu'à l'exécution.
    *   **Correctif Suggéré** : Utiliser l'injection de dépendances par constructeur. Le constructeur de `CombatAIService` devrait prendre en paramètre les instances des services dont il a besoin (`queryService`, `actionService`, etc.).

### Points Positifs

-   **`CombatQueryService.ts`** : Ce fichier est un excellent exemple de service de requête pur et sans état, respectant parfaitement les principes de CQRS (Command Query Responsibility Segregation) au sein du domaine. Sa conception est un modèle à suivre pour les autres services.

---

## Conclusion de l'Audit (Partie 3)

L'analyse de ce lot met en lumière un point crucial : la différence entre "placer la logique dans le domaine" et "placer de la logique *pure* dans le domaine". La gestion des effets de bord comme l'aléatoire est la clé pour rendre le domaine véritablement testable et robuste.

La refactorisation du `DiceRollingService` est la modification la plus impactante à réaliser. Elle débloquera la capacité à tester de manière fiable une très grande partie de la logique métier de l'application.
