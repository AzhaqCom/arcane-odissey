// Temporary type until classDefinitions is properly created
export type ClassKey = 'fighter' | 'wizard' | 'rogue' | 'cleric' | 'ranger' | 'barbarian' | 'bard' | 'druid' | 'monk' | 'paladin' | 'sorcerer' | 'warlock';
export type AttackType = 'melee' | 'ranged';
export type DamageType = 'tranchant' | 'perforant' | 'contondant' | 'feu' | 'force';
export type SpellcastingType = 'prepared' | 'known';


export interface Stats {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
}
export const STATS = {
    strength: 'strength',
    dexterity: 'dexterity',
    constitution: 'constitution',
    intelligence: 'intelligence',
    wisdom: 'wisdom',
    charisma: 'charisma',
} as const;
export type StatType = keyof typeof STATS;

export interface Attack {
    name: string;
    type: AttackType;
    attackBonus: number;
    targets: number;
    range: number;
    description: string;
    damageDice: string;
    damageBonus: number;
    damageType: DamageType;
    aiWeight: number; // Poids de l'attaque pour l'IA
}

export interface SpellSlot {
    max: number;
    used: number;
    available: number;
}

export interface FullSpellcasting {
    cantrips: string[];
    knownSpells: string[];
    preparedSpells: string[];
    ritualCasting: boolean;

}
export interface SimpleSpellcasting {
    knownSpells: string[];
    ability?: StatType;
    spellSlots?: Record<string, SpellSlot>;
}
export interface AIModifier {
    [key: string]: number;
}

export interface AIModifiers {
    [key: string]: AIModifier;
}

export interface BaseCharacter {
    name: string;
    familyName: string;
    level: number;
    currentXP: number,
    race: string;
    class: ClassKey;
    image?: string;
    historic?: string;
    maxHP: number;
    currentHP: number;
    ac: number;
    movement: number;
    proficiencyBonus: number;
    gold?: number;
    stats: Stats;
    weapons?: string[];
    inventory: string[];
}

export interface Proficiencies {
    skills: string[];
}

export interface Companion extends BaseCharacter {
    aiPriority: string[];
    aiModifiers: AIModifiers;
    spellcasting: SimpleSpellcasting | null;
}
export interface Player extends BaseCharacter {
    proficiencies: Proficiencies
    weaponProficiencies: string[];
    spellcasting: FullSpellcasting | null;
}

export interface Enemy  {
    name: string;
    maxHP: number;
    currentHP: number;
    ac: number;
    image?: string;
    movement: number;
    stats: Stats;
    challengeRating: number;
    xp: number;
    aiPriority: string[];
    aiModifiers: AIModifiers;
    spellcasting: SimpleSpellcasting | null;
    attacks: Attack[];
    resistances?: DamageType[];
    immunities?: DamageType[];
    vulnerabilities?: DamageType[];
}
// Type pour la collection de compagnons
export type CompanionDatabase = Record<string, Companion>;
// Utilitaire pour la création de compagnon avec ID
export interface CompanionWithId extends Companion {
    id: string;
}
// Type pour la collection de joueurs
export type PlayerDatabase = Record<string, Player>;

// Type pour la collection d'ennemis
export type EnemyDatabase = Record<string, Enemy>;

// Utilitaire pour la création d'ennemi avec ID
export interface EnemyWithId extends Enemy {
    id: string;
}
