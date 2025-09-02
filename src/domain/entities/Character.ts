/**
 * DOMAIN ENTITY - Character
 * Logique métier pure pour un personnage, sans dépendances infrastructure.
 */
import type { AbilityScores, InventorySpec, Position, CharacterCreationProps, ClassSpec } from '../types/Character';
import { SpellSlots } from './Spell';

// Constantes de progression (déplacées dans le domaine)
const PROFICIENCY_BONUS_PER_LEVEL: Record<number, number> = {
  1: 2, 2: 2, 3: 2, 4: 2,
  5: 3, 6: 3, 7: 3, 8: 3,
  9: 4, 10: 4, 11: 4, 12: 4,
  13: 5, 14: 5, 15: 5, 16: 5,
  17: 6, 18: 6, 19: 6, 20: 6
};

// XP_FOR_LEVEL removed - unused constant

export class Character {
  public readonly id: string;
  public readonly name: string;
  public readonly level: number;
  public readonly xp: number;
  public readonly classId: string;
  public readonly classSpec: ClassSpec;
  public readonly raceId: string;
  public readonly baseStats: AbilityScores;
  public readonly gold: number;
  public readonly position?: Position;
  public readonly inventory: InventorySpec;

  // PHASE 1 - Propriétés manquantes pour la compilation
  public readonly characterClass: string;
  public readonly abilities: AbilityScores;
  
  public readonly currentHP: number;
  public readonly maxHP: number;
  public readonly armorClass: number;
  public readonly speed: number;
  
  public readonly spellSlots: SpellSlots;
  public readonly knownSpells: readonly string[];
  public readonly preparedSpells: readonly string[];

  constructor(props: CharacterCreationProps, classSpec: ClassSpec) {
    this.id = props.id;
    this.name = props.name;
    this.level = props.level;
    this.xp = props.xp;
    this.classId = props.classId;
    this.classSpec = classSpec;
    this.raceId = props.raceId;
    this.baseStats = props.baseStats;
    this.gold = props.gold;
    this.position = props.position;
    this.inventory = props.inventory;
    this.currentHP = props.currentHP;

    // PHASE 1 - Initialisation des propriétés manquantes
    this.characterClass = classSpec.name || classSpec.id || this.classId;
    this.abilities = props.baseStats; // Alias pour compatibilité

    // Calcul des stats dérivées
    this.maxHP = this.calculateMaxHp();
    this.armorClass = 10 + this.getAbilityModifiers().dexterity;
    this.speed = 6;

    // Initialisation de la magie
    this.knownSpells = props.knownSpellIds || [];
    this.preparedSpells = props.preparedSpells || [];
    this.spellSlots = new SpellSlots();
  }

  public getProficiencyBonus(): number {
    return PROFICIENCY_BONUS_PER_LEVEL[this.level] || 0;
  }

  public getAbilityModifiers(): Record<keyof AbilityScores, number> {
    const modifiers = {} as Record<keyof AbilityScores, number>;
    for (const key in this.baseStats) {
      const abilityKey = key as keyof AbilityScores;
      modifiers[abilityKey] = Math.floor((this.baseStats[abilityKey] - 10) / 2);
    }
    return modifiers;
  }

  private calculateMaxHp(): number {
    const constitutionModifier = this.getAbilityModifiers().constitution;
    // Premier niveau: dé de vie max + mod. constit.
    const firstLevelHp = this.classSpec.hitDie + constitutionModifier;
    // Niveaux suivants: moyenne du dé de vie + mod. constit.
    const otherLevelsHp = (this.level - 1) * (Math.floor(this.classSpec.hitDie / 2) + 1 + constitutionModifier);
    return firstLevelHp + otherLevelsHp;
  }
  
  public get isPlayer(): boolean {
      // TODO: A définir plus proprement
      return true;
  }
  
  public get spellcastingAbility() {
      return this.classSpec.spellcastingAbility;
  }
  
  /**
   * PHASE 1 - ACTION 1.2.1: Méthodes immutables pour Character
   * Pattern with...() pour respecter Gemini #1
   */
  withHP(newCurrentHP: number): Character {
    const props: CharacterCreationProps = {
      id: this.id,
      name: this.name,
      level: this.level,
      xp: this.xp,
      classId: this.classId,
      raceId: this.raceId,
      baseStats: this.baseStats,
      gold: this.gold,
      position: this.position,
      inventory: this.inventory,
      currentHP: Math.max(0, Math.min(this.maxHP, newCurrentHP)),
      knownSpellIds: [...this.knownSpells],
      preparedSpells: [...this.preparedSpells]
    };
    return new Character(props, this.classSpec);
  }
  
  withPreparedSpells(newPreparedSpells: readonly string[]): Character {
    const props: CharacterCreationProps = {
      id: this.id,
      name: this.name,
      level: this.level,
      xp: this.xp,
      classId: this.classId,
      raceId: this.raceId,
      baseStats: this.baseStats,
      gold: this.gold,
      position: this.position,
      inventory: this.inventory,
      currentHP: this.currentHP,
      knownSpellIds: [...this.knownSpells],
      preparedSpells: [...newPreparedSpells]
    };
    return new Character(props, this.classSpec);
  }
  
  takeDamage(damage: number): Character {
    return this.withHP(this.currentHP - damage);
  }
  
  heal(healAmount: number): Character {
    return this.withHP(this.currentHP + healAmount);
  }

  /**
   * CONSTITUTION #1 - Logique métier dans le Domaine
   * Méthodes de santé pures déplacées depuis UIStateUseCase
   */
  
  get isAlive(): boolean {
    return this.currentHP > 0;
  }

  get isDead(): boolean {
    return this.currentHP <= 0;
  }

  getHealthPercentage(): number {
    return Math.max(0, Math.min(100, (this.currentHP / this.maxHP) * 100));
  }

  getHealthStatus(): 'healthy' | 'wounded' | 'critical' | 'unconscious' {
    if (this.currentHP <= 0) {
      return 'unconscious';
    }
    
    const percentage = this.getHealthPercentage();
    if (percentage <= 25) {
      return 'critical';
    } else if (percentage <= 50) {
      return 'wounded';
    } else {
      return 'healthy';
    }
  }

  needsUrgentHealing(): boolean {
    const status = this.getHealthStatus();
    return status === 'critical' || status === 'unconscious';
  }

  formatHealthText(): string {
    return `${this.currentHP}/${this.maxHP} HP`;
  }
}
