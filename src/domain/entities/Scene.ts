/**
 * DOMAIN ENTITY - Scene
 * Pure business logic pour le système de scènes D&D
 */

import type { ILogger } from '../services/ILogger';

export type SceneType = 'text' | 'dialogue' | 'combat' | 'investigation' | 'merchant' | 'crafting' | 'puzzle' | 'dungeon';

export type Environment = 'indoor' | 'outdoor' | 'underground' | 'water' | 'sky';
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';
export type Safety = 'safe' | 'moderate' | 'dangerous' | 'deadly';
export type Lighting = 'bright' | 'dim' | 'dark';
export type Weather = 'clear' | 'rain' | 'snow' | 'storm' | 'fog';

export interface SceneMetadata {
  readonly environment?: Environment;
  readonly timeOfDay?: TimeOfDay;
  readonly safety: Safety;
  readonly lighting: Lighting;
  readonly weather?: Weather;
}

export interface SceneChoice {
  readonly id: string;
  readonly text: string;
  readonly targetSceneId: string;
  readonly conditions?: SceneCondition[];
  readonly effects?: SceneEffect[];
  readonly hidden?: boolean;
}

export interface SceneCondition {
  readonly type: 'item_possessed' | 'character_level' | 'quest_completed' | 'stat_minimum' | 'time_of_day' | 'scene_visited';
  readonly target: string;
  readonly value: number | string | boolean;
  readonly operator: 'equals' | 'greater' | 'less' | 'contains';
}

export interface SceneEffect {
  readonly type: 'add_item' | 'remove_item' | 'gain_xp' | 'change_hp' | 'add_buff' | 'advance_time';
  readonly target: string;
  readonly value: number | string;
  readonly duration?: number;
}

// Contenu spécialisé par type (pour l'instant juste TextContent)
export interface TextSceneContent {
  readonly text: string;
  readonly contextualSpells?: string[];
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly reasons: string[];
  readonly warnings?: string[];
}

/**
 * SCENE - Aggregate Root  
 * Représente une scène de jeu avec toutes ses règles et conditions
 */
export class Scene {
  private readonly _id: string;
  private readonly _type: SceneType;
  private readonly _title: string;
  private readonly _description: string;
  private readonly _metadata: SceneMetadata;
  private readonly _content: any; // Pour l'instant générique, sera typé plus tard
  private readonly _choices: SceneChoice[];
  private readonly _conditions: SceneCondition[];
  private readonly _effects: SceneEffect[];
  private readonly _logger: ILogger;

  constructor(
    id: string,
    type: SceneType,
    title: string,
    description: string,
    metadata: SceneMetadata,
    content: any,
    logger: ILogger,
    choices: SceneChoice[] = [],
    conditions: SceneCondition[] = [],
    effects: SceneEffect[] = []
  ) {
    this._id = id;
    this._type = type;
    this._title = title;
    this._description = description;
    this._metadata = metadata;
    this._content = content;
    this._choices = choices;
    this._conditions = conditions;
    this._effects = effects;
    this._logger = logger;

    this._logger.game(`Scene created: ${this._title}`, {
      id: this._id,
      type: this._type,
      choicesCount: this._choices.length
    });
  }

  // GETTERS (Pure)
  get id(): string { return this._id; }
  get type(): SceneType { return this._type; }
  get title(): string { return this._title; }
  get description(): string { return this._description; }
  get metadata(): SceneMetadata { return this._metadata; }
  get content(): any { return this._content; }
  get choices(): readonly SceneChoice[] { return this._choices; }
  get conditions(): readonly SceneCondition[] { return this._conditions; }
  get effects(): readonly SceneEffect[] { return this._effects; }

  // BUSINESS RULES (Pure Logic)

  /**
   * Vérifier si la scène peut être accédée selon les conditions
   */
  canAccess(gameState: any): ValidationResult {
    const failedConditions: string[] = [];
    const warnings: string[] = [];

    for (const condition of this._conditions) {
      const result = this.evaluateCondition(condition, gameState);
      if (!result.valid) {
        failedConditions.push(result.reason);
      }
      if (result.warning) {
        warnings.push(result.warning);
      }
    }

    const valid = failedConditions.length === 0;

    this._logger.game(`Scene access check: ${this._id}`, {
      valid,
      failedConditions: failedConditions.length,
      warnings: warnings.length
    });

    return {
      valid,
      reasons: failedConditions,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Obtenir les choix disponibles selon l'état du jeu
   */
  getAvailableChoices(gameState: any): SceneChoice[] {
    const availableChoices = this._choices.filter(choice => {
      // Vérifier si le choix est caché
      if (choice.hidden) {
        return false;
      }

      // Vérifier les conditions du choix
      if (choice.conditions) {
        for (const condition of choice.conditions) {
          const result = this.evaluateCondition(condition, gameState);
          if (!result.valid) {
            return false;
          }
        }
      }

      return true;
    });



    return availableChoices;
  }

  /**
   * Appliquer les effets de la scène
   */
  applyEffects(gameState: any): SceneEffect[] {
    this._logger.game(`Applying scene effects: ${this._id}`, {
      effectsCount: this._effects.length
    });

    // Pour l'instant, retourner les effets à appliquer
    // L'implémentation réelle sera dans le GameUseCase
    return [...this._effects];
  }

  /**
   * Obtenir les sorts contextuels selon le metadata
   */
  getContextualSpells(): string[] {
    const contextual: string[] = [];

    // Ajout de sorts selon l'environnement et conditions
    if (this._metadata.lighting === 'dark') {
      contextual.push('light', 'darkvision');
    }

    if (this._metadata.environment === 'water') {
      contextual.push('water_breathing', 'control_water');
    }

    if (this._metadata.weather === 'storm') {
      contextual.push('control_weather', 'protection_from_elements');
    }

    if (this._metadata.safety === 'dangerous' || this._metadata.safety === 'deadly') {
      contextual.push('detect_danger', 'protection', 'shield');
    }

    // Ajouter les sorts spécifiques au contenu si c'est un TextScene
    if (this._type === 'text' && this._content.contextualSpells) {
      contextual.push(...this._content.contextualSpells);
    }

    this._logger.game(`Contextual spells calculated: ${this._id}`, {
      spells: contextual
    });

    return contextual;
  }

  /**
   * Vérifier si la scène permet les repos
   */
  allowsResting(): { short: boolean; long: boolean } {
    const shortRest = this._metadata.safety === 'safe' || this._metadata.safety === 'moderate';
    const longRest = this._metadata.safety === 'safe';

    return { short: shortRest, long: longRest };
  }

  /**
   * Obtenir la description enrichie avec contexte
   */
  getEnrichedDescription(): string {
    let enriched = this._description;

    // Ajouter des détails selon le metadata
    const details: string[] = [];

    if (this._metadata.timeOfDay) {
      details.push(`Il fait ${this._metadata.timeOfDay}.`);
    }

    if (this._metadata.weather) {
      details.push(`Le temps est ${this._metadata.weather}.`);
    }

    if (this._metadata.lighting !== 'bright') {
      details.push(`L'éclairage est ${this._metadata.lighting}.`);
    }

    if (details.length > 0) {
      enriched += '\n\n' + details.join(' ');
    }

    return enriched;
  }

  /**
 * Obtenir le texte de la scene
 */
  getText(): string {
    let text = this._content.text
    return text;
  }
  // MÉTHODES PRIVÉES

  private evaluateCondition(condition: SceneCondition, gameState: any): { valid: boolean; reason: string; warning?: string } {
    const { type, target, value, operator } = condition;

    // Simuler l'évaluation des conditions (sera implémenté avec le vrai gameState)
    switch (type) {
      case 'character_level':
        // TODO: Implémenter avec vrai gameState
        return { valid: true, reason: `Level check: ${target} ${operator} ${value}` };

      case 'item_possessed':
        // TODO: Implémenter avec vrai gameState  
        return { valid: true, reason: `Item check: ${target}` };

      case 'time_of_day':
        const currentTime = this._metadata.timeOfDay;
        const valid = currentTime === value;
        return {
          valid,
          reason: `Time check: ${currentTime} ${operator} ${value}`,
          warning: !valid ? `Wrong time of day: expected ${value}, got ${currentTime}` : undefined
        };

      case 'scene_visited':
        // TODO: Implémenter avec vrai gameState
        return { valid: true, reason: `Scene visited check: ${target}` };

      default:
        return { valid: false, reason: `Unknown condition type: ${type}` };
    }
  }
}

