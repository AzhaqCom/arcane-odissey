/**
 * DOMAIN SERVICE - CombatQueryService
 * Service de lecture seule pour interroger l'état du combat
 * Responsabilité : Fournir une interface de requêtes pures (CQRS - Query side)
 */

import type { Combat, CombatEntity, CombatPhase, TurnPhase } from '../entities/Combat';
import type { Position } from '../types';
import type { GridPosition } from '../entities/TacticalGrid';
import type { Action } from '../entities/Action';
import type { Spell, SpellLevel } from '../entities/Spell';
import type { EntityAbilities } from '../entities/ActionValidator';

/**
 * SERVICE DE REQUÊTES COMBAT
 * Toutes les méthodes sont pures et ne modifient jamais l'état
 */
export class CombatQueryService {
  
  /**
   * Obtenir l'entité active dans l'ordre d'initiative
   */
  getCurrentEntity(combat: Combat): CombatEntity | null {
    if (combat.initiativeOrder.length === 0) return null;
    
    const entityId = combat.initiativeOrder[combat.currentEntityIndex];
    return combat.entities.get(entityId) || null;
  }

  /**
   * Obtenir l'entité située à une position donnée
   */
  getEntityAtPosition(combat: Combat, position: Position): CombatEntity | null {
    for (const entity of combat.entities.values()) {
      if (entity.position.x === position.x && entity.position.y === position.y) {
        return entity;
      }
    }
    return null;
  }

  /**
   * Vérifier si un attaquant peut attaquer une cible à une portée donnée
   */
  canAttackTarget(combat: Combat, attackerId: string, targetId: string, range: number): boolean {
    const attacker = combat.entities.get(attackerId);
    const target = combat.entities.get(targetId);
    
    if (!attacker || !target || target.isDead || !target.isActive) return false;
    
    // Vérifier la portée
    const distance = combat.tacticalGrid.calculateDistance(attacker.position, target.position);
    if (distance > range) return false;
    
    // Vérifier la ligne de vue pour les attaques à distance
    if (range > 1) {
      return combat.tacticalGrid.hasLineOfSight(attacker.position, target.position);
    }
    
    return true;
  }

  /**
   * Calculer le type de couverture entre attaquant et cible
   */
  calculateAttackCover(combat: Combat, attackerId: string, targetId: string): 'none' | 'half' | 'three_quarters' | 'full' {
    const attacker = combat.entities.get(attackerId);
    const target = combat.entities.get(targetId);
    
    if (!attacker || !target) return 'full';
    
    return combat.tacticalGrid.calculateCover(attacker.position, target.position);
  }

  /**
   * Obtenir toutes les entités dans une zone d'effet
   */
  getEntitiesInArea(combat: Combat, center: Position, shape: 'circle' | 'cone' | 'line' | 'square', size: number, direction?: Position): CombatEntity[] {
    const centerPos: GridPosition = { x: center.x, y: center.y };
    const directionPos: GridPosition | undefined = direction ? { x: direction.x, y: direction.y } : undefined;
    
    const affectedPositions = combat.tacticalGrid.getAreaOfEffect(centerPos, shape, size, directionPos);
    const affectedEntities: CombatEntity[] = [];
    
    for (const pos of affectedPositions) {
      const entity = this.getEntityAtPosition(combat, { x: pos.x, y: pos.y });
      if (entity) {
        affectedEntities.push(entity);
      }
    }
    
    return affectedEntities;
  }

  /**
   * Obtenir les actions disponibles pour une entité
   */
  getAvailableActions(combat: Combat, entityId: string): Action[] {
    const entity = combat.entities.get(entityId);
    if (!entity) return [];

    return entity.availableActions.filter(action => {
      const resources = {
        actionsRemaining: entity.actionsRemaining,
        spellSlots: entity.spellSlots,
        spellcastingModifier: this.getSpellcastingModifier(entity)
      };

      // TODO: Implémenter ActionValidator.validateAction si nécessaire
      // const validation = ActionValidator.validateAction(action, resources, combat);
      // return validation.valid;
      
      // Version simplifiée pour l'instant
      return entity.actionsRemaining.action && entity.isActive && !entity.isDead;
    });
  }

  /**
   * Obtenir les sorts disponibles pour une entité avec leurs niveaux utilisables
   */
  getAvailableSpells(combat: Combat, entityId: string): Array<{ spell: Spell; availableLevels: SpellLevel[] }> {
    const entity = combat.entities.get(entityId);
    if (!entity) return [];

    const resources = {
      actionsRemaining: entity.actionsRemaining,
      spellSlots: entity.spellSlots,
      spellcastingModifier: this.getSpellcastingModifier(entity)
    };

    return entity.knownSpells
      .filter(spell => entity.actionsRemaining.action && entity.isActive && !entity.isDead)
      .map(spell => ({
        spell,
        availableLevels: this.getAvailableSpellLevels(spell, entity.spellSlots)
      }))
      .filter(entry => entry.availableLevels.length > 0);
  }

  /**
   * Vérifier les attaques d'opportunité possibles lors d'un mouvement
   */
  checkOpportunityAttacks(combat: Combat, movingEntityId: string, from: Position, to: Position): CombatEntity[] {
    const opportunities: CombatEntity[] = [];
    const movingEntity = combat.entities.get(movingEntityId);
    if (!movingEntity) return opportunities;

    // Vérifier les positions adjacentes à la position de départ
    const adjacentToFrom = combat.tacticalGrid.getAdjacentPositions(from);
    
    for (const adjPos of adjacentToFrom) {
      const entity = this.getEntityAtPosition(combat, { x: adjPos.x, y: adjPos.y });
      if (!entity || entity.id === movingEntityId || entity.isDead) continue;
      
      // L'entité peut faire une attaque d'opportunité si :
      // 1. C'est un ennemi du personnage qui bouge
      // 2. Elle a encore sa réaction
      // 3. Le personnage sort de sa portée de mêlée (1 case)
      if (this.isEnemyOf(movingEntity, entity) && 
          entity.actionsRemaining.reaction && 
          !this.isAdjacentTo(to, { x: adjPos.x, y: adjPos.y })) {
        opportunities.push(entity);
      }
    }
    
    return opportunities;
  }

  /**
   * Obtenir le modificateur de caractéristique d'incantation d'une entité
   */
  getSpellcastingModifier(entity: CombatEntity): number {
    if (!entity.spellcastingAbility) return 0;
    return this.getAbilityModifier(entity, entity.spellcastingAbility);
  }

  /**
   * Obtenir le modificateur d'une caractéristique
   */
  getAbilityModifier(entity: CombatEntity, ability: keyof EntityAbilities): number {
    const score = entity.abilities[ability];
    return Math.floor((score - 10) / 2);
  }

  /**
   * Vérifier si deux entités sont alliées
   */
  isAllyOf(entity1: CombatEntity, entity2: CombatEntity): boolean {
    if (entity1.type === 'enemy') {
      return entity2.type === 'enemy';
    }
    return entity2.type === 'player' || entity2.type === 'ally';
  }

  /**
   * Vérifier si deux entités sont ennemies
   */
  isEnemyOf(entity1: CombatEntity, entity2: CombatEntity): boolean {
    if (entity1.type === 'enemy') {
      return entity2.type === 'player' || entity2.type === 'ally';
    }
    return entity2.type === 'enemy';
  }

  // === GETTERS D'ÉTAT ===

  /**
   * Obtenir l'ID du combat
   */
  getId(combat: Combat): string {
    return combat.id;
  }

  /**
   * Obtenir la phase actuelle du combat
   */
  getPhase(combat: Combat): CombatPhase {
    return combat.phase;
  }

  /**
   * Obtenir le round actuel
   */
  getRound(combat: Combat): number {
    return combat.round;
  }

  /**
   * Obtenir la phase de tour actuelle
   */
  getTurnPhase(combat: Combat): TurnPhase {
    return combat.turnPhase;
  }

  /**
   * Obtenir l'index de l'entité courante dans l'ordre d'initiative
   */
  getCurrentEntityIndex(combat: Combat): number {
    return combat.currentEntityIndex;
  }

  /**
   * Obtenir l'ordre d'initiative complet
   */
  getInitiativeOrder(combat: Combat): readonly string[] {
    return combat.initiativeOrder;
  }

  /**
   * Obtenir toutes les entités du combat
   */
  getEntities(combat: Combat): ReadonlyMap<string, CombatEntity> {
    return combat.entities;
  }

  /**
   * Obtenir la grille tactique
   */
  getTacticalGrid(combat: Combat) {
    return combat.tacticalGrid;
  }

  // === MÉTHODES PRIVÉES UTILITAIRES ===

  /**
   * Obtenir les niveaux de sort disponibles pour un sort donné
   */
  private getAvailableSpellLevels(spell: Spell, spellSlots: any): SpellLevel[] {
    // TODO: Implémenter la logique des emplacements de sorts
    // Pour l'instant, retour simple du niveau de base
    return [spell.level];
  }

  /**
   * Vérifier si deux positions sont adjacentes
   */
  private isAdjacentTo(pos1: Position, pos2: Position): boolean {
    const dx = Math.abs(pos1.x - pos2.x);
    const dy = Math.abs(pos1.y - pos2.y);
    return dx <= 1 && dy <= 1 && (dx + dy) > 0;
  }
}