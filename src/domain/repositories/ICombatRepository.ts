/**
 * DOMAIN REPOSITORY INTERFACE - ICombatRepository
 * Interface pour la persistance des combats
 */

import { Combat } from '../entities/Combat';

export interface ICombatRepository {
  /**
   * Obtenir le combat actuel
   */
  getCombat(): Promise<Combat | null>;
  
  /**
   * Sauvegarder un combat
   */
  saveCombat(combat: Combat): Promise<void>;
}