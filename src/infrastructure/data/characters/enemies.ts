/**
 * INFRASTRUCTURE - Modèles (templates) pour les ennemis
 */

// On définit un type pour nos modèles d'ennemis
export interface EnemyTemplate {
    readonly id: string; // "goblin_scout", "orc_berserker"
    readonly name: string;
    readonly level: number;
    readonly baseAbilities: {
        readonly strength: number;
        readonly dexterity: number;
        readonly constitution: number;
        readonly intelligence: number;
        readonly wisdom: number;
        readonly charisma: number;
    };
    readonly maxHp: number;
    readonly armorClass: number;
    readonly speed: number;
    readonly actions: readonly string[]; // IDs des actions/attaques
    readonly lootTable?: ReadonlyArray<{ itemId: string; dropChance: number; }>;
}

export const ENEMY_TEMPLATES: readonly EnemyTemplate[] = [
    {
        id: 'goblin_scout',
        name: 'Gobelin Éclaireur',
        level: 2,
        baseAbilities: { strength: 10, dexterity: 16, constitution: 12, intelligence: 10, wisdom: 13, charisma: 7 },
        maxHp: 18,
        armorClass: 13,
        speed: 8,
        actions: ['shortbow_attack', 'dagger_attack'],
        lootTable: [{ itemId: 'gold_pouch_small', dropChance: 0.5 }]
    },
    {
        id: 'goblin',
        name: 'Gobelin',
        level: 1,
        baseAbilities: { strength: 12, dexterity: 14, constitution: 12, intelligence: 8, wisdom: 10, charisma: 6 },
        maxHp: 15,
        armorClass: 12,
        speed: 6,
        actions: ['scimitar_attack'],
        lootTable: [{ itemId: 'gold_pouch_small', dropChance: 0.3 }]
    }
];
