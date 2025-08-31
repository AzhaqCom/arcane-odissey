/**
 * DOMAIN ENTITIES - Index exports
 * Point d'entrée centralisé pour toutes les entités du domain
 */

export { Scene } from './Scene';
export type { SceneType, SceneMetadata, SceneChoice, SceneCondition, SceneEffect, ValidationResult } from './Scene';

export { GameSession } from './GameSession';
export type { GamePhase, Difficulty, GameTime, GameFlags, GameMetrics, SaveMetadata } from './GameSession';

export { Character } from './Character';

export { Combat } from './Combat';
export { EffectsManager } from './Effects';
export { Spell, SpellSlots } from './Spell';
export { Time } from './Time';

export { NarrativeMessage } from './NarrativeMessage';
export type { MessageType, MessagePriority } from './NarrativeMessage';