/**
 * INFRASTRUCTURE - Dependency Injection Container
 * Container étendu pour gérer toutes les dépendances
 */

import { CombatGameUseCase } from '../../application/usecases/CombatGameUseCase';
import { SceneUseCase } from '../../application/usecases/SceneUseCase';
import { GameUseCase } from '../../application/usecases/GameUseCase';
// InMemoryRepositories supprimés - utilisation des repositories modernes uniquement

// Stores et repositories modernes unifiés
import { GameDataStore } from '../stores/GameDataStore';
import { SaveGameStore } from '../stores/SaveGameStore';
import { WeaponRepository } from '../repositories/WeaponRepository';
import { SpellRepository } from '../repositories/SpellRepository';
import { CharacterRepository } from '../repositories/CharacterRepository';
import { EnemyRepository } from '../repositories/EnemyRepository';
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
// ActionPrioritizer et ThreatAssessment supprimés (incompatibles avec Phoenix)
import { TacticalAIService } from '../../domain/services/TacticalAIService';
import { WeaponResolutionService } from '../../domain/services/WeaponResolutionService';
import { PlayerWeaponService } from '../../domain/services/PlayerWeaponService';
import { SceneConditionService } from '../../domain/services/SceneConditionService';
import type { IRandomNumberGenerator } from '../../domain/services/DiceRollingService';
// import { Combat } from '../../domain/entities/Combat'; // ✅ SUPPRIMÉ - Utilise CombatEngine maintenant

// NOUVEAU SYSTÈME - Plus de repositories temporaires nécessaires
// Le CombatEngine gère son propre état immutable

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

    // ===== REPOSITORIES ESSENTIELS =====
    const weaponRepository = new WeaponRepository(gameDataStore);
    const spellRepository = new SpellRepository(gameDataStore);
    const characterRepository = new CharacterRepository(gameDataStore, saveGameStore);
    const enemyRepository = new EnemyRepository();
    const sceneRepository = new SceneRepository();
    const gameSessionRepository = new GameSessionRepository();

    this.register('WeaponRepository', weaponRepository);
    this.register('SpellRepository', spellRepository);
    this.register('CharacterRepository', characterRepository);
    this.register('EnemyRepository', enemyRepository);
    this.register('SceneRepository', sceneRepository);
    this.register('GameSessionRepository', gameSessionRepository);

    logger.debug('DI_CONTAINER', 'Unified repositories initialized');

    // ===== SERVICES DOMAIN (SIMPLIFIÉS) =====
    const randomGenerator = new ProductionRandomNumberGenerator();
    const diceRollingService = new DiceRollingService(randomGenerator);
    const damageCalculationService = new DamageCalculationService(diceRollingService);
    const abilityCalculationService = new AbilityCalculationService();
    const initiativeService = new InitiativeService(diceRollingService);
    const tacticalCalculationService = new TacticalCalculationService();
    const gameNarrativeService = new GameNarrativeService(diceRollingService);
    
    // ✅ SYSTÈME AI TACTIQUE UNIFIÉ avec résolution d'armes
    const weaponResolutionService = new WeaponResolutionService(weaponRepository);
    const playerWeaponService = new PlayerWeaponService(weaponRepository);
    const sceneConditionService = new SceneConditionService(logger);
    const tacticalAIService = new TacticalAIService(diceRollingService, weaponResolutionService, logger);

    // Services essentiels seulement
    this.register('DiceRollingService', diceRollingService);
    this.register('DamageCalculationService', damageCalculationService);
    this.register('AbilityCalculationService', abilityCalculationService);
    this.register('InitiativeService', initiativeService);
    this.register('TacticalCalculationService', tacticalCalculationService);
    this.register('GameNarrativeService', gameNarrativeService);
    this.register('WeaponResolutionService', weaponResolutionService);
    this.register('PlayerWeaponService', playerWeaponService);
    this.register('SceneConditionService', sceneConditionService);
    this.register('TacticalAIService', tacticalAIService);

    logger.debug('DI_CONTAINER', 'Domain services initialized');

    // ===== COMBAT DEPENDENCIES =====
    const combatDependencies = {
      diceRollingService,
      damageCalculationService,
      weaponResolutionService,
      logger
    };

    // ===== USE CASES SIMPLIFIÉS =====
    const combatGameUseCase = new CombatGameUseCase(
      tacticalAIService,
      logger,
      characterRepository,
      enemyRepository,
      sceneRepository,
      gameSessionRepository,
      combatDependencies,
      playerWeaponService,
      sceneConditionService
    );
    const sceneUseCase = new SceneUseCase(sceneRepository);
    const gameUseCase = new GameUseCase(sceneUseCase, characterRepository);

    this.register('CombatGameUseCase', combatGameUseCase);
    this.register('SceneUseCase', sceneUseCase);
    this.register('GameUseCase', gameUseCase);

    logger.info('DI_CONTAINER', 'All services initialized successfully');
  }

  /**
   * Factory pour créer les dépendances CombatEngine
   */
  createCombatDependencies() {
    return {
      diceRollingService: this.get<DiceRollingService>('DiceRollingService'),
      damageCalculationService: this.get<DamageCalculationService>('DamageCalculationService'),
      weaponResolutionService: this.get<WeaponResolutionService>('WeaponResolutionService'),
      logger: logger
    };
  }
}

// Tokens pour l'injection
export const TOKENS = {
  // Stores
  GameDataStore: 'GameDataStore',
  SaveGameStore: 'SaveGameStore',

  // Repositories Essentiels
  WeaponRepository: 'WeaponRepository',
  SpellRepository: 'SpellRepository',
  CharacterRepository: 'CharacterRepository',
  EnemyRepository: 'EnemyRepository',
  SceneRepository: 'SceneRepository',
  GameSessionRepository: 'GameSessionRepository',

  // Services Domain Simplifiés
  DiceRollingService: 'DiceRollingService',
  DamageCalculationService: 'DamageCalculationService',
  AbilityCalculationService: 'AbilityCalculationService',
  InitiativeService: 'InitiativeService',
  TacticalCalculationService: 'TacticalCalculationService',
  GameNarrativeService: 'GameNarrativeService',
  WeaponResolutionService: 'WeaponResolutionService',
  SimpleAIService: 'SimpleAIService',

  // Use Cases Simplifiés
  CombatGameUseCase: 'CombatGameUseCase',
  SceneUseCase: 'SceneUseCase',
  GameUseCase: 'GameUseCase'
} as const;