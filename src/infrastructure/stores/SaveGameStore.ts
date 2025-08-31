/**
 * INFRASTRUCTURE - SaveGame Store
 * Gestion de la sauvegarde et chargement via localStorage/sessionStorage
 */

import { logger } from '../services/Logger';

export interface SaveGameData {
  readonly version: string;
  readonly timestamp: Date;
  readonly gameSession: {
    readonly playerId: string;
    readonly currentSceneId: string;
    readonly playTime: number; // en minutes
    readonly lastSave: Date;
  };
  readonly characters: Record<string, any>; // Données de personnages modifiées
  readonly inventory: Record<string, any>;  // État des inventaires
  readonly progress: {
    readonly level: number;
    readonly experience: number;
    readonly completedScenes: string[];
    readonly unlockedScenes: string[];
    readonly questsCompleted: string[];
    readonly questsActive: string[];
  };
  readonly settings: {
    readonly difficulty: 'easy' | 'normal' | 'hard' | 'nightmare';
    readonly autoSave: boolean;
    readonly logLevel: string;
  };
}

/**
 * Store pour la gestion des sauvegardes
 * Utilise localStorage pour la persistence et sessionStorage pour les données temporaires
 */
export class SaveGameStore {
  private static readonly SAVE_KEY = 'dnd-game-save';
  private static readonly TEMP_KEY = 'dnd-game-temp';
  private static readonly VERSION = '1.0.0';
  
  // SAUVEGARDE PRINCIPALE
  
  /**
   * Sauvegarder l'état complet du jeu
   */
  save(data: Omit<SaveGameData, 'version' | 'timestamp'>): boolean {
    try {
      const saveData: SaveGameData = {
        version: SaveGameStore.VERSION,
        timestamp: new Date(),
        ...data
      };
      
      const serialized = JSON.stringify(saveData, this.dateReplacer);
      localStorage.setItem(SaveGameStore.SAVE_KEY, serialized);
      
      logger.info('SAVE', 'Game saved successfully', { 
        scene: data.gameSession.currentSceneId,
        playTime: data.gameSession.playTime 
      });
      
      return true;
      
    } catch (error) {
      logger.error('SAVE', 'Failed to save game', error);
      return false;
    }
  }
  
  /**
   * Charger l'état complet du jeu
   */
  load(): SaveGameData | null {
    try {
      const stored = localStorage.getItem(SaveGameStore.SAVE_KEY);
      if (!stored) {
        logger.info('SAVE', 'No save game found');
        return null;
      }
      
      const data = JSON.parse(stored, this.dateReviver) as SaveGameData;
      
      // Vérifier la compatibilité de version
      if (data.version !== SaveGameStore.VERSION) {
        logger.warn('SAVE', 'Save version mismatch', {
          saved: data.version,
          current: SaveGameStore.VERSION
        });
        // Ici on pourrait faire une migration si nécessaire
      }
      
      logger.info('SAVE', 'Game loaded successfully', {
        timestamp: data.timestamp,
        scene: data.gameSession.currentSceneId
      });
      
      return data;
      
    } catch (error) {
      logger.error('SAVE', 'Failed to load game', error);
      return null;
    }
  }
  
  /**
   * Vérifier si une sauvegarde existe
   */
  hasSaveGame(): boolean {
    return localStorage.getItem(SaveGameStore.SAVE_KEY) !== null;
  }
  
  /**
   * Supprimer la sauvegarde principale
   */
  deleteSave(): boolean {
    try {
      localStorage.removeItem(SaveGameStore.SAVE_KEY);
      logger.info('SAVE', 'Save game deleted');
      return true;
    } catch (error) {
      logger.error('SAVE', 'Failed to delete save', error);
      return false;
    }
  }
  
  // SAUVEGARDE TEMPORAIRE (Session)
  
  /**
   * Sauvegarder des données temporaires (perdues à la fermeture du navigateur)
   */
  saveTemp(key: string, data: any): boolean {
    try {
      const tempData = this.getTempData();
      tempData[key] = data;
      
      sessionStorage.setItem(SaveGameStore.TEMP_KEY, JSON.stringify(tempData, this.dateReplacer));
      logger.debug('SAVE', `Temp data saved: ${key}`);
      return true;
      
    } catch (error) {
      logger.error('SAVE', `Failed to save temp data: ${key}`, error);
      return false;
    }
  }
  
  /**
   * Charger des données temporaires
   */
  loadTemp(key: string): any | null {
    try {
      const tempData = this.getTempData();
      return tempData[key] || null;
    } catch (error) {
      logger.error('SAVE', `Failed to load temp data: ${key}`, error);
      return null;
    }
  }
  
  /**
   * Supprimer une donnée temporaire
   */
  deleteTemp(key: string): boolean {
    try {
      const tempData = this.getTempData();
      delete tempData[key];
      
      sessionStorage.setItem(SaveGameStore.TEMP_KEY, JSON.stringify(tempData));
      logger.debug('SAVE', `Temp data deleted: ${key}`);
      return true;
      
    } catch (error) {
      logger.error('SAVE', `Failed to delete temp data: ${key}`, error);
      return false;
    }
  }
  
  /**
   * Vider toutes les données temporaires
   */
  clearTemp(): boolean {
    try {
      sessionStorage.removeItem(SaveGameStore.TEMP_KEY);
      logger.info('SAVE', 'All temp data cleared');
      return true;
    } catch (error) {
      logger.error('SAVE', 'Failed to clear temp data', error);
      return false;
    }
  }
  
  // UTILITAIRES
  
  /**
   * Obtenir les informations de la dernière sauvegarde
   */
  getSaveInfo(): { timestamp: Date; playTime: number; scene: string } | null {
    try {
      const stored = localStorage.getItem(SaveGameStore.SAVE_KEY);
      if (!stored) return null;
      
      const data = JSON.parse(stored, this.dateReviver) as SaveGameData;
      return {
        timestamp: data.timestamp,
        playTime: data.gameSession.playTime,
        scene: data.gameSession.currentSceneId
      };
      
    } catch (error) {
      logger.error('SAVE', 'Failed to get save info', error);
      return null;
    }
  }
  
  /**
   * Exporter la sauvegarde (pour debug ou backup)
   */
  exportSave(): string | null {
    const stored = localStorage.getItem(SaveGameStore.SAVE_KEY);
    return stored;
  }
  
  /**
   * Importer une sauvegarde
   */
  importSave(saveData: string): boolean {
    try {
      // Valider le format
      const data = JSON.parse(saveData) as SaveGameData;
      if (!data.version || !data.gameSession) {
        throw new Error('Invalid save format');
      }
      
      localStorage.setItem(SaveGameStore.SAVE_KEY, saveData);
      logger.info('SAVE', 'Save imported successfully');
      return true;
      
    } catch (error) {
      logger.error('SAVE', 'Failed to import save', error);
      return false;
    }
  }
  
  // MÉTHODES PRIVÉES
  
  private getTempData(): Record<string, any> {
    try {
      const stored = sessionStorage.getItem(SaveGameStore.TEMP_KEY);
      return stored ? JSON.parse(stored, this.dateReviver) : {};
    } catch {
      return {};
    }
  }
  
  /**
   * Replacer pour JSON.stringify qui gère les dates
   */
  private dateReplacer(key: string, value: any): any {
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() };
    }
    return value;
  }
  
  /**
   * Reviver pour JSON.parse qui restaure les dates
   */
  private dateReviver(key: string, value: any): any {
    if (value && typeof value === 'object' && value.__type === 'Date') {
      return new Date(value.value);
    }
    return value;
  }
}