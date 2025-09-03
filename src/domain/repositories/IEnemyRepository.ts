/**
 * DOMAIN REPOSITORY - IEnemyRepository
 * Interface pure pour la récupération des ennemis
 * Respecte ARCHITECTURE_GUIDELINES.md - Règle #1 Pureté du domaine
 */

import type { Enemy } from '../entities/Enemy';
import type { DomainEnemyTemplate } from '../types/Enemy';

/**
 * Repository pour gérer les ennemis
 * L'implémentation concrète sera dans Infrastructure
 */
export interface IEnemyRepository {
  /**
   * Récupère les templates d'ennemis pour une scène donnée
   * @param sceneId - ID de la scène
   * @returns Promise avec les ennemis de la scène
   */
  getEnemiesByScene(sceneId: string): Promise<Enemy[]>;
  
  /**
   * Récupère un template d'ennemi par son ID
   * @param templateId - ID du template (ex: "goblin", "orc_warrior")
   * @returns Promise avec le template ou null si non trouvé
   */
  getTemplate(templateId: string): Promise<DomainEnemyTemplate | null>;
  
  /**
   * Récupère plusieurs templates
   * @param templateIds - Liste des IDs de templates
   * @returns Promise avec les templates trouvés
   */
  getTemplates(templateIds: string[]): Promise<DomainEnemyTemplate[]>;
  
  /**
   * Sauvegarde l'état d'un ennemi (HP, position, etc.)
   * @param enemy - L'ennemi à sauvegarder
   */
  saveEnemyState(enemy: Enemy): Promise<void>;
  
  /**
   * Récupère un ennemi par son ID unique
   * @param enemyId - ID unique de l'instance (ex: "goblin_1")
   * @returns Promise avec l'ennemi ou null
   */
  getEnemyById(enemyId: string): Promise<Enemy | null>;
}