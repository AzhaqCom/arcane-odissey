import type { ClassData } from './types/ClassData';

export const CLASSES_DATA: readonly ClassData[] = [
  {
    id: 'mage',
    name: 'Magicien',
    hitDie: 6,
    proficiencies: {
      savingThrows: ['intelligence', 'wisdom'],
      armor: [],
      weapons: ['dagger', 'quarterstaff']
    },
    features: [],
    spellcasting: {
      ability: 'intelligence',
      slotProgression: 'full',
      preparationType: 'book',
      spellListId: 'mage_spells'
    }
  }
];