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
import type { DiceRollingService } from '../services/DiceRollingService';
import type { DamageCalculationService } from '../services/DamageCalculationService';
import type { AbilityCalculationService } from '../services/AbilityCalculationService';
import type { InitiativeService } from '../services/InitiativeService';
import type { TacticalCalculationService } from '../services/TacticalCalculationService';
import type { Position, InventorySpec, AbilityScores, ActionsRemaining } from '../types';

// Utiliser Position des types du domaine
export type { Position } from '../types';

export interface HealthDisplay {
  readonly percentage: number;
  readonly color: string;
  readonly status: 'healthy' | 'wounded' | 'critical' | 'dead';
  readonly displayText: string;
}

export interface SpellCastingValidation {
  readonly canCast: boolean;
  readonly hasSlot: boolean;
  readonly hasAction: boolean;
  readonly reason?: string;
}

export interface CombatDependencies {
  readonly diceRollingService: DiceRollingService;
  readonly damageCalculationService: DamageCalculationService;
  readonly abilityCalculationService: AbilityCalculationService;
  readonly initiativeService: InitiativeService;
  readonly tacticalCalculationService: TacticalCalculationService;
  readonly actionPrioritizer: ActionPrioritizer;
  readonly threatAssessment: ThreatAssessment;
  readonly combatActionService: CombatActionService;
}

export interface CombatResult {
  readonly newCombat: Combat;
  readonly success: boolean;
  readonly message: string;
  readonly attackRoll?: number;
  readonly damage?: number;
  readonly healing?: number;
  readonly spellLevel?: SpellLevel;
  readonly opportunityAttacks?: string[];
}

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
  
  // Mutable State - PHASE 1.2.2: Rendu immutable
  readonly currentHP: number;
  readonly position: Position;
  readonly initiative: number;
  
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

  constructor(
    id: string, 
    gridDimensions: GridDimensions = { width: 12, height: 8 },
    private readonly dependencies: CombatDependencies
  ) {
    this._id = id;
    this._tacticalGrid = new TacticalGrid(gridDimensions);
    this._aiDecisionMaker = new AIDecisionMaker(this);
    this._threatAssessment = new ThreatAssessment(this);
    
    // Instanciation des services spécialisés
    this._queryService = new CombatQueryService();
    this._stateService = new CombatStateService();
    this._actionService = new CombatActionService();
    
    // Injection des dépendances entre services
    (this._actionService as any).getStateService = () => this._stateService;
    
    // CombatAIService avec injection constructor robuste
    this._aiService = new CombatAIService({
      queryService: this._queryService,
      actionService: this._actionService,
      aiDecisionMaker: this._aiDecisionMaker,
      threatAssessment: this._threatAssessment,
      actionPrioritizer: ActionPrioritizer
    });
  }
  
  /**
   * PHASE 1 - ACTION 1.1.1: Obtenir l'affichage de santé d'une entité
   * Migré depuis CombatUIStateUseCase - Logique métier dans Domain
   */
  getEntityHealthDisplay(entityId: string): HealthDisplay {
    const entity = this._entities.get(entityId);
    if (!entity) {
      throw new Error(`Entity ${entityId} not found in combat`);
    }
    
    const percentage = Math.max(0, Math.min(100, (entity.currentHP / entity.maxHP) * 100));
    
    let color: string;
    let status: 'healthy' | 'wounded' | 'critical' | 'dead';
    
    if (entity.isDead) {
      color = '#808080';
      status = 'dead';
    } else if (percentage > 60) {
      color = '#4CAF50';
      status = 'healthy';
    } else if (percentage > 30) {
      color = '#FF9800';
      status = 'wounded';
    } else {
      color = '#F44336';
      status = 'critical';
    }
    
    const displayText = `${entity.currentHP}/${entity.maxHP}`;
    
    return {
      percentage,
      color,
      status,
      displayText
    };
  }

  /**
   * PHASE 1 - ACTION 1.1.2: Obtenir les cellules atteignables pour une entité
   * Migré depuis MovementUIUseCase - Logique métier dans Domain
   */
  getReachableCells(entityId: string): Position[] {
    const entity = this._entities.get(entityId);
    if (!entity) {
      throw new Error(`Entity ${entityId} not found in combat`);
    }
    
    const reachable: Position[] = [];
    const movementRange = entity.actionsRemaining.movement || 0;
    const dimensions = this._tacticalGrid.dimensions;

    for (let x = 0; x < dimensions.width; x++) {
      for (let y = 0; y < dimensions.height; y++) {
        const targetPos = { x, y };
        
        // Utiliser TacticalCalculationService du Domain
        const distance = this._calculateDistance(entity.position, targetPos);
        const canMoveTo = this._tacticalGrid.isCellFree(targetPos);

        if (distance <= movementRange && canMoveTo) {
          reachable.push(targetPos);
        }
      }
    }

    return reachable;
  }
  
  private _calculateDistance(from: Position, to: Position): number {
    return Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
  }

  /**
   * PHASE 1 - ACTION 1.1.3: Valider si une entité peut lancer un sort
   * Migré depuis SpellValidationUseCase - Logique métier dans Domain
   */
  canCastSpell(casterId: string, spellId: string): SpellCastingValidation {
    const caster = this._entities.get(casterId);
    if (!caster) {
      throw new Error(`Caster ${casterId} not found in combat`);
    }
    
    // Trouver le sort dans les sorts connus
    const spell = caster.knownSpells.find(s => s.id === spellId);
    if (!spell) {
      return {
        canCast: false,
        hasSlot: false,
        hasAction: false,
        reason: `Sort ${spellId} non connu par ${caster.name}`
      };
    }
    
    // Vérifier les slots de sort disponibles
    const hasSlot = caster.spellSlots.hasSlot(spell.level);
    
    // Déterminer le coût d'action requis
    const actionCost = spell.castingTime === 'bonus_action' ? 'bonusAction' : 'action';
    const actionValue = caster.actionsRemaining[actionCost as keyof typeof caster.actionsRemaining];
    const hasAction = typeof actionValue === 'number' ? actionValue > 0 : Boolean(actionValue);
    
    // Validation globale
    const canCast = hasSlot && hasAction;
    
    // Raison de l'échec si applicable
    let reason: string | undefined;
    if (!hasSlot) {
      reason = `Aucun slot de niveau ${spell.level} disponible`;
    } else if (!hasAction) {
      reason = `Aucune ${actionCost === 'action' ? 'action' : 'action bonus'} disponible`;
    }
    
    return {
      canCast,
      hasSlot,
      hasAction,
      reason
    };
  }

  /**
   * PHASE 1 - ACTION 1.1.4: Valider si une entité peut attaquer une position
   * Migré depuis WeaponRangeUseCase - Logique métier dans Domain
   */
  canAttackPosition(attackerId: string, position: Position, weaponId: string): boolean {
    const attacker = this._entities.get(attackerId);
    if (!attacker) {
      throw new Error(`Attacker ${attackerId} not found in combat`);
    }
    
    // Trouver l'arme dans l'inventaire ou les armes équipées
    const weapon = attacker.inventory?.weapons?.find(w => w.id === weaponId);
    if (!weapon) {
      throw new Error(`Weapon ${weaponId} not found for attacker ${attackerId}`);
    }
    
    // Déléguer la détermination de portée à l'entité Weapon
    const weaponRange = weapon.getAttackRange();
    
    // Calcul de distance et validation
    const distance = this._calculateDistance(attacker.position, position);
    
    return distance <= weaponRange;
  }
  
  /**
   * PHASE 1 - ACTION 1.2.2: Méthodes helper pour CombatEntity immutable
   * Pattern with...() pour respecter Gemini #1
   */
  private _createUpdatedEntity(entityId: string, updates: Partial<CombatEntity>): CombatEntity {
    const current = this._entities.get(entityId);
    if (!current) {
      throw new Error(`Entity ${entityId} not found`);
    }
    return { ...current, ...updates };
  }
  
  withEntityHP(entityId: string, newHP: number): Combat {
    const updatedEntity = this._createUpdatedEntity(entityId, { currentHP: newHP });
    const newEntities = new Map(this._entities);
    newEntities.set(entityId, updatedEntity);
    
    const newCombat = Object.create(Object.getPrototypeOf(this));
    Object.assign(newCombat, this, { _entities: newEntities });
    return newCombat;
  }
  
  withEntityPosition(entityId: string, newPosition: Position): Combat {
    const updatedEntity = this._createUpdatedEntity(entityId, { position: newPosition });
    const newEntities = new Map(this._entities);
    newEntities.set(entityId, updatedEntity);
    
    const newCombat = Object.create(Object.getPrototypeOf(this));
    Object.assign(newCombat, this, { _entities: newEntities });
    return newCombat;
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

  /**
   * PHASE 4 - ACTION 4.1.1: Effectuer une attaque d'arme
   * Migré depuis CombatOrchestrationService - Logique métier dans Domain
   */
  performWeaponAttack(attackerId: string, weaponId: string, targetId: string): CombatResult {
    try {
      // Récupérer les entités
      const attacker = this._entities.get(attackerId);
      const target = this._entities.get(targetId);

      if (!attacker) {
        return {
          newCombat: this,
          success: false,
          message: `Attaquant ${attackerId} non trouvé`
        };
      }

      if (!target) {
        return {
          newCombat: this,
          success: false,
          message: `Cible ${targetId} non trouvée`
        };
      }

      if (target.isDead) {
        return {
          newCombat: this,
          success: false,
          message: `La cible ${target.name} est déjà morte`
        };
      }

      // Vérifications de base
      if (!attacker.actionsRemaining.action) {
        return {
          newCombat: this,
          success: false,
          message: `${attacker.name} n'a plus d'actions disponibles`
        };
      }

      // LOGIQUE MÉTIER CENTRALISÉE - Jets d'attaque avec injection
      const attackRoll = this.dependencies.diceRollingService.rollD20();
      const attackBonus = this.dependencies.abilityCalculationService.calculateModifier(attacker.abilities.strength) + attacker.proficiencyBonus;
      const totalAttackRoll = attackRoll + attackBonus;
      
      // Vérifier si l'attaque touche
      const targetAC = target.baseAC;
      const hits = totalAttackRoll >= targetAC;

      if (!hits) {
        // Attaque ratée - consommer l'action quand même
        const combatAfterAction = this.withActionConsumed(attackerId, 'action');
        return {
          newCombat: combatAfterAction,
          success: true,
          message: `${attacker.name} rate son attaque contre ${target.name} (${totalAttackRoll} vs AC ${targetAC})`,
          attackRoll: totalAttackRoll,
          damage: 0
        };
      }

      // Attaque réussie - calculer les dégâts avec injection
      // Créer une arme temporaire pour le calcul (logique simplifiée)
      const tempWeapon = {
        damage: { diceCount: 1, diceType: 6 },
        category: 'melee' as const,
        properties: [] as string[]
      };
      
      const damage = this.dependencies.damageCalculationService.calculateWeaponDamage(tempWeapon, attacker);
      
      // Appliquer les effets via l'API immutable PROPRE
      let newCombat = this;
      
      // 1. Consommer l'action
      newCombat = newCombat.withActionConsumed(attackerId, 'action');
      
      // 2. Appliquer les dégâts
      newCombat = newCombat.withDamageApplied(targetId, damage);

      return {
        newCombat,
        success: true,
        message: `${attacker.name} touche ${target.name} pour ${damage} dégâts (jet: ${totalAttackRoll} vs AC ${targetAC})`,
        attackRoll: totalAttackRoll,
        damage
      };

    } catch (error) {
      return {
        newCombat: this,
        success: false,
        message: `Erreur lors de l'attaque: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }

  /**
   * PHASE 4 - ACTION 4.1.2: Lancer un sort
   * Migré depuis CombatOrchestrationService - Logique métier dans Domain
   */
  castSpell(
    casterId: string,
    spellId: string,
    level: SpellLevel,
    targetId?: string
  ): CombatResult {
    try {
      const caster = this._entities.get(casterId);
      if (!caster) {
        return {
          newCombat: this,
          success: false,
          message: `Lanceur ${casterId} non trouvé`,
          spellLevel: level
        };
      }

      // Trouver le sort dans la liste des sorts connus
      const spell = caster.knownSpells.find(s => s.id === spellId);
      if (!spell) {
        return {
          newCombat: this,
          success: false,
          message: `Sort ${spellId} non connu par ${caster.name}`,
          spellLevel: level
        };
      }

      // Vérifier l'emplacement de sort disponible
      if (!spell.isCantrip() && (caster.spellSlots as any)[level] <= 0) {
        return {
          newCombat: this,
          success: false,
          message: `Aucun emplacement de sort de niveau ${level} disponible`,
          spellLevel: level
        };
      }

      // Vérifier l'action requise
      const hasRequiredAction = spell.castingTime === 'bonus_action' 
        ? caster.actionsRemaining.bonusAction
        : caster.actionsRemaining.action;

      if (!hasRequiredAction) {
        return {
          newCombat: this,
          success: false,
          message: `${caster.name} n'a pas l'action requise pour lancer ce sort`,
          spellLevel: level
        };
      }

      // LOGIQUE MÉTIER DU SORT - Application immutable
      let newCombat = this;
      let totalDamage = 0;
      let totalHealing = 0;

      // Consommer l'action appropriée
      const actionType = spell.castingTime === 'bonus_action' ? 'bonusAction' : 'action';
      newCombat = newCombat.withActionConsumed(casterId, actionType);

      // Appliquer les effets selon le type de sort
      if (spell.effects.damage && targetId) {
        const target = this._entities.get(targetId);
        if (target && !target.isDead) {
          totalDamage = this.calculateSpellDamage(spell, level, caster);
          newCombat = newCombat.withDamageApplied(targetId, totalDamage);
        }
      }

      if (spell.effects.healing && targetId) {
        const target = this._entities.get(targetId);
        if (target && !target.isDead) {
          totalHealing = this.calculateSpellHealing(spell, level, caster);
          newCombat = newCombat.withHealing(targetId, totalHealing);
        }
      }

      const effectMessage = totalDamage > 0 ? ` (${totalDamage} dégâts)` :
                           totalHealing > 0 ? ` (${totalHealing} soins)` : '';

      return {
        newCombat,
        success: true,
        message: `${caster.name} lance ${spell.name}${effectMessage}`,
        damage: totalDamage || undefined,
        healing: totalHealing || undefined,
        spellLevel: level
      };

    } catch (error) {
      return {
        newCombat: this,
        success: false,
        message: `Erreur lors du lancement du sort: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        spellLevel: level
      };
    }
  }

  /**
   * Calculer les dégâts d'un sort avec injection de dépendances
   */
  private calculateSpellDamage(spell: Spell, level: SpellLevel, caster: CombatEntity): number {
    // Utiliser la méthode du sort s'il l'a, sinon logique par défaut
    if (spell.calculateDamage) {
      const spellcastingMod = this.getSpellcastingModifier(caster);
      return spell.calculateDamage(this.dependencies.diceRollingService, level, spellcastingMod, caster.proficiencyBonus);
    }
    
    // Logique par défaut avec injection diceRollingService
    return this.dependencies.diceRollingService.rollD6() + level;
  }

  /**
   * Calculer les soins d'un sort avec injection de dépendances
   */
  private calculateSpellHealing(spell: Spell, level: SpellLevel, caster: CombatEntity): number {
    // Utiliser la méthode du sort s'il l'a, sinon logique par défaut
    if (spell.calculateHealing) {
      const spellcastingMod = this.getSpellcastingModifier(caster);
      return spell.calculateHealing(this.dependencies.diceRollingService, level, spellcastingMod);
    }
    
    // Logique par défaut avec injection diceRollingService
    return this.dependencies.diceRollingService.rollD6() + level + 2;
  }

  /**
   * Obtenir le modificateur d'incantation avec injection AbilityCalculationService
   */
  private getSpellcastingModifier(caster: CombatEntity): number {
    if (!caster.spellcastingAbility) return 0;
    
    const ability = caster.abilities[caster.spellcastingAbility];
    return this.dependencies.abilityCalculationService.calculateModifier(ability);
  }

  /**
   * PHASE 4 - ACTION 4.1.3: Exécuter un mouvement
   * Migré depuis CombatOrchestrationService - Logique métier dans Domain
   */
  executeMovement(entityId: string, newPosition: Position): CombatResult {
    try {
      const entity = this._entities.get(entityId);
      if (!entity) {
        return {
          newCombat: this,
          success: false,
          message: `Entité ${entityId} non trouvée`
        };
      }

      if (entity.isDead) {
        return {
          newCombat: this,
          success: false,
          message: `${entity.name} est mort et ne peut pas se déplacer`
        };
      }

      if (entity.actionsRemaining.movement <= 0) {
        return {
          newCombat: this,
          success: false,
          message: `${entity.name} n'a plus de mouvement disponible`
        };
      }

      // Vérifier les attaques d'opportunité AVANT le mouvement (méthode existante)
      const opportunityAttackers = this.checkOpportunityAttacks(entityId, entity.position, newPosition);
      
      // Effectuer le mouvement via l'API immutable (méthode existante)
      const newCombat = this.withEntityMoved(entityId, newPosition);

      const opportunityMessage = opportunityAttackers.length > 0 
        ? ` (provoque ${opportunityAttackers.length} attaque(s) d'opportunité)`
        : '';

      return {
        newCombat,
        success: true,
        message: `${entity.name} se déplace${opportunityMessage}`,
        opportunityAttacks: opportunityAttackers
      };

    } catch (error) {
      return {
        newCombat: this,
        success: false,
        message: `Erreur lors du mouvement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }
}