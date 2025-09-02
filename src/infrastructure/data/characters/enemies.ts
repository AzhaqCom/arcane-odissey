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
    readonly equipment: {
        readonly weapons: readonly string[]; // IDs des armes depuis WEAPONS_DATA
        readonly armor?: readonly string[];  // IDs des armures (optionnel)
        readonly items?: readonly string[];  // Autres équipements (optionnel)
    };
    readonly specialAbilities?: readonly string[]; // Capacités uniques (souffle dragon, etc.)
    readonly combatModifiers?: {
        readonly attackBonus?: number;  // Bonus d'attaque spécifique
        readonly damageBonus?: number;  // Bonus de dégâts spécifique
        readonly resistances?: readonly string[]; // Résistances aux types de dégâts
        readonly vulnerabilities?: readonly string[]; // Vulnérabilités
    };
    readonly aiProfile?: {
        readonly behavior: 'aggressive' | 'defensive' | 'tactical' | 'cowardly';
        readonly preferredRange: 'melee' | 'ranged' | 'mixed';
        readonly aggroRadius?: number;
    };
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
        equipment: {
            weapons: ['shortbow', 'dagger'], // Référence vers WEAPONS_DATA
            armor: ['leather_armor']
        },
        aiProfile: {
            behavior: 'tactical',        // Éclaireur = tactique
            preferredRange: 'ranged',    // Préfère l'arc
            aggroRadius: 12
        },
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
        equipment: {
            weapons: ['scimitar'],       // Référence vers WEAPONS_DATA
            armor: ['leather_armor']
        },
        aiProfile: {
            behavior: 'aggressive',      // Goblin de base = agressif
            preferredRange: 'melee',     // Combat rapproché
            aggroRadius: 8
        },
        lootTable: [{ itemId: 'gold_pouch_small', dropChance: 0.3 }]
    },
    // Ajout de quelques ennemis supplémentaires pour la diversité
    {
        id: 'orc_warrior',
        name: 'Guerrier Orc',
        level: 3,
        baseAbilities: { strength: 16, dexterity: 12, constitution: 16, intelligence: 7, wisdom: 11, charisma: 10 },
        maxHp: 28,
        armorClass: 14,
        speed: 6,
        equipment: {
            weapons: ['battleaxe', 'handaxe'], // Hybride mêlée/jet
            armor: ['chain_shirt']
        },
        combatModifiers: {
            attackBonus: 1,          // Guerrier expérimenté
            damageBonus: 2
        },
        aiProfile: {
            behavior: 'aggressive',
            preferredRange: 'melee',
            aggroRadius: 10
        },
        lootTable: [{ itemId: 'gold_pouch_medium', dropChance: 0.4 }]
    },
    {
        id: 'skeleton_archer',
        name: 'Archer Squelette',
        level: 2,
        baseAbilities: { strength: 10, dexterity: 14, constitution: 15, intelligence: 6, wisdom: 8, charisma: 5 },
        maxHp: 20,
        armorClass: 13,
        speed: 6,
        equipment: {
            weapons: ['shortbow', 'shortsword'],
            armor: ['leather_armor']
        },
        combatModifiers: {
            resistances: ['piercing'], // Résistance aux flèches
            vulnerabilities: ['bludgeoning'] // Vulnérable aux masses
        },
        aiProfile: {
            behavior: 'defensive',   // Reste à distance
            preferredRange: 'ranged',
            aggroRadius: 15
        },
        specialAbilities: ['undead_fortitude'], // Ne tombe pas facilement
        lootTable: [{ itemId: 'bone_fragments', dropChance: 0.8 }]
    }
];
