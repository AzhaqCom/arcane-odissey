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
  CombatDependencies,
  NarrativeMessage 
} from '../../domain/entities/CombatEngine';
import type { CombatGameUseCase } from '../../application/usecases/CombatGameUseCase';
import type { NarrativeMessageView, MessageTypeView } from '../types/NarrativeTypes';
import { DIContainer } from '../../infrastructure/container/DIContainer';

/**
 * ✅ FONCTIONNALITÉ 3 - Mapper Domain → View
 * Convertit NarrativeMessage (Domain) vers NarrativeMessageView (Presentation)
 * Respecte l'isolation des couches architecturales
 */
function mapNarrativeToView(narrative: NarrativeMessage): NarrativeMessageView {
  // Mapper le contenu selon le format log.md
  let content: string;
  
  switch (narrative.type) {
    case 'movement':
      content = `${narrative.actors[0]} ${narrative.action}`;
      break;
    case 'attack_success':
      content = `${narrative.action} - ${narrative.result}`;
      break;
    case 'attack_miss':
      content = `${narrative.action} - ${narrative.result}`;
      break;
    case 'critical_hit':
      content = `${narrative.action} - ${narrative.result}`;
      break;
    case 'turn_start':
      content = `${narrative.actors[0]} ${narrative.action}`;
      break;
    default:
      content = `${narrative.action} - ${narrative.result}`;
  }

  return {
    id: narrative.id,
    content,
    type: narrative.type as MessageTypeView,
    timestamp: narrative.timestamp
  };
}

// ✅ FONCTIONNALITÉ 1.1 - Micro-états UI pour actions joueur
export type PlayerActionState = 
  | 'IDLE' 
  | 'AWAITING_MOVEMENT_CONFIRMATION' 
  | 'AWAITING_ATTACK_TARGET' 
  | 'AWAITING_SPELL_TARGET';

export interface PlayerActionContext {
  state: PlayerActionState;
  selectedWeapon?: string;
  selectedSpell?: string;
  pendingAction?: CombatAction;
  reachableCells?: { x: number; y: number }[];
  validTargets?: string[];
}

export interface UseCombatGameResult {
  // État actuel
  combatState: CombatState | null;
  isActive: boolean;
  isEnded: boolean;
  isPlayerTurn: boolean;
  isAITurn: boolean;
  
  // Actions du joueur
  startCombat: (entities: CombatEntity[], dependencies: CombatDependencies) => void;
  initializeCombatFromScene: (sceneId: string) => Promise<void>;
  executePlayerAction: (action: CombatAction) => void;
  executeAttack: (targetId: string) => void;
  executeMove: (position: { x: number; y: number }) => void;
  endTurn: () => void;
  
  // Informations utiles
  availableActions: string[];
  validTargets: CombatEntity[];
  currentEntity: CombatEntity | null;
  
  // ✅ FONCTIONNALITÉ 1.1 - État action joueur
  playerActionContext: PlayerActionContext;
  
  // ✅ FONCTIONNALITÉ 1.1 - Méthodes action joueur
  selectMoveAction: () => void;
  selectAttackAction: (weaponId?: string) => void;
  selectSpellAction: (spellId: string) => void;
  cancelCurrentAction: () => void;
  confirmAction: (targetOrPosition?: { x: number; y: number } | string) => void;
  
  // ✅ FONCTIONNALITÉ 3 - Journal narratif
  narratives: NarrativeMessageView[];
}

/**
 * HOOK REACT IMMUTABLE
 * ✅ Aucune logique métier (délégation totale au UseCase)
 * ✅ State React avec instances immutables
 * ✅ Callbacks qui créent nouvelles instances
 * ✅ Automatisation des tours AI
 */
export function useCombatGame(): UseCombatGameResult {
  // ✅ ÉTAPE 2.7 - Hook récupère le UseCase lui-même
  const combatGameUseCase = DIContainer.getInstance().get<CombatGameUseCase>('CombatGameUseCase');
  // État React immutable
  const [combatEngine, setCombatEngine] = useState<CombatEngine | null>(null);
  
  // ✅ FONCTIONNALITÉ 1.1 - État action joueur
  const [playerActionContext, setPlayerActionContext] = useState<PlayerActionContext>({
    state: 'IDLE'
  });

  // Démarrer un nouveau combat (méthode legacy)
  const startCombat = useCallback((
    entities: CombatEntity[], 
    dependencies: CombatDependencies
  ) => {
    const newCombat = combatGameUseCase.startCombat(entities, dependencies);
    setCombatEngine(newCombat); // ✅ Nouvelle instance
  }, [combatGameUseCase]);

  // ✅ ÉTAPE 2.7 - Initialiser combat depuis une scène (NOUVELLE MÉTHODE)
  const initializeCombatFromScene = useCallback(async (sceneId: string) => {
    try {
      const newCombat = await combatGameUseCase.initializeCombat(sceneId);
      setCombatEngine(newCombat); // ✅ Nouvelle instance
    } catch (error) {
      console.error('Failed to initialize combat from scene:', error);
    }
  }, [combatGameUseCase]);

  // Exécuter une action du joueur
  const executePlayerAction = useCallback(async (action: CombatAction) => {
    if (!combatEngine) return;

    try {
      const newCombat = await combatGameUseCase.processPlayerAction(combatEngine, action);
      setCombatEngine(newCombat); // ✅ Nouvelle instance
    } catch (error) {
      console.error('Failed to execute player action:', error);
    }
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

    // Vérifier si le mouvement est valide (distance et mouvement restant)
    const distance = Math.abs(position.x - currentEntity.position.x) + 
                    Math.abs(position.y - currentEntity.position.y);
    const movementCost = distance * 5; // 5 pieds par case
    
    if (movementCost > currentEntity.actionsRemaining.movement) {
      console.log(`Mouvement impossible: coût ${movementCost}, restant ${currentEntity.actionsRemaining.movement}`);
      return; // Empêcher le mouvement
    }

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

  // Calculs dérivés (getters purs) - DÉPLACÉS ICI pour éviter les erreurs de référence
  const combatState = combatEngine ? combatGameUseCase.getCombatState(combatEngine) : null;
  const isActive = combatEngine !== null && !combatGameUseCase.isCombatEnded(combatEngine);
  const isEnded = combatEngine !== null && combatGameUseCase.isCombatEnded(combatEngine);
  const currentEntity = combatEngine ? combatEngine.getCurrentEntity() : null;
  const isPlayerTurn = currentEntity !== null && currentEntity.type === 'player';
  const isAITurn = combatEngine ? combatGameUseCase.isAITurn(combatEngine) : false;
  
  const availableActions = combatEngine ? combatGameUseCase.getAvailableActions(combatEngine) : [];
  const validTargets = combatEngine ? combatGameUseCase.getValidTargets(combatEngine) : [];
  
  // ✅ FONCTIONNALITÉ 3 - Mapper narratifs Domain → View
  const narratives: NarrativeMessageView[] = combatState?.narratives.map(mapNarrativeToView) || [];

  // ✅ FONCTIONNALITÉ 1.1 - Méthodes de gestion d'état action
  const selectMoveAction = useCallback(() => {
    if (!combatEngine || !isPlayerTurn) return;
    
    // Calculer les cellules atteignables via UseCase
    const reachableCells = combatGameUseCase.getReachableCells(combatEngine);
    
    setPlayerActionContext({
      state: 'AWAITING_MOVEMENT_CONFIRMATION',
      reachableCells
    });
  }, [combatEngine, isPlayerTurn, combatGameUseCase]);

  const selectAttackAction = useCallback((weaponId?: string) => {
    if (!combatEngine || !isPlayerTurn) return;
    
    const validTargets = combatGameUseCase.getValidTargets(combatEngine);
    
    setPlayerActionContext({
      state: 'AWAITING_ATTACK_TARGET',
      selectedWeapon: weaponId,
      validTargets: validTargets.map(t => t.id)
    });
  }, [combatEngine, isPlayerTurn, combatGameUseCase]);

  const selectSpellAction = useCallback((spellId: string) => {
    if (!combatEngine || !isPlayerTurn) return;
    
    // TODO: Logique sorts - pour l'instant même que attaque
    const validTargets = combatGameUseCase.getValidTargets(combatEngine);
    
    setPlayerActionContext({
      state: 'AWAITING_SPELL_TARGET',
      selectedSpell: spellId,
      validTargets: validTargets.map(t => t.id)
    });
  }, [combatEngine, isPlayerTurn, combatGameUseCase]);

  const cancelCurrentAction = useCallback(() => {
    setPlayerActionContext({ state: 'IDLE' });
  }, []);

  const confirmAction = useCallback((targetOrPosition?: { x: number; y: number } | string) => {
    if (!combatEngine || playerActionContext.state === 'IDLE') return;

    try {
      if (playerActionContext.state === 'AWAITING_MOVEMENT_CONFIRMATION' && targetOrPosition && typeof targetOrPosition === 'object') {
        executeMove(targetOrPosition);
      } else if (playerActionContext.state === 'AWAITING_ATTACK_TARGET' && targetOrPosition && typeof targetOrPosition === 'string') {
        executeAttack(targetOrPosition);
      }
      // TODO: Gestion sorts
      
      // Reset état après action
      setPlayerActionContext({ state: 'IDLE' });
    } catch (error) {
      console.error('Erreur confirmation action:', error);
      setPlayerActionContext({ state: 'IDLE' });
    }
  }, [combatEngine, playerActionContext, executeMove, executeAttack]);

  // Automatisation des tours AI avec useEffect
  useEffect(() => {
    if (!combatEngine) return;

    // Si c'est le tour d'une AI, l'exécuter automatiquement après un délai
    if (combatGameUseCase.isAITurn(combatEngine) && !combatGameUseCase.isCombatEnded(combatEngine)) {
      const aiTimeout = setTimeout(async () => {
        try {
          const newCombat = await combatGameUseCase.processAITurn(combatEngine);
          setCombatEngine(newCombat); // ✅ Nouvelle instance
        } catch (error) {
          console.error('Failed to process AI turn:', error);
        }
      }, 1500); // Délai de 1.5s pour voir l'action AI

      return () => clearTimeout(aiTimeout);
    }
  }, [combatEngine, combatGameUseCase]);

  return {
    // État
    combatState,
    isActive,
    isEnded,
    isPlayerTurn,
    isAITurn,
    
    // Actions
    startCombat,
    initializeCombatFromScene,
    executePlayerAction,
    executeAttack,
    executeMove,
    endTurn,
    
    // Informations
    availableActions,
    validTargets,
    currentEntity,
    
    // ✅ FONCTIONNALITÉ 1.1 - État et actions joueur
    playerActionContext,
    selectMoveAction,
    selectAttackAction,
    selectSpellAction,
    cancelCurrentAction,
    confirmAction,
    
    // ✅ FONCTIONNALITÉ 3 - Journal narratif
    narratives
  };
}