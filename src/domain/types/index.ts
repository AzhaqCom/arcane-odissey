/**
 * DOMAIN TYPES - Index
 * Exports centralisés des types du domaine
 */

// === TYPES CENTRALISÉS (source unique de vérité) ===
export type {
  Position,
  GridPosition,
  AbilityScores,
  DamageType,
  AttackType,
  WeaponCategory,
  ItemRarity,
  Range,
  Damage
} from './core';

// === TYPES SPÉCIALISÉS ===
// Character types
export type {
  InventorySpec,
  CharacterCreationProps,
  ClassSpec,
  EnemySpec
} from './Character';

// Combat types
export type {
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