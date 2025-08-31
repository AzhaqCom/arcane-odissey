/**
 * DOMAIN REPOSITORY INTERFACE - ISceneRepository
 * Contrat pour la persistance des scènes (architecture hexagonale)
 */

import { Scene } from '../entities/Scene';

export interface ISceneRepository {
  /**
   * Obtenir une scène par son ID
   */
  getById(sceneId: string): Promise<Scene | null>;
  
  /**
   * Obtenir plusieurs scènes par leurs IDs
   */
  getByIds(sceneIds: string[]): Promise<Scene[]>;
  
  /**
   * Obtenir toutes les scènes disponibles
   */
  getAll(): Promise<Scene[]>;
  
  /**
   * Obtenir les scènes par type
   */
  getByType(sceneType: 'text' | 'dialogue' | 'combat' | 'investigation' | 'merchant' | 'crafting' | 'puzzle' | 'dungeon'): Promise<Scene[]>;
  
  /**
   * Vérifier si une scène existe
   */
  exists(sceneId: string): Promise<boolean>;
  
  /**
   * Obtenir les IDs de toutes les scènes
   */
  getAllIds(): Promise<string[]>;
  
  /**
   * Obtenir les scènes qui peuvent être atteintes depuis une scène donnée
   */
  getReachableScenes(fromSceneId: string): Promise<Scene[]>;
  
  /**
   * Rechercher des scènes par titre ou contenu
   */
  search(query: string): Promise<Scene[]>;
  
  /**
   * Obtenir les scènes par metadata (safety, environment, etc.)
   */
  getByMetadata(criteria: Partial<{
    safety: 'safe' | 'moderate' | 'dangerous' | 'deadly';
    environment: 'indoor' | 'outdoor' | 'underground' | 'water' | 'sky';
    lighting: 'bright' | 'dim' | 'dark';
  }>): Promise<Scene[]>;
}