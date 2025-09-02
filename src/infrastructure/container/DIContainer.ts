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

// Services Domain requis pour Combat
import { DiceRollingService } from '../../domain/services/DiceRollingService';
import { DamageCalculationService } from '../../domain/services/DamageCalculationService';
import { AbilityCalculationService } from '../../domain/services/AbilityCalculationService';
import { InitiativeService } from '../../domain/services/InitiativeService';
import { TacticalCalculationService } from '../../domain/services/TacticalCalculationService';
import { GameNarrativeService } from '../../domain/services/GameNarrativeService';
import { ActionPrioritizer } from '../../domain/entities/ActionPrioritizer';
import { ThreatAssessment } from '../../domain/entities/ThreatAssessment';
import { CombatActionService } from '../../domain/services/CombatActionService';
import type { IRandomNumberGenerator } from '../../domain/services/DiceRollingService';
import { Combat } from '../../domain/entities/Combat';

// Création d'un CombatRepository temporaire (en attendant implémentation propre)
class TempCombatRepository {
  private currentCombat: any = null;
  async getCombat() { return this.currentCombat; }
  async saveCombat(combat: any) { this.currentCombat = combat; }
}

// Création d'un EffectsRepository temporaire
class TempEffectsRepository {
  async getEffectsManager() { return {}; }
  async saveEffects() { }
}

// Implémentation production de IRandomNumberGenerator
class ProductionRandomNumberGenerator implements IRandomNumberGenerator {
  random(): number {
    return Math.random();
  }
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

    // ===== SERVICES DOMAIN =====
    const randomGenerator = new ProductionRandomNumberGenerator();
    const diceRollingService = new DiceRollingService(randomGenerator);
    const damageCalculationService = new DamageCalculationService(diceRollingService);
    const abilityCalculationService = new AbilityCalculationService();
    const initiativeService = new InitiativeService(diceRollingService);
    const tacticalCalculationService = new TacticalCalculationService();
    const gameNarrativeService = new GameNarrativeService(diceRollingService);
    const actionPrioritizer = new ActionPrioritizer(diceRollingService);
    const threatAssessment = new ThreatAssessment(diceRollingService);
    const combatActionService = new CombatActionService(diceRollingService);

    this.register('DiceRollingService', diceRollingService);
    this.register('DamageCalculationService', damageCalculationService);
    this.register('AbilityCalculationService', abilityCalculationService);
    this.register('InitiativeService', initiativeService);
    this.register('TacticalCalculationService', tacticalCalculationService);
    this.register('GameNarrativeService', gameNarrativeService);
    this.register('ActionPrioritizer', actionPrioritizer);
    this.register('ThreatAssessment', threatAssessment);
    this.register('CombatActionService', combatActionService);

    logger.debug('DI_CONTAINER', 'Domain services initialized');

    // ===== USE CASES UNIFIÉS =====
    const combatUseCase = new CombatUseCase(
      combatRepository, 
      characterRepository, 
      gameNarrativeService,
      diceRollingService,
      initiativeService,
      this.createCombat.bind(this),
      effectsRepository, 
      weaponRepository
    );
    const sceneUseCase = new SceneUseCase(sceneRepository);
    const gameUseCase = new GameUseCase(sceneUseCase, characterRepository); // Repository unifié

    this.register('CombatUseCase', combatUseCase);
    this.register('SceneUseCase', sceneUseCase);
    this.register('GameUseCase', gameUseCase);

    logger.info('DI_CONTAINER', 'All services initialized successfully');
  }

  /**
   * Factory pour créer Combat avec dépendances injectées
   */
  createCombat(id: string, gridDimensions?: any): Combat {
    logger.debug('DI_CONTAINER', 'Creating Combat with dependencies...', {
      servicesRegistered: Array.from(this.services.keys())
    });

    const dependencies = {
      diceRollingService: this.get('DiceRollingService'),
      damageCalculationService: this.get('DamageCalculationService'),
      abilityCalculationService: this.get('AbilityCalculationService'),
      initiativeService: this.get('InitiativeService'),
      tacticalCalculationService: this.get('TacticalCalculationService'),
      actionPrioritizer: this.get('ActionPrioritizer'),
      threatAssessment: this.get('ThreatAssessment'),
      combatActionService: this.get('CombatActionService')
    };

    logger.debug('DI_CONTAINER', 'Combat dependencies resolved', {
      diceRollingService: !!dependencies.diceRollingService,
      damageCalculationService: !!dependencies.damageCalculationService,
      abilityCalculationService: !!dependencies.abilityCalculationService
    });

    return new Combat(id, gridDimensions, dependencies);
  }

  // PHASE 2 - Getters statiques supprimés pour éviter les dépendances circulaires
  // Les services sont maintenant injectés directement dans les constructeurs
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

  // Services Domain
  DiceRollingService: 'DiceRollingService',
  DamageCalculationService: 'DamageCalculationService',
  AbilityCalculationService: 'AbilityCalculationService',
  InitiativeService: 'InitiativeService',
  TacticalCalculationService: 'TacticalCalculationService',
  GameNarrativeService: 'GameNarrativeService',
  ActionPrioritizer: 'ActionPrioritizer',
  ThreatAssessment: 'ThreatAssessment',
  CombatActionService: 'CombatActionService',

  // Use Cases
  CombatUseCase: 'CombatUseCase',
  SceneUseCase: 'SceneUseCase',
  GameUseCase: 'GameUseCase'
} as const;