/**
 * DOMAIN - Factory
 * Responsable de la création des entités de combat (CombatEntity)
 * à partir des entités de domaine Character.
 */
import { type CombatEntity, type Position } from '../entities/Combat';
import { Character } from '../entities/Character';
import { SpellSlots } from '../entities/Spell';
import type { EnemySpec, ActionsRemaining } from '../types';

// Constantes de progression (déplacées dans le domaine)
const PROFICIENCY_BONUS_PER_LEVEL: Record<number, number> = {
  1: 2, 2: 2, 3: 2, 4: 2,
  5: 3, 6: 3, 7: 3, 8: 3,
  9: 4, 10: 4, 11: 4, 12: 4,
  13: 5, 14: 5, 15: 5, 16: 5,
  17: 6, 18: 6, 19: 6, 20: 6
};

export class CombatantFactory {

  /**
   * Crée une entité de combat à partir d'une entité Character (joueur ou compagnon).
   */
  public static createFromCharacter(
    character: Character,
    initiative: number,
    position: Position
  ): CombatEntity {
    
    const proficiencyBonus = character.getProficiencyBonus();
    const abilityModifiers = character.getAbilityModifiers();

    return {
      id: character.id,
      name: character.name,
      type: character.isPlayer ? 'player' : 'ally',
      maxHP: character.maxHP,
      baseAC: character.armorClass,
      baseSpeed: character.speed,
      level: character.level,
      proficiencyBonus: proficiencyBonus,
      abilities: character.baseStats,
      spellcastingAbility: character.spellcastingAbility,
      
      currentHP: character.currentHP,
      position: position,
      initiative: initiative,
      actionsRemaining: {
        movement: character.speed,
        action: true,
        bonusAction: true,
        reaction: true,
      } as ActionsRemaining,
      spellSlots: character.spellSlots,
      availableActions: [], // TODO: Charger depuis la ClassData/équipement
      knownSpells: [], // TODO: Charger depuis SpellData
      inventory: character.inventory, // ⚠️ IMPORTANT: Copier l'inventory du Character vers CombatEntity
      
      isActive: true,
      isDead: character.currentHP <= 0,
      conditions: [],
    };
  }

  /**
   * Crée une entité de combat pour un ennemi.
   * Utilise les données d'ennemi pures du domaine.
   */
  public static createFromEnemySpec(
    enemySpec: EnemySpec,
    baseStats: import('../types').AbilityScores,
    maxHp: number,
    armorClass: number,
    speed: number,
    level: number,
    initiative: number,
    position: Position
  ): CombatEntity {
    
    const proficiencyBonus = PROFICIENCY_BONUS_PER_LEVEL[level] || 2;

    return {
      id: enemySpec.id,
      name: enemySpec.name,
      type: 'enemy',
      maxHP: maxHp,
      baseAC: armorClass,
      baseSpeed: speed,
      level: level,
      proficiencyBonus: proficiencyBonus,
      abilities: baseStats,
      
      currentHP: enemySpec.currentHp,
      position: position,
      initiative: initiative,
      actionsRemaining: {
        movement: speed,
        action: true,
        bonusAction: true,
        reaction: true,
      } as ActionsRemaining,
      spellSlots: new SpellSlots(),
      availableActions: [],
      knownSpells: [],
      
      isActive: true,
      isDead: enemySpec.currentHp <= 0,
      conditions: [],
    };
  }
}