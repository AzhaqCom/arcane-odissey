/**
 * INFRASTRUCTURE - Weapons Data
 * Données d'armes typées pour l'application
 */

import type { WeaponData } from './types/WeaponData';

export const WEAPONS_DATA: readonly WeaponData[] = [
  {
    id: 'dagger',
    name: 'Dague',
    category: 'melee',
    damage: { dice: '1d4', bonus: 0, type: 'dexterity' },
    damageType: 'piercing',
    properties: ['finesse', 'light', 'thrown'],
    range: { normal: 4, max: 12 }, // Pour lancer
    stat: 'dexterity',
    description: 'Une lame courte et acérée, facile à dissimuler',
    rarity: 'Commun',
    weight: 1
  },
  {
    id: 'shortsword',
    name: 'Épée courte',
    category: 'melee',
    damage: { dice: '1d6', bonus: 0, type: 'dexterity' },
    damageType: 'piercing',
    properties: ['finesse', 'light'],
    stat: 'dexterity',
    description: 'Une épée légère et maniable, parfaite pour le combat rapide',
    rarity: 'Commun',
    weight: 2
  },
  {
    id: 'shortbow',
    name: 'Arc court',
    category: 'ranged',
    damage: { dice: '1d6', bonus: 0, type: 'dexterity' },
    damageType: 'piercing',
    properties: ['ammunition', 'two-handed'],
    range: { normal: 16, max: 64 },
    stat: 'dexterity',
    description: 'Un arc léger et maniable pour les attaques à distance',
    rarity: 'Commun',
    weight: 2
  },
  {
    id: 'longbow',
    name: 'Arc long',
    category: 'ranged',
    damage: { dice: '1d8', bonus: 0, type: 'dexterity' },
    damageType: 'piercing',
    properties: ['ammunition', 'heavy', 'two-handed'],
    range: { normal: 30, max: 120 },
    stat: 'dexterity',
    description: 'Un arc puissant pour les attaques à distance',
    rarity: 'Commun',
    weight: 2
  },
  {
    id: 'greatsword',
    name: 'Épée à deux mains',
    category: 'melee',
    damage: { dice: '2d6', bonus: 0, type: 'strength' },
    damageType: 'slashing',
    properties: ['heavy', 'two-handed'],
    stat: 'strength',
    description: 'Une massive épée à deux mains qui frappe avec une force dévastatrice',
    rarity: 'Commun',
    weight: 6
  },
  {
    id: 'quarterstaff',
    name: 'Bâton',
    category: 'melee',
    damage: { dice: '1d6', bonus: 0, type: 'strength' },
    damageType: 'bludgeoning',
    properties: ['versatile'],
    stat: 'strength',
    description: 'Un bâton de bois solide, polyvalent au combat',
    rarity: 'Commun',
    weight: 4
  },
  {
    id: 'arccheat',
    name: 'Arc Du MJ',
    category: 'ranged',
    damage: { dice: '4d10', bonus: 50, type: 'intelligence' },
    damageType: 'piercing',
    properties: ['ammunition', 'heavy', 'two-handed'],
    range: { normal: 30, max: 120 },
    stat: 'intelligence',
    description: 'Un arc d\'une grande précision, fabriqué à partir du bois d\'un arbre ancien.',
    rarity: 'Légendaire',
    weight: 3
  },
  {
    id: 'scimitar',
    name: 'Cimeterre',
    category: 'melee',
    damage: { dice: '1d6', bonus: 0, type: 'dexterity' },
    damageType: 'slashing',
    properties: ['finesse', 'light'],
    stat: 'dexterity',
    description: 'Une épée courbée et élégante, idéale pour les combats agiles',
    rarity: 'Commun',
    weight: 3
  },
  {
    id: 'battleaxe',
    name: 'Hache de guerre',
    category: 'melee',
    damage: { dice: '1d8', bonus: 0, type: 'strength' },
    damageType: 'slashing',
    properties: ['versatile'],
    stat: 'strength',
    description: 'Une hache lourde à une main, dévastatrice au combat',
    rarity: 'Commun',
    weight: 4
  },
  {
    id: 'handaxe',
    name: 'Hachette',
    category: 'melee',
    damage: { dice: '1d6', bonus: 0, type: 'strength' },
    damageType: 'slashing',
    properties: ['light', 'thrown'],
    range: { normal: 4, max: 12 }, // Pour lancer
    stat: 'strength',
    description: 'Petite hache légère, peut être lancée ou utilisée au corps à corps',
    rarity: 'Commun',
    weight: 2
  }
] as const;