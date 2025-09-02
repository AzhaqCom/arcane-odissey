/**
 * DOMAIN ADAPTER - Combat ECS Adapter
 * Pont entre l'ancien système Combat et la nouvelle architecture ECS
 * Permet migration progressive sans casser l'existant
 */

import { Combat, type CombatEntity } from '../entities/Combat';
import { type ECSEntity, type StatsComponent, type PositionComponent, type ActionsComponent, type StatusComponent, ECSUtils } from '../entities/ECS';
import { ECSCombatSystem } from '../systems/ECSCombatSystem';
import { ECSEntityFactory } from '../factories/ECSEntityFactory';
import { ECSAIDecisionMaker } from '../entities/ECSAIDecisionMaker';
import type { ValidationResult } from '../entities/ActionValidator';

/**
 * Adaptateur pour utiliser ECS avec l'interface Combat existante
 */
export class CombatECSAdapter {
  private ecsSystem: ECSCombatSystem;
  private ecsAIDecisionMaker: ECSAIDecisionMaker;

  constructor() {
    this.ecsSystem = new ECSCombatSystem();
    this.ecsAIDecisionMaker = new ECSAIDecisionMaker();
  }

  /**
   * Migrer un Combat existant vers ECS
   */
  migrateCombatToECS(combat: Combat): void {
    // Clear ECS system
    this.ecsSystem.clear();

    // Convertir toutes les entités vers ECS
    for (const [_, combatEntity] of combat.entities) {
      const ecsEntity = ECSEntityFactory.createFromCombatEntity(combatEntity);
      this.ecsSystem.addEntity(ecsEntity);
    }
  }

  /**
   * Synchroniser les changements ECS vers Combat
   */
  syncECSBackToCombat(combat: Combat): Combat {
    const updatedEntities = new Map(combat.entities);

    // Mettre à jour chaque entité depuis ECS
    for (const [id, combatEntity] of combat.entities) {
      const ecsEntity = this.ecsSystem.getEntity(id);
      if (ecsEntity) {
        const syncedEntity = this.syncECSEntityToCombatEntity(combatEntity, ecsEntity);
        updatedEntities.set(id, syncedEntity);
      }
    }

    // Retourner nouveau Combat avec entités mises à jour
    return (combat as any).withUpdatedEntities(updatedEntities);
  }

  /**
   * Exécuter tour IA via ECS
   */
  executeAITurnECS(combat: Combat, entityId: string): ValidationResult & { damage?: number; healing?: number } | null {
    // Migrer vers ECS si pas déjà fait
    if (this.ecsSystem.getAllEntities().size === 0) {
      this.migrateCombatToECS(combat);
    }

    // Obtenir décision IA via ECS
    const decision = this.ecsAIDecisionMaker.decideAction(this.ecsSystem, entityId);
    
    if (!decision) {
      return {
        valid: false,
        reasons: ['No AI decision available']
      };
    }

    // Exécuter l'action selon la décision IA
    return this.executeAIDecision(combat, entityId, decision);
  }

  /**
   * Obtenir entités ECS pour debug/inspection
   */
  getECSSystem(): ECSCombatSystem {
    return this.ecsSystem;
  }

  /**
   * Avancer tour avec ECS
   */
  advanceECSTurn(): void {
    this.ecsSystem.resetActionsForNewTurn();
    this.ecsSystem.processDeathSystem();
  }

  // ====== MÉTHODES PRIVÉES ======

  /**
   * Synchroniser une entité ECS vers CombatEntity
   */
  private syncECSEntityToCombatEntity(combatEntity: CombatEntity, ecsEntity: ECSEntity): CombatEntity {
    const stats = ECSUtils.getComponent<StatsComponent>(ecsEntity, 'stats')!;
    const position = ECSUtils.getComponent<PositionComponent>(ecsEntity, 'position')!;
    const actions = ECSUtils.getComponent<ActionsComponent>(ecsEntity, 'actions')!;
    const status = ECSUtils.getComponent<StatusComponent>(ecsEntity, 'status')!;

    return {
      ...combatEntity,
      // Sync stats
      name: stats.name,
      maxHP: stats.maxHP,
      currentHP: stats.currentHP,
      baseAC: stats.baseAC,
      baseSpeed: stats.baseSpeed,
      level: stats.level,
      proficiencyBonus: stats.proficiencyBonus,
      abilities: stats.abilities,
      spellcastingAbility: stats.spellcastingAbility,
      
      // Sync position
      position: position.position,
      initiative: position.initiative,
      
      // Sync actions
      actionsRemaining: actions.actionsRemaining,
      availableActions: actions.availableActions,
      
      // Sync status
      type: status.entityType,
      isActive: status.isActive,
      isDead: status.isDead,
      conditions: status.conditions,
      concentratingOn: status.concentratingOn,

      // Garder référence ECS
      ecsEntity: ecsEntity
    };
  }

  /**
   * Synchroniser CombatEntity vers entité ECS
   */
  // private syncCombatEntityToECS(combatEntity: CombatEntity): ECSEntity {
  //   return ECSEntityFactory.createFromCombatEntity(combatEntity);
  // }

  /**
   * Exécuter concrètement une décision IA
   */
  private executeAIDecision(
    combat: Combat, 
    entityId: string, 
    decision: any
  ): ValidationResult & { damage?: number; healing?: number } | null {
    switch (decision.intent) {
      case 'attack_melee':
      case 'attack_ranged':
        return this.executeAIAttack(combat, entityId, decision);
      
      case 'dodge':
        return this.executeAIDodge(combat, entityId);
      
      case 'dash':
        return this.executeAIDash(combat, entityId);
      
      case 'cast_damage':
      case 'cast_heal':
        return this.executeAISpell(combat, entityId, decision);
      
      default:
        return {
          valid: false,
          reasons: [`Unknown AI intent: ${decision.intent}`]
        };
    }
  }

  /**
   * Exécuter une attaque IA avec vraie arme
   */
  private executeAIAttack(
    combat: Combat, 
    entityId: string, 
    decision: any
  ): ValidationResult & { damage?: number; healing?: number } | null {
    if (!decision.targetEntityId) {
      return {
        valid: false,
        reasons: ['No target for attack']
      };
    }

    if (!decision.weaponId) {
      return {
        valid: false,
        reasons: ['No weapon selected for attack']
      };
    }

    try {
      // Utiliser la vraie méthode performWeaponAttack du Combat
      const result = combat.performWeaponAttack(
        entityId,
        decision.weaponId,
        decision.targetEntityId
      );

      return {
        valid: result.success,
        reasons: [result.message],
        damage: result.damage
      };
    } catch (error) {
      return {
        valid: false,
        reasons: [`Attack failed: ${error}`]
      };
    }
  }

  /**
   * Exécuter action Dodge
   */
  private executeAIDodge(combat: Combat, entityId: string): ValidationResult {
    const entity = (combat as any)._entities.get(entityId);
    if (!entity) {
      return {
        valid: false,
        reasons: ['Entity not found for dodge']
      };
    }

    return {
      valid: true,
      reasons: [`${entity.name} esquive (+2 CA jusqu'au prochain tour)`]
    };
  }

  /**
   * Exécuter action Dash  
   */
  private executeAIDash(combat: Combat, entityId: string): ValidationResult {
    const entity = (combat as any)._entities.get(entityId);
    if (!entity) {
      return {
        valid: false,
        reasons: ['Entity not found for dash']
      };
    }

    return {
      valid: true,
      reasons: [`${entity.name} se précipite (vitesse doublée)`]
    };
  }

  /**
   * Exécuter un sort IA (pour l'instant basique)
   */
  private executeAISpell(
    combat: Combat, 
    entityId: string, 
    decision: any
  ): ValidationResult & { damage?: number; healing?: number } | null {
    return {
      valid: true,
      reasons: [`AI cast spell (basic implementation)`],
      damage: decision.intent === 'cast_damage' ? 6 : undefined,
      healing: decision.intent === 'cast_heal' ? 8 : undefined
    };
  }
}