// Position removed - use GridPosition from domain/entities/TacticalGrid instead
import type { GridPosition } from '../../domain/entities/TacticalGrid';

export interface GridDimensions {
  width: number;
  height: number;
}

export type CellType = 'empty' | 'occupied' | 'wall' | 'difficult';

export interface GridCell {
  position: GridPosition;
  type: CellType;
  occupantId?: string; // ID du personnage/ennemi présent
  metadata?: {
    isHighlighted?: boolean;
    isTargetable?: boolean;
    isReachable?: boolean;
    movementCost?: number;
  };
}

export interface Grid {
  dimensions: GridDimensions;
  cells: Map<string, GridCell>; // Key: "x,y"
}

export type MovementResult = {
  success: boolean;
  path: GridPosition[];
  totalCost: number;
  error?: string;
};

export type DistanceType = 'chebyshev' | 'manhattan' | 'euclidean';

export interface GridConfig {
  defaultWidth: number;
  defaultHeight: number;
  maxMovementPerTurn: number;
  difficultTerrainCost: number; // Multiplicateur (ex: 2 = coût double)
}

// Combat Phase Types - Centralized definitions
export type DomainCombatPhase = 'setup' | 'combat' | 'victory' | 'defeat';
export type UICombatPhase = 'pre_combat' | 'initiative' | 'player_turn' | 'ai_turn' | 'victory' | 'defeat';