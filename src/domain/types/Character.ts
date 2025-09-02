/**
 * DOMAIN TYPES - Character
 * Types purs du domaine, sans dépendances infrastructure
 */

/**
 * Scores de capacités standard D&D 5e
 */
export interface AbilityScores {
  readonly strength: number;
  readonly dexterity: number;
  readonly constitution: number;
  readonly intelligence: number;
  readonly wisdom: number;
  readonly charisma: number;
}

/**
 * Structure d'inventaire pure (domaine)
 */
export interface InventorySpec {
  readonly equipped: Readonly<Record<string, string>>;
  readonly backpack: ReadonlyArray<{
    readonly itemId: string;
    readonly quantity: number;
  }>;
  // PHASE 1 - Ajout propriété weapons pour compatibilité
  readonly weapons?: ReadonlyArray<string>; // weaponIds équipées
}

/**
 * Position dans le monde de jeu
 */
export interface Position {
  readonly x: number;
  readonly y: number;
}

/**
 * Propriétés nécessaires pour créer un Character (domaine)
 */
export interface CharacterCreationProps {
  readonly id: string;
  readonly name: string;
  readonly level: number;
  readonly xp: number;
  readonly classId: string;
  readonly raceId: string;
  readonly baseStats: AbilityScores;
  readonly inventory: InventorySpec;
  readonly knownSpellIds: readonly string[];
  readonly currentHP: number;
  readonly gold: number;
  readonly position?: Position;
  readonly preparedSpells?: readonly string[];
  readonly usedSpellSlots?: Readonly<Record<number, number>>;
}

/**
 * Données de classe de personnage (interface pure)
 */
export interface ClassSpec {
  readonly id: string;
  readonly name: string;
  readonly hitDie: 6 | 8 | 10 | 12;
  readonly spellcastingAbility?: 'intelligence' | 'wisdom' | 'charisma';
}

/**
 * Source de données ennemi (pure)
 */
export interface EnemySpec {
  readonly id: string;
  readonly name: string;
  readonly templateId: string;
  readonly currentHp: number;
  readonly position?: Position;
}