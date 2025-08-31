/**
 * DOMAIN TYPES - Combat
 * Types purs pour le système de combat
 */

/**
 * Position sur la grille tactique
 */
export interface Position {
  readonly x: number;
  readonly y: number;
}

/**
 * Phases du combat dans le domaine
 */
export type CombatPhase = 'setup' | 'combat' | 'victory' | 'defeat';

/**
 * Types d'actions possibles
 */
export type ActionType = 'action' | 'bonus_action' | 'reaction' | 'movement' | 'free';

/**
 * Statistiques de combat d'une entité
 */
export interface CombatStats {
  readonly maxHP: number;
  readonly baseAC: number;
  readonly baseSpeed: number;
  readonly level: number;
  readonly proficiencyBonus: number;
}

/**
 * Actions restantes pour un tour
 */
export interface ActionsRemaining {
  movement: number;
  action: boolean;
  bonusAction: boolean;
  reaction: boolean;
}

/**
 * Phases du combat avec granularité du domaine
 */
export type DomainCombatPhase = 'setup' | 'combat' | 'victory' | 'defeat';