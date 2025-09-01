# PLAN D'ARCHITECTURE - CONFORMITÉ AUDIT GEMINI

**Date de création**: 1er Septembre 2025  
**Basé sur**: 7 audits Gemini + plan_assainissement.md + plan_presentation.md  
**Objectif**: Corriger toutes les violations identifiées par Gemini et atteindre une architecture parfaite  

**Progression Globale**: ●●◯◯ 2/4 Phases Terminées

---

## 📊 **ANALYSE CRITIQUE - ACTIONS VS GEMINI**

### **CONFORMITÉ PLAN_ASSAINISSEMENT.MD** ✅
**Actions Phase 1-3 PARFAITEMENT ALIGNÉES** avec recommandations Gemini :
- ✅ **Phase 1** : Immutabilité GameSession.ts (Gemini #1)
- ✅ **Phase 2** : Services Domain créés (AbilityCalculation, DamageCalculation, etc.) 
- ✅ **Phase 3** : Console.log éliminés (Règle #6)

### **VIOLATIONS PLAN_PRESENTATION.MD** 🚨
**Actions Phase 1-3 OPPOSÉES** aux recommandations Gemini :

| Action Réalisée | Violation Gemini | Impact |
|-----------------|------------------|---------|
| `CombatUIStateUseCase.ts` | Audit #5 - Domaine Anémique | Logique calcul HP doit être dans `CombatEntity` |
| `MovementUIUseCase.ts` | Audit #5 - Fuite logique métier | Pathfinding doit être dans `Combat.getReachableCells()` |
| `SpellValidationUseCase.ts` | Audit #5 - Domaine Anémique | Validation doit être dans `Combat.canCastSpell()` |
| `WeaponRangeUseCase.ts` | Audit #5 - Fuite logique métier | Doit être dans `Combat.findValidTargets()` |
| Appels directs Use Cases | Audit #6 - Couplage fort | Composants doivent passer par hooks uniquement |
| `new EquipmentService()` | Audit #6 - Instanciation Domain | DIContainer doit gérer création services |

**Score Gemini** : **2/10** (nos Use Cases = nouvelles violations massives)

---

## 🔴 **PHASE 1 - ENRICHIR LE DOMAINE (CRITIQUE)**

**Objectif**: Rapatrier toute logique métier des Use Cases vers Domain  
**Durée estimée**: 3-4 sessions  
**Priorité**: CRITIQUE  

**Progression Phase 1**: ●●●●●●●●●● 10/10 Actions Terminées ✅

### **1.1 - Enrichir Entité Combat**

- [x] **Action 1.1.1**: Créer `Combat.getEntityHealthDisplay(entityId: string): HealthDisplay` ✅
  - ✅ Migré logique de `CombatUIStateUseCase.getEntityHealthDisplay()`
  - ✅ Méthode domain pure pour affichage santé entités
  - ✅ Supprimé `CombatUIStateUseCase.ts` entièrement

- [x] **Action 1.1.2**: Créer `Combat.getReachableCells(entityId: string): Position[]` ✅
  - ✅ Migré logique de `MovementUIUseCase.getReachableCells()`
  - ✅ Intégré calcul distance Manhattan dans Domain
  - ✅ Supprimé `MovementUIUseCase.ts` entièrement

- [x] **Action 1.1.3**: Créer `Combat.canCastSpell(casterId: string, spellId: string): SpellCastingValidation` ✅
  - ✅ Migré toute logique de `SpellValidationUseCase.canCastSpell()`
  - ✅ Validation complète slots + actions + portée
  - ✅ Supprimé `SpellValidationUseCase.ts` entièrement

- [x] **Action 1.1.4**: Créer `Combat.canAttackPosition(attackerId: string, position: Position, weaponId: string): boolean` ✅
  - ✅ Migré logique de `WeaponRangeUseCase.canAttackAtPosition()`
  - ✅ Validation portée avec calcul distance intégré
  - ✅ Supprimé `WeaponRangeUseCase.ts` entièrement

### **1.2 - Enrichir Entités Character & CombatEntity**

- [x] **Action 1.2.1**: Rendre `Character` immutable (Gemini #1) ✅
  - ✅ `currentHP` et `preparedSpells` → `readonly`
  - ✅ Créé `Character.withHP()`, `Character.withPreparedSpells()`
  - ✅ Méthodes `Character.takeDamage()`, `Character.heal()`

- [x] **Action 1.2.2**: Rendre `CombatEntity` immutable (Gemini #1) ✅ 
  - ✅ `currentHP`, `position`, `initiative` → `readonly`
  - ✅ Créé `Combat.withEntityHP()`, `Combat.withEntityPosition()`
  - ✅ Pattern `with...()` cohérent

### **1.3 - Enrichir Services Domain**

- [x] **Action 1.3.1**: Refactoriser `SpellSlots` immutable (Gemini #2) ✅
  - ✅ `useSlot()` → retourne nouvelle instance
  - ✅ `recoverAllSlots()`, `recoverSlots()` → immutables
  - ✅ Supprimé mutations `this._usedSlots`

- [x] **Action 1.3.2**: Refactoriser `TacticalGrid` immutable (Gemini #2) ✅
  - ✅ `occupyCell()`, `freeCell()`, `moveEntity()` → immutables
  - ✅ Chaque modification retourne nouvelle instance
  - ✅ Méthode `_deepClone()` pour clonage robuste

### **1.4 - Validation Phase 1**

- [x] **Action 1.4.1**: Compiler sans erreurs après enrichissement Domain ✅
  - ✅ Toutes les nouvelles méthodes Domain compilent
  - ✅ Immutabilité complète Character et CombatEntity
  - ✅ Suppression de 4 Use Cases Application

- [x] **Action 1.4.2**: Audit conformité Règle #3 ✅
  - ✅ AUCUNE logique métier dans Application Use Cases supprimés
  - ✅ TOUTE logique métier migrée dans Domain Combat
  - ✅ Score Règle #3 : 10/10

---

## 🟡 **PHASE 2 - RENDRE PRÉSENTATION STUPIDE (MODÉRÉE)**

**Objectif**: Centraliser TOUS les appels dans hooks selon Gemini #6  
**Durée estimée**: 2 sessions  
**Priorité**: MODÉRÉE  

**Progression Phase 2**: ●●●●●●● 7/7 Actions Terminées ✅

### **2.1 - Centraliser dans useCombat Hook**

- [x] **Action 2.1.1**: Créer getters Domain dans useCombat ✅
  - ✅ `healthDisplays` depuis `combat.getEntityHealthDisplay()`
  - ✅ `reachableCells` depuis `combat.getReachableCells()`
  - ✅ Toute logique via Domain uniquement

- [x] **Action 2.1.2**: Créer helpers formatage dans useCombat ✅ 
  - ✅ `spellValidations` depuis `combat.canCastSpell()`
  - ✅ `weaponData` depuis `combat.canAttackPosition()`
  - ✅ Hook = seule interface avec Domain

- [x] **Action 2.1.3**: Supprimer imports Use Cases des composants ✅
  - ✅ CombatGrid.tsx : Supprimé imports Use Cases (déjà fait Phase 1)
  - ✅ CombatPanel.tsx : Supprimé imports Use Cases (déjà fait Phase 1)
  - ✅ CombatContainer.tsx : Supprimé imports Use Cases (déjà fait Phase 1)

### **2.2 - Modifier Composants → Props Stupides**

- [x] **Action 2.2.1**: Refactoriser CombatGrid → props pures ✅
  - ✅ `healthDisplays: Map<string, HealthDisplay>` depuis useCombat
  - ✅ `reachableCells: Set<string>` depuis useCombat  
  - ✅ Aucun appel externe dans composant

- [x] **Action 2.2.2**: Refactoriser CombatPanel → props pures ✅
  - ✅ `spellValidations: Map<string, any>` depuis useCombat
  - ✅ `formattedDamages: Map<string, string>` depuis useCombat
  - ✅ Composant = pure UI rendering

- [x] **Action 2.2.3**: Refactoriser CombatContainer → délégation pure ✅
  - ✅ Supprimé `new EquipmentService(weaponRepository)`
  - ✅ Tout récupéré via useCombat hook
  - ✅ Container = orchestration hooks uniquement

### **2.3 - Validation Phase 2**

- [x] **Action 2.3.1**: Audit final appels directs ✅
  - ✅ AUCUN import Use Case dans /components
  - ✅ AUCUNE instanciation service dans /containers  
  - ✅ Hooks = seule interface Application ↔ Presentation

---

## 🟠 **PHASE 3 - PURIFIER DOMAINE (MAJEURE)**

**Objectif**: Injection dépendances + Domain pur selon Gemini #3  
**Durée estimée**: 2-3 sessions  
**Priorité**: MAJEURE  

**Progression Phase 3**: ●●●◯◯◯ 3/6 Actions Terminées

### **3.1 - Refactoriser DiceRollingService (Gemini #3)**

- [x] **Action 3.1.1**: Créer interface `IRandomNumberGenerator` ✅
  - ✅ Interface avec `random(): number` 
  - ✅ Implémentation production + mock tests
  - ✅ Base pour injection dépendances

- [x] **Action 3.1.2**: Refactoriser `DiceRollingService` non-statique ✅
  - ✅ Constructor avec `IRandomNumberGenerator`
  - ✅ Supprimé tous `Math.random()` directs
  - ✅ Service injectable et testable

- [x] **Action 3.1.3**: Injecter DiceRollingService dans Domain ✅
  - ✅ Services DamageCalculationService, InitiativeService : constructor avec service
  - ✅ Méthodes `calculateDamage()` pures via injection
  - ✅ Supprimé tous `Math.random()` directs dans services

### **3.2 - Services Domain Stateless (Gemini #3)**

- [x] **Action 3.2.1**: Refactoriser `AIDecisionMaker` stateless ✅
  - ✅ Supprimé `this.combat = combat`
  - ✅ `decideAction(combat: Combat, entityId: string)` avec combat en paramètre
  - ✅ Service pur sans état interne

- [x] **Action 3.2.2**: Refactoriser `ThreatAssessment` stateless ✅
  - ✅ Même pattern : combat en paramètre de méthodes
  - ✅ Supprimé état interne lié à combat spécifique
  - ✅ Service réutilisable et prévisible

### **3.3 - Injection Dépendances Robuste**

- [ ] **Action 3.3.1**: Refactoriser `CombatAIService` injection constructor
  - Supprimer `getQueryService()` qui lève exceptions
  - Constructor avec dépendances explicites
  - Dépendances visibles et configurables

---

## 🔵 **PHASE 4 - ORCHESTRATION PURE (CRITIQUE)**

**Objectif**: CombatOrchestrationService stupide selon Gemini #4  
**Durée estimée**: 2 sessions  
**Priorité**: CRITIQUE  

**Progression Phase 4**: ◯◯◯◯◯ 0/5 Actions Terminées

### **4.1 - Migrer Logique → Domain Combat**

- [ ] **Action 4.1.1**: Créer `Combat.performWeaponAttack(attackerId, weaponId, targetId): CombatResult`
  - Migrer TOUTE logique de `CombatOrchestrationService.performWeaponAttack()`
  - Jets attaque, vérification AC, calculs dégâts dans Domain
  - Agrégat Combat = source unique vérité

- [ ] **Action 4.1.2**: Créer `Combat.castSpell(casterId, spellId, level, targetId): CombatResult`
  - Migrer logique complète de `CombatOrchestrationService.castSpellAction()`
  - Consommation slots, validation portée dans Domain
  - Entité Combat gère ses propres règles

- [ ] **Action 4.1.3**: Créer `Combat.executeMovement(entityId, newPosition): CombatResult`
  - Migrer logique de `CombatOrchestrationService.executeMovement()`
  - Validation mouvement, attaques opportunité dans Domain
  - Grille tactique gérée par l'agrégat

### **4.2 - Simplifier Orchestration Service**

- [ ] **Action 4.2.1**: Refactoriser CombatOrchestrationService → 3 lignes par méthode
  - `performWeaponAttack()` → `combat.performWeaponAttack()` + sauvegarde
  - `castSpellAction()` → `combat.castSpell()` + sauvegarde  
  - `executeMovement()` → `combat.executeMovement()` + sauvegarde

- [ ] **Action 4.2.2**: Fusionner avec CombatUseCase (Gemini #4)
  - Éliminer duplication orchestration combat
  - Un seul `CombatUseCase` unifié et stupide
  - Hook useCombat → CombatUseCase uniquement

---

## 📊 **MÉTRIQUES DE PROGRESSION**

### **Tableau de Bord Global**

| Phase | Actions Terminées | Actions Totales | Pourcentage | Statut |
|-------|------------------|-----------------|-------------|--------|
| **Phase 1 - Enrichir Domain** | 0 | 10 | 0% | ◯ En attente |
| **Phase 2 - Présentation Stupide** | 0 | 7 | 0% | ◯ En attente |
| **Phase 3 - Domain Pur** | 0 | 6 | 0% | ◯ En attente |
| **Phase 4 - Orchestration Pure** | 0 | 5 | 0% | ◯ En attente |
| **TOTAL GLOBAL** | **0** | **28** | **0%** | 🔴 Non démarré |

### **Score de Conformité Gemini**

- **Score Actuel**: 2/10 (après plan_presentation)
- **Score Cible**: 10/10  
- **Score après Phase 1**: 4/10 (Domain enrichi)
- **Score après Phase 2**: 7/10 (Presentation stupide)
- **Score après Phase 3**: 9/10 (Domain pur)
- **Score après Phase 4**: 10/10 ✅ (Orchestration parfaite)

---

## 🎯 **CRITÈRES DE VALIDATION PAR PHASE**

### **Validation Phase 1 - Domain Enrichi**
- [ ] AUCUNE logique métier dans /application/usecases (sauf orchestration)
- [ ] TOUTE logique dans /domain/entities et /domain/services
- [ ] Entités Combat, Character, CombatEntity 100% immutables
- [ ] Méthodes Domain riches : `combat.performAttack()`, `combat.canCastSpell()`

### **Validation Phase 2 - Presentation Stupide**  
- [ ] AUCUN import Use Case dans /presentation/components
- [ ] AUCUNE instanciation service dans /presentation/containers
- [ ] SEULS les hooks appellent la couche Application
- [ ] Composants = props pures + rendering uniquement

### **Validation Phase 3 - Domain Pur**
- [ ] AUCUN Math.random() direct dans Domain
- [ ] IRandomNumberGenerator injecté partout
- [ ] Services stateless : AIDecisionMaker, ThreatAssessment
- [ ] Injection constructor robuste : CombatAIService

### **Validation Phase 4 - Orchestration Pure**
- [ ] CombatOrchestrationService = 3 lignes par méthode max
- [ ] Domain Combat gère TOUTES ses règles métier
- [ ] Un seul CombatUseCase unifié (fin duplication)
- [ ] Presentation → Hook → UseCase → Domain (chaîne parfaite)

---

## 🏆 **OBJECTIF FINAL GEMINI**

**À la fin de ce plan d'architecture**:

✅ **Domain Riche** - Toute logique métier sanctuarisée  
✅ **Presentation 100% Stupide** - Props + hooks uniquement  
✅ **Domain Pur** - Injection dépendances + testabilité parfaite  
✅ **Orchestration Minimale** - Use Cases = 3 lignes max  
✅ **Architecture Gemini-Compliant** - 10/10 conformité audit  

**🎮 Clean Architecture Parfaite selon Audit Gemini! 🚀**

---

## 📝 **NOTES DE SESSION**

**Session du 1er Septembre 2025**:  
_Analyse critique : plan_presentation a créé nouvelles violations massives selon Gemini. Use Cases Application = anti-pattern selon audit #5. Domain doit être enrichi, pas Application gonflée._

**Actions Prioritaires Identifiées**:
1. **Migrer CombatUIStateUseCase → Combat.getEntityHealthDisplay()**
2. **Migrer MovementUIUseCase → Combat.getReachableCells()**  
3. **Migrer SpellValidationUseCase → Combat.canCastSpell()**
4. **Centraliser appels dans hooks (finir couplage composants → Use Cases)**

---

**Session du [DATE]**:  
_[Espace pour notes de progression, blocages rencontrés, décisions techniques]_

---

**Session du [DATE]**:  
_[Espace pour notes de progression, blocages rencontrés, décisions techniques]_