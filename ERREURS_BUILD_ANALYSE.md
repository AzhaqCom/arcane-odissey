# 🐛 ANALYSE DES ERREURS DE BUILD
*Catégorisation et plan de résolution des 365+ erreurs TypeScript*

## 📊 RÉSUMÉ EXÉCUTIF
**365+ erreurs** réparties en **6 catégories principales** :
1. **Modules introuvables** (CombatUseCase, etc.)
2. **Entités obsolètes incompatibles** (ActionPrioritizer, AIDecisionMaker)  
3. **Composants legacy cassés** (CombatContainer, etc.)
4. **Types manquants/erronés**
5. **Variables inutilisées** 
6. **Syntaxe TypeScript invalide**

---

## 🗂️ CATÉGORISATION DÉTAILLÉE

### ❌ **CATÉGORIE 1: MODULES INTROUVABLES** (Critique - 20+ erreurs)
```typescript
// Modules qui n'existent plus ou ont été renommés
./usecases/CombatUseCase ❌ → CombatGameUseCase ✅
./usecases/CombatUseCase ❌ → CombatGameUseCase ✅
../domain/entities/Combat ❌ → CombatEngine ✅
```

**Fichiers affectés:**
- `src/application/index.ts`
- `src/application/mappers/EncounterMapper.ts`
- `src/application/usecases/index.ts`

### ❌ **CATÉGORIE 2: ENTITÉS LEGACY INCOMPATIBLES** (Critique - 200+ erreurs)
```typescript
// ActionPrioritizer utilise l'ancienne interface CombatEntity
Property 'currentHP' does not exist on type 'CombatEntity' ❌
Property 'maxHP' does not exist on type 'CombatEntity' ❌  
Property 'spellSlots' does not exist on type 'CombatEntity' ❌
Property 'knownSpells' does not exist on type 'CombatEntity' ❌
Property 'concentratingOn' does not exist on type 'CombatEntity' ❌

// CombatEngine utilise: hitPoints/maxHitPoints ✅
```

**Fichiers affectés:**
- `src/domain/entities/ActionPrioritizer.ts` (100+ erreurs)
- `src/domain/entities/AIDecisionMaker.ts` (100+ erreurs)
- `src/domain/entities/CombatAIService.ts`

**VERDICT**: Ces fichiers utilisent l'ancienne interface et doivent être **SUPPRIMÉS** ou **RÉÉCRITS**.

### ❌ **CATÉGORIE 3: COMPOSANTS LEGACY CASSÉS** (Critique - 50+ erreurs)
```typescript
// CombatContainer utilise l'ancien hook useCombat
Property 'combat' does not exist on type '{}' ❌
Property 'executeAITurn' does not exist on type '{}' ❌

// Imports obsolètes
import { CombatSceneContent } ❌ → Non utilisé
```

**Fichiers affectés:**
- `src/presentation/containers/CombatContainer.tsx`
- `src/presentation/components/CombatScene.tsx`
- Anciens composants utilisant l'API legacy

### ❌ **CATÉGORIE 4: SYNTAXE TYPESCRIPT INVALIDE** (Bloquant - 2 erreurs)
```typescript
// CombatGameUseCase.ts:26-27
This syntax is not allowed when 'erasableSyntaxOnly' is enabled ❌
```

**CAUSE**: Problème avec les décorateurs ou syntaxe non supportée.

### ❌ **CATÉGORIE 5: TYPES MANQUANTS** (Mineur - 30+ erreurs)
```typescript
Module '"../../domain/entities"' has no exported member 'LogEntry' ❌
Property 'style' does not exist on type 'EventTarget' ❌ 
```

### ❌ **CATÉGORIE 6: VARIABLES INUTILISÉES** (Cleanup - 50+ erreurs)
```typescript
'diceRollingService' is declared but its value is never read ❌
'entity' is declared but its value is never read ❌
```

---

## 🎯 **PLAN DE RÉSOLUTION PAR PRIORITÉ**

### **🔥 PRIORITÉ 1: SUPPRESSION MASSIVE** (Résout ~300 erreurs)
**Action**: Supprimer les fichiers legacy incompatibles.

```bash
# Ces fichiers utilisent l'ancienne interface CombatEntity
rm src/domain/entities/ActionPrioritizer.ts        # ~100 erreurs
rm src/domain/entities/AIDecisionMaker.ts          # ~100 erreurs  
rm src/domain/entities/CombatAIService.ts          # ~20 erreurs

# Composants legacy cassés
rm src/presentation/containers/CombatContainer.tsx  # ~50 erreurs
rm src/presentation/components/CombatScene.tsx      # ~20 erreurs
rm src/presentation/components/CombatPanel.tsx      # ~10 erreurs
rm src/presentation/components/CombatGrid.tsx       # ~10 erreurs
```

### **🔥 PRIORITÉ 2: CORRECTION IMPORTS** (Résout ~20 erreurs)
```typescript
// src/application/index.ts
- export * from './usecases/CombatUseCase';
+ export * from './usecases/CombatGameUseCase';

// src/application/usecases/index.ts  
- export * from './CombatUseCase';
+ export * from './CombatGameUseCase';

// src/application/mappers/EncounterMapper.ts
- import type { CombatUseCase } from '../usecases/CombatUseCase';
+ import type { CombatGameUseCase } from '../usecases/CombatGameUseCase';

- import { Position } from '../../domain/entities/Combat';
+ import type { Position } from '../../domain/entities/CombatEngine'; // Ou définir localement
```

### **🔥 PRIORITÉ 3: CORRECTION SYNTAXE TYPESCRIPT** (Résout 2 erreurs)
```typescript
// src/application/usecases/CombatGameUseCase.ts:26-27
// Identifier et corriger la syntaxe invalide
```

### **🔧 PRIORITÉ 4: NETTOYAGE TYPES** (Résout ~30 erreurs)
```typescript
// Ajouter LogEntry export ou créer type local
// Corriger les casts EventTarget  
// Typer correctement les props
```

### **🧹 PRIORITÉ 5: VARIABLES INUTILISÉES** (Résout ~50 erreurs)
```typescript
// Supprimer toutes les variables déclarées non utilisées
// Ajouter _ devant les paramètres non utilisés
```

---

## ⚡ **EXÉCUTION IMMÉDIATE**

**Commençons par PRIORITÉ 1** qui résoudra **~300 erreurs** en supprimant les fichiers incompatibles :

```bash
# 1. Sauvegarder (optionnel)
cp -r src/domain/entities src/domain/entities.backup

# 2. Supprimer entités legacy incompatibles  
rm src/domain/entities/ActionPrioritizer.ts
rm src/domain/entities/AIDecisionMaker.ts
rm src/domain/entities/CombatAIService.ts

# 3. Supprimer composants legacy
rm src/presentation/containers/CombatContainer.tsx
rm src/presentation/components/CombatScene.tsx  
rm src/presentation/components/CombatPanel.tsx
rm src/presentation/components/CombatGrid.tsx

# 4. Test immédiat
npm run build
```

**Résultat attendu**: ~65 erreurs restantes au lieu de 365+

---

## 📋 **CHECKLIST D'EXÉCUTION**

### Phase 1: Suppression Massive
- [ ] ActionPrioritizer.ts (100+ erreurs)
- [ ] AIDecisionMaker.ts (100+ erreurs)
- [ ] CombatAIService.ts (20+ erreurs)
- [ ] CombatContainer.tsx (50+ erreurs)
- [ ] Anciens composants Combat*.tsx

### Phase 2: Correction Imports
- [ ] application/index.ts
- [ ] application/usecases/index.ts
- [ ] EncounterMapper.ts

### Phase 3: Syntaxe TypeScript
- [ ] CombatGameUseCase.ts ligne 26-27

### Phase 4: Types manquants
- [ ] LogEntry export
- [ ] EventTarget casts

### Phase 5: Variables inutilisées
- [ ] Nettoyage complet

---

## 🎯 **VALIDATION**

Ce plan suit les **PRINCIPES DIRECTEURS** :
- ✅ **Supprime le code obsolète** incompatible avec la nouvelle architecture
- ✅ **Préserve CombatEngine** et l'architecture Phoenix
- ✅ **Respecte la hiérarchie des dépendances** (Domain pur)

**DEMANDE D'EXÉCUTION**: Puis-je procéder à la PRIORITÉ 1 (suppression massive) ?