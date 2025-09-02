/**
 * DOMAIN SERVICE - ActionValidator
 * Validation des actions et sorts selon les règles D&D 5E
 */

import { Action, type ActionCost, type AbilityScore } from './Action';
import { Spell, type SpellLevel, SpellSlots } from './Spell';
import { type CombatEntity } from './Combat';
import { type GridPosition, TacticalGrid } from './TacticalGrid';

export interface ValidationResult {
  readonly valid: boolean;
  readonly reasons: string[];
  readonly warnings?: string[];
}

export type EntityAbilities = {
  readonly [key in AbilityScore]: number;
}

export interface EntityResources {
  readonly spellSlots: SpellSlots;
  readonly abilities: EntityAbilities;
  readonly proficiencyBonus: number;
  readonly spellcastingModifier: number;
  readonly spellcastingAbility?: AbilityScore;
}

/**
 * ACTION VALIDATOR - Domain Service
 * Service de validation des actions et sorts
 */
export class ActionValidator {

  /**
   * Valider qu'une action peut être exécutée par une entité
   */
  static validateAction(
    action: Action,
    entity: CombatEntity,
    resources: EntityResources,
    tacticalGrid: TacticalGrid,
    targetPosition?: GridPosition,
    targetEntity?: CombatEntity
  ): ValidationResult {
    const reasons: string[] = [];
    const warnings: string[] = [];

    // 1. Vérifier que l'entité est active et vivante
    if (entity.isDead) {
      reasons.push('Entity is dead');
      return { valid: false, reasons, warnings };
    }

    if (!entity.isActive) {
      reasons.push('Entity is not active');
      return { valid: false, reasons, warnings };
    }

    // 2. Vérifier la disponibilité de l'action
    const actionCostValidation = this.validateActionCost(action.cost, entity);
    if (!actionCostValidation.valid) {
      reasons.push(...actionCostValidation.reasons);
    }

    // 3. Vérifier les prérequis de capacité
    if (!action.canBeUsedBy(resources.abilities)) {
      reasons.push(`Insufficient ability score for action ${action.name}`);
    }

    // 4. Vérifier la portée et la cible
    const rangeValidation = this.validateRange(action, entity, tacticalGrid, targetPosition, targetEntity);
    if (!rangeValidation.valid) {
      reasons.push(...rangeValidation.reasons);
    }

    // 5. Vérifier la ligne de vue si nécessaire
    if (action.requirements.requiresLineOfSight && targetPosition) {
      const entityPos: GridPosition = { x: entity.position.x, y: entity.position.y };
      if (!tacticalGrid.hasLineOfSight(entityPos, targetPosition)) {
        reasons.push('No line of sight to target');
      }
    }

    // 6. Vérifications spéciales selon le type d'action
    const specialValidation = this.validateSpecialActionRequirements(action, entity, targetEntity);
    if (!specialValidation.valid) {
      reasons.push(...specialValidation.reasons);
    }

    return {
      valid: reasons.length === 0,
      reasons,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Valider qu'un sort peut être lancé
   */
  static validateSpell(
    spell: Spell,
    castAtLevel: SpellLevel,
    entity: CombatEntity,
    resources: EntityResources,
    tacticalGrid: TacticalGrid,
    targetPosition?: GridPosition,
    targetEntity?: CombatEntity
  ): ValidationResult {
    const reasons: string[] = [];
    const warnings: string[] = [];

    // 1. Vérifications de base (entité active, vivante)
    if (entity.isDead) {
      reasons.push('Entity is dead');
      return { valid: false, reasons, warnings };
    }

    if (!entity.isActive) {
      reasons.push('Entity is not active');
      return { valid: false, reasons, warnings };
    }

    // 2. Vérifier l'emplacement de sort disponible
    if (!spell.isCantrip() && !resources.spellSlots.hasSlot(castAtLevel)) {
      reasons.push(`No spell slot available at level ${castAtLevel}`);
    }

    // 3. Vérifier que le niveau de lancement est suffisant
    if (castAtLevel < spell.level) {
      reasons.push(`Cannot cast level ${spell.level} spell at level ${castAtLevel}`);
    }

    // 4. Vérifier le temps de lancement
    const castingTimeValidation = this.validateCastingTime(spell.castingTime, entity);
    if (!castingTimeValidation.valid) {
      reasons.push(...castingTimeValidation.reasons);
    }

    // 5. Vérifier les composants matériels
    const materialValidation = this.validateMaterialComponents(spell, resources);
    if (!materialValidation.valid) {
      reasons.push(...materialValidation.reasons);
    }

    // 6. Vérifier la portée du sort
    const rangeValidation = this.validateSpellRange(spell, entity, tacticalGrid, targetPosition, targetEntity);
    if (!rangeValidation.valid) {
      reasons.push(...rangeValidation.reasons);
    }

    // 7. Vérifier la concentration
    const concentrationValidation = this.validateConcentration(spell, entity);
    if (!concentrationValidation.valid) {
      warnings.push(...concentrationValidation.reasons);
    }

    // 8. Vérifier la zone d'effet
    if (spell.areaOfEffect && targetPosition) {
      const aoeValidation = this.validateAreaOfEffect(spell, entity, tacticalGrid, targetPosition);
      if (!aoeValidation.valid) {
        reasons.push(...aoeValidation.reasons);
      }
    }

    return {
      valid: reasons.length === 0,
      reasons,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  // MÉTHODES PRIVÉES DE VALIDATION

  private static validateActionCost(cost: ActionCost, entity: CombatEntity): ValidationResult {
    const reasons: string[] = [];

    switch (cost) {
      case 'action':
        if (!entity.actionsRemaining.action) {
          reasons.push('No action available');
        }
        break;
      case 'bonus_action':
        if (!entity.actionsRemaining.bonusAction) {
          reasons.push('No bonus action available');
        }
        break;
      case 'reaction':
        if (!entity.actionsRemaining.reaction) {
          reasons.push('No reaction available');
        }
        break;
      case 'movement':
        if (entity.actionsRemaining.movement <= 0) {
          reasons.push('No movement remaining');
        }
        break;
      case 'free':
        // Les actions libres sont toujours disponibles
        break;
    }

    return { valid: reasons.length === 0, reasons };
  }

  private static validateRange(
    action: Action,
    entity: CombatEntity,
    tacticalGrid: TacticalGrid,
    targetPosition?: GridPosition,
    targetEntity?: CombatEntity
  ): ValidationResult {
    const reasons: string[] = [];

    if (action.requirements.requiresTarget && !targetPosition && !targetEntity) {
      reasons.push('Action requires a target');
      return { valid: false, reasons };
    }

    if (action.requirements.range !== undefined && targetPosition) {
      const entityPos: GridPosition = { x: entity.position.x, y: entity.position.y };
      const distance = tacticalGrid.calculateDistance(entityPos, targetPosition);
      
      if (distance > action.requirements.range) {
        reasons.push(`Target is out of range (${distance} > ${action.requirements.range})`);
      }
    }

    return { valid: reasons.length === 0, reasons };
  }

  private static validateSpecialActionRequirements(
    action: Action,
    entity: CombatEntity,
    targetEntity?: CombatEntity
  ): ValidationResult {
    const reasons: string[] = [];

    switch (action.type) {
      case 'grapple':
      case 'shove':
        if (targetEntity) {
          // Ne peut pas empoigner/bousculer une créature plus grande de 2 tailles
          // Simplification : on considère que toutes les entités font la même taille
          if (targetEntity.isDead) {
            reasons.push('Cannot grapple/shove a dead creature');
          }
        }
        break;

      case 'help':
        if (targetEntity && targetEntity.type === 'enemy' && entity.type !== 'enemy') {
          reasons.push('Cannot help an enemy');
        }
        break;

      case 'offhand_attack':
        // Nécessite d'avoir fait une attaque avec l'arme principale
        // Simplification : on ne vérifie pas cette condition pour l'instant
        break;
    }

    return { valid: reasons.length === 0, reasons };
  }

  private static validateCastingTime(castingTime: string, entity: CombatEntity): ValidationResult {
    const reasons: string[] = [];

    switch (castingTime) {
      case 'action':
        if (!entity.actionsRemaining.action) {
          reasons.push('No action available for casting');
        }
        break;
      case 'bonus_action':
        if (!entity.actionsRemaining.bonusAction) {
          reasons.push('No bonus action available for casting');
        }
        break;
      case 'reaction':
        if (!entity.actionsRemaining.reaction) {
          reasons.push('No reaction available for casting');
        }
        break;
      case 'minute':
      case 'hour':
      case 'ritual':
        // Ces temps de lancement ne peuvent pas être utilisés en combat
        reasons.push('Casting time too long for combat');
        break;
    }

    return { valid: reasons.length === 0, reasons };
  }

  private static validateMaterialComponents(spell: Spell, resources: EntityResources): ValidationResult {
    const reasons: string[] = [];

    if (spell.components.material) {
      // Vérification simplifiée : on suppose que l'entité a un focus de lancement
      // ou les composants matériels nécessaires, sauf pour les sorts coûteux
      
      if (spell.hasExpensiveMaterialComponents()) {
        // En pratique, il faudrait vérifier l'inventaire de l'entité
        // Pour l'instant, on accepte tous les sorts sauf indication contraire
        reasons.push(`Requires expensive material components: ${spell.components.materialDescription}`);
      }
    }

    if (spell.components.somatic) {
      // Vérification simplifiée : on suppose que l'entité a au moins une main libre
      // ou tient un focus de lancement
    }

    return { valid: reasons.length === 0, reasons };
  }

  private static validateSpellRange(
    spell: Spell,
    entity: CombatEntity,
    tacticalGrid: TacticalGrid,
    targetPosition?: GridPosition,
    targetEntity?: CombatEntity
  ): ValidationResult {
    const reasons: string[] = [];
    const range = spell.getRangeInCells();

    if (spell.range === 'self') {
      // Pas de validation nécessaire pour les sorts sur soi
      return { valid: true, reasons };
    }

    if ((spell.range === 'touch' || range === 1) && !targetPosition && !targetEntity) {
      reasons.push('Touch spell requires a target');
      return { valid: false, reasons };
    }

    if (targetPosition && range !== Infinity) {
      const entityPos: GridPosition = { x: entity.position.x, y: entity.position.y };
      const distance = tacticalGrid.calculateDistance(entityPos, targetPosition);
      
      if (distance > range) {
        reasons.push(`Target is out of spell range (${distance} > ${range})`);
      }

      // Vérifier la ligne de vue pour les sorts à distance
      if (range > 1 && !tacticalGrid.hasLineOfSight(entityPos, targetPosition)) {
        reasons.push('No line of sight to target');
      }
    }

    return { valid: reasons.length === 0, reasons };
  }

  private static validateConcentration(spell: Spell, entity: CombatEntity): ValidationResult {
    const reasons: string[] = [];

    if (spell.concentration) {
      // Vérifier si l'entité maintient déjà un autre sort de concentration
      // Pour l'instant, simplification : on suppose qu'elle peut toujours se concentrer
      // Dans une implémentation complète, il faudrait tracker les effets actifs
      
      const hasActiveConcentration = entity.conditions.some(condition => 
        condition.includes('concentration')
      );
      
      if (hasActiveConcentration) {
        reasons.push('Already concentrating on another spell (will break current concentration)');
      }
    }

    return { valid: true, reasons }; // On retourne des warnings, pas des erreurs
  }

  private static validateAreaOfEffect(
    spell: Spell,
    entity: CombatEntity,
    tacticalGrid: TacticalGrid,
    targetPosition: GridPosition
  ): ValidationResult {
    const reasons: string[] = [];

    if (!spell.areaOfEffect) {
      return { valid: true, reasons };
    }

    const aoe = spell.areaOfEffect;
    const entityPos: GridPosition = { x: entity.position.x, y: entity.position.y };

    // Vérifier que la zone d'effet est dans la portée du sort
    const spellRange = spell.getRangeInCells();
    const distanceToTarget = tacticalGrid.calculateDistance(entityPos, targetPosition);

    if (distanceToTarget > spellRange) {
      reasons.push(`Area of effect center is out of spell range (${distanceToTarget} > ${spellRange})`);
    }

    // Vérifier que la zone d'effet ne sort pas de la grille
    // Conversion des formes AoE vers formes acceptées par la grille
    let gridShape: 'circle' | 'cone' | 'line' | 'square';
    switch (aoe.shape) {
      case 'sphere': gridShape = 'circle'; break;
      case 'cube': gridShape = 'square'; break;
      case 'cylinder': gridShape = 'circle'; break;
      default: gridShape = aoe.shape as 'circle' | 'cone' | 'line' | 'square'; break;
    }

    const affectedPositions = tacticalGrid.getAreaOfEffect(
      targetPosition,
      gridShape,
      aoe.size
    );

    const invalidPositions = affectedPositions.filter(pos => !tacticalGrid.isValidPosition(pos));
    if (invalidPositions.length > 0) {
      reasons.push('Area of effect extends beyond grid boundaries');
    }

    return { valid: reasons.length === 0, reasons };
  }
}