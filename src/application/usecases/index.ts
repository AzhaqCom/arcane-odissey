/**
 * APPLICATION USE CASES - Exports
 * Tous les cas d'usage de l'application
 */

export { CombatUseCase } from './CombatUseCase';
export { GameUseCase } from './GameUseCase';
export { SceneUseCase } from './SceneUseCase';
export { GameSessionUseCase } from './GameSessionUseCase';

// Types
// export type { AITurnResult } from './CombatUseCase'; // Supprimé - plus nécessaire après refactoring
export type { 
  GameStateSnapshot, 
  GameAction, 
  RestRequest, 
  RestResult, 
  GameInitializationRequest 
} from './GameUseCase';
export type { 
  SceneTransitionRequest, 
  SceneTransitionResult, 
  ContextualSpellSuggestion, 
  SceneAnalysis 
} from './SceneUseCase';
export type { 
  GameSessionState 
} from './GameSessionUseCase';