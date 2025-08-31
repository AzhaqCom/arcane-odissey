/**
 * DOMAIN REPOSITORIES - Index exports
 * Point d'entrée centralisé pour toutes les interfaces de repositories
 */

export type { ISceneRepository } from './ISceneRepository';
export type { IGameSessionRepository } from './IGameSessionRepository';
export type { ICharacterRepository } from './ICharacterRepository';
export type { ICombatRepository } from './ICombatRepository';
export type { IEffectsRepository } from './IEffectsRepository';

// Re-export types from entities that are used by repositories
export type { SaveMetadata } from '../entities';