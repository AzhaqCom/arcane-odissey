/**
 * DOMAIN ENTITY - TacticalGrid
 * Pure business logic pour grille tactique D&D
 */

export interface GridPosition {
  readonly x: number;
  readonly y: number;
}

export interface GridDimensions {
  readonly width: number;
  readonly height: number;
}

export type TerrainType = 'normal' | 'difficult' | 'impassable' | 'water' | 'pit';
export type CoverType = 'none' | 'half' | 'three_quarters' | 'full';

export interface GridCell {
  readonly position: GridPosition;
  terrain: TerrainType;
  cover: CoverType;
  occupiedBy?: string; // ID de l'entité qui occupe la case
  isVisible: boolean;
}

/**
 * TACTICAL GRID - Aggregate Root
 * Gère la grille de combat tactique avec règles D&D 5E
 */
export class TacticalGrid {
  private readonly _dimensions: GridDimensions;
  private readonly _cells = new Map<string, GridCell>();

  constructor(dimensions: GridDimensions) {
    this._dimensions = dimensions;
    this.initializeGrid();
  }

  // GETTERS
  get dimensions(): GridDimensions { return this._dimensions; }
  get allCells(): ReadonlyMap<string, GridCell> { return this._cells; }

  // BUSINESS RULES - Position & Distance

  /**
   * Vérifier si une position est valide sur la grille
   */
  isValidPosition(pos: GridPosition): boolean {
    return pos.x >= 0 && pos.x < this._dimensions.width &&
           pos.y >= 0 && pos.y < this._dimensions.height;
  }

  /**
   * Calculer la distance Chebyshev entre deux positions (D&D 5E)
   * Distance = max(|x1-x2|, |y1-y2|)
   */
  calculateDistance(from: GridPosition, to: GridPosition): number {
    return Math.max(Math.abs(from.x - to.x), Math.abs(from.y - to.y));
  }

  /**
   * Calculer la distance Manhattan (pour terrain difficile)
   */
  calculateManhattanDistance(from: GridPosition, to: GridPosition): number {
    return Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
  }

  /**
   * Obtenir toutes les positions dans un rayon donné
   */
  getPositionsInRadius(center: GridPosition, radius: number): GridPosition[] {
    const positions: GridPosition[] = [];
    
    for (let x = center.x - radius; x <= center.x + radius; x++) {
      for (let y = center.y - radius; y <= center.y + radius; y++) {
        const pos = { x, y };
        
        if (this.isValidPosition(pos) && 
            this.calculateDistance(center, pos) <= radius) {
          positions.push(pos);
        }
      }
    }
    
    return positions;
  }

  /**
   * Obtenir les positions adjacentes (8 directions)
   */
  getAdjacentPositions(pos: GridPosition): GridPosition[] {
    const adjacent: GridPosition[] = [];
    
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue; // Skip center
        
        const newPos = { x: pos.x + dx, y: pos.y + dy };
        if (this.isValidPosition(newPos)) {
          adjacent.push(newPos);
        }
      }
    }
    
    return adjacent;
  }

  // BUSINESS RULES - Ligne de vue

  /**
   * Vérifier la ligne de vue entre deux positions (règles D&D 5E)
   */
  hasLineOfSight(from: GridPosition, to: GridPosition): boolean {
    // Algorithme de Bresenham pour tracer la ligne
    const line = this.getLinePositions(from, to);
    
    // Vérifier chaque case sur la ligne (sauf origine et destination)
    for (let i = 1; i < line.length - 1; i++) {
      const cell = this.getCell(line[i]);
      if (!cell) continue;
      
      // Terrain impassable bloque la vue
      if (cell.terrain === 'impassable') {
        return false;
      }
      
      // Couverture totale bloque la vue
      if (cell.cover === 'full') {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Calculer le type de couverture entre attaquant et cible
   */
  calculateCover(from: GridPosition, to: GridPosition): CoverType {
    if (!this.hasLineOfSight(from, to)) {
      return 'full';
    }
    
    const line = this.getLinePositions(from, to);
    let coverLevel = 0;
    
    // Analyser chaque case sur la ligne
    for (let i = 1; i < line.length - 1; i++) {
      const cell = this.getCell(line[i]);
      if (!cell) continue;
      
      switch (cell.cover) {
        case 'half':
          coverLevel = Math.max(coverLevel, 1);
          break;
        case 'three_quarters':
          coverLevel = Math.max(coverLevel, 2);
          break;
      }
    }
    
    switch (coverLevel) {
      case 0: return 'none';
      case 1: return 'half';
      case 2: return 'three_quarters';
      default: return 'full';
    }
  }

  // BUSINESS RULES - Occupation & Mouvement

  /**
   * Vérifier si une case est libre
   */
  isCellFree(pos: GridPosition): boolean {
    const cell = this.getCell(pos);
    return cell !== null && !cell.occupiedBy && cell.terrain !== 'impassable';
  }

  /**
   * Occuper une case avec une entité
   */
  occupyCell(pos: GridPosition, entityId: string): boolean {
    if (!this.isCellFree(pos)) return false;
    
    const cell = this.getCell(pos);
    if (!cell) return false;
    
    cell.occupiedBy = entityId;
    return true;
  }

  /**
   * Libérer une case
   */
  freeCell(pos: GridPosition): boolean {
    const cell = this.getCell(pos);
    if (!cell) return false;
    
    cell.occupiedBy = undefined;
    return true;
  }

  /**
   * Déplacer une entité d'une position à une autre
   */
  moveEntity(entityId: string, from: GridPosition, to: GridPosition): boolean {
    const fromCell = this.getCell(from);
    const toCell = this.getCell(to);
    
    if (!fromCell || !toCell) return false;
    if (fromCell.occupiedBy !== entityId) return false;
    if (!this.isCellFree(to)) return false;
    
    // Libérer l'ancienne position
    fromCell.occupiedBy = undefined;
    
    // Occuper la nouvelle position
    toCell.occupiedBy = entityId;
    
    return true;
  }

  /**
   * Calculer le coût de mouvement vers une case (terrain difficile = x2)
   */
  getMovementCost(from: GridPosition, to: GridPosition): number {
    const distance = this.calculateDistance(from, to);
    const toCell = this.getCell(to);
    
    if (!toCell || toCell.terrain === 'impassable') {
      return Infinity;
    }
    
    let baseCost = distance;
    
    // Terrain difficile double le coût
    if (toCell.terrain === 'difficult') {
      baseCost *= 2;
    }
    
    return baseCost;
  }

  // BUSINESS RULES - Zones d'effet

  /**
   * Obtenir toutes les positions dans une zone d'effet
   */
  getAreaOfEffect(center: GridPosition, shape: 'circle' | 'cone' | 'line' | 'square', size: number, direction?: GridPosition): GridPosition[] {
    switch (shape) {
      case 'circle':
        return this.getCircleArea(center, size);
      case 'square':
        return this.getSquareArea(center, size);
      case 'cone':
        return direction ? this.getConeArea(center, direction, size) : [];
      case 'line':
        return direction ? this.getLineArea(center, direction, size) : [];
      default:
        return [];
    }
  }

  // UTILITAIRES PRIVÉES

  private initializeGrid(): void {
    for (let x = 0; x < this._dimensions.width; x++) {
      for (let y = 0; y < this._dimensions.height; y++) {
        const pos = { x, y };
        const cell: GridCell = {
          position: pos,
          terrain: 'normal',
          cover: 'none',
          isVisible: true
        };
        
        this._cells.set(this.positionToKey(pos), cell);
      }
    }
  }

  private getCell(pos: GridPosition): GridCell | null {
    return this._cells.get(this.positionToKey(pos)) || null;
  }

  private positionToKey(pos: GridPosition): string {
    return `${pos.x},${pos.y}`;
  }

  private getLinePositions(from: GridPosition, to: GridPosition): GridPosition[] {
    const positions: GridPosition[] = [];
    
    // Algorithme de Bresenham
    let x0 = from.x, y0 = from.y;
    const x1 = to.x, y1 = to.y;
    
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      positions.push({ x: x0, y: y0 });
      
      if (x0 === x1 && y0 === y1) break;
      
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
    
    return positions;
  }

  private getCircleArea(center: GridPosition, radius: number): GridPosition[] {
    return this.getPositionsInRadius(center, radius);
  }

  private getSquareArea(center: GridPosition, size: number): GridPosition[] {
    const positions: GridPosition[] = [];
    const halfSize = Math.floor(size / 2);
    
    for (let x = center.x - halfSize; x <= center.x + halfSize; x++) {
      for (let y = center.y - halfSize; y <= center.y + halfSize; y++) {
        const pos = { x, y };
        if (this.isValidPosition(pos)) {
          positions.push(pos);
        }
      }
    }
    
    return positions;
  }

  private getConeArea(origin: GridPosition, direction: GridPosition, range: number): GridPosition[] {
    // Implémentation simplifiée du cône
    const positions: GridPosition[] = [];
    const line = this.getLinePositions(origin, direction);
    
    for (let distance = 1; distance <= range; distance++) {
      const width = Math.ceil(distance / 2);
      
      if (distance < line.length) {
        const centerPos = line[distance];
        
        for (let offset = -width; offset <= width; offset++) {
          // Calculer les positions perpendiculaires à la ligne
          const pos = this.getPerpendicularPosition(centerPos, line[distance - 1], offset);
          if (this.isValidPosition(pos)) {
            positions.push(pos);
          }
        }
      }
    }
    
    return positions;
  }

  private getLineArea(origin: GridPosition, direction: GridPosition, length: number): GridPosition[] {
    const endPos = {
      x: origin.x + Math.sign(direction.x - origin.x) * length,
      y: origin.y + Math.sign(direction.y - origin.y) * length
    };
    
    return this.getLinePositions(origin, endPos);
  }

  private getPerpendicularPosition(center: GridPosition, reference: GridPosition, offset: number): GridPosition {
    // Calculer position perpendiculaire (simplifié)
    const dx = center.x - reference.x;
    const dy = center.y - reference.y;
    
    return {
      x: center.x + dy * offset,
      y: center.y - dx * offset
    };
  }
}