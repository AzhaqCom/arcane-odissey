/**
 * DOMAIN FACTORY - CombatFactory
 * Factory pour créer et initialiser un combat depuis les données de scène
 * Respecte ARCHITECTURE_GUIDELINES.md - Règle #1 Domain-First
 * TOUTE la logique de création du combat est ici
 */

import { CombatEngine, type CombatEntity, type CombatDependencies } from '../entities/CombatEngine';
import { Enemy } from '../entities/Enemy';
import type { Character } from '../entities/Character';
import type { 
  CombatInitializationData, 
  CombatSceneConfig, 
  EnemySpawnSpec,
  DomainEnemyTemplate,
  Position 
} from '../types';

/**
 * Factory responsable de la création et configuration des combats
 * Centralise toute la logique métier de création
 */
export class CombatFactory {
  
  /**
   * Crée un CombatEngine complètement initialisé depuis les données de scène
   * @param data - Données d'initialisation collectées par l'Application Layer
   * @param dependencies - Services injectés (dice, damage, logger)
   * @returns CombatEngine prêt à démarrer
   */
  static createFromSceneData(
    data: CombatInitializationData,
    dependencies: CombatDependencies
  ): CombatEngine {
    // 1. Créer l'entité du joueur avec sa position de départ
    const playerEntity = this.createPlayerEntity(
      data.character,
      data.sceneConfig.playerStartPosition
    );
    
    // 2. Créer les entités ennemies depuis les templates et specs
    const enemyEntities = this.createEnemiesFromConfig(
      data.enemyTemplates,
      data.sceneConfig.enemySpecs
    );
    
    // 3. Créer et configurer le CombatEngine
    let combat = CombatEngine.create(dependencies);
    
    // 4. Ajouter le joueur
    combat = combat.withAddedEntity(playerEntity);
    
    // 5. Ajouter tous les ennemis
    for (const enemy of enemyEntities) {
      combat = combat.withAddedEntity(enemy);
    }
    
    // 6. Rouler l'initiative pour déterminer l'ordre des tours
    combat = combat.withRolledInitiative();
    
    // 7. TODO: Appliquer les modificateurs de terrain si nécessaire
    // if (data.sceneConfig.terrain) {
    //   combat = this.applyTerrainModifiers(combat, data.sceneConfig.terrain);
    // }
    
    // 8. TODO: Gérer le round de surprise si configuré
    // if (data.sceneConfig.surpriseRound) {
    //   combat = combat.withSurpriseRound();
    // }
    
    return combat;
  }
  
  /**
   * Crée l'entité de combat du joueur
   * @private
   */
  private static createPlayerEntity(
    character: Character,
    startPosition: Position
  ): CombatEntity {
    const entity = character.toCombatEntity();
    
    // Remplacer la position par défaut par celle de la scène
    return {
      ...entity,
      position: startPosition
    };
  }
  
  /**
   * Crée toutes les entités ennemies depuis les specs et templates
   * @private
   */
  private static createEnemiesFromConfig(
    templates: ReadonlyArray<DomainEnemyTemplate>,
    enemySpecs: ReadonlyArray<EnemySpawnSpec>
  ): CombatEntity[] {
    const entities: CombatEntity[] = [];
    
    for (const spec of enemySpecs) {
      // Trouver le template correspondant
      const template = templates.find(t => t.id === spec.templateId);
      if (!template) {
        console.warn(`Template not found for enemy: ${spec.templateId}`);
        continue;
      }
      
      // Préparer les positions (principale + alternatives)
      const positions = this.prepareEnemyPositions(spec);
      
      // Créer les instances d'ennemis
      const enemies = this.createEnemyInstances(
        spec,
        template,
        positions
      );
      
      // Convertir en CombatEntity et ajouter à la liste
      for (const enemy of enemies) {
        entities.push(enemy.toCombatEntity());
      }
    }
    
    return entities;
  }
  
  /**
   * Prépare les positions pour les ennemis multiples
   * @private
   */
  private static prepareEnemyPositions(spec: EnemySpawnSpec): Position[] {
    const positions: Position[] = [spec.position];
    
    // Ajouter les positions alternatives si fournies
    if (spec.alternativePositions) {
      positions.push(...spec.alternativePositions);
    }
    
    // Si pas assez de positions pour le count, générer des positions adjacentes
    while (positions.length < spec.count) {
      const lastPos = positions[positions.length - 1];
      // Créer une position adjacente (simpliste pour l'instant)
      positions.push({
        x: lastPos.x + 1,
        y: lastPos.y
      });
    }
    
    return positions.slice(0, spec.count);
  }
  
  /**
   * Crée les instances d'Enemy avec IDs uniques
   * @private
   */
  private static createEnemyInstances(
    spec: EnemySpawnSpec,
    template: DomainEnemyTemplate,
    positions: Position[]
  ): Enemy[] {
    const enemies: Enemy[] = [];
    
    // Si un nom custom est fourni et qu'il y a plusieurs ennemis,
    // ajouter un numéro au nom
    const baseName = spec.customName || template.name;
    
    for (let i = 0; i < spec.count; i++) {
      const id = `${spec.templateId}_${i + 1}`;
      const name = spec.count > 1 ? `${baseName} ${i + 1}` : baseName;
      
      // Créer le template modifié si un level custom est spécifié
      let enemyTemplate = template;
      if (spec.level && spec.level !== template.level) {
        enemyTemplate = {
          ...template,
          level: spec.level,
          name: name
        };
      } else if (name !== template.name) {
        enemyTemplate = {
          ...template,
          name: name
        };
      }
      
      // Créer l'instance Enemy
      const enemy = new Enemy(
        id,
        enemyTemplate,
        enemyTemplate.maxHp,
        positions[i]
      );
      
      enemies.push(enemy);
    }
    
    return enemies;
  }
  
  /**
   * Applique les modificateurs de terrain au combat (TODO)
   * @private
   */
  // private static applyTerrainModifiers(
  //   combat: CombatEngine,
  //   terrain: ReadonlyArray<TerrainCell>
  // ): CombatEngine {
  //   // TODO: Implémenter la gestion du terrain
  //   // - Marquer les cellules difficiles
  //   // - Gérer les obstacles
  //   // - Appliquer les couvertures
  //   return combat;
  // }
}