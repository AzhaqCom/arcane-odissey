/**
 * PRESENTATION HOOK - useGameSession
 * Interface React vers GameSessionUseCase
 * Responsabilité : Gestion d'état React pour les sessions de jeu
 */

import React from 'react';
import { GameSessionUseCase, type GameSessionState } from '../../application/usecases/GameSessionUseCase';
import type { NarrativeMessage } from '../../domain/entities/NarrativeMessage';
import { useRepositories } from './useRepositories';
import { logger } from '../../infrastructure/services/Logger';

/**
 * Interface publique du hook useGameSession
 */
export interface UseGameSessionReturn {
  readonly sessionState: GameSessionState;
  readonly initializeSession: () => Promise<void>;
  readonly handleSceneTransition: (choiceId: string, targetSceneId: string) => Promise<boolean>;
  readonly handleRest: (restType: 'short' | 'long') => Promise<boolean>;
  readonly handleSave: () => Promise<boolean>;
  readonly addNarrativeMessage: (message: NarrativeMessage) => void;
  readonly clearMessages: () => void;
}

/**
 * HOOK - useGameSession
 * Pont entre la couche Presentation et GameSessionUseCase
 */
export const useGameSession = (): UseGameSessionReturn => {
  const { gameUseCase, sceneUseCase } = useRepositories();
  
  // État React pour la session de jeu
  const [sessionState, setSessionState] = React.useState<GameSessionState>({
    gameState: null,
    currentScene: null,
    sceneAnalysis: null,
    loading: true,
    error: null,
    narrativeMessages: []
  });

  // Créer le use case (memoized pour éviter les re-créations)
  const gameSessionUseCase = React.useMemo(
    () => new GameSessionUseCase(gameUseCase, sceneUseCase),
    [gameUseCase, sceneUseCase]
  );

  // ✅ OPTIMISATION: Fonction d'initialisation memoized
  const initializeSession = React.useCallback(async () => {
    logger.ui('useGameSession: Starting session initialization');
    
    // État de chargement
    setSessionState(gameSessionUseCase.createLoadingState());

    // Délégation complète au Use Case
    const result = await gameSessionUseCase.initializeGameSession();
    
    if (result.success && result.sessionState) {
      setSessionState(result.sessionState);
      logger.ui('useGameSession: Session initialized successfully');
    } else {
      setSessionState(gameSessionUseCase.createErrorState(
        result.error || 'Erreur d\'initialisation inconnue'
      ));
      logger.error('USE_GAME_SESSION_INIT', 'Failed to initialize session', { 
        error: result.error 
      });
    }
  }, [gameSessionUseCase]);

  // ✅ OPTIMISATION: Utiliser une ref pour éviter les re-runs multiples
  const initializationRef = React.useRef(false);
  
  // Initialisation automatique au montage (une seule fois)
  React.useEffect(() => {
    if (!initializationRef.current) {
      initializationRef.current = true;
      initializeSession();
    }
  }, [initializeSession]);

  // ✅ initializeSession déjà définie plus haut dans le useCallback optimisé

  /**
   * Gérer une transition de scène
   * Délègue au Use Case et met à jour l'état React
   */
  const handleSceneTransition = React.useCallback(async (
    choiceId: string, 
    targetSceneId: string
  ): Promise<boolean> => {
    logger.ui('useGameSession: Processing scene transition', { choiceId, targetSceneId });
    
    const result = await gameSessionUseCase.handleSceneTransition(choiceId, targetSceneId);
    
    if (result.success && result.newState) {
      // Mettre à jour l'état avec le nouveau state
      const updatedState = result.narrativeMessage 
        ? {
            ...result.newState,
            narrativeMessages: [...sessionState.narrativeMessages, result.narrativeMessage]
          }
        : {
            ...result.newState,
            narrativeMessages: sessionState.narrativeMessages
          };
      
      setSessionState(updatedState);
      logger.ui('useGameSession: Scene transition completed');
    } else {
      logger.ui('useGameSession: Scene transition failed');
    }
    
    return result.success;
  }, [gameSessionUseCase, sessionState.narrativeMessages]);

  /**
   * Gérer un repos (court ou long)
   * Délègue au Use Case et gère les messages narratifs
   */
  const handleRest = React.useCallback(async (restType: 'short' | 'long'): Promise<boolean> => {
    if (!sessionState.gameState) {
      logger.ui('useGameSession: Cannot rest - no game state');
      return false;
    }

    logger.ui('useGameSession: Processing rest request', { restType });

    const result = await gameSessionUseCase.handleRest(restType, sessionState.gameState.session);
    
    if (result.success) {
      // Construire le nouvel état avec le message narratif
      const newMessages = result.narrativeMessage 
        ? [...sessionState.narrativeMessages, result.narrativeMessage]
        : sessionState.narrativeMessages;

      if (result.newState) {
        setSessionState({
          ...result.newState,
          narrativeMessages: newMessages
        });
      } else {
        // Fallback : juste ajouter le message
        setSessionState(prev => ({
          ...prev,
          narrativeMessages: newMessages
        }));
      }

      logger.ui('useGameSession: Rest completed successfully');
    } else {
      logger.ui('useGameSession: Rest failed');
    }
    
    return result.success;
  }, [gameSessionUseCase, sessionState.gameState, sessionState.narrativeMessages]);

  /**
   * Sauvegarder le jeu
   * Délègue au Use Case et gère le message de confirmation
   */
  const handleSave = React.useCallback(async (): Promise<boolean> => {
    logger.ui('useGameSession: Processing save request');

    const result = await gameSessionUseCase.saveGame();
    
    if (result.success && result.narrativeMessage) {
      // Ajouter le message de confirmation de sauvegarde
      setSessionState(prev => ({
        ...prev,
        narrativeMessages: [...prev.narrativeMessages, result.narrativeMessage!]
      }));
      
      logger.ui('useGameSession: Game saved successfully');
    } else {
      logger.ui('useGameSession: Save failed');
    }
    
    return result.success;
  }, [gameSessionUseCase]);

  /**
   * Ajouter un message narratif manuellement
   * Utile pour les interactions UI ou les messages externes
   */
  const addNarrativeMessage = React.useCallback((message: NarrativeMessage) => {
    setSessionState(prev => ({
      ...prev,
      narrativeMessages: [...prev.narrativeMessages, message]
    }));
    
    logger.ui('useGameSession: Narrative message added', { 
      type: message.type, 
      content: message.content.substring(0, 50) + '...' 
    });
  }, []);

  /**
   * Vider tous les messages narratifs
   * Utile pour réinitialiser le journal
   */
  const clearMessages = React.useCallback(() => {
    setSessionState(prev => ({
      ...prev,
      narrativeMessages: []
    }));
    
    logger.ui('useGameSession: Narrative messages cleared');
  }, []);

  // Interface publique du hook
  return {
    sessionState,
    initializeSession,
    handleSceneTransition,
    handleRest,
    handleSave,
    addNarrativeMessage,
    clearMessages
  };
};