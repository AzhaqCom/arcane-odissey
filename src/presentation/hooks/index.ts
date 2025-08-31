/**
 * PRESENTATION HOOKS - Exports
 * Tous les hooks personnalisés
 */

export { useCombat } from './useCombat';
export { useRepositories, useWeaponRepository, useSpellRepository, useCharacterRepository, useGameData } from './useRepositories';

// Types
export type { CombatPhase, PlayerAction, CombatState, UseCombatResult } from './useCombat';