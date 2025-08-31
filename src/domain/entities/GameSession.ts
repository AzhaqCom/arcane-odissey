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
  changePhase(newPhase: GamePhase): void {
    const oldPhase = this._currentPhase;
    this._currentPhase = newPhase;
    
    this._logger.game(`Phase changed: ${oldPhase} -> ${newPhase}`, { 
      sessionId: this._sessionId,
      sceneId: this._currentSceneId
    });
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
   * Naviguer vers une nouvelle scène
   */
  navigateToScene(sceneId: string): void {
    if (this._currentSceneId !== sceneId) {
      this._sceneHistory.push(this._currentSceneId);
      this._currentSceneId = sceneId;
      this.incrementMetric('scenesVisited');
      
      // Limiter l'historique à 50 scènes pour éviter la surcharge
      if (this._sceneHistory.length > 50) {
        this._sceneHistory.shift();
      }
      
      this._logger.game(`Navigation to scene: ${sceneId}`, { 
        previousScene: this._sceneHistory[this._sceneHistory.length - 1],
        historyLength: this._sceneHistory.length
      });
    }
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
  advanceTime(minutes: number): void {
    const oldTime = { ...this._gameTime };
    this._gameTime = {
      ...this._gameTime,
      totalMinutes: this._gameTime.totalMinutes + minutes
    };
    
    // Recalculer jour/heure/minute
    const totalMinutesInDay = 24 * 60;
    const days = Math.floor(this._gameTime.totalMinutes / totalMinutesInDay);
    const remainingMinutes = this._gameTime.totalMinutes % totalMinutesInDay;
    const hours = Math.floor(remainingMinutes / 60);
    const mins = remainingMinutes % 60;
    
    this._gameTime = {
      totalMinutes: this._gameTime.totalMinutes,
      day: days + 1, // Les jours commencent à 1
      hour: hours,
      minute: mins
    };
    
    this._logger.game(`Time advanced: +${minutes}min`, {
      from: `Day ${oldTime.day} ${oldTime.hour}:${oldTime.minute.toString().padStart(2, '0')}`,
      to: `Day ${this._gameTime.day} ${this._gameTime.hour}:${this._gameTime.minute.toString().padStart(2, '0')}`
    });
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
  incrementMetric(metric: keyof GameMetrics, amount: number = 1): void {
    this._metrics = {
      ...this._metrics,
      [metric]: this._metrics[metric] + amount
    };
    
    this._logger.game(`Metric incremented: ${metric} +${amount}`, { 
      newValue: this._metrics[metric] 
    });
  }
  
  // BUSINESS RULES - Party Management
  
  /**
   * Ajouter un compagnon
   */
  addCompanion(companion: Character): void {
    if (!this._companions.find(c => c.id === companion.id)) {
      this._companions.push(companion);
      this._logger.game(`Companion added: ${companion.name}`, { 
        companionId: companion.id,
        partySize: this._companions.length + 1 
      });
    }
  }
  
  /**
   * Retirer un compagnon
   */
  removeCompanion(companionId: string): void {
    const index = this._companions.findIndex(c => c.id === companionId);
    if (index !== -1) {
      const companion = this._companions.splice(index, 1)[0];
      this._logger.game(`Companion removed: ${companion.name}`, { 
        companionId,
        partySize: this._companions.length + 1 
      });
    }
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
  markAsSaved(): void {
    this._lastSavedAt = new Date();
    this._logger.game(`Session saved: ${this._sessionId}`, { 
      savedAt: this._lastSavedAt.toISOString() 
    });
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
  configureAutoSave(enabled: boolean, intervalMinutes: number = 5): void {
    this._autoSaveEnabled = enabled;
    this._autoSaveInterval = Math.max(1, intervalMinutes); // Minimum 1 minute
    
    this._logger.game(`AutoSave configured`, { 
      enabled: this._autoSaveEnabled,
      interval: this._autoSaveInterval 
    });
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

