/**
 * INFRASTRUCTURE - Dependency Injection Container
 * Container étendu pour gérer toutes les dépendances
 */

import { CombatUseCase } from '../../application/usecases/CombatUseCase';
import { SceneUseCase } from '../../application/usecases/SceneUseCase';
import { GameUseCase } from '../../application/usecases/GameUseCase';
// InMemoryRepositories supprimés - utilisation des repositories modernes uniquement

// Stores et repositories modernes unifiés
import { GameDataStore } from '../stores/GameDataStore';
import { SaveGameStore } from '../stores/SaveGameStore';
import { WeaponRepository } from '../repositories/WeaponRepository';
import { SpellRepository } from '../repositories/SpellRepository';
import { CharacterRepository } from '../repositories/CharacterRepository';
import { SceneRepository } from '../repositories/SceneRepository';
import { GameSessionRepository } from '../repositories/GameSessionRepository';
import { logger } from '../services/Logger';

// Création d'un CombatRepository temporaire (en attendant implémentation propre)
class TempCombatRepository {
  private currentCombat: any = null;
  async getCombat() { return this.currentCombat; }
  async saveCombat(combat: any) { this.currentCombat = combat; }
}

// Création d'un EffectsRepository temporaire
class TempEffectsRepository {
  async getEffectsManager() { return {}; }
  async saveEffects() {}
}

/**
 * Container simple pour injection de dépendances
 */
export class DIContainer {
  private static instance: DIContainer;
  private services = new Map<string, any>();

  private constructor() {
    this.initializeServices();
  }

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  /**
   * Obtenir un service
   */
  get<T>(token: string): T {
    const service = this.services.get(token);
    if (!service) {
      throw new Error(`Service ${token} not found`);
    }
    return service;
  }

  /**
   * Enregistrer un service
   */
  register<T>(token: string, service: T): void {
    this.services.set(token, service);
  }

  /**
   * Initialiser tous les services
   */
  private initializeServices(): void {
    logger.info('DI_CONTAINER', 'Initializing services...');
    
    // ===== STORES =====
    const gameDataStore = new GameDataStore();
    const saveGameStore = new SaveGameStore();
    
    this.register('GameDataStore', gameDataStore);
    this.register('SaveGameStore', saveGameStore);
    
    logger.debug('DI_CONTAINER', 'Stores initialized', gameDataStore.getStoreStats());
    
    // ===== REPOSITORIES UNIFIÉS =====
    const weaponRepository = new WeaponRepository(gameDataStore);
    const spellRepository = new SpellRepository(gameDataStore);
    const characterRepository = new CharacterRepository(gameDataStore, saveGameStore);
    const sceneRepository = new SceneRepository();
    const gameSessionRepository = new GameSessionRepository();
    
    // Repositories temporaires (transition)
    const combatRepository = new TempCombatRepository();
    const effectsRepository = new TempEffectsRepository();
    
    this.register('WeaponRepository', weaponRepository);
    this.register('SpellRepository', spellRepository);
    this.register('CharacterRepository', characterRepository);
    this.register('SceneRepository', sceneRepository);
    this.register('GameSessionRepository', gameSessionRepository);
    this.register('CombatRepository', combatRepository);
    this.register('EffectsRepository', effectsRepository);
    
    logger.debug('DI_CONTAINER', 'Unified repositories initialized');

    // ===== USE CASES UNIFIÉS =====
    const combatUseCase = new CombatUseCase(combatRepository, characterRepository, effectsRepository, weaponRepository);
    const sceneUseCase = new SceneUseCase(sceneRepository);
    const gameUseCase = new GameUseCase(sceneUseCase, characterRepository); // Repository unifié
    
    this.register('CombatUseCase', combatUseCase);
    this.register('SceneUseCase', sceneUseCase);
    this.register('GameUseCase', gameUseCase);
    
    logger.info('DI_CONTAINER', 'All services initialized successfully');
  }
}

// Tokens pour l'injection
export const TOKENS = {
  // Stores
  GameDataStore: 'GameDataStore',
  SaveGameStore: 'SaveGameStore',
  
  // Repositories Unifiés
  WeaponRepository: 'WeaponRepository',
  SpellRepository: 'SpellRepository',
  CharacterRepository: 'CharacterRepository',
  SceneRepository: 'SceneRepository',
  GameSessionRepository: 'GameSessionRepository',
  CombatRepository: 'CombatRepository',
  EffectsRepository: 'EffectsRepository',
  
  // Use Cases
  CombatUseCase: 'CombatUseCase',
  SceneUseCase: 'SceneUseCase',
  GameUseCase: 'GameUseCase'
} as const;