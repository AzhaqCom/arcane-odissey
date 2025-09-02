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

    // Simuler exécution de l'action (pour l'instant)
    // TODO: Implémenter vraie exécution d'action ECS
    return {
      valid: true,
      reasons: [`AI executed: ${decision.intent}`],
      damage: decision.intent.includes('attack') ? Math.floor(Math.random() * 8) + 1 : undefined
    };
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
}