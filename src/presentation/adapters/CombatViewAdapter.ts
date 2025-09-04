/**
 * PRESENTATION ADAPTER - Combat View Adapter
 * ✅ ARCHITECTURE_GUIDELINES.md - Règle #3 : Couche d'adaptation
 * Convertit les entités Domain vers les View Models Presentation
 */

import type { CombatEntityView, CombatStateView, CombatActionView, GameLogMessageView } from '../types/CombatTypes';

// === INTERFACES POUR ADAPTER (minimal necessaire) ===
// On importe seulement les types minimums nécessaires du Domain

interface DomainCombatEntity {
  readonly id: string;
  readonly name: string;
  readonly type: 'player' | 'ally' | 'enemy';
  readonly level: number;
  readonly hitPoints: number;
  readonly maxHitPoints: number;
  readonly position: { readonly x: number; readonly y: number };
  readonly isActive: boolean;
  readonly isDead: boolean;
  readonly armorClass: number;
  readonly initiative: number;
  readonly actionsRemaining: {
    readonly action: boolean;
    readonly bonusAction: boolean;
    readonly reaction: boolean;
    readonly movement: number;
  };
}

interface DomainCombatState {
  readonly phase: 'setup' | 'combat' | 'victory' | 'defeat';
  readonly currentTurnIndex: number;
  readonly round: number;
  readonly entities: readonly DomainCombatEntity[];
  readonly gridWidth: number;
  readonly gridHeight: number;
}

interface DomainCombatAction {
  readonly type: 'attack' | 'move' | 'end_turn' | 'cast_spell';
  readonly entityId: string;
  readonly targetId?: string;
  readonly position?: { x: number; y: number };
}

/**
 * ADAPTER PRINCIPAL - Domain vers Presentation
 * ✅ Respecte ARCHITECTURE_GUIDELINES.md Règle #3
 */
export class CombatViewAdapter {
  
  /**
   * ✅ PURE FUNCTION: Convert Domain CombatEntity -> Presentation CombatEntityView
   */
  static entityToView(entity: DomainCombatEntity): CombatEntityView {
    return {
      id: entity.id,
      name: entity.name,
      type: entity.type,
      level: entity.level,
      
      hitPoints: entity.hitPoints,
      maxHitPoints: entity.maxHitPoints,
      healthPercentage: Math.round((entity.hitPoints / entity.maxHitPoints) * 100),
      
      position: entity.position,
      isActive: entity.isActive,
      isDead: entity.isDead,
      
      canAct: entity.actionsRemaining.action && !entity.isDead,
      canMove: entity.actionsRemaining.movement > 0 && !entity.isDead,
      actionsRemaining: entity.actionsRemaining,
      
      armorClass: entity.armorClass,
      initiative: entity.initiative
    };
  }

  /**
   * ✅ PURE FUNCTION: Convert Domain CombatState -> Presentation CombatStateView
   */
  static stateToView(combatState: DomainCombatState): CombatStateView {
    const entities = combatState.entities.map(entity => 
      CombatViewAdapter.entityToView(entity)
    );
    
    const currentEntity = combatState.currentTurnIndex >= 0 && combatState.currentTurnIndex < entities.length
      ? entities[combatState.currentTurnIndex]
      : null;

    return {
      phase: combatState.phase,
      currentTurnIndex: combatState.currentTurnIndex,
      round: combatState.round,
      entities,
      currentEntity,
      grid: {
        width: combatState.gridWidth,
        height: combatState.gridHeight
      }
    };
  }

  /**
   * ✅ PURE FUNCTION: Generate available actions for UI
   */
  static getAvailableActions(entity: CombatEntityView, enemiesExist: boolean): CombatActionView[] {
    const actions: CombatActionView[] = [];

    if (!entity.canAct) {
      return [{
        type: 'end_turn',
        label: 'Terminer le tour',
        description: 'Aucune action disponible',
        enabled: true
      }];
    }

    // Action d'attaque
    if (entity.actionsRemaining.action && enemiesExist) {
      actions.push({
        type: 'attack',
        label: 'Attaquer',
        description: 'Attaquer un ennemi à portée',
        enabled: true,
        cost: { action: true }
      });
    }

    // Action de mouvement
    if (entity.canMove) {
      actions.push({
        type: 'move',
        label: `Déplacer (${entity.actionsRemaining.movement}m)`,
        description: 'Se déplacer sur la grille tactique',
        enabled: true,
        cost: { movement: entity.actionsRemaining.movement }
      });
    }

    // Terminer le tour
    actions.push({
      type: 'end_turn',
      label: 'Terminer le tour',
      description: 'Passer au joueur suivant',
      enabled: true
    });

    return actions;
  }

  /**
   * ✅ PURE FUNCTION: Create game log message for UI
   */
  static createLogMessage(
    type: 'info' | 'combat' | 'damage' | 'healing' | 'system',
    message: string,
    entityName?: string
  ): GameLogMessageView {
    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type,
      message,
      entity: entityName
    };
  }

  /**
   * ✅ PURE FUNCTION: Format damage/healing message
   */
  static formatCombatMessage(
    action: 'attack' | 'heal' | 'move' | 'end_turn',
    sourceEntity: string,
    targetEntity?: string,
    value?: number
  ): string {
    switch (action) {
      case 'attack':
        if (targetEntity && value !== undefined) {
          return `${sourceEntity} attaque ${targetEntity} et inflige ${value} dégâts`;
        }
        return `${sourceEntity} attaque`;
        
      case 'heal':
        if (value !== undefined) {
          return `${sourceEntity} récupère ${value} points de vie`;
        }
        return `${sourceEntity} se soigne`;
        
      case 'move':
        return `${sourceEntity} se déplace`;
        
      case 'end_turn':
        return `${sourceEntity} termine son tour`;
        
      default:
        return `${sourceEntity} effectue une action`;
    }
  }

  /**
   * ✅ PURE FUNCTION: Get entity status color for UI
   */
  static getEntityStatusColor(entity: CombatEntityView): string {
    if (entity.isDead) return '#666666';
    if (entity.healthPercentage <= 25) return '#ff4444';
    if (entity.healthPercentage <= 50) return '#ff8844';
    if (entity.healthPercentage <= 75) return '#ffaa44';
    return '#44ff44';
  }

  /**
   * ✅ PURE FUNCTION: Get entity status text for UI
   */
  static getEntityStatusText(entity: CombatEntityView): string {
    if (entity.isDead) return 'Mort';
    if (entity.healthPercentage <= 25) return 'Critique';
    if (entity.healthPercentage <= 50) return 'Blessé';
    if (entity.healthPercentage <= 75) return 'Égratigné';
    return 'En forme';
  }

  /**
   * ✅ PURE FUNCTION: Check if position is valid for movement
   */
  static isValidMovePosition(
    fromPos: { x: number; y: number },
    toPos: { x: number; y: number },
    movement: number,
    gridWidth: number,
    gridHeight: number,
    occupiedPositions: { x: number; y: number }[]
  ): boolean {
    // Vérifier les limites de la grille
    if (toPos.x < 0 || toPos.x >= gridWidth || toPos.y < 0 || toPos.y >= gridHeight) {
      return false;
    }

    // Vérifier si la position est occupée
    const isOccupied = occupiedPositions.some(pos => pos.x === toPos.x && pos.y === toPos.y);
    if (isOccupied) {
      return false;
    }

    // Vérifier la distance (Chebyshev distance pour D&D)
    const distance = Math.max(Math.abs(toPos.x - fromPos.x), Math.abs(toPos.y - fromPos.y));
    return distance <= movement;
  }
}