/**
 * APPLICATION LAYER - Exports
 * Point d'entrée pour tous les use cases
 */

export { CombatGameUseCase } from './usecases/CombatGameUseCase';
export { GameUseCase } from './usecases/GameUseCase';
export { SceneUseCase } from './usecases/SceneUseCase';

// Re-export des types utiles
// export type { AITurnResult } from './usecases/CombatUseCase'; // Supprimé après refactoring
export type { GameStateSnapshot, GameAction, RestRequest, RestResult, GameInitializationRequest } from './usecases/GameUseCase';
export type { SceneTransitionRequest, SceneTransitionResult, ContextualSpellSuggestion, SceneAnalysis } from './usecases/SceneUseCase';