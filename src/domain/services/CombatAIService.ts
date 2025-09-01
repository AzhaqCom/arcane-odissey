/**
 * DOMAIN SERVICE - CombatAIService
 * Service d'intelligence artificielle pour les décisions de combat
 * Responsabilité : Analyser, évaluer et décider des actions d'IA optimales
 */

import type { Combat, CombatEntity } from '../entities/Combat';
import type { Position } from '../types';
import type { GridPosition } from '../entities/TacticalGrid';
import type { Action } from '../entities/Action';
import type { Spell, SpellLevel } from '../entities/Spell';
import type { ValidationResult } from '../entities/ActionValidator';
import type { PriorityCriteria } from '../entities/ActionPrioritizer';
import type { CombatQueryService } from './CombatQueryService';
import type { CombatActionService } from './CombatActionService';
import type { AIDecisionMaker } from '../entities/AIDecisionMaker';
import type { ThreatAssessment } from '../entities/ThreatAssessment';
import type { ActionPrioritizer } from '../entities/ActionPrioritizer';

export interface AIContext {
  readonly entity: CombatEntity;
  readonly allEntities: readonly CombatEntity[];
  readonly allies: readonly CombatEntity[];
  readonly enemies: readonly CombatEntity[];
  readonly currentHP: number;
  readonly maxHP: number;
  readonly hpPercentage: number;
  readonly distanceToNearestEnemy: number;
  readonly distanceToNearestAlly: number;
  readonly isInDanger: boolean;
  readonly canReachEnemy: boolean;
  readonly hasRangedOptions: boolean;
  readonly hasSpells: boolean;
  readonly isLastAlly: boolean;
}

export interface ThreatAssessment {
  readonly level: 'low' | 'medium' | 'high' | 'critical';
  readonly factors: readonly string[];
  readonly recommendations: readonly string[];
}

export interface AIExecutionResult {
  readonly success: boolean;
  readonly damage?: number;
  readonly healing?: number;
  readonly actionTaken?: string;
  readonly targetId?: string;
  readonly reasons?: readonly string[];
}

export interface CombatAIServiceDependencies {
  readonly queryService: CombatQueryService;
  readonly actionService: CombatActionService;
  readonly aiDecisionMaker: AIDecisionMaker;
  readonly threatAssessment: ThreatAssessment;
  readonly actionPrioritizer: typeof ActionPrioritizer;
}

/**
 * SERVICE D'INTELLIGENCE ARTIFICIELLE COMBAT
 * Centralise toute la logique de prise de décision IA
 */
export class CombatAIService {
  
  constructor(private readonly dependencies: CombatAIServiceDependencies) {}

  /**
   * Exécuter un tour d'IA pour l'entité courante
   */
  executeAITurn(combat: Combat): AIExecutionResult | null {
    const queryService = this.dependencies.queryService;
    const actionService = this.dependencies.actionService;
    
    const currentEntity = queryService.getCurrentEntity(combat);
    if (!currentEntity || currentEntity.type === 'player') {
      return null;
    }

    // Construire le contexte IA
    const context = this.buildAIContext(combat, currentEntity);

    // L'IA décide de l'action optimale via AIDecisionMaker
    const aiDecisionMaker = this.dependencies.aiDecisionMaker;
    const decision = aiDecisionMaker.decideAction(currentEntity.id);
    
    if (!decision) {
      return {
        success: false,
        reasons: ['No AI decision available']
      };
    }

    // Exécuter l'action décidée
    if (decision.action) {
      const result = actionService.executeAction(
        combat,
        currentEntity.id,
        decision.action,
        decision.targetEntityId
      );
      
      return {
        success: result.result.success,
        damage: result.result.damage,
        healing: result.result.healing,
        actionTaken: `Action: ${decision.action.name}`,
        targetId: decision.targetEntityId,
        reasons: result.result.success ? undefined : [result.result.message || 'Action failed']
      };
    }

    if (decision.spell && decision.spellLevel !== undefined) {
      const result = actionService.castSpell(
        combat,
        currentEntity.id,
        decision.spell,
        decision.spellLevel,
        decision.targetEntityId
      );

      return {
        success: result.result.success,
        damage: result.result.damage,
        healing: result.result.healing,
        actionTaken: `Spell: ${decision.spell.name} (Level ${decision.spellLevel})`,
        targetId: decision.targetEntityId,
        reasons: result.result.success ? undefined : [result.result.message || 'Spell failed']
      };
    }

    return {
      success: false,
      reasons: ['Invalid AI decision']
    };
  }

  /**
   * Obtenir l'analyse des menaces pour une entité
   */
  getThreatAnalysis(combat: Combat, entityId: string, targetId: string): ThreatAssessment {
    const threatAssessment = this.dependencies.threatAssessment;
    const rawAnalysis = threatAssessment.analyzeThreat(entityId, targetId);
    
    // Convertir l'analyse brute en format standardisé
    return this.formatThreatAnalysis(rawAnalysis);
  }

  /**
   * Évaluer les menaces dans une zone
   */
  assessAreaThreats(combat: Combat, centerPos: Position, radius: number, perspectiveEntityId: string): ThreatAssessment[] {
    const entity = combat.entities.get(perspectiveEntityId);
    if (!entity) return [];

    const threatAssessment = this.dependencies.threatAssessment;
    const rawThreats = threatAssessment.assessAreaThreats(
      { x: centerPos.x, y: centerPos.y },
      radius,
      entity
    );

    return rawThreats.map(threat => this.formatThreatAnalysis(threat));
  }

  /**
   * Obtenir les actions prioritaires pour une entité IA
   */
  getPrioritizedActions(combat: Combat, entityId: string, criteria: PriorityCriteria[] = ['maximize_damage', 'minimize_risk']): Action[] {
    const entity = combat.entities.get(entityId);
    if (!entity) return [];

    const context = this.buildAIContext(combat, entity);
    const actionPrioritizer = this.dependencies.actionPrioritizer;
    
    return actionPrioritizer.prioritizeActions(entity, context, criteria);
  }

  /**
   * Évaluer les défenses d'une entité
   */
  assessDefenses(combat: Combat, entityId: string): any {
    const threatAssessment = this.dependencies.threatAssessment;
    return threatAssessment.assessDefenses(entityId);
  }

  /**
   * Identifier les cibles prioritaires pour une entité
   */
  identifyPriorityTargets(combat: Combat, attackerId: string): string[] {
    const threatAssessment = this.dependencies.threatAssessment;
    return threatAssessment.identifyPriorityTargets(attackerId);
  }

  /**
   * Construire le contexte d'intelligence artificielle pour une entité
   */
  buildAIContext(combat: Combat, entity: CombatEntity): AIContext {
    const queryService = this.dependencies.queryService;
    
    const allEntities = Array.from(combat.entities.values()).filter(e => !e.isDead);
    const allies = allEntities.filter(e => queryService.isAllyOf(entity, e));
    const enemies = allEntities.filter(e => queryService.isEnemyOf(entity, e));

    const entityPos = { x: entity.position.x, y: entity.position.y };
    
    const distanceToNearestEnemy = enemies.length > 0 ? 
      Math.min(...enemies.map(e => combat.tacticalGrid.calculateDistance(entityPos, { x: e.position.x, y: e.position.y }))) : 
      Infinity;

    const distanceToNearestAlly = allies.length > 0 ?
      Math.min(...allies.map(e => combat.tacticalGrid.calculateDistance(entityPos, { x: e.position.x, y: e.position.y }))) :
      Infinity;

    const hpPercentage = entity.currentHP / entity.maxHP;

    return Object.freeze({
      entity,
      allEntities: Object.freeze(allEntities),
      allies: Object.freeze(allies),
      enemies: Object.freeze(enemies),
      currentHP: entity.currentHP,
      maxHP: entity.maxHP,
      hpPercentage,
      distanceToNearestEnemy,
      distanceToNearestAlly,
      isInDanger: this.isEntityInDanger(combat, entity, enemies),
      canReachEnemy: distanceToNearestEnemy <= entity.baseSpeed + 1,
      hasRangedOptions: this.hasRangedOptions(entity),
      hasSpells: entity.knownSpells.length > 0,
      isLastAlly: allies.length <= 1
    });
  }

  /**
   * Déterminer si une entité est en danger
   */
  isEntityInDanger(combat: Combat, entity: CombatEntity, enemies: readonly CombatEntity[]): boolean {
    const entityPos = { x: entity.position.x, y: entity.position.y };
    
    return enemies.some(enemy => {
      const distance = combat.tacticalGrid.calculateDistance(
        entityPos, 
        { x: enemy.position.x, y: enemy.position.y }
      );
      return distance <= 2;
    });
  }

  /**
   * Vérifier si une entité dispose d'options à distance
   */
  hasRangedOptions(entity: CombatEntity): boolean {
    return entity.availableActions.some(action => 
      action.requirements.range && action.requirements.range > 1
    ) || entity.knownSpells.some(spell => 
      spell.getRangeInCells() > 1
    );
  }

  // === MÉTHODES PRIVÉES UTILITAIRES ===

  /**
   * Formater une analyse de menace brute en format standardisé
   */
  private formatThreatAnalysis(rawAnalysis: any): ThreatAssessment {
    // Cette méthode doit être adaptée selon le format réel de ThreatAssessment
    // Pour l'instant, format générique
    return {
      level: rawAnalysis?.level || 'medium',
      factors: Object.freeze(rawAnalysis?.factors || []),
      recommendations: Object.freeze(rawAnalysis?.recommendations || [])
    };
  }

}