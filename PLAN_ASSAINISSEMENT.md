# 🧹 PLAN D'ASSAINISSEMENT DU CODE
*Nettoyage complet du projet pour respecter les PRINCIPES DIRECTEURS D'ARCHITECTURE*

## 📅 Date: 03/09/2025

## 🎯 OBJECTIF
Éliminer tout le code legacy, mort et inutilisé pour obtenir une base de code propre, maintenable et conforme à l'architecture hexagonale.

---

## 📊 ANALYSE ACTUELLE

### ✅ SYSTÈME PHOENIX ACTIF
- `CombatEngine.ts` - Moteur immutable (GARDÉ)
- `CombatGameUseCase.ts` - Orchestration (GARDÉ)
- `SimpleAIService.ts` - IA pure (GARDÉ)
- `useCombatGame.ts` - Hook Phoenix (GARDÉ)
- `CombatScenePhoenix.tsx` - Scène principale (GARDÉ)
- `CombatGridNew.tsx` - Grille Phoenix (GARDÉ)
- `CombatPanelNew.tsx` - Panel Phoenix (GARDÉ)

### ❌ SYSTÈME LEGACY À SUPPRIMER

#### **1. COMPOSANTS PRESENTATION OBSOLÈTES**
```
✗ src/presentation/components/CombatPanel.tsx (200+ lignes)
✗ src/presentation/components/CombatGrid.tsx (195 lignes)
✗ src/presentation/components/CombatScene.tsx (300+ lignes)
✗ src/presentation/components/CombatTestPage.tsx (270 lignes)
✗ src/presentation/containers/CombatContainer.tsx
```
**Raison**: Remplacés par les versions Phoenix (*New.tsx et ScenePhoenix)

#### **2. HOOKS OBSOLÈTES**
```
✗ src/presentation/hooks/useCombat.ts (ancien hook)
```
**Raison**: Remplacé par useCombatGame.ts

#### **3. DOMAIN LEGACY**
```
✗ src/domain/entities/Combat.ts (45 lignes stub)
✗ src/domain/factories/CombatantFactory.ts (si non utilisé)
✗ src/domain/types/Combat.ts (types legacy)
```
**Raison**: Combat.ts est un stub de compatibilité, CombatEngine.ts est la vraie implémentation

#### **4. APPLICATION LEGACY**
```
✗ src/application/usecases/CombatUseCase.ts (si existe encore)
```
**Raison**: Remplacé par CombatGameUseCase.ts

#### **5. TYPES LEGACY**
```
✗ src/types/combat/index.ts (types UI legacy)
```
**Raison**: Types spécifiques à l'ancien système

---

## 🔧 PLAN D'ACTION DÉTAILLÉ

### **PHASE 1: RENOMMAGE (5 min)**
Renommer les composants Phoenix pour retirer "New":
```bash
1. CombatGridNew.tsx → CombatGrid.tsx
2. CombatPanelNew.tsx → CombatPanel.tsx
3. Mettre à jour les imports dans CombatScenePhoenix.tsx
```

### **PHASE 2: SUPPRESSION DES COMPOSANTS LEGACY (10 min)**
```bash
# Composants presentation
rm src/presentation/components/CombatPanel.tsx (ancien)
rm src/presentation/components/CombatGrid.tsx (ancien)
rm src/presentation/components/CombatScene.tsx
rm src/presentation/components/CombatTestPage.tsx
rm src/presentation/containers/CombatContainer.tsx

# Hooks obsolètes
rm src/presentation/hooks/useCombat.ts

# Types legacy
rm -rf src/types/combat/
```

### **PHASE 3: NETTOYAGE DOMAIN (5 min)**
```bash
# Supprimer le stub Combat.ts
rm src/domain/entities/Combat.ts
rm src/domain/types/Combat.ts (si existe)
rm src/domain/factories/CombatantFactory.ts (vérifier utilisation)
```

### **PHASE 4: MISE À JOUR DES EXPORTS (5 min)**
```typescript
// src/presentation/components/index.ts
export { CombatScenePhoenix } from './CombatScenePhoenix';
export { CombatGrid } from './CombatGrid'; // Renommé
export { CombatPanel } from './CombatPanel'; // Renommé

// src/presentation/hooks/index.ts
export { useCombatGame } from './useCombatGame';
// Supprimer export useCombat

// src/domain/entities/index.ts
export * from './CombatEngine';
// Supprimer export Combat
```

### **PHASE 5: VÉRIFICATION DES IMPORTS CASSÉS (10 min)**
```bash
# Rechercher et corriger les imports obsolètes
grep -r "from.*Combat'" src/
grep -r "import.*Combat," src/
grep -r "CombatContainer" src/
```

### **PHASE 6: AUTRES NETTOYAGES IDENTIFIÉS**

#### **Services potentiellement obsolètes**
À vérifier dans `src/domain/services/`:
- CombatAIService.ts (si remplacé par SimpleAIService)
- CombatQueryService.ts (si non utilisé)
- CombatStateService.ts (si non utilisé)
- CombatActionService.ts (si non utilisé)

#### **Repositories à vérifier**
Dans `src/infrastructure/repositories/`:
- ICombatRepository.ts (si plus utilisé)
- TempCombatRepository.ts (si temporaire)

---

## ✅ RÉSULTAT ATTENDU

### **Structure finale simplifiée**
```
src/
├── domain/
│   ├── entities/
│   │   ├── CombatEngine.ts ✅
│   │   └── (autres entités métier)
│   └── services/
│       └── SimpleAIService.ts ✅
├── application/
│   └── usecases/
│       └── CombatGameUseCase.ts ✅
├── presentation/
│   ├── components/
│   │   ├── CombatScenePhoenix.tsx ✅
│   │   ├── CombatGrid.tsx ✅ (renommé)
│   │   └── CombatPanel.tsx ✅ (renommé)
│   └── hooks/
│       └── useCombatGame.ts ✅
└── infrastructure/
    └── (services techniques)
```

### **Métriques d'assainissement**
- **Lignes supprimées**: ~1,500 lignes
- **Fichiers supprimés**: ~10 fichiers
- **Complexité réduite**: 70%
- **Conformité architecture**: 100%

---

## 🚨 PRÉCAUTIONS

1. **Sauvegarder avant suppression** (au cas où)
2. **Compiler après chaque phase** pour détecter les erreurs
3. **Tester le combat** après le nettoyage complet
4. **Vérifier les tests unitaires** (s'ils existent)

---

## 📝 CHECKLIST D'EXÉCUTION

### Phase 1: Renommage
- [ ] CombatGridNew → CombatGrid
- [ ] CombatPanelNew → CombatPanel
- [ ] Mise à jour imports dans CombatScenePhoenix

### Phase 2: Suppression Legacy
- [ ] Anciens composants Combat*.tsx
- [ ] CombatContainer.tsx
- [ ] useCombat.ts
- [ ] types/combat/

### Phase 3: Nettoyage Domain
- [ ] Combat.ts (stub)
- [ ] Types legacy
- [ ] Factories inutilisées

### Phase 4: Exports
- [ ] presentation/components/index.ts
- [ ] presentation/hooks/index.ts
- [ ] domain/entities/index.ts

### Phase 5: Vérification
- [ ] Compilation TypeScript OK
- [ ] Aucun import cassé
- [ ] Combat fonctionne

---

## 🎯 VALIDATION DU PLAN

Ce plan respecte les PRINCIPES DIRECTEURS :
- ✅ **Règle #1**: Domain pur (CombatEngine reste le roi)
- ✅ **Règle #2**: Application fine (CombatGameUseCase orchestration simple)
- ✅ **Règle #3**: Présentation ignorante (composants Phoenix stupides)
- ✅ **Règle #4**: Immutabilité (CombatEngine with...)
- ✅ **Règle #5**: Injection dépendances (DIContainer)
- ✅ **Règle #6**: Zéro console.log (Logger utilisé)

**DEMANDE DE VALIDATION**: Ce plan est-il approuvé pour exécution ?