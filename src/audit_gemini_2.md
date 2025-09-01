# Audit d'Architecture par Gemini - Partie 2

Ce document est la suite de l'audit et détaille les violations des `ARCHITECTURE_GUIDELINES.md` trouvées dans un nouveau lot de fichiers.

---

### Fichiers analysés pour ce rapport :

- `domain/entities/Action.ts`
- `domain/entities/Spell.ts`
- `domain/entities/TacticalGrid.ts`
- `domain/entities/Weapon.ts`
- `domain/factories/CombatantFactory.ts`
- `domain/services/CombatActionService.ts`
- `domain/services/CombatStateService.ts`
- `domain/services/DamageCalculationService.ts`

---

## Nouvelles Violations Identifiées

### Règle #2 : Immutabilité Stricte

L'analyse de ce lot confirme que le non-respect de l'immutabilité est un problème récurrent qui affecte des parties profondes du domaine.

1.  **`domain/entities/Spell.ts` (Classe `SpellSlots`)**
    *   **Violation** : La classe `SpellSlots` est mutable. Les méthodes `useSlot`, `recoverAllSlots` et `recoverSlots` modifient directement les propriétés internes (`this._usedSlots`).
    *   **Impact** : Critique. L'état des ressources magiques d'une entité peut changer de manière imprévisible. Une opération qui semble être une simple lecture (par exemple, passer `spellSlots` à une autre méthode) pourrait entraîner une modification de l'état original.
    *   **Correctif Suggéré** : Rendre les méthodes de `SpellSlots` immuables. Par exemple, `useSlot` devrait retourner une *nouvelle instance* de `SpellSlots` avec le compteur de `usedSlots` mis à jour.

2.  **`domain/entities/TacticalGrid.ts`**
    *   **Violation** : La classe `TacticalGrid` est entièrement mutable. Des méthodes comme `occupyCell`, `freeCell` et `moveEntity` modifient directement la collection de cellules (`this._cells`).
    *   **Impact** : Critique. La grille de combat est un élément central de l'état du combat. Sa mutabilité signifie que l'état de l'agrégat `Combat` n'est pas vraiment immuable, car un de ses composants principaux peut être modifié. Le `TODO` dans `CombatActionService` (`// TODO: implémenter clonage si nécessaire`) met en évidence ce problème.
    *   **Correctif Suggéré** : Refactoriser `TacticalGrid` pour qu'elle soit immuable. Chaque méthode de modification doit retourner une nouvelle instance de `TacticalGrid` avec les changements appliqués.

3.  **`domain/services/CombatStateService.ts`**
    *   **Violation** : La méthode `clone` effectue une copie superficielle (shallow copy) de la carte des entités. 
    *   **Impact** : Élevé. C'est une confirmation de la violation identifiée dans `audit_gemini_1.md`. Même si l'agrégat `Combat` est cloné, les objets `CombatEntity` à l'intérieur de sa carte `_entities` ne le sont pas. Si une `CombatEntity` est mutée ailleurs, toutes les instances du `Combat` qui la partagent seront affectées, brisant l'isolation de l'état.

### Règle #3 : Logique Métier dans le Domaine (Pureté)

Bien que la logique soit dans le domaine, elle n'est pas toujours "pure", ce qui la rend difficile à tester.

1.  **`Action.ts`, `Spell.ts`, `Weapon.ts`**
    *   **Violation** : Plusieurs méthodes de calcul de dégâts ou de soins (`calculateDamage`, `calculateHealing`, etc.) contiennent des appels directs à `Math.random()`.
    *   **Impact** : Élevé. Cela rend la logique métier principale non déterministe et difficile, voire impossible, à tester de manière fiable. Pour tester une méthode, il faut pouvoir contrôler ses entrées, et `Math.random()` est une entrée imprévisible.
    *   **Correctif Suggéré** : Suivre le modèle excellent déjà présent dans `DamageCalculationService`. La logique de lancer de dés doit être extraite dans un `DiceRollingService` qui peut être injecté ou utilisé par ces entités. Pour les tests, une version "mock" de ce service peut être fournie pour retourner des résultats prévisibles.

---

## Conclusion de l'Audit (Partie 2)

Cette deuxième analyse renforce les conclusions de la première. Le projet a une bonne structure de base, mais des concepts fondamentaux comme l'immutabilité et la pureté des fonctions ne sont pas appliqués de manière cohérente dans la couche `Domain`.

Le `DamageCalculationService` se démarque comme un excellent exemple de la manière dont la logique métier et ses dépendances (comme les lancers de dés) devraient être structurées. L'appliquer aux autres parties du domaine serait une étape majeure vers le respect total des directives d'architecture.
