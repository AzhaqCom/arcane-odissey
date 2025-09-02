/**
 * DOMAIN FACTORY - ECS Entity Factory
 * Convertit les données existantes vers l'architecture ECS
 */

import { Character } from '../entities/Character';
import { type CombatEntity, type Position } from '../entities/Combat';
import { type ECSEntity, ECSEntityBuilder } from '../entities/ECS';
import { SpellSlots } from '../entities/Spell';
import type { EnemySpec, ActionsRemaining } from '../types';
import type { DomainEnemyTemplate } from '../types/Enemy';
import type { IWeaponRepository } from '../../infrastructure/repositories/WeaponRepository';
import type { Weapon } from '../entities/Weapon';
import { Action } from '../entities/Action';
import type { Spell } from '../entities/Spell';

/**
 * Factory ECS pour créer des entités de combat
 */
export class ECSEntityFactory {

  /**
   * Créer une entité ECS à partir d'un Character (joueur/compagnon)
   */
  static createFromCharacter(
    character: Character,
    initiative: number,
    position: Position
  ): ECSEntity {
    const proficiencyBonus = character.getProficiencyBonus();
    
    return new ECSEntityBuilder(character.id)
      .withStats({
        name: character.name,
        level: character.level,
        maxHP: character.maxHP,
        currentHP: character.currentHP,
        baseAC: character.armorClass,
        baseSpeed: character.speed,
        proficiencyBonus: proficiencyBonus,
        abilities: character.baseStats,
        spellcastingAbility: character.spellcastingAbility
      })
      .withPosition({
        position: position,
        initiative: initiative
      })
      .withActions({
        actionsRemaining: {
          movement: character.speed,
          action: true,
          bonusAction: true,
          reaction: true,
        } as ActionsRemaining,
        availableActions: [] // TODO: Charger depuis ClassData/équipement
      })
      .withStatus({
        entityType: character.isPlayer ? 'player' : 'ally',
        isActive: true,
        isDead: character.currentHP <= 0,
        conditions: []
      })
      .withWeapons({
        weapons: [], // TODO: Convertir inventory.weapons
        equippedWeaponIds: []
      })
      .withSpells({
        knownSpells: [],  // TODO: Convertir character.knownSpells (string[]) vers Spell[]
        preparedSpells: [...(character.preparedSpells || [])],
        spellSlots: character.spellSlots
      })
      .withPlayer({
        isMainCharacter: character.isPlayer,
        playerId: character.isPlayer ? character.id : 'companion'
      })
      .build();
  }

  /**
   * Créer une entité ECS à partir d'un template d'ennemi
   */
  static createFromEnemyTemplate(
    template: DomainEnemyTemplate,
    instanceId: string,
    initiative: number,
    position: Position,
    weaponRepository: IWeaponRepository,
    currentHp?: number
  ): ECSEntity {
    const proficiencyBonus = ECSEntityFactory.calculateProficiencyBonus(template.level);
    const weapons = ECSEntityFactory.resolveEnemyWeapons(template, weaponRepository);
    
    return new ECSEntityBuilder(instanceId)
      .withStats({
        name: template.name,
        level: template.level,
        maxHP: template.maxHp,
        currentHP: currentHp || template.maxHp,
        baseAC: template.armorClass,
        baseSpeed: template.speed,
        proficiencyBonus: proficiencyBonus,
        abilities: template.baseAbilities
      })
      .withPosition({
        position: position,
        initiative: initiative
      })
      .withActions({
        actionsRemaining: {
          movement: template.speed,
          action: true,
          bonusAction: true,
          reaction: true,
        } as ActionsRemaining,
        availableActions: ECSEntityFactory.generateActionsFromWeapons(weapons)
      })
      .withStatus({
        entityType: 'enemy',
        isActive: true,
        isDead: (currentHp || template.maxHp) <= 0,
        conditions: []
      })
      .withWeapons({
        weapons: weapons,
        equippedWeaponIds: weapons.map(w => w.id)
      })
      .withSpells({
        knownSpells: [],
        preparedSpells: [],
        spellSlots: new SpellSlots() // Ennemis de base sans sorts
      })
      .withAI({
        behavior: template.aiProfile?.behavior || ECSEntityFactory.inferBehaviorFromTemplate(template),
        preferredRange: template.aiProfile?.preferredRange || ECSEntityFactory.inferRangeFromWeapons(weapons),
        aggroRadius: 10 // Par défaut
      })
      .build();
  }

  /**
   * Créer une entité ECS à partir d'une CombatEntity existante (migration)
   */
  static createFromCombatEntity(combatEntity: CombatEntity): ECSEntity {
    const builder = new ECSEntityBuilder(combatEntity.id)
      .withStats({
        name: combatEntity.name,
        level: combatEntity.level,
        maxHP: combatEntity.maxHP,
        currentHP: combatEntity.currentHP,
        baseAC: combatEntity.baseAC,
        baseSpeed: combatEntity.baseSpeed,
        proficiencyBonus: combatEntity.proficiencyBonus,
        abilities: combatEntity.abilities,
        spellcastingAbility: combatEntity.spellcastingAbility
      })
      .withPosition({
        position: combatEntity.position,
        initiative: combatEntity.initiative
      })
      .withActions({
        actionsRemaining: combatEntity.actionsRemaining,
        availableActions: combatEntity.availableActions
      })
      .withStatus({
        entityType: combatEntity.type,
        isActive: combatEntity.isActive,
        isDead: combatEntity.isDead,
        conditions: combatEntity.conditions,
        concentratingOn: combatEntity.concentratingOn
      })
      .withSpells({
        knownSpells: combatEntity.knownSpells,
        preparedSpells: [], // TODO: Extraire des knownSpells
        spellSlots: combatEntity.spellSlots
      });

    // Ajouter composant spécifique selon le type
    if (combatEntity.type === 'player') {
      builder.withPlayer({
        isMainCharacter: true,
        playerId: combatEntity.id
      });
    } else if (combatEntity.type === 'enemy') {
      builder.withAI({
        behavior: 'aggressive', // Par défaut
        preferredRange: 'mixed',
        aggroRadius: 10
      });
    }

    // Ajouter les armes depuis l'inventaire
    const weapons = combatEntity.inventory?.weapons || [];
    builder.withWeapons({
      weapons: weapons,
      equippedWeapon: weapons.length > 0 ? weapons[0] : null
    });

    return builder.build();
  }

  // ====== MÉTHODES UTILITAIRES ======

  /**
   * Calculer le bonus de maîtrise selon le niveau
   */
  private static calculateProficiencyBonus(level: number): number {
    const bonusMap: Record<number, number> = {
      1: 2, 2: 2, 3: 2, 4: 2,
      5: 3, 6: 3, 7: 3, 8: 3,
      9: 4, 10: 4, 11: 4, 12: 4,
      13: 5, 14: 5, 15: 5, 16: 5,
      17: 6, 18: 6, 19: 6, 20: 6
    };
    return bonusMap[level] || 2;
  }

  /**
   * Inférer le comportement IA depuis un template
   */
  private static inferBehaviorFromTemplate(template: DomainEnemyTemplate): 'aggressive' | 'defensive' | 'tactical' | 'cowardly' {
    // Logique simple basée sur le nom/niveau
    if (template.name.toLowerCase().includes('scout')) return 'tactical';
    if (template.name.toLowerCase().includes('berserker')) return 'aggressive';
    if (template.level <= 2) return 'aggressive';
    if (template.level >= 5) return 'tactical';
    return 'aggressive';
  }

  /**
   * Résoudre les IDs d'armes d'un template vers des objets Weapon
   */
  private static resolveEnemyWeapons(template: DomainEnemyTemplate, weaponRepository: IWeaponRepository): Weapon[] {
    const weapons: Weapon[] = [];
    
    for (const weaponId of template.equipment.weapons) {
      try {
        const weapon = weaponRepository.getWeapon(weaponId);
        if (weapon) {
          weapons.push(weapon);
        }
      } catch (error) {
        console.warn(`Arme non trouvée: ${weaponId} pour ennemi ${template.name}`);
      }
    }
    
    return weapons;
  }

  /**
   * Générer les actions disponibles à partir des armes
   */
  private static generateActionsFromWeapons(weapons: Weapon[]): Action[] {
    const actions: Action[] = [];
    
    // Ajouter actions d'attaque pour chaque arme
    for (const weapon of weapons) {
      actions.push(new Action(
        `attack_${weapon.id}`,
        `Attaquer avec ${weapon.name}`,
        'attack',
        'action',
        `Attaque avec ${weapon.name}`,
        {
          range: weapon.range?.normal || 5,
          requiresTarget: true
        }
      ));
    }
    
    // Ajouter actions universelles
    actions.push(
      new Action('dodge', 'Esquiver', 'dodge', 'action', 'Esquive pour augmenter sa CA'),
      new Action('dash', 'Se précipiter', 'dash', 'action', 'Double sa vitesse de déplacement')
    );
    
    return actions;
  }

  /**
   * Inférer la portée préférée depuis les armes
   */
  private static inferRangeFromWeapons(weapons: Weapon[]): 'melee' | 'ranged' | 'mixed' {
    const hasRanged = weapons.some(weapon => weapon.category === 'ranged');
    const hasMelee = weapons.some(weapon => weapon.category === 'melee');

    if (hasRanged && hasMelee) return 'mixed';
    if (hasRanged) return 'ranged';
    return 'melee';
  }
}