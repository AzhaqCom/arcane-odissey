/**
 * DOMAIN SERVICE - CombatActionService
 * Service de gestion des actions de combat et effets
 * Responsabilité : Exécuter les actions, sorts, mouvements et leurs effets (CQRS - Command side)
 */

import type { Combat, CombatEntity } from '../entities/Combat';
import type { Position } from '../types';
import type { GridPosition } from '../entities/TacticalGrid';
import type { Action, ActionCost } from '../entities/Action';
import type { Spell, SpellLevel } from '../entities/Spell';
import type { EntityResources } from '../entities/ActionValidator';
import type { DiceRollingService } from './DiceRollingService';

export interface ActionExecutionResult {
  readonly success: boolean;
  readonly damage?: number;
  readonly healing?: number;
  readonly message?: string;
}

export interface SpellCastingResult {
  readonly success: boolean;
  readonly damage?: number;
  readonly healing?: number;
  readonly spellSlotUsed?: SpellLevel;
  readonly message?: string;
}

/**
 * SERVICE D'EXÉCUTION D'ACTIONS COMBAT
 * Toutes les méthodes retournent un nouvel objet Combat (immutabilité)
 */
export class CombatActionService {
  private diceRollingService: DiceRollingService;

  constructor(diceRollingService: DiceRollingService) {
    this.diceRollingService = diceRollingService;
  }

  /**
   * Exécuter une action de combat
   */
  executeAction(
    combat: Combat,
    entityId: string, 
    action: Action, 
    targetId?: string
  ): { newCombat: Combat; result: ActionExecutionResult } {
    const entity = combat.entities.get(entityId);
    const targetEntity = targetId ? combat.entities.get(targetId) : undefined;
    
    if (!entity) {
      return {
        newCombat: combat,
        result: { success: false, message: `Entity ${entityId} not found` }
      };
    }

    // Vérifier les prérequis
    if (entity.isDead || !entity.isActive) {
      return {
        newCombat: combat,
        result: { success: false, message: 'Entity is not active' }
      };
    }

    if (!entity.actionsRemaining.action) {
      return {
        newCombat: combat,
        result: { success: false, message: 'No action remaining' }
      };
    }

    // Construire les ressources pour validation
    const resources: EntityResources = {
      actionsRemaining: entity.actionsRemaining,
      spellSlots: entity.spellSlots,
      spellcastingModifier: this.getSpellcastingModifier(entity)
    };

    // Consommer le coût de l'action
    let newCombat = this.withConsumedAction(combat, entityId, action.cost);
    
    // Appliquer les effets
    const effectResult = this.applyActionEffects(newCombat, action, entity, targetEntity, resources);
    
    return {
      newCombat: effectResult.newCombat,
      result: {
        success: true,
        damage: effectResult.damage,
        healing: effectResult.healing,
        message: 'Action executed successfully'
      }
    };
  }

  /**
   * Lancer un sort
   */
  castSpell(
    combat: Combat,
    entityId: string,
    spell: Spell,
    spellLevel: SpellLevel,
    targetId?: string
  ): { newCombat: Combat; result: SpellCastingResult } {
    const entity = combat.entities.get(entityId);
    const targetEntity = targetId ? combat.entities.get(targetId) : undefined;
    
    if (!entity) {
      return {
        newCombat: combat,
        result: { success: false, message: `Entity ${entityId} not found` }
      };
    }

    // Vérifications préalables
    if (entity.isDead || !entity.isActive) {
      return {
        newCombat: combat,
        result: { success: false, message: 'Entity is not active' }
      };
    }

    // Vérifier l'emplacement de sort disponible
    const availableSlots = entity.spellSlots[spellLevel] || 0;
    if (availableSlots <= 0) {
      return {
        newCombat: combat,
        result: { success: false, message: `No spell slot of level ${spellLevel} available` }
      };
    }

    // Vérifier l'action requise
    const actionCost: ActionCost = spell.castingTime === 'bonus_action' ? 'bonus_action' :
                      spell.castingTime === 'reaction' ? 'reaction' : 'action';
    
    if (!entity.actionsRemaining[actionCost]) {
      return {
        newCombat: combat,
        result: { success: false, message: `No ${actionCost} remaining` }
      };
    }

    // Consommer l'action et l'emplacement de sort
    let newCombat = this.withConsumedAction(combat, entityId, actionCost);
    newCombat = this.withSpellSlotConsumed(newCombat, entityId, spellLevel);

    // Gérer la concentration
    if (spell.concentration) {
      newCombat = this.withBrokenConcentration(newCombat, entityId);
      newCombat = this.withConcentrationStarted(newCombat, entityId, spell.id);
    }

    // Construire les ressources
    const resources: EntityResources = {
      actionsRemaining: entity.actionsRemaining,
      spellSlots: entity.spellSlots,
      spellcastingModifier: this.getSpellcastingModifier(entity)
    };

    // Appliquer les effets du sort
    const effectResult = this.applySpellEffects(newCombat, spell, spellLevel, entity, targetEntity, resources);

    return {
      newCombat: effectResult.newCombat,
      result: {
        success: true,
        damage: effectResult.damage,
        healing: effectResult.healing,
        spellSlotUsed: spellLevel,
        message: 'Spell cast successfully'
      }
    };
  }

  /**
   * Retourne un nouveau Combat avec des dégâts appliqués
   */
  withDamageApplied(combat: Combat, entityId: string, damage: number): Combat {
    const entity = combat.entities.get(entityId);
    if (!entity) {
      throw new Error(`Entity ${entityId} not found`);
    }

    const newEntities = new Map(combat.entities);
    const newCurrentHP = Math.max(0, entity.currentHP - damage);
    const newIsDead = newCurrentHP === 0;
    
    newEntities.set(entityId, {
      ...entity,
      currentHP: newCurrentHP,
      isDead: newIsDead,
      isActive: !newIsDead
    });
    
    const stateService = this.getStateService();
    const newCombat = stateService.clone(combat, { entities: newEntities });
    
    // Vérifier fin de combat
    return stateService.withCheckedCombatEnd(newCombat);
  }

  /**
   * Retourne un nouveau Combat avec des soins appliqués
   */
  withHealingApplied(combat: Combat, entityId: string, healing: number): Combat {
    const entity = combat.entities.get(entityId);
    if (!entity || entity.isDead) {
      throw new Error(`Entity ${entityId} not found or is dead`);
    }

    const newEntities = new Map(combat.entities);
    const newCurrentHP = Math.min(entity.maxHP, entity.currentHP + healing);
    
    newEntities.set(entityId, {
      ...entity,
      currentHP: newCurrentHP
    });
    
    const stateService = this.getStateService();
    return stateService.clone(combat, { entities: newEntities });
  }

  /**
   * Retourne un nouveau Combat avec une entité déplacée
   */
  withMovedEntity(combat: Combat, entityId: string, newPosition: Position, movementCost?: number): Combat {
    const entity = combat.entities.get(entityId);
    if (!entity || entity.isDead) {
      throw new Error(`Entity ${entityId} not found or is dead`);
    }
    
    const gridPos: GridPosition = { x: newPosition.x, y: newPosition.y };
    const currentPos: GridPosition = { x: entity.position.x, y: entity.position.y };
    
    // Calculer le coût réel de mouvement via la grille tactique
    const realCost = movementCost || combat.tacticalGrid.getMovementCost(currentPos, gridPos);
    
    if (entity.actionsRemaining.movement < realCost) {
      throw new Error('Not enough movement remaining');
    }
    if (!combat.tacticalGrid.isCellFree(gridPos)) {
      throw new Error('Target cell is not free');
    }

    // Créer une nouvelle grille avec le mouvement
    const newTacticalGrid = combat.tacticalGrid; // TODO: implémenter clonage si nécessaire

    const newEntities = new Map(combat.entities);
    newEntities.set(entityId, {
      ...entity,
      position: newPosition,
      actionsRemaining: {
        ...entity.actionsRemaining,
        movement: entity.actionsRemaining.movement - realCost
      }
    });
    
    const stateService = this.getStateService();
    return stateService.clone(combat, { 
      entities: newEntities,
      tacticalGrid: newTacticalGrid
    });
  }

  /**
   * Retourne un nouveau Combat avec une action consommée
   */
  withConsumedAction(combat: Combat, entityId: string, cost: ActionCost): Combat {
    const entity = combat.entities.get(entityId);
    if (!entity || entity.isDead) {
      throw new Error(`Entity ${entityId} not found or is dead`);
    }

    const newEntities = new Map(combat.entities);
    const newActionsRemaining = { ...entity.actionsRemaining };

    this.consumeActionCost(newActionsRemaining, cost);

    newEntities.set(entityId, {
      ...entity,
      actionsRemaining: newActionsRemaining
    });

    const stateService = this.getStateService();
    return stateService.clone(combat, { entities: newEntities });
  }

  /**
   * Vérifier les attaques d'opportunité possibles lors d'un mouvement
   */
  checkOpportunityAttacks(combat: Combat, movingEntityId: string, fromPos: Position, toPos: Position): CombatEntity[] {
    const opportunities: CombatEntity[] = [];
    const movingEntity = combat.entities.get(movingEntityId);
    if (!movingEntity) return opportunities;

    // Vérifier les positions adjacentes à la position de départ
    const adjacentToFrom = combat.tacticalGrid.getAdjacentPositions(fromPos);
    
    for (const adjPos of adjacentToFrom) {
      const entity = this.getEntityAtPosition(combat, { x: adjPos.x, y: adjPos.y });
      if (!entity || entity.id === movingEntityId || entity.isDead) continue;
      
      // L'entité peut faire une attaque d'opportunité si :
      // 1. C'est un ennemi du personnage qui bouge
      // 2. Elle a encore sa réaction
      // 3. Le personnage sort de sa portée de mêlée (1 case)
      if (this.isEnemyOf(movingEntity, entity) && 
          entity.actionsRemaining.reaction && 
          !this.isAdjacentTo(toPos, { x: adjPos.x, y: adjPos.y })) {
        opportunities.push(entity);
      }
    }
    
    return opportunities;
  }

  // === MÉTHODES PRIVÉES UTILITAIRES ===

  /**
   * Consommer le coût d'une action
   */
  private consumeActionCost(actionsRemaining: any, cost: ActionCost): void {
    switch (cost) {
      case 'action':
        actionsRemaining.action = false;
        break;
      case 'bonus_action':
        actionsRemaining.bonusAction = false;
        break;
      case 'reaction':
        actionsRemaining.reaction = false;
        break;
      case 'movement':
        actionsRemaining.movement = 0;
        break;
    }
  }

  /**
   * Appliquer les effets d'une action
   */
  private applyActionEffects(
    combat: Combat,
    action: Action,
    caster: CombatEntity,
    target: CombatEntity | undefined,
    resources: EntityResources
  ): { newCombat: Combat; damage: number; healing: number } {
    let newCombat = combat;
    let totalDamage = 0;
    let totalHealing = 0;
    
    const abilityModifier = this.getAbilityModifier(caster, 'strength'); // TODO: dynamique selon l'action

    if (action.effects.damage && target) {
      totalDamage = action.calculateDamage(this.diceRollingService, abilityModifier, caster.proficiencyBonus);
      newCombat = this.withDamageApplied(newCombat, target.id, totalDamage);
    }

    if (action.effects.healing && target) {
      totalHealing = action.calculateHealing(this.diceRollingService, abilityModifier);
      newCombat = this.withHealingApplied(newCombat, target.id, totalHealing);
    }

    return { newCombat, damage: totalDamage, healing: totalHealing };
  }

  /**
   * Appliquer les effets d'un sort
   */
  private applySpellEffects(
    combat: Combat,
    spell: Spell,
    castAtLevel: SpellLevel,
    caster: CombatEntity,
    target: CombatEntity | undefined,
    resources: EntityResources
  ): { newCombat: Combat; damage: number; healing: number } {
    let newCombat = combat;
    let totalDamage = 0;
    let totalHealing = 0;
    
    const spellcastingModifier = this.getSpellcastingModifier(caster);

    // Sort de zone
    if (spell.areaOfEffect) {
      const affectedEntities = this.getEntitiesInArea(
        combat,
        target?.position || caster.position,
        spell.areaOfEffect.shape,
        spell.areaOfEffect.size
      );

      for (const entity of affectedEntities) {
        if (spell.effects.damage) {
          const damage = spell.calculateDamage(this.diceRollingService, castAtLevel, spellcastingModifier, caster.proficiencyBonus);
          newCombat = this.withDamageApplied(newCombat, entity.id, damage);
          totalDamage += damage;
        }
        
        if (spell.effects.healing) {
          const healing = spell.calculateHealing(this.diceRollingService, castAtLevel, spellcastingModifier);
          newCombat = this.withHealingApplied(newCombat, entity.id, healing);
          totalHealing += healing;
        }
      }
    } else if (target) {
      // Sort ciblé
      if (spell.effects.damage) {
        totalDamage = spell.calculateDamage(this.diceRollingService, castAtLevel, spellcastingModifier, caster.proficiencyBonus);
        newCombat = this.withDamageApplied(newCombat, target.id, totalDamage);
      }

      if (spell.effects.healing) {
        totalHealing = spell.calculateHealing(this.diceRollingService, castAtLevel, spellcastingModifier);
        newCombat = this.withHealingApplied(newCombat, target.id, totalHealing);
      }
    }

    return { newCombat, damage: totalDamage, healing: totalHealing };
  }

  /**
   * Consommer un emplacement de sort
   */
  private withSpellSlotConsumed(combat: Combat, entityId: string, level: SpellLevel): Combat {
    const entity = combat.entities.get(entityId);
    if (!entity) return combat;

    const newSpellSlots = { ...entity.spellSlots };
    newSpellSlots[level] = Math.max(0, (newSpellSlots[level] || 0) - 1);

    const newEntities = new Map(combat.entities);
    newEntities.set(entityId, {
      ...entity,
      spellSlots: newSpellSlots
    });

    const stateService = this.getStateService();
    return stateService.clone(combat, { entities: newEntities });
  }

  /**
   * Rompre la concentration
   */
  private withBrokenConcentration(combat: Combat, entityId: string): Combat {
    const entity = combat.entities.get(entityId);
    if (!entity || !entity.concentratingOn) return combat;

    const newConditions = entity.conditions.filter(condition => 
      !condition.startsWith('concentration:')
    );

    const newEntities = new Map(combat.entities);
    newEntities.set(entityId, {
      ...entity,
      concentratingOn: undefined,
      conditions: newConditions
    });

    const stateService = this.getStateService();
    return stateService.clone(combat, { entities: newEntities });
  }

  /**
   * Commencer une concentration
   */
  private withConcentrationStarted(combat: Combat, entityId: string, spellId: string): Combat {
    const entity = combat.entities.get(entityId);
    if (!entity) return combat;

    const newEntities = new Map(combat.entities);
    newEntities.set(entityId, {
      ...entity,
      concentratingOn: spellId,
      conditions: [...entity.conditions, `concentration:${spellId}`]
    });

    const stateService = this.getStateService();
    return stateService.clone(combat, { entities: newEntities });
  }

  // === MÉTHODES UTILITAIRES ===

  private getSpellcastingModifier(entity: CombatEntity): number {
    if (!entity.spellcastingAbility) return 0;
    return this.getAbilityModifier(entity, entity.spellcastingAbility);
  }

  private getAbilityModifier(entity: CombatEntity, ability: keyof any): number {
    const score = entity.abilities[ability];
    return Math.floor((score - 10) / 2);
  }

  private getEntityAtPosition(combat: Combat, position: Position): CombatEntity | null {
    for (const entity of combat.entities.values()) {
      if (entity.position.x === position.x && entity.position.y === position.y) {
        return entity;
      }
    }
    return null;
  }

  private getEntitiesInArea(combat: Combat, center: Position, shape: 'circle' | 'cone' | 'line' | 'square', size: number): CombatEntity[] {
    const centerPos: GridPosition = { x: center.x, y: center.y };
    const affectedPositions = combat.tacticalGrid.getAreaOfEffect(centerPos, shape, size);
    const affectedEntities: CombatEntity[] = [];
    
    for (const pos of affectedPositions) {
      const entity = this.getEntityAtPosition(combat, { x: pos.x, y: pos.y });
      if (entity) {
        affectedEntities.push(entity);
      }
    }
    
    return affectedEntities;
  }

  private isEnemyOf(entity1: CombatEntity, entity2: CombatEntity): boolean {
    if (entity1.type === 'enemy') {
      return entity2.type === 'player' || entity2.type === 'ally';
    }
    return entity2.type === 'enemy';
  }

  private isAdjacentTo(pos1: Position, pos2: Position): boolean {
    const dx = Math.abs(pos1.x - pos2.x);
    const dy = Math.abs(pos1.y - pos2.y);
    return dx <= 1 && dy <= 1 && (dx + dy) > 0;
  }

  /**
   * Obtenir le service d'état (nécessaire pour accéder aux méthodes de clonage)
   * Cette méthode sera injectée par Combat.ts
   */
  private getStateService(): any {
    throw new Error('StateService not injected. This method should be overridden by Combat.ts');
  }
}