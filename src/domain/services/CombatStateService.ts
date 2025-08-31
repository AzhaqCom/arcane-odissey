/**
 * DOMAIN SERVICE - CombatStateService
 * Service de gestion d'état pour les opérations de mutation du combat
 * Responsabilité : Fournir une interface de mutations d'état (CQRS - Command side)
 */

import type { Combat, CombatEntity, CombatPhase, TurnPhase } from '../entities/Combat';
import type { Position } from '../types';
import type { TacticalGrid } from '../entities/TacticalGrid';

/**
 * SERVICE DE GESTION D'ÉTAT COMBAT
 * Toutes les méthodes retournent un nouvel objet Combat (immutabilité)
 */
export class CombatStateService {

  /**
   * Retourne un nouveau Combat avec une entité ajoutée
   */
  withAddedEntity(combat: Combat, entity: CombatEntity): Combat {
    return this.addEntity_internal(combat, entity);
  }

  /**
   * Ajouter une entité au combat (implémentation interne)
   */
  private addEntity_internal(combat: Combat, entity: CombatEntity): Combat {
    const newEntities = new Map(combat.entities);
    newEntities.set(entity.id, entity);
    
    return this.clone(combat, { entities: newEntities });
  }

  /**
   * Retourne un nouveau Combat avec l'ordre d'initiative calculé
   */
  withCalculatedInitiativeOrder(combat: Combat): Combat {
    return this.calculateInitiativeOrder_internal(combat);
  }

  /**
   * Calculer l'ordre d'initiative (implémentation interne)
   */
  private calculateInitiativeOrder_internal(combat: Combat): Combat {
    const entities = Array.from(combat.entities.values())
      .filter(e => e.isActive && !e.isDead)
      .sort((a, b) => {
        // Tri par initiative décroissante, puis par dextérité
        if (b.initiative !== a.initiative) {
          return b.initiative - a.initiative;
        }
        return b.abilities.dexterity - a.abilities.dexterity;
      });

    const newInitiativeOrder = entities.map(e => e.id);
    
    return this.clone(combat, {
      initiativeOrder: newInitiativeOrder,
      currentEntityIndex: 0
    });
  }

  /**
   * Retourne un nouveau Combat avec le combat commencé
   */
  withStartedCombat(combat: Combat): Combat {
    return this.startCombat_internal(combat);
  }

  /**
   * Démarrer le combat (implémentation interne)
   */
  private startCombat_internal(combat: Combat): Combat {
    // Réinitialiser les actions de toutes les entités
    const entitiesWithResetActions = new Map();
    
    for (const [id, entity] of combat.entities) {
      entitiesWithResetActions.set(id, {
        ...entity,
        actionsRemaining: {
          action: true,
          bonusAction: true,
          reaction: true,
          movement: entity.speed || 30
        }
      });
    }
    
    return this
      .clone(combat, { entities: entitiesWithResetActions })
      .withCalculatedInitiativeOrder()
      .clone({
        phase: 'combat' as CombatPhase,
        turnPhase: 'start' as TurnPhase
      });
  }

  /**
   * Retourne un nouveau Combat avec le tour avancé
   */
  withAdvancedTurn(combat: Combat): Combat {
    return this.advanceToNextEntity_internal(combat);
  }

  /**
   * Avancer vers l'entité suivante (implémentation interne)
   */
  private advanceToNextEntity_internal(combat: Combat): Combat {
    let newCurrentEntityIndex = combat.currentEntityIndex + 1;
    let newRound = combat.round;
    
    // Si on dépasse la fin de l'ordre, nouveau round
    if (newCurrentEntityIndex >= combat.initiativeOrder.length) {
      newCurrentEntityIndex = 0;
      newRound += 1;
    }
    
    // Réinitialiser les actions de toutes les entités au début d'un nouveau round
    let entitiesWithResetActions = combat.entities;
    if (newCurrentEntityIndex === 0) {
      entitiesWithResetActions = new Map();
      for (const [id, entity] of combat.entities) {
        entitiesWithResetActions.set(id, {
          ...entity,
          actionsRemaining: {
            action: true,
            bonusAction: true,
            reaction: true,
            movement: entity.speed || 30
          }
        });
      }
    }
    
    return this.clone(combat, {
      currentEntityIndex: newCurrentEntityIndex,
      round: newRound,
      entities: entitiesWithResetActions
    });
  }

  /**
   * Retourne un nouveau Combat avec vérification de fin de combat
   */
  withCheckedCombatEnd(combat: Combat): Combat {
    return this.checkCombatEnd_internal(combat);
  }

  /**
   * Vérifier les conditions de fin de combat (implémentation interne)
   */
  private checkCombatEnd_internal(combat: Combat): Combat {
    const aliveEnemies = Array.from(combat.entities.values())
      .filter(e => e.type === 'enemy' && !e.isDead);
    
    const aliveAllies = Array.from(combat.entities.values())
      .filter(e => (e.type === 'player' || e.type === 'ally') && !e.isDead);

    if (aliveEnemies.length === 0) {
      return this.clone(combat, { phase: 'victory' as CombatPhase });
    }
    
    if (aliveAllies.length === 0) {
      return this.clone(combat, { phase: 'defeat' as CombatPhase });
    }
    
    return combat; // Pas de changement
  }

  /**
   * Réinitialiser toutes les actions des entités
   */
  resetAllEntitiesActions(combat: Combat): Combat {
    const newEntities = new Map();
    
    for (const [id, entity] of combat.entities) {
      newEntities.set(id, {
        ...entity,
        actionsRemaining: {
          action: true,
          bonusAction: true,
          reaction: true,
          movement: entity.speed || 30
        }
      });
    }
    
    return this.clone(combat, { entities: newEntities });
  }

  /**
   * Clone le combat avec des modifications (clonage intelligent)
   * MÉTHODE CRITIQUE pour l'immutabilité
   */
  clone(combat: Combat, modifications: Partial<{
    entities: Map<string, CombatEntity>;
    initiativeOrder: string[];
    currentEntityIndex: number;
    round: number;
    phase: CombatPhase;
    turnPhase: TurnPhase;
    tacticalGrid: TacticalGrid;
  }> = {}): Combat {
    // Créer une nouvelle instance Combat
    const newCombat = new (combat.constructor as any)(combat.id, { width: 12, height: 8 });
    
    // Copie des propriétés (structural sharing quand possible)
    (newCombat as any)._entities = modifications.entities || new Map(combat.entities);
    (newCombat as any)._initiativeOrder = modifications.initiativeOrder || [...combat.initiativeOrder];
    (newCombat as any)._currentEntityIndex = modifications.currentEntityIndex ?? combat.currentEntityIndex;
    (newCombat as any)._round = modifications.round ?? combat.round;
    (newCombat as any)._phase = modifications.phase ?? combat.phase;
    (newCombat as any)._turnPhase = modifications.turnPhase ?? combat.turnPhase;
    (newCombat as any)._tacticalGrid = modifications.tacticalGrid || combat.tacticalGrid; // Tactical grid peut être partagée
    
    return Object.freeze(newCombat);
  }
}