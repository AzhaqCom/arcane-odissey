/**
 * PRESENTATION HOOKS - Exports
 * Tous les hooks personnalisés
 */

// export { useCombat } from './useCombat'; // ✅ SUPPRIMÉ - Hook n'existe plus, utilisez useCombatGame
export { useCombatGame } from './useCombatGame'; // ✅ NOUVEAU HOOK
export { useRepositories, useWeaponRepository, useSpellRepository, useCharacterRepository, useGameData } from './useRepositories';
export { useUIState } from './useUIState';