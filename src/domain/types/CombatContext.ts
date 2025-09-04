/**
 * DOMAIN TYPE - CombatContext
 * Contexte de combat pour analyse tactique par l'IA
 * Respecte ARCHITECTURE_GUIDELINES.md - Types purs sans dépendance
 */

import type { CombatEntity } from '../entities/CombatEngine';
import type { Position } from './core';

/**
 * Analyse contextuelle du combat pour une entité
 * Fourni toutes les informations nécessaires pour prendre des décisions tactiques
 */
export interface CombatContext {
  /**
   * État de l'entité qui prend la décision
   */
  readonly self: {
    readonly entity: CombatEntity;
    readonly healthPercentage: number;
    readonly hasActionAvailable: boolean;
    readonly movementRemaining: number;
    readonly isInjured: boolean; // < 50% HP
    readonly isCritical: boolean; // < 25% HP
  };
  
  /**
   * Analyse des alliés
   */
  readonly allies: {
    readonly count: number;
    readonly alive: ReadonlyArray<CombatEntity>;
    readonly dead: ReadonlyArray<CombatEntity>;
    readonly injured: ReadonlyArray<CombatEntity>; // < 50% HP
    readonly averageHealthPercentage: number;
    readonly closestAlly: CombatEntity | null;
    readonly formationIntegrity: number; // 0-100, cohésion du groupe
  };
  
  /**
   * Analyse des ennemis
   */
  readonly enemies: {
    readonly count: number;
    readonly alive: ReadonlyArray<CombatEntity>;
    readonly dead: ReadonlyArray<CombatEntity>;
    readonly injured: ReadonlyArray<CombatEntity>; // < 50% HP
    readonly averageHealthPercentage: number;
    readonly closest: CombatEntity | null;
    readonly weakest: CombatEntity | null;
    readonly strongest: CombatEntity | null;
    readonly mostDangerous: CombatEntity | null; // Basé sur niveau et dégâts potentiels
    readonly isolated: ReadonlyArray<CombatEntity>; // Ennemis sans alliés proches
  };
  
  /**
   * Situation tactique globale
   */
  readonly tactical: {
    readonly isOutnumbered: boolean;
    readonly outnumberRatio: number; // enemies/allies
    readonly isWinning: boolean; // Plus de 50% d'avantage en HP totaux
    readonly isDesperate: boolean; // Tous les alliés < 25% HP
    readonly hasRangedAdvantage: boolean; // Plus d'archers que l'ennemi
    readonly hasMeleeAdvantage: boolean; // Plus de mêlée que l'ennemi
    readonly averageDistance: number; // Distance moyenne aux ennemis
    readonly battleIntensity: 'low' | 'medium' | 'high'; // Basé sur les dégâts récents
  };
  
  /**
   * Informations spatiales et de terrain
   */
  readonly spatial: {
    readonly myPosition: Position;
    readonly reachablePositions: ReadonlyArray<Position>;
    readonly optimalRangePositions: ReadonlyArray<Position>; // Positions à portée préférée
    readonly safePositions: ReadonlyArray<Position>; // Positions hors de portée ennemie
    readonly flankingPositions: ReadonlyArray<Position>; // Positions de flanc
    readonly chokePoints: ReadonlyArray<Position>; // Points d'étranglement
    readonly escapeRoutes: ReadonlyArray<Position>; // Chemins de fuite
  };
  
  /**
   * Historique récent (pour décisions basées sur patterns)
   */
  readonly history: {
    readonly lastTurnDamageTaken: number;
    readonly lastTurnDamageDealt: number;
    readonly turnsWithoutDamage: number;
    readonly consecutiveHits: number;
    readonly consecutiveMisses: number;
    readonly alliesLostThisCombat: number;
    readonly enemiesKilledThisCombat: number;
  };
}

/**
 * Action de tour unifiée pour le nouveau système
 */
export interface CombatTurnAction {
  readonly type: 'execute_turn';
  readonly entityId: string;
  readonly movement?: Position;      // Position où se déplacer (optionnel)
  readonly attackTarget?: string;     // ID de la cible à attaquer (optionnel)
  readonly useAbility?: string;       // Capacité spéciale à utiliser (optionnel)
  readonly defendPosition?: boolean;  // Se mettre en défense (optionnel)
}

/**
 * Option de tour évaluée avec son score
 */
export interface ScoredTurnOption {
  readonly action: CombatTurnAction;
  readonly score: number;
  readonly breakdown: {
    readonly positionScore: number;
    readonly targetScore: number;
    readonly survivalScore: number;
    readonly teamworkScore: number;
    readonly styleScore: number; // Conformité au style de combat préféré
  };
  readonly risks: ReadonlyArray<string>; // Risques identifiés
  readonly benefits: ReadonlyArray<string>; // Bénéfices attendus
}

/**
 * Helper pour calculer la distance Chebyshev entre deux positions
 * Distance tactique D&D : diagonales comptent comme 1 case
 */
export function calculateDistance(pos1: Position, pos2: Position): number {
  return Math.max(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y - pos2.y));
}

/**
 * Helper pour vérifier si une position est adjacente
 */
export function isAdjacent(pos1: Position, pos2: Position): boolean {
  return calculateDistance(pos1, pos2) === 1;
}

/**
 * Helper pour trouver les positions adjacentes (incluant diagonales)
 */
export function getAdjacentPositions(pos: Position, gridWidth: number = 12, gridHeight: number = 8): Position[] {
  const adjacent: Position[] = [];
  const directions = [
    { x: 0, y: -1 }, // Nord
    { x: 1, y: -1 }, // Nord-Est
    { x: 1, y: 0 },  // Est
    { x: 1, y: 1 },  // Sud-Est
    { x: 0, y: 1 },  // Sud
    { x: -1, y: 1 }, // Sud-Ouest
    { x: -1, y: 0 }, // Ouest
    { x: -1, y: -1 } // Nord-Ouest
  ];
  
  for (const dir of directions) {
    const newX = pos.x + dir.x;
    const newY = pos.y + dir.y;
    
    if (newX >= 0 && newX < gridWidth && newY >= 0 && newY < gridHeight) {
      adjacent.push({ x: newX, y: newY });
    }
  }
  
  return adjacent;
}

/**
 * Helper pour calculer l'intensité de bataille
 */
export function calculateBattleIntensity(
  recentDamage: number,
  entityCount: number
): 'low' | 'medium' | 'high' {
  const damagePerEntity = recentDamage / Math.max(1, entityCount);
  
  if (damagePerEntity < 5) return 'low';
  if (damagePerEntity < 15) return 'medium';
  return 'high';
}