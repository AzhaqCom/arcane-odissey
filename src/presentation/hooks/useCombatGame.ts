/**
 * PRESENTATION HOOK - useCombatGame
 * Hook React pour gestion d'état immutable du combat
 * Respecte ARCHITECTURE_GUIDELINES.md - Règle #4 Présentation Stupide
 */

import { useState, useCallback, useEffect } from 'react';
import type { 
  CombatEngine, 
  CombatEntity, 
  CombatAction, 
  CombatState,
  CombatDependencies 
} from '../../domain/entities/CombatEngine';
import type { CombatGameUseCase } from '../../application/usecases/CombatGameUseCase';

export interface UseCombatGameResult {
  // État actuel
  combatState: CombatState | null;
  isActive: boolean;
  isEnded: boolean;
  isPlayerTurn: boolean;
  isAITurn: boolean;
  
  // Actions du joueur
  startCombat: (entities: CombatEntity[], dependencies: CombatDependencies) => void;
  executePlayerAction: (action: CombatAction) => void;
  executeAttack: (targetId: string) => void;
  executeMove: (position: { x: number; y: number }) => void;
  endTurn: () => void;
  
  // Informations utiles
  availableActions: string[];
  validTargets: CombatEntity[];
  currentEntity: CombatEntity | null;
}

/**
 * HOOK REACT IMMUTABLE
 * ✅ Aucune logique métier (délégation totale au UseCase)
 * ✅ State React avec instances immutables
 * ✅ Callbacks qui créent nouvelles instances
 * ✅ Automatisation des tours AI
 */
export function useCombatGame(
  combatGameUseCase: CombatGameUseCase
): UseCombatGameResult {
  // État React immutable
  const [combatEngine, setCombatEngine] = useState<CombatEngine | null>(null);

  // Démarrer un nouveau combat
  const startCombat = useCallback((
    entities: CombatEntity[], 
    dependencies: CombatDependencies
  ) => {
    const newCombat = combatGameUseCase.startCombat(entities, dependencies);
    setCombatEngine(newCombat); // ✅ Nouvelle instance
  }, [combatGameUseCase]);

  // Exécuter une action du joueur
  const executePlayerAction = useCallback((action: CombatAction) => {
    if (!combatEngine) return;

    const newCombat = combatGameUseCase.processPlayerAction(combatEngine, action);
    setCombatEngine(newCombat); // ✅ Nouvelle instance
  }, [combatEngine, combatGameUseCase]);

  // Raccourcis pour actions courantes
  const executeAttack = useCallback((targetId: string) => {
    if (!combatEngine) return;

    const currentEntity = combatEngine.getCurrentEntity();
    if (!currentEntity) return;

    const attackAction = combatGameUseCase.createAttackAction(currentEntity.id, targetId);
    executePlayerAction(attackAction);
  }, [combatEngine, combatGameUseCase, executePlayerAction]);

  const executeMove = useCallback((position: { x: number; y: number }) => {
    if (!combatEngine) return;

    const currentEntity = combatEngine.getCurrentEntity();
    if (!currentEntity) return;

    const moveAction = combatGameUseCase.createMoveAction(currentEntity.id, position);
    executePlayerAction(moveAction);
  }, [combatEngine, combatGameUseCase, executePlayerAction]);

  const endTurn = useCallback(() => {
    if (!combatEngine) return;

    const currentEntity = combatEngine.getCurrentEntity();
    if (!currentEntity) return;

    const endTurnAction = combatGameUseCase.createEndTurnAction(currentEntity.id);
    executePlayerAction(endTurnAction);
  }, [combatEngine, combatGameUseCase, executePlayerAction]);

  // Automatisation des tours AI avec useEffect
  useEffect(() => {
    if (!combatEngine) return;

    // Si c'est le tour d'une AI, l'exécuter automatiquement après un délai
    if (combatGameUseCase.isAITurn(combatEngine) && !combatGameUseCase.isCombatEnded(combatEngine)) {
      const aiTimeout = setTimeout(() => {
        const newCombat = combatGameUseCase.processAITurn(combatEngine);
        setCombatEngine(newCombat); // ✅ Nouvelle instance
      }, 1500); // Délai de 1.5s pour voir l'action AI

      return () => clearTimeout(aiTimeout);
    }
  }, [combatEngine, combatGameUseCase]);

  // Calculs dérivés (getters purs)
  const combatState = combatEngine ? combatGameUseCase.getCombatState(combatEngine) : null;
  const isActive = combatEngine !== null && !combatGameUseCase.isCombatEnded(combatEngine);
  const isEnded = combatEngine !== null && combatGameUseCase.isCombatEnded(combatEngine);
  const currentEntity = combatEngine ? combatEngine.getCurrentEntity() : null;
  const isPlayerTurn = currentEntity !== null && currentEntity.type === 'player';
  const isAITurn = combatEngine ? combatGameUseCase.isAITurn(combatEngine) : false;
  
  const availableActions = combatEngine ? combatGameUseCase.getAvailableActions(combatEngine) : [];
  const validTargets = combatEngine ? combatGameUseCase.getValidTargets(combatEngine) : [];

  return {
    // État
    combatState,
    isActive,
    isEnded,
    isPlayerTurn,
    isAITurn,
    
    // Actions
    startCombat,
    executePlayerAction,
    executeAttack,
    executeMove,
    endTurn,
    
    // Informations
    availableActions,
    validTargets,
    currentEntity
  };
}