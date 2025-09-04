/**
 * INFRASTRUCTURE - Modèles (templates) pour les ennemis
 * Utilise DomainEnemyTemplate pour compatibilité avec le Domain
 */

import type { DomainEnemyTemplate } from '../../../domain/types/Enemy';

// Convertir en dictionnaire pour accès par ID
export const ENEMY_TEMPLATES: Record<string, DomainEnemyTemplate> = {

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
        armorClass: 1,
        speed: 6,
        challengeRating: 0.25,
        xpReward: 50,
        proficiencyBonus: 2,
        resistances: undefined,
        vulnerabilities: undefined,
        immunities: undefined,
        equipment: {
            weapons: ['scimitar', 'shortbow'],
            armor: ['leather_armor']
        },
        specialAbilities: undefined,
        combatModifiers: {
            attackBonus: 0,
            damageBonus: 0
        },
        aiProfile: {
            aggression: 40,
            intelligence: 60,
            courage: 20,
            discipline: 30,
            teamwork: 70,
            combatStyle: {
                preferredRange: 'medium',
                mobilityPreference: 'flanking',
                targetPriority: 'weakest'
            },
            thresholds: {
                fleeHealth: 30,
                rageHealth: 0,
                panicAlliesDown: 2
            },
            contextModifiers: {
                outnumberedResponse: 'flee',
                winningResponse: 'capture',
                allyDownResponse: 'retreat'
            }
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
            aggression: 85,
            intelligence: 40,
            courage: 80,
            discipline: 30,
            teamwork: 50,
            combatStyle: {
                preferredRange: 'close',
                mobilityPreference: 'mobile',
                targetPriority: 'closest'
            },
            thresholds: {
                fleeHealth: 15,
                rageHealth: 25,
                panicAlliesDown: 3
            },
            contextModifiers: {
                outnumberedResponse: 'defensive',
                winningResponse: 'finish',
                allyDownResponse: 'revenge'
            }
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
            aggression: 35,
            intelligence: 50,
            courage: 60,
            discipline: 80,
            teamwork: 40,
            combatStyle: {
                preferredRange: 'far',
                mobilityPreference: 'static',
                targetPriority: 'dangerous'
            },
            thresholds: {
                fleeHealth: 20,
                rageHealth: 0,
                panicAlliesDown: 1
            },
            contextModifiers: {
                outnumberedResponse: 'flee',
                winningResponse: 'capture',
                allyDownResponse: 'retreat'
            }
        },
        lootTable: [{ itemId: 'bone_fragments', dropChance: 0.8 }]
    }
};

// Export pour compatibilité si besoin
export type EnemyTemplate = DomainEnemyTemplate;