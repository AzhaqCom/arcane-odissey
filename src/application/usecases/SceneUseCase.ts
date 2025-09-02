/**
 * APPLICATION USE CASE - SceneUseCase
 * Orchestrateur principal du système de scènes
 */

import type { ISceneRepository } from '../../domain/repositories';
import { Scene, GameSession } from '../../domain/entities';
import type { SceneChoice, SceneEffect } from '../../domain/entities';
import { logger } from '../../infrastructure/services/Logger';

export interface SceneTransitionRequest {
  readonly targetSceneId: string;
  readonly choiceId?: string;
  readonly gameSession: GameSession;
}

export interface SceneTransitionResult {
  readonly success: boolean;
  readonly newScene: Scene | null;
  readonly appliedEffects: SceneEffect[];
  readonly errors: string[];
  readonly warnings: string[];
}

export interface ContextualSpellSuggestion {
  readonly spellId: string;
  readonly reason: string;
  readonly priority: 'high' | 'medium' | 'low';
}

export interface SceneAnalysis {
  readonly scene: Scene;
  readonly availableChoices: SceneChoice[];
  readonly contextualSpells: ContextualSpellSuggestion[];
  readonly restOptions: {
    shortRest: boolean;
    longRest: boolean;
    restrictions: string[];
  };
  readonly canLeave: boolean;
}

/**
 * SCENE USE CASE - Orchestrateur des scènes
 * Gère les transitions, validations et logique métier des scènes
 */
export class SceneUseCase {
  private readonly sceneRepository: ISceneRepository;
  
  constructor(
    sceneRepository: ISceneRepository
  ) {
    this.sceneRepository = sceneRepository;
  }

  /**
   * Obtenir l'analyse complète d'une scène
   */
  async analyzeScene(sceneId: string, gameSession: GameSession): Promise<SceneAnalysis | null> {
    try {
      logger.scene(`Analyzing scene: ${sceneId}`, { 
        sessionId: gameSession.sessionId,
        currentPhase: gameSession.currentPhase 
      });

      const scene = await this.sceneRepository.getById(sceneId);
      if (!scene) {
        logger.scene(`Scene not found: ${sceneId}`);
        return null;
      }

      // Analyser les choix disponibles selon l'état du jeu
      const gameState = this.buildGameState(gameSession);
      const availableChoices = scene.getAvailableChoices(gameState);

      // Obtenir les suggestions de sorts contextuels
      const contextualSpells = this.getContextualSpellSuggestions(scene, gameSession);

      // Vérifier les options de repos
      const restAllowed = scene.allowsResting();
      const restOptions = {
        shortRest: restAllowed.short,
        longRest: restAllowed.long,
        restrictions: this.getRestRestrictions(scene, gameSession)
      };

      // Vérifier si on peut quitter la scène
      const canLeave = this.canLeaveScene(scene, gameSession);

  

      return {
        scene,
        availableChoices,
        contextualSpells,
        restOptions,
        canLeave
      };

    } catch (error) {
      logger.error('SCENE_ANALYSIS', `Failed to analyze scene ${sceneId}`, { error });
      return null;
    }
  }

  /**
   * Effectuer une transition vers une nouvelle scène
   */
  async transitionToScene(request: SceneTransitionRequest): Promise<SceneTransitionResult> {
    try {
      logger.scene(`Scene transition requested: ${request.targetSceneId}`, {
        from: request.gameSession.currentSceneId,
        choiceId: request.choiceId
      });

      // Vérifier si la scène cible existe
      const targetScene = await this.sceneRepository.getById(request.targetSceneId);
      if (!targetScene) {
        return {
          success: false,
          newScene: null,
          appliedEffects: [],
          errors: [`Scene not found: ${request.targetSceneId}`],
          warnings: []
        };
      }

      // Valider l'accès à la scène
      const gameState = this.buildGameState(request.gameSession);
      const accessValidation = targetScene.canAccess(gameState);
      
      if (!accessValidation.valid) {
        return {
          success: false,
          newScene: null,
          appliedEffects: [],
          errors: accessValidation.reasons,
          warnings: accessValidation.warnings || []
        };
      }

      // Obtenir la scène actuelle pour appliquer ses effets de sortie
      const currentScene = await this.sceneRepository.getById(request.gameSession.currentSceneId);
      let appliedEffects: SceneEffect[] = [];

      // Appliquer les effets de la scène actuelle (si applicable)
      if (currentScene) {
        appliedEffects = currentScene.applyEffects(gameState);
      }

      // Appliquer les effets de la scène cible
      const targetEffects = targetScene.applyEffects(gameState);
      appliedEffects.push(...targetEffects);

      logger.scene(`Scene transition successful: ${request.targetSceneId}`, {
        appliedEffects: appliedEffects.length,
        warnings: accessValidation.warnings?.length || 0
      });

      return {
        success: true,
        newScene: targetScene,
        appliedEffects,
        errors: [],
        warnings: accessValidation.warnings || []
      };

    } catch (error) {
      logger.error('SCENE_TRANSITION', `Failed transition to ${request.targetSceneId}`, { error });
      return {
        success: false,
        newScene: null,
        appliedEffects: [],
        errors: [`Transition failed: ${error}`],
        warnings: []
      };
    }
  }

  /**
   * Rechercher des scènes selon des critères
   */
  async searchScenes(query: string): Promise<Scene[]> {
    try {
      logger.scene(`Scene search: "${query}"`);
      return await this.sceneRepository.search(query);
    } catch (error) {
      logger.error('SCENE_SEARCH', `Search failed: ${query}`, { error });
      return [];
    }
  }

  /**
   * Obtenir les scènes accessibles depuis la scène actuelle
   */
  async getReachableScenes(fromSceneId: string): Promise<Scene[]> {
    try {
      logger.scene(`Getting reachable scenes from: ${fromSceneId}`);
      return await this.sceneRepository.getReachableScenes(fromSceneId);
    } catch (error) {
      logger.error('REACHABLE_SCENES', `Failed to get reachable scenes from ${fromSceneId}`, { error });
      return [];
    }
  }

  /**
   * Obtenir les scènes par type
   */
  async getScenesByType(type: 'text' | 'dialogue' | 'combat' | 'investigation' | 'merchant' | 'crafting' | 'puzzle' | 'dungeon'): Promise<Scene[]> {
    try {
      logger.scene(`Getting scenes by type: ${type}`);
      return await this.sceneRepository.getByType(type);
    } catch (error) {
      logger.error('SCENES_BY_TYPE', `Failed to get scenes by type: ${type}`, { error });
      return [];
    }
  }

  /**
   * Obtenir les scènes par sécurité (pour le système de repos)
   */
  async getScenesBySafety(safety: 'safe' | 'moderate' | 'dangerous' | 'deadly'): Promise<Scene[]> {
    try {
      logger.scene(`Getting scenes by safety: ${safety}`);
      return await this.sceneRepository.getByMetadata({ safety });
    } catch (error) {
      logger.error('SCENES_BY_SAFETY', `Failed to get scenes by safety: ${safety}`, { error });
      return [];
    }
  }

  // MÉTHODES PRIVÉES

  /**
   * Construire l'état du jeu pour l'évaluation des conditions
   */
  private buildGameState(gameSession: GameSession): any {
    return {
      // Caractère joueur
      player: {
        level: gameSession.playerCharacter.level,
        currentHP: gameSession.playerCharacter.currentHP,
        maxHP: gameSession.playerCharacter.maxHP,
        class: gameSession.playerCharacter.characterClass
      },
      
      // Compagnons
      companions: gameSession.companions.map(c => ({
        id: c.id,
        name: c.name,
        level: c.level,
        isAlive: c.isAlive
      })),
      
      // État temporel
      time: {
        day: gameSession.gameTime.day,
        hour: gameSession.gameTime.hour,
        timeOfDay: gameSession.getTimeOfDay()
      },
      
      // Flags et métriques
      flags: gameSession.getAllFlags(),
      metrics: gameSession.metrics,
      
      // Historique des scènes
      visitedScenes: gameSession.sceneHistory,
      currentSceneId: gameSession.currentSceneId,
      
      // État de la session
      difficulty: gameSession.difficulty,
      phase: gameSession.currentPhase
    };
  }

  /**
   * Obtenir les suggestions de sorts contextuels
   */
  private getContextualSpellSuggestions(scene: Scene, gameSession: GameSession): ContextualSpellSuggestion[] {
    const suggestions: ContextualSpellSuggestion[] = [];
    const contextualSpells = scene.getContextualSpells();

    for (const spellId of contextualSpells) {
      const suggestion = this.createSpellSuggestion(spellId, scene, gameSession);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }

    // Trier par priorité (high > medium > low)
    return suggestions.sort((a, b) => {
      const priorities = { high: 3, medium: 2, low: 1 };
      return priorities[b.priority] - priorities[a.priority];
    });
  }

  /**
   * Créer une suggestion de sort avec raison et priorité
   */
  private createSpellSuggestion(spellId: string, scene: Scene, gameSession: GameSession): ContextualSpellSuggestion | null {
    const metadata = scene.metadata;
    
    // Mapper les sorts contextuels avec leurs raisons
    switch (spellId) {
      case 'light':
      case 'darkvision':
        return {
          spellId,
          reason: `Il fait ${metadata.lighting} ici`,
          priority: metadata.lighting === 'dark' ? 'high' : 'medium'
        };
        
      case 'detect_danger':
      case 'protection':
      case 'shield':
        return {
          spellId,
          reason: `Zone ${metadata.safety}`,
          priority: metadata.safety === 'deadly' ? 'high' : 'medium'
        };
        
      case 'water_breathing':
      case 'control_water':
        return {
          spellId,
          reason: `Environnement aquatique`,
          priority: 'high'
        };
        
      case 'control_weather':
      case 'protection_from_elements':
        return {
          spellId,
          reason: `Conditions météorologiques difficiles`,
          priority: 'medium'
        };
        
      case 'cure_wounds':
      case 'healing_word':
        const needsHealing = gameSession.playerCharacter.currentHP < gameSession.playerCharacter.maxHP;
        return needsHealing ? {
          spellId,
          reason: `Blessures à soigner`,
          priority: 'high'
        } : null;
        
      default:
        return {
          spellId,
          reason: `Sort utile dans ce contexte`,
          priority: 'low'
        };
    }
  }

  /**
   * Obtenir les restrictions de repos pour une scène
   */
  private getRestRestrictions(scene: Scene, gameSession: GameSession): string[] {
    const restrictions: string[] = [];
    
    // Vérifications de sécurité
    if (scene.metadata.safety === 'deadly') {
      restrictions.push('Zone trop dangereuse');
    }
    
    if (scene.metadata.safety === 'dangerous') {
      restrictions.push('Zone dangereuse - repos court uniquement');
    }
    
    // Vérifications temporelles
    const timeOfDay = gameSession.getTimeOfDay();
    if (timeOfDay === 'night' && scene.metadata.environment === 'outdoor') {
      restrictions.push('Repos en extérieur de nuit déconseillé');
    }
    
    // Vérifications de phase de jeu
    if (gameSession.currentPhase === 'combat') {
      restrictions.push('Impossible de se reposer en combat');
    }
    
    return restrictions;
  }

  /**
   * Vérifier si on peut quitter la scène actuelle
   */
  private canLeaveScene(scene: Scene, gameSession: GameSession): boolean {
    // Combat en cours = impossible de partir
    if (gameSession.currentPhase === 'combat') {
      return false;
    }
    
    // Scènes spéciales qui forcent des choix
    if (scene.type === 'combat' && scene.choices.length === 0) {
      return false; // Combat obligatoire
    }
    
    // Par défaut, on peut quitter si on a des choix
    return scene.choices.length > 0;
  }
}