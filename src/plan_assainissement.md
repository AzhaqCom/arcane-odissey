# PLAN D'ASSAINISSEMENT ARCHITECTURAL - FEUILLE DE ROUTE

**Date de création**: 31 Août 2025  
**Basé sur**: `audit_assainissement.md`  
**Objectif**: Atteindre une conformité architecturale parfaite (10/10) selon `ARCHITECTURE_GUIDELINES.md`  

**Progression Globale**: ◯◯◯ 0/3 Phases Terminées

---

## 🔴 **PHASE 1 - IMMUTABILITÉ (CRITIQUE)**

**Objectif**: Respecter la Règle #2 - Immutabilité Stricte  
**Durée estimée**: 2-3 sessions  
**Priorité**: CRITIQUE  

**Progression Phase 1**: ◯◯◯◯◯◯◯ 0/7 Actions Terminées

### **1.1 - Refactoriser GameSession.ts (Entité Critique)**

- [ ] **Action 1.1.1**: Implémenter `withNewScene(sceneId: string): GameSession`  
  - Remplacer `this._sceneHistory.push(this._currentSceneId)` (ligne 183)
  - Créer nouvelle instance au lieu de mutation

- [ ] **Action 1.1.2**: Implémenter `withPreviousScene(): GameSession`  
  - Remplacer `this._sceneHistory.shift()` (ligne 189)  
  - Gestion immutable de l'historique

- [ ] **Action 1.1.3**: Implémenter `withAddedCompanion(companion: Character): GameSession`  
  - Remplacer `this._companions.push(companion)` (ligne 329)
  - Création d'instance avec nouveau tableau

- [ ] **Action 1.1.4**: Implémenter `withRemovedCompanion(index: number): GameSession`  
  - Remplacer `this._companions.splice(index, 1)[0]` (ligne 343)
  - Pattern immutable de suppression

- [ ] **Action 1.1.5**: Audit complet et correction de toutes les assignations `this._property =`  
  - Identifier toutes les 76 occurrences d'assignations directes
  - Transformer en méthodes `with...()` appropriées

### **1.2 - Refactoriser Effects.ts (Gestion des Effets)**

- [ ] **Action 1.2.1**: Corriger la mutation du tableau `expiredEffects` (ligne 212)  
  - Remplacer `expiredEffects.push(effect.id)` par `[...expiredEffects, effect.id]`
  - Implémenter pattern immutable pour expiration

- [ ] **Action 1.2.2**: Implémenter `withExpiredEffect(effectId: string): Effects`  
  - Méthode immutable pour marquer un effet comme expiré
  - Retourner nouvelle instance Effects

### **1.3 - Vérification et Finalisation Immutabilité**

- [ ] **Action 1.3.1**: Audit final de Combat.ts  
  - S'assurer que toutes les méthodes respectent l'immutabilité
  - Vérifier le pattern `with...()` systématique
  - Tests de non-régression sur l'immutabilité

---

## 🟡 **PHASE 2 - CENTRALISATION LOGIQUE MÉTIER (MODÉRÉE)**

**Objectif**: Respecter la Règle #3 - Logique Métier dans Domain  
**Durée estimée**: 2 sessions  
**Priorité**: MODÉRÉE  

**Progression Phase 2**: ◯◯◯◯◯◯◯◯◯ 0/9 Actions Terminées

### **2.1 - Créer les Services Domain Manquants**

- [ ] **Action 2.1.1**: Créer `src/domain/services/AbilityCalculationService.ts`  
  - Méthode `calculateModifier(score: number): number` 
  - Centraliser `Math.floor((score - 10) / 2)`
  - Tests unitaires des calculs D&D 5E

- [ ] **Action 2.1.2**: Créer `src/domain/services/DamageCalculationService.ts`  
  - Méthode `calculateWeaponDamage(weapon: Weapon, attacker: Character): number`
  - Centraliser toute la logique de calcul de dégâts
  - Support modificateurs Strength/Dex selon arme

- [ ] **Action 2.1.3**: Créer `src/domain/services/DiceRollingService.ts`  
  - Méthode `rollD20(): number`, `rollDamage(diceCount: number, diceType: number): number`
  - Centraliser tous les jets de dés aléatoires
  - Interface pure et testable

- [ ] **Action 2.1.4**: Créer `src/domain/services/InitiativeService.ts`  
  - Méthode `calculateInitiative(dexterityModifier: number): number`
  - Centraliser logique d'initiative D&D
  - Gestion des modificateurs et bonus

- [ ] **Action 2.1.5**: Créer `src/domain/services/TacticalCalculationService.ts`  
  - Méthode `calculateManhattanDistance(from: Position, to: Position): number`
  - Méthode `isWithinRange(from: Position, to: Position, range: number): boolean`
  - Centraliser tous les calculs tactiques

### **2.2 - Refactoriser CombatOrchestrationService.ts**

- [ ] **Action 2.2.1**: Refactoriser calcul modificateur Strength (ligne 403)  
  - Utiliser `AbilityCalculationService.calculateModifier()`
  - Supprimer `Math.floor((attacker.abilities.strength - 10) / 2)`

- [ ] **Action 2.2.2**: Refactoriser calculs de dégâts (lignes 412-414)  
  - Utiliser `DamageCalculationService.calculateWeaponDamage()`
  - Déléguer toute la logique au Domain

### **2.3 - Nettoyer CombatUseCase.ts**

- [ ] **Action 2.3.1**: Refactoriser jets d'attaque (ligne 317)  
  - Utiliser `DiceRollingService.rollD20()`
  - Supprimer `Math.floor(Math.random() * 20) + 1`

- [ ] **Action 2.3.2**: Refactoriser calculs de dégâts et sorts (lignes 319, 372-373)  
  - Utiliser services Domain appropriés
  - Éliminer toute logique métier directe du Use Case

---

## 🟢 **PHASE 3 - NETTOYAGES FINAUX (MINEURE)**

**Objectif**: Finaliser les Règles #4 (Présentation Stupide) et #6 (Zéro console.log)  
**Durée estimée**: 1 session  
**Priorité**: MINEURE  

**Progression Phase 3**: ◯◯◯◯◯ 0/5 Actions Terminées

### **3.1 - Nettoyer la Couche Présentation (Règle #4)**

- [ ] **Action 3.1.1**: Créer `src/application/usecases/UIStateUseCase.ts`  
  - Méthode `getHealthDisplayData(character: Character): HealthDisplayData`
  - Interface pour données d'affichage santé avec pourcentage et couleur

- [ ] **Action 3.1.2**: Refactoriser GameUI.tsx (lignes 85-93)  
  - Supprimer `getHealthPercentage()` et `getHealthColor()`
  - Utiliser `UIStateUseCase.getHealthDisplayData()`
  - Présentation 100% stupide

- [ ] **Action 3.1.3**: Refactoriser CombatContainer.tsx (lignes 302-306)  
  - Supprimer calcul de distance tactique
  - Utiliser `TacticalCalculationService.calculateManhattanDistance()`

### **3.2 - Éliminer les console.log (Règle #6)**

- [ ] **Action 3.2.1**: Nettoyer CombatUseCase.ts  
  - Remplacer `console.error` (lignes 142, 180) par `logger.error()`
  - Utiliser le service Logger existant

- [ ] **Action 3.2.2**: Nettoyer les autres fichiers  
  - CombatContainer.tsx (lignes 106, 156): `console.error/warn` → `logger.error/warn()`
  - Weapon.ts (ligne 191): `console.warn` → `logger.warn()`

---

## 📊 **MÉTRIQUES DE PROGRESSION**

### **Tableau de Bord Global**

| Phase | Actions Terminées | Actions Totales | Pourcentage | Statut |
|-------|------------------|-----------------|-------------|--------|
| **Phase 1 - Immutabilité** | 0 | 7 | 0% | ◯ En attente |
| **Phase 2 - Logique Métier** | 0 | 9 | 0% | ◯ En attente |
| **Phase 3 - Nettoyages** | 0 | 5 | 0% | ◯ En attente |
| **TOTAL GLOBAL** | **0** | **21** | **0%** | 🔴 Non démarré |

### **Objectifs de Conformité**

- [ ] **Règle #1 - Pureté Domain**: ✅ Déjà conforme
- [ ] **Règle #2 - Immutabilité**: 🔴 Phase 1 requise
- [ ] **Règle #3 - Logique dans Domain**: 🟡 Phase 2 requise  
- [ ] **Règle #4 - Présentation Stupide**: 🟢 Phase 3 requise
- [ ] **Règle #5 - Mappers Explicites**: ✅ Déjà conforme
- [ ] **Règle #6 - Zéro console.log**: 🟢 Phase 3 requise

### **Score de Conformité Architecturale**

- **Score Actuel**: 7/10
- **Score Cible**: 10/10  
- **Score après Phase 1**: 8.5/10
- **Score après Phase 2**: 9.5/10
- **Score après Phase 3**: 10/10 ✅

---

## 🎯 **CRITÈRES DE VALIDATION PAR PHASE**

### **Validation Phase 1 - Immutabilité**
- [ ] Aucune assignation `this._property =` dans les entités Domain
- [ ] Toutes les méthodes de mutation retournent de nouvelles instances  
- [ ] Tests unitaires d'immutabilité passent (objet original inchangé)
- [ ] `npx tsc --noEmit` compile sans erreurs

### **Validation Phase 2 - Logique Métier**  
- [ ] Aucun calcul D&D dans les couches Application/Presentation
- [ ] Tous les services Domain créés et fonctionnels
- [ ] CombatOrchestrationService et CombatUseCase refactorisés
- [ ] Tests unitaires des services Domain passent

### **Validation Phase 3 - Nettoyages**
- [ ] Aucune logique métier dans les composants UI
- [ ] Aucun `console.log/error/warn` dans le codebase  
- [ ] UIStateUseCase implémenté et utilisé
- [ ] Audit final: 10/10 de conformité architecturale

---

## 📝 **NOTES ET COMMENTAIRES**

**Session du [DATE]**:  
_[Espace pour notes de progression, blocages rencontrés, décisions techniques]_

---

**Session du [DATE]**:  
_[Espace pour notes de progression, blocages rencontrés, décisions techniques]_

---

## 🏆 **OBJECTIF FINAL**

**À la fin de ce plan d'assainissement**:

✅ **Architecture Hexagonale Parfaite** - Conformité 10/10  
✅ **Code de Production Robuste** - Zéro dette technique architecturale  
✅ **Développement Combat Serein** - Fondations solides et prévisibles  
✅ **Maintenabilité Maximale** - Code évolutif et testable  

**🎮 Ready to Code Combat System! 🚀**