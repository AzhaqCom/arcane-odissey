/**
 * DOMAIN TYPES - Index
 * Exports centralisés des types du domaine
 */

// === TYPES CENTRALISÉS (source unique de vérité) ===
export type {
  Position,
  GridPosition,
  Stats,
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

// Combat Configuration types
export type {
  TerrainCell,
  EnemySpawnSpec,
  CombatSceneConfig,
  CombatInitializationData,
  CombatObjectives,
  CombatRewards
} from './CombatConfiguration';

// AI Profile types (nouveau système d'IA)
export type {
  AIProfile,
  CombatRange
} from './AIProfile';

export {
  DEFAULT_AI_PROFILE,
  AIProfileFactory,
  distanceToCombatRange,
  getPreferredDistanceInSquares
} from './AIProfile';

// Combat Context types (analyse tactique)
export type {
  CombatContext,
  CombatTurnAction,
  ScoredTurnOption
} from './CombatContext';

export {
  calculateDistance,
  isAdjacent,
  getAdjacentPositions,
  calculateBattleIntensity
} from './CombatContext';