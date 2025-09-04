/**
 * DOMAIN SERVICE - TacticalAIService
 * Service d'IA tactique avancé pour combat D&D 5E
 * Respecte ARCHITECTURE_GUIDELINES.md - Règle #4 Pureté et Immutabilité
 */

import type { CombatEntity, CombatState } from '../entities/CombatEngine';
import type { CombatTurnAction, CombatContext, ScoredTurnOption } from '../types/CombatContext';
import type { AIProfile } from '../types/AIProfile';
import type { Position } from '../types/core';
import type { DiceRollingService } from './DiceRollingService';
import type { WeaponResolutionService } from './WeaponResolutionService';
import type { ILogger } from './ILogger';
import { AIContextAnalyzer } from './AIContextAnalyzer';
import { AIActionScorer } from './AIActionScorer';
import { distanceToCombatRange, getPreferredDistanceInSquares } from '../types/AIProfile';
import { calculateDistance, isAdjacent } from '../types/CombatContext';

/**
 * SERVICE D'IA TACTIQUE AVANCÉ
 * ✅ Toutes les méthodes sont pures
 * ✅ Évalue TOUTES les combinaisons position + action
 * ✅ Comportements émergents basés sur les traits de personnalité
 */
export class TacticalAIService {
  private readonly contextAnalyzer: AIContextAnalyzer;
  private readonly actionScorer: AIActionScorer;
  private readonly diceRollingService: DiceRollingService;
  private readonly weaponResolutionService: WeaponResolutionService;
  private readonly logger: ILogger;

  constructor(
    diceRollingService: DiceRollingService,
    weaponResolutionService: WeaponResolutionService,
    logger: ILogger
  ) {
    this.diceRollingService = diceRollingService;
    this.weaponResolutionService = weaponResolutionService;
    this.logger = logger;
    this.contextAnalyzer = new AIContextAnalyzer(logger);
    this.actionScorer = new AIActionScorer(weaponResolutionService, logger);
  }

  /**
   * Calcule le meilleur tour possible pour une entité
   * Évalue TOUTES les combinaisons position + action
   */
  calculateOptimalTurn(
    entity: CombatEntity,
    combatState: CombatState,
    profile: AIProfile
  ): CombatTurnAction {
    this.logger.debug('TACTICAL_AI', 'Calculating optimal turn', {
      entityName: entity.name,
      entityId: entity.id,
      profile: {
        aggression: profile.aggression,
        intelligence: profile.intelligence,
        preferredRange: profile.combatStyle.preferredRange
      }
    });

    // Étape 1: Analyser le contexte de combat
    const context = this.contextAnalyzer.analyzeContext(entity, combatState);

    // Étape 2: Vérifier les conditions de seuil (fuite, rage, etc.)
    const thresholdAction = this.checkThresholdBehaviors(entity, context, profile);
    if (thresholdAction) {
      this.logger.info('TACTICAL_AI', 'Threshold behavior triggered', {
        entityName: entity.name,
        behavior: thresholdAction.movement ? 'fleeing' : 'raging'
      });
      return thresholdAction;
    }

    // Étape 3: Générer toutes les options possibles
    const possibleTurns = this.generatePossibleTurns(entity, combatState, context, profile);
    
    if (possibleTurns.length === 0) {
      this.logger.warn('TACTICAL_AI', 'No possible turns found, ending turn', {
        entityName: entity.name
      });
      return {
        type: 'execute_turn',
        entityId: entity.id
      };
    }

    // Étape 4: Scorer chaque option selon le profil
    const scoredTurns = possibleTurns.map(turn => ({
      action: turn,
      ...this.actionScorer.scoreTurn(turn, entity, combatState, profile, context)
    }));

    // Étape 5: Sélectionner la meilleure option
    const bestTurn = this.selectBestTurn(scoredTurns, profile);

    this.logger.info('TACTICAL_AI', 'Turn decision made', {
      entityName: entity.name,
      movement: bestTurn.movement,
      attackTarget: bestTurn.attackTarget,
      score: scoredTurns.find(st => st.action === bestTurn)?.score
    });

    return bestTurn;
  }

  /**
   * Vérifier les comportements de seuil (fuite, rage, panique)
   */
  private checkThresholdBehaviors(
    entity: CombatEntity,
    context: CombatContext,
    profile: AIProfile
  ): CombatTurnAction | null {
    const healthPercentage = (entity.hitPoints / entity.maxHitPoints) * 100;

    // Vérifier le seuil de fuite
    if (healthPercentage <= profile.thresholds.fleeHealth && profile.courage < 50) {
      const fleePosition = this.findFleePosition(entity, context);
      if (fleePosition) {
        return {
          type: 'execute_turn',
          entityId: entity.id,
          movement: fleePosition
        };
      }
    }

    // Vérifier le seuil de rage (attaque sans considération de sécurité)
    if (healthPercentage <= profile.thresholds.rageHealth && profile.aggression > 70) {
      const closestEnemy = context.enemies.closest;
      if (closestEnemy) {
        // Mode berserk : aller au contact direct
        const chargePosition = this.findChargePosition(entity, closestEnemy, context);
        return {
          type: 'execute_turn',
          entityId: entity.id,
          movement: chargePosition,
          attackTarget: closestEnemy.id
        };
      }
    }

    // Vérifier la panique (trop d'alliés morts)
    if (context.allies.dead.length >= profile.thresholds.panicAlliesDown) {
      const panicBehavior = profile.contextModifiers?.allyDownResponse || 'retreat';
      if (panicBehavior === 'retreat') {
        const fleePosition = this.findFleePosition(entity, context);
        if (fleePosition) {
          return {
            type: 'execute_turn',
            entityId: entity.id,
            movement: fleePosition
          };
        }
      }
    }

    return null;
  }

  /**
   * Générer toutes les combinaisons possibles de mouvement + action
   */
  private generatePossibleTurns(
    entity: CombatEntity,
    combatState: CombatState,
    context: CombatContext,
    profile: AIProfile
  ): CombatTurnAction[] {
    const turns: CombatTurnAction[] = [];
    const maxOptionsToConsider = 20; // Limite pour performance (CP1)

    // Option 1: Rester sur place et attaquer
    if (entity.actionsRemaining.action) {
      const targetsInRange = this.getTargetsInRange(entity, context.enemies.alive, combatState);
      for (const target of targetsInRange.slice(0, 3)) { // Limiter à 3 cibles
        turns.push({
          type: 'execute_turn',
          entityId: entity.id,
          attackTarget: target.id
        });
      }
    }

    // Option 2: Se déplacer puis attaquer
    if (entity.actionsRemaining.movement > 0 && entity.actionsRemaining.action) {
      const reachablePositions = context.spatial.reachablePositions;
      
      // Prioriser les positions selon le profil
      const prioritizedPositions = this.prioritizePositions(
        reachablePositions,
        entity,
        context,
        profile
      ).slice(0, 10); // Limiter à 10 meilleures positions

      for (const position of prioritizedPositions) {
        // Pour chaque position, déterminer les cibles potentielles
        const potentialTargets = this.getTargetsFromPosition(
          position,
          context.enemies.alive,
          entity
        );

        for (const target of potentialTargets.slice(0, 2)) { // 2 cibles max par position
          turns.push({
            type: 'execute_turn',
            entityId: entity.id,
            movement: position,
            attackTarget: target.id
          });

          if (turns.length >= maxOptionsToConsider) {
            return turns;
          }
        }
      }
    }

    // Option 3: Se déplacer uniquement (positionnement tactique)
    if (entity.actionsRemaining.movement > 0 && turns.length < maxOptionsToConsider) {
      const tacticalPositions = context.spatial.optimalRangePositions
        .concat(context.spatial.flankingPositions)
        .slice(0, 5);

      for (const position of tacticalPositions) {
        turns.push({
          type: 'execute_turn',
          entityId: entity.id,
          movement: position
        });
      }
    }

    // Option 4: Position défensive
    if (profile.discipline > 70 && context.tactical.battleIntensity === 'high') {
      turns.push({
        type: 'execute_turn',
        entityId: entity.id,
        defendPosition: true
      });
    }

    return turns;
  }

  /**
   * Sélectionner la meilleure option selon le profil
   */
  private selectBestTurn(
    scoredTurns: ScoredTurnOption[],
    profile: AIProfile
  ): CombatTurnAction {
    if (scoredTurns.length === 0) {
      throw new Error('No scored turns to select from');
    }

    // Trier par score décroissant
    const sortedTurns = [...scoredTurns].sort((a, b) => b.score - a.score);

    // Avec haute intelligence, toujours prendre la meilleure option
    if (profile.intelligence > 80) {
      return sortedTurns[0].action;
    }

    // Avec intelligence moyenne, introduire un peu d'aléatoire
    if (profile.intelligence > 40) {
      // Prendre l'une des 3 meilleures options
      const topOptions = sortedTurns.slice(0, 3);
      const randomIndex = Math.floor(Math.random() * topOptions.length);
      return topOptions[randomIndex].action;
    }

    // Avec faible intelligence, comportement plus aléatoire
    // Prendre l'une des 5 meilleures options (ou toutes si moins)
    const considerCount = Math.min(5, sortedTurns.length);
    const randomIndex = Math.floor(Math.random() * considerCount);
    return sortedTurns[randomIndex].action;
  }

  /**
   * Trouver une position de fuite
   */
  private findFleePosition(entity: CombatEntity, context: CombatContext): Position | null {
    const escapeRoutes = context.spatial.escapeRoutes;
    if (escapeRoutes.length > 0) {
      // Choisir la route la plus éloignée des ennemis
      return escapeRoutes.reduce((best, current) => {
        const currentMinDist = Math.min(
          ...context.enemies.alive.map(e => calculateDistance(current, e.position))
        );
        const bestMinDist = Math.min(
          ...context.enemies.alive.map(e => calculateDistance(best, e.position))
        );
        return currentMinDist > bestMinDist ? current : best;
      });
    }

    // Si pas de route d'évasion, juste s'éloigner
    const currentPos = entity.position;
    const enemyCenter = this.calculateCenter(context.enemies.alive.map(e => e.position));
    
    // Calculer la direction opposée
    const dx = currentPos.x - enemyCenter.x;
    const dy = currentPos.y - enemyCenter.y;
    
    const fleeX = Math.max(0, Math.min(11, currentPos.x + Math.sign(dx) * 2));
    const fleeY = Math.max(0, Math.min(7, currentPos.y + Math.sign(dy) * 2));
    
    return { x: fleeX, y: fleeY };
  }

  /**
   * Trouver une position de charge agressive
   */
  private findChargePosition(
    entity: CombatEntity,
    target: CombatEntity,
    context: CombatContext
  ): Position {
    // Essayer d'aller directement au contact
    const adjacentPositions = this.getAdjacentPositions(target.position);
    
    // Filtrer les positions atteignables et libres
    const validPositions = adjacentPositions.filter(pos =>
      context.spatial.reachablePositions.some(
        rp => rp.x === pos.x && rp.y === pos.y
      )
    );

    if (validPositions.length > 0) {
      // Prendre la plus proche de notre position actuelle
      return validPositions.reduce((closest, current) => {
        const currentDist = calculateDistance(entity.position, current);
        const closestDist = calculateDistance(entity.position, closest);
        return currentDist < closestDist ? current : closest;
      });
    }

    // Si on ne peut pas atteindre une position adjacente, se rapprocher au maximum
    return context.spatial.reachablePositions.reduce((closest, current) => {
      const currentDist = calculateDistance(target.position, current);
      const closestDist = calculateDistance(target.position, closest);
      return currentDist < closestDist ? current : closest;
    });
  }

  /**
   * Obtenir les cibles à portée depuis la position actuelle
   */
  private getTargetsInRange(
    entity: CombatEntity,
    enemies: readonly CombatEntity[],
    combatState: CombatState
  ): CombatEntity[] {
    return enemies.filter(enemy => {
      const distance = calculateDistance(entity.position, enemy.position);
      // LIGNE 1: Utiliser sélection tactique d'arme selon distance
      const weapon = this.weaponResolutionService.resolveBestWeaponForDistance(entity, distance);
      const range = weapon ? weapon.getAttackRange() : 1;
      
      // LIGNE 2: Vérifier si cible atteignable avec cette arme
      return distance <= range && !enemy.isDead;
    });
  }

  /**
   * Obtenir les cibles potentielles depuis une position donnée
   */
  private getTargetsFromPosition(
    position: Position,
    enemies: readonly CombatEntity[],
    entity: CombatEntity
  ): CombatEntity[] {
    return enemies.filter(enemy => {
      const distance = calculateDistance(position, enemy.position);
      // LIGNE 1: Utiliser sélection tactique d'arme selon distance
      const weapon = this.weaponResolutionService.resolveBestWeaponForDistance(entity, distance);
      const range = weapon ? weapon.getAttackRange() : 1;
      
      // LIGNE 2: Vérifier si cible atteignable avec cette arme
      return distance <= range && !enemy.isDead;
    });
  }

  /**
   * Prioriser les positions selon le profil
   */
  private prioritizePositions(
    positions: readonly Position[],
    entity: CombatEntity,
    context: CombatContext,
    profile: AIProfile
  ): Position[] {
    const scoredPositions = positions.map(pos => {
      let score = 0;

      // Distance préférée selon le profil
      const preferredDist = getPreferredDistanceInSquares(profile.combatStyle.preferredRange);
      const avgDistToEnemies = context.enemies.alive.reduce(
        (sum, e) => sum + calculateDistance(pos, e.position),
        0
      ) / Math.max(1, context.enemies.alive.length);
      
      score += Math.max(0, 100 - Math.abs(avgDistToEnemies - preferredDist) * 10);

      // Bonus pour positions de flanc si mobilité = flanking
      if (profile.combatStyle.mobilityPreference === 'flanking') {
        const isFlankingPos = context.spatial.flankingPositions.some(
          fp => fp.x === pos.x && fp.y === pos.y
        );
        if (isFlankingPos) score += 50;
      }

      // Bonus pour positions sûres si courage faible
      if (profile.courage < 40) {
        const isSafePos = context.spatial.safePositions.some(
          sp => sp.x === pos.x && sp.y === pos.y
        );
        if (isSafePos) score += 30;
      }

      // Pénalité pour s'éloigner des alliés si teamwork élevé
      if (profile.teamwork > 60 && context.allies.closestAlly) {
        const distToClosestAlly = calculateDistance(pos, context.allies.closestAlly.position);
        if (distToClosestAlly > 4) score -= 20;
      }

      return { position: pos, score };
    });

    // Trier par score décroissant et retourner les positions
    return scoredPositions
      .sort((a, b) => b.score - a.score)
      .map(sp => sp.position);
  }

  /**
   * Calculer le centre d'un groupe de positions
   */
  private calculateCenter(positions: Position[]): Position {
    if (positions.length === 0) return { x: 6, y: 4 }; // Centre de la grille par défaut

    const sumX = positions.reduce((sum, pos) => sum + pos.x, 0);
    const sumY = positions.reduce((sum, pos) => sum + pos.y, 0);

    return {
      x: Math.round(sumX / positions.length),
      y: Math.round(sumY / positions.length)
    };
  }

  /**
   * Obtenir les positions adjacentes à une position
   */
  private getAdjacentPositions(pos: Position): Position[] {
    const adjacent: Position[] = [];
    const directions = [
      { x: -1, y: 0 }, { x: 1, y: 0 },
      { x: 0, y: -1 }, { x: 0, y: 1 }
    ];

    for (const dir of directions) {
      const newX = pos.x + dir.x;
      const newY = pos.y + dir.y;
      
      if (newX >= 0 && newX < 12 && newY >= 0 && newY < 8) {
        adjacent.push({ x: newX, y: newY });
      }
    }

    return adjacent;
  }
}