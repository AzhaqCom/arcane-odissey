/**
 * INFRASTRUCTURE REPOSITORY - SceneRepository
 * Implémentation concrète pour la persistance des scènes
 */

import type { ISceneRepository } from '../../domain/repositories';
import { Scene } from '../../domain/entities';
import type { SceneType, SceneMetadata } from '../../domain/entities';
import { SCENES_DATA } from '../data/scenes';
import type { 
  SceneData, 
  TextSceneContent, 
  DialogueSceneContent, 
  CombatSceneContent, 
  InvestigationSceneContent,
  MerchantSceneContent,
  CraftingSceneContent,
  PuzzleSceneContent,
  DungeonSceneContent
} from '../data/types/SceneData';
import { logger } from '../services/Logger';

export class SceneRepository implements ISceneRepository {
  private _cache: Map<string, Scene> = new Map();
  private _initialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialiser le repository avec les données JSON
   */
  private async initialize(): Promise<void> {
    if (this._initialized) return;

    try {
      logger.repo('SceneRepository initializing...', { 
        scenesCount: SCENES_DATA.length 
      });

      // Convertir les données en entités Domain
      for (const sceneData of SCENES_DATA) {
        const domainScene = this.convertToDomainScene(sceneData);
        this._cache.set(sceneData.id, domainScene);
      }

      this._initialized = true;
      logger.repo('SceneRepository initialized', { 
        cachedScenes: this._cache.size 
      });
    } catch (error) {
      logger.error('SceneRepository initialization failed', { error });
      throw new Error(`Failed to initialize SceneRepository: ${error}`);
    }
  }

  /**
   * Obtenir une scène par son ID
   */
  async getById(sceneId: string): Promise<Scene | null> {
    await this.initialize();
    
    const scene = this._cache.get(sceneId);
    
    logger.repo(`Scene requested: ${sceneId}`, { 
      found: !!scene 
    });
    
    return scene || null;
  }

  /**
   * Obtenir plusieurs scènes par leurs IDs
   */
  async getByIds(sceneIds: string[]): Promise<Scene[]> {
    await this.initialize();
    
    const foundScenes: Scene[] = [];
    
    for (const sceneId of sceneIds) {
      const scene = this._cache.get(sceneId);
      if (scene) {
        foundScenes.push(scene);
      }
    }
    
    logger.repo(`Multiple scenes requested`, { 
      requested: sceneIds.length,
      found: foundScenes.length 
    });
    
    return foundScenes;
  }

  /**
   * Obtenir toutes les scènes disponibles
   */
  async getAll(): Promise<Scene[]> {
    await this.initialize();
    
    const allScenes = Array.from(this._cache.values());
    
    logger.repo('All scenes requested', { 
      count: allScenes.length 
    });
    
    return allScenes;
  }

  /**
   * Obtenir les scènes par type
   */
  async getByType(sceneType: SceneType): Promise<Scene[]> {
    await this.initialize();
    
    const scenesOfType = Array.from(this._cache.values())
      .filter(scene => scene.type === sceneType);
    
    logger.repo(`Scenes by type requested: ${sceneType}`, { 
      found: scenesOfType.length 
    });
    
    return scenesOfType;
  }

  /**
   * Vérifier si une scène existe
   */
  async exists(sceneId: string): Promise<boolean> {
    await this.initialize();
    
    const exists = this._cache.has(sceneId);
    
    logger.repo(`Scene existence check: ${sceneId}`, { exists });
    
    return exists;
  }

  /**
   * Obtenir les IDs de toutes les scènes
   */
  async getAllIds(): Promise<string[]> {
    await this.initialize();
    
    const ids = Array.from(this._cache.keys());
    
    logger.repo('All scene IDs requested', { 
      count: ids.length 
    });
    
    return ids;
  }

  /**
   * Obtenir les scènes qui peuvent être atteintes depuis une scène donnée
   */
  async getReachableScenes(fromSceneId: string): Promise<Scene[]> {
    await this.initialize();
    
    const sourceScene = this._cache.get(fromSceneId);
    if (!sourceScene) {
      logger.repo(`Source scene not found: ${fromSceneId}`);
      return [];
    }

    const reachableIds = new Set<string>();
    
    // Obtenir les IDs des scènes accessibles via les choix
    for (const choice of sourceScene.choices) {
      reachableIds.add(choice.targetSceneId);
    }

    // Obtenir les scènes correspondantes
    const reachableScenes: Scene[] = [];
    for (const sceneId of reachableIds) {
      const scene = this._cache.get(sceneId);
      if (scene) {
        reachableScenes.push(scene);
      }
    }
    
    logger.repo(`Reachable scenes from ${fromSceneId}`, { 
      found: reachableScenes.length 
    });
    
    return reachableScenes;
  }

  /**
   * Rechercher des scènes par titre ou contenu
   */
  async search(query: string): Promise<Scene[]> {
    await this.initialize();
    
    const lowerQuery = query.toLowerCase();
    const matchingScenes = Array.from(this._cache.values())
      .filter(scene => 
        scene.title.toLowerCase().includes(lowerQuery) ||
        scene.description.toLowerCase().includes(lowerQuery) ||
        (typeof scene.content === 'object' && 
         scene.content.text && 
         scene.content.text.toLowerCase().includes(lowerQuery))
      );
    
    logger.repo(`Scene search: "${query}"`, { 
      found: matchingScenes.length 
    });
    
    return matchingScenes;
  }

  /**
   * Obtenir les scènes par metadata
   */
  async getByMetadata(criteria: Partial<{
    safety: 'safe' | 'moderate' | 'dangerous' | 'deadly';
    environment: 'indoor' | 'outdoor' | 'underground' | 'water' | 'sky';
    lighting: 'bright' | 'dim' | 'dark';
  }>): Promise<Scene[]> {
    await this.initialize();
    
    const matchingScenes = Array.from(this._cache.values())
      .filter(scene => {
        const metadata = scene.metadata;
        
        // Vérifier chaque critère
        for (const [key, value] of Object.entries(criteria)) {
          if (metadata[key as keyof SceneMetadata] !== value) {
            return false;
          }
        }
        
        return true;
      });
    
    logger.repo(`Scenes by metadata`, { 
      criteria,
      found: matchingScenes.length 
    });
    
    return matchingScenes;
  }

  // MÉTHODES PRIVÉES

  /**
   * Convertir les données JSON en entité Domain Scene
   */
  private convertToDomainScene(sceneData: SceneData): Scene {
    // Mapper le type de scène (notre nouvelle structure a déjà les bons types)
    const sceneType = sceneData.type;
    
    // Mapper les métadonnées (structure déjà correcte)
    const metadata = {
      environment: sceneData.metadata.environment,
      timeOfDay: sceneData.metadata.timeOfDay,
      safety: sceneData.metadata.safety,
      lighting: sceneData.metadata.lighting,
      weather: sceneData.metadata.weather
    };
    
    // Le contenu dépend du type de scène
    const content = this.mapNewSceneContent(sceneData);
    
    // Mapper les choix (structure déjà correcte)
    const choices = sceneData.choices.map(choice => ({
      id: choice.id,
      text: choice.text,
      targetSceneId: choice.targetSceneId,
      conditions: choice.conditions || [],
      effects: choice.effects || [],
      hidden: choice.hidden || false
    }));

    // Créer la scène Domain avec notre nouvelle structure
    return new Scene(
      sceneData.id,
      sceneType,
      sceneData.title,
      sceneData.description,
      metadata,
      content,
      logger,
      choices
    );
  }

  private mapNewSceneContent(sceneData: SceneData): any {
    // Utiliser des type guards typés au lieu de 'as any'
    switch (sceneData.type) {
      case 'text':
        if (this.isTextSceneContent(sceneData.content)) {
          return {
            text: sceneData.content.text,
            contextualSpells: sceneData.content.contextualSpells || []
          };
        }
        break;
      
      case 'dialogue':
        if (this.isDialogueSceneContent(sceneData.content)) {
          return {
            npcId: sceneData.content.npcId,
            dialogue: sceneData.content.dialogue
          };
        }
        break;
      
      
      case 'investigation':
        if (this.isInvestigationSceneContent(sceneData.content)) {
          return {
            clues: sceneData.content.clues,
            skillChecks: sceneData.content.skillChecks
          };
        }
        break;
      
      case 'merchant':
        if (this.isMerchantSceneContent(sceneData.content)) {
          return {
            merchantId: sceneData.content.merchantId,
            inventory: sceneData.content.inventory,
            buyback: sceneData.content.buyback,
            reputation: sceneData.content.reputation
          };
        }
        break;
      
      case 'crafting':
        if (this.isCraftingSceneContent(sceneData.content)) {
          return {
            availableRecipes: sceneData.content.availableRecipes,
            workbenchType: sceneData.content.workbenchType,
            bonuses: sceneData.content.bonuses || []
          };
        }
        break;
      
      case 'puzzle':
        if (this.isPuzzleSceneContent(sceneData.content)) {
          return {
            puzzleType: sceneData.content.puzzleType,
            description: sceneData.content.description,
            solution: sceneData.content.solution,
            hints: sceneData.content.hints,
            attempts: sceneData.content.attempts,
            maxAttempts: sceneData.content.maxAttempts,
            solved: sceneData.content.solved
          };
        }
        break;
      
      case 'combat':
        if (this.isCombatSceneContent(sceneData.content)) {
          return {
            enemies: sceneData.content.enemies,
            allies: sceneData.content.allies || [],
            combat: sceneData.content.combat,
            terrain: sceneData.content.terrain || [],
            objectives: sceneData.content.objectives,
            rewards: sceneData.content.rewards,
            ambiance: sceneData.content.ambiance
          };
        }
        break;
      
      case 'dungeon':
        if (this.isDungeonSceneContent(sceneData.content)) {
          return {
            rooms: sceneData.content.rooms,
            difficulty: sceneData.content.difficulty,
            enemyPool: sceneData.content.enemyPool,
            lootTables: sceneData.content.lootTables,
            completed: sceneData.content.completed,
            currentRoom: sceneData.content.currentRoom
          };
        }
        break;
    }
    
    // Fallback sûr avec validation
    logger.warn('SCENE_MAPPING', `Unknown or invalid scene type: ${sceneData.type}`, {
      sceneId: sceneData.id,
      contentKeys: Object.keys(sceneData.content)
    });
    
    return {
      text: sceneData.description,
      contextualSpells: []
    };
  }

  private mapSceneType(type: string): SceneType {
    switch (type) {
      case 'dialogue': return 'dialogue';
      case 'combat': return 'combat';
      case 'investigation': return 'investigation';
      default: return 'text';
    }
  }

  private mapSceneMetadata(metadata?: any): SceneMetadata {
    if (!metadata) {
      return {
        safety: 'safe',
        lighting: 'bright'
      };
    }

    // Mapper safety numérique vers enum
    let safety: 'safe' | 'moderate' | 'dangerous' | 'deadly' = 'safe';
    if (typeof metadata.safety === 'number') {
      if (metadata.safety >= 8) safety = 'safe';
      else if (metadata.safety >= 5) safety = 'moderate';
      else if (metadata.safety >= 2) safety = 'dangerous';
      else safety = 'deadly';
    }

    return {
      environment: metadata.environment || 'outdoor',
      safety,
      lighting: 'bright' // TODO: déduire de l'environnement/heure
    };
  }

  private mapSceneContent(sceneData: SceneData): any {
    if (sceneData.type === 'combat') {
      return {
        enemies: sceneData.enemies || [],
        enemyPositions: sceneData.enemyPositions || [],
        playerPosition: sceneData.playerPosition,
        companionPositions: sceneData.companionPositions || {},
        onVictory: sceneData.onVictory
      };
    }

    if (sceneData.type === 'dialogue') {
      return {
        text: sceneData.content.text,
        speaker: (sceneData.content as any).speaker,
        contextualSpells: [] // TODO: déduire du contexte
      };
    }

    // Type par défaut (text)
    return {
      text: sceneData.content.text,
      contextualSpells: []
    };
  }

  private generateChoiceId(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  // TYPE GUARDS - Éliminent les 'as any' avec vérification de types
  
  private isTextSceneContent(content: any): content is TextSceneContent {
    return content && typeof content.text === 'string';
  }
  
  private isDialogueSceneContent(content: any): content is DialogueSceneContent {
    return content && 
           typeof content.npcId === 'string' &&
           Array.isArray(content.dialogue);
  }
  
  private isInvestigationSceneContent(content: any): content is InvestigationSceneContent {
    return content &&
           Array.isArray(content.clues) &&
           Array.isArray(content.skillChecks);
  }
  
  private isMerchantSceneContent(content: any): content is MerchantSceneContent {
    return content &&
           typeof content.merchantId === 'string' &&
           Array.isArray(content.inventory) &&
           typeof content.buyback === 'boolean';
  }
  
  private isCraftingSceneContent(content: any): content is CraftingSceneContent {
    return content &&
           Array.isArray(content.availableRecipes) &&
           typeof content.workbenchType === 'string';
  }
  
  private isPuzzleSceneContent(content: any): content is PuzzleSceneContent {
    return content &&
           typeof content.puzzleType === 'string' &&
           typeof content.description === 'string' &&
           typeof content.solution === 'string' &&
           Array.isArray(content.hints);
  }
  
  private isDungeonSceneContent(content: any): content is DungeonSceneContent {
    return content &&
           typeof content.rooms === 'number' &&
           typeof content.difficulty === 'number' &&
           Array.isArray(content.enemyPool) &&
           Array.isArray(content.lootTables);
  }
  
  private isCombatSceneContent(content: any): content is CombatSceneContent {
    return content &&
           Array.isArray(content.enemies) &&
           content.enemies.every((enemy: any) => 
             enemy && 
             typeof enemy.templateId === 'string' &&
             enemy.position && 
             typeof enemy.position.x === 'number' &&
             typeof enemy.position.y === 'number'
           );
  }

}