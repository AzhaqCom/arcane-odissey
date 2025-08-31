/**
 * INFRASTRUCTURE - Spells Data
 * Données de sorts typées pour l'application
 */

import type { SpellData } from './types/SpellData';

/**
 * CONSOLIDATED SPELLS DATA 
 * Single source of truth pour tous les sorts du jeu
 * Consolidé depuis src/data/spells/spells.ts et src/infrastructure/repositories/SpellData.ts  
 */
export const SPELLS_DATA: readonly SpellData[] = [
  {
    id: 'firebolt',
    name: 'Trait de feu',
    level: 0,
    school: 'evocation',
    castingTime: '1 action',
    range: '120 mètres',
    components: {
      verbal: true,
      somatic: true,
      material: false
    },
    duration: 'instantaneous',
    description: 'Un trait de feu jaillit vers une créature ou un objet à portée',
    damage: {
      dice: '1d10',
      bonus: 0,
      type: 'fire'
    },
    combatProperties: {
      requiresAttackRoll: true,
      targetType: 'enemy',
      castableOutOfCombat: true
    },
    classes: ['Magicien', 'Sorcier']
  },
  {
    id: 'magic_missile',
    name: 'Projectile magique',
    level: 1,
    school: 'evocation',
    castingTime: '1 action',
    range: '120 mètres',
    components: {
      verbal: true,
      somatic: true,
      material: false
    },
    duration: 'instantaneous',
    description: 'Vous créez trois fléchettes faites d\'énergie magique brillante. Chacune touche une créature de votre choix, située à portée et dans votre champ de vision. Une fléchette inflige 1d4+1 dégâts de force à la cible. Toutes les fléchettes frappent leur cible en même temps, sachant que vous pouvez toutes les diriger contre une seule et même créature ou les répartir entre plusieurs.',
    damage: {
      dice: '1d4',
      bonus: 1,
      type: 'force'
    },
    combatProperties: {
      projectiles: 3,
      requiresAttackRoll: false,
      targetType: 'enemy',
      castableOutOfCombat: true
    },
    higherLevelEffects: 'Le sort crée une fléchette supplémentaire pour chaque niveau d\'emplacement au-dessus du niveau 1',
    classes: ['Magicien']
  },
  {
    id: 'cure_wounds',
    name: 'Soin des blessures',
    level: 1,
    school: 'evocation',
    castingTime: '1 action',
    range: 'touch',
    components: {
      verbal: true,
      somatic: true,
      material: false
    },
    duration: 'instantaneous',
    description: 'Une créature que vous touchez récupère un nombre de points de vie',
    healing: {
      dice: '1d8',
      bonus: 0
    },
    combatProperties: {
      requiresAttackRoll: false,
      targetType: 'ally',
      castableOutOfCombat: true
    },
    higherLevelEffects: 'Le sort soigne 1d8 points de vie supplémentaires pour chaque niveau d\'emplacement au-dessus du niveau 1',
    classes: ['Clerc', 'Druide', 'Paladin', 'Rôdeur']
  },
  {
    id: 'fireball',
    name: 'Boule de feu',
    level: 3,
    school: 'evocation',
    castingTime: '1 action',
    range: '150 mètres',
    components: {
      verbal: true,
      somatic: true,
      material: true,
      materialDescription: 'une petite boule de guano de chauve-souris et du soufre'
    },
    duration: 'instantaneous',
    description: 'Une traînée brillante jaillit de votre doigt pointé vers un point que vous choisissez à portée',
    damage: {
      dice: '8d6',
      bonus: 0,
      type: 'fire'
    },
    areaOfEffect: {
      shape: 'sphere',
      size: 4,
      originatesFromCaster: false
    },
    combatProperties: {
      requiresAttackRoll: false,
      targetType: 'area',
      castableOutOfCombat: false
    },
    higherLevelEffects: 'Les dégâts du sort augmentent de 1d6 pour chaque niveau d\'emplacement au-dessus du niveau 3',
    classes: ['Magicien', 'Sorcier']
  },
  {
    id: 'healing_word',
    name: 'Mot de guérison',
    level: 1,
    school: 'evocation',
    castingTime: '1 bonus action',
    range: '60 mètres',
    components: {
      verbal: true,
      somatic: false,
      material: false
    },
    duration: 'instantaneous',
    description: 'Une créature de votre choix que vous pouvez voir à portée récupère des points de vie',
    healing: {
      dice: '1d4',
      bonus: 0
    },
    combatProperties: {
      requiresAttackRoll: false,
      targetType: 'ally',
      castableOutOfCombat: true
    },
    higherLevelEffects: 'Le sort soigne 1d4 points de vie supplémentaires pour chaque niveau d\'emplacement au-dessus du niveau 1',
    classes: ['Clerc', 'Druide']
  },
  {
    id: 'shield',
    name: 'Bouclier',
    level: 1,
    school: 'abjuration',
    castingTime: '1 reaction',
    range: 'self',
    components: {
      verbal: true,
      somatic: true,
      material: false
    },
    duration: '1 tour',
    description: 'Une barrière de force magique invisible apparaît et vous protège',
    combatProperties: {
      requiresAttackRoll: false,
      targetType: 'self',
      castableOutOfCombat: false
    },
    classes: ['Magicien', 'Sorcier']
  }
] as const;