/**
 * DOMAIN REPOSITORY INTERFACE - IGameSessionRepository
 * Contrat pour la persistance des sessions de jeu
 */

import { GameSession } from '../entities';
import type { SaveMetadata } from '../entities';

export interface IGameSessionRepository {
  /**
   * Sauvegarder une session de jeu
   */
  save(session: GameSession): Promise<boolean>;
  
  /**
   * Charger une session par son ID
   */
  load(sessionId: string): Promise<GameSession | null>;
  
  /**
   * Obtenir toutes les sauvegardes disponibles
   */
  getAllSaves(): Promise<SaveMetadata[]>;
  
  /**
   * Supprimer une sauvegarde
   */
  delete(sessionId: string): Promise<boolean>;
  
  /**
   * Vérifier si une sauvegarde existe
   */
  exists(sessionId: string): Promise<boolean>;
  
  /**
   * Obtenir les métadonnées d'une sauvegarde sans la charger
   */
  getMetadata(sessionId: string): Promise<SaveMetadata | null>;
  
  /**
   * Sauvegarder automatiquement (sauvegarde rapide)
   */
  autoSave(session: GameSession): Promise<boolean>;
  
  /**
   * Obtenir la dernière sauvegarde automatique
   */
  getLastAutoSave(): Promise<GameSession | null>;
  
  /**
   * Nettoyer les anciennes sauvegardes automatiques
   */
  cleanupAutoSaves(keepLast: number): Promise<number>;
}