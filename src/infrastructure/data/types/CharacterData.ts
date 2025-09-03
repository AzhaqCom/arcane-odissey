/**
 * INFRASTRUCTURE - Character Data Types
 * Définit la structure des données persistantes pour tous les types de personnages.
 * Sépare clairement les données de base de l'état de session.
 */

// === TYPES DE BASE PARTAGÉS ===

export type Stats = {
  readonly strength: number;
  readonly dexterity: number;
  readonly constitution: number;
  readonly intelligence: number;
  readonly wisdom: number;
  readonly charisma: number;
};

export interface InventoryDataSource {
  readonly equipped: Readonly<Record<string, string>>; // ex: { mainHand: 'longsword_id', armor: 'plate_id' }
  readonly backpack: ReadonlyArray<{
    readonly itemId: string;
    readonly quantity: number;
  }>;
}

export interface BaseDataSource {
  readonly id: string;
  readonly name: string;
}

// === DATASOURCE PAR TYPE DE PERSONNAGE ===

export interface PlayerDataSource extends BaseDataSource {
  readonly type: 'player';
  readonly characterClassId: string;
  readonly raceId: string;
  readonly level: number;
  readonly xp: number;
  readonly baseAbilities: Stats;
  readonly knownSpellIds: readonly string[];
  readonly inventory: InventoryDataSource;

  readonly savedState: {
    readonly currentHp: number;
    readonly gold: number;
    readonly position?: { readonly x: number; readonly y: number };
    readonly preparedSpells?: readonly string[];
    readonly usedSpellSlots?: Readonly<Record<number, number>>;
  };
}

export interface CompanionDataSource extends BaseDataSource {
  readonly type: 'companion';
  readonly masterId: string;
  // Un compagnon peut avoir une structure similaire à un joueur ou plus simple
  // Pour l'instant, on le garde simple.
  readonly level: number;
  readonly baseAbilities: Stats;
  readonly savedState: {
    readonly currentHp: number;
    readonly position?: { readonly x: number; readonly y: number };
  };
}

export interface EnemyDataSource extends BaseDataSource {
  readonly type: 'enemy';
  readonly templateId: string;
  readonly savedState: {
    readonly currentHp: number;
    readonly position?: { readonly x: number; readonly y: number };
  };
  readonly lootOverride?: ReadonlyArray<{
    readonly itemId: string;
    readonly dropChance: number;
  }>;
}

/**
 * Type union pour représenter n'importe quel personnage dans le jeu.
 * Le champ 'type' permet de savoir à quelle interface on a affaire.
 */
export type AnyCharacterDataSource = PlayerDataSource | CompanionDataSource | EnemyDataSource;