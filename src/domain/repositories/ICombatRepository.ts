/**
 * DOMAIN REPOSITORY INTERFACE - ICombatRepository
 * Interface pour la persistance des combats et sessions
 */

import { Combat } from '../entities/Combat';
import { CombatSession } from '../entities/CombatSession';

export interface ICombatRepository {
  /**
   * Obtenir le combat actuel (legacy)
   * @deprecated Utiliser getActiveSession() à la place
   */
  getCombat(): Promise<Combat | null>;
  
  /**
   * Sauvegarder un combat (legacy)
   * @deprecated Utiliser saveSession() à la place
   */
  saveCombat(combat: Combat): Promise<void>;

  /**
   * Obtenir la session de combat active
   */
  getActiveSession(): Promise<CombatSession | null>;

  /**
   * Sauvegarder une session de combat
   */
  saveSession(session: CombatSession): Promise<void>;

  /**
   * Terminer la session active
   */
  endActiveSession(): Promise<void>;
}