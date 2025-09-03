/**
 * DOMAIN TYPES - Combat Configuration
 * Types purs pour la configuration et l'initialisation du combat
 * Respecte ARCHITECTURE_GUIDELINES.md - Règle #1 Domain-First
 */

import type { Position } from './core';
import type { Character } from '../entities/Character';
import type { DomainEnemyTemplate } from './Enemy';

/**
 * Configuration d'une cellule de terrain
 */
export interface TerrainCell {
  readonly position: Position;
  readonly type: 'normal' | 'difficult' | 'wall';
  readonly cover?: 'half' | 'three_quarters' | 'full';
  readonly description?: string;
  readonly movementCost: number;
}

/**
 * Spécification d'un ennemi à créer pour le combat
 */
export interface EnemySpawnSpec {
  readonly templateId: string;
  readonly count: number;
  readonly position: Position;
  readonly alternativePositions?: ReadonlyArray<Position>;
  readonly customName?: string;
  readonly level?: number;
}

/**
 * Configuration complète d'une scène de combat
 * Extrait depuis les données de scène
 */
export interface CombatSceneConfig {
  readonly gridSize: { 
    readonly width: number; 
    readonly height: number; 
  };
  readonly playerStartPosition: Position;
  readonly enemySpecs: ReadonlyArray<EnemySpawnSpec>;
  readonly terrain?: ReadonlyArray<TerrainCell>;
  readonly initiativeBonus?: number;
  readonly surpriseRound?: boolean;
  readonly environment?: string;
}

/**
 * Données nécessaires pour initialiser un combat
 * Rassemblées par l'Application Layer
 */
export interface CombatInitializationData {
  readonly character: Character;
  readonly enemyTemplates: ReadonlyArray<DomainEnemyTemplate>;
  readonly sceneConfig: CombatSceneConfig;
}

/**
 * Conditions de victoire/défaite pour un combat
 */
export interface CombatObjectives {
  readonly victory: 'defeat_all_enemies' | 'survive_rounds' | 'protect_target' | 'reach_position';
  readonly defeat: 'player_death' | 'ally_death' | 'time_limit' | 'target_destroyed';
  readonly special?: ReadonlyArray<{
    readonly id: string;
    readonly description: string;
    readonly condition: string;
  }>;
}

/**
 * Récompenses de combat
 */
export interface CombatRewards {
  readonly xp: number;
  readonly gold?: number;
  readonly items?: ReadonlyArray<string>;
  readonly reputation?: {
    readonly faction: string;
    readonly points: number;
  };
}