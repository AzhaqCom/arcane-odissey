/**
 * DOMAIN SERVICE - AIContextAnalyzer
 * Analyse du contexte de combat pour l'IA tactique
 * Respecte ARCHITECTURE_GUIDELINES.md - Règle #4 Pureté et Immutabilité
 */

import type { CombatEntity, CombatState } from '../entities/CombatEngine';
import type { CombatContext } from '../types/CombatContext';
import type { Position } from '../types/core';
import type { ILogger } from './ILogger';
import { calculateDistance, isAdjacent, getAdjacentPositions, calculateBattleIntensity } from '../types/CombatContext';

/**
 * SERVICE D'ANALYSE DE CONTEXTE
 * ✅ Toutes les méthodes sont pures
 * ✅ Analyse complète de la situation tactique
 * ✅ Fournit toutes les informations nécessaires pour la prise de décision
 */
export class AIContextAnalyzer {
  private readonly logger: ILogger;
  private readonly gridWidth = 12;
  private readonly gridHeight = 8;

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  /**
   * Analyser complètement le contexte de combat pour une entité
   */
  analyzeContext(entity: CombatEntity, combatState: CombatState): CombatContext {
    this.logger.debug('AI_CONTEXT', 'Analyzing combat context', {
      entityName: entity.name,
      entityId: entity.id,
      round: combatState.round
    });

    // Séparer alliés et ennemis
    const { allies, enemies } = this.categorizeEntities(entity, combatState.entities);

    // Analyser l'état de l'entité
    const selfAnalysis = this.analyzeSelf(entity);

    // Analyser les alliés
    const alliesAnalysis = this.analyzeAllies(entity, allies);

    // Analyser les ennemis
    const enemiesAnalysis = this.analyzeEnemies(entity, enemies);

    // Analyser la situation tactique globale
    const tacticalAnalysis = this.analyzeTacticalSituation(
      entity,
      allies,
      enemies,
      combatState
    );

    // Analyser l'espace et les positions
    const spatialAnalysis = this.analyzeSpatial(
      entity,
      combatState.entities,
      enemies
    );

    // Analyser l'historique récent
    const historyAnalysis = this.analyzeHistory(entity, combatState);

    const context: CombatContext = {
      self: selfAnalysis,
      allies: alliesAnalysis,
      enemies: enemiesAnalysis,
      tactical: tacticalAnalysis,
      spatial: spatialAnalysis,
      history: historyAnalysis
    };

    this.logger.debug('AI_CONTEXT', 'Context analysis complete', {
      entityName: entity.name,
      alliesCount: allies.length,
      enemiesCount: enemies.length,
      tacticalSituation: tacticalAnalysis.isOutnumbered ? 'outnumbered' : 'normal'
    });

    return context;
  }

  /**
   * Catégoriser les entités en alliés et ennemis
   */
  private categorizeEntities(
    entity: CombatEntity,
    allEntities: CombatEntity[]
  ): { allies: CombatEntity[], enemies: CombatEntity[] } {
    const allies: CombatEntity[] = [];
    const enemies: CombatEntity[] = [];

    for (const other of allEntities) {
      if (other.id === entity.id) continue; // Ignorer soi-même

      if (entity.type === 'enemy') {
        // Pour un ennemi, les alliés sont les autres ennemis
        if (other.type === 'enemy') {
          allies.push(other);
        } else if (other.type === 'player' || other.type === 'ally') {
          enemies.push(other);
        }
      } else {
        // Pour un joueur/allié, les ennemis sont les ennemis
        if (other.type === 'enemy') {
          enemies.push(other);
        } else if (other.type === 'player' || other.type === 'ally') {
          allies.push(other);
        }
      }
    }

    return { allies, enemies };
  }

  /**
   * Analyser l'état de l'entité elle-même
   */
  private analyzeSelf(entity: CombatEntity): CombatContext['self'] {
    const healthPercentage = (entity.hitPoints / entity.maxHitPoints) * 100;

    return {
      entity,
      healthPercentage,
      hasActionAvailable: entity.actionsRemaining.action,
      movementRemaining: entity.actionsRemaining.movement,
      isInjured: healthPercentage < 50,
      isCritical: healthPercentage < 25
    };
  }

  /**
   * Analyser les alliés
   */
  private analyzeAllies(entity: CombatEntity, allies: CombatEntity[]): CombatContext['allies'] {
    const alive = allies.filter(a => !a.isDead);
    const dead = allies.filter(a => a.isDead);
    const injured = alive.filter(a => (a.hitPoints / a.maxHitPoints) < 0.5);

    const averageHealthPercentage = alive.length > 0
      ? alive.reduce((sum, a) => sum + (a.hitPoints / a.maxHitPoints) * 100, 0) / alive.length
      : 0;

    const closestAlly = alive.length > 0
      ? alive.reduce((closest, current) => {
          const currentDist = calculateDistance(entity.position, current.position);
          const closestDist = calculateDistance(entity.position, closest.position);
          return currentDist < closestDist ? current : closest;
        })
      : null;

    // Calculer l'intégrité de formation (cohésion du groupe)
    const formationIntegrity = this.calculateFormationIntegrity(entity, alive);

    return {
      count: allies.length,
      alive,
      dead,
      injured,
      averageHealthPercentage,
      closestAlly,
      formationIntegrity
    };
  }

  /**
   * Analyser les ennemis
   */
  private analyzeEnemies(entity: CombatEntity, enemies: CombatEntity[]): CombatContext['enemies'] {
    const alive = enemies.filter(e => !e.isDead);
    const dead = enemies.filter(e => e.isDead);
    const injured = alive.filter(e => (e.hitPoints / e.maxHitPoints) < 0.5);

    const averageHealthPercentage = alive.length > 0
      ? alive.reduce((sum, e) => sum + (e.hitPoints / e.maxHitPoints) * 100, 0) / alive.length
      : 0;

    const closest = alive.length > 0
      ? alive.reduce((closest, current) => {
          const currentDist = calculateDistance(entity.position, current.position);
          const closestDist = calculateDistance(entity.position, closest.position);
          return currentDist < closestDist ? current : closest;
        })
      : null;

    const weakest = alive.length > 0
      ? alive.reduce((weakest, current) =>
          current.hitPoints < weakest.hitPoints ? current : weakest
        )
      : null;

    const strongest = alive.length > 0
      ? alive.reduce((strongest, current) =>
          current.hitPoints > strongest.hitPoints ? current : strongest
        )
      : null;

    // Le plus dangereux = niveau le plus élevé + le plus de HP restants
    const mostDangerous = alive.length > 0
      ? alive.reduce((dangerous, current) => {
          const currentDanger = current.level * 10 + current.hitPoints;
          const dangerousDanger = dangerous.level * 10 + dangerous.hitPoints;
          return currentDanger > dangerousDanger ? current : dangerous;
        })
      : null;

    // Ennemis isolés (pas d'allié dans un rayon de 3 cases)
    const isolated = alive.filter(enemy => {
      const nearbyAllies = alive.filter(other =>
        other.id !== enemy.id && calculateDistance(enemy.position, other.position) <= 3
      );
      return nearbyAllies.length === 0;
    });

    return {
      count: enemies.length,
      alive,
      dead,
      injured,
      averageHealthPercentage,
      closest,
      weakest,
      strongest,
      mostDangerous,
      isolated
    };
  }

  /**
   * Analyser la situation tactique globale
   */
  private analyzeTacticalSituation(
    entity: CombatEntity,
    allies: CombatEntity[],
    enemies: CombatEntity[],
    combatState: CombatState
  ): CombatContext['tactical'] {
    const aliveAllies = allies.filter(a => !a.isDead);
    const aliveEnemies = enemies.filter(e => !e.isDead);

    const totalAllies = aliveAllies.length + 1; // +1 pour l'entité elle-même
    const totalEnemies = aliveEnemies.length;

    const isOutnumbered = totalEnemies > totalAllies;
    const outnumberRatio = totalAllies > 0 ? totalEnemies / totalAllies : 999;

    // Calculer l'avantage en HP totaux
    const alliesHP = entity.hitPoints + aliveAllies.reduce((sum, a) => sum + a.hitPoints, 0);
    const enemiesHP = aliveEnemies.reduce((sum, e) => sum + e.hitPoints, 0);
    const isWinning = alliesHP > enemiesHP * 1.5;

    // Situation désespérée si tous < 25% HP
    const isDesperate = entity.hitPoints < entity.maxHitPoints * 0.25 &&
      aliveAllies.every(a => a.hitPoints < a.maxHitPoints * 0.25);

    // Avantage en portée
    const hasRangedAdvantage = this.calculateRangedAdvantage(entity, aliveAllies, aliveEnemies);
    const hasMeleeAdvantage = this.calculateMeleeAdvantage(entity, aliveAllies, aliveEnemies);

    // Distance moyenne aux ennemis
    const averageDistance = aliveEnemies.length > 0
      ? aliveEnemies.reduce((sum, e) => sum + calculateDistance(entity.position, e.position), 0) / aliveEnemies.length
      : 0;

    // Intensité de bataille basée sur les narratifs récents
    const recentDamage = this.calculateRecentDamage(combatState);
    const battleIntensity = calculateBattleIntensity(recentDamage, totalAllies + totalEnemies);

    return {
      isOutnumbered,
      outnumberRatio,
      isWinning,
      isDesperate,
      hasRangedAdvantage,
      hasMeleeAdvantage,
      averageDistance,
      battleIntensity
    };
  }

  /**
   * Analyser l'espace et les positions disponibles
   */
  private analyzeSpatial(
    entity: CombatEntity,
    allEntities: CombatEntity[],
    enemies: CombatEntity[]
  ): CombatContext['spatial'] {
    const myPosition = entity.position;
    
    // Calculer les positions atteignables
    const reachablePositions = this.calculateReachablePositions(entity, allEntities);
    
    // Positions à portée optimale (selon l'arme principale)
    const optimalRangePositions = this.calculateOptimalRangePositions(
      entity,
      enemies,
      reachablePositions
    );
    
    // Positions sûres (hors de portée ennemie)
    const safePositions = this.calculateSafePositions(
      reachablePositions,
      enemies
    );
    
    // Positions de flanc
    const flankingPositions = this.calculateFlankingPositions(
      reachablePositions,
      enemies,
      allEntities
    );
    
    // Points d'étranglement (positions contrôlant des passages)
    const chokePoints = this.identifyChokePoints(reachablePositions);
    
    // Routes d'évasion
    const escapeRoutes = this.calculateEscapeRoutes(
      entity,
      reachablePositions,
      enemies
    );

    return {
      myPosition,
      reachablePositions,
      optimalRangePositions,
      safePositions,
      flankingPositions,
      chokePoints,
      escapeRoutes
    };
  }

  /**
   * Analyser l'historique récent du combat
   */
  private analyzeHistory(
    entity: CombatEntity,
    combatState: CombatState
  ): CombatContext['history'] {
    // Analyser les narratifs récents pour cette entité
    const recentNarratives = combatState.narratives
      .filter(n => n.actors.includes(entity.name))
      .slice(-10); // Les 10 derniers événements

    let lastTurnDamageTaken = 0;
    let lastTurnDamageDealt = 0;
    let consecutiveHits = 0;
    let consecutiveMisses = 0;

    // Parcourir les narratifs pour extraire les statistiques
    for (const narrative of recentNarratives) {
      if (narrative.type === 'attack_success' || narrative.type === 'critical_hit') {
        if (narrative.actors[0] === entity.name) {
          lastTurnDamageDealt += narrative.details?.damage || 0;
          consecutiveHits++;
          consecutiveMisses = 0;
        } else if (narrative.actors[1] === entity.name) {
          lastTurnDamageTaken += narrative.details?.damage || 0;
        }
      } else if (narrative.type === 'attack_miss') {
        if (narrative.actors[0] === entity.name) {
          consecutiveMisses++;
          consecutiveHits = 0;
        }
      }
    }

    // Compter les tours sans dégâts (approximation)
    const turnsWithoutDamage = recentNarratives.filter(
      n => n.type === 'turn_start' && n.actors[0] === entity.name
    ).length - (consecutiveHits > 0 ? 1 : 0);

    // Compter les alliés perdus et ennemis tués
    const alliesLostThisCombat = combatState.narratives.filter(
      n => n.details?.targetDefeated && 
           n.actors[1] !== entity.name && 
           this.isAllyNarrative(entity, n.actors[1])
    ).length;

    const enemiesKilledThisCombat = combatState.narratives.filter(
      n => n.details?.targetDefeated && 
           n.actors[0] === entity.name
    ).length;

    return {
      lastTurnDamageTaken,
      lastTurnDamageDealt,
      turnsWithoutDamage: Math.max(0, turnsWithoutDamage),
      consecutiveHits,
      consecutiveMisses,
      alliesLostThisCombat,
      enemiesKilledThisCombat
    };
  }

  // === MÉTHODES HELPER ===

  /**
   * Calculer l'intégrité de formation du groupe
   */
  private calculateFormationIntegrity(entity: CombatEntity, allies: CombatEntity[]): number {
    if (allies.length === 0) return 100;

    // Calculer la distance moyenne entre alliés
    let totalDistance = 0;
    let pairCount = 0;

    const allMembers = [entity, ...allies];
    for (let i = 0; i < allMembers.length; i++) {
      for (let j = i + 1; j < allMembers.length; j++) {
        totalDistance += calculateDistance(allMembers[i].position, allMembers[j].position);
        pairCount++;
      }
    }

    const avgDistance = pairCount > 0 ? totalDistance / pairCount : 0;
    
    // Formation serrée = 2-3 cases, lâche = 5+ cases
    if (avgDistance <= 3) return 100;
    if (avgDistance <= 5) return 70;
    if (avgDistance <= 7) return 40;
    return 10;
  }

  /**
   * Calculer les positions atteignables
   */
  private calculateReachablePositions(
    entity: CombatEntity,
    allEntities: CombatEntity[]
  ): Position[] {
    const movementRange = Math.floor(entity.actionsRemaining.movement / 5);
    if (movementRange <= 0) return [];

    const reachable: Position[] = [];
    const occupiedPositions = allEntities
      .filter(e => !e.isDead && e.id !== entity.id)
      .map(e => e.position);

    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const distance = calculateDistance(entity.position, { x, y });
        
        if (distance <= movementRange && distance > 0) {
          // Vérifier que la position n'est pas occupée
          const isOccupied = occupiedPositions.some(pos => pos.x === x && pos.y === y);
          if (!isOccupied) {
            reachable.push({ x, y });
          }
        }
      }
    }

    return reachable;
  }

  /**
   * Calculer les positions à portée optimale
   */
  private calculateOptimalRangePositions(
    entity: CombatEntity,
    enemies: CombatEntity[],
    reachablePositions: Position[]
  ): Position[] {
    // Pour l'instant, considérer optimal = peut attaquer au moins un ennemi
    return reachablePositions.filter(pos => {
      const targetsFromPos = enemies.filter(enemy => {
        const dist = calculateDistance(pos, enemy.position);
        return dist <= 8 && !enemy.isDead; // Portée max théorique
      });
      return targetsFromPos.length > 0;
    });
  }

  /**
   * Calculer les positions sûres
   */
  private calculateSafePositions(
    reachablePositions: Position[],
    enemies: CombatEntity[]
  ): Position[] {
    return reachablePositions.filter(pos => {
      // Une position est sûre si aucun ennemi ne peut l'attaquer
      const threateningEnemies = enemies.filter(enemy => {
        if (enemy.isDead) return false;
        const dist = calculateDistance(pos, enemy.position);
        return dist <= 8; // Portée max théorique d'attaque
      });
      return threateningEnemies.length === 0;
    });
  }

  /**
   * Calculer les positions de flanc
   */
  private calculateFlankingPositions(
    reachablePositions: Position[],
    enemies: CombatEntity[],
    allEntities: CombatEntity[]
  ): Position[] {
    const aliveEnemies = enemies.filter(e => !e.isDead);
    if (aliveEnemies.length === 0) return [];

    return reachablePositions.filter(pos => {
      // Une position de flanc est adjacente à un ennemi
      // mais avec un allié de l'autre côté
      for (const enemy of aliveEnemies) {
        if (isAdjacent(pos, enemy.position)) {
          // Vérifier si un allié est de l'autre côté
          const oppositeX = enemy.position.x * 2 - pos.x;
          const oppositeY = enemy.position.y * 2 - pos.y;
          
          const allyOnOtherSide = allEntities.some(e =>
            !e.isDead &&
            e.type !== 'enemy' &&
            e.position.x === oppositeX &&
            e.position.y === oppositeY
          );
          
          if (allyOnOtherSide) return true;
        }
      }
      return false;
    });
  }

  /**
   * Identifier les points d'étranglement
   */
  private identifyChokePoints(reachablePositions: Position[]): Position[] {
    // Simplification : les points d'étranglement sont les positions
    // avec peu de cases adjacentes libres (couloirs, passages)
    return reachablePositions.filter(pos => {
      const adjacent = getAdjacentPositions(pos, this.gridWidth, this.gridHeight);
      const freeAdjacent = adjacent.filter(adj =>
        reachablePositions.some(r => r.x === adj.x && r.y === adj.y)
      );
      return freeAdjacent.length <= 2; // Couloir ou coin
    });
  }

  /**
   * Calculer les routes d'évasion
   */
  private calculateEscapeRoutes(
    entity: CombatEntity,
    reachablePositions: Position[],
    enemies: CombatEntity[]
  ): Position[] {
    if (enemies.length === 0) return [];

    // Routes d'évasion = positions qui s'éloignent des ennemis
    const enemyCenter = this.calculateCenter(enemies.map(e => e.position));
    const currentDistToCenter = calculateDistance(entity.position, enemyCenter);

    return reachablePositions.filter(pos => {
      const newDistToCenter = calculateDistance(pos, enemyCenter);
      return newDistToCenter > currentDistToCenter;
    });
  }

  /**
   * Calculer le centre d'un groupe de positions
   */
  private calculateCenter(positions: Position[]): Position {
    if (positions.length === 0) return { x: 6, y: 4 };

    const sumX = positions.reduce((sum, pos) => sum + pos.x, 0);
    const sumY = positions.reduce((sum, pos) => sum + pos.y, 0);

    return {
      x: Math.round(sumX / positions.length),
      y: Math.round(sumY / positions.length)
    };
  }

  /**
   * Calculer l'avantage en armes à distance
   */
  private calculateRangedAdvantage(
    entity: CombatEntity,
    allies: CombatEntity[],
    enemies: CombatEntity[]
  ): boolean {
    // Simplification : compter ceux qui ont des arcs ou armes à distance
    const alliesWithRanged = [entity, ...allies].filter(e =>
      e.equipment?.weapons?.some(w => w.includes('bow') || w.includes('crossbow'))
    ).length;

    const enemiesWithRanged = enemies.filter(e =>
      e.equipment?.weapons?.some(w => w.includes('bow') || w.includes('crossbow'))
    ).length;

    return alliesWithRanged > enemiesWithRanged;
  }

  /**
   * Calculer l'avantage en mêlée
   */
  private calculateMeleeAdvantage(
    entity: CombatEntity,
    allies: CombatEntity[],
    enemies: CombatEntity[]
  ): boolean {
    // Simplification : compter ceux avec force élevée
    const alliesStrength = [entity, ...allies]
      .reduce((sum, e) => sum + e.stats.strength, 0);

    const enemiesStrength = enemies
      .reduce((sum, e) => sum + e.stats.strength, 0);

    return alliesStrength > enemiesStrength;
  }

  /**
   * Calculer les dégâts récents du combat
   */
  private calculateRecentDamage(combatState: CombatState): number {
    // Somme des dégâts dans les 5 derniers narratifs
    return combatState.narratives
      .slice(-5)
      .reduce((sum, n) => sum + (n.details?.damage || 0), 0);
  }

  /**
   * Vérifier si un nom correspond à un allié dans les narratifs
   */
  private isAllyNarrative(entity: CombatEntity, name: string): boolean {
    // Simplification : si l'entité est un ennemi, ses alliés sont les ennemis
    // Cette méthode est approximative pour l'historique
    return entity.type === 'enemy' ? name.includes('Goblin') || name.includes('Orc') : true;
  }
}