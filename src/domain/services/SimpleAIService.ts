/**
 * DOMAIN SERVICE - SimpleAIService
 * Service de décisions AI pures pour combat D&D 5E
 * Respecte ARCHITECTURE_GUIDELINES.md - Règle #5 Fonctions Pures
 */

import type { CombatEntity, CombatAction, CombatState } from '../entities/CombatEngine';
import type { DiceRollingService } from './DiceRollingService';
import type { ILogger } from './ILogger';

/**
 * SERVICE AI SIMPLE ET PUR
 * ✅ Toutes les méthodes sont pures (pas d'état interne)
 * ✅ Décisions basées uniquement sur les paramètres d'entrée
 * ✅ Comportements AI variés mais prévisibles
 */
export class SimpleAIService {
  private diceRollingService: DiceRollingService;
  private logger: ILogger;
  
  constructor(diceRollingService: DiceRollingService, logger: ILogger) {
    this.diceRollingService = diceRollingService;
    this.logger = logger;
  }

  /**
   * Calculer l'action AI pour une entité (fonction pure)
   * Retourne une action basée sur le comportement de l'entité
   */
  calculateAIAction(entity: CombatEntity, combatState: CombatState): CombatAction {
    this.logger.debug('SIMPLE_AI', 'Calculating AI action', {
      entityId: entity.id,
      entityName: entity.name,
      behavior: entity.aiBehavior,
      hasAction: entity.actionsRemaining.action,
      hitPoints: entity.hitPoints
    });

    // Si l'entité ne peut pas agir, terminer le tour
    if (!entity.actionsRemaining.action || entity.isDead) {
      return {
        type: 'end_turn',
        entityId: entity.id
      };
    }

    // Choisir l'action selon le comportement AI
    switch (entity.aiBehavior) {
      case 'aggressive':
        return this.calculateAggressiveAction(entity, combatState);
      case 'tactical':
        return this.calculateTacticalAction(entity, combatState);
      case 'defensive':
        return this.calculateDefensiveAction(entity, combatState);
      default:
        return this.calculateDefaultAction(entity, combatState);
    }
  }

  /**
   * Comportement AGRESSIF - Attaque toujours le plus proche
   */
  private calculateAggressiveAction(entity: CombatEntity, combatState: CombatState): CombatAction {
    const enemies = this.getEnemiesOf(entity, combatState.entities);
    
    if (enemies.length === 0) {
      return { type: 'end_turn', entityId: entity.id };
    }

    // Trouver l'ennemi le plus proche
    const closestEnemy = this.findClosestEnemy(entity, enemies);
    
    this.logger.debug('SIMPLE_AI', 'Aggressive behavior - attacking closest', {
      entityName: entity.name,
      targetName: closestEnemy.name,
      distance: this.calculateDistance(entity.position, closestEnemy.position)
    });

    return {
      type: 'attack',
      entityId: entity.id,
      targetId: closestEnemy.id
    };
  }

  /**
   * Comportement TACTIQUE - Attaque le plus faible ou se positionne
   */
  private calculateTacticalAction(entity: CombatEntity, combatState: CombatState): CombatAction {
    const enemies = this.getEnemiesOf(entity, combatState.entities);
    
    if (enemies.length === 0) {
      return { type: 'end_turn', entityId: entity.id };
    }

    // 70% de chance d'attaquer, 30% de se déplacer tactiquement
    const actionChoice = this.diceRollingService.roll('1d100');
    
    if (actionChoice <= 70) {
      // Attaquer l'ennemi le plus faible (moins de HP)
      const weakestEnemy = enemies.reduce((weakest, current) => 
        current.hitPoints < weakest.hitPoints ? current : weakest
      );

      this.logger.debug('SIMPLE_AI', 'Tactical behavior - attacking weakest', {
        entityName: entity.name,
        targetName: weakestEnemy.name,
        targetHP: weakestEnemy.hitPoints
      });

      return {
        type: 'attack',
        entityId: entity.id,
        targetId: weakestEnemy.id
      };
    } else {
      // Se déplacer vers une position tactique (si a du mouvement)
      if (entity.actionsRemaining.movement > 0) {
        const tacticalPosition = this.findTacticalPosition(entity, combatState);
        
        this.logger.debug('SIMPLE_AI', 'Tactical behavior - repositioning', {
          entityName: entity.name,
          newPosition: tacticalPosition
        });

        return {
          type: 'move',
          entityId: entity.id,
          position: tacticalPosition
        };
      }
      
      // Pas de mouvement, attaquer quand même
      const closestEnemy = this.findClosestEnemy(entity, enemies);
      return {
        type: 'attack',
        entityId: entity.id,
        targetId: closestEnemy.id
      };
    }
  }

  /**
   * Comportement DÉFENSIF - Se protège si blessé, sinon attaque à distance
   */
  private calculateDefensiveAction(entity: CombatEntity, combatState: CombatState): CombatAction {
    const healthPercentage = entity.hitPoints / entity.maxHitPoints;
    const enemies = this.getEnemiesOf(entity, combatState.entities);
    
    if (enemies.length === 0) {
      return { type: 'end_turn', entityId: entity.id };
    }

    // Si très blessé (< 25% HP), essayer de fuir
    if (healthPercentage < 0.25 && entity.actionsRemaining.movement > 0) {
      const safePosition = this.findSafePosition(entity, enemies);
      
      this.logger.debug('SIMPLE_AI', 'Defensive behavior - retreating', {
        entityName: entity.name,
        healthPercentage,
        newPosition: safePosition
      });

      return {
        type: 'move',
        entityId: entity.id,
        position: safePosition
      };
    }

    // Sinon, attaquer l'ennemi le plus dangereux (niveau le plus élevé)
    const mostDangerousEnemy = enemies.reduce((dangerous, current) =>
      current.level > dangerous.level ? current : dangerous
    );

    this.logger.debug('SIMPLE_AI', 'Defensive behavior - attacking dangerous', {
      entityName: entity.name,
      targetName: mostDangerousEnemy.name,
      targetLevel: mostDangerousEnemy.level
    });

    return {
      type: 'attack',
      entityId: entity.id,
      targetId: mostDangerousEnemy.id
    };
  }

  /**
   * Comportement par DÉFAUT - Attaque aléatoire
   */
  private calculateDefaultAction(entity: CombatEntity, combatState: CombatState): CombatAction {
    const enemies = this.getEnemiesOf(entity, combatState.entities);
    
    if (enemies.length === 0) {
      return { type: 'end_turn', entityId: entity.id };
    }

    // Choisir un ennemi au hasard
    const randomIndex = this.diceRollingService.roll(`1d${enemies.length}`) - 1;
    const randomEnemy = enemies[randomIndex];

    this.logger.debug('SIMPLE_AI', 'Default behavior - random attack', {
      entityName: entity.name,
      targetName: randomEnemy.name,
      enemiesCount: enemies.length
    });

    return {
      type: 'attack',
      entityId: entity.id,
      targetId: randomEnemy.id
    };
  }

  // === FONCTIONS UTILITAIRES PURES ===

  /**
   * Obtenir les ennemis d'une entité (fonction pure)
   */
  private getEnemiesOf(entity: CombatEntity, allEntities: CombatEntity[]): CombatEntity[] {
    if (entity.type === 'enemy') {
      return allEntities.filter(e => 
        (e.type === 'player' || e.type === 'ally') && !e.isDead && e.isActive
      );
    }
    return allEntities.filter(e => 
      e.type === 'enemy' && !e.isDead && e.isActive
    );
  }

  /**
   * Trouver l'ennemi le plus proche (fonction pure)
   */
  private findClosestEnemy(entity: CombatEntity, enemies: CombatEntity[]): CombatEntity {
    return enemies.reduce((closest, current) => {
      const currentDistance = this.calculateDistance(entity.position, current.position);
      const closestDistance = this.calculateDistance(entity.position, closest.position);
      return currentDistance < closestDistance ? current : closest;
    });
  }

  /**
   * Calculer la distance entre deux positions (fonction pure)
   */
  private calculateDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y); // Distance Manhattan
  }

  /**
   * Trouver une position tactique (fonction pure)
   */
  private findTacticalPosition(entity: CombatEntity, combatState: CombatState): { x: number; y: number } {
    // Position tactique simple : se rapprocher du centre des ennemis
    const enemies = this.getEnemiesOf(entity, combatState.entities);
    
    if (enemies.length === 0) {
      return entity.position; // Pas de changement
    }

    const centerX = Math.round(enemies.reduce((sum, e) => sum + e.position.x, 0) / enemies.length);
    const centerY = Math.round(enemies.reduce((sum, e) => sum + e.position.y, 0) / enemies.length);

    // Se rapprocher du centre, mais pas trop
    const deltaX = centerX > entity.position.x ? 1 : -1;
    const deltaY = centerY > entity.position.y ? 1 : -1;

    return {
      x: Math.max(0, Math.min(11, entity.position.x + deltaX)), // Grille 12x8
      y: Math.max(0, Math.min(7, entity.position.y + deltaY))
    };
  }

  /**
   * Trouver une position sûre pour fuir (fonction pure)
   */
  private findSafePosition(entity: CombatEntity, enemies: CombatEntity[]): { x: number; y: number } {
    // Position de fuite : s'éloigner du centre des ennemis
    if (enemies.length === 0) {
      return entity.position;
    }

    const centerX = enemies.reduce((sum, e) => sum + e.position.x, 0) / enemies.length;
    const centerY = enemies.reduce((sum, e) => sum + e.position.y, 0) / enemies.length;

    // S'éloigner du centre
    const deltaX = entity.position.x > centerX ? 2 : -2;
    const deltaY = entity.position.y > centerY ? 2 : -2;

    return {
      x: Math.max(0, Math.min(11, entity.position.x + deltaX)),
      y: Math.max(0, Math.min(7, entity.position.y + deltaY))
    };
  }
}