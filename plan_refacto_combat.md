# 📋 PLAN DE REFACTORING DÉTAILLÉ - DÉCOMPOSITION DE LA CLASSE COMBAT

## 🎯 RÉPARTITION DES MÉTHODES PAR SERVICE SPÉCIALISÉ

---

### 📊 1. CombatQueryService (Lecture seule - RISQUE FAIBLE)
**Responsabilité :** Interface de requêtes pures, sans mutation d'état  

| Méthode                   | Type    | Justification               |
|---------------------------|---------|-----------------------------|
| getCurrentEntity()        | Getter  | État courant sans mutation  |
| getAvailableActions()     | Query   | Liste des actions possibles |
| getAvailableSpells()      | Query   | Liste des sorts disponibles |
| getEntityAtPosition()     | Query   | Recherche par position      |
| canAttackTarget()         | Query   | Validation pure             |
| calculateAttackCover()    | Query   | Calcul tactique             |
| getEntitiesInArea()       | Query   | Zone d'effet                |
| getSpellcastingModifier() | Utility | Calcul pure                 |
| getAbilityModifier()      | Utility | Calcul pure                 |
| isAllyOf() / isEnemyOf()  | Query   | Relations tactiques         |
| Tous les getters          | Getter  | Accès état                  |

---

### 🔄 2. CombatStateService (État central - RISQUE MOYEN)
**Responsabilité :** Cycle de vie du combat, gestion des phases et entités  

| Méthode                             | Type      | Justification     |
|-------------------------------------|-----------|-------------------|
| withAddedEntity()                   | Immutable | Ajout d'entité    |
| addEntity_internal()                | Internal  | Version mutante   |
| withCalculatedInitiativeOrder()     | Immutable | Ordre initiative  |
| calculateInitiativeOrder_internal() | Internal  | Version mutante   |
| withStartedCombat()                 | Immutable | Démarrage         |
| startCombat_internal()              | Internal  | Version mutante   |
| withAdvancedTurn()                  | Immutable | Progression tour  |
| advanceToNextEntity_internal()      | Internal  | Version mutante   |
| withCheckedCombatEnd()              | Immutable | Vérification fin  |
| checkCombatEnd_internal()           | Internal  | Version mutante   |
| resetAllEntitiesActions()           | Utility   | Reset état        |
| clone()                             | Utility   | Clonage immutable |

---

### ⚔️ 3. CombatActionService (Actions - RISQUE ÉLEVÉ)
**Responsabilité :** Exécution des actions, sorts, dégâts, mouvement  

| Méthode                       | Type       | Justification        |
|-------------------------------|------------|----------------------|
| executeAction()               | Action     | Exécution d'action   |
| castSpell()                   | Action     | Lancement de sort    |
| withDamageApplied()           | Immutable  | Application dégâts   |
| applyDamage_internal()        | Internal   | Version mutante      |
| withHealingApplied()          | Immutable  | Application soins    |
| healEntity_internal()         | Internal   | Version mutante      |
| withMovedEntity()             | Immutable  | Mouvement            |
| moveEntity_internal()         | Internal   | Version mutante      |
| withConsumedAction()          | Immutable  | Consommation action  |
| consumeAction_internal()      | Internal   | Version mutante      |
| consumeActionCost_internal()  | Internal   | Coût action          |
| applyActionEffects_internal() | Internal   | Effets action        |
| applySpellEffects_internal()  | Internal   | Effets sort          |
| breakConcentration_internal() | Internal   | Concentration        |
| checkOpportunityAttacks()     | Validation | Attaques opportunité |

---

### 🤖 4. CombatAIService (Intelligence Artificielle - RISQUE TRÈS ÉLEVÉ)
**Responsabilité :** Décisions tactiques, évaluation de menaces, priorités IA  

| Méthode                   | Type       | Justification        |
|---------------------------|------------|----------------------|
| executeAITurn()           | AI Core    | Tour IA complet      |
| getThreatAnalysis()       | AI Query   | Analyse menaces      |
| assessAreaThreats()       | AI Query   | Menaces de zone      |
| getPrioritizedActions()   | AI Logic   | Priorisation actions |
| assessDefenses()          | AI Logic   | Évaluation défensive |
| identifyPriorityTargets() | AI Logic   | Cibles prioritaires  |
| buildAIContext()          | AI Utility | Contexte décision    |
| isEntityInDanger()        | AI Query   | Évaluation danger    |
| hasRangedOptions()        | AI Query   | Options tactiques    |