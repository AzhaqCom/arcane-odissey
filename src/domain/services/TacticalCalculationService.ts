/**
 * DOMAIN SERVICE - TacticalCalculationService
 * Service de calculs tactiques et de positionnement selon les règles D&D 5E
 * Respecte la Règle #3 - Logique Métier dans Domain
 */

import type { Position } from '../types/core';

export class TacticalCalculationService {
  /**
   * Calcule la distance de Chebyshev entre deux positions
   * Distance tactique D&D : les diagonales comptent comme 1 case
   * 
   * @param from - Position de départ
   * @param to - Position d'arrivée
   * @returns Distance en cases
   */
  static calculateManhattanDistance(from: Position, to: Position): number {
    return Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
  }

  /**
   * Calcule la distance euclidienne entre deux positions
   * Utilisée pour certains effets de zone ou calculs précis
   * 
   * @param from - Position de départ
   * @param to - Position d'arrivée
   * @returns Distance euclidienne
   */
  static calculateEuclideanDistance(from: Position, to: Position): number {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Vérifie si une position est dans la portée d'une autre
   * 
   * @param from - Position de départ
   * @param to - Position cible
   * @param range - Portée en cases
   * @returns true si dans la portée
   */
  static isWithinRange(from: Position, to: Position, range: number): boolean {
    const distance = this.calculateManhattanDistance(from, to);
    return distance <= range;
  }

  /**
   * Vérifie si une position est adjacente à une autre (portée 1)
   * 
   * @param from - Position de départ
   * @param to - Position cible
   * @returns true si adjacent
   */
  static isAdjacent(from: Position, to: Position): boolean {
    return this.isWithinRange(from, to, 1);
  }

  /**
   * Calcule toutes les positions dans une portée donnée
   * 
   * @param center - Position centrale
   * @param range - Portée en cases
   * @param gridWidth - Largeur de la grille
   * @param gridHeight - Hauteur de la grille
   * @returns Liste des positions dans la portée
   */
  static getPositionsInRange(
    center: Position, 
    range: number, 
    gridWidth: number, 
    gridHeight: number
  ): Position[] {
    const positions: Position[] = [];

    for (let x = 0; x < gridWidth; x++) {
      for (let y = 0; y < gridHeight; y++) {
        const position = { x, y };
        if (this.isWithinRange(center, position, range)) {
          positions.push(position);
        }
      }
    }

    return positions;
  }

  /**
   * Calcule le coût de mouvement entre deux positions
   * Prend en compte le terrain difficile selon les règles D&D
   * 
   * @param from - Position de départ
   * @param to - Position d'arrivée
   * @param isDifficultTerrain - true si terrain difficile (coût x2)
   * @returns Coût de mouvement en cases
   */
  static calculateMovementCost(from: Position, to: Position, isDifficultTerrain: boolean = false): number {
    const distance = this.calculateManhattanDistance(from, to);
    return isDifficultTerrain ? distance * 2 : distance;
  }

  /**
   * Vérifie si une ligne de vue est dégagée entre deux positions
   * Algorithme de Bresenham pour tracer la ligne
   * 
   * @param from - Position de départ
   * @param to - Position cible
   * @param obstacles - Positions bloquantes
   * @returns true si ligne de vue dégagée
   */
  static hasLineOfSight(from: Position, to: Position, obstacles: Position[] = []): boolean {
    // Si même position, ligne de vue dégagée
    if (from.x === to.x && from.y === to.y) {
      return true;
    }

    // Algorithme de Bresenham simplifié
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);
    const sx = from.x < to.x ? 1 : -1;
    const sy = from.y < to.y ? 1 : -1;
    let err = dx - dy;

    let x = from.x;
    let y = from.y;

    while (true) {
      // Vérifier si position actuelle est un obstacle (sauf départ et arrivée)
      if ((x !== from.x || y !== from.y) && (x !== to.x || y !== to.y)) {
        const isObstacle = obstacles.some(obs => obs.x === x && obs.y === y);
        if (isObstacle) {
          return false;
        }
      }

      // Arrivé à destination
      if (x === to.x && y === to.y) {
        break;
      }

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }

    return true;
  }
}