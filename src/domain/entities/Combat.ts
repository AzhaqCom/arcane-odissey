/**
 * DOMAIN ENTITY - Combat
 * Pure business logic, no dependencies
 */

import { TacticalGrid, type GridPosition, type GridDimensions } from './TacticalGrid';
import { Action, type ActionCost } from './Action';
import { Spell, type SpellLevel, SpellSlots } from './Spell';
import { ActionValidator, type ValidationResult, type EntityResources, type EntityAbilities } from './ActionValidator';
import { AIDecisionMaker } from './AIDecisionMaker';
import { ThreatAssessment } from './ThreatAssessment';
import { ActionPrioritizer, type PriorityCriteria } from './ActionPrioritizer';
import { CombatQueryService } from '../services/CombatQueryService';
import { CombatStateService } from '../services/CombatStateService';
import { CombatActionService } from '../services/CombatActionService';
import { CombatAIService } from '../services/CombatAIService';
import type { Position, InventorySpec, AbilityScores, ActionsRemaining } from '../types';

// Utiliser Position des types du domaine
export type { Position } from '../types';

export interface CombatEntity {
  readonly id: string;
  readonly name: string;
  readonly type: 'player' | 'ally' | 'enemy';
  
  // Combat Stats (immutable)
  readonly maxHP: number;
  readonly baseAC: number;
  readonly baseSpeed: number;
  readonly level: number;
  readonly proficiencyBonus: number;
  
  // Abilities (immutable)
  readonly abilities: EntityAbilities;
  readonly spellcastingAbility?: 'intelligence' | 'wisdom' | 'charisma';
  
  // Mutable State
  currentHP: number;
  position: Position;
  initiative: number;
  
  // Actions disponibles ce tour
  actionsRemaining: ActionsRemaining;
  
  // Resources
  spellSlots: SpellSlots;
  availableActions: Action[];
  knownSpells: Spell[];
  inventory?: InventorySpec;
  
  // Statut
  isActive: boolean;
  isDead: boolean;
  conditions: string[];
  concentratingOn?: string; // ID du sort de concentration actuel
}

import type { DomainCombatPhase } from '../types';
export type CombatPhase = DomainCombatPhase;
export type TurnPhase = 'start' | 'action' | 'end';

/**
 * COMBAT - Aggregate Root
 * Gère l'état du combat et les règles métier
 */
export class Combat {
  private readonly _id: string;
  private readonly _tacticalGrid: TacticalGrid;
  private readonly _entities = new Map<string, CombatEntity>();
  private _initiativeOrder: string[] = [];
  private _currentEntityIndex: number = 0;
  private _round: number = 1;
  private _phase: CombatPhase = 'setup';
  private _turnPhase: TurnPhase = 'start';
  private readonly _aiDecisionMaker: AIDecisionMaker;
  private readonly _threatAssessment: ThreatAssessment;
  
  // Services spécialisés
  private readonly _queryService: CombatQueryService;
  private readonly _stateService: CombatStateService;
  private readonly _actionService: CombatActionService;
  private readonly _aiService: CombatAIService;

  constructor(id: string, gridDimensions: GridDimensions = { width: 12, height: 8 }) {
    this._id = id;
    this._tacticalGrid = new TacticalGrid(gridDimensions);
    this._aiDecisionMaker = new AIDecisionMaker(this);
    this._threatAssessment = new ThreatAssessment(this);
    
    // Instanciation des services spécialisés
    this._queryService = new CombatQueryService();
    this._stateService = new CombatStateService();
    this._actionService = new CombatActionService();
    this._aiService = new CombatAIService();
    
    // Injection des dépendances entre services
    (this._actionService as any).getStateService = () => this._stateService;
    
    // Injection des dépendances pour AIService
    (this._aiService as any).getQueryService = () => this._queryService;
    (this._aiService as any).getActionService = () => this._actionService;
    (this._aiService as any).getAIDecisionMaker = () => this._aiDecisionMaker;
    (this._aiService as any).getThreatAssessmentService = () => this._threatAssessment;
    (this._aiService as any).getActionPrioritizer = () => ActionPrioritizer;
  }

  // GETTERS (Pure)
  get id(): string { return this._id; }
  get tacticalGrid(): TacticalGrid { return this._tacticalGrid; }
  get entities(): ReadonlyMap<string, CombatEntity> { return this._entities; }
  get initiativeOrder(): readonly string[] { return this._initiativeOrder; }
  get currentEntityIndex(): number { return this._currentEntityIndex; }
  get round(): number { return this._round; }
  get phase(): CombatPhase { return this._phase; }
  get turnPhase(): TurnPhase { return this._turnPhase; }

  // BUSINESS RULES (Pure Logic)
  



  /**
   * Obtenir l'entité courante
   */
  getCurrentEntity(): CombatEntity | null {
    return this._queryService.getCurrentEntity(this);
  }







  /**
   * Vérifier si une entité peut attaquer une autre (portée + ligne de vue)
   */
  canAttackTarget(attackerId: string, targetId: string, range: number): boolean {
    return this._queryService.canAttackTarget(this, attackerId, targetId, range);
  }

  /**
   * Calculer la couverture pour une attaque
   */
  calculateAttackCover(attackerId: string, targetId: string): 'none' | 'half' | 'three_quarters' | 'full' {
    return this._queryService.calculateAttackCover(this, attackerId, targetId);
  }

  /**
   * Obtenir toutes les entités dans une zone d'effet
   */
  getEntitiesInArea(center: Position, shape: 'circle' | 'cone' | 'line' | 'square', size: number, direction?: Position): CombatEntity[] {
    return this._queryService.getEntitiesInArea(this, center, shape, size, direction);
  }

  /**
   * Vérifier les attaques d'opportunité lors d'un mouvement
   */
  checkOpportunityAttacks(movingEntityId: string, fromPos: Position, toPos: Position): string[] {
    const entities = this._actionService.checkOpportunityAttacks(this, movingEntityId, fromPos, toPos);
    return entities.map(entity => entity.id);
  }


  /**
   * Obtenir l'entité à une position donnée
   */
  getEntityAtPosition(position: Position): CombatEntity | null {
    return this._queryService.getEntityAtPosition(this, position);
  }

  // ACTIONS & SPELLS SYSTEM



  /**
   * Obtenir les actions disponibles pour une entité
   */
  getAvailableActions(entityId: string): Action[] {
    return this._queryService.getAvailableActions(this, entityId);
  }

  /**
   * Obtenir les sorts disponibles pour une entité
   */
  getAvailableSpells(entityId: string): Array<{ spell: Spell; availableLevels: SpellLevel[] }> {
    return this._queryService.getAvailableSpells(this, entityId);
  }





  private getSpellcastingModifier(entity: CombatEntity): number {
    return this._queryService.getSpellcastingModifier(entity);
  }

  private getAbilityModifier(entity: CombatEntity, ability: keyof EntityAbilities): number {
    return this._queryService.getAbilityModifier(entity, ability);
  }

  // AI SYSTEM INTEGRATION

  /**
   * Exécuter un tour d'IA pour l'entité courante
   */
  executeAITurn(): ValidationResult & { damage?: number; healing?: number } | null {
    const result = this._aiService.executeAITurn(this);
    if (!result) return null;
    
    // Adapter le format de retour du service vers l'interface legacy
    return {
      valid: result.success,
      reasons: result.reasons || [],
      damage: result.damage,
      healing: result.healing
    };
  }

  /**
   * Obtenir l'analyse des menaces pour une entité
   */
  getThreatAnalysis(entityId: string, targetId: string) {
    return this._aiService.getThreatAnalysis(this, entityId, targetId);
  }

  /**
   * Évaluer les menaces dans une zone
   */
  assessAreaThreats(centerPos: Position, radius: number, perspectiveEntityId: string) {
    return this._aiService.assessAreaThreats(this, centerPos, radius, perspectiveEntityId);
  }

  /**
   * Obtenir les actions prioritaires pour une entité IA
   */
  getPrioritizedActions(entityId: string, criteria: PriorityCriteria[] = ['maximize_damage', 'minimize_risk']) {
    return this._aiService.getPrioritizedActions(this, entityId, criteria);
  }

  /**
   * Évaluer les défenses d'une entité
   */
  assessDefenses(entityId: string) {
    return this._aiService.assessDefenses(this, entityId);
  }

  /**
   * Identifier les cibles prioritaires pour une entité
   */
  identifyPriorityTargets(attackerId: string) {
    return this._aiService.identifyPriorityTargets(this, attackerId);
  }

  private isAllyOf(entity1: CombatEntity, entity2: CombatEntity): boolean {
    return this._queryService.isAllyOf(entity1, entity2);
  }

  private isEnemyOf(entity1: CombatEntity, entity2: CombatEntity): boolean {
    return this._queryService.isEnemyOf(entity1, entity2);
  }


  // ========================================
  // IMMUTABLE API - Builder Pattern
  // ========================================

  /**
   * Clone le combat avec des modifications (clonage intelligent)
   * DÉLÉGUÉ vers CombatStateService pour centraliser la logique d'état
   */
  private clone(modifications: Partial<{
    entities: Map<string, CombatEntity>;
    initiativeOrder: string[];
    currentEntityIndex: number;
    round: number;
    phase: CombatPhase;
    turnPhase: TurnPhase;
    tacticalGrid: TacticalGrid;
  }> = {}): Combat {
    return this._stateService.clone(this, modifications);
  }

  /**
   * Retourne un nouveau Combat avec une entité ajoutée
   */
  withAddedEntity(entity: CombatEntity): Combat {
    if (this._phase !== 'setup') {
      throw new Error('Cannot add entity after combat has started');
    }
    return this._stateService.withAddedEntity(this, entity);
  }

  /**
   * Retourne un nouveau Combat avec l'ordre d'initiative calculé
   */
  withCalculatedInitiativeOrder(): Combat {
    return this._stateService.withCalculatedInitiativeOrder(this);
  }

  /**
   * Retourne un nouveau Combat démarré
   */
  withStartedCombat(): Combat {
    if (this._entities.size === 0) {
      throw new Error('Cannot start combat without entities');
    }
    return this._stateService.withStartedCombat(this);
  }

  /**
   * Retourne un nouveau Combat avec le tour avancé
   */
  withAdvancedTurn(): Combat {
    return this._stateService.withAdvancedTurn(this);
  }

  /**
   * Retourne un nouveau Combat avec des dégâts appliqués
   */
  withDamageApplied(entityId: string, damage: number): Combat {
    return this._actionService.withDamageApplied(this, entityId, damage);
  }

  /**
   * Retourne un nouveau Combat avec des soins appliqués
   */
  withHealing(entityId: string, healing: number): Combat {
    return this._actionService.withHealingApplied(this, entityId, healing);
  }

  /**
   * Retourne un nouveau Combat avec une entité déplacée
   */
  withEntityMoved(entityId: string, newPosition: Position, movementCost?: number): Combat {
    return this._actionService.withMovedEntity(this, entityId, newPosition, movementCost);
  }

  /**
   * Retourne un nouveau Combat avec vérification de fin de combat
   */
  withCheckedCombatEnd(): Combat {
    return this._stateService.withCheckedCombatEnd(this);
  }

  /**
   * Retourne un nouveau Combat avec une action consommée
   */
  withActionConsumed(entityId: string, actionType: 'action' | 'bonusAction' | 'reaction'): Combat {
    // Mapper vers ActionCost pour le service
    const actionCostMap = {
      'action': 'action' as const,
      'bonusAction': 'bonus_action' as const,
      'reaction': 'reaction' as const
    };
    
    return this._actionService.withConsumedAction(this, entityId, actionCostMap[actionType]);
  }
}