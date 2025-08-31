# AUDIT ARCHITECTURAL EXHAUSTIF - ASSAINISSEMENT CODEBASE D&D

**Date**: 31 Août 2025  
**Objectif**: Identifier toutes les violations architecturales restantes pour assainir définitivement l'application avant le développement du système de combat  
**Référence**: `src/ARCHITECTURE_GUIDELINES.md` - Source de vérité unique  

---

## SYNTHÈSE DES VIOLATIONS MAJEURES

| Règle Violée | Gravité | Nb Violations | Impact Architectural |
|--------------|---------|---------------|---------------------|
| **Règle #2 - Immutabilité** | 🔴 CRITIQUE | 15+ | Corruption possible des entités Domain |
| **Règle #3 - Logique dans Domain** | 🟡 MODÉRÉE | 8 | Logique métier dispersée |
| **Règle #4 - Présentation Stupide** | 🟢 MINEURE | 3 | Calculs dans UI |
| **Règle #6 - Zéro console.log** | 🟢 MINEURE | 6 | Traces de débogage non standardisées |

**Score de Conformité Global**: 7/10  
**Règles Parfaitement Respectées**: Règle #1 (Pureté Domain), Règle #5 (Mappers)

---

## DÉTAIL DES VIOLATIONS PAR FICHIER

### 🔴 **VIOLATIONS CRITIQUES - Règle #2 (Immutabilité)**

#### **`src/domain/entities/GameSession.ts`**
**Lignes concernées**: 183, 189, 329, 343  
**Violations**:
```typescript
// Ligne 183 - Mutation directe du tableau
this._sceneHistory.push(this._currentSceneId);

// Ligne 189 - Mutation avec shift()  
this._sceneHistory.shift();

// Ligne 329 - Mutation pour ajouter compagnons
this._companions.push(companion);

// Ligne 343 - Mutation avec splice()
const companion = this._companions.splice(index, 1)[0];
```
**Règle violée**: `ARCHITECTURE_GUIDELINES.md` - Règle #2 "Immutabilité Stricte : Les méthodes qui modifient l'état doivent retourner une **nouvelle instance** de l'objet (en utilisant le pattern `with...`)"  
**Correction proposée**: 
- Créer des méthodes `withNewScene(sceneId: string): GameSession`
- Implémenter `withAddedCompanion(companion: Character): GameSession`  
- Remplacer toutes les mutations par des créations d'instances

#### **`src/domain/entities/Effects.ts`**
**Lignes concernées**: 212  
**Violations**:
```typescript
// Ligne 212 - Mutation directe du tableau
expiredEffects.push(effect.id);
```
**Règle violée**: Règle #2 - Pattern immutable requis  
**Correction proposée**: Utiliser spread operator `[...expiredEffects, effect.id]`

#### **`src/domain/entities/Combat.ts` (Pattern généralisé)**  
**Lignes concernées**: Multiple (76 occurrences d'assignations `this._property =`)  
**Violations**: Assignations directes sans création de nouvelles instances  
**Correction proposée**: Refactoriser toutes les méthodes pour retourner de nouvelles instances

### 🟡 **VIOLATIONS MODÉRÉES - Règle #3 (Logique Métier dans Domain)**

#### **`src/application/services/CombatOrchestrationService.ts`**
**Lignes concernées**: 403, 412-414  
**Violations**:
```typescript
// Ligne 403 - Calcul de modificateur (règle D&D)
const strengthMod = Math.floor((attacker.abilities.strength - 10) / 2);

// Lignes 412-414 - Calcul de dégâts (mécanique de jeu)
const weaponDie = Math.floor(Math.random() * 6) + 1;
const strengthMod = Math.floor((attacker.abilities.strength - 10) / 2);
return Math.max(1, weaponDie + strengthMod);
```
**Règle violée**: Règle #3 "Logique Métier dans le Domaine : Toute la logique métier (règles du jeu, calculs, conditions de victoire, etc.) doit résider **exclusivement** dans la couche `Domain`"  
**Correction proposée**: 
- Créer `src/domain/services/AbilityCalculationService.ts`
- Créer `src/domain/services/DamageCalculationService.ts`
- Déplacer toute la logique D&D vers ces services Domain

#### **`src/application/usecases/CombatUseCase.ts`**
**Lignes concernées**: 317, 319, 372-373, 94-96  
**Violations**:
```typescript
// Ligne 317 - Jet d'attaque (règle D&D)
const attackRoll = Math.floor(Math.random() * 20) + 1;

// Ligne 319 - Calcul de dégâts
const damage = hit ? Math.floor(Math.random() * 6) + 1 : 0;

// Lignes 372-373 - Calcul de sort
const damage = Math.floor(Math.random() * 6) + 1;
const spellName = 'Trait de feu';

// Lignes 94-96 - Modificateur d'initiative ennemi
const initiativeRoll = Math.floor(Math.random() * 20) + 1;
const dexModifier = 2; // TODO: récupérer le vrai modificateur
```
**Règle violée**: Règle #3 - Logique métier dans Application au lieu de Domain  
**Correction proposée**: 
- Créer `src/domain/services/DiceRollingService.ts`  
- Créer `src/domain/services/InitiativeService.ts`
- Déplacer tous les calculs D&D vers le Domain

### 🟢 **VIOLATIONS MINEURES - Règle #4 (Présentation Stupide)**

#### **`src/presentation/components/GameUI.tsx`**
**Lignes concernées**: 85-93  
**Violations**:
```typescript
// Calculs et logique métier dans la présentation
const getHealthPercentage = () => {
  return Math.max(0, Math.min(100, (player.currentHP / player.maxHP) * 100));
};

const getHealthColor = () => {
  const percentage = getHealthPercentage();
  if (percentage > 75) return '#4ade80';
  if (percentage > 50) return '#fbbf24'; 
  // ... logique de couleurs
};
```
**Règle violée**: Règle #4 "Présentation 'Stupide' : Elle ne contient **aucune logique métier**"  
**Correction proposée**: 
- Créer `src/application/usecases/UIStateUseCase.ts`
- Déplacer `getHealthPercentage()` et `getHealthColor()` vers ce Use Case

#### **`src/presentation/containers/CombatContainer.tsx`**  
**Lignes concernées**: 302-306  
**Violations**:
```typescript
// Calcul de distance tactique dans la présentation
const distance = Math.abs(currentEntity.position.x - position.x) + 
                Math.abs(currentEntity.position.y - position.y);
if (distance <= weaponRange) { ... }
```
**Règle violée**: Règle #4 - Logique de calcul de distance (règle D&D)  
**Correction proposée**: 
- Créer `src/domain/services/TacticalCalculationService.ts`
- Méthode `calculateManhattanDistance(from: Position, to: Position): number`

### 🟢 **VIOLATIONS MINEURES - Règle #6 (Zéro console.log)**

#### **Multiple fichiers avec console.log/error/warn**
**Fichiers concernés**:
- `src/application/usecases/CombatUseCase.ts` (lignes 142, 180)
- `src/presentation/containers/CombatContainer.tsx` (lignes 106, 156)  
- `src/domain/entities/Weapon.ts` (ligne 191)

**Violations**:
```typescript
console.error('Failed to get current combat:', error);
console.error('🚨 AI Turn error:', error);
console.warn('⚠️ Using fallback weapons - inventory not found');
console.warn(`Invalid dice format: ${diceString}`);
```
**Règle violée**: Règle #6 "Zéro `console.log` : Le code de production ne doit contenir aucun `console.log`. Utiliser le service de `Logger` fourni par l'infrastructure"  
**Correction proposée**: Remplacer par `logger.error()`, `logger.warn()` du service Logger existant

---

## PLAN D'ACTION GLOBAL - PRIORISATION

### 🔴 **PHASE 1 - IMMUTABILITÉ (CRITIQUE)**
**Durée estimée**: 2-3 sessions  
**Objectif**: Respecter la Règle #2 - Immutabilité Stricte

#### **Actions prioritaires**:
1. **Refactoriser GameSession.ts**
   - Implémenter `withNewScene()`, `withAddedCompanion()`, `withRemovedCompanion()`
   - Éliminer toutes les mutations directes
   
2. **Refactoriser Effects.ts**  
   - Patterns immutables pour expiration d'effets
   - Méthodes `withExpiredEffect()`, `withAddedEffect()`

3. **Vérifier Combat.ts**
   - S'assurer que toutes les méthodes respectent l'immutabilité
   - Pattern `with...()` systématique

### 🟡 **PHASE 2 - CENTRALISATION LOGIQUE MÉTIER (MODÉRÉE)**
**Durée estimée**: 2 sessions  
**Objectif**: Respecter la Règle #3 - Logique dans Domain

#### **Actions prioritaires**:
1. **Créer les Services Domain manquants**:
   ```typescript
   src/domain/services/AbilityCalculationService.ts   // Modificateurs D&D
   src/domain/services/DamageCalculationService.ts    // Calculs de dégâts  
   src/domain/services/DiceRollingService.ts          // Jets de dés
   src/domain/services/InitiativeService.ts           // Calculs d'initiative
   src/domain/services/TacticalCalculationService.ts  // Distance, portée
   ```

2. **Refactoriser CombatOrchestrationService.ts**
   - Déléguer tous les calculs aux services Domain
   - Ne garder que l'orchestration

3. **Nettoyer CombatUseCase.ts**  
   - Utiliser les services Domain pour tous les calculs
   - Éliminer la logique métier directe

### 🟢 **PHASE 3 - NETTOYAGES MINEURS**
**Durée estimée**: 1 session  
**Objectifs**: Finaliser les Règles #4 et #6

#### **Actions**:
1. **Créer UIStateUseCase.ts** - Logique d'affichage santé
2. **Remplacer console.log** - Utiliser Logger partout  
3. **Nettoyer GameUI.tsx** - Déléguer calculs vers Use Cases

---

## CONCLUSION - ÉTAT ARCHITECTURAL CIBLE

### **Après Application des Corrections**:

✅ **Score de Conformité Attendu**: 10/10  
✅ **Architecture Hexagonale Parfaite**: Toutes les 6 règles respectées  
✅ **Domain Pur**: Toute la logique métier centralisée  
✅ **Immutabilité Totale**: Aucune mutation d'entités  
✅ **Présentation Stupide**: Zéro logique métier dans UI  
✅ **Code de Production**: Zéro console.log, Logger partout  

### **Bénéfices pour le Développement Combat**:

🚀 **Développement Fluide**: Architecture solide qui porte le code  
🧪 **Testabilité Maximale**: Chaque couche isolée et testable  
🔧 **Maintenabilité**: Code prévisible et conforme aux patterns  
⚡ **Performance**: Pas de fuites mémoire par mutation  
📚 **Lisibilité**: Séparation claire des responsabilités  

### **Recommandation Finale**:

**L'application est à 70% assainie**. Les violations identifiées sont précises et les corrections sont claires. Après ces 3 phases de nettoyage (5-6 sessions estimées), l'architecture sera **parfaitement conforme** aux `ARCHITECTURE_GUIDELINES.md` et prête pour un développement serein du système de combat.

**Le jeu en vaut largement la chandelle** : une architecture propre aujourd'hui = plaisir de développement démultiplié demain ! 🏆