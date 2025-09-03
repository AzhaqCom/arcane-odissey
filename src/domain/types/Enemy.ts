/**
 * DOMAIN TYPES - Enemy
 * Types purs pour les ennemis, sans dépendance externe
 */
import type { Position, AbilityScores } from './core';

export interface DomainEnemyDataSource {
  readonly id: string;
  readonly name: string;
  readonly type: 'enemy';
  readonly templateId: string;
  readonly savedState: {
    readonly currentHp: number;
    readonly position?: Position;
  };
  readonly lootOverride?: ReadonlyArray<{
    readonly itemId: string;
    readonly dropChance: number;
  }>;
}

export interface DomainEnemyTemplate {
  readonly id: string;
  readonly name: string;
  readonly level: number;
  readonly baseAbilities: AbilityScores;
  readonly maxHp: number;
  readonly armorClass: number;
  readonly speed: number;
  readonly challengeRating?: number;
  readonly proficiencyBonus?: number;
  readonly resistances?: readonly string[];
  readonly vulnerabilities?: readonly string[];
  readonly immunities?: readonly string[];
  readonly equipment: {
    readonly weapons: readonly string[];
    readonly armor?: readonly string[];
    readonly items?: readonly string[];
  };
  readonly specialAbilities?: readonly string[];
  readonly combatModifiers?: {
    readonly attackBonus?: number;
    readonly damageBonus?: number;
    readonly resistances?: readonly string[];
    readonly vulnerabilities?: readonly string[];
  };
  readonly aiProfile?: {
    readonly behavior: 'aggressive' | 'defensive' | 'tactical' | 'cowardly';
    readonly preferredRange: 'melee' | 'ranged' | 'mixed';
    readonly aggroRadius?: number;
  };
  readonly lootTable?: ReadonlyArray<{
    readonly itemId: string;
    readonly dropChance: number;
  }>;
}