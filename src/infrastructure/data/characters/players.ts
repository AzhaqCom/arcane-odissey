/**
 * INFRASTRUCTURE - Données de base pour les personnages joueurs
 */
import type { PlayerDataSource } from '../types/CharacterData';

export const PLAYERS_DATA: readonly PlayerDataSource[] = [
  {
    id: 'Elarion',
    type: 'player',
    name: 'Elarion',
    raceId: 'high_elf',
    characterClassId: 'mage',
    level: 3,
    xp: 1200,
    baseAbilities: {
      strength: 10,
      dexterity: 14,
      constitution: 14,
      intelligence: 16,
      wisdom: 13,
      charisma: 11
    },
    knownSpellIds: ['firebolt', 'magic_missile', 'fireball', 'shield'],
    inventory: {
      equipped: {
        mainHand: 'dagger',      // Arme de mêlée (portée 1)
        rangedWeapon: 'shortbow' // Arme à distance (portée 16)
      },
      backpack: [
        { itemId: 'healing_potion', quantity: 2 },
        { itemId: 'ration', quantity: 5 },
        { itemId: 'arrow', quantity: 30 } // Munitions pour l'arc
      ]
    },
    savedState: {
      currentHp: 18,
      gold: 100,
      position: { x: 2, y: 3 },
      preparedSpells: ['firebolt', 'magic_missile', 'shield'],
      usedSpellSlots: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 }
    }
  },
  // ... autres personnages joueurs
];
