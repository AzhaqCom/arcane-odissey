/**
 * DOMAIN ENTITY - Spell
 * Pure business logic pour système de sorts D&D 5E
 */

import { Action, type ActionEffect, type DamageRoll, type AbilityScore } from './Action';
import { type GridPosition } from './TacticalGrid';

export type SpellLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9; // 0 = Cantrip
export type SpellSchool =
  | 'abjuration' | 'conjuration' | 'divination' | 'enchantment'
  | 'evocation' | 'illusion' | 'necromancy' | 'transmutation';

export type CastingTime = 'action' | 'bonus_action' | 'reaction' | 'minute' | 'hour' | 'ritual';
export type SpellRange = number | 'self' | 'touch' | 'unlimited';
export type Duration = 'instantaneous' | 'concentration' | number; // nombre de tours

export interface SpellComponent {
  readonly verbal: boolean;        // V - Composant verbal
  readonly somatic: boolean;       // S - Composant somatique  
  readonly material: boolean;      // M - Composant matériel
  readonly materialDescription?: string;
  readonly consumed?: boolean;     // Le composant est-il consommé ?
  readonly costInGP?: number;      // Coût en pièces d'or
}

export interface SpellAreaOfEffect {
  readonly shape: 'sphere' | 'cube' | 'cylinder' | 'cone' | 'line';
  readonly size: number;          // Rayon/largeur en cases
  readonly originatesFromCaster?: boolean;
}

export interface SpellCombat {
  readonly projectiles?: number;           // Nombre de projectiles (Magic Missile = 3)
  readonly requiresAttackRoll?: boolean;   // false = touche automatiquement
  readonly targetType?: 'enemy' | 'ally' | 'any' | 'self' | 'area';
  readonly castableOutOfCombat?: boolean;
}

/**
 * SPELL - Aggregate Root
 * Représente un sort avec toutes ses propriétés D&D 5E
 */
export class Spell {
  private readonly _id: string;
  private readonly _name: string;
  private readonly _level: SpellLevel;
  private readonly _school: SpellSchool;
  private readonly _castingTime: CastingTime;
  private readonly _range: SpellRange;
  private readonly _duration: Duration;
  private readonly _components: SpellComponent;
  private readonly _description: string;
  private readonly _effects: ActionEffect;
  private readonly _areaOfEffect?: SpellAreaOfEffect;
  private readonly _combatProperties: SpellCombat;
  private readonly _higherLevelEffects?: string;
  private readonly _ritual: boolean;
  private readonly _concentration: boolean;

  constructor(
    id: string,
    name: string,
    level: SpellLevel,
    school: SpellSchool,
    castingTime: CastingTime,
    range: SpellRange,
    duration: Duration,
    components: SpellComponent,
    description: string,
    effects: ActionEffect = {},
    areaOfEffect?: SpellAreaOfEffect,
    combatProperties: SpellCombat = {},
    higherLevelEffects?: string,
    ritual: boolean = false,
    concentration: boolean = false
  ) {
    this._id = id;
    this._name = name;
    this._level = level;
    this._school = school;
    this._castingTime = castingTime;
    this._range = range;
    this._duration = duration;
    this._components = components;
    this._description = description;
    this._effects = effects;
    this._areaOfEffect = areaOfEffect;
    this._combatProperties = combatProperties;
    this._higherLevelEffects = higherLevelEffects;
    this._ritual = ritual;
    this._concentration = concentration;
  }

  // GETTERS (Pure)
  get id(): string { return this._id; }
  get name(): string { return this._name; }
  get level(): SpellLevel { return this._level; }
  get school(): SpellSchool { return this._school; }
  get castingTime(): CastingTime { return this._castingTime; }
  get range(): SpellRange { return this._range; }
  get duration(): Duration { return this._duration; }
  get components(): SpellComponent { return this._components; }
  get description(): string { return this._description; }
  get effects(): ActionEffect { return this._effects; }
  get areaOfEffect(): SpellAreaOfEffect | undefined { return this._areaOfEffect; }
  get combatProperties(): SpellCombat { return this._combatProperties; }
  get higherLevelEffects(): string | undefined { return this._higherLevelEffects; }
  get ritual(): boolean { return this._ritual; }
  get concentration(): boolean { return this._concentration; }

  // BUSINESS RULES (Pure Logic)

  /**
   * Vérifier si c'est un cantrip (niveau 0)
   */
  isCantrip(): boolean {
    return this._level === 0;
  }

  /**
   * Calculer la portée en cases
   */
  getRangeInCells(): number {
    if (this._range === 'self') return 0;
    if (this._range === 'touch') return 1;
    if (this._range === 'unlimited') return Infinity;
    return this._range as number;
  }

  /**
   * Calculer la durée en tours
   */
  getDurationInTurns(): number {
    if (this._duration === 'instantaneous') return 0;
    if (this._duration === 'concentration') return 10; // Max concentration
    return this._duration as number;
  }

  /**
   * Calculer les dégâts du sort au niveau donné
   */
  calculateDamage(
    castAtLevel: SpellLevel,
    spellcastingModifier: number = 0,
    proficiencyBonus: number = 0
  ): number {
    if (!this._effects.damage) return 0;

    let totalDamage = 0;
    const levelDifference = Math.max(0, castAtLevel - this._level);
    const projectileCount = this.getProjectileCount(castAtLevel);

    this._effects.damage.forEach(damageRoll => {
      // Pour chaque projectile
      for (let projectile = 0; projectile < projectileCount; projectile++) {
        let rollResult = 0;
        for (let i = 0; i < damageRoll.diceCount; i++) {
          rollResult += Math.floor(Math.random() * damageRoll.diceType) + 1;
        }
        totalDamage += rollResult + damageRoll.modifier + spellcastingModifier;
      }
    });

    return Math.max(0, totalDamage);
  }

  /**
   * Obtenir le nombre de projectiles basé sur le niveau de sort
   */
  getProjectileCount(castAtLevel: SpellLevel): number {
    if (!this._combatProperties.projectiles) return 1;

    // Magic Missile : +1 projectile par niveau au-dessus du 1er
    const baseProjectiles = this._combatProperties.projectiles;
    const levelDifference = Math.max(0, castAtLevel - this._level);

    return baseProjectiles + levelDifference;
  }

  /**
   * Vérifier si le sort nécessite un jet d'attaque
   */
  requiresAttackRoll(): boolean {
    return this._combatProperties.requiresAttackRoll !== false;
  }

  /**
   * Vérifier si le sort peut cibler un type spécifique
   */
  canTarget(targetType: 'enemy' | 'ally' | 'self'): boolean {
    if (!this._combatProperties.targetType) return true;

    const allowedTypes = this._combatProperties.targetType;
    return allowedTypes === 'any' || allowedTypes === targetType;
  }

  /**
   * Calculer les soins du sort au niveau donné
   */
  calculateHealing(
    castAtLevel: SpellLevel,
    spellcastingModifier: number = 0
  ): number {
    if (!this._effects.healing) return 0;

    let totalHealing = 0;
    const levelDifference = Math.max(0, castAtLevel - this._level);

    this._effects.healing.forEach(healingRoll => {
      let rollResult = 0;
      for (let i = 0; i < healingRoll.diceCount; i++) {
        rollResult += Math.floor(Math.random() * healingRoll.diceType) + 1;
      }

      const levelBonus = this.calculateLevelBonus(levelDifference);
      totalHealing += rollResult + healingRoll.modifier + spellcastingModifier + levelBonus;
    });

    return Math.max(0, totalHealing);
  }

  /**
   * Vérifier si le sort nécessite des composants matériels coûteux
   */
  hasExpensiveMaterialComponents(): boolean {
    return this._components.material &&
      this._components.costInGP !== undefined &&
      this._components.costInGP > 0;
  }

  /**
   * Créer une action à partir du sort
   */
  toAction(): Action {
    const actionCost = this._castingTime === 'bonus_action' ? 'bonus_action' :
      this._castingTime === 'reaction' ? 'reaction' : 'action';

    return new Action(
      `spell_${this._id}`,
      this._name,
      'spell',
      actionCost,
      this._description,
      {
        range: this.getRangeInCells(),
        requiresTarget: !this._areaOfEffect && this._range !== 'self',
        requiresLineOfSight: this._range !== 'self',
        provokesOpportunityAttack: false
      },
      this._effects
    );
  }

  // MÉTHODES PRIVÉES

  private calculateLevelBonus(levelDifference: number): number {
    // Règle générale : +1d6 de dégâts par niveau supérieur
    if (levelDifference === 0) return 0;

    let bonus = 0;
    for (let i = 0; i < levelDifference; i++) {
      bonus += Math.floor(Math.random() * 6) + 1;
    }
    return bonus;
  }
}

/**
 * SPELL SLOTS - Value Object
 * Gestion des emplacements de sorts
 */
export class SpellSlots {
  private _slots: Record<SpellLevel, number>;
  private _usedSlots: Record<SpellLevel, number>;

  constructor(slots: Partial<Record<SpellLevel, number>> = {}) {
    this._slots = {
      0: Infinity, // Cantrips illimités
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0,
      ...slots
    };

    this._usedSlots = {
      0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0
    };
  }

  // GETTERS
  get availableSlots(): Record<SpellLevel, number> {
    const available: Record<SpellLevel, number> = {} as Record<SpellLevel, number>;
    (Object.keys(this._slots) as unknown as SpellLevel[]).forEach(level => {
      available[level] = this._slots[level] - this._usedSlots[level];
    });
    return available;
  }

  get totalSlots(): Record<SpellLevel, number> { return { ...this._slots }; }
  get usedSlots(): Record<SpellLevel, number> { return { ...this._usedSlots }; }

  // BUSINESS RULES

  /**
   * Vérifier si un emplacement est disponible
   */
  hasSlot(level: SpellLevel): boolean {
    return this.availableSlots[level] > 0;
  }

  /**
   * Utiliser un emplacement de sort
   */
  useSlot(level: SpellLevel): boolean {
    if (!this.hasSlot(level)) return false;

    this._usedSlots[level]++;
    return true;
  }

  /**
   * Récupérer tous les emplacements (repos long)
   */
  recoverAllSlots(): void {
    (Object.keys(this._usedSlots) as unknown as SpellLevel[]).forEach(level => {
      this._usedSlots[level] = 0;
    });
  }

  /**
   * Récupérer certains emplacements (repos court pour certaines classes)
   */
  recoverSlots(slotsToRecover: Partial<Record<SpellLevel, number>>): void {
    (Object.keys(slotsToRecover) as unknown as SpellLevel[]).forEach(level => {
      const toRecover = slotsToRecover[level] || 0;
      this._usedSlots[level] = Math.max(0, this._usedSlots[level] - toRecover);
    });
  }

  /**
   * Obtenir le niveau d'emplacement le plus haut disponible
   */
  getHighestAvailableSlotLevel(): SpellLevel | null {
    for (let level = 9; level >= 1; level--) {
      if (this.hasSlot(level as SpellLevel)) {
        return level as SpellLevel;
      }
    }
    return this.hasSlot(0) ? 0 : null;
  }
}

