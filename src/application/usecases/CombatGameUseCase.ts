/**
 * APPLICATION USECASE - CombatGameUseCase
 * Orchestration des opérations de combat
 * Respecte ARCHITECTURE_GUIDELINES.md - Règle #3 Couche Application Fine
 */

import { CombatEngine } from '../../domain/entities/CombatEngine';
import type { 
  CombatEntity, 
  CombatAction, 
  CombatState, 
  CombatDependencies 
} from '../../domain/entities/CombatEngine';
import type { SimpleAIService } from '../../domain/services/SimpleAIService';
import type { ILogger } from '../../domain/services/ILogger';

/**
 * USE CASE DE COMBAT
 * ✅ Orchestration pure sans logique métier
 * ✅ Délégation aux services du domain
 * ✅ Retourne toujours nouvelles instances (immutabilité)
 * ✅ Couche fine entre domain et présentation
 */
export class CombatGameUseCase {
  private aiService: SimpleAIService;
  private logger: ILogger;

  constructor(aiService: SimpleAIService, logger: ILogger) {
    this.aiService = aiService;
    this.logger = logger;
  }

  /**
   * Démarrer un nouveau combat avec des entités
   * Retourne CombatEngine initialisé et prêt
   */
  startCombat(
    entities: CombatEntity[], 
    dependencies: CombatDependencies
  ): CombatEngine {
    this.logger.info('COMBAT_GAME_USECASE', 'Starting new combat', {
      entitiesCount: entities.length,
      playerCount: entities.filter(e => e.type === 'player').length,
      enemyCount: entities.filter(e => e.type === 'enemy').length
    });

    // Créer le moteur de combat
    let combat = CombatEngine.create(dependencies);

    // Ajouter toutes les entités
    entities.forEach(entity => {
      combat = combat.withAddedEntity(entity);
    });

    // Rouler l'initiative et commencer
    const startedCombat = combat.withRolledInitiative();

    this.logger.info('COMBAT_GAME_USECASE', 'Combat started successfully', {
      initiativeOrder: startedCombat.getState().entities.map(e => ({
        name: e.name,
        initiative: e.initiative,
        type: e.type
      }))
    });

    return startedCombat;
  }

  /**
   * Traiter une action du joueur
   * Applique l'action et avance le tour si nécessaire
   */
  processPlayerAction(combat: CombatEngine, action: CombatAction): CombatEngine {
    const currentEntity = combat.getCurrentEntity();
    
    if (!currentEntity) {
      this.logger.error('COMBAT_GAME_USECASE', 'No current entity for player action', {
        actionType: action.type,
        actionEntityId: action.entityId
      });
      return combat;
    }

    if (currentEntity.type !== 'player') {
      this.logger.error('COMBAT_GAME_USECASE', 'Player action on non-player turn', {
        currentEntityType: currentEntity.type,
        currentEntityName: currentEntity.name
      });
      return combat;
    }

    this.logger.debug('COMBAT_GAME_USECASE', 'Processing player action', {
      actionType: action.type,
      entityName: currentEntity.name,
      targetId: action.targetId
    });

    // Appliquer l'action
    let updatedCombat = combat.withAppliedAction(action);

    // Si c'est la fin du tour, avancer
    if (action.type === 'end_turn' || !currentEntity.actionsRemaining.action) {
      updatedCombat = updatedCombat.withAdvancedTurn();
      
      this.logger.debug('COMBAT_GAME_USECASE', 'Player turn ended, advancing', {
        newCurrentEntity: updatedCombat.getCurrentEntity()?.name
      });
    }

    return updatedCombat;
  }

  /**
   * Traiter un tour d'AI
   * Calcule l'action AI et l'applique automatiquement
   */
  processAITurn(combat: CombatEngine): CombatEngine {
    const currentEntity = combat.getCurrentEntity();
    
    if (!currentEntity) {
      this.logger.error('COMBAT_GAME_USECASE', 'No current entity for AI turn');
      return combat;
    }

    if (currentEntity.type === 'player') {
      this.logger.warn('COMBAT_GAME_USECASE', 'AI turn requested on player turn', {
        entityName: currentEntity.name
      });
      return combat; // Pas d'action, c'est au joueur
    }

    this.logger.debug('COMBAT_GAME_USECASE', 'Processing AI turn', {
      entityName: currentEntity.name,
      entityType: currentEntity.type,
      behavior: currentEntity.aiBehavior,
      hitPoints: `${currentEntity.hitPoints}/${currentEntity.maxHitPoints}`
    });

    // Calculer l'action AI (fonction pure)
    const aiAction = this.aiService.calculateAIAction(currentEntity, combat.getState());

    this.logger.info('COMBAT_GAME_USECASE', 'AI action calculated', {
      entityName: currentEntity.name,
      actionType: aiAction.type,
      targetId: aiAction.targetId,
      position: aiAction.position
    });

    // Appliquer l'action AI
    let updatedCombat = combat.withAppliedAction(aiAction);

    // Toujours avancer le tour après une action AI
    updatedCombat = updatedCombat.withAdvancedTurn();

    const nextEntity = updatedCombat.getCurrentEntity();
    this.logger.debug('COMBAT_GAME_USECASE', 'AI turn completed', {
      previousEntity: currentEntity.name,
      nextEntity: nextEntity?.name,
      nextEntityType: nextEntity?.type
    });

    return updatedCombat;
  }

  /**
   * Obtenir l'état actuel du combat
   * Méthode de commodité pour la présentation
   */
  getCombatState(combat: CombatEngine): CombatState {
    return combat.getState();
  }

  /**
   * Vérifier si c'est le tour d'une IA
   * Utilitaire pour déclencher automatiquement les tours AI
   */
  isAITurn(combat: CombatEngine): boolean {
    const currentEntity = combat.getCurrentEntity();
    return currentEntity !== null && currentEntity.type !== 'player';
  }

  /**
   * Vérifier si le combat est terminé
   * Utilitaire pour la gestion de fin de combat
   */
  isCombatEnded(combat: CombatEngine): boolean {
    return combat.isEnded();
  }

  /**
   * ✅ THIN APPLICATION LAYER - Délégation pure vers Domain
   * ✅ Respecte ARCHITECTURE_GUIDELINES.md Règle #2
   * Obtenir les actions disponibles pour l'entité courante
   */
  getAvailableActions(combat: CombatEngine): string[] {
    // Délégation pure vers Domain - pas de logique métier ici
    return combat.getAvailableActionsForCurrentEntity();
  }

  /**
   * Obtenir les cibles valides pour une attaque
   * Aide la présentation à proposer les bonnes cibles
   */
  getValidTargets(combat: CombatEngine): CombatEntity[] {
    const currentEntity = combat.getCurrentEntity();
    if (!currentEntity || currentEntity.type !== 'player') {
      return [];
    }

    return combat.getEnemiesOf(currentEntity.id);
  }

  /**
   * Créer une action d'attaque standardisée
   * Utilitaire pour la présentation
   */
  createAttackAction(entityId: string, targetId: string): CombatAction {
    return {
      type: 'attack',
      entityId,
      targetId
    };
  }

  /**
   * Créer une action de mouvement standardisée
   * Utilitaire pour la présentation
   */
  createMoveAction(entityId: string, position: { x: number; y: number }): CombatAction {
    return {
      type: 'move',
      entityId,
      position
    };
  }

  /**
   * Créer une action de fin de tour standardisée
   * Utilitaire pour la présentation
   */
  createEndTurnAction(entityId: string): CombatAction {
    return {
      type: 'end_turn',
      entityId
    };
  }
}