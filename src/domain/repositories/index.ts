/**
 * DOMAIN REPOSITORIES - Index exports
 * Point d'entrée centralisé pour toutes les interfaces de repositories
 */

export type { ISceneRepository } from './ISceneRepository';
export type { IGameSessionRepository } from './IGameSessionRepository';
export type { ICharacterRepository } from './ICharacterRepository';
export type { IEnemyRepository } from './IEnemyRepository';
// export type { ICombatRepository } from './ICombatRepository'; // Supprimé avec l'ancien système
// export type { IEffectsRepository } from './IEffectsRepository'; // Supprimé avec l'ancien système
export type { IWeaponRepository } from './IWeaponRepository';

// Re-export types from entities that are used by repositories
export type { SaveMetadata } from '../entities';