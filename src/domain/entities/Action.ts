/**
 * DOMAIN ENTITY - Action
 * Pure business logic pour actions de combat D&D 5E
 */

// import { type GridPosition } from './TacticalGrid'; // Non utilisé actuellement
import type { DiceRollingService } from '../services/DiceRollingService';

export type ActionType = 
  | 'attack' | 'spell' | 'dash' | 'dodge' | 'help' | 'hide' | 'ready' | 'search' | 'use_object'
  | 'grapple' | 'shove' | 'improvised' | 'two_weapon_fighting' | 'offhand_attack';

export type ActionCost = 'action' | 'bonus_action' | 'reaction' | 'free' | 'movement';

export type DamageType = 
  | 'acid' | 'bludgeoning' | 'cold' | 'fire' | 'force' | 'lightning' | 'necrotic'
  | 'piercing' | 'poison' | 'psychic' | 'radiant' | 'slashing' | 'thunder';

export type AbilityScore = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';

export interface DamageRoll {
  readonly diceCount: number;
  readonly diceType: number; // d4, d6, d8, d10, d12, d20
  readonly modifier: number;
  readonly damageType: DamageType;
}

export interface ActionRequirement {
  readonly abilityScore?: AbilityScore;
  readonly minimumScore?: number;
  readonly range?: number; // en cases
  readonly requiresTarget?: boolean;
  readonly requiresLineOfSight?: boolean;
  readonly provokesOpportunityAttack?: boolean;
}

export interface ActionEffect {
  readonly damage?: DamageRoll[];
  readonly healing?: DamageRoll[];
  readonly conditions?: string[];
  readonly duration?: number; // en tours
  readonly savingThrow?: {
    ability: AbilityScore;
    dc: number;
    halfDamageOnSuccess?: boolean;
  };
}

/**
 * ACTION - Value Object
 * Représente une action possible en combat
 */
export class Action {
  private readonly _id: string;
  private readonly _name: string;
  private readonly _type: ActionType;
  private readonly _cost: ActionCost;
  private readonly _description: string;
  private readonly _requirements: ActionRequirement;
  private readonly _effects: ActionEffect;

  constructor(
    id: string,
    name: string,
    type: ActionType,
    cost: ActionCost,
    description: string,
    requirements: ActionRequirement = {},
    effects: ActionEffect = {}
  ) {
    this._id = id;
    this._name = name;
    this._type = type;
    this._cost = cost;
    this._description = description;
    this._requirements = requirements;
    this._effects = effects;
  }

  // GETTERS (Pure)
  get id(): string { return this._id; }
  get name(): string { return this._name; }
  get type(): ActionType { return this._type; }
  get cost(): ActionCost { return this._cost; }
  get description(): string { return this._description; }
  get requirements(): ActionRequirement { return this._requirements; }
  get effects(): ActionEffect { return this._effects; }

  // BUSINESS RULES (Pure Logic)

  /**
   * Vérifier si l'action peut être utilisée par une entité
   */
  canBeUsedBy(entityAbilities: Record<AbilityScore, number>): boolean {
    if (!this._requirements.abilityScore || !this._requirements.minimumScore) {
      return true;
    }

    const requiredAbility = this._requirements.abilityScore;
    const entityScore = entityAbilities[requiredAbility];
    
    return entityScore >= this._requirements.minimumScore;
  }

  /**
   * Calculer les dégâts de l'action
   */
  calculateDamage(
    diceRollingService: DiceRollingService,
    abilityModifier: number = 0, 
    _proficiencyBonus: number = 0
  ): number {
    if (!this._effects.damage) return 0;

    let totalDamage = 0;
    
    this._effects.damage.forEach(damageRoll => {
      const rollResult = diceRollingService.rollDamage(damageRoll.diceCount, damageRoll.diceType);
      totalDamage += rollResult + damageRoll.modifier + abilityModifier;
    });

    return Math.max(0, totalDamage);
  }

  /**
   * Calculer les soins de l'action
   */
  calculateHealing(
    diceRollingService: DiceRollingService,
    _abilityModifier: number = 0, 
    spellcastingModifier: number = 0
  ): number {
    if (!this._effects.healing) return 0;

    let totalHealing = 0;
    
    this._effects.healing.forEach(healingRoll => {
      const rollResult = diceRollingService.rollDamage(healingRoll.diceCount, healingRoll.diceType);
      totalHealing += rollResult + healingRoll.modifier + spellcastingModifier;
    });

    return Math.max(0, totalHealing);
  }

  /**
   * Vérifier si l'action nécessite un jet de sauvegarde
   */
  requiresSavingThrow(): boolean {
    return !!this._effects.savingThrow;
  }

  /**
   * Calculer le DC du jet de sauvegarde
   */
  getSavingThrowDC(spellcastingModifier: number = 0, proficiencyBonus: number = 0): number {
    if (!this._effects.savingThrow) return 0;
    
    // DC = 8 + modificateur de caractéristique + bonus de maîtrise
    return 8 + spellcastingModifier + proficiencyBonus;
  }
}

