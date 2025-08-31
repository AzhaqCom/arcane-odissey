/**
 * INFRASTRUCTURE - Données de base pour les compagnons
 */
import type { CompanionDataSource } from '../types/CharacterData';

export const COMPANIONS_DATA: readonly CompanionDataSource[] = [
  // Exemple de compagnon
  {
    id: 'Ser_Kael',
    type: 'companion',
    name: 'Ser Kael',
    masterId: 'Elarion', // Appartient à Elarion
    level: 3,
    baseAbilities: {
      strength: 16,
      dexterity: 12,
      constitution: 15,
      intelligence: 8,
      wisdom: 10,
      charisma: 14
    },
    savedState: {
      currentHp: 25,
      position: { x: 3, y: 4 }
    }
  }
];
