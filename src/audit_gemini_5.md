# Audit d'Architecture par Gemini - Partie 5

Cette partie de l'audit finalise l'analyse de la couche `Application` en examinant les cas d'utilisation restants, ainsi que la manière dont les dépendances sont gérées et injectées dans la couche `Présentation`.

---

### Fichiers analysés pour ce rapport :

- `application/usecases/CombatUIStateUseCase.ts`
- `application/usecases/GameSessionUseCase.ts`
- `application/usecases/MovementUIUseCase.ts`
- `application/usecases/SpellValidationUseCase.ts`
- `application/usecases/UIStateUseCase.ts`
- `application/usecases/WeaponRangeUseCase.ts`
- `infrastructure/container/DIContainer.ts`
- `presentation/hooks/useRepositories.ts`

---

## Nouvelles Violations et Observations

### Règle #3 : Logique Métier dans le Domaine (Violation Systémique)

L'analyse de ce lot de cas d'utilisation confirme que la fuite de logique métier hors du domaine est un problème systémique et non un cas isolé. Le projet souffre d'un **"Domaine Anémique"** : les entités du domaine sont de simples structures de données, et l'intelligence (la logique métier) est placée dans la couche `Application`.

1.  **`SpellValidationUseCase.ts`**
    *   **Violation** : Ce cas d'utilisation implémente toutes les règles pour déterminer si un sort peut être lancé (vérification de la ligne de vue, de la portée, des emplacements de sorts, etc.).
    *   **Impact** : Critique. Les règles d'incantation sont des règles fondamentales du jeu. Le domaine devrait être le seul à pouvoir répondre à la question "Cette entité peut-elle lancer ce sort ?". Le cas d'utilisation devrait simplement appeler une méthode comme `combat.validateSpellCast(...)`.

2.  **`MovementUIUseCase.ts`**
    *   **Violation** : Ce cas d'utilisation contient la logique de recherche de chemin (pathfinding) pour déterminer les mouvements valides.
    *   **Impact** : Élevé. Le calcul des déplacements sur une grille tactique, en tenant compte des obstacles et des coûts de mouvement, est une logique métier complexe qui appartient au domaine (probablement dans un `TacticalCalculationService`).

3.  **`WeaponRangeUseCase.ts`**
    *   **Violation** : Ce cas d'utilisation implémente la logique pour trouver les cibles valides pour une arme.
    *   **Impact** : Élevé. Le domaine devrait être interrogé pour obtenir cette information, via une méthode comme `combat.findValidTargetsFor(attackerId, weaponId)`.

**Conclusion sur la Règle #3** : Le non-respect de cette règle est le défaut architectural majeur du projet. Il empêche le domaine d'agir comme une source unique de vérité pour les règles du jeu, ce qui rend le code fragile, difficile à maintenir et à tester.

### Points Positifs et Bonnes Pratiques

1.  **Gestion des Dépendances**
    *   **`DIContainer.ts`** : L'utilisation d'un conteneur d'injection de dépendances est une excellente pratique qui centralise la création des services et des dépôts.
    *   **`useRepositories.ts`** : Ce hook est un exemple parfait de la manière de connecter la couche `Présentation` à la couche `Application`. Il masque complètement le fonctionnement du `DIContainer` aux composants React, qui n'ont besoin que de consommer le hook.

2.  **Rôle de "Presenter" / "ViewModel"**
    *   **`CombatUIStateUseCase.ts`** et **`UIStateUseCase.ts`** : Ces cas d'utilisation remplissent un rôle très pertinent pour la couche `Application`. Ils prennent les modèles de données riches du domaine et les transforment en structures de données simples et optimisées pour l'affichage (DTOs ou ViewModels). C'est une séparation des préoccupations claire et efficace.

---

## Conclusion de l'Audit (Partie 5)

L'architecture de la couche `Application` est à deux vitesses. D'un côté, elle montre une grande maturité dans la gestion des dépendances et dans la transformation des données pour l'UI. De l'autre, elle s'approprie une quantité massive de logique métier qui devrait être sanctuarisée dans le domaine.

Le plan d'action est clair : il faut "enrichir" le domaine. La logique des cas d'utilisation de validation et de calcul doit être déplacée dans les entités et services de domaine appropriés. Les cas d'utilisation ne doivent plus être que de simples orchestrateurs qui posent des questions au domaine et lui donnent des ordres, sans jamais lui dire *comment* faire son travail.
