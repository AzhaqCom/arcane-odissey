/**
 * APPLICATION USE CASE - GameUseCase
 * Orchestrateur principal de l'état global du jeu
 */

import { GameSession } from '../../domain/entities';
import type { ICharacterRepository } from '../../domain/repositories';
import { SceneUseCase } from './SceneUseCase';
import type { SceneTransitionRequest } from './SceneUseCase';
import { logger } from '../../infrastructure/services/Logger';

export interface GameStateSnapshot {
  readonly session: GameSession;
  readonly currentSceneAnalysis: any; // Sera typé plus précisément plus tard
  readonly availableActions: GameAction[];
}

export interface GameAction {
  readonly id: string;
  readonly type: 'scene_transition' | 'rest' | 'inventory' | 'spell_cast' | 'save_game';
  readonly label: string;
  readonly description: string;
  readonly enabled: boolean;
  readonly requirements?: string[];
}

export interface RestRequest {
  readonly type: 'short' | 'long';
  readonly gameSession: GameSession;
}

export interface RestResult {
  readonly success: boolean;
  readonly timeAdvanced: number;
  readonly hpRestored: number;
  readonly spellSlotsRestored: boolean;
  readonly effectsRemoved: string[];
  readonly errors: string[];
}

export interface GameInitializationRequest {
  readonly playerCharacterId: string;
  readonly startingSceneId?: string;
  readonly difficulty?: 'easy' | 'normal' | 'hard' | 'nightmare';
  readonly sessionId?: string;
}

/**
 * GAME USE CASE - Orchestrateur de l'état global
 * Coordonne les différents systèmes et maintient la cohérence du jeu
 */
export class GameUseCase {
  private currentSession: GameSession | null = null;
  private readonly sceneUseCase: SceneUseCase;
  private readonly characterRepository: ICharacterRepository;

  constructor(
    sceneUseCase: SceneUseCase,
    characterRepository: ICharacterRepository
  ) {
    this.sceneUseCase = sceneUseCase;
    this.characterRepository = characterRepository;
  }

  /**
   * Initialiser une nouvelle session de jeu
   */
  async initializeGame(request: GameInitializationRequest): Promise<GameSession> {
    try {
      // Charger le personnage depuis le repository
      const playerCharacter = await this.characterRepository.getById(request.playerCharacterId);
      if (!playerCharacter) {
        throw new Error(`Character not found: ${request.playerCharacterId}`);
      }
      
      

      logger.game('Initializing new game session', {
        playerName: playerCharacter.name,
        playerClass: playerCharacter.characterClass,
        difficulty: request.difficulty || 'normal'
      });

      // Créer la nouvelle session
      this.currentSession = new GameSession(
        request.sessionId || this.generateSessionId(),
        playerCharacter,
        logger,
        request.startingSceneId || 'prologue',
        request.difficulty || 'normal'
      );

      // Passer à la phase de navigation
      this.currentSession.changePhase('scene_navigation');

      logger.game('Game session initialized', {
        sessionId: this.currentSession.sessionId,
        startingScene: this.currentSession.currentSceneId
      });

      return this.currentSession;

    } catch (error) {
      logger.error('GAME_INIT', 'Failed to initialize game', { error });
      throw new Error(`Game initialization failed: ${error}`);
    }
  }

  /**
   * Charger une session existante
   */
  loadGame(session: GameSession): void {
    logger.game('Loading existing game session', {
      sessionId: session.sessionId,
      currentScene: session.currentSceneId,
      playTime: session.metrics.timePlayedMinutes
    });

    this.currentSession = session;
  }

  /**
   * Obtenir l'état complet du jeu
   */
  async getGameState(): Promise<GameStateSnapshot | null> {
    if (!this.currentSession) {
      logger.game('No active session for game state');
      return null;
    }

    try {
      // Analyser la scène actuelle
      const currentSceneAnalysis = await this.sceneUseCase.analyzeScene(
        this.currentSession.currentSceneId,
        this.currentSession
      );

      // Obtenir les actions disponibles
      const availableActions = await this.getAvailableActions();

      
      
      return {
        session: this.currentSession,
        currentSceneAnalysis,
        availableActions
      };

    } catch (error) {
      logger.error('GAME_STATE', 'Failed to get game state', { error });
      return null;
    }
  }

  /**
   * Effectuer une transition de scène
   */
  async transitionToScene(targetSceneId: string, choiceId?: string): Promise<boolean> {
    if (!this.currentSession) {
      logger.game('No active session for scene transition');
      return false;
    }

    try {
      logger.game(`Transitioning to scene: ${targetSceneId}`, {
        from: this.currentSession.currentSceneId,
        choiceId
      });

      const request: SceneTransitionRequest = {
        targetSceneId,
        choiceId,
        gameSession: this.currentSession
      };

      const result = await this.sceneUseCase.transitionToScene(request);

      if (result.success && result.newScene) {
        // Mettre à jour la session
        this.currentSession.navigateToScene(targetSceneId);

        // Appliquer les effets
        for (const effect of result.appliedEffects) {
          this.applySceneEffect(effect);
        }

        // Changer de phase selon le type de scène
        this.updateGamePhaseForScene(result.newScene.type);

        logger.game(`Scene transition successful`, {
          newScene: targetSceneId,
          effectsApplied: result.appliedEffects.length
        });

        return true;
      } else {
        logger.game('Scene transition failed', {
          errors: result.errors,
          warnings: result.warnings
        });
        return false;
      }

    } catch (error) {
      logger.error('SCENE_TRANSITION', `Failed transition to ${targetSceneId}`, { error });
      return false;
    }
  }

  /**
   * Effectuer un repos
   */
  async rest(request: RestRequest): Promise<RestResult> {
    if (!this.currentSession) {
      return {
        success: false,
        timeAdvanced: 0,
        hpRestored: 0,
        spellSlotsRestored: false,
        effectsRemoved: [],
        errors: ['No active game session']
      };
    }

    try {
      logger.game(`Rest requested: ${request.type}`, {
        currentHp: this.currentSession.playerCharacter.currentHP,
        maxHp: this.currentSession.playerCharacter.maxHP
      });

      // Vérifier si le repos est possible
      const currentSceneAnalysis = await this.sceneUseCase.analyzeScene(
        this.currentSession.currentSceneId,
        this.currentSession
      );

      if (!currentSceneAnalysis) {
        return {
          success: false,
          timeAdvanced: 0,
          hpRestored: 0,
          spellSlotsRestored: false,
          effectsRemoved: [],
          errors: ['Cannot analyze current scene for rest']
        };
      }

      const restAllowed = request.type === 'short' ? 
        currentSceneAnalysis.restOptions.shortRest : 
        currentSceneAnalysis.restOptions.longRest;

      if (!restAllowed) {
        return {
          success: false,
          timeAdvanced: 0,
          hpRestored: 0,
          spellSlotsRestored: false,
          effectsRemoved: [],
          errors: [`${request.type} rest not allowed here`, ...currentSceneAnalysis.restOptions.restrictions]
        };
      }

      // Effectuer le repos
      const timeAdvanced = request.type === 'short' ? 60 : 480; // 1h ou 8h en minutes
      const hpRestored = this.performRest(request.type);
      const spellSlotsRestored = request.type === 'long';
      const effectsRemoved: string[] = []; // TODO: implémenter la gestion des effets

      // Avancer le temps
      this.currentSession.advanceTime(timeAdvanced);

      // Changer de phase temporairement
      const originalPhase = this.currentSession.currentPhase;
      this.currentSession.changePhase('rest');
      
      // Revenir à la phase précédente après le repos
      setTimeout(() => {
        if (this.currentSession) {
          this.currentSession.changePhase(originalPhase);
        }
      }, 0);

      logger.game(`Rest completed: ${request.type}`, {
        timeAdvanced,
        hpRestored,
        spellSlotsRestored
      });

      return {
        success: true,
        timeAdvanced,
        hpRestored,
        spellSlotsRestored,
        effectsRemoved,
        errors: []
      };

    } catch (error) {
      logger.error('REST', `Failed to perform ${request.type} rest`, { error });
      return {
        success: false,
        timeAdvanced: 0,
        hpRestored: 0,
        spellSlotsRestored: false,
        effectsRemoved: [],
        errors: [`Rest failed: ${error}`]
      };
    }
  }

  /**
   * Sauvegarder la session actuelle
   */
  saveGame(): boolean {
    if (!this.currentSession) {
      logger.game('No active session to save');
      return false;
    }

    try {
      this.currentSession.markAsSaved();
      
      // TODO: Implémenter la vraie sauvegarde via GameSessionRepository
      logger.game('Game saved', {
        sessionId: this.currentSession.sessionId,
        sceneId: this.currentSession.currentSceneId
      });

      return true;
    } catch (error) {
      logger.error('SAVE_GAME', 'Failed to save game', { error });
      return false;
    }
  }

  /**
   * Vérifier si la session a besoin d'être sauvegardée
   */
  needsSaving(): boolean {
    return this.currentSession?.needsSaving() || false;
  }

  /**
   * Obtenir les métriques de la session
   */
  getSessionMetrics() {
    return this.currentSession?.metrics || null;
  }

  /**
   * Obtenir l'état de la session actuelle
   */
  getCurrentSession(): GameSession | null {
    return this.currentSession;
  }

  // MÉTHODES PRIVÉES

  /**
   * Générer un ID de session unique
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `session_${timestamp}_${random}`;
  }

  /**
   * Obtenir les actions disponibles selon l'état du jeu
   */
  private async getAvailableActions(): Promise<GameAction[]> {
    if (!this.currentSession) return [];

    const actions: GameAction[] = [];

    // Actions de base toujours disponibles
    actions.push({
      id: 'save_game',
      type: 'save_game',
      label: 'Sauvegarder',
      description: 'Sauvegarder la progression',
      enabled: true
    });

    // Actions selon la phase
    switch (this.currentSession.currentPhase) {
      case 'scene_navigation':
        actions.push({
          id: 'open_inventory',
          type: 'inventory',
          label: 'Inventaire',
          description: 'Gérer équipement et objets',
          enabled: true
        });
        
        // Ajouter l'action repos si possible
        const sceneAnalysis = await this.sceneUseCase.analyzeScene(
          this.currentSession.currentSceneId,
          this.currentSession
        );
        
        if (sceneAnalysis?.restOptions.shortRest || sceneAnalysis?.restOptions.longRest) {
          actions.push({
            id: 'rest',
            type: 'rest',
            label: 'Se reposer',
            description: 'Récupérer des forces',
            enabled: true,
            requirements: sceneAnalysis.restOptions.restrictions
          });
        }
        break;

      case 'combat':
        // Pas d'actions spéciales en combat (géré par CombatUseCase)
        break;

      case 'dialogue':
        // Actions de dialogue gérées par la scène
        break;
    }

    return actions;
  }

  /**
   * Appliquer un effet de scène sur la session
   */
  private applySceneEffect(effect: any): void {
    if (!this.currentSession) return;

    switch (effect.type) {
      case 'gain_xp':
        const xp = parseInt(effect.value);
        this.currentSession.incrementMetric('experienceGained', xp);
        // TODO: Implémenter le gain XP sur le personnage
        break;

      case 'change_hp':
        parseInt(effect.value); // TODO: Appliquer changement HP
        break;

      case 'add_item':
        // TODO: Ajouter item à l'inventaire
        this.currentSession.incrementMetric('itemsFound');
        break;

      case 'advance_time':
        const minutes = parseInt(effect.value);
        this.currentSession.advanceTime(minutes);
        break;

      case 'add_buff':
        // TODO: Appliquer buff
        break;

      default:
        logger.game(`Unknown scene effect type: ${effect.type}`, { effect });
    }
  }

  /**
   * Mettre à jour la phase de jeu selon le type de scène
   */
  private updateGamePhaseForScene(sceneType: string): void {
    if (!this.currentSession) return;

    switch (sceneType) {
      case 'combat':
        this.currentSession.changePhase('combat');
        break;
      case 'dialogue':
        this.currentSession.changePhase('dialogue');
        break;
      default:
        this.currentSession.changePhase('scene_navigation');
    }
  }

  /**
   * Effectuer le repos et calculer la récupération HP
   */
  private performRest(restType: 'short' | 'long'): number {
    if (!this.currentSession) return 0;

    const player = this.currentSession.playerCharacter;
    const currentHp = player.currentHP;
    const maxHp = player.maxHP;

    if (currentHp >= maxHp) return 0;

    let hpRestored = 0;

    if (restType === 'short') {
      // Repos court : récupération partielle
      hpRestored = Math.min(
        Math.floor(maxHp * 0.25), // 25% du max HP
        maxHp - currentHp
      );
    } else {
      // Repos long : récupération complète
      hpRestored = maxHp - currentHp;
    }

    // TODO: Appliquer la restauration HP au personnage
    // player.heal(hpRestored);

    return hpRestored;
  }
}