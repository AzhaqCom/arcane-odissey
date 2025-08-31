/**
 * DOMAIN REPOSITORY INTERFACE - IEffectsRepository
 * Interface pour la persistance des effets
 */

import { EffectsManager } from '../entities/Effects';

export interface IEffectsRepository {
  /**
   * Obtenir le gestionnaire d'effets
   */
  getEffectsManager(): Promise<EffectsManager>;
  
  /**
   * Sauvegarder les effets
   */
  saveEffects(manager: EffectsManager): Promise<void>;
}