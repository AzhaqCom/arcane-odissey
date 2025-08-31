/**
 * DOMAIN TYPES - Index
 * Exports centralisés des types du domaine
 */

// Character types
export type {
  AbilityScores,
  InventorySpec,
  Position as CharacterPosition,
  CharacterCreationProps,
  ClassSpec,
  EnemySpec
} from './Character';

// Combat types
export type {
  Position as CombatPosition,
  CombatPhase,
  ActionType,
  CombatStats,
  ActionsRemaining,
  DomainCombatPhase
} from './Combat';

// Enemy types
export type {
  DomainEnemyDataSource,
  DomainEnemyTemplate
} from './Enemy';

// Re-export Position sous un nom unifié
export type { Position } from './Combat';