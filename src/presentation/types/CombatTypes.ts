/**
 * PRESENTATION TYPES - Combat View Models
 * ✅ ARCHITECTURE_GUIDELINES.md - Règle #3 : Types isolés pour Presentation
 * ✅ Aucun import depuis Domain ou Application
 */

// === VIEW MODELS POUR UI ===

export interface CombatEntityView {
  readonly id: string;
  readonly name: string;
  readonly type: 'player' | 'ally' | 'enemy';
  readonly level: number;
  
  // Santé
  readonly hitPoints: number;
  readonly maxHitPoints: number;
  readonly healthPercentage: number;
  
  // Position et état
  readonly position: { readonly x: number; readonly y: number };
  readonly isActive: boolean;
  readonly isDead: boolean;
  
  // Actions disponibles
  readonly canAct: boolean;
  readonly canMove: boolean;
  readonly actionsRemaining: {
    readonly action: boolean;
    readonly bonusAction: boolean;
    readonly reaction: boolean;
    readonly movement: number;
  };
  
  // Combat stats (pour l'UI)
  readonly armorClass: number;
  readonly initiative: number;
}

export interface CombatStateView {
  readonly phase: 'setup' | 'combat' | 'victory' | 'defeat';
  readonly currentTurnIndex: number;
  readonly round: number;
  readonly entities: readonly CombatEntityView[];
  readonly currentEntity: CombatEntityView | null;
  readonly grid: {
    readonly width: number;
    readonly height: number;
  };
}

export interface CombatActionView {
  readonly type: 'attack' | 'move' | 'end_turn' | 'cast_spell';
  readonly label: string;
  readonly description: string;
  readonly enabled: boolean;
  readonly cost?: {
    readonly action?: boolean;
    readonly bonusAction?: boolean;
    readonly movement?: number;
  };
}

export interface GameLogMessageView {
  readonly id: string;
  readonly timestamp: Date;
  readonly type: 'info' | 'combat' | 'damage' | 'healing' | 'system';
  readonly message: string;
  readonly entity?: string; // Nom de l'entité concernée
}

export interface CombatUIState {
  readonly selectedEntityId: string | null;
  readonly targetEntityId: string | null;
  readonly hoveredPosition: { x: number; y: number } | null;
  readonly showMovementMode: boolean;
  readonly availableActions: readonly CombatActionView[];
  readonly messages: readonly GameLogMessageView[];
}