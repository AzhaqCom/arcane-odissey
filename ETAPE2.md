# 📋 PLAN ÉTAPE 2 - COUCHE APPLICATION

## Objectif
Orchestrer la création du combat avec les vraies données `Character` et `Enemy` depuis la scène, en respectant strictement l'architecture hexagonale.

**Principe clé :** Application = Orchestration stupide (Pattern 3 lignes)

---

## ✅ CHECKLIST DES SOUS-ÉTAPES

### 🔧 ÉTAPE 2.1 - Créer types Domain pour configuration combat
- [x] Créer `src/domain/types/CombatConfiguration.ts`
- [x] Définir interface `CombatSceneConfig`
- [x] Définir interface `CombatInitializationData`
- [x] Exporter dans `domain/types/index.ts`

**Structure attendue :**
```typescript
export interface CombatSceneConfig {
  readonly gridSize: { width: number; height: number };
  readonly playerStartPosition: Position;
  readonly enemySpecs: ReadonlyArray<{
    readonly templateId: string;
    readonly count: number;
    readonly position: Position;
    readonly alternativePositions?: ReadonlyArray<Position>;
  }>;
  readonly terrain?: ReadonlyArray<TerrainCell>;
}
```

---

### 🏭 ÉTAPE 2.2 - Créer CombatFactory dans Domain
- [x] Créer `src/domain/factories/CombatFactory.ts`
- [x] Implémenter méthode statique `createFromSceneData()`
- [x] Implémenter helpers privés `createPlayerEntity()` et `createEnemiesFromConfig()`
- [x] Exporter dans `domain/factories/index.ts`

**Responsabilités :**
- TOUTE la logique de création du combat
- Positionnement des entités
- Création des ennemis depuis templates
- Initialisation du CombatEngine

---

### 📚 ÉTAPE 2.3 - Adapter enemies.ts existant
- [x] Modifier `src/infrastructure/data/characters/enemies.ts`
- [x] Adapter interface `EnemyTemplate` pour matcher `DomainEnemyTemplate`
- [x] Transformer en dictionnaire pour accès par ID
- [x] Ajouter les propriétés manquantes (challengeRating, proficiencyBonus)

**Actions :**
```typescript
// Transformer ENEMY_TEMPLATES array en dictionnaire
export const ENEMY_TEMPLATES: Record<string, DomainEnemyTemplate>
```

---

### 🗄️ ÉTAPE 2.4 - Implémenter EnemyRepository
- [x] Créer `src/infrastructure/repositories/EnemyRepository.ts`
- [x] Implémenter interface `IEnemyRepository`
- [x] Méthode `getTemplatesForScene()` qui lit depuis SCENES_DATA
- [x] Méthode `getTemplate()` qui retourne un template depuis ENEMY_TEMPLATES

**Pattern :**
```typescript
async getTemplatesForScene(sceneId: string): Promise<DomainEnemyTemplate[]> {
  // 1. Récupérer scène depuis SCENES_DATA
  // 2. Extraire enemySpecs
  // 3. Retourner templates correspondants
}
```

---

### 🎮 ÉTAPE 2.5 - Créer/Modifier CombatUseCase
- [x] Créer ou modifier `src/application/usecases/CombatUseCase.ts`
- [x] Implémenter `initializeCombat()` avec pattern 3 lignes
- [x] Créer helper `gatherCombatData()` pour collection données
- [x] Injection des repositories via constructeur

**Pattern 3 lignes strict :**
```typescript
async initializeCombat(sceneId: string): Promise<CombatEngine> {
  const data = await this.gatherCombatData(sceneId);        // Ligne 1
  const combat = CombatFactory.createFromSceneData(data);   // Ligne 2
  return combat;                                             // Ligne 3
}
```

---

### 🔌 ÉTAPE 2.6 - Mettre à jour DIContainer
- [x] Enregistrer `IEnemyRepository` → `EnemyRepository`
- [x] Enregistrer ou mettre à jour `CombatUseCase`
- [x] Injecter toutes les dépendances nécessaires
- [x] Vérifier l'ordre d'enregistrement des dépendances

---

### 🧹 ÉTAPE 2.7 - Nettoyer CombatScenePhoenix
- [x] Supprimer tous les imports Domain
- [x] Supprimer `createTestEntities()`
- [x] Supprimer la prop `onCreateTestEntities` de CombatPanelNew
- [x] S'assurer que le composant utilise uniquement le hook `useCombat`

**Avant :**
```typescript
import { CombatEntity } from '../../domain/entities/CombatEngine';
const createTestEntities = () => { /* ... */ };
```

**Après :**
```typescript
// Aucun import Domain
const combat = useCombat(); // Le hook fait tout
```

---

## 📊 RÉSULTAT ATTENDU

### Flux de données
```
Scene → Repository → UseCase → Factory (Domain) → CombatEngine
                         ↓
                    Hook → Component
```

### Vérifications finales
- [x] Combat affiche les vrais HP du Character
- [x] Ennemis créés depuis la scène (2 gobelins avec IDs uniques)
- [x] Positions correctes depuis scene.content
- [x] Aucune violation architecturale
- [x] Tests : `npx tsc --noEmit` passe

---

## 🚨 POINTS D'ATTENTION

1. **NE PAS** mettre de logique dans Application Layer
2. **NE PAS** importer Domain dans Presentation
3. **TOUJOURS** utiliser le pattern immutable
4. **VÉRIFIER** que les Stats sont utilisés partout (pas AbilityScores)

---

## 📝 NOTES DE PROGRESSION

_Cette section sera mise à jour au fur et à mesure de l'implémentation_

- [x] Étape 2.1 commencée : ✅ TERMINÉE
  - Créé `CombatConfiguration.ts` avec tous les types nécessaires
  - Ajouté types supplémentaires : `TerrainCell`, `EnemySpawnSpec`, `CombatObjectives`, `CombatRewards`
  - Exporté dans `domain/types/index.ts`
- [x] Étape 2.2 commencée : ✅ TERMINÉE
  - Créé `CombatFactory.ts` avec méthode `createFromSceneData()`
  - Implémenté helpers : `createPlayerEntity()`, `createEnemiesFromConfig()`, `prepareEnemyPositions()`, `createEnemyInstances()`
  - Gestion des IDs uniques pour ennemis multiples (goblin_1, goblin_2, etc.)
  - Support pour noms custom et levels modifiés
  - Exporté dans `domain/factories/index.ts`
- [x] Étape 2.3 commencée : ✅ TERMINÉE
  - Modifié `enemies.ts` pour utiliser `DomainEnemyTemplate`
  - Transformé ENEMY_TEMPLATES en dictionnaire (Record<string, DomainEnemyTemplate>)
  - Ajouté propriétés manquantes : challengeRating, proficiencyBonus
  - Conservé les templates existants : goblin, goblin_scout, orc_warrior, skeleton_archer
  - Compatible avec le Domain tout en gardant les métadonnées infrastructure
- [x] Étape 2.4 commencée : ✅ TERMINÉE
  - Créé `EnemyRepository.ts` qui implémente `IEnemyRepository`
  - `getTemplatesForScene()` : Lit SCENES_DATA, extrait templateIds, retourne templates
  - `getEnemiesByScene()` : Crée instances Enemy avec positions et IDs uniques
  - Support pour sauvegarde état (localStorage) avec `saveEnemyState()`
  - Helper `preparePositions()` pour gérer positions multiples
  - Méthode `clearAllStates()` pour reset combat
- [x] Étape 2.5 commencée : ✅ TERMINÉE
  - Modifié `CombatGameUseCase.ts` existant avec nouvelles dépendances
  - Ajouté méthode `initializeCombat(sceneId)` avec pattern 3 lignes strict
  - Helper `gatherCombatData()` collecte Character, EnemyTemplates, SceneConfig
  - Injection repositories via constructeur : CharacterRepository, EnemyRepository, SceneRepository
  - Logs détaillés pour debug et monitoring
- [x] Étape 2.6 commencée : ✅ TERMINÉE
  - Ajouté import `EnemyRepository` dans DIContainer
  - Créé instance `enemyRepository` et enregistré dans le container
  - Mis à jour constructeur `CombatGameUseCase` avec toutes les dépendances
  - Créé `combatDependencies` inline pour éviter problème d'ordre
  - Ajouté `EnemyRepository` dans les TOKENS
- [x] Étape 2.7 commencée : ✅ TERMINÉE
  - Supprimé tous les imports Domain (CombatEntity, DIContainer direct)
  - Supprimé fonction `createTestEntities()` qui violait l'architecture
  - Ajouté méthode `initializeCombatFromScene` au hook useCombatGame
  - Auto-initialisation combat forest_ambush dans CombatScenePhoenix
  - Composant maintenant 100% compatible avec ARCHITECTURE_GUIDELINES.md

---

## ✅ VALIDATION FINALE

- [x] Architecture hexagonale respectée
- [x] Pattern 3 lignes dans UseCase
- [x] Aucune logique métier dans Application
- [x] Presentation ignorante (via hooks uniquement)
- [x] Combat fonctionne avec vraies données