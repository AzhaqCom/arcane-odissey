/**
 * DOMAIN ENTITY - GameSession
 * Aggregate Root pour l'état global du jeu
 * ✅ ARCHITECTURE_GUIDELINES.md - Règle #4 : Entité complètement immutable
 */

import { Character } from './Character';
import type { ILogger } from '../services/ILogger';
import { Scene } from './Scene';

export type GamePhase = 'character_creation' | 'scene_navigation' | 'combat' | 'dialogue' | 'inventory' | 'rest' | 'game_over';
export type Difficulty = 'easy' | 'normal' | 'hard' | 'nightmare';

export interface GameTime {
  readonly totalMinutes: number;
  readonly day: number;
  readonly hour: number;  // 0-23
  readonly minute: number; // 0-59
}

export interface GameFlags {
  readonly [key: string]: boolean | number | string;
}

export interface GameMetrics {
  readonly combatsWon: number;
  readonly combatsLost: number;
  readonly scenesVisited: number;
  readonly spellsCast: number;
  readonly itemsFound: number;
  readonly experienceGained: number;
  readonly timePlayedMinutes: number;
}

export interface SaveMetadata {
  readonly saveId: string;
  readonly characterName: string;
  readonly lastSaved: Date;
  readonly gameVersion: string;
  readonly currentSceneTitle: string;
  readonly totalPlayTime: number;
}

export interface GameSessionProps {
  readonly sessionId: string;
  readonly createdAt: Date;
  readonly lastSavedAt?: Date;
  readonly currentPhase: GamePhase;
  readonly difficulty: Difficulty;
  readonly gameTime: GameTime;
  readonly flags: ReadonlyMap<string, boolean | number | string>;
  readonly metrics: GameMetrics;
  readonly currentSceneId: string;
  readonly sceneHistory: readonly string[];
  readonly playerCharacter: Character;
  readonly companions: readonly Character[];
  readonly autoSaveEnabled: boolean;
  readonly autoSaveInterval: number;
}

/**
 * GAMESESSION - Aggregate Root
 * ✅ COMPLÈTEMENT IMMUTABLE - Toutes propriétés readonly
 * ✅ Pattern with...() pour mutations
 * ✅ Respecte ARCHITECTURE_GUIDELINES.md Règle #4
 */
export class GameSession {
  public readonly sessionId: string;
  public readonly createdAt: Date;
  public readonly lastSavedAt?: Date;
  private readonly logger: ILogger;
  
  public readonly currentPhase: GamePhase;
  public readonly difficulty: Difficulty;
  public readonly gameTime: GameTime;
  public readonly flags: ReadonlyMap<string, boolean | number | string>;
  public readonly metrics: GameMetrics;
  
  public readonly currentSceneId: string;
  public readonly sceneHistory: readonly string[];
  public readonly playerCharacter: Character;
  public readonly companions: readonly Character[];
  
  public readonly autoSaveEnabled: boolean;
  public readonly autoSaveInterval: number;
  
  constructor(
    sessionId: string,
    playerCharacter: Character,
    logger: ILogger,
    startingSceneId: string = 'prologue',
    difficulty: Difficulty = 'normal',
    props?: Partial<GameSessionProps>
  ) {
    this.sessionId = sessionId;
    this.createdAt = props?.createdAt ?? new Date();
    this.lastSavedAt = props?.lastSavedAt;
    this.logger = logger;
    
    this.currentPhase = props?.currentPhase ?? 'character_creation';
    this.difficulty = difficulty;
    this.gameTime = props?.gameTime ?? { totalMinutes: 0, day: 1, hour: 8, minute: 0 };
    this.flags = props?.flags ?? new Map();
    this.metrics = props?.metrics ?? {
      combatsWon: 0,
      combatsLost: 0,
      scenesVisited: 0,
      spellsCast: 0,
      itemsFound: 0,
      experienceGained: 0,
      timePlayedMinutes: 0
    };
    
    this.currentSceneId = props?.currentSceneId ?? startingSceneId;
    this.sceneHistory = props?.sceneHistory ?? [];
    this.playerCharacter = playerCharacter;
    this.companions = props?.companions ?? [];
    
    this.autoSaveEnabled = props?.autoSaveEnabled ?? true;
    this.autoSaveInterval = props?.autoSaveInterval ?? 5;
    
    this.logger.game(`GameSession created: ${this.sessionId}`, { 
      playerId: this.playerCharacter.id,
      difficulty: this.difficulty,
      startingScene: startingSceneId
    });
  }
  
  // === PATTERN WITH...() - MUTATIONS IMMUTABLES ===
  
  /**
   * ✅ IMMUTABLE: Retourne nouvelle GameSession avec nouvelle scène
   */
  withNewScene(sceneId: string): GameSession {
    if (this.currentSceneId === sceneId) {
      return this; // Pas de changement
    }

    const newSceneHistory = [...this.sceneHistory, this.currentSceneId];
    const limitedHistory = newSceneHistory.length > 50 
      ? newSceneHistory.slice(1)
      : newSceneHistory;

    const updatedMetrics: GameMetrics = {
      ...this.metrics,
      scenesVisited: this.metrics.scenesVisited + 1
    };

    return new GameSession(
      this.sessionId,
      this.playerCharacter,
      this.logger,
      sceneId,
      this.difficulty,
      {
        createdAt: this.createdAt,
        lastSavedAt: this.lastSavedAt,
        currentPhase: this.currentPhase,
        gameTime: this.gameTime,
        flags: this.flags,
        metrics: updatedMetrics,
        currentSceneId: sceneId,
        sceneHistory: limitedHistory,
        companions: this.companions,
        autoSaveEnabled: this.autoSaveEnabled,
        autoSaveInterval: this.autoSaveInterval
      }
    );
  }

  /**
   * ✅ IMMUTABLE: Retourne nouvelle GameSession avec scène précédente
   */
  withPreviousScene(): GameSession | null {
    if (this.sceneHistory.length === 0) {
      return null;
    }

    const previousSceneId = this.sceneHistory[this.sceneHistory.length - 1];
    const newSceneHistory = this.sceneHistory.slice(0, -1);

    return new GameSession(
      this.sessionId,
      this.playerCharacter,
      this.logger,
      previousSceneId,
      this.difficulty,
      {
        createdAt: this.createdAt,
        lastSavedAt: this.lastSavedAt,
        currentPhase: this.currentPhase,
        gameTime: this.gameTime,
        flags: this.flags,
        metrics: this.metrics,
        currentSceneId: previousSceneId,
        sceneHistory: newSceneHistory,
        companions: this.companions,
        autoSaveEnabled: this.autoSaveEnabled,
        autoSaveInterval: this.autoSaveInterval
      }
    );
  }

  /**
   * ✅ IMMUTABLE: Retourne nouvelle GameSession avec phase mise à jour
   */
  withPhase(newPhase: GamePhase): GameSession {
    if (this.currentPhase === newPhase) {
      return this;
    }

    return new GameSession(
      this.sessionId,
      this.playerCharacter,
      this.logger,
      this.currentSceneId,
      this.difficulty,
      {
        createdAt: this.createdAt,
        lastSavedAt: this.lastSavedAt,
        currentPhase: newPhase,
        gameTime: this.gameTime,
        flags: this.flags,
        metrics: this.metrics,
        sceneHistory: this.sceneHistory,
        companions: this.companions,
        autoSaveEnabled: this.autoSaveEnabled,
        autoSaveInterval: this.autoSaveInterval
      }
    );
  }

  /**
   * ✅ IMMUTABLE: Retourne nouvelle GameSession avec temps avancé
   */
  withAdvancedTime(minutes: number): GameSession {
    const newTotalMinutes = this.gameTime.totalMinutes + minutes;
    const newDay = Math.floor(newTotalMinutes / (24 * 60)) + 1;
    const dayMinutes = newTotalMinutes % (24 * 60);
    const newHour = Math.floor(dayMinutes / 60);
    const newMinute = dayMinutes % 60;

    const newGameTime: GameTime = {
      totalMinutes: newTotalMinutes,
      day: newDay,
      hour: newHour,
      minute: newMinute
    };

    return new GameSession(
      this.sessionId,
      this.playerCharacter,
      this.logger,
      this.currentSceneId,
      this.difficulty,
      {
        createdAt: this.createdAt,
        lastSavedAt: this.lastSavedAt,
        currentPhase: this.currentPhase,
        gameTime: newGameTime,
        flags: this.flags,
        metrics: this.metrics,
        sceneHistory: this.sceneHistory,
        companions: this.companions,
        autoSaveEnabled: this.autoSaveEnabled,
        autoSaveInterval: this.autoSaveInterval
      }
    );
  }

  /**
   * ✅ IMMUTABLE: Retourne nouvelle GameSession avec métriques mises à jour
   */
  withUpdatedMetrics(updates: Partial<GameMetrics>): GameSession {
    const newMetrics: GameMetrics = { ...this.metrics, ...updates };

    return new GameSession(
      this.sessionId,
      this.playerCharacter,
      this.logger,
      this.currentSceneId,
      this.difficulty,
      {
        createdAt: this.createdAt,
        lastSavedAt: this.lastSavedAt,
        currentPhase: this.currentPhase,
        gameTime: this.gameTime,
        flags: this.flags,
        metrics: newMetrics,
        sceneHistory: this.sceneHistory,
        companions: this.companions,
        autoSaveEnabled: this.autoSaveEnabled,
        autoSaveInterval: this.autoSaveInterval
      }
    );
  }

  /**
   * ✅ IMMUTABLE: Retourne nouvelle GameSession avec flag mis à jour
   */
  withFlag(key: string, value: boolean | number | string): GameSession {
    const newFlags = new Map(this.flags);
    newFlags.set(key, value);

    this.logger.game(`Flag set: ${key}`, { 
      oldValue: this.flags.get(key), 
      newValue: value 
    });

    return new GameSession(
      this.sessionId,
      this.playerCharacter,
      this.logger,
      this.currentSceneId,
      this.difficulty,
      {
        createdAt: this.createdAt,
        lastSavedAt: this.lastSavedAt,
        currentPhase: this.currentPhase,
        gameTime: this.gameTime,
        flags: newFlags,
        metrics: this.metrics,
        sceneHistory: this.sceneHistory,
        companions: this.companions,
        autoSaveEnabled: this.autoSaveEnabled,
        autoSaveInterval: this.autoSaveInterval
      }
    );
  }

  /**
   * ✅ IMMUTABLE: Retourne nouvelle GameSession avec timestamp sauvegarde
   */
  withSavedTimestamp(): GameSession {
    return new GameSession(
      this.sessionId,
      this.playerCharacter,
      this.logger,
      this.currentSceneId,
      this.difficulty,
      {
        createdAt: this.createdAt,
        lastSavedAt: new Date(),
        currentPhase: this.currentPhase,
        gameTime: this.gameTime,
        flags: this.flags,
        metrics: this.metrics,
        sceneHistory: this.sceneHistory,
        companions: this.companions,
        autoSaveEnabled: this.autoSaveEnabled,
        autoSaveInterval: this.autoSaveInterval
      }
    );
  }

  /**
   * ✅ IMMUTABLE: Retourne nouvelle GameSession avec compagnon ajouté
   */
  withAddedCompanion(companion: Character): GameSession {
    if (this.companions.find(c => c.id === companion.id)) {
      return this; // Compagnon déjà présent
    }

    const newCompanions = [...this.companions, companion];

    this.logger.game(`Companion added: ${companion.name}`, { 
      companionId: companion.id,
      partySize: newCompanions.length + 1 
    });

    return new GameSession(
      this.sessionId,
      this.playerCharacter,
      this.logger,
      this.currentSceneId,
      this.difficulty,
      {
        createdAt: this.createdAt,
        lastSavedAt: this.lastSavedAt,
        currentPhase: this.currentPhase,
        gameTime: this.gameTime,
        flags: this.flags,
        metrics: this.metrics,
        sceneHistory: this.sceneHistory,
        companions: newCompanions,
        autoSaveEnabled: this.autoSaveEnabled,
        autoSaveInterval: this.autoSaveInterval
      }
    );
  }

  /**
   * ✅ IMMUTABLE: Retourne nouvelle GameSession avec compagnon retiré
   */
  withRemovedCompanion(companionId: string): GameSession {
    const companion = this.companions.find(c => c.id === companionId);
    if (!companion) {
      return this; // Compagnon non trouvé
    }

    const newCompanions = this.companions.filter(c => c.id !== companionId);

    this.logger.game(`Companion removed: ${companion.name}`, { 
      companionId,
      partySize: newCompanions.length + 1 
    });

    return new GameSession(
      this.sessionId,
      this.playerCharacter,
      this.logger,
      this.currentSceneId,
      this.difficulty,
      {
        createdAt: this.createdAt,
        lastSavedAt: this.lastSavedAt,
        currentPhase: this.currentPhase,
        gameTime: this.gameTime,
        flags: this.flags,
        metrics: this.metrics,
        sceneHistory: this.sceneHistory,
        companions: newCompanions,
        autoSaveEnabled: this.autoSaveEnabled,
        autoSaveInterval: this.autoSaveInterval
      }
    );
  }
  
  // === BUSINESS RULES - PURE FUNCTIONS ===
  
  /**
   * Vérifier si on peut passer à une phase donnée
   */
  canTransitionToPhase(targetPhase: GamePhase): boolean {
    const transitions = this.getAllowedPhaseTransitions();
    return transitions.includes(targetPhase);
  }
  
  /**
   * Obtenir les transitions de phase autorisées
   */
  private getAllowedPhaseTransitions(): GamePhase[] {
    switch (this.currentPhase) {
      case 'character_creation': return ['scene_navigation'];
      case 'scene_navigation': return ['combat', 'dialogue', 'inventory', 'rest', 'game_over'];
      case 'combat': return ['scene_navigation', 'inventory', 'game_over'];
      case 'dialogue': return ['scene_navigation', 'combat', 'inventory'];
      case 'inventory': return ['scene_navigation', 'combat', 'dialogue', 'rest'];
      case 'rest': return ['scene_navigation', 'combat'];
      case 'game_over': return ['character_creation'];
      default: return [];
    }
  }

  /**
   * Vérifier si une scène a été visitée
   */
  hasVisitedScene(sceneId: string): boolean {
    return this.sceneHistory.includes(sceneId) || this.currentSceneId === sceneId;
  }

  /**
   * Obtenir la scène précédente
   */
  getPreviousScene(): string | undefined {
    return this.sceneHistory[this.sceneHistory.length - 1];
  }

  /**
   * Obtenir un flag
   */
  getFlag(key: string): boolean | number | string | undefined {
    return this.flags.get(key);
  }

  /**
   * Vérifier si un flag existe et est vrai
   */
  hasFlag(key: string): boolean {
    return this.flags.get(key) === true;
  }

  /**
   * Obtenir tous les flags
   */
  getAllFlags(): GameFlags {
    const flags: { [key: string]: boolean | number | string } = {};
    this.flags.forEach((value, key) => {
      flags[key] = value;
    });
    return flags as GameFlags;
  }

  /**
   * Obtenir tous les personnages (joueur + compagnons)
   */
  getAllCharacters(): Character[] {
    return [this.playerCharacter, ...this.companions];
  }

  /**
   * Obtenir les personnages vivants
   */
  getAliveCharacters(): Character[] {
    return this.getAllCharacters().filter(c => c.isAlive);
  }

  /**
   * Obtenir l'heure formatée
   */
  getFormattedTime(): string {
    const h = this.gameTime.hour.toString().padStart(2, '0');
    const m = this.gameTime.minute.toString().padStart(2, '0');
    return `Jour ${this.gameTime.day} - ${h}:${m}`;
  }

  /**
   * Obtenir la période de la journée
   */
  getTimeOfDay(): 'dawn' | 'day' | 'dusk' | 'night' {
    const hour = this.gameTime.hour;
    if (hour >= 5 && hour < 8) return 'dawn';
    if (hour >= 8 && hour < 18) return 'day';
    if (hour >= 18 && hour < 21) return 'dusk';
    return 'night';
  }

  /**
   * Vérifier si la session a besoin d'être sauvegardée
   */
  needsSaving(): boolean {
    if (!this.lastSavedAt) return true;
    
    const timeSinceSave = Date.now() - this.lastSavedAt.getTime();
    const autoSaveThreshold = this.autoSaveInterval * 60 * 1000;
    
    return timeSinceSave >= autoSaveThreshold;
  }

  /**
   * Obtenir les métadonnées de sauvegarde
   */
  getSaveMetadata(): SaveMetadata {
    return {
      saveId: this.sessionId,
      characterName: this.playerCharacter.name,
      lastSaved: this.lastSavedAt || this.createdAt,
      gameVersion: '2.6.0',
      currentSceneTitle: `Scene ${this.currentSceneId}`,
      totalPlayTime: this.metrics.timePlayedMinutes
    };
  }

  /**
   * Vérifier si la session de jeu est valide
   */
  isValid(): { valid: boolean; reasons: string[] } {
    const reasons: string[] = [];
    
    if (!this.playerCharacter.isAlive) {
      reasons.push('Player character is dead');
    }
    
    if (!this.currentSceneId || this.currentSceneId.trim().length === 0) {
      reasons.push('Invalid current scene ID');
    }
    
    if (this.metrics.timePlayedMinutes < 0) {
      reasons.push('Invalid play time');
    }
    
    return { valid: reasons.length === 0, reasons };
  }

  /**
   * Vérifier si le jeu est terminé
   */
  isGameOver(): boolean {
    return this.currentPhase === 'game_over' || 
           !this.playerCharacter.isAlive ||
           this.getAllCharacters().every(c => !c.isAlive);
  }
}