/**
 * DOMAIN ENTITY - CombatEngine
 * Moteur de combat D&D 5E avec architecture immutable stricte
 * Respecte ARCHITECTURE_GUIDELINES.md - Règle #2 Immutabilité
 */

import type { DiceRollingService } from '../services/DiceRollingService';
import type { DamageCalculationService } from '../services/DamageCalculationService';
import type { ILogger } from '../services/ILogger';
import type { WeaponResolutionService } from '../services/WeaponResolutionService';
import type { CombatTurnAction } from '../types/CombatContext';
import type { AIProfile } from '../types/AIProfile';
import type { Weapon } from '../entities/Weapon';

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
  stats: {
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
    movementUsed: boolean;
  };
  aiBehavior?: 'aggressive' | 'tactical' | 'defensive';
  aiProfile?: AIProfile; // Nouveau système d'IA enrichi
  equipment?: {
    weapons?: string[];
    armor?: string[];
  };
}

export type CombatPhase = 'setup' | 'active' | 'victory' | 'defeat';
export type ActionType = 'attack' | 'move' | 'end_turn' | 'cast_spell' | 'move_and_attack';
export interface Position {
  x: number;
  y: number;
}

export interface NarrativeMessage {
  id: string;
  type: 'movement' | 'attack_success' | 'attack_miss' | 'critical_hit' | 'turn_start' | 'turn_end' | 'combat_start' | 'combat_end';
  timestamp: Date;
  actors: string[];
  action: string;
  result: string;
  details?: Record<string, any>;
}

export interface CombatState {
  entities: CombatEntity[];
  currentTurnIndex: number;
  round: number;
  phase: CombatPhase;
  narratives: NarrativeMessage[];
}

export interface CombatAction {
  type: 'attack' | 'move' | 'spell' | 'defend' | 'end_turn' | 'move_and_attack';
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
  weaponResolutionService: WeaponResolutionService;
  logger: ILogger;
}

// Utilitaire pour générer des IDs uniques
function generateNarrativeId(): string {
  return `narrative_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
  private narratives: NarrativeMessage[];
  private dependencies: CombatDependencies;

  private constructor(
    entities: CombatEntity[],
    currentTurnIndex: number,
    round: number,
    phase: CombatPhase,
    narratives: NarrativeMessage[],
    dependencies: CombatDependencies
  ) {
    this.entities = entities;
    this.currentTurnIndex = currentTurnIndex;
    this.round = round;
    this.phase = phase;
    this.narratives = narratives;
    this.dependencies = dependencies;
  }

  /**
   * Factory method - Point d'entrée unique
   */
  static create(dependencies: CombatDependencies): CombatEngine {
    return new CombatEngine([], 0, 1, 'setup', [], dependencies);
  }

  // === MÉTHODES IMMUTABLES (PATTERN WITH...) ===

  /**
   * Ajouter des messages narratifs (retourne nouvelle instance)
   * 
   * @deprecated 2025-01-04 - Méthode jamais utilisée dans le codebase
   * @removal-target Nettoyage Phase 1
   */
  private withAddedNarratives(...newNarratives: NarrativeMessage[]): CombatEngine {
    const updatedNarratives = [...this.narratives, ...newNarratives];
    return new CombatEngine(this.entities, this.currentTurnIndex, this.round, this.phase, updatedNarratives, this.dependencies);
  }

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
      this.narratives,
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
                  Math.floor((entity.stats.dexterity - 10) / 2)
    }));

    // Trier par initiative décroissante, puis par dextérité
    const sortedEntities = [...entitiesWithInitiative]
      .sort((a, b) => {
        if (b.initiative !== a.initiative) {
          return b.initiative - a.initiative;
        }
        return b.stats.dexterity - a.stats.dexterity;
      });

    this.dependencies.logger.info('COMBAT_ENGINE', 'Initiative rolled', {
      initiativeOrder: sortedEntities.map(e => ({
        name: e.name,
        initiative: e.initiative,
        dexterity: e.stats.dexterity
      }))
    });

    return new CombatEngine(
      sortedEntities,
      0, // Premier dans l'ordre d'initiative
      1, // Premier round
      'active',
      this.narratives,
      this.dependencies
    );
  }

  /**
   * @deprecated Utilisez withExecutedTurn() à la place pour les actions d'IA.
   * Conservé pour compatibilité avec les actions du joueur.
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
    const { entities: updatedEntities, narratives } = this.applyActionToEntitiesWithNarratives(this.entities, action, currentEntity);
    
    this.dependencies.logger.debug('COMBAT_ENGINE', 'Action applied', {
      actionType: action.type,
      entityId: action.entityId,
      targetId: action.targetId,
      narrativesGenerated: narratives.length
    });

    return new CombatEngine(
      updatedEntities,
      this.currentTurnIndex,
      this.round,
      this.phase,
      [...this.narratives, ...narratives],
      this.dependencies
    );
  }

  /**
   * Avancer au tour suivant (retourne nouvelle instance)
   */
  withAdvancedTurn(): CombatEngine {
    let nextIndex = this.currentTurnIndex + 1;
    let nextRound = this.round;
    let newNarratives: NarrativeMessage[] = [];

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
          movement: (entity.speed || 6) * 5, // Convertir cases → pieds (1 case = 5 pieds D&D)
          movementUsed: false
        }
      }));

      // ✅ FONCTIONNALITÉ 3 - Narratif début de tour de la nouvelle entité
      const nextEntity = resetEntities[nextIndex];
      if (nextEntity) {
        newNarratives.push(this.generateTurnStartNarrative(nextEntity));
      }

      this.dependencies.logger.info('COMBAT_ENGINE', 'New round started', {
        round: nextRound,
        entitiesReset: resetEntities.length,
        nextEntityName: nextEntity?.name
      });

      return new CombatEngine(
        resetEntities,
        nextIndex,
        nextRound,
        this.checkCombatEndCondition(resetEntities),
        [...this.narratives, ...newNarratives],
        this.dependencies
      );
    }

    // ✅ FONCTIONNALITÉ 3 - Narratif début de tour de la nouvelle entité
    const nextEntity = this.entities[nextIndex];
    if (nextEntity) {
      newNarratives.push(this.generateTurnStartNarrative(nextEntity));
    }

    return new CombatEngine(
      this.entities,
      nextIndex,
      nextRound,
      this.checkCombatEndCondition(this.entities),
      [...this.narratives, ...newNarratives],
      this.dependencies
    );
  }

  /**
   * Mettre à jour une entité spécifique (retourne nouvelle instance)
   * 
   * @deprecated 2025-01-04 - Méthode jamais utilisée dans le codebase
   * @removal-target Nettoyage Phase 1  
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
      this.narratives,
      this.dependencies
    );
  }

  /**
   * NOUVELLE MÉTHODE UNIFIÉE - Exécuter un tour complet
   * Combine mouvement et attaque en une seule action atomique
   * Respecte ARCHITECTURE_GUIDELINES.md - Règle #2 Immutabilité
   */
  withExecutedTurn(action: CombatTurnAction): CombatEngine {
    // Validation de base
    const currentEntity = this.entities.find(e => e.id === action.entityId);
    if (!currentEntity) {
      this.dependencies.logger.error('COMBAT_ENGINE', 'Entity not found for turn execution', {
        entityId: action.entityId
      });
      return this;
    }

    // Vérifier que c'est bien le tour de cette entité
    if (this.entities[this.currentTurnIndex].id !== action.entityId) {
      this.dependencies.logger.warn('COMBAT_ENGINE', 'Turn execution requested for wrong entity', {
        requestedEntityId: action.entityId,
        currentEntityId: this.entities[this.currentTurnIndex].id
      });
      return this;
    }

    let updatedEntities = [...this.entities];
    const narratives: NarrativeMessage[] = [];
    let currentEntityState = currentEntity;

    // Phase 1: Mouvement (optionnel)
    if (action.movement) {
      const moveDistance = this.calculateDistance(currentEntityState.position, action.movement);
      const movementCost = moveDistance * 5; // 5 pieds par case

      if (movementCost <= currentEntityState.actionsRemaining.movement) {
        // Appliquer le mouvement
        updatedEntities = updatedEntities.map(entity =>
          entity.id === action.entityId
            ? {
                ...entity,
                position: action.movement!,
                actionsRemaining: {
                  ...entity.actionsRemaining,
                  movement: entity.actionsRemaining.movement - movementCost,
                  movementUsed: true
                }
              }
            : entity
        );

        // Mettre à jour l'état local pour la suite
        currentEntityState = {
          ...currentEntityState,
          position: action.movement,
          actionsRemaining: {
            ...currentEntityState.actionsRemaining,
            movement: currentEntityState.actionsRemaining.movement - movementCost,
            movementUsed: true
          }
        };

        // Narratif de mouvement
        narratives.push(this.generateMoveNarrative(currentEntity, currentEntity.position, action.movement));

        this.dependencies.logger.debug('COMBAT_ENGINE', 'Turn execution - movement phase', {
          entityName: currentEntity.name,
          from: currentEntity.position,
          to: action.movement,
          movementCost,
          remainingMovement: currentEntityState.actionsRemaining.movement
        });
      } else {
        this.dependencies.logger.warn('COMBAT_ENGINE', 'Insufficient movement for turn', {
          entityName: currentEntity.name,
          requestedDistance: moveDistance,
          movementAvailable: currentEntityState.actionsRemaining.movement / 5
        });
      }
    }

    // Phase 2: Attaque (optionnel)
    if (action.attackTarget && currentEntityState.actionsRemaining.action) {
      const target = updatedEntities.find(e => e.id === action.attackTarget);
      
      if (target && !target.isDead) {
        // Vérifier la portée depuis la position actuelle (après mouvement)
        const distance = this.calculateDistance(currentEntityState.position, target.position);
        const weapon = this.dependencies.weaponResolutionService.resolveBestWeaponForDistance(currentEntityState, distance);
        
        // Résoudre l'attaque
        const attackResult = this.resolveAttack(currentEntityState, target);
        
        if (attackResult.hit) {
          const newTargetHP = Math.max(0, target.hitPoints - attackResult.damage);
          
          // Appliquer les dégâts et marquer l'action comme utilisée
          updatedEntities = updatedEntities.map(entity => {
            if (entity.id === target.id) {
              return {
                ...entity,
                hitPoints: newTargetHP,
                isDead: newTargetHP === 0
              };
            }
            if (entity.id === action.entityId) {
              return {
                ...entity,
                actionsRemaining: {
                  ...entity.actionsRemaining,
                  action: false
                }
              };
            }
            return entity;
          });

          this.dependencies.logger.info('COMBAT_ENGINE', 'Turn execution - attack hit', {
            attackerName: currentEntityState.name,
            targetName: target.name,
            damage: attackResult.damage,
            weapon: attackResult.weapon,
            targetHP: `${newTargetHP}/${target.maxHitPoints}`
          });
        } else {
          // Attaque ratée, mais consommer l'action
          updatedEntities = updatedEntities.map(entity =>
            entity.id === action.entityId
              ? {
                  ...entity,
                  actionsRemaining: {
                    ...entity.actionsRemaining,
                    action: false
                  }
                }
              : entity
          );

          this.dependencies.logger.info('COMBAT_ENGINE', 'Turn execution - attack missed', {
            attackerName: currentEntityState.name,
            targetName: target.name,
            weapon: attackResult.weapon,
            attackRoll: attackResult.attackRoll,
            targetAC: target.armorClass
          });
        }

        // Narratif d'attaque
        narratives.push(this.generateAttackNarrative(
          currentEntityState,
          target,
          attackResult.attackRoll,
          attackResult.hit ? attackResult.damage : undefined,
          attackResult.weapon
        ));
      }
    }

    // Phase 3: Capacité spéciale (optionnel, pour future extension)
    if (action.useAbility && currentEntityState.actionsRemaining.action) {
      this.dependencies.logger.debug('COMBAT_ENGINE', 'Special ability usage not yet implemented', {
        entityName: currentEntityState.name,
        ability: action.useAbility
      });
    }

    // Phase 4: Position défensive (optionnel)
    if (action.defendPosition) {
      // Pour l'instant, juste logger - pourra être étendu plus tard
      this.dependencies.logger.debug('COMBAT_ENGINE', 'Defensive stance taken', {
        entityName: currentEntityState.name
      });
    }

    // Retourner le nouvel état avec toutes les modifications
    return new CombatEngine(
      updatedEntities,
      this.currentTurnIndex,
      this.round,
      this.phase,
      [...this.narratives, ...narratives],
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
   * Récupérer toutes les entités (lecture seule)
   */
  getAllEntities(): readonly CombatEntity[] {
    return this.entities;
  }

  /**
   * Obtenir l'état complet du combat
   */
  getState(): CombatState {
    return {
      entities: [...this.entities],
      currentTurnIndex: this.currentTurnIndex,
      round: this.round,
      phase: this.phase,
      narratives: [...this.narratives]
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

  /**
   * ✅ FONCTIONNALITÉ 1.3 - Calculer cellules atteignables pour mouvement
   * Logique tactique pure dans le Domain - Respecte Règle #1
   */
  calculateReachableCells(characterId: string): { x: number; y: number }[] {
    const character = this.getEntity(characterId);
    if (!character) {
      return [];
    }

    const movementRange = Math.floor(character.actionsRemaining.movement / 5); // 5 feet par cellule
    if (movementRange <= 0) {
      return [];
    }

    const reachableCells: { x: number; y: number }[] = [];
    const { x: startX, y: startY } = character.position;
    
    // Grille tactique standard D&D (12x8 par défaut)
    const gridWidth = 12;
    const gridHeight = 8;

    // Calculer toutes les positions dans le rayon de mouvement (distance Chebyshev)
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const distance = Math.max(Math.abs(x - startX), Math.abs(y - startY));
        
        // Dans le rayon ET différent de la position actuelle
        if (distance <= movementRange && distance > 0) {
          // Vérifier qu'aucune entité n'occupe cette position
          const isOccupied = this.entities.some(entity => 
            !entity.isDead && 
            entity.position.x === x && 
            entity.position.y === y
          );
          
          if (!isOccupied) {
            reachableCells.push({ x, y });
          }
        }
      }
    }

    this.dependencies.logger.debug('COMBAT_ENGINE', 'Reachable cells calculated', {
      characterId,
      characterName: character.name,
      movementRange,
      startPosition: { x: startX, y: startY },
      reachableCellsCount: reachableCells.length
    });

    return reachableCells;
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
        // Utiliser la version unifiée (sans narratifs pour la compatibilité)
        const result = this.applyAttackActionUnified(entities, action, entities.find(e => e.id === action.entityId)!);
        return result.entities;
      case 'move':
        return this.applyMoveAction(entities, action);
      case 'move_and_attack':
        return this.applyMoveAndAttackAction(entities, action);
      case 'end_turn':
        return this.applyEndTurnAction(entities, action);
      default:
        return entities; // Action non reconnue, pas de changement
    }
  }

  /**
   * Appliquer une action ET générer les narratifs avec les vrais résultats
   */
  private applyActionToEntitiesWithNarratives(
    entities: CombatEntity[], 
    action: CombatAction,
    currentEntity: CombatEntity
  ): { entities: CombatEntity[], narratives: NarrativeMessage[] } {
    const narratives: NarrativeMessage[] = [];
    let updatedEntities: CombatEntity[];

    switch (action.type) {
      case 'move':
        updatedEntities = this.applyMoveAction(entities, action);
        if (action.position) {
          narratives.push(this.generateMoveNarrative(currentEntity, currentEntity.position, action.position));
        }
        break;
        
      case 'attack':
        // Utiliser la méthode unifiée avec système d'armes
        const attackResult = this.applyAttackActionUnified(entities, action, currentEntity);
        updatedEntities = attackResult.entities;
        narratives.push(...attackResult.narratives);
        break;
        
      case 'move_and_attack':
        // Pour move_and_attack, on utilise une version qui retourne aussi les narratifs
        const result = this.applyMoveAndAttackActionWithNarratives(entities, action, currentEntity);
        updatedEntities = result.entities;
        narratives.push(...result.narratives);
        break;
        
      case 'end_turn':
        updatedEntities = this.applyEndTurnAction(entities, action);
        break;
        
      default:
        updatedEntities = entities;
    }

    return { entities: updatedEntities, narratives };
  }

  /**
   * Résolution unifiée d'une attaque avec armes
   * Règle #3 : Logique métier dans le Domaine
   * Règle #4 : Méthode pure, retourne nouvelle instance
   */
  private resolveAttack(
    attacker: CombatEntity,
    target: CombatEntity
  ): { hit: boolean; damage: number; weapon: string; attackRoll: number } {
    // Calculer la distance pour sélection tactique d'arme
    const distance = Math.abs(attacker.position.x - target.position.x) + 
                    Math.abs(attacker.position.y - target.position.y);
    
    const weapon = this.dependencies.weaponResolutionService.resolveBestWeaponForDistance(attacker, distance);

    // Attaque à mains nues si pas d'arme
    if (!weapon) {
      const attackRoll = this.dependencies.diceRollingService.roll('1d20') +
                        Math.floor((attacker.stats.strength - 10) / 2);

      if (attackRoll >= target.armorClass) {
        const damage = Math.max(1, 1 + Math.floor((attacker.stats.strength - 10) / 2));
        return { hit: true, damage, weapon: 'Mains nues', attackRoll };
      }
      return { hit: false, damage: 0, weapon: 'Mains nues', attackRoll };
    }

    // Attaque avec arme - utiliser la méthode calculateDamage de l'arme
    const abilityModifier = Math.floor((attacker.stats[weapon.stat] - 10) / 2);
    const attackRoll = this.dependencies.diceRollingService.roll('1d20') + abilityModifier;

    if (attackRoll >= target.armorClass) {
      const damage = weapon.calculateDamage(this.dependencies.diceRollingService, abilityModifier);
      return { hit: true, damage, weapon: weapon.name, attackRoll };
    }

    return { hit: false, damage: 0, weapon: weapon.name, attackRoll };
  }

  /**
   * Appliquer une attaque unifié (fonction pure)
   * Remplace TOUTES les méthodes d'attaque existantes
   */
  private applyAttackActionUnified(
    entities: CombatEntity[],
    action: CombatAction,
    currentEntity: CombatEntity
  ): { entities: CombatEntity[], narratives: NarrativeMessage[] } {
    if (!action.targetId) return { entities, narratives: [] };

    const attacker = entities.find(e => e.id === action.entityId);
    const target = entities.find(e => e.id === action.targetId);

    if (!attacker || !target) return { entities, narratives: [] };

    // Une seule résolution d'attaque
    const result = this.resolveAttack(attacker, target);

    // Appliquer les changements (immutable)
    let updatedEntities = entities;

    if (result.hit) {
      const newTargetHP = Math.max(0, target.hitPoints - result.damage);
      updatedEntities = entities.map(e => {
        if (e.id === target.id) {
          return { ...e, hitPoints: newTargetHP, isDead: newTargetHP === 0 };
        }
        if (e.id === attacker.id) {
          return { ...e, actionsRemaining: { ...e.actionsRemaining, action: false } };
        }
        return e;
      });
    } else {
      updatedEntities = entities.map(e =>
        e.id === attacker.id
          ? { ...e, actionsRemaining: { ...e.actionsRemaining, action: false } }
          : e
      );
    }

    // Générer narratif avec nom de l'arme
    const narrative = this.generateAttackNarrative(attacker, target, result.attackRoll, result.hit ? result.damage : undefined, result.weapon);

    return { entities: updatedEntities, narratives: [narrative] };
  }

  /**
   * DEPRECATED - Appliquer une attaque (fonction pure)
   */
  private applyAttackAction(
    entities: CombatEntity[], 
    action: CombatAction
  ): CombatEntity[] {
    if (!action.targetId) return entities;

    const attacker = entities.find(e => e.id === action.entityId);
    const target = entities.find(e => e.id === action.targetId);
    
    if (!attacker || !target) return entities;

    // Calculer l'attaque avec la bonne caractéristique
    const attackAbility = this.getAttackAbility(attacker);
    const attackRoll = this.dependencies.diceRollingService.roll('1d20') + 
                      Math.floor((attacker.stats[attackAbility] - 10) / 2);
    
    if (attackRoll >= target.armorClass) {
      // Touché ! Calculer les dégâts
      const damage = Math.max(1, this.dependencies.diceRollingService.roll('1d6') + 
                    Math.floor((attacker.stats[attackAbility] - 10) / 2));
      
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
   * Appliquer une attaque avec génération de narratifs (fonction pure)
   */
  private applyAttackActionWithNarratives(
    entities: CombatEntity[],
    action: CombatAction,
    currentEntity: CombatEntity
  ): { entities: CombatEntity[], narratives: NarrativeMessage[] } {
    if (!action.targetId) return { entities, narratives: [] };

    const attacker = entities.find(e => e.id === action.entityId);
    const target = entities.find(e => e.id === action.targetId);
    
    if (!attacker || !target) return { entities, narratives: [] };

    // Calculer l'attaque (un seul roll pour cohérence)
    const attackAbility = this.getAttackAbility(attacker);
    const attackRoll = this.dependencies.diceRollingService.roll('1d20') + 
                      Math.floor((attacker.stats[attackAbility] - 10) / 2);
    
    const narratives: NarrativeMessage[] = [];
    let updatedEntities: CombatEntity[];
    
    if (attackRoll >= target.armorClass) {
      // Touché ! Calculer les dégâts
      const damage = Math.max(1, this.dependencies.diceRollingService.roll('1d6') + 
                    Math.floor((attacker.stats[attackAbility] - 10) / 2));
      
      const newHitPoints = Math.max(0, target.hitPoints - damage);
      const isDead = newHitPoints === 0;

      // Appliquer les changements
      updatedEntities = entities.map(entity => {
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

      // Générer le narratif d'attaque réussie  
      const weaponName = this.dependencies.weaponResolutionService.resolveBestWeaponForDistance(attacker, distance)?.name || 'attaque';
      narratives.push(this.generateAttackNarrative(attacker, target, attackRoll, damage, weaponName));

    } else {
      // Raté
      updatedEntities = entities.map(entity => 
        entity.id === attacker.id 
          ? { ...entity, actionsRemaining: { ...entity.actionsRemaining, action: false } }
          : entity
      );

      // Générer le narratif d'attaque ratée
      const weaponName = this.dependencies.weaponResolutionService.resolveBestWeaponForDistance(attacker, distance)?.name || 'attaque';
      narratives.push(this.generateAttackNarrative(attacker, target, attackRoll, undefined, weaponName));
    }

    return { entities: updatedEntities, narratives };
  }

  /**
   * Appliquer un mouvement (fonction pure)
   */
  private applyMoveAction(
    entities: CombatEntity[], 
    action: CombatAction
  ): CombatEntity[] {
    if (!action.position) return entities;
    
    const entity = entities.find(e => e.id === action.entityId);
    if (!entity) return entities;
    
    // Calculer la distance du mouvement
    const distance = Math.abs(action.position.x - entity.position.x) + 
                    Math.abs(action.position.y - entity.position.y);
    const movementCost = distance * 5; // 5 pieds par case
    
    // Vérifier si le mouvement est possible
    if (movementCost > entity.actionsRemaining.movement) {
      return entities; // Mouvement impossible
    }

    return entities.map(e =>
      e.id === action.entityId
        ? { 
            ...e, 
            position: { x: action.position!.x, y: action.position!.y },
            actionsRemaining: { 
              ...e.actionsRemaining, 
              movement: e.actionsRemaining.movement - movementCost
            }
          }
        : e
    );
  }

  /**
   * Appliquer action combinée mouvement + attaque (fonction pure)
   * Permet à l'IA de se déplacer ET attaquer dans le même tour
   */
  private applyMoveAndAttackAction(
    entities: CombatEntity[], 
    action: CombatAction
  ): CombatEntity[] {
    if (!action.position || !action.targetId) return entities;

    const attacker = entities.find(e => e.id === action.entityId);
    const target = entities.find(e => e.id === action.targetId);
    
    if (!attacker || !target) return entities;

    this.dependencies.logger.info('COMBAT_ENGINE', 'Move and attack action', {
      attackerName: attacker.name,
      targetName: target.name,
      newPosition: action.position,
      oldPosition: attacker.position
    });

    // Étape 1: Appliquer le mouvement
    let updatedEntities = entities.map(entity =>
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

    // Étape 2: Appliquer l'attaque depuis la nouvelle position
    const movedAttacker = updatedEntities.find(e => e.id === action.entityId)!;
    const attackAbility = this.getAttackAbility(movedAttacker);
    const attackRoll = this.dependencies.diceRollingService.roll('1d20') + 
                      Math.floor((movedAttacker.stats[attackAbility] - 10) / 2);
    
    if (attackRoll >= target.armorClass) {
      // Touché ! Calculer les dégâts
      const damage = Math.max(1, this.dependencies.diceRollingService.roll('1d6') + 
                    Math.floor((movedAttacker.stats[attackAbility] - 10) / 2));
      
      const newHitPoints = Math.max(0, target.hitPoints - damage);

      this.dependencies.logger.info('COMBAT_ENGINE', 'Move and attack hit', {
        attackerName: movedAttacker.name,
        targetName: target.name,
        attackRoll,
        targetAC: target.armorClass,
        damage,
        newHitPoints
      });

      // Appliquer les dégâts et consommer l'action
      updatedEntities = updatedEntities.map(entity => {
        if (entity.id === target.id) {
          return { 
            ...entity, 
            hitPoints: newHitPoints, 
            isDead: newHitPoints === 0 
          };
        }
        if (entity.id === action.entityId) {
          return { 
            ...entity, 
            actionsRemaining: { 
              ...entity.actionsRemaining, 
              action: false 
            }
          };
        }
        return entity;
      });
    } else {
      this.dependencies.logger.info('COMBAT_ENGINE', 'Move and attack miss', {
        attackerName: movedAttacker.name,
        targetName: target.name,
        attackRoll,
        targetAC: target.armorClass
      });

      // Manqué, mais consommer quand même l'action
      updatedEntities = updatedEntities.map(entity =>
        entity.id === action.entityId
          ? { 
              ...entity, 
              actionsRemaining: { 
                ...entity.actionsRemaining, 
                action: false 
              }
            }
          : entity
      );
    }

    return updatedEntities;
  }

  /**
   * Appliquer action combinée mouvement + attaque AVEC narratifs (fonction pure)
   * Version qui génère les narratifs avec les vrais résultats des dés
   */
  private applyMoveAndAttackActionWithNarratives(
    entities: CombatEntity[], 
    action: CombatAction,
    currentEntity: CombatEntity
  ): { entities: CombatEntity[], narratives: NarrativeMessage[] } {
    if (!action.position || !action.targetId) {
      return { entities, narratives: [] };
    }

    const attacker = entities.find(e => e.id === action.entityId);
    const target = entities.find(e => e.id === action.targetId);
    
    if (!attacker || !target) {
      return { entities, narratives: [] };
    }

    const narratives: NarrativeMessage[] = [];

    // Étape 1: Appliquer le mouvement + narratif
    let updatedEntities = entities.map(entity =>
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

    // Narratif de mouvement
    narratives.push(this.generateMoveNarrative(currentEntity, currentEntity.position, action.position));

    // Étape 2: Appliquer l'attaque depuis la nouvelle position
    const movedAttacker = updatedEntities.find(e => e.id === action.entityId)!;
    const attackAbility = this.getAttackAbility(movedAttacker);
    const attackRoll = this.dependencies.diceRollingService.roll('1d20') + 
                      Math.floor((movedAttacker.stats[attackAbility] - 10) / 2);
    
    let damage = 0;
    if (attackRoll >= target.armorClass) {
      // Touché ! Calculer les dégâts
      damage = Math.max(1, this.dependencies.diceRollingService.roll('1d6') + 
               Math.floor((movedAttacker.stats[attackAbility] - 10) / 2));
      
      const newHitPoints = Math.max(0, target.hitPoints - damage);

      this.dependencies.logger.info('COMBAT_ENGINE', 'Move and attack hit', {
        attackerName: movedAttacker.name,
        targetName: target.name,
        attackRoll,
        targetAC: target.armorClass,
        damage,
        newHitPoints
      });

      // Appliquer les dégâts et consommer l'action
      updatedEntities = updatedEntities.map(entity => {
        if (entity.id === target.id) {
          return { 
            ...entity, 
            hitPoints: newHitPoints, 
            isDead: newHitPoints === 0 
          };
        }
        if (entity.id === action.entityId) {
          return { 
            ...entity, 
            actionsRemaining: { 
              ...entity.actionsRemaining, 
              action: false 
            }
          };
        }
        return entity;
      });
    } else {
      this.dependencies.logger.info('COMBAT_ENGINE', 'Move and attack miss', {
        attackerName: movedAttacker.name,
        targetName: target.name,
        attackRoll,
        targetAC: target.armorClass
      });

      // Manqué, mais consommer quand même l'action
      updatedEntities = updatedEntities.map(entity =>
        entity.id === action.entityId
          ? { 
              ...entity, 
              actionsRemaining: { 
                ...entity.actionsRemaining, 
                action: false 
              }
            }
          : entity
      );
    }

    // Narratif d'attaque avec les vrais résultats
    const weaponName = this.dependencies.weaponResolutionService.resolveBestWeaponForDistance(currentEntity, distance)?.name || 'attaque';
    narratives.push(this.generateAttackNarrative(currentEntity, target, attackRoll, damage, weaponName));

    return { entities: updatedEntities, narratives };
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

  // === HELPERS POUR ARMES ===

  /**
   * TODO: Intégrer avec le système d'armes complet plus tard
   * Pour l'instant, utiliser Force par défaut (D&D classique)
   */
  private getAttackAbility(entity: CombatEntity): keyof Stats {
    return 'strength';
  }

  // === GÉNÉRATION DE NARRATIFS (FONCTIONNALITÉ 3) ===

  /**
   * Générer un message narratif pour un mouvement
   */
  private generateMoveNarrative(entity: CombatEntity, from: Position, to: Position): NarrativeMessage {
    const distance = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
    
    return {
      id: generateNarrativeId(),
      type: 'movement',
      timestamp: new Date(),
      actors: [entity.name],
      action: `se déplace de (${from.x},${from.y}) vers (${to.x},${to.y})`,
      result: `Nouvelle position : (${to.x},${to.y})`,
      details: {
        distance: distance * 5, // 5 feet par case
        movementRemaining: Math.max(0, entity.actionsRemaining.movement - (distance * 5)),
        entityType: entity.type
      }
    };
  }

  /**
   * Générer un message narratif pour une attaque
   */
  private generateAttackNarrative(attacker: CombatEntity, target: CombatEntity, attackRoll: number, damage?: number, weaponName: string): NarrativeMessage {
    const hit = attackRoll >= target.armorClass;
    const isCritical = attackRoll === 20;
    
    if (hit) {
      const finalDamage = damage || 0;
      const remainingHP = Math.max(0, target.hitPoints - finalDamage);
      
      return {
        id: generateNarrativeId(),
        type: isCritical ? 'critical_hit' : 'attack_success',
        timestamp: new Date(),
        actors: [attacker.name, target.name],
        action: (() => {
          this.dependencies.logger.debug('ATTACK_NARRATIVE_1234', 'generateAttackNarrative ligne 1234', {
            weaponName, weaponType: typeof weaponName, attacker: attacker.name, target: target.name
          });
          return `${attacker.name} attaque ${target.name} avec ${weaponName}`;
        })(),
        result: isCritical 
          ? `CRITIQUE ! ${finalDamage} dégâts (${remainingHP}/${target.maxHitPoints} PV restants)`
          : `Touché ! ${finalDamage} dégâts (${remainingHP}/${target.maxHitPoints} PV restants)`,
        details: {
          attackRoll,
          targetAC: target.armorClass,
          damage: finalDamage,
          critical: isCritical,
          targetDefeated: remainingHP === 0
        }
      };
    } else {
      return {
        id: generateNarrativeId(),
        type: 'attack_miss',
        timestamp: new Date(),
        actors: [attacker.name, target.name],
        action: (() => {
          this.dependencies.logger.debug('ATTACK_NARRATIVE_1252', 'generateAttackNarrative ligne 1252 MISS', {
            weaponName, weaponType: typeof weaponName, attacker: attacker.name, target: target.name
          });
          return `${attacker.name} attaque ${target.name} avec ${weaponName}`;
        })(),
        result: 'Manqué !',
        details: {
          attackRoll,
          targetAC: target.armorClass
        }
      };
    }
  }


  /**
   * Générer un message narratif pour début de tour
   */
  private generateTurnStartNarrative(entity: CombatEntity): NarrativeMessage {
    return {
      id: generateNarrativeId(),
      type: 'turn_start',
      timestamp: new Date(),
      actors: [entity.name],
      action: 'commence son tour',
      result: `Actions disponibles : ${entity.actionsRemaining.action ? 'Action' : ''}${entity.actionsRemaining.bonusAction ? ', Action Bonus' : ''}${entity.actionsRemaining.movement > 0 ? `, Mouvement (${entity.actionsRemaining.movement} pieds)` : ''}`.replace(/^, /, ''),
      details: {
        entityType: entity.type,
        hitPoints: `${entity.hitPoints}/${entity.maxHitPoints}`,
        round: this.round,
        initiative: entity.initiative
      }
    };
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
   * Helper public pour calculer la distance Chebyshev entre deux positions
   * Distance tactique D&D : diagonales comptent comme 1 case
   */
  calculateDistance(pos1: Position, pos2: Position): number {
    return Math.max(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y - pos2.y));
  }

  /**
   * Helper pour vérifier si une entité peut exécuter un tour complet
   */
  canEntityExecuteTurn(entityId: string): boolean {
    const entity = this.entities.find(e => e.id === entityId);
    if (!entity || entity.isDead) {
      return false;
    }
    
    // Une entité peut exécuter un tour si elle a soit du mouvement, soit une action
    return entity.actionsRemaining.action || entity.actionsRemaining.movement > 0;
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
      case 'move_and_attack':
        return entity.actionsRemaining.action && entity.actionsRemaining.movement > 0;
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

  /**
   * NOUVELLE MÉTHODE - Attaque avec arme spécifiée par le joueur
   * Règle #1 : Logique métier dans Domain
   * Règle #4 : Méthode immutable, retourne nouvelle instance
   */
  withAppliedWeaponAttack(action: CombatAction, weaponId: string): CombatEngine {
    // Valider l'action
    const currentEntity = this.getCurrentEntity();
    if (!currentEntity || currentEntity.id !== action.entityId) {
      this.dependencies.logger.error('COMBAT_ENGINE', 'Invalid weapon attack action', {
        actionEntityId: action.entityId,
        currentEntityId: currentEntity?.id,
        weaponId
      });
      return this; // Retourne instance inchangée si action invalide
    }

    // Appliquer l'attaque avec l'arme spécifiée
    const { entities: updatedEntities, narratives } = this.applyWeaponAttack(
      this.entities, action, currentEntity, weaponId
    );
    
    this.dependencies.logger.debug('COMBAT_ENGINE', 'Weapon attack applied', {
      actionType: action.type,
      entityId: action.entityId,
      targetId: action.targetId,
      weaponId,
      narrativesGenerated: narratives.length
    });

    return new CombatEngine(
      updatedEntities,
      this.currentTurnIndex,
      this.round,
      this.phase,
      [...this.narratives, ...narratives],
      this.dependencies
    );
  }

  /**
   * Appliquer une attaque avec arme spécifiquement choisie (fonction pure)
   * Règle #1 : Logique métier dans Domain
   */
  private applyWeaponAttack(
    entities: CombatEntity[], 
    action: CombatAction,
    currentEntity: CombatEntity,
    weaponId: string
  ): { entities: CombatEntity[], narratives: NarrativeMessage[] } {
    if (!action.targetId) return { entities, narratives: [] };

    const attacker = entities.find(e => e.id === action.entityId);
    const target = entities.find(e => e.id === action.targetId);

    if (!attacker || !target) return { entities, narratives: [] };

    // Forcer l'utilisation de l'arme choisie par le joueur
    const weapon = this.dependencies.weaponResolutionService.getWeapon(weaponId);
    
    if (!weapon) {
      // Si arme non trouvée, fallback sur système automatique
      const result = this.resolveAttack(attacker, target);
      return this.executeAttackResult(entities, attacker, target, result);
    }

    // Résoudre attaque avec l'arme forcée
    const result = this.resolveAttackWithWeapon(attacker, target, weapon);
    return this.executeAttackResult(entities, attacker, target, result);
  }

  /**
   * Résoudre une attaque avec une arme spécifique (fonction pure)
   * Règle #1 : Logique métier dans Domain
   */
  private resolveAttackWithWeapon(
    attacker: CombatEntity,
    target: CombatEntity,
    weapon: Weapon
  ): { hit: boolean; damage: number; weapon: string; attackRoll: number } {
    // Debug log pour l'action du joueur
    this.dependencies.logger.debug('PLAYER_ATTACK', 'resolveAttackWithWeapon called', {
      attackerId: attacker.id,
      attackerName: attacker.name,
      targetId: target.id,
      targetName: target.name,
      weapon: weapon,
      weaponName: weapon?.name,
      weaponType: typeof weapon
    });

    // Calcul d'attaque avec l'arme spécifiée
    const abilityModifier = Math.floor((attacker.stats[weapon.stat] - 10) / 2);
    const attackRoll = this.dependencies.diceRollingService.roll('1d20') + abilityModifier;

    if (attackRoll >= target.armorClass) {
      const damage = weapon.calculateDamage(this.dependencies.diceRollingService, abilityModifier);
      return { hit: true, damage, weapon: weapon.name, attackRoll };
    }

    return { hit: false, damage: 0, weapon: weapon.name, attackRoll };
  }

  /**
   * Exécuter le résultat d'une attaque (fonction pure)
   * Règle #1 : Logique métier dans Domain
   */
  private executeAttackResult(
    entities: CombatEntity[],
    attacker: CombatEntity,
    target: CombatEntity,
    result: { hit: boolean; damage: number; weapon: string; attackRoll: number }
  ): { entities: CombatEntity[], narratives: NarrativeMessage[] } {
    let updatedEntities = entities;
    const narratives: NarrativeMessage[] = [];

    if (result.hit) {
      const newTargetHP = Math.max(0, target.hitPoints - result.damage);
      updatedEntities = entities.map(e => {
        if (e.id === target.id) {
          return {
            ...e,
            hitPoints: newTargetHP,
            isDead: newTargetHP <= 0
          };
        }
        if (e.id === attacker.id) {
          return {
            ...e,
            actionsRemaining: {
              ...e.actionsRemaining,
              action: false
            }
          };
        }
        return e;
      });

      // Générer narratif d'attaque réussie
      narratives.push(this.generateAttackNarrative(
        attacker, target, result.attackRoll, result.damage, result.weapon
      ));
    } else {
      // Attaque ratée - juste consommer l'action
      updatedEntities = entities.map(e => {
        if (e.id === attacker.id) {
          return {
            ...e,
            actionsRemaining: {
              ...e.actionsRemaining,
              action: false
            }
          };
        }
        return e;
      });

      // Debug log pour voir le result complet
      this.dependencies.logger.debug('COMBAT_MISS', 'Attack missed - result debug', {
        attackerId: attacker.id,
        attackerName: attacker.name,
        targetId: target.id,
        targetName: target.name,
        result: result,
        resultWeapon: result.weapon,
        resultWeaponType: typeof result.weapon
      });

      // Générer narratif d'attaque ratée
      narratives.push(this.generateAttackNarrative(
        attacker, target, result.attackRoll, undefined, result.weapon
      ));
    }

    return { entities: updatedEntities, narratives };
  }
}