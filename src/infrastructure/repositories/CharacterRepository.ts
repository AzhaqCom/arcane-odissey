/**
 * INFRASTRUCTURE - Character Repository
 * Repository pour l'accès aux données de personnages.
 * Comprend et utilise les nouvelles structures de DataSource.
 */

import { Character } from '../../domain/entities/Character';
import { GameDataStore } from '../stores/GameDataStore';
import { SaveGameStore } from '../stores/SaveGameStore';
import { logger } from '../services/Logger';
import { CharacterMapper, EnemyMapper } from '../../application/mappers';
import type { 
  AnyCharacterDataSource, 
  PlayerDataSource,
  EnemyDataSource,
  CompanionDataSource
} from '../data/types/CharacterData';
import type { ICharacterRepository } from '../../domain/repositories/ICharacterRepository';
import type { 
  DomainEnemyDataSource, 
  DomainEnemyTemplate 
} from '../../domain/types';
import type { EnemyTemplate } from '../data/characters/enemies';
import type { ClassData } from '../data/types/ClassData';

// Les mocks sont maintenant gérés directement dans les méthodes privées


export class CharacterRepository implements ICharacterRepository {
  
  private readonly gameDataStore: GameDataStore;
  private readonly saveGameStore: SaveGameStore;

  constructor(gameDataStore: GameDataStore, saveGameStore: SaveGameStore) {
    this.gameDataStore = gameDataStore;
    this.saveGameStore = saveGameStore;
  }
  
  public async getById(id: string): Promise<Character | null> {
    const source = this.gameDataStore.getCharacterDataSource(id);
    if (!source) {
      logger.warn('CHARACTER_REPO', `Character data source not found: ${id}`);
      return null;
    }

    const savedState = this.saveGameStore.loadTemp(`character_state_${id}`);
    const finalSource = savedState ? { ...source, savedState: { ...source.savedState, ...savedState } } : source;
    
    return this.convertDataSourceToEntity(finalSource);
  }

  public async getAll(): Promise<Character[]> { 
    const allSources = this.gameDataStore.getAllCharacterDataSources();
    return allSources.map(source => this.convertDataSourceToEntity(source));
  }
  public async save(character: Character): Promise<void> { 
    const stateToSave = CharacterMapper.characterToSavedState(character);
    this.saveGameStore.saveTemp(`character_state_${character.id}`, stateToSave);
  }
  public async delete(id: string): Promise<void> { 
    logger.warn('CHARACTER_REPO', `Delete not implemented for: ${id}`);
  }
  public async getPlayerCharacters(): Promise<Character[]> { 
    const playerSources = this.gameDataStore.getAllCharacterDataSources()
      .filter(s => s.type === 'player');
    return playerSources.map(s => this.convertDataSourceToEntity(s));
  }
  public async getCompanions(): Promise<Character[]> { 
    const companionSources = this.gameDataStore.getAllCharacterDataSources()
      .filter(s => s.type === 'companion');
    return companionSources.map(s => this.convertDataSourceToEntity(s));
   }

  /**
   * Obtenir le personnage joueur actuel
   * Pour l'instant, retourne le premier personnage joueur trouvé
   */
  public async getCurrentCharacter(): Promise<Character | null> {
    const playerCharacters = await this.getPlayerCharacters();
    if (playerCharacters.length === 0) {
      logger.warn('CHARACTER_REPO', 'No player characters found');
      return null;
    }
    
    // Pour l'instant, retourne le premier personnage
    // TODO: Ajouter logique de sélection du personnage actuel
    const currentCharacter = playerCharacters[0];
    logger.info('CHARACTER_REPO', `Current character: ${currentCharacter.name}`, {
      id: currentCharacter.id,
      level: currentCharacter.level,
      hp: `${currentCharacter.currentHP}/${currentCharacter.maxHP}`
    });
    
    return currentCharacter;
  }
  public async getEnemyDataSourceById(id: string): Promise<DomainEnemyDataSource | null> { 
    const infraTemplate = this.gameDataStore.getEnemyTemplate(id);
    if (!infraTemplate) return null;

    const infraDataSource = EnemyMapper.createEnemyDataSource(id, id, infraTemplate);
    return this.mapEnemyDataSourceToDomain(infraDataSource);
   }
  public async getEnemyTemplateById(id: string): Promise<DomainEnemyTemplate | null> { 
    const infraTemplate = this.gameDataStore.getEnemyTemplate(id);
    return infraTemplate ? this.mapEnemyTemplateToDomain(infraTemplate) : null;
   }


  private convertDataSourceToEntity(source: AnyCharacterDataSource): Character {
    switch (source.type) {
      case 'player':
        return this.createPlayerFromDataSource(source);
      case 'enemy':
        return this.createEnemyFromDataSource(source);
      case 'companion':
        return this.createCompanionFromDataSource(source);
      default:
        throw new Error(`Unknown character data source type`);
    }
  }

  private createPlayerFromDataSource(source: PlayerDataSource): Character {
    const classData = this.gameDataStore.getClassData(source.characterClassId);
    if (!classData) {
      throw new Error(`ClassData not found for classId: ${source.characterClassId}`);
    }

    return CharacterMapper.createCharacterFromInfrastructure(source, classData);
  }

  private createEnemyFromDataSource(source: EnemyDataSource): Character {
    // Créer via template et mapper
    const template = this.gameDataStore.getEnemyTemplate(source.templateId);
    if (!template) {
      throw new Error(`Enemy template not found: ${source.templateId}`);
    }

    const mockClassData: ClassData = { 
      id: 'enemy', 
      name: 'Monstre', 
      hitDie: 8,
      proficiencies: { savingThrows: [], armor: [], weapons: [] }, 
      features: [] 
    };

    const mockPlayerDataSource: PlayerDataSource = {
      id: source.id,
      type: 'player',
      name: source.name,
      characterClassId: 'enemy',
      raceId: 'monster',
      level: template.level,
      xp: 0,
      baseAbilities: template.baseAbilities,
      knownSpellIds: [],
      inventory: { equipped: {}, backpack: [] },
      savedState: {
        currentHp: source.savedState.currentHp,
        gold: 0,
        position: source.savedState.position,
      },
    };

    return CharacterMapper.createCharacterFromInfrastructure(mockPlayerDataSource, mockClassData);
  }

  private createCompanionFromDataSource(source: CompanionDataSource): Character {
    const mockClassData: ClassData = { 
      id: 'companion', 
      name: 'Compagnon', 
      hitDie: 8,
      proficiencies: { savingThrows: [], armor: [], weapons: [] }, 
      features: [] 
    };

    const mockPlayerDataSource: PlayerDataSource = {
      id: source.id,
      type: 'player', 
      name: source.name,
      characterClassId: 'companion',
      raceId: 'animal',
      level: source.level,
      xp: 0,
      baseAbilities: source.baseAbilities,
      knownSpellIds: [],
      inventory: { equipped: {}, backpack: [] },
      savedState: {
        currentHp: source.savedState.currentHp,
        gold: 0,
        position: source.savedState.position,
      },
    };

    return CharacterMapper.createCharacterFromInfrastructure(mockPlayerDataSource, mockClassData);
  }

  // === MAPPERS INFRASTRUCTURE → DOMAINE ===

  private mapEnemyDataSourceToDomain(infraSource: EnemyDataSource): DomainEnemyDataSource {
    return {
      id: infraSource.id,
      name: infraSource.name,
      type: infraSource.type,
      templateId: infraSource.templateId,
      savedState: {
        currentHp: infraSource.savedState.currentHp,
        position: infraSource.savedState.position
      },
      lootOverride: infraSource.lootOverride
    };
  }

  private mapEnemyTemplateToDomain(infraTemplate: EnemyTemplate): DomainEnemyTemplate {
    return {
      id: infraTemplate.id,
      name: infraTemplate.name,
      level: infraTemplate.level,
      baseAbilities: infraTemplate.baseAbilities,
      maxHp: infraTemplate.maxHp,
      armorClass: infraTemplate.armorClass,
      speed: infraTemplate.speed,
      actions: infraTemplate.actions,
      lootTable: infraTemplate.lootTable,
      // Ces propriétés n'existent pas encore dans l'infrastructure
      challengeRating: undefined,
      proficiencyBonus: undefined,
      resistances: undefined,
      vulnerabilities: undefined,
      immunities: undefined
    };
  }
}