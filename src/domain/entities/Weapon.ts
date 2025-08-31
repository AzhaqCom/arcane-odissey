/**
 * DOMAIN ENTITY - Weapon
 * Pure business logic pour armes D&D 5E
 */

import { Action, type DamageRoll, type DamageType, type AbilityScore } from './Action';

export type WeaponCategory = 'melee' | 'ranged';
export type WeaponProperty = 
  | 'ammunition' | 'finesse' | 'heavy' | 'light' | 'loading' 
  | 'reach' | 'special' | 'thrown' | 'two-handed' | 'versatile';

export type WeaponRarity = 'Commun' | 'Peu commun' | 'Rare' | 'Très rare' | 'Légendaire' | 'Artefact';

export interface WeaponRange {
  readonly normal: number;
  readonly max: number;
}

export interface WeaponDamage {
  readonly dice: string; // "1d8", "2d6", etc.
  readonly bonus: number;
  readonly type: AbilityScore;
}

/**
 * WEAPON - Domain Entity
 * Représente une arme avec toutes ses propriétés D&D 5E
 */
export class Weapon {
  private readonly _id: string;
  private readonly _name: string;
  private readonly _category: WeaponCategory;
  private readonly _damage: WeaponDamage;
  private readonly _damageType: DamageType;
  private readonly _properties: WeaponProperty[];
  private readonly _range: WeaponRange | null;
  private readonly _stat: AbilityScore;
  private readonly _description: string;
  private readonly _rarity: WeaponRarity;
  private readonly _weight: number;

  constructor(
    id: string,
    name: string,
    category: WeaponCategory,
    damage: WeaponDamage,
    damageType: DamageType,
    properties: WeaponProperty[],
    stat: AbilityScore,
    description: string,
    rarity: WeaponRarity = 'Commun',
    weight: number = 1,
    range: WeaponRange | null = null
  ) {
    this._id = id;
    this._name = name;
    this._category = category;
    this._damage = damage;
    this._damageType = damageType;
    this._properties = properties;
    this._range = range;
    this._stat = stat;
    this._description = description;
    this._rarity = rarity;
    this._weight = weight;
  }

  // GETTERS (Pure)
  get id(): string { return this._id; }
  get name(): string { return this._name; }
  get category(): WeaponCategory { return this._category; }
  get damage(): WeaponDamage { return this._damage; }
  get damageType(): DamageType { return this._damageType; }
  get properties(): readonly WeaponProperty[] { return this._properties; }
  get range(): WeaponRange | null { return this._range; }
  get stat(): AbilityScore { return this._stat; }
  get description(): string { return this._description; }
  get rarity(): WeaponRarity { return this._rarity; }
  get weight(): number { return this._weight; }

  // BUSINESS RULES (Pure Logic)

  /**
   * Convertir les dégâts de l'arme vers DamageRoll
   */
  toDamageRoll(): DamageRoll {
    const [diceCount, diceType] = this.parseDice(this._damage.dice);
    
    return {
      diceCount,
      diceType,
      modifier: this._damage.bonus,
      damageType: this._damageType
    };
  }

  /**
   * Créer une action d'attaque avec cette arme
   */
  createAttackAction(): Action {
    const range = this.getAttackRange();
    
    return new Action(
      `attack_${this._id}`,
      `Attaque ${this._name}`,
      'attack',
      'action',
      `Attaque avec ${this._name} - ${this._description}`,
      {
        range,
        requiresTarget: true,
        requiresLineOfSight: true,
        abilityScore: this._stat,
        provokesOpportunityAttack: false
      },
      {
        damage: [this.toDamageRoll()]
      }
    );
  }

  /**
   * Vérifier si l'arme a une propriété spécifique
   */
  hasProperty(property: WeaponProperty): boolean {
    return this._properties.includes(property);
  }

  /**
   * Vérifier si l'arme peut être utilisée à distance
   */
  isRanged(): boolean {
    return this._category === 'ranged' || this.hasProperty('thrown');
  }

  /**
   * Obtenir la portée d'attaque de l'arme
   */
  getAttackRange(): number {
    if (this._range) {
      return this._range.normal;
    }
    
    // Armes de mêlée
    if (this.hasProperty('reach')) return 2;
    return 1; // Portée de mêlée normale
  }

  /**
   * Calculer les dégâts avec modificateurs
   */
  calculateDamage(abilityModifier: number = 0, proficiencyBonus: number = 0): number {
    const [diceCount, diceType] = this.parseDice(this._damage.dice);
    
    let totalDamage = 0;
    
    // Lancer les dés
    for (let i = 0; i < diceCount; i++) {
      totalDamage += Math.floor(Math.random() * diceType) + 1;
    }
    
    // Ajouter les bonus
    totalDamage += this._damage.bonus + abilityModifier;
    
    return Math.max(1, totalDamage);
  }

  /**
   * Obtenir l'affichage des dégâts pour l'UI
   */
  getDamageDisplay(): string {
    const bonus = this._damage.bonus > 0 ? `+${this._damage.bonus}` : '';
    return `${this._damage.dice}${bonus}`;
  }

  /**
   * Obtenir la description complète pour l'UI
   */
  getUIDescription(): string {
    const damageDisplay = this.getDamageDisplay();
    const rangeText = this._range ? ` (${this._range.normal}/${this._range.max}m)` : '';
    return `${damageDisplay}${rangeText}`;
  }

  // MÉTHODES PRIVÉES

  private parseDice(diceString: string): [number, number] {
    const match = diceString.match(/(\d+)d(\d+)/);
    if (!match) {
      console.warn(`Invalid dice format: ${diceString}`);
      return [1, 4]; // Valeur par défaut
    }
    
    return [parseInt(match[1]), parseInt(match[2])];
  }
}

