/**
 * DOMAIN FACTORY - ECS Entity Factory
 * Convertit les données existantes vers l'architecture ECS
 */

import { Character } from '../entities/Character';
import { type CombatEntity, type Position } from '../entities/Combat';
import { type ECSEntity, ECSEntityBuilder } from '../entities/ECS';
import { SpellSlots } from '../entities/Spell';
import type { EnemySpec, ActionsRemaining } from '../types';
import type { IWeaponRepository } from '../../infrastructure/repositories/WeaponRepository';

// Interface temporaire pour la transition - mise à jour selon enemies.ts
interface EnemyTemplate {
  readonly id: string;
  readonly name: string;
  readonly level: number;
  readonly baseAbilities: {
    readonly strength: number;
    readonly dexterity: number;
    readonly constitution: number;
    readonly intelligence: number;
    readonly wisdom: number;
    readonly charisma: number;
  };
  readonly maxHp: number;
  readonly armorClass: number;
  readonly speed: number;
  readonly equipment: {
    readonly weapons: readonly string[];
    readonly armor?: readonly string[];
    readonly items?: readonly string[];
  };
  readonly specialAbilities?: readonly string[];
  readonly combatModifiers?: {
    readonly attackBonus?: number;
    readonly damageBonus?: number;
    readonly resistances?: readonly string[];
    readonly vulnerabilities?: readonly string[];
  };
  readonly aiProfile?: {
    readonly behavior: 'aggressive' | 'defensive' | 'tactical' | 'cowardly';
    readonly preferredRange: 'melee' | 'ranged' | 'mixed';
    readonly aggroRadius?: number;
  };
  readonly lootTable?: ReadonlyArray<{ itemId: string; dropChance: number; }>;
}

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
        knownSpells: character.spells || [],
        preparedSpells: character.preparedSpells || [],
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
    template: EnemyTemplate,
    instanceId: string,
    initiative: number,
    position: Position,
    weaponRepository: IWeaponRepository,
    currentHp?: number
  ): ECSEntity {
    const proficiencyBonus = ECSEntityFactory.calculateProficiencyBonus(template.level);
    
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
        availableActions: [] // TODO: Convertir template.actions vers Action[]
      })
      .withStatus({
        entityType: 'enemy',
        isActive: true,
        isDead: (currentHp || template.maxHp) <= 0,
        conditions: []
      })
      .withWeapons({
        weapons: [], // TODO: Résoudre template.actions vers Weapon[]
        equippedWeaponIds: []
      })
      .withSpells({
        knownSpells: [],
        preparedSpells: [],
        spellSlots: new SpellSlots() // Ennemis de base sans sorts
      })
      .withAI({
        behavior: ECSEntityFactory.inferBehaviorFromTemplate(template),
        preferredRange: ECSEntityFactory.inferRangeFromActions(template.actions),
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

    // TODO: Ajouter WeaponsComponent quand inventory sera traité

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
  private static inferBehaviorFromTemplate(template: EnemyTemplate): 'aggressive' | 'defensive' | 'tactical' | 'cowardly' {
    // Logique simple basée sur le nom/niveau
    if (template.name.toLowerCase().includes('scout')) return 'tactical';
    if (template.name.toLowerCase().includes('berserker')) return 'aggressive';
    if (template.level <= 2) return 'aggressive';
    if (template.level >= 5) return 'tactical';
    return 'aggressive';
  }

  /**
   * Inférer la portée préférée depuis les actions
   */
  private static inferRangeFromActions(actions: readonly string[]): 'melee' | 'ranged' | 'mixed' {
    const hasRanged = actions.some(action => 
      action.includes('bow') || action.includes('crossbow') || action.includes('javelin')
    );
    const hasMelee = actions.some(action => 
      action.includes('sword') || action.includes('dagger') || action.includes('claw')
    );

    if (hasRanged && hasMelee) return 'mixed';
    if (hasRanged) return 'ranged';
    return 'melee';
  }
}