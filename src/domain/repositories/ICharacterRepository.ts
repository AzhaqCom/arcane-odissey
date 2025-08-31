/**
 * DOMAIN REPOSITORY INTERFACE - ICharacterRepository
 * Interface pour la persistance des personnages
 */

import { Character } from '../entities/Character';
import type { DomainEnemyDataSource, DomainEnemyTemplate } from '../types';

export interface ICharacterRepository {
  getById(id: string): Promise<Character | null>;
  getAll(): Promise<Character[]>;
  save(character: Character): Promise<void>;
  delete(id: string): Promise<void>;
  getPlayerCharacters(): Promise<Character[]>;
  getCompanions(): Promise<Character[]>;
  getEnemyDataSourceById(id: string): Promise<DomainEnemyDataSource | null>;

  /**
   * Obtenir le modèle (template) d'un ennemi par son ID.
   */
  getEnemyTemplateById(id: string): Promise<DomainEnemyTemplate | null>;
}