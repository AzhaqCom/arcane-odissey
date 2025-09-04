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
import type { TacticalAIService } from '../../domain/services/TacticalAIService';
import type { ILogger } from '../../domain/services/ILogger';
import type { CombatTurnAction } from '../../domain/types/CombatContext';
import { CombatFactory } from '../../domain/factories/CombatFactory';
import type { CombatInitializationData, CombatSceneConfig } from '../../domain/types/CombatConfiguration';
import type { ICharacterRepository } from '../../domain/repositories/ICharacterRepository';
import type { IEnemyRepository } from '../../domain/repositories/IEnemyRepository';
import type { ISceneRepository } from '../../domain/repositories/ISceneRepository';
import type { IGameSessionRepository } from '../../domain/repositories/IGameSessionRepository';
import { CombatActionMapper } from '../mappers/CombatActionMapper';
import { PlayerWeaponService, type PlayerWeaponChoice } from '../../domain/services/PlayerWeaponService';
import type { SceneConditionService, SceneChoice } from '../../domain/services/SceneConditionService';

/**
 * USE CASE DE COMBAT
 * ✅ Orchestration pure sans logique métier
 * ✅ Délégation aux services du domain
 * ✅ Retourne toujours nouvelles instances (immutabilité)
 * ✅ Couche fine entre domain et présentation
 */
export class CombatGameUseCase {
  private tacticalAIService: TacticalAIService;
  private logger: ILogger;
  private characterRepository: ICharacterRepository;
  private enemyRepository: IEnemyRepository;
  private sceneRepository: ISceneRepository;
  private gameSessionRepository: IGameSessionRepository;
  private combatDependencies: CombatDependencies;
  private playerWeaponService: PlayerWeaponService;
  private sceneConditionService: SceneConditionService;

  constructor(
    tacticalAIService: TacticalAIService,
    logger: ILogger,
    characterRepository: ICharacterRepository,
    enemyRepository: IEnemyRepository,
    sceneRepository: ISceneRepository,
    gameSessionRepository: IGameSessionRepository,
    combatDependencies: CombatDependencies,
    playerWeaponService: PlayerWeaponService,
    sceneConditionService: SceneConditionService
  ) {
    this.tacticalAIService = tacticalAIService;
    this.logger = logger;
    this.characterRepository = characterRepository;
    this.enemyRepository = enemyRepository;
    this.sceneRepository = sceneRepository;
    this.gameSessionRepository = gameSessionRepository;
    this.combatDependencies = combatDependencies;
    this.playerWeaponService = playerWeaponService;
    this.sceneConditionService = sceneConditionService;
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
   * Orchestre le calcul et l'application d'action AI
   * Respecte ARCHITECTURE_GUIDELINES.md - Règle #2 Pattern 3 lignes
   */
  async processAITurn(combat: CombatEngine): Promise<CombatEngine> {
    const currentEntity = combat.getCurrentEntity();
    
    if (!currentEntity || currentEntity.type === 'player') {
      this.logger.warn('COMBAT_GAME_USECASE', 'Invalid entity for AI turn', {
        hasEntity: !!currentEntity,
        entityType: currentEntity?.type
      });
      return combat;
    }

    // ✅ LIGNE 1: Calculer action via Domain
    const aiAction = this.determineAIAction(currentEntity, combat.getState());
    let updatedCombat = combat.withExecutedTurn(aiAction);
    updatedCombat = updatedCombat.withAdvancedTurn();

    // ✅ LIGNE 2: Sauvegarde obligatoire
    await this.saveCombatState(updatedCombat);

    // ✅ LIGNE 3: Retourner nouvel état
    return updatedCombat;
  }

  /**
   * HELPER - Calcul de l'action IA via TacticalAIService
   * Délégation pure sans logique métier
   */
  private determineAIAction(entity: CombatEntity, combatState: CombatState): CombatTurnAction {
    // ✅ Système d'IA tactique unifié - tous les ennemis ont maintenant un aiProfile
    if (!entity.aiProfile) {
      this.logger.error('COMBAT_GAME_USECASE', 'Entity missing aiProfile - this should not happen', {
        entityId: entity.id,
        entityName: entity.name
      });
      // Action par défaut si pas de profil (ne devrait jamais arriver)
      return {
        type: 'execute_turn',
        entityId: entity.id
      };
    }
    
    return this.tacticalAIService.calculateOptimalTurn(entity, combatState, entity.aiProfile);
  }



  /**
   * ✅ PATTERN SAUVEGARDE OBLIGATOIRE - Traiter action joueur avec système unifié
   * Orchestre la conversion et l'application d'action joueur
   * Respecte ARCHITECTURE_GUIDELINES.md - Règle #2 Pattern 3 lignes
   */
  async processPlayerActionUnified(combat: CombatEngine, action: CombatAction): Promise<CombatEngine> {
    const currentEntity = combat.getCurrentEntity();
    
    if (!currentEntity || currentEntity.type !== 'player') {
      this.logger.error('COMBAT_GAME_USECASE', 'Invalid entity for player action');
      return combat;
    }

    // Gérer end_turn avec ancien système
    if (action.type === 'end_turn') {
      return this.processPlayerAction(combat, action);
    }

    // ✅ LIGNE 1: Convertir et appliquer via Domain
    const unifiedAction = CombatActionMapper.convertLegacyToUnified(action);
    if (!unifiedAction) {
      return this.processPlayerAction(combat, action); // Fallback
    }

    let updatedCombat = combat.withExecutedTurn(unifiedAction);
    if (!currentEntity.actionsRemaining.action) {
      updatedCombat = updatedCombat.withAdvancedTurn();
    }

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
   * NOUVELLES MÉTHODES - SYSTÈME D'ARMES JOUEUR
   * Respecte ARCHITECTURE_GUIDELINES.md - Règle #2 Pattern 3 lignes
   */

  /**
   * Récupérer les armes du joueur pour l'UI
   * Règle #2: Pattern 3 lignes - Appel/Pas de save/Retour
   */
  getPlayerWeaponChoices(combat: CombatEngine): PlayerWeaponChoice[] {
    const currentEntity = combat.getCurrentEntity();
    if (!currentEntity || currentEntity.type !== 'player') return [];
    
    // LIGNE 1: Appel au Domain
    const choices = this.playerWeaponService.getAvailableWeaponsForPlayer(currentEntity);
    
    // LIGNE 2: Pas de sauvegarde (lecture seule)
    // LIGNE 3: Retour
    return choices;
  }
  
  /**
   * Récupérer les cibles valides pour une arme du joueur
   * Règle #2: Pattern 3 lignes - Appel/Pas de save/Retour
   */
  getValidTargetsForPlayerWeapon(combat: CombatEngine, weaponId: string): CombatEntity[] {
    const currentEntity = combat.getCurrentEntity();
    if (!currentEntity || currentEntity.type !== 'player') return [];
    
    // LIGNE 1: Appel au Domain  
    const targets = this.playerWeaponService.getValidTargetsForWeapon(
      currentEntity, weaponId, combat.getAllEntities()
    );
    
    // LIGNE 2: Pas de sauvegarde (lecture seule)
    // LIGNE 3: Retour
    return targets;
  }
  
  /**
   * Exécuter attaque avec arme choisie par le joueur
   * Règle #2: Pattern 3 lignes - Appel/Save/Retour
   */
  async executePlayerWeaponAttack(
    combat: CombatEngine, 
    weaponId: string, 
    targetId: string
  ): Promise<CombatEngine> {
    // LIGNE 1: Créer action spécifique à l'arme et appel Domain
    const action: CombatAction = {
      type: 'attack',
      entityId: combat.getCurrentEntity()!.id,
      targetId,
      weaponId // NOUVEAU: Spécifier l'arme choisie
    };
    
    const updatedCombat = combat.withAppliedWeaponAttack(action, weaponId);
    
    // LIGNE 2: Sauvegarde obligatoire
    await this.saveCombatState(updatedCombat);
    
    // LIGNE 3: Retour avec avancement tour
    return updatedCombat.withAdvancedTurn();
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
   * ✅ NOUVELLE MÉTHODE - Obtenir choix post-combat depuis la scène actuelle
   * Respecte ARCHITECTURE_GUIDELINES.md - Règle #2 Pattern 3 lignes
   */
  async getPostCombatChoices(combat: CombatEngine): Promise<Array<{
    id: string;
    text: string;
    targetSceneId: string;
  }>> {
    const combatPhase = combat.getState().phase;
    if (combatPhase !== 'victory' && combatPhase !== 'defeat') return [];

    // LIGNE 1: Récupérer scène depuis Repository
    const currentSession = await this.gameSessionRepository.getCurrentSession();
    if (!currentSession) return [];
    
    const scene = await this.sceneRepository.getById(currentSession.currentSceneId);
    if (!scene || !scene.choices) return [];

    // LIGNE 2: Filtrer choix via Domain Service
    const availableChoices = this.sceneConditionService.getAvailableChoices(
      scene.choices, 
      { combatPhase }
    );

    // LIGNE 3: Retourner format UI
    return availableChoices.map(choice => ({
      id: choice.id,
      text: choice.text,
      targetSceneId: choice.targetSceneId
    }));
  }

  /**
   * ✅ NOUVELLE MÉTHODE - Exécuter choix post-combat
   * Respecte ARCHITECTURE_GUIDELINES.md - Règle #2 Pattern 3 lignes
   */
  async executePostCombatChoice(choiceId: string, targetSceneId: string): Promise<boolean> {
    // LIGNE 1: Déclencher transition via GameSession (Domain orchestration)
    const currentSession = await this.gameSessionRepository.getCurrentSession();
    if (!currentSession) return false;

    // LIGNE 2: Sauvegarder nouvelle scène
    const success = await this.gameSessionRepository.updateCurrentScene(currentSession.id, targetSceneId);

    // LIGNE 3: Retourner résultat
    return success;
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