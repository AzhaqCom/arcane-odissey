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
import { CombatFactory } from '../../domain/factories/CombatFactory';
import type { CombatInitializationData, CombatSceneConfig } from '../../domain/types/CombatConfiguration';
import type { ICharacterRepository } from '../../domain/repositories/ICharacterRepository';
import type { IEnemyRepository } from '../../domain/repositories/IEnemyRepository';
import type { ISceneRepository } from '../../domain/repositories/ISceneRepository';
import type { IGameSessionRepository } from '../../domain/repositories/IGameSessionRepository';

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
  private characterRepository: ICharacterRepository;
  private enemyRepository: IEnemyRepository;
  private sceneRepository: ISceneRepository;
  private gameSessionRepository: IGameSessionRepository;
  private combatDependencies: CombatDependencies;

  constructor(
    aiService: SimpleAIService, 
    logger: ILogger,
    characterRepository: ICharacterRepository,
    enemyRepository: IEnemyRepository,
    sceneRepository: ISceneRepository,
    gameSessionRepository: IGameSessionRepository,
    combatDependencies: CombatDependencies
  ) {
    this.aiService = aiService;
    this.logger = logger;
    this.characterRepository = characterRepository;
    this.enemyRepository = enemyRepository;
    this.sceneRepository = sceneRepository;
    this.gameSessionRepository = gameSessionRepository;
    this.combatDependencies = combatDependencies;
  }

  /**
   * ÉTAPE 2.5 - Initialiser un combat depuis une scène
   * Respecte ARCHITECTURE_GUIDELINES.md - Règle #2 Pattern 3 lignes
   * Orchestration stupide qui délègue tout au Domain
   */
  async initializeCombat(sceneId: string): Promise<CombatEngine> {
    // Ligne 1: Collecter les données
    const data = await this.gatherCombatData(sceneId);
    
    // Ligne 2: Déléguer création au Domain
    const combat = CombatFactory.createFromSceneData(data, this.combatDependencies);
    
    // Ligne 3: Retourner le résultat
    return combat;
  }

  /**
   * Démarrer un nouveau combat avec des entités (méthode legacy)
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
   * ✅ PATTERN SAUVEGARDE OBLIGATOIRE - Traiter une action du joueur
   * Applique l'action, sauvegarde, puis retourne le nouvel état
   */
  async processPlayerAction(combat: CombatEngine, action: CombatAction): Promise<CombatEngine> {
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

    // ✅ LIGNE 1: Appliquer action Domain
    let updatedCombat = combat.withAppliedAction(action);
    if (action.type === 'end_turn' || !currentEntity.actionsRemaining.action) {
      updatedCombat = updatedCombat.withAdvancedTurn();
    }

    // ✅ LIGNE 2: Sauvegarde obligatoire
    await this.saveCombatState(updatedCombat);
    
    // ✅ LIGNE 3: Retourner nouvel état
    return updatedCombat;
  }

  /**
   * ✅ PATTERN SAUVEGARDE OBLIGATOIRE - Traiter un tour d'AI
   * Calcule l'action AI, applique, sauvegarde, puis retourne le nouvel état
   */
  async processAITurn(combat: CombatEngine): Promise<CombatEngine> {
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

    // ✅ LIGNE 1: Appliquer action AI Domain
    let updatedCombat = combat.withAppliedAction(aiAction);
    updatedCombat = updatedCombat.withAdvancedTurn();

    // ✅ LIGNE 2: Sauvegarde obligatoire
    await this.saveCombatState(updatedCombat);

    // ✅ LIGNE 3: Retourner nouvel état
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

  /**
   * ✅ FONCTIONNALITÉ 1.1 - Obtenir les cellules atteignables
   * Délégation pure vers Domain pour calcul tactique
   */
  getReachableCells(combat: CombatEngine): { x: number; y: number }[] {
    const currentEntity = combat.getCurrentEntity();
    if (!currentEntity || currentEntity.type !== 'player') {
      return [];
    }

    // Délégation pure vers Domain - pas de logique métier ici
    return combat.calculateReachableCells(currentEntity.id);
  }

  /**
   * HELPER - Collecte des données pour initialisation combat
   * Simple collecte, AUCUNE logique métier
   * @private
   */
  private async gatherCombatData(sceneId: string): Promise<CombatInitializationData> {
    // Collecter toutes les données en parallèle
    const [scene, character, enemyTemplates] = await Promise.all([
      this.sceneRepository.getById(sceneId),
      this.characterRepository.getCurrentCharacter(),
      this.enemyRepository.getTemplatesForScene(sceneId)
    ]);

    if (!scene) {
      throw new Error(`Scene not found: ${sceneId}`);
    }

    if (!character) {
      throw new Error('No current character found');
    }

    if (scene.type !== 'combat') {
      throw new Error(`Scene ${sceneId} is not a combat scene`);
    }

    // Extraire la configuration de combat depuis la scène
    const sceneContent = scene.content as any;
    const sceneConfig: CombatSceneConfig = {
      gridSize: sceneContent.combat?.gridSize || { width: 12, height: 8 },
      playerStartPosition: sceneContent.combat?.playerStartPosition || { x: 2, y: 4 },
      enemySpecs: sceneContent.enemies?.map((enemy: any) => ({
        templateId: enemy.templateId,
        count: enemy.count || 1,
        position: enemy.position,
        alternativePositions: enemy.alternativePositions,
        customName: enemy.customName,
        level: enemy.level
      })) || [],
      terrain: sceneContent.terrain,
      initiativeBonus: sceneContent.combat?.initiativeBonus,
      surpriseRound: sceneContent.combat?.surpriseRound,
      environment: sceneContent.combat?.environment
    };

    this.logger.info('COMBAT_GAME_USECASE', 'Combat data gathered', {
      sceneId,
      playerName: character.name,
      playerHP: `${character.currentHP}/${character.maxHP}`,
      enemyTemplatesCount: enemyTemplates.length,
      enemySpecsCount: sceneConfig.enemySpecs.length,
      gridSize: sceneConfig.gridSize
    });

    return {
      character,
      enemyTemplates,
      sceneConfig
    };
  }

  /**
   * ✅ PATTERN SAUVEGARDE OBLIGATOIRE - Helper sauvegarde état combat
   * Respecte Règle #2 - Sauvegarde immédiate après modification
   * TODO: Intégrer avec GameSession complète quand prêt
   */
  private async saveCombatState(combat: CombatEngine): Promise<void> {
    try {
      // FIXME: Auto-save temporairement désactivé - problème avec GameSession mock
      // await this.gameSessionRepository.autoSave(mockSession);
      
      // Pour l'instant, juste logger l'état du combat
      this.logger.debug('COMBAT_GAME_USECASE', 'Combat state saved (logging only)', {
        round: combat.getState().round,
        currentTurn: combat.getState().currentTurnIndex,
        phase: combat.getState().phase,
        narrativesCount: combat.getState().narratives.length
      });
    } catch (error) {
      this.logger.error('COMBAT_GAME_USECASE', 'Failed to save combat state', { error });
      // Ne pas empêcher le combat de continuer si la sauvegarde échoue
    }
  }
}