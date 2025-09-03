/**
 * APPLICATION LAYER - Character Mapper
 * Conversion entre les types infrastructure et domaine
 */

import { Character } from '../../domain/entities/Character';
import type { 
  CharacterCreationProps, 
  ClassSpec, 
  InventorySpec, 
  Stats
  // Position - sera utilisé dans futures implémentations
} from '../../domain/types';
import type { 
  PlayerDataSource, 
  InventoryDataSource,
  Stats as InfraStats 
} from '../../infrastructure/data/types/CharacterData';
import type { ClassData } from '../../infrastructure/data/types/ClassData';

/**
 * Mapper pour convertir les données infrastructure vers domaine
 */
export class CharacterMapper {

  /**
   * Convertit PlayerDataSource (infrastructure) vers CharacterCreationProps (domaine)
   */
  static playerDataSourceToCreationProps(
    dataSource: PlayerDataSource
  ): CharacterCreationProps {
    return {
      id: dataSource.id,
      name: dataSource.name,
      level: dataSource.level,
      xp: dataSource.xp,
      classId: dataSource.characterClassId,
      raceId: dataSource.raceId,
      baseStats: this.mapStats(dataSource.baseAbilities),
      inventory: this.mapInventory(dataSource.inventory),
      knownSpellIds: dataSource.knownSpellIds,
      currentHP: dataSource.savedState.currentHp,
      gold: dataSource.savedState.gold,
      position: dataSource.savedState.position ? {
        x: dataSource.savedState.position.x,
        y: dataSource.savedState.position.y
      } : undefined,
      preparedSpells: dataSource.savedState.preparedSpells,
      usedSpellSlots: dataSource.savedState.usedSpellSlots,
    };
  }

  /**
   * Convertit ClassData (infrastructure) vers ClassSpec (domaine)
   */
  static classDataToSpec(classData: ClassData): ClassSpec {
    return {
      id: classData.id,
      name: classData.name,
      hitDie: classData.hitDie,
      spellcastingAbility: classData.spellcasting?.ability,
    };
  }

  /**
   * Crée une entité Character à partir des données infrastructure
   */
  static createCharacterFromInfrastructure(
    dataSource: PlayerDataSource,
    classData: ClassData
  ): Character {
    const creationProps = this.playerDataSourceToCreationProps(dataSource);
    const classSpec = this.classDataToSpec(classData);
    
    return new Character(creationProps, classSpec);
  }

  /**
   * Conversion bidirectionnelle - Character vers structure de sauvegarde
   */
  static characterToSavedState(character: Character): PlayerDataSource['savedState'] {
    return {
      currentHp: character.currentHP,
      gold: character.gold,
      position: character.position,
      preparedSpells: character.preparedSpells,
      usedSpellSlots: undefined, // TODO: extraire depuis character.spellSlots
    };
  }

  // === MÉTHODES PRIVÉES ===

  private static mapStats(infra: InfraStats): Stats {
    return {
      strength: infra.strength,
      dexterity: infra.dexterity,
      constitution: infra.constitution,
      intelligence: infra.intelligence,
      wisdom: infra.wisdom,
      charisma: infra.charisma,
    };
  }

  private static mapInventory(infra: InventoryDataSource): InventorySpec {
    return {
      equipped: { ...infra.equipped },
      backpack: [...infra.backpack],
    };
  }
}