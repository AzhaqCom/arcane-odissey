/**
 * PRESENTATION LAYER - Exports
 * ✅ ARCHITECTURE_GUIDELINES.md - Règle #3 : Point d'entrée Presentation isolé
 */

// ✅ TYPES ET ADAPTERS (nouvelles couches d'abstraction)
export type {
  CombatEntityView,
  CombatStateView,  
  CombatActionView,
  GameLogMessageView,
  CombatUIState
} from './types';

export { CombatViewAdapter } from './adapters';

// Hooks
export { useCombatGame } from './hooks/useCombatGame';
export { useRepositories } from './hooks/useRepositories';

// Components
export { GameApp } from './components/GameApp';
export { GameLog } from './components/GameLog';
export { GameUI } from './components/GameUI';
export { SceneRenderer } from './components/SceneRenderer';

// ✅ COMPOSANTS PHOENIX (système moderne)
export { CombatScenePhoenix } from './components/CombatScenePhoenix';
export { CombatPanelNew } from './components/CombatPanelNew';
export { CombatGridNew } from './components/CombatGridNew';