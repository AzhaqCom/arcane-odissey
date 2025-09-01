/**
 * DOMAIN ENTITY - GameSession
 * Aggregate Root pour l'état global du jeu
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

/**
 * GAMESESSION - Aggregate Root
 * Représente l'état complet d'une session de jeu
 */
export class GameSession {
  private readonly _sessionId: string;
  private readonly _createdAt: Date;
  private _lastSavedAt?: Date;
  private readonly _logger: ILogger;
  
  private _currentPhase: GamePhase;
  private _difficulty: Difficulty;
  private _gameTime: GameTime;
  private _flags: Map<string, boolean | number | string>;
  private _metrics: GameMetrics;
  
  private _currentSceneId: string;
  private _sceneHistory: string[];
  private _playerCharacter: Character;
  private _companions: Character[];
  
  private _autoSaveEnabled: boolean;
  private _autoSaveInterval: number; // en minutes
  
  constructor(
    sessionId: string,
    playerCharacter: Character,
    logger: ILogger,
    startingSceneId: string = 'prologue',
    difficulty: Difficulty = 'normal'
  ) {
    this._sessionId = sessionId;
    this._createdAt = new Date();
    this._logger = logger;
    
    this._currentPhase = 'character_creation';
    this._difficulty = difficulty;
    this._gameTime = { totalMinutes: 0, day: 1, hour: 8, minute: 0 }; // Début à 8h du jour 1
    this._flags = new Map();
    this._metrics = {
      combatsWon: 0,
      combatsLost: 0,
      scenesVisited: 0,
      spellsCast: 0,
      itemsFound: 0,
      experienceGained: 0,
      timePlayedMinutes: 0
    };
    
    this._currentSceneId = startingSceneId;
    this._sceneHistory = [];
    this._playerCharacter = playerCharacter;
    this._companions = [];
    
    this._autoSaveEnabled = true;
    this._autoSaveInterval = 5; // Sauvegarde automatique toutes les 5 minutes
    
    this._logger.game(`GameSession created: ${this._sessionId}`, { 
      playerId: this._playerCharacter.id,
      difficulty: this._difficulty,
      startingScene: startingSceneId
    });
  }
  
  // GETTERS (Pure)
  get sessionId(): string { return this._sessionId; }
  get createdAt(): Date { return this._createdAt; }
  get lastSavedAt(): Date | undefined { return this._lastSavedAt; }
  get currentPhase(): GamePhase { return this._currentPhase; }
  get difficulty(): Difficulty { return this._difficulty; }
  get gameTime(): GameTime { return { ...this._gameTime }; }
  get currentSceneId(): string { return this._currentSceneId; }
  get sceneHistory(): readonly string[] { return [...this._sceneHistory]; }
  get playerCharacter(): Character { return this._playerCharacter; }
  get companions(): readonly Character[] { return [...this._companions]; }
  get metrics(): GameMetrics { return { ...this._metrics }; }
  get autoSaveEnabled(): boolean { return this._autoSaveEnabled; }
  get autoSaveInterval(): number { return this._autoSaveInterval; }
  
  // BUSINESS RULES - Phase Management
  
  /**
   * Changer la phase de jeu
   */
  changePhase(newPhase: GamePhase): GameSession {
    return this.withPhase(newPhase);
  }
  
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
    switch (this._currentPhase) {
      case 'character_creation':
        return ['scene_navigation'];
        
      case 'scene_navigation':
        return ['combat', 'dialogue', 'inventory', 'rest', 'game_over'];
        
      case 'combat':
        return ['scene_navigation', 'inventory', 'game_over'];
        
      case 'dialogue':
        return ['scene_navigation', 'combat', 'inventory'];
        
      case 'inventory':
        return ['scene_navigation', 'combat', 'dialogue', 'rest'];
        
      case 'rest':
        return ['scene_navigation', 'combat'];
        
      case 'game_over':
        return ['character_creation'];
        
      default:
        return [];
    }
  }
  
  // BUSINESS RULES - Scene Navigation
  
  /**
   * Retourne une nouvelle GameSession avec une nouvelle scène
   * Respecte le principe d'immutabilité - Règle #2 ARCHITECTURE_GUIDELINES.md
   */
  public withNewScene(sceneId: string): GameSession {
    if (this._currentSceneId === sceneId) {
      return this; // Pas de changement, retourner la même instance
    }

    // Créer un nouvel historique sans mutation
    const newSceneHistory = [...this._sceneHistory, this._currentSceneId];
    
    // Limiter l'historique à 50 scènes pour éviter la surcharge
    const limitedHistory = newSceneHistory.length > 50 
      ? newSceneHistory.slice(1) // Supprimer le premier élément
      : newSceneHistory;

    // Créer métriques mises à jour
    const updatedMetrics = {
      ...this._metrics,
      scenesVisited: this._metrics.scenesVisited + 1
    };

    // Créer une nouvelle instance avec les nouvelles valeurs
    const newSession = new GameSession(
      this._sessionId,
      this._playerCharacter,
      this._logger,
      sceneId, // ← Nouvelle scène
      this._difficulty
    );

    // Copier l'état immutable
    (newSession as any)._createdAt = this._createdAt;
    (newSession as any)._lastSavedAt = this._lastSavedAt;
    (newSession as any)._currentPhase = this._currentPhase;
    (newSession as any)._gameTime = { ...this._gameTime };
    (newSession as any)._flags = new Map(this._flags);
    (newSession as any)._metrics = updatedMetrics;
    (newSession as any)._sceneHistory = limitedHistory; // ← Historique immutable
    (newSession as any)._companions = [...this._companions];
    (newSession as any)._autoSaveEnabled = this._autoSaveEnabled;
    (newSession as any)._autoSaveInterval = this._autoSaveInterval;

    this._logger.game(`Navigation to scene: ${sceneId}`, { 
      previousScene: this._currentSceneId,
      historyLength: limitedHistory.length
    });

    return newSession;
  }

  /**
   * Retourne une nouvelle GameSession avec la scène précédente
   * Respecte le principe d'immutabilité - Règle #2 ARCHITECTURE_GUIDELINES.md
   */
  public withPreviousScene(): GameSession | null {
    if (this._sceneHistory.length === 0) {
      return null; // Pas de scène précédente disponible
    }

    // Récupérer la dernière scène de l'historique
    const previousSceneId = this._sceneHistory[this._sceneHistory.length - 1];
    
    // Créer un nouvel historique sans la dernière scène (immutable)
    const newSceneHistory = this._sceneHistory.slice(0, -1);

    // Créer une nouvelle instance avec la scène précédente
    const newSession = new GameSession(
      this._sessionId,
      this._playerCharacter,
      this._logger,
      previousSceneId, // ← Scène précédente
      this._difficulty
    );

    // Copier l'état immutable
    (newSession as any)._createdAt = this._createdAt;
    (newSession as any)._lastSavedAt = this._lastSavedAt;
    (newSession as any)._currentPhase = this._currentPhase;
    (newSession as any)._gameTime = { ...this._gameTime };
    (newSession as any)._flags = new Map(this._flags);
    (newSession as any)._metrics = { ...this._metrics };
    (newSession as any)._sceneHistory = newSceneHistory; // ← Historique immutable
    (newSession as any)._companions = [...this._companions];
    (newSession as any)._autoSaveEnabled = this._autoSaveEnabled;
    (newSession as any)._autoSaveInterval = this._autoSaveInterval;

    this._logger.game(`Navigation to previous scene: ${previousSceneId}`, { 
      currentScene: this._currentSceneId,
      historyLength: newSceneHistory.length
    });

    return newSession;
  }

  // BUSINESS RULES - Game State Management
  
  /**
   * Retourne une nouvelle GameSession avec une phase mise à jour
   * Respecte le principe d'immutabilité - Règle #2 ARCHITECTURE_GUIDELINES.md
   */
  public withPhase(newPhase: GamePhase): GameSession {
    if (this._currentPhase === newPhase) {
      return this;
    }

    const newSession = new GameSession(
      this._sessionId,
      this._playerCharacter,
      this._logger,
      this._currentSceneId,
      this._difficulty
    );

    (newSession as any)._createdAt = this._createdAt;
    (newSession as any)._lastSavedAt = this._lastSavedAt;
    (newSession as any)._currentPhase = newPhase;
    (newSession as any)._gameTime = { ...this._gameTime };
    (newSession as any)._flags = new Map(this._flags);
    (newSession as any)._metrics = { ...this._metrics };
    (newSession as any)._sceneHistory = [...this._sceneHistory];
    (newSession as any)._companions = [...this._companions];
    (newSession as any)._autoSaveEnabled = this._autoSaveEnabled;
    (newSession as any)._autoSaveInterval = this._autoSaveInterval;

    return newSession;
  }

  /**
   * Retourne une nouvelle GameSession avec le temps avancé
   * Respecte le principe d'immutabilité - Règle #2 ARCHITECTURE_GUIDELINES.md
   */
  public withAdvancedTime(minutes: number): GameSession {
    const oldTime = { ...this._gameTime };
    const newTotalMinutes = oldTime.totalMinutes + minutes;
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

    const newSession = new GameSession(
      this._sessionId,
      this._playerCharacter,
      this._logger,
      this._currentSceneId,
      this._difficulty
    );

    (newSession as any)._createdAt = this._createdAt;
    (newSession as any)._lastSavedAt = this._lastSavedAt;
    (newSession as any)._currentPhase = this._currentPhase;
    (newSession as any)._gameTime = newGameTime;
    (newSession as any)._flags = new Map(this._flags);
    (newSession as any)._metrics = { ...this._metrics };
    (newSession as any)._sceneHistory = [...this._sceneHistory];
    (newSession as any)._companions = [...this._companions];
    (newSession as any)._autoSaveEnabled = this._autoSaveEnabled;
    (newSession as any)._autoSaveInterval = this._autoSaveInterval;

    return newSession;
  }

  /**
   * Retourne une nouvelle GameSession avec des métriques mises à jour
   * Respecte le principe d'immutabilité - Règle #2 ARCHITECTURE_GUIDELINES.md
   */
  public withUpdatedMetrics(updates: Partial<GameMetrics>): GameSession {
    const newMetrics = { ...this._metrics, ...updates };

    const newSession = new GameSession(
      this._sessionId,
      this._playerCharacter,
      this._logger,
      this._currentSceneId,
      this._difficulty
    );

    (newSession as any)._createdAt = this._createdAt;
    (newSession as any)._lastSavedAt = this._lastSavedAt;
    (newSession as any)._currentPhase = this._currentPhase;
    (newSession as any)._gameTime = { ...this._gameTime };
    (newSession as any)._flags = new Map(this._flags);
    (newSession as any)._metrics = newMetrics;
    (newSession as any)._sceneHistory = [...this._sceneHistory];
    (newSession as any)._companions = [...this._companions];
    (newSession as any)._autoSaveEnabled = this._autoSaveEnabled;
    (newSession as any)._autoSaveInterval = this._autoSaveInterval;

    return newSession;
  }

  /**
   * Retourne une nouvelle GameSession avec timestamp de sauvegarde
   * Respecte le principe d'immutabilité - Règle #2 ARCHITECTURE_GUIDELINES.md
   */
  public withSavedTimestamp(): GameSession {
    const newSession = new GameSession(
      this._sessionId,
      this._playerCharacter,
      this._logger,
      this._currentSceneId,
      this._difficulty
    );

    (newSession as any)._createdAt = this._createdAt;
    (newSession as any)._lastSavedAt = new Date();
    (newSession as any)._currentPhase = this._currentPhase;
    (newSession as any)._gameTime = { ...this._gameTime };
    (newSession as any)._flags = new Map(this._flags);
    (newSession as any)._metrics = { ...this._metrics };
    (newSession as any)._sceneHistory = [...this._sceneHistory];
    (newSession as any)._companions = [...this._companions];
    (newSession as any)._autoSaveEnabled = this._autoSaveEnabled;
    (newSession as any)._autoSaveInterval = this._autoSaveInterval;

    return newSession;
  }

  /**
   * Retourne une nouvelle GameSession avec configuration auto-save
   * Respecte le principe d'immutabilité - Règle #2 ARCHITECTURE_GUIDELINES.md
   */
  public withAutoSaveConfig(enabled: boolean, intervalMinutes: number): GameSession {
    const newSession = new GameSession(
      this._sessionId,
      this._playerCharacter,
      this._logger,
      this._currentSceneId,
      this._difficulty
    );

    (newSession as any)._createdAt = this._createdAt;
    (newSession as any)._lastSavedAt = this._lastSavedAt;
    (newSession as any)._currentPhase = this._currentPhase;
    (newSession as any)._gameTime = { ...this._gameTime };
    (newSession as any)._flags = new Map(this._flags);
    (newSession as any)._metrics = { ...this._metrics };
    (newSession as any)._sceneHistory = [...this._sceneHistory];
    (newSession as any)._companions = [...this._companions];
    (newSession as any)._autoSaveEnabled = enabled;
    (newSession as any)._autoSaveInterval = Math.max(1, intervalMinutes);

    return newSession;
  }
  
  /**
   * Vérifier si une scène a été visitée
   */
  hasVisitedScene(sceneId: string): boolean {
    return this._sceneHistory.includes(sceneId) || this._currentSceneId === sceneId;
  }
  
  /**
   * Obtenir la scène précédente
   */
  getPreviousScene(): string | undefined {
    return this._sceneHistory[this._sceneHistory.length - 1];
  }
  
  // BUSINESS RULES - Time Management
  
  /**
   * Avancer le temps du jeu
   */
  advanceTime(minutes: number): GameSession {
    return this.withAdvancedTime(minutes);
  }
  
  /**
   * Obtenir l'heure formatée
   */
  getFormattedTime(): string {
    const h = this._gameTime.hour.toString().padStart(2, '0');
    const m = this._gameTime.minute.toString().padStart(2, '0');
    return `Jour ${this._gameTime.day} - ${h}:${m}`;
  }
  
  /**
   * Obtenir la période de la journée
   */
  getTimeOfDay(): 'dawn' | 'day' | 'dusk' | 'night' {
    const hour = this._gameTime.hour;
    if (hour >= 5 && hour < 8) return 'dawn';
    if (hour >= 8 && hour < 18) return 'day';
    if (hour >= 18 && hour < 21) return 'dusk';
    return 'night';
  }
  
  // BUSINESS RULES - Flags Management
  
  /**
   * Définir un flag
   */
  setFlag(key: string, value: boolean | number | string): void {
    const oldValue = this._flags.get(key);
    this._flags.set(key, value);
    
    this._logger.game(`Flag set: ${key}`, { 
      oldValue, 
      newValue: value 
    });
  }
  
  /**
   * Obtenir un flag
   */
  getFlag(key: string): boolean | number | string | undefined {
    return this._flags.get(key);
  }
  
  /**
   * Vérifier si un flag existe et est vrai
   */
  hasFlag(key: string): boolean {
    const value = this._flags.get(key);
    return value === true;
  }
  
  /**
   * Obtenir tous les flags
   */
  getAllFlags(): GameFlags {
    const flags: GameFlags = {};
    for (const [key, value] of this._flags.entries()) {
      flags[key] = value;
    }
    return flags;
  }
  
  // BUSINESS RULES - Metrics
  
  /**
   * Incrémenter une métrique
   */
  incrementMetric(metric: keyof GameMetrics, amount: number = 1): GameSession {
    const updates = {
      [metric]: this._metrics[metric] + amount
    };
    return this.withUpdatedMetrics(updates);
  }
  
  // BUSINESS RULES - Party Management
  
  /**
   * Retourne une nouvelle GameSession avec un compagnon ajouté
   * Respecte le principe d'immutabilité - Règle #2 ARCHITECTURE_GUIDELINES.md
   */
  public withAddedCompanion(companion: Character): GameSession {
    // Vérifier si le compagnon existe déjà
    if (this._companions.find(c => c.id === companion.id)) {
      return this; // Pas de changement, retourner la même instance
    }

    // Créer un nouveau tableau de compagnons sans mutation
    const newCompanions = [...this._companions, companion];

    // Créer une nouvelle instance avec le nouveau compagnon
    const newSession = new GameSession(
      this._sessionId,
      this._playerCharacter,
      this._logger,
      this._currentSceneId,
      this._difficulty
    );

    // Copier l'état immutable
    (newSession as any)._createdAt = this._createdAt;
    (newSession as any)._lastSavedAt = this._lastSavedAt;
    (newSession as any)._currentPhase = this._currentPhase;
    (newSession as any)._gameTime = { ...this._gameTime };
    (newSession as any)._flags = new Map(this._flags);
    (newSession as any)._metrics = { ...this._metrics };
    (newSession as any)._sceneHistory = [...this._sceneHistory];
    (newSession as any)._companions = newCompanions; // ← Compagnons immutable
    (newSession as any)._autoSaveEnabled = this._autoSaveEnabled;
    (newSession as any)._autoSaveInterval = this._autoSaveInterval;

    this._logger.game(`Companion added: ${companion.name}`, { 
      companionId: companion.id,
      partySize: newCompanions.length + 1 
    });

    return newSession;
  }

  
  /**
   * Retourne une nouvelle GameSession avec un compagnon retiré
   * Respecte le principe d'immutabilité - Règle #2 ARCHITECTURE_GUIDELINES.md
   */
  public withRemovedCompanion(companionId: string): GameSession {
    const index = this._companions.findIndex(c => c.id === companionId);
    if (index === -1) {
      return this; // Compagnon non trouvé, retourner la même instance
    }

    const companion = this._companions[index];
    
    // Créer un nouveau tableau de compagnons sans le compagnon retiré (immutable)
    const newCompanions = this._companions.filter(c => c.id !== companionId);

    // Créer une nouvelle instance sans le compagnon
    const newSession = new GameSession(
      this._sessionId,
      this._playerCharacter,
      this._logger,
      this._currentSceneId,
      this._difficulty
    );

    // Copier l'état immutable
    (newSession as any)._createdAt = this._createdAt;
    (newSession as any)._lastSavedAt = this._lastSavedAt;
    (newSession as any)._currentPhase = this._currentPhase;
    (newSession as any)._gameTime = { ...this._gameTime };
    (newSession as any)._flags = new Map(this._flags);
    (newSession as any)._metrics = { ...this._metrics };
    (newSession as any)._sceneHistory = [...this._sceneHistory];
    (newSession as any)._companions = newCompanions; // ← Compagnons immutable
    (newSession as any)._autoSaveEnabled = this._autoSaveEnabled;
    (newSession as any)._autoSaveInterval = this._autoSaveInterval;

    this._logger.game(`Companion removed: ${companion.name}`, { 
      companionId,
      partySize: newCompanions.length + 1 
    });

    return newSession;
  }

  
  /**
   * Obtenir tous les personnages (joueur + compagnons)
   */
  getAllCharacters(): Character[] {
    return [this._playerCharacter, ...this._companions];
  }
  
  /**
   * Obtenir les personnages vivants
   */
  getAliveCharacters(): Character[] {
    return this.getAllCharacters().filter(c => c.isAlive);
  }
  
  // BUSINESS RULES - Save System
  
  /**
   * Marquer comme sauvegardé
   */
  markAsSaved(): GameSession {
    return this.withSavedTimestamp();
  }
  
  /**
   * Vérifier si la session a besoin d'être sauvegardée
   */
  needsSaving(): boolean {
    if (!this._lastSavedAt) return true;
    
    const timeSinceSave = Date.now() - this._lastSavedAt.getTime();
    const autoSaveThreshold = this._autoSaveInterval * 60 * 1000; // Convertir en millisecondes
    
    return timeSinceSave >= autoSaveThreshold;
  }
  
  /**
   * Obtenir les métadonnées de sauvegarde
   */
  getSaveMetadata(): SaveMetadata {
    return {
      saveId: this._sessionId,
      characterName: this._playerCharacter.name,
      lastSaved: this._lastSavedAt || this._createdAt,
      gameVersion: '2.6.0',
      currentSceneTitle: `Scene ${this._currentSceneId}`, // Sera enrichi plus tard avec le vrai titre
      totalPlayTime: this._metrics.timePlayedMinutes
    };
  }
  
  /**
   * Configurer la sauvegarde automatique
   */
  configureAutoSave(enabled: boolean, intervalMinutes: number = 5): GameSession {
    return this.withAutoSaveConfig(enabled, intervalMinutes);
  }
  
  // BUSINESS RULES - Game State Validation
  
  /**
   * Vérifier si la session de jeu est valide
   */
  isValid(): { valid: boolean; reasons: string[] } {
    const reasons: string[] = [];
    
    // Vérifier le personnage joueur
    if (!this._playerCharacter.isAlive) {
      reasons.push('Player character is dead');
    }
    
    // Vérifier l'ID de scène
    if (!this._currentSceneId || this._currentSceneId.trim().length === 0) {
      reasons.push('Invalid current scene ID');
    }
    
    // Vérifier les métriques
    if (this._metrics.timePlayedMinutes < 0) {
      reasons.push('Invalid play time');
    }
    
    return {
      valid: reasons.length === 0,
      reasons
    };
  }
  
  /**
   * Vérifier si le jeu est terminé
   */
  isGameOver(): boolean {
    return this._currentPhase === 'game_over' || 
           !this._playerCharacter.isAlive ||
           this.getAllCharacters().every(c => !c.isAlive);
  }
}

