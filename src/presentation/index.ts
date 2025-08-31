/**
 * PRESENTATION LAYER - Exports
 * Point d'entrée pour tous les composants et hooks
 */

// Hooks
export { useCombat } from './hooks/useCombat';
export { useRepositories } from './hooks/useRepositories';

// Components
export { GameApp } from './components/GameApp';
export { CombatScene } from './components/CombatScene';
export { CombatPanel } from './components/CombatPanel';
export { CombatGrid } from './components/CombatGrid';
export { GameLog } from './components/GameLog';
export { GameUI } from './components/GameUI';

// Containers
export { CombatContainer } from './containers/CombatContainer';

// Types
export type { CombatPhase, PlayerAction, CombatState, UseCombatResult } from './hooks/useCombat';