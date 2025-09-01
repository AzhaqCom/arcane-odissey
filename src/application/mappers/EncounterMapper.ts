/**
 * APPLICATION - EncounterMapper
 * Mapper pour convertir les données de scène en encounters de combat
 * Responsabilité: Transformation de données selon Règle #5
 */

import type { CombatSceneContent } from '../../infrastructure/data/types/SceneData';
import type { EnemyEncounter } from '../usecases/CombatUseCase';
import type { Position } from '../../domain/entities/Combat';

export class EncounterMapper {
  
  /**
   * Convertir le contenu d'une scène de combat en encounters d'ennemis
   * @param content Le contenu de la scène de combat
   * @returns Liste des encounters d'ennemis formatés pour le CombatUseCase
   */
  static sceneContentToEnemyEncounters(content: CombatSceneContent): EnemyEncounter[] {
    return content.enemies.map(enemyDef => {
      const positions: Position[] = [enemyDef.position];
      
      // Ajouter les positions alternatives si présentes
      if (enemyDef.alternativePositions) {
        positions.push(...enemyDef.alternativePositions);
      }
      
      return {
        templateId: enemyDef.templateId,
        count: enemyDef.count || 1,
        positions: positions
      };
    });
  }

  /**
   * Obtenir les positions initiales des joueurs depuis le contenu de scène
   * @param content Le contenu de la scène de combat
   * @returns Record des positions initiales par ID de joueur
   */
  static getPlayerInitialPositions(content: CombatSceneContent): Record<string, Position> {
    return {
      'Elarion': content.combat?.playerStartPosition || { x: 2, y: 6 }
    };
  }
}