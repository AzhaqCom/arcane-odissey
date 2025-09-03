/**
 * APPLICATION LAYER - GameSessionUseCase
 * Gestion complète du cycle de vie d'une session de jeu
 * Responsabilité : Orchestration de l'initialisation, état global, transitions
 */

import { GameSession, Scene } from '../../domain/entities';
import type { NarrativeMessage } from '../../domain/entities/NarrativeMessage';
import type { GameUseCase, GameStateSnapshot } from './GameUseCase';
import type { SceneUseCase, SceneAnalysis } from './SceneUseCase';
import { logger } from '../../infrastructure/services/Logger';
import { DIContainer } from '../../infrastructure/container/DIContainer';

/**
 * Interface représentant l'état complet d'une session de jeu
 */
export interface GameSessionState {
  readonly gameState: GameStateSnapshot | null;
  readonly currentScene: Scene | null;
  readonly sceneAnalysis: SceneAnalysis | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly narrativeMessages: NarrativeMessage[];
}

/**
 * Configuration par défaut pour l'initialisation d'une nouvelle partie
 */
interface DefaultGameConfiguration {
  readonly playerCharacterId: string;
  readonly startingSceneId: string;
  readonly difficulty: 'easy' | 'normal' | 'hard';
}

/**
 * USE CASE - Gestion des Sessions de Jeu
 * Centralise toute la logique d'orchestration extraite de GameApp.tsx
 */
export class GameSessionUseCase {
  private readonly gameUseCase: GameUseCase;
  private readonly sceneUseCase: SceneUseCase;
  
  // Configuration par défaut (logique métier centralisée)
  private readonly DEFAULT_CONFIG: DefaultGameConfiguration = {
    playerCharacterId: 'Elarion',
    startingSceneId: 'forest_entrance',
    difficulty: 'normal'
  };

  constructor(
    gameUseCase: GameUseCase,
    sceneUseCase: SceneUseCase
  ) {
    this.gameUseCase = gameUseCase;
    this.sceneUseCase = sceneUseCase;
    this.gameNarrativeService = DIContainer.getInstance().get('GameNarrativeService');
  }

  private gameNarrativeService: any;

  /**
   * Initialiser une nouvelle session de jeu complète
   * Logique extraite de GameApp.initializeGame()
   */
  async initializeGameSession(): Promise<{
    success: boolean;
    sessionState?: GameSessionState;
    error?: string;
  }> {
    try {
      logger.ui('GameSessionUseCase: Initializing game session...');

      // === PHASE 1: AUTO-SAVE DETECTION (logique métier) ===
      const autoSave = await this.gameUseCase.getCurrentSession();
      let gameSession: GameSession;

      if (autoSave) {
        logger.ui('GameSessionUseCase: Loading auto-save');
        this.gameUseCase.loadGame(autoSave);
        gameSession = autoSave;
      } else {
        logger.ui('GameSessionUseCase: Creating new game session');
        
        // === PHASE 2: GAME INITIALIZATION (configuration métier) ===
        gameSession = await this.gameUseCase.initializeGame({
          playerCharacterId: this.DEFAULT_CONFIG.playerCharacterId,
          startingSceneId: this.DEFAULT_CONFIG.startingSceneId,
          difficulty: this.DEFAULT_CONFIG.difficulty
        });
      }

      // === PHASE 3: STATE PREPARATION ===
      const gameState = await this.gameUseCase.getGameState();
      if (!gameState) {
        throw new Error('Failed to get game state after initialization');
      }

      // ✅ OPTIMISATION: getGameState() inclut déjà l'analyse de scène
      // Pas besoin de rappeler analyzeScene - on utilise currentSceneAnalysis de gameState
      const sceneAnalysis = gameState.currentSceneAnalysis;
      if (!sceneAnalysis) {
        throw new Error(`Failed to get scene analysis from game state: ${gameSession.currentSceneId}`);
      }

      // === PHASE 5: NARRATIVE MESSAGE GENERATION ===
      const narrativeMessages = [
        // this.gameNarrativeService.createNarrativeMessage(
        //   `Jeu initialisé - Scène: ${gameSession.currentSceneId}`,
        //   'normal'
        // )
      ];

      logger.ui('GameSessionUseCase: Game session initialized successfully', {
        sceneId: gameSession.currentSceneId,
        phase: gameSession.currentPhase
      });

      return {
        success: true,
        sessionState: {
          gameState,
          currentScene: sceneAnalysis.scene,
          sceneAnalysis,
          loading: false,
          error: null,
          narrativeMessages
        }
      };

    } catch (error) {
      const errorMessage = `Erreur d'initialisation : ${(error as Error).message}`;
      logger.error('GAME_SESSION_INIT', 'Failed to initialize game session', { error });
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Rafraîchir l'état de la session après une modification
   * Logique extraite de GameApp.refreshGameState()
   */
  async refreshSessionState(): Promise<GameSessionState | null> {
    const currentSession = this.gameUseCase.getCurrentSession();
    if (!currentSession) {
      logger.ui('GameSessionUseCase: No current session to refresh');
      return null;
    }

    try {
      logger.ui('GameSessionUseCase: Refreshing session state...');

      // Récupérer l'état de jeu actuel
      const gameState = await this.gameUseCase.getGameState();
      if (!gameState) {
        logger.ui('GameSessionUseCase: No game state available');
        return null;
      }

      // ✅ OPTIMISATION: getGameState() inclut déjà l'analyse de scène
      // Pas besoin de rappeler analyzeScene - on utilise currentSceneAnalysis de gameState
      const sceneAnalysis = gameState.currentSceneAnalysis;
      if (!sceneAnalysis) {
        logger.ui('GameSessionUseCase: Failed to get scene analysis from game state');
        return null;
      }

      logger.ui('GameSessionUseCase: Session state refreshed successfully');

      return {
        gameState,
        currentScene: sceneAnalysis.scene,
        sceneAnalysis,
        loading: false,
        error: null,
        narrativeMessages: [] // Messages gérés séparément par le hook
      };

    } catch (error) {
      logger.error('REFRESH_SESSION_STATE', 'Failed to refresh session state', { error });
      
      return {
        gameState: null,
        currentScene: null,
        sceneAnalysis: null,
        loading: false,
        error: `Erreur de rafraîchissement : ${(error as Error).message}`,
        narrativeMessages: []
      };
    }
  }

  /**
   * Gérer une transition de scène
   * Logique extraite de GameApp.handleChoiceSelected()
   */
  async handleSceneTransition(
    choiceId: string, 
    targetSceneId: string
  ): Promise<{ 
    success: boolean; 
    newState?: GameSessionState;
    narrativeMessage?: NarrativeMessage;
  }> {
    try {
      logger.ui('GameSessionUseCase: Processing scene transition', { 
        choiceId, 
        targetSceneId 
      });

      // Effectuer la transition via GameUseCase
      const success = await this.gameUseCase.transitionToScene(targetSceneId, choiceId);
      
      if (success) {
        // Rafraîchir l'état après transition
        const newState = await this.refreshSessionState();
        
        // Générer un message narratif de transition
        const narrativeMessage = this.gameNarrativeService.createNarrativeMessage(
          `Transition vers la scène : ${targetSceneId}`,
          'normal'
        );

        logger.ui('GameSessionUseCase: Scene transition completed successfully');
        
        return { 
          success: true, 
          newState: newState || undefined,
          narrativeMessage
        };
      } else {
        logger.ui('GameSessionUseCase: Scene transition failed');
        return { success: false };
      }
      
    } catch (error) {
      logger.error('SCENE_TRANSITION', 'Failed to process scene transition', { error });
      return { success: false };
    }
  }

  /**
   * Gérer un repos (court ou long)
   * Logique extraite de GameApp.handleRest()
   */
  async handleRest(
    restType: 'short' | 'long', 
    gameSession: GameSession
  ): Promise<{
    success: boolean;
    narrativeMessage?: NarrativeMessage;
    newState?: GameSessionState;
  }> {
    try {
      logger.ui('GameSessionUseCase: Processing rest request', { restType });

      // Effectuer le repos via GameUseCase
      const result = await this.gameUseCase.rest({
        type: restType,
        gameSession
      });

      if (result.success) {
        // Générer un message narratif de repos
        const restTypeText = restType === 'short' ? 'court' : 'long';
        const narrativeMessage = this.gameNarrativeService.createHealingMessage(
          'Vous',
          'Vous',
          result.hpRestored || 0,
          `repos ${restTypeText}`
        );

        // Rafraîchir l'état après repos
        const newState = await this.refreshSessionState();

        logger.ui('GameSessionUseCase: Rest completed successfully', {
          hpRestored: result.hpRestored,
          timeAdvanced: result.timeAdvanced
        });
        
        return {
          success: true,
          narrativeMessage,
          newState: newState || undefined
        };
      } else {
        logger.ui('GameSessionUseCase: Rest failed', { errors: result.errors });
        return { success: false };
      }

    } catch (error) {
      logger.error('REST_PROCESSING', 'Failed to process rest request', { error });
      return { success: false };
    }
  }

  /**
   * Sauvegarder le jeu
   * Logique extraite de GameApp.handleSave()
   */
  async saveGame(): Promise<{ 
    success: boolean; 
    narrativeMessage?: NarrativeMessage;
  }> {
    try {
      logger.ui('GameSessionUseCase: Processing save request');

      // Effectuer la sauvegarde via GameUseCase
      const success = await this.gameUseCase.saveGame();
      
      if (success) {
        // Générer un message narratif de sauvegarde
        const narrativeMessage = this.gameNarrativeService.createNarrativeMessage(
          'Partie sauvegardée avec succès',
          'low'
        );

        logger.ui('GameSessionUseCase: Game saved successfully');
        
        return {
          success: true,
          narrativeMessage
        };
      } else {
        logger.ui('GameSessionUseCase: Save failed');
        return { success: false };
      }
      
    } catch (error) {
      logger.error('SAVE_GAME', 'Failed to save game', { error });
      return { success: false };
    }
  }

  /**
   * Créer un état de session d'erreur
   */
  createErrorState(errorMessage: string): GameSessionState {
    return {
      gameState: null,
      currentScene: null,
      sceneAnalysis: null,
      loading: false,
      error: errorMessage,
      narrativeMessages: []
    };
  }

  /**
   * Créer un état de session de chargement
   */
  createLoadingState(): GameSessionState {
    return {
      gameState: null,
      currentScene: null,
      sceneAnalysis: null,
      loading: true,
      error: null,
      narrativeMessages: []
    };
  }
}