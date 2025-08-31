import type { AttackType, DamageType } from '../../types/character';

export interface WeaponProperties {
  light?: boolean;       // Peut être utilisée pour deux armes
  finesse?: boolean;     // Utilise DEX au lieu de STR
  versatile?: string;    // Dégâts à deux mains (ex: "1d10")
  heavy?: boolean;       // Désavantage pour Small creatures
  reach?: boolean;       // Portée 2 au lieu de 1
  thrown?: {             // Peut être lancée
    rangeNormal: number;
    rangeLong: number;
  };
  ammunition?: boolean;  // Nécessite des munitions
  loading?: boolean;     // Une attaque par tour max
  twoHanded?: boolean;   // Nécessite deux mains
  special?: string;      // Règles spéciales
}

export interface WeaponData {
  id: string;
  name: string;
  type: AttackType;
  category: 'simple' | 'martial';
  
  // Statistiques de combat
  damage: {
    dice: string;        // "1d6", "1d8", etc.
    bonus: number;       // Bonus de dégâts de base (généralement 0)
    type: DamageType;
  };
  
  // Portée et ciblage
  range: number;         // Portée en cases (1 pour mêlée, plus pour distance)
  rangeNormal?: number;  // Portée normale pour armes à distance
  rangeLong?: number;    // Portée longue pour armes à distance
  
  // Propriétés spéciales
  properties: WeaponProperties;
  
  // Données pour l'UI et la description
  description: string;
  cost?: {
    value: number;
    currency: 'gold' | 'silver' | 'copper';
  };
  weight?: number;       // En livres
}

// Base de données des armes D&D 5E
export const weaponsData: Record<string, WeaponData> = {
  // === ARMES SIMPLES - MÊLÉE ===
  dagger: {
    id: 'dagger',
    name: 'Dague',
    type: 'melee',
    category: 'simple',
    damage: {
      dice: '1d4',
      bonus: 0,
      type: 'perforant'
    },
    range: 1,
    properties: {
      finesse: true,
      light: true,
      thrown: {
        rangeNormal: 4,
        rangeLong: 12
      }
    },
    description: 'Une arme simple, légère et polyvalente, parfaite pour les roublards.',
    cost: { value: 2, currency: 'gold' },
    weight: 1
  },

  mace: {
    id: 'mace',
    name: 'Masse d\'armes',
    type: 'melee',
    category: 'simple',
    damage: {
      dice: '1d6',
      bonus: 0,
      type: 'contondant'
    },
    range: 1,
    properties: {},
    description: 'Une masse lourde pour écraser les ennemis.',
    cost: { value: 5, currency: 'gold' },
    weight: 4
  },

  quarterstaff: {
    id: 'quarterstaff',
    name: 'Bâton',
    type: 'melee',
    category: 'simple',
    damage: {
      dice: '1d6',
      bonus: 0,
      type: 'contondant'
    },
    range: 1,
    properties: {
      versatile: '1d8'
    },
    description: 'Un bâton simple mais efficace, utilisable à une ou deux mains.',
    cost: { value: 2, currency: 'silver' },
    weight: 4
  },

  wooden_staff: {
    id: 'wooden_staff',
    name: 'Bâton en bois',
    type: 'melee',
    category: 'simple',
    damage: {
      dice: '1d6',
      bonus: 0,
      type: 'contondant'
    },
    range: 1,
    properties: {
      versatile: '1d8'
    },
    description: 'Bâton naturel favorisé par les druides.',
    cost: { value: 2, currency: 'silver' },
    weight: 4
  },

  // === ARMES SIMPLES - DISTANCE ===
  light_crossbow: {
    id: 'light_crossbow',
    name: 'Arbalète légère',
    type: 'ranged',
    category: 'simple',
    damage: {
      dice: '1d8',
      bonus: 0,
      type: 'perforant'
    },
    range: 16,
    rangeNormal: 16,
    rangeLong: 64,
    properties: {
      ammunition: true,
      loading: true,
      twoHanded: true
    },
    description: 'Arbalète facile à manier pour les novices.',
    cost: { value: 25, currency: 'gold' },
    weight: 5
  },

  shortbow: {
    id: 'shortbow',
    name: 'Arc court',
    type: 'ranged',
    category: 'simple',
    damage: {
      dice: '1d6',
      bonus: 0,
      type: 'perforant'
    },
    range: 16,
    rangeNormal: 16,
    rangeLong: 64,
    properties: {
      ammunition: true,
      twoHanded: true
    },
    description: 'Un arc simple et maniable.',
    cost: { value: 25, currency: 'gold' },
    weight: 2
  },

  // === ARMES MARTIALES - MÊLÉE ===
  longsword: {
    id: 'longsword',
    name: 'Épée longue',
    type: 'melee',
    category: 'martial',
    damage: {
      dice: '1d8',
      bonus: 0,
      type: 'tranchant'
    },
    range: 1,
    properties: {
      versatile: '1d10'
    },
    description: 'L\'épée classique du guerrier, équilibrée et polyvalente.',
    cost: { value: 15, currency: 'gold' },
    weight: 3
  },

  shortsword: {
    id: 'shortsword',
    name: 'Épée courte',
    type: 'melee',
    category: 'martial',
    damage: {
      dice: '1d6',
      bonus: 0,
      type: 'perforant'
    },
    range: 1,
    properties: {
      finesse: true,
      light: true
    },
    description: 'Épée rapide et précise, idéale pour les combats agiles.',
    cost: { value: 10, currency: 'gold' },
    weight: 2
  },

  rapier: {
    id: 'rapier',
    name: 'Rapière',
    type: 'melee',
    category: 'martial',
    damage: {
      dice: '1d8',
      bonus: 0,
      type: 'perforant'
    },
    range: 1,
    properties: {
      finesse: true
    },
    description: 'Épée élégante privilégiant la précision à la force brute.',
    cost: { value: 25, currency: 'gold' },
    weight: 2
  },

  scimitar: {
    id: 'scimitar',
    name: 'Cimeterre',
    type: 'melee',
    category: 'martial',
    damage: {
      dice: '1d6',
      bonus: 0,
      type: 'tranchant'
    },
    range: 1,
    properties: {
      finesse: true,
      light: true
    },
    description: 'Lame courbée rapide et tranchante.',
    cost: { value: 25, currency: 'gold' },
    weight: 3
  },

  greataxe: {
    id: 'greataxe',
    name: 'Hache à deux mains',
    type: 'melee',
    category: 'martial',
    damage: {
      dice: '1d12',
      bonus: 0,
      type: 'tranchant'
    },
    range: 1,
    properties: {
      heavy: true,
      twoHanded: true
    },
    description: 'Hache massive dévastatrice pour les guerriers les plus forts.',
    cost: { value: 30, currency: 'gold' },
    weight: 7
  },

  handaxe: {
    id: 'handaxe',
    name: 'Hachette',
    type: 'melee',
    category: 'martial',
    damage: {
      dice: '1d6',
      bonus: 0,
      type: 'tranchant'
    },
    range: 1,
    properties: {
      light: true,
      thrown: {
        rangeNormal: 4,
        rangeLong: 12
      }
    },
    description: 'Petite hache maniable, peut être lancée.',
    cost: { value: 5, currency: 'gold' },
    weight: 2
  },

  // === ARMES MARTIALES - DISTANCE ===
  longbow: {
    id: 'longbow',
    name: 'Arc long',
    type: 'ranged',
    category: 'martial',
    damage: {
      dice: '1d8',
      bonus: 0,
      type: 'perforant'
    },
    range: 30,
    rangeNormal: 30,
    rangeLong: 120,
    properties: {
      ammunition: true,
      heavy: true,
      twoHanded: true
    },
    description: 'Arc puissant à longue portée pour les archers experts.',
    cost: { value: 50, currency: 'gold' },
    weight: 2
  },

  handCrossbow: {
    id: 'handCrossbow',
    name: 'Arbalète de poing',
    type: 'ranged',
    category: 'martial',
    damage: {
      dice: '1d6',
      bonus: 0,
      type: 'perforant'
    },
    range: 6,
    rangeNormal: 6,
    rangeLong: 24,
    properties: {
      ammunition: true,
      light: true,
      loading: true
    },
    description: 'Petite arbalète compacte et discrète.',
    cost: { value: 75, currency: 'gold' },
    weight: 3
  },

  // === ÉQUIPEMENTS ===
  shield: {
    id: 'shield',
    name: 'Écu',
    type: 'melee',
    category: 'simple',
    damage: {
      dice: '1d4',
      bonus: 0,
      type: 'contondant'
    },
    range: 1,
    properties: {
      special: '+2 AC, peut être utilisé pour attaques improvisées'
    },
    description: 'Bouclier défensif qui peut servir d\'arme improvisée.',
    cost: { value: 10, currency: 'gold' },
    weight: 6
  }
};

export const weapons = weaponsData;