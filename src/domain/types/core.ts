/**
 * DOMAIN TYPES - Core Types
 * Types fondamentaux partagés dans toute l'application
 */

// === POSITION ET GÉOMÉTRIE ===
export interface Position {
  readonly x: number;
  readonly y: number;
}

export interface GridPosition extends Position {
  readonly z?: number; // Pour une future extension 3D
}

// === STATISTIQUES D&D 5E ===
export interface Stats {
  readonly strength: number;
  readonly dexterity: number;
  readonly constitution: number;
  readonly intelligence: number;
  readonly wisdom: number;
  readonly charisma: number;
}

// === TYPES DE DÉGÂTS ===
export type DamageType = 
  | 'piercing' | 'slashing' | 'bludgeoning'  // Dégâts physiques
  | 'fire' | 'cold' | 'lightning' | 'thunder' // Dégâts élémentaires
  | 'acid' | 'poison' | 'psychic' | 'necrotic' 
  | 'radiant' | 'force';

// === TYPES COMBAT ===
export type AttackType = 'melee' | 'ranged' | 'spell';

export type WeaponCategory = 'simple' | 'martial';

// === RARETÉ ===
export type ItemRarity = 
  | 'Commun' 
  | 'Peu commun' 
  | 'Rare' 
  | 'Très rare' 
  | 'Légendaire' 
  | 'Artefact';

// === TYPES UTILITAIRES ===
export interface Range {
  readonly normal: number;
  readonly max: number;
}

export interface Damage {
  readonly dice: string;    // "1d6", "2d8", etc.
  readonly bonus: number;   // Bonus flat
  readonly type: DamageType;
}