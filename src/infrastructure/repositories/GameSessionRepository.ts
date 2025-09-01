/**
 * INFRASTRUCTURE REPOSITORY - GameSessionRepository
 * Implémentation de la persistance des sessions via localStorage
 */

import type { IGameSessionRepository, SaveMetadata } from '../../domain/repositories';
import { GameSession } from '../../domain/entities';
import { Character } from '../../domain/entities';
import { logger } from '../services/Logger';

interface SerializedGameSession {
  sessionId: string;
  createdAt: string;
  lastSavedAt?: string;
  currentPhase: string;
  difficulty: string;
  gameTime: {
    totalMinutes: number;
    day: number;
    hour: number;
    minute: number;
  };
  flags: Record<string, any>;
  metrics: {
    combatsWon: number;
    combatsLost: number;
    scenesVisited: number;
    spellsCast: number;
    itemsFound: number;
    experienceGained: number;
    timePlayedMinutes: number;
  };
  currentSceneId: string;
  sceneHistory: string[];
  playerCharacter: any; // Sera typé plus précisément
  companions: any[];
  autoSaveEnabled: boolean;
  autoSaveInterval: number;
}

export class GameSessionRepository implements IGameSessionRepository {
  private readonly SAVE_KEY_PREFIX = 'dnd_save_';
  private readonly AUTO_SAVE_KEY = 'dnd_autosave';
  private readonly METADATA_KEY = 'dnd_save_metadata';

  /**
   * Sauvegarder une session de jeu
   */
  async save(session: GameSession): Promise<boolean> {
    try {
      logger.repo(`Saving game session: ${session.sessionId}`);

      const serialized = this.serializeSession(session);
      const saveKey = this.getSaveKey(session.sessionId);
      
      // Sauvegarder la session
      localStorage.setItem(saveKey, JSON.stringify(serialized));
      
      // Mettre à jour les métadonnées
      await this.updateMetadata(session);
      
      logger.repo(`Game session saved successfully: ${session.sessionId}`);
      return true;

    } catch (error) {
      logger.error('SAVE_SESSION', `Failed to save session ${session.sessionId}`, { error });
      return false;
    }
  }

  /**
   * Charger une session par son ID
   */
  async load(sessionId: string): Promise<GameSession | null> {
    try {
      logger.repo(`Loading game session: ${sessionId}`);

      const saveKey = this.getSaveKey(sessionId);
      const serializedData = localStorage.getItem(saveKey);
      
      if (!serializedData) {
        logger.repo(`Save not found: ${sessionId}`);
        return null;
      }

      const serialized: SerializedGameSession = JSON.parse(serializedData);
      const session = this.deserializeSession(serialized);
      
      logger.repo(`Game session loaded successfully: ${sessionId}`);
      return session;

    } catch (error) {
      logger.error('LOAD_SESSION', `Failed to load session ${sessionId}`, { error });
      return null;
    }
  }

  /**
   * Obtenir toutes les sauvegardes disponibles
   */
  async getAllSaves(): Promise<SaveMetadata[]> {
    try {
      logger.repo('Getting all saves metadata');

      const metadataJson = localStorage.getItem(this.METADATA_KEY);
      if (!metadataJson) {
        return [];
      }

      const allMetadata: SaveMetadata[] = JSON.parse(metadataJson);
      
      // Filtrer les sauvegardes qui existent encore
      const existingSaves = allMetadata.filter(metadata => 
        localStorage.getItem(this.getSaveKey(metadata.saveId)) !== null
      );

      // Trier par date de sauvegarde (plus récente en premier)
      existingSaves.sort((a, b) => 
        new Date(b.lastSaved).getTime() - new Date(a.lastSaved).getTime()
      );

      logger.repo('All saves retrieved', { count: existingSaves.length });
      return existingSaves;

    } catch (error) {
      logger.error('GET_ALL_SAVES', 'Failed to get saves metadata', { error });
      return [];
    }
  }

  /**
   * Supprimer une sauvegarde
   */
  async delete(sessionId: string): Promise<boolean> {
    try {
      logger.repo(`Deleting save: ${sessionId}`);

      const saveKey = this.getSaveKey(sessionId);
      localStorage.removeItem(saveKey);
      
      // Mettre à jour les métadonnées
      await this.removeFromMetadata(sessionId);
      
      logger.repo(`Save deleted successfully: ${sessionId}`);
      return true;

    } catch (error) {
      logger.error('DELETE_SAVE', `Failed to delete save ${sessionId}`, { error });
      return false;
    }
  }

  /**
   * Vérifier si une sauvegarde existe
   */
  async exists(sessionId: string): Promise<boolean> {
    const saveKey = this.getSaveKey(sessionId);
    const exists = localStorage.getItem(saveKey) !== null;
    
    logger.repo(`Save existence check: ${sessionId}`, { exists });
    return exists;
  }

  /**
   * Obtenir les métadonnées d'une sauvegarde
   */
  async getMetadata(sessionId: string): Promise<SaveMetadata | null> {
    try {
      const allSaves = await this.getAllSaves();
      const metadata = allSaves.find(save => save.saveId === sessionId);
      
      logger.repo(`Metadata requested: ${sessionId}`, { found: !!metadata });
      return metadata || null;

    } catch (error) {
      logger.error('GET_METADATA', `Failed to get metadata for ${sessionId}`, { error });
      return null;
    }
  }

  /**
   * Sauvegarder automatiquement
   */
  async autoSave(session: GameSession): Promise<boolean> {
    try {
      logger.repo(`Auto-saving session: ${session.sessionId}`);

      const serialized = this.serializeSession(session);
      localStorage.setItem(this.AUTO_SAVE_KEY, JSON.stringify(serialized));
      
      logger.repo('Auto-save completed');
      return true;

    } catch (error) {
      logger.error('AUTO_SAVE', 'Auto-save failed', { error });
      return false;
    }
  }

  /**
   * Obtenir la dernière sauvegarde automatique
   */
  async getLastAutoSave(): Promise<GameSession | null> {
    try {
      logger.repo('Loading auto-save');

      const autoSaveData = localStorage.getItem(this.AUTO_SAVE_KEY);
      if (!autoSaveData) {
        logger.repo('No auto-save found');
        return null;
      }

      const serialized: SerializedGameSession = JSON.parse(autoSaveData);
      const session = this.deserializeSession(serialized);
      
      logger.repo('Auto-save loaded successfully');
      return session;

    } catch (error) {
      logger.error('LOAD_AUTO_SAVE', 'Failed to load auto-save', { error });
      return null;
    }
  }

  /**
   * Nettoyer les anciennes sauvegardes automatiques
   */
  async cleanupAutoSaves(keepLast: number): Promise<number> {
    // Pour cette implémentation simple, on garde juste la dernière auto-save
    // Dans une implémentation plus avancée, on pourrait avoir plusieurs auto-saves numérotées
    logger.repo('Auto-save cleanup completed', { kept: 1 });
    return 0; // Pas de nettoyage nécessaire avec une seule auto-save
  }

  // MÉTHODES PRIVÉES

  /**
   * Sérialiser une session pour le stockage
   */
  private serializeSession(session: GameSession): SerializedGameSession {
    return {
      sessionId: session.sessionId,
      createdAt: session.createdAt.toISOString(),
      lastSavedAt: session.lastSavedAt?.toISOString(),
      currentPhase: session.currentPhase,
      difficulty: session.difficulty,
      gameTime: session.gameTime,
      flags: session.getAllFlags(),
      metrics: session.metrics,
      currentSceneId: session.currentSceneId,
      sceneHistory: [...session.sceneHistory],
      playerCharacter: this.serializeCharacter(session.playerCharacter),
      companions: session.companions.map(c => this.serializeCharacter(c)),
      autoSaveEnabled: session.autoSaveEnabled,
      autoSaveInterval: session.autoSaveInterval
    };
  }

  /**
   * Désérialiser une session depuis le stockage
   */
  private deserializeSession(serialized: SerializedGameSession): GameSession {
    // Recréer le personnage joueur
    const playerCharacter = this.deserializeCharacter(serialized.playerCharacter);
    
    // Créer la session de base
    let session = new GameSession(
      serialized.sessionId,
      playerCharacter,
      serialized.currentSceneId,
      serialized.difficulty as any
    );

    // Restaurer l'état
    (session as any)._createdAt = new Date(serialized.createdAt);
    if (serialized.lastSavedAt) {
      (session as any)._lastSavedAt = new Date(serialized.lastSavedAt);
    }
    
    (session as any)._currentPhase = serialized.currentPhase;
    (session as any)._gameTime = serialized.gameTime;
    (session as any)._metrics = serialized.metrics;
    (session as any)._sceneHistory = [...serialized.sceneHistory];
    (session as any)._autoSaveEnabled = serialized.autoSaveEnabled;
    (session as any)._autoSaveInterval = serialized.autoSaveInterval;

    // Restaurer les flags
    for (const [key, value] of Object.entries(serialized.flags)) {
      session.setFlag(key, value);
    }

    // Restaurer les compagnons
    for (const companionData of serialized.companions) {
      const companion = this.deserializeCharacter(companionData);
      session = session.withAddedCompanion(companion);
    }

    return session;
  }

  /**
   * Sérialiser un personnage
   */
  private serializeCharacter(character: Character): any {
    return {
      id: character.id,
      name: character.name,
      level: character.level,
      xp: character.xp,
      classData: character.classData,
      raceId: character.raceId,
      baseStats: character.baseStats,
      inventory: character.inventory, // ⚠️ IMPORTANT: Sauvegarder l'inventory
      knownSpells: character.knownSpells,
      preparedSpells: character.preparedSpells,
      currentHP: character.currentHP,
      gold: character.gold,
      position: character.position,
      // Propriétés calculées (à recalculer à la désérialisation)
      maxHP: character.maxHP,
      armorClass: character.armorClass,
      speed: character.speed
    };
  }

  /**
   * Désérialiser un personnage
   */
  private deserializeCharacter(data: any): Character {
    // Utiliser le nouveau constructeur de Character avec toutes les propriétés
    const characterProps = {
      id: data.id,
      name: data.name,
      level: data.level,
      xp: data.xp,
      classData: data.classData,
      raceId: data.raceId,
      baseStats: data.baseStats,
      inventory: data.inventory, // ⚠️ IMPORTANT: Restaurer l'inventory
      knownSpellIds: data.knownSpells || [],
      currentHP: data.currentHP,
      gold: data.gold,
      position: data.position,
      preparedSpells: data.preparedSpells || []
    };
    
    return new Character(characterProps);
  }

  /**
   * Obtenir la clé de sauvegarde pour un sessionId
   */
  private getSaveKey(sessionId: string): string {
    return `${this.SAVE_KEY_PREFIX}${sessionId}`;
  }

  /**
   * Mettre à jour les métadonnées globales
   */
  private async updateMetadata(session: GameSession): Promise<void> {
    try {
      const allMetadata = await this.getAllSaves();
      const newMetadata = session.getSaveMetadata();
      
      // Remplacer ou ajouter les métadonnées de cette session
      const existingIndex = allMetadata.findIndex(m => m.saveId === session.sessionId);
      if (existingIndex !== -1) {
        allMetadata[existingIndex] = newMetadata;
      } else {
        allMetadata.push(newMetadata);
      }

      localStorage.setItem(this.METADATA_KEY, JSON.stringify(allMetadata));
      
    } catch (error) {
      logger.error('UPDATE_METADATA', 'Failed to update metadata', { error });
    }
  }

  /**
   * Supprimer des métadonnées
   */
  private async removeFromMetadata(sessionId: string): Promise<void> {
    try {
      const allMetadata = await this.getAllSaves();
      const filteredMetadata = allMetadata.filter(m => m.saveId !== sessionId);
      
      localStorage.setItem(this.METADATA_KEY, JSON.stringify(filteredMetadata));
      
    } catch (error) {
      logger.error('REMOVE_METADATA', 'Failed to remove metadata', { error });
    }
  }
}