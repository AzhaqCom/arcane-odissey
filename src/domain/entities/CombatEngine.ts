/**
 * DOMAIN ENTITY - CombatEngine
 * Moteur de combat D&D 5E avec architecture immutable stricte
 * Respecte ARCHITECTURE_GUIDELINES.md - Règle #2 Immutabilité
 */

import type { DiceRollingService } from '../services/DiceRollingService';
import type { DamageCalculationService } from '../services/DamageCalculationService';
import type { ILogger } from '../services/ILogger';

// Types de base
export interface CombatEntity {
  id: string;
  name: string;
  type: 'player' | 'enemy' | 'ally';
  level: number;
  hitPoints: number;
  maxHitPoints: number;
  armorClass: number;
  speed: number;
  initiative: number;
  abilities: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  position: { x: number; y: number };
  isActive: boolean;
  isDead: boolean;
  actionsRemaining: {
    action: boolean;
    bonusAction: boolean;
    reaction: boolean;
    movement: number;
  };
  aiBehavior?: 'aggressive' | 'tactical' | 'defensive';
}

export type CombatPhase = 'setup' | 'active' | 'victory' | 'defeat';
export type ActionType = 'attack' | 'move' | 'end_turn' | 'cast_spell';

export interface CombatState {
  entities: CombatEntity[];
  currentTurnIndex: number;
  round: number;
  phase: CombatPhase;
}

export interface CombatAction {
  type: 'attack' | 'move' | 'spell' | 'defend' | 'end_turn';
  entityId: string;
  targetId?: string;
  weaponId?: string;
  spellId?: string;
  position?: { x: number; y: number };
  damage?: number;
}

export interface CombatResult {
  success: boolean;
  damage?: number;
  message: string;
  effects?: string[];
}

export interface CombatDependencies {
  diceRollingService: DiceRollingService;
  damageCalculationService: DamageCalculationService;
  logger: ILogger;
}

/**
 * COMBAT ENGINE IMMUTABLE
 * ✅ Respecte la Règle d'Or #2 - Immutabilité Stricte
 * ✅ Toutes les méthodes retournent une nouvelle instance
 * ✅ Pattern with...() pour les mutations
 * ✅ Propriétés readonly exclusivement
 */
export class CombatEngine {
  private entities: CombatEntity[];
  private currentTurnIndex: number;
  private round: number;
  private phase: CombatPhase;
  private dependencies: CombatDependencies;

  private constructor(
    entities: CombatEntity[],
    currentTurnIndex: number,
    round: number,
    phase: CombatPhase,
    dependencies: CombatDependencies
  ) {
    this.entities = entities;
    this.currentTurnIndex = currentTurnIndex;
    this.round = round;
    this.phase = phase;
    this.dependencies = dependencies;
  }

  /**
   * Factory method - Point d'entrée unique
   */
  static create(dependencies: CombatDependencies): CombatEngine {
    return new CombatEngine([], 0, 1, 'setup', dependencies);
  }

  // === MÉTHODES IMMUTABLES (PATTERN WITH...) ===

  /**
   * Ajouter une entité (retourne nouvelle instance)
   */
  withAddedEntity(entity: CombatEntity): CombatEngine {
    const newEntities = [...this.entities, entity];
    
    this.dependencies.logger.debug('COMBAT_ENGINE', 'Entity added', {
      entityId: entity.id,
      entityName: entity.name,
      totalEntities: newEntities.length
    });

    return new CombatEngine(
      newEntities,
      this.currentTurnIndex,
      this.round,
      this.phase,
      this.dependencies
    );
  }

  /**
   * Calculer l'initiative et commencer le combat (retourne nouvelle instance)
   */
  withRolledInitiative(): CombatEngine {
    // Rouler l'initiative pour chaque entité
    const entitiesWithInitiative = this.entities.map(entity => ({
      ...entity,
      initiative: this.dependencies.diceRollingService.roll('1d20') + 
                  Math.floor((entity.abilities.dexterity - 10) / 2)
    }));

    // Trier par initiative décroissante, puis par dextérité
    const sortedEntities = [...entitiesWithInitiative]
      .sort((a, b) => {
        if (b.initiative !== a.initiative) {
          return b.initiative - a.initiative;
        }
        return b.abilities.dexterity - a.abilities.dexterity;
      });

    this.dependencies.logger.info('COMBAT_ENGINE', 'Initiative rolled', {
      initiativeOrder: sortedEntities.map(e => ({
        name: e.name,
        initiative: e.initiative,
        dexterity: e.abilities.dexterity
      }))
    });

    return new CombatEngine(
      sortedEntities,
      0, // Premier dans l'ordre d'initiative
      1, // Premier round
      'active',
      this.dependencies
    );
  }

  /**
   * Appliquer une action de combat (retourne nouvelle instance)
   */
  withAppliedAction(action: CombatAction): CombatEngine {
    // Valider l'action
    const currentEntity = this.getCurrentEntity();
    if (!currentEntity || currentEntity.id !== action.entityId) {
      this.dependencies.logger.error('COMBAT_ENGINE', 'Invalid action', {
        actionEntityId: action.entityId,
        currentEntityId: currentEntity?.id
      });
      return this; // Retourne instance inchangée si action invalide
    }

    // Appliquer l'action selon son type
    const updatedEntities = this.applyActionToEntities(this.entities, action);
    
    this.dependencies.logger.debug('COMBAT_ENGINE', 'Action applied', {
      actionType: action.type,
      entityId: action.entityId,
      targetId: action.targetId
    });

    return new CombatEngine(
      updatedEntities,
      this.currentTurnIndex,
      this.round,
      this.phase,
      this.dependencies
    );
  }

  /**
   * Avancer au tour suivant (retourne nouvelle instance)
   */
  withAdvancedTurn(): CombatEngine {
    let nextIndex = this.currentTurnIndex + 1;
    let nextRound = this.round;

    // Si on dépasse la fin de l'ordre, nouveau round
    if (nextIndex >= this.entities.length) {
      nextIndex = 0;
      nextRound += 1;
      
      // Réinitialiser les actions de toutes les entités
      const resetEntities = this.entities.map(entity => ({
        ...entity,
        actionsRemaining: {
          action: true,
          bonusAction: true,
          reaction: true,
          movement: entity.speed || 30
        }
      }));

      this.dependencies.logger.info('COMBAT_ENGINE', 'New round started', {
        round: nextRound,
        entitiesReset: resetEntities.length
      });

      return new CombatEngine(
        resetEntities,
        nextIndex,
        nextRound,
        this.checkCombatEndCondition(resetEntities),
        this.dependencies
      );
    }

    return new CombatEngine(
      this.entities,
      nextIndex,
      nextRound,
      this.checkCombatEndCondition(this.entities),
      this.dependencies
    );
  }

  /**
   * Mettre à jour une entité spécifique (retourne nouvelle instance)
   */
  withUpdatedEntity(entityId: string, updates: Partial<CombatEntity>): CombatEngine {
    const updatedEntities = this.entities.map(entity =>
      entity.id === entityId ? { ...entity, ...updates } : entity
    );

    return new CombatEngine(
      updatedEntities,
      this.currentTurnIndex,
      this.round,
      this.phase,
      this.dependencies
    );
  }

  // === GETTERS PURS (PAS DE MUTATION) ===

  /**
   * Obtenir l'entité active actuelle
   */
  getCurrentEntity(): CombatEntity | null {
    return this.entities[this.currentTurnIndex] || null;
  }

  /**
   * Obtenir l'état complet du combat
   */
  getState(): CombatState {
    return {
      entities: [...this.entities],
      currentTurnIndex: this.currentTurnIndex,
      round: this.round,
      phase: this.phase
    };
  }

  /**
   * Obtenir une entité par ID
   */
  getEntity(entityId: string): CombatEntity | null {
    return this.entities.find(e => e.id === entityId) || null;
  }

  /**
   * Obtenir les ennemis d'une entité
   */
  getEnemiesOf(entityId: string): CombatEntity[] {
    const entity = this.getEntity(entityId);
    if (!entity) return [];

    if (entity.type === 'enemy') {
      return this.entities.filter(e => e.type === 'player' || e.type === 'ally');
    }
    return this.entities.filter(e => e.type === 'enemy');
  }

  /**
   * Vérifier si le combat est terminé
   */
  isEnded(): boolean {
    return this.phase === 'victory' || this.phase === 'defeat';
  }

  // === MÉTHODES PRIVÉES PURES ===

  /**
   * Appliquer une action sur les entités (fonction pure)
   */
  private applyActionToEntities(
    entities: CombatEntity[], 
    action: CombatAction
  ): CombatEntity[] {
    switch (action.type) {
      case 'attack':
        return this.applyAttackAction(entities, action);
      case 'move':
        return this.applyMoveAction(entities, action);
      case 'end_turn':
        return this.applyEndTurnAction(entities, action);
      default:
        return entities; // Action non reconnue, pas de changement
    }
  }

  /**
   * Appliquer une attaque (fonction pure)
   */
  private applyAttackAction(
    entities: CombatEntity[], 
    action: CombatAction
  ): CombatEntity[] {
    if (!action.targetId) return entities;

    const attacker = entities.find(e => e.id === action.entityId);
    const target = entities.find(e => e.id === action.targetId);
    
    if (!attacker || !target) return entities;

    // Calculer l'attaque
    const attackRoll = this.dependencies.diceRollingService.roll('1d20') + 
                      Math.floor((attacker.abilities.strength - 10) / 2);
    
    if (attackRoll >= target.armorClass) {
      // Touché ! Calculer les dégâts
      const damage = this.dependencies.diceRollingService.roll('1d6') + 
                    Math.floor((attacker.abilities.strength - 10) / 2);
      
      const newHitPoints = Math.max(0, target.hitPoints - damage);
      const isDead = newHitPoints === 0;

      this.dependencies.logger.info('COMBAT_ENGINE', 'Attack successful', {
        attacker: attacker.name,
        target: target.name,
        attackRoll,
        damage,
        newHitPoints,
        isDead
      });

      // Retourner les entités avec la cible mise à jour
      return entities.map(entity => {
        if (entity.id === target.id) {
          return { ...entity, hitPoints: newHitPoints, isDead };
        }
        if (entity.id === attacker.id) {
          return { 
            ...entity, 
            actionsRemaining: { ...entity.actionsRemaining, action: false } 
          };
        }
        return entity;
      });
    } else {
      // Raté
      this.dependencies.logger.info('COMBAT_ENGINE', 'Attack missed', {
        attacker: attacker.name,
        target: target.name,
        attackRoll,
        targetAC: target.armorClass
      });

      return entities.map(entity => 
        entity.id === attacker.id 
          ? { ...entity, actionsRemaining: { ...entity.actionsRemaining, action: false } }
          : entity
      );
    }
  }

  /**
   * Appliquer un mouvement (fonction pure)
   */
  private applyMoveAction(
    entities: CombatEntity[], 
    action: CombatAction
  ): CombatEntity[] {
    if (!action.position) return entities;

    return entities.map(entity =>
      entity.id === action.entityId
        ? { 
            ...entity, 
            position: { x: action.position!.x, y: action.position!.y },
            actionsRemaining: { 
              ...entity.actionsRemaining, 
              movement: Math.max(0, entity.actionsRemaining.movement - 5) 
            }
          }
        : entity
    );
  }

  /**
   * Appliquer fin de tour (fonction pure)
   */
  private applyEndTurnAction(
    entities: CombatEntity[], 
    action: CombatAction
  ): CombatEntity[] {
    return entities.map(entity =>
      entity.id === action.entityId
        ? { 
            ...entity, 
            actionsRemaining: { 
              action: false, 
              bonusAction: false, 
              reaction: entity.actionsRemaining.reaction,
              movement: 0 
            }
          }
        : entity
    );
  }

  /**
   * ✅ BUSINESS RULES - Obtenir les actions disponibles pour l'entité courante
   * ✅ Déplacé depuis CombatGameUseCase vers Domain (ARCHITECTURE_GUIDELINES.md Règle #1)
   * Logique métier : règles D&D pour les actions possibles
   */
  getAvailableActionsForCurrentEntity(): ActionType[] {
    const currentEntity = this.getCurrentEntity();
    if (!currentEntity || currentEntity.type !== 'player') {
      return [];
    }

    const actions: ActionType[] = [];

    // Règle D&D : Action d'attaque disponible si on a une action
    if (currentEntity.actionsRemaining.action) {
      actions.push('attack');
    }

    // Règle D&D : Mouvement disponible si on a des points de mouvement
    if (currentEntity.actionsRemaining.movement > 0) {
      actions.push('move');
    }

    // Règle D&D : On peut toujours terminer son tour
    actions.push('end_turn');

    return actions;
  }

  /**
   * ✅ BUSINESS RULES - Vérifier si une entité peut effectuer une action spécifique
   * Logique métier centralisée dans Domain
   */
  canEntityPerformAction(entityId: string, actionType: ActionType): boolean {
    const entity = this.entities.find(e => e.id === entityId);
    if (!entity || entity.isDead) {
      return false;
    }

    switch (actionType) {
      case 'attack':
        return entity.actionsRemaining.action;
      case 'move': 
        return entity.actionsRemaining.movement > 0;
      case 'end_turn':
        return true; // Toujours possible
      case 'cast_spell':
        return entity.actionsRemaining.action; // Pour l'instant, sorts = actions
      default:
        return false;
    }
  }

  /**
   * Vérifier les conditions de fin de combat (fonction pure)
   */
  private checkCombatEndCondition(entities: CombatEntity[]): CombatPhase {
    const aliveEnemies = entities.filter(e => e.type === 'enemy' && !e.isDead);
    const aliveAllies = entities.filter(e => (e.type === 'player' || e.type === 'ally') && !e.isDead);

    if (aliveEnemies.length === 0) return 'victory';
    if (aliveAllies.length === 0) return 'defeat';
    return 'active';
  }
}