/**
 * APPLICATION LAYER - Enemy Mapper
 * Conversion entre les données ennemis infrastructure et domaine
 */

import type { EnemySpec, AbilityScores, Position } from '../../domain/types';
import type { EnemyDataSource } from '../../infrastructure/data/types/CharacterData';
import type { EnemyTemplate } from '../../infrastructure/data/characters/enemies';

/**
 * Mapper pour convertir les données ennemis
 */
export class EnemyMapper {

  /**
   * Convertit EnemyDataSource + EnemyTemplate vers EnemySpec (domaine)
   */
  static infraToEnemySpec(
    dataSource: EnemyDataSource,
    template: EnemyTemplate
  ): {
    enemySpec: EnemySpec;
    baseStats: AbilityScores;
    maxHp: number;
    armorClass: number;
    speed: number;
    level: number;
  } {
    const enemySpec: EnemySpec = {
      id: dataSource.id,
      name: template.name,
      templateId: dataSource.templateId,
      currentHp: dataSource.savedState.currentHp,
      position: dataSource.savedState.position ? {
        x: dataSource.savedState.position.x,
        y: dataSource.savedState.position.y
      } : undefined,
    };

    return {
      enemySpec,
      baseStats: this.mapAbilityScores(template.baseAbilities),
      maxHp: template.maxHp,
      armorClass: template.armorClass,
      speed: template.speed,
      level: template.level,
    };
  }

  /**
   * Crée un EnemyDataSource simple à partir d'un template et d'une position
   */
  static createEnemyDataSource(
    templateId: string,
    instanceId: string,
    template: EnemyTemplate,
    position?: Position
  ): EnemyDataSource {
    return {
      id: instanceId,
      type: 'enemy',
      name: template.name,
      templateId: templateId,
      savedState: {
        currentHp: template.maxHp,
        position: position,
      },
    };
  }

  // === MÉTHODES PRIVÉES ===

  private static mapAbilityScores(infraAbilities: any): AbilityScores {
    return {
      strength: infraAbilities.strength || 10,
      dexterity: infraAbilities.dexterity || 10,
      constitution: infraAbilities.constitution || 10,
      intelligence: infraAbilities.intelligence || 10,
      wisdom: infraAbilities.wisdom || 10,
      charisma: infraAbilities.charisma || 10,
    };
  }
}