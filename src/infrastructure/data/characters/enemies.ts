/**
 * INFRASTRUCTURE - Modèles (templates) pour les ennemis
 * Utilise DomainEnemyTemplate pour compatibilité avec le Domain
 */

import type { DomainEnemyTemplate } from '../../../domain/types/Enemy';

// Convertir en dictionnaire pour accès par ID
export const ENEMY_TEMPLATES: Record<string, DomainEnemyTemplate> = {
    'goblin_scout': {
        id: 'goblin_scout',
        name: 'Gobelin Éclaireur',
        level: 2,
        baseAbilities: { 
            strength: 10, 
            dexterity: 16, 
            constitution: 12, 
            intelligence: 10, 
            wisdom: 13, 
            charisma: 7 
        },
        maxHp: 18,
        armorClass: 13,
        speed: 8,
        challengeRating: 0.5,
        xpReward: 100,
        proficiencyBonus: 2,
        resistances: undefined,
        vulnerabilities: undefined,
        immunities: undefined,
        equipment: {
            weapons: ['shortbow', 'dagger'],
            armor: ['leather_armor']
        },
        specialAbilities: undefined,
        combatModifiers: {
            attackBonus: 0,
            damageBonus: 0
        },
        aiProfile: {
            behavior: 'tactical',
            preferredRange: 'ranged',
            aggroRadius: 12
        },
        lootTable: [{ itemId: 'gold_pouch_small', dropChance: 0.5 }]
    },
    
    'goblin': {
        id: 'goblin',
        name: 'Gobelin',
        level: 1,
        baseAbilities: { 
            strength: 8, 
            dexterity: 14, 
            constitution: 10, 
            intelligence: 10, 
            wisdom: 8, 
            charisma: 8 
        },
        maxHp: 7,
        armorClass: 15,
        speed: 6,
        challengeRating: 0.25,
        xpReward: 50,
        proficiencyBonus: 2,
        resistances: undefined,
        vulnerabilities: undefined,
        immunities: undefined,
        equipment: {
            weapons: ['scimitar','shortbow'],
            armor: ['leather_armor']
        },
        specialAbilities: undefined,
        combatModifiers: {
            attackBonus: 0,
            damageBonus: 0
        },
        aiProfile: {
            behavior: 'defensive',
            preferredRange: 'ranged',
            aggroRadius: 8
        },
        lootTable: [{ itemId: 'gold_pouch_small', dropChance: 0.3 }]
    },
    
    'orc_warrior': {
        id: 'orc_warrior',
        name: 'Guerrier Orc',
        level: 3,
        baseAbilities: { 
            strength: 16, 
            dexterity: 12, 
            constitution: 16, 
            intelligence: 7, 
            wisdom: 11, 
            charisma: 10 
        },
        maxHp: 28,
        armorClass: 14,
        speed: 6,
        challengeRating: 1,
        xpReward: 200,
        proficiencyBonus: 2,
        resistances: undefined,
        vulnerabilities: undefined,
        immunities: undefined,
        equipment: {
            weapons: ['battleaxe', 'handaxe'],
            armor: ['chain_shirt']
        },
        specialAbilities: undefined,
        combatModifiers: {
            attackBonus: 1,
            damageBonus: 2
        },
        aiProfile: {
            behavior: 'aggressive',
            preferredRange: 'melee',
            aggroRadius: 10
        },
        lootTable: [{ itemId: 'gold_pouch_medium', dropChance: 0.4 }]
    },
    
    'skeleton_archer': {
        id: 'skeleton_archer',
        name: 'Archer Squelette',
        level: 2,
        baseAbilities: { 
            strength: 10, 
            dexterity: 14, 
            constitution: 15, 
            intelligence: 6, 
            wisdom: 8, 
            charisma: 5 
        },
        maxHp: 20,
        armorClass: 13,
        speed: 6,
        challengeRating: 0.5,
        xpReward: 100,
        proficiencyBonus: 2,
        resistances: ['piercing'],
        vulnerabilities: ['bludgeoning'],
        immunities: undefined,
        equipment: {
            weapons: ['shortbow', 'shortsword'],
            armor: ['leather_armor']
        },
        specialAbilities: ['undead_fortitude'],
        combatModifiers: {
            attackBonus: 0,
            damageBonus: 0
        },
        aiProfile: {
            behavior: 'defensive',
            preferredRange: 'ranged',
            aggroRadius: 15
        },
        lootTable: [{ itemId: 'bone_fragments', dropChance: 0.8 }]
    }
};

// Export pour compatibilité si besoin
export type EnemyTemplate = DomainEnemyTemplate;