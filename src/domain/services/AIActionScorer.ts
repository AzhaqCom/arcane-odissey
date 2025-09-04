/**
 * DOMAIN SERVICE - AIActionScorer
 * Scoring des actions pour l'IA tactique
 * Respecte ARCHITECTURE_GUIDELINES.md - Règle #4 Pureté et Immutabilité
 */

import type { CombatEntity, CombatState } from '../entities/CombatEngine';
import type { CombatTurnAction, CombatContext, ScoredTurnOption } from '../types/CombatContext';
import type { AIProfile, CombatRange } from '../types/AIProfile';
import type { WeaponResolutionService } from './WeaponResolutionService';
import type { ILogger } from './ILogger';
import { calculateDistance, isAdjacent } from '../types/CombatContext';
import { distanceToCombatRange, getPreferredDistanceInSquares } from '../types/AIProfile';

/**
 * SERVICE DE SCORING D'ACTIONS
 * ✅ Toutes les méthodes sont pures
 * ✅ Évalue chaque action selon les traits de personnalité
 * ✅ Scoring multidimensionnel pour comportements émergents
 */
export class AIActionScorer {
  private readonly weaponResolutionService: WeaponResolutionService;
  private readonly logger: ILogger;

  constructor(weaponResolutionService: WeaponResolutionService, logger: ILogger) {
    this.weaponResolutionService = weaponResolutionService;
    this.logger = logger;
  }

  /**
   * Scorer une action de tour selon le profil et le contexte
   */
  scoreTurn(
    action: CombatTurnAction,
    entity: CombatEntity,
    combatState: CombatState,
    profile: AIProfile,
    context: CombatContext
  ): Omit<ScoredTurnOption, 'action'> {
    // Initialiser les scores
    let positionScore = 0;
    let targetScore = 0;
    let survivalScore = 0;
    let teamworkScore = 0;
    let styleScore = 0;

    const risks: string[] = [];
    const benefits: string[] = [];

    // === SCORING POSITION ===
    if (action.movement) {
      const positionResult = this.scorePosition(
        action.movement,
        entity,
        context,
        profile
      );
      positionScore = positionResult.score;
      risks.push(...positionResult.risks);
      benefits.push(...positionResult.benefits);
    } else {
      // Rester sur place a un score neutre, modulé par le profil
      positionScore = profile.combatStyle.mobilityPreference === 'static' ? 60 : 30;
    }

    // === SCORING CIBLE ===
    if (action.attackTarget) {
      const target = combatState.entities.find(e => e.id === action.attackTarget);
      if (target) {
        const targetResult = this.scoreTarget(
          target,
          entity,
          action.movement || entity.position,
          context,
          profile
        );
        targetScore = targetResult.score;
        risks.push(...targetResult.risks);
        benefits.push(...targetResult.benefits);
      }
    } else {
      // Pas d'attaque = score faible sauf si très blessé ou en fuite
      targetScore = context.self.isCritical ? 40 : 10;
    }

    // === SCORING SURVIE ===
    survivalScore = this.scoreSurvival(
      action,
      entity,
      context,
      profile
    );

    // === SCORING TRAVAIL D'ÉQUIPE ===
    teamworkScore = this.scoreTeamwork(
      action,
      entity,
      context,
      profile
    );

    // === SCORING STYLE ===
    styleScore = this.scoreStyle(
      action,
      entity,
      context,
      profile
    );

    // === CALCUL DU SCORE TOTAL ===
    const totalScore = this.calculateTotalScore(
      positionScore,
      targetScore,
      survivalScore,
      teamworkScore,
      styleScore,
      profile
    );

    this.logger.debug('AI_SCORER', 'Action scored', {
      entityName: entity.name,
      movement: action.movement,
      attackTarget: action.attackTarget,
      totalScore,
      breakdown: {
        positionScore,
        targetScore,
        survivalScore,
        teamworkScore,
        styleScore
      }
    });

    return {
      score: totalScore,
      breakdown: {
        positionScore,
        targetScore,
        survivalScore,
        teamworkScore,
        styleScore
      },
      risks,
      benefits
    };
  }

  /**
   * Scorer une position de mouvement
   */
  private scorePosition(
    position: { x: number; y: number },
    entity: CombatEntity,
    context: CombatContext,
    profile: AIProfile
  ): { score: number; risks: string[]; benefits: string[] } {
    let score = 50; // Score de base
    const risks: string[] = [];
    const benefits: string[] = [];

    // Distance préférée selon le profil
    const preferredDist = getPreferredDistanceInSquares(profile.combatStyle.preferredRange);
    const avgDistToEnemies = context.enemies.alive.length > 0
      ? context.enemies.alive.reduce((sum, e) => sum + calculateDistance(position, e.position), 0) / context.enemies.alive.length
      : 0;

    // Bonus/malus selon distance préférée
    const distanceDeviation = Math.abs(avgDistToEnemies - preferredDist);
    if (distanceDeviation <= 1) {
      score += 30;
      benefits.push('Distance optimale');
    } else if (distanceDeviation <= 2) {
      score += 15;
    } else {
      score -= distanceDeviation * 5;
      if (avgDistToEnemies < preferredDist) {
        risks.push('Trop proche');
      } else {
        risks.push('Trop éloigné');
      }
    }

    // Bonus pour positions tactiques spéciales
    if (context.spatial.flankingPositions.some(fp => fp.x === position.x && fp.y === position.y)) {
      const flankBonus = profile.intelligence * 0.3; // 0-30 points
      score += flankBonus;
      benefits.push('Position de flanc');
    }

    if (context.spatial.safePositions.some(sp => sp.x === position.x && sp.y === position.y)) {
      const safeBonus = (100 - profile.courage) * 0.2; // 0-20 points selon courage
      score += safeBonus;
      if (safeBonus > 10) benefits.push('Position sûre');
    }

    if (context.spatial.chokePoints.some(cp => cp.x === position.x && cp.y === position.y)) {
      const disciplineBonus = profile.discipline * 0.15; // 0-15 points
      score += disciplineBonus;
      if (disciplineBonus > 8) benefits.push('Point d\'étranglement');
    }

    // Pénalité pour s'éloigner des alliés si teamwork élevé
    if (profile.teamwork > 60 && context.allies.closestAlly) {
      const distToClosestAlly = calculateDistance(position, context.allies.closestAlly.position);
      if (distToClosestAlly > 4) {
        const teamworkPenalty = profile.teamwork * 0.2;
        score -= teamworkPenalty;
        risks.push('S\'éloigne des alliés');
      }
    }

    // Bonus pour mobilité selon préférence
    const movementDistance = calculateDistance(entity.position, position);
    if (profile.combatStyle.mobilityPreference === 'mobile' && movementDistance > 2) {
      score += 10;
      benefits.push('Mouvement tactique');
    } else if (profile.combatStyle.mobilityPreference === 'static' && movementDistance > 1) {
      score -= 10;
      risks.push('Mouvement inutile');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      risks,
      benefits
    };
  }

  /**
   * Scorer une cible d'attaque
   */
  private scoreTarget(
    target: CombatEntity,
    entity: CombatEntity,
    attackPosition: { x: number; y: number },
    context: CombatContext,
    profile: AIProfile
  ): { score: number; risks: string[]; benefits: string[] } {
    let score = 50;
    const risks: string[] = [];
    const benefits: string[] = [];

    // Distance à la cible
    const distanceToTarget = calculateDistance(attackPosition, target.position);
    const weapon = this.weaponResolutionService.resolveBestWeaponForDistance(entity, distanceToTarget);
    const maxRange = weapon ? weapon.getAttackRange() : 1;

    // Vérifier si la cible est atteignable
    if (distanceToTarget > maxRange) {
      score = 0;
      risks.push('Hors de portée');
      return { score, risks, benefits };
    }

    // Bonus pour cible selon priorité du profil
    switch (profile.combatStyle.targetPriority) {
      case 'weakest':
        if (target === context.enemies.weakest) {
          score += 30;
          benefits.push('Cible la plus faible');
        }
        break;
      case 'strongest':
        if (target === context.enemies.strongest) {
          score += 25;
          benefits.push('Cible la plus forte');
        }
        break;
      case 'closest':
        if (target === context.enemies.closest) {
          score += 20;
          benefits.push('Cible la plus proche');
        }
        break;
      case 'dangerous':
        if (target === context.enemies.mostDangerous) {
          score += 35;
          benefits.push('Cible la plus dangereuse');
        }
        break;
      case 'isolated':
        if (context.enemies.isolated.includes(target)) {
          score += 25;
          benefits.push('Cible isolée');
        }
        break;
    }

    // Modifier selon % HP de la cible
    const targetHealthPercent = (target.hitPoints / target.maxHitPoints) * 100;
    if (targetHealthPercent < 25) {
      score += 15; // Finir les cibles critiques
      benefits.push('Peut achever la cible');
    } else if (targetHealthPercent > 80) {
      score -= 5; // Moins avantageux d'attaquer cibles en pleine forme
    }

    // Bonus d'aggression
    const aggressionBonus = profile.aggression * 0.2;
    score += aggressionBonus;

    // Malus si on risque une attaque d'opportunité
    if (weapon && weapon.category === 'ranged' && distanceToTarget === 1) {
      score -= 15;
      risks.push('Attaque à distance au contact');
    }

    // Bonus si cible a déjà pris des dégâts récemment
    if (context.history.lastTurnDamageDealt > 0 && context.history.consecutiveHits > 0) {
      score += 10;
      benefits.push('Momentum d\'attaque');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      risks,
      benefits
    };
  }

  /**
   * Scorer la survie de l'action
   */
  private scoreSurvival(
    action: CombatTurnAction,
    entity: CombatEntity,
    context: CombatContext,
    profile: AIProfile
  ): number {
    let score = 50;

    const finalPosition = action.movement || entity.position;

    // Pénalité selon le nombre d'ennemis qui peuvent nous attaquer
    const threateningEnemies = context.enemies.alive.filter(enemy => {
      const dist = calculateDistance(finalPosition, enemy.position);
      return dist <= 8; // Portée max approximative
    });

    const threatLevel = threateningEnemies.length * 10;
    score -= threatLevel;

    // Modifier selon courage - les lâches évitent plus les risques
    const courageModifier = (profile.courage - 50) * 0.3;
    score += courageModifier;

    // Bonus si on s'éloigne du danger quand blessé
    if (context.self.isInjured && action.movement) {
      const currentThreats = context.enemies.alive.filter(e =>
        calculateDistance(entity.position, e.position) <= 2
      ).length;
      const newThreats = context.enemies.alive.filter(e =>
        calculateDistance(finalPosition, e.position) <= 2
      ).length;

      if (newThreats < currentThreats) {
        score += 20; // Bonus pour se mettre en sécurité
      }
    }

    // Bonus pour position défensive si discipline élevée
    if (action.defendPosition && profile.discipline > 60) {
      score += profile.discipline * 0.3;
    }

    // Pénalité critique si HP très faibles et action risquée
    if (context.self.isCritical && threateningEnemies.length > 1) {
      score -= 30;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Scorer le travail d'équipe
   */
  private scoreTeamwork(
    action: CombatTurnAction,
    entity: CombatEntity,
    context: CombatContext,
    profile: AIProfile
  ): number {
    if (profile.teamwork < 30) return 50; // Les solitaires ignorent cet aspect

    let score = 50;
    const finalPosition = action.movement || entity.position;

    // Bonus pour rester près des alliés
    if (context.allies.closestAlly) {
      const distToClosestAlly = calculateDistance(finalPosition, context.allies.closestAlly.position);
      if (distToClosestAlly <= 3) {
        score += profile.teamwork * 0.3;
      } else if (distToClosestAlly > 6) {
        score -= profile.teamwork * 0.2;
      }
    }

    // Bonus pour protéger les alliés blessés
    const injuredAllies = context.allies.injured;
    if (injuredAllies.length > 0 && action.movement) {
      const protectingAlly = injuredAllies.some(ally => {
        const distToAlly = calculateDistance(finalPosition, ally.position);
        return distToAlly <= 2; // Position de protection
      });
      
      if (protectingAlly) {
        score += profile.teamwork * 0.25;
      }
    }

    // Bonus pour attaquer la même cible qu'un allié (focus fire)
    if (action.attackTarget) {
      const alliesAttackingSameTarget = context.allies.alive.filter(ally => {
        // Approximation : alliés proches de la cible sont probablement en train de l'attaquer
        const target = context.enemies.alive.find(e => e.id === action.attackTarget);
        if (!target) return false;
        return calculateDistance(ally.position, target.position) <= 2;
      }).length;

      if (alliesAttackingSameTarget > 0) {
        score += alliesAttackingSameTarget * 10;
      }
    }

    // Pénalité pour bloquer un allié
    if (action.movement && context.allies.alive.length > 0) {
      const blockingAlly = context.allies.alive.some(ally => {
        // Vérifier si on bloque le chemin d'un allié vers un ennemi
        const closestEnemyToAlly = context.enemies.closest;
        if (!closestEnemyToAlly) return false;
        
        // Simplification : on bloque si on se place entre l'allié et son ennemi le plus proche
        const allyToEnemy = calculateDistance(ally.position, closestEnemyToAlly.position);
        const allyToUs = calculateDistance(ally.position, finalPosition);
        const usToEnemy = calculateDistance(finalPosition, closestEnemyToAlly.position);
        
        return allyToUs + usToEnemy <= allyToEnemy + 1; // +1 de tolérance
      });

      if (blockingAlly) {
        score -= 15;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Scorer la conformité au style de combat
   */
  private scoreStyle(
    action: CombatTurnAction,
    entity: CombatEntity,
    context: CombatContext,
    profile: AIProfile
  ): number {
    let score = 50;

    // Style de mobilité
    const movementDistance = action.movement 
      ? calculateDistance(entity.position, action.movement)
      : 0;

    switch (profile.combatStyle.mobilityPreference) {
      case 'static':
        score += movementDistance === 0 ? 20 : -movementDistance * 5;
        break;
      case 'mobile':
        score += movementDistance > 0 ? 15 : -10;
        break;
      case 'flanking':
        if (action.movement && context.spatial.flankingPositions.some(
          fp => fp.x === action.movement!.x && fp.y === action.movement!.y
        )) {
          score += 25;
        }
        break;
    }

    // Style de portée
    if (action.attackTarget) {
      const finalPosition = action.movement || entity.position;
      const target = context.enemies.alive.find(e => e.id === action.attackTarget);
      if (target) {
        const distanceToTarget = calculateDistance(finalPosition, target.position);
        const actualRange = distanceToCombatRange(distanceToTarget);
        
        if (actualRange === profile.combatStyle.preferredRange) {
          score += 20;
        } else {
          // Pénalité selon l'écart
          const ranges: CombatRange[] = ['contact', 'close', 'medium', 'far'];
          const preferredIndex = ranges.indexOf(profile.combatStyle.preferredRange);
          const actualIndex = ranges.indexOf(actualRange);
          const deviation = Math.abs(preferredIndex - actualIndex);
          score -= deviation * 8;
        }
      }
    }

    // Bonus discipline pour actions défensives
    if (action.defendPosition) {
      score += profile.discipline * 0.2;
    }

    // Bonus intelligence pour actions complexes (mouvement + attaque)
    if (action.movement && action.attackTarget) {
      score += profile.intelligence * 0.15;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculer le score total pondéré selon le profil
   */
  private calculateTotalScore(
    positionScore: number,
    targetScore: number,
    survivalScore: number,
    teamworkScore: number,
    styleScore: number,
    profile: AIProfile
  ): number {
    // Pondérations dynamiques basées sur les traits
    const positionWeight = 0.2 + (profile.intelligence / 500); // 0.2-0.4
    const targetWeight = 0.3 + (profile.aggression / 500); // 0.3-0.5
    const survivalWeight = 0.3 + ((100 - profile.courage) / 500); // 0.3-0.5
    const teamworkWeight = profile.teamwork / 500; // 0-0.2
    const styleWeight = 0.2 + (profile.discipline / 500); // 0.2-0.4

    // Normaliser les poids pour qu'ils totalisent 1.0
    const totalWeight = positionWeight + targetWeight + survivalWeight + teamworkWeight + styleWeight;

    const normalizedTotal = 
      (positionScore * positionWeight +
       targetScore * targetWeight +
       survivalScore * survivalWeight +
       teamworkScore * teamworkWeight +
       styleScore * styleWeight) / totalWeight;

    // Appliquer des modificateurs finaux
    let finalScore = normalizedTotal;

    // Bonus général d'intelligence (meilleures décisions)
    finalScore += profile.intelligence * 0.05;

    // Légère randomisation basée sur discipline (moins discipliné = plus aléatoire)
    const randomFactor = (100 - profile.discipline) * 0.001;
    const randomAdjustment = (Math.random() - 0.5) * randomFactor * 20;
    finalScore += randomAdjustment;

    return Math.max(0, Math.min(100, finalScore));
  }
}