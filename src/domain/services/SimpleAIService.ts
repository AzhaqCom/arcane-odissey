/**
 * DOMAIN SERVICE - SimpleAIService
 * Service de décisions AI pures pour combat D&D 5E
 * Respecte ARCHITECTURE_GUIDELINES.md - Règle #5 Fonctions Pures
 */

import type { CombatEntity, CombatAction, CombatState, Position } from '../entities/CombatEngine';
import type { DiceRollingService } from './DiceRollingService';
import type { ILogger } from './ILogger';
import type { WeaponResolutionService } from './WeaponResolutionService';

/**
 * SERVICE AI SIMPLE ET PUR
 * ✅ Toutes les méthodes sont pures (pas d'état interne)
 * ✅ Décisions basées uniquement sur les paramètres d'entrée
 * ✅ Comportements AI variés mais prévisibles
 */
export class SimpleAIService {
  private diceRollingService: DiceRollingService;
  private weaponResolutionService: WeaponResolutionService;
  private logger: ILogger;
  
  constructor(diceRollingService: DiceRollingService, weaponResolutionService: WeaponResolutionService, logger: ILogger) {
    this.diceRollingService = diceRollingService;
    this.weaponResolutionService = weaponResolutionService;
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
   * ✅ FONCTIONNALITÉ 2 - Comportement AGRESSIF avec mouvement tactique
   * L'IA peut combiner mouvement + attaque dans le même tour
   */
  private calculateAggressiveAction(entity: CombatEntity, combatState: CombatState): CombatAction {
    const enemies = this.getEnemiesOf(entity, combatState.entities);
    
    if (enemies.length === 0) {
      return { type: 'end_turn', entityId: entity.id };
    }

    const closestEnemy = this.findClosestEnemy(entity, enemies);
    const currentDistance = this.calculateDistance(entity.position, closestEnemy.position);
    
    // ✅ LOGIQUE TACTIQUE D&D : Évaluer portée d'attaque selon l'arme
    const attackRange = this.getAttackRange(entity);
    const canAttackFromCurrentPosition = currentDistance <= attackRange;
    
    // Si trop loin pour attaquer avec l'arme actuelle, se rapprocher
    if (!canAttackFromCurrentPosition && entity.actionsRemaining.movement > 0) {
      const optimalPosition = this.findOptimalAttackPosition(entity, closestEnemy, combatState, attackRange);
      
      if (optimalPosition) {
        this.logger.debug('SIMPLE_AI', 'Moving for optimal attack range', {
          entityName: entity.name,
          targetName: closestEnemy.name,
          currentDistance,
          attackRange,
          weaponType: this.getWeaponType(entity),
          movingTo: optimalPosition
        });
        
        return {
          type: 'move_and_attack',
          entityId: entity.id,
          position: optimalPosition,
          targetId: closestEnemy.id
        };
      }
    }
    
    // Si déjà à portée selon l'arme, attaquer directement
    if (canAttackFromCurrentPosition && entity.actionsRemaining.action) {
      return {
        type: 'attack',
        entityId: entity.id,
        targetId: closestEnemy.id
      };
    }
    
    // Sinon juste se déplacer
    if (entity.actionsRemaining.movement > 0) {
      const movePosition = this.findOptimalMovePosition(entity, closestEnemy, combatState);
      if (movePosition) {
        return {
          type: 'move',
          entityId: entity.id,
          position: movePosition
        };
      }
    }

    return { type: 'end_turn', entityId: entity.id };
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
   * ✅ RÈGLE #3 : Logique métier dans Domain
   * Déterminer portée d'attaque selon l'arme équipée
   */
  private getAttackRange(entity: CombatEntity): number {
    const weapon = this.weaponResolutionService.resolveWeaponForEntity(entity);
    return weapon ? weapon.getAttackRange() : 1; // Mains nues = 1 case
  }

  /**
   * ✅ RÈGLE #3 : Logique métier dans Domain
   * Identifier type d'arme équipée pour logs
   */
  private getWeaponType(entity: CombatEntity): string {
    const weapon = this.weaponResolutionService.resolveWeaponForEntity(entity);
    if (!weapon) return 'unarmed';
    return weapon.category;
  }

  /**
   * ✅ FONCTIONNALITÉ 2 - Trouver position optimale pour attaque
   * Respecte la portée d'arme : adjacent pour corps à corps, distance pour ranged
   */
  private findOptimalAttackPosition(entity: CombatEntity, target: CombatEntity, combatState: CombatState, attackRange: number): Position | null {
    const movementRange = Math.floor(entity.actionsRemaining.movement / 5); // 5 feet par case
    const { x: startX, y: startY } = entity.position;
    const { x: targetX, y: targetY } = target.position;

    let bestPosition: Position | null = null;
    let bestScore = -1;

    // Grille 12x8 standard
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 12; x++) {
        // Position atteignable avec le mouvement ?
        const distanceFromStart = Math.abs(x - startX) + Math.abs(y - startY);
        if (distanceFromStart > movementRange || distanceFromStart === 0) continue;

        // Position libre ?
        const isOccupied = combatState.entities.some(e => 
          !e.isDead && e.position.x === x && e.position.y === y
        );
        if (isOccupied) continue;

        // Distance à la cible depuis cette position
        const distanceToTarget = Math.abs(x - targetX) + Math.abs(y - targetY);
        
        // Position dans la portée d'attaque ?
        if (distanceToTarget <= attackRange) {
          let score = 100 - distanceFromStart; // Préférer positions plus proches de nous
          
          // Bonus pour distance optimale selon type d'arme
          if (attackRange === 1) {
            // Corps à corps : distance 1 parfaite
            if (distanceToTarget === 1) score += 50;
          } else {
            // Armes à distance : éviter d'être trop proche (désavantage)
            if (distanceToTarget > 1) score += 20;
            if (distanceToTarget >= 3 && distanceToTarget <= attackRange) score += 30;
          }
          
          if (score > bestScore) {
            bestScore = score;
            bestPosition = { x, y };
          }
        }
      }
    }

    return bestPosition;
  }

  /**
   * ✅ FONCTIONNALITÉ 2 - Position pour mouvement simple (se rapprocher)
   */
  private findOptimalMovePosition(entity: CombatEntity, target: CombatEntity, combatState: CombatState): Position | null {
    const movementRange = Math.floor(entity.actionsRemaining.movement / 5);
    const { x: startX, y: startY } = entity.position;
    const { x: targetX, y: targetY } = target.position;

    let bestPosition: Position | null = null;
    let bestDistance = Infinity;

    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 12; x++) {
        // Atteignable ?
        const distanceFromStart = Math.abs(x - startX) + Math.abs(y - startY);
        if (distanceFromStart > movementRange || distanceFromStart === 0) continue;

        // Libre ?
        const isOccupied = combatState.entities.some(e => 
          !e.isDead && e.position.x === x && e.position.y === y
        );
        if (isOccupied) continue;

        // Plus proche de la cible ?
        const distanceToTarget = Math.abs(x - targetX) + Math.abs(y - targetY);
        if (distanceToTarget < bestDistance) {
          bestDistance = distanceToTarget;
          bestPosition = { x, y };
        }
      }
    }

    return bestPosition;
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