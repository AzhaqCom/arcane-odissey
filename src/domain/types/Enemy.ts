/**
 * DOMAIN TYPES - Enemy
 * Types purs pour les ennemis, sans dépendance externe
 */
import type { Position, Stats } from './core';
import type { AIProfile } from './AIProfile';

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
  readonly baseAbilities: Stats;
  readonly maxHp: number;
  readonly armorClass: number;
  readonly speed: number;
  readonly challengeRating?: number;
  readonly xpReward?: number;
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
  /**
   * Profil d'IA enrichi - système unifié
   */
  readonly aiProfile: AIProfile;
  readonly lootTable?: ReadonlyArray<{
    readonly itemId: string;
    readonly dropChance: number;
  }>;
}