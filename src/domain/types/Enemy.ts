/**
 * DOMAIN TYPES - Enemy
 * Types purs pour les ennemis, sans dépendance externe
 */
import type { Position, AbilityScores } from './Character';

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
  readonly actions: readonly string[];
  readonly lootTable?: ReadonlyArray<{
    readonly itemId: string;
    readonly dropChance: number;
  }>;
}