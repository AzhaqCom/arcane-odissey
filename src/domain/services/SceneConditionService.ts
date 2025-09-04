/**
 * DOMAIN SERVICE - SceneConditionService
 * Évaluation des conditions de scène selon les règles métier
 * Respecte ARCHITECTURE_GUIDELINES.md - Règle #1 Domain est Roi
 */

import type { CombatPhase } from '../entities/CombatEngine';
import type { Character } from '../entities/Character';
import type { ILogger } from './ILogger';

export interface SceneCondition {
  readonly type: 'combat_result' | 'item_possessed' | 'character_level' | 'quest_completed' | 'stat_minimum' | 'time_of_day' | 'scene_visited';
  readonly target?: string;
  readonly value: number | string | boolean;
  readonly operator?: 'equals' | 'greater' | 'less' | 'contains';
}

export interface SceneChoice {
  readonly id: string;
  readonly text: string;
  readonly targetSceneId: string;
  readonly condition?: SceneCondition;
  readonly effects?: Array<{
    readonly type: string;
    readonly target: string;
    readonly value: string | number;
  }>;
}

/**
 * SERVICE DOMAIN - Évaluation des conditions de scène
 * Règle #1 : Toute logique métier (conditions, règles) dans Domain
 */
export class SceneConditionService {
  private logger: ILogger;

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  /**
   * Évaluer si une condition de scène est remplie
   * Logique métier pure - Règle #1
   */
  evaluateCondition(
    condition: SceneCondition,
    context: {
      combatPhase?: CombatPhase;
      character?: Character;
      inventory?: string[];
      visitedScenes?: string[];
      timeOfDay?: string;
    }
  ): boolean {
    this.logger.debug('SCENE_CONDITION_SERVICE', 'Evaluating condition', {
      conditionType: condition.type,
      conditionValue: condition.value,
      context: {
        hasCombatPhase: !!context.combatPhase,
        hasCharacter: !!context.character,
        inventorySize: context.inventory?.length || 0
      }
    });

    switch (condition.type) {
      case 'combat_result':
        return this.evaluateCombatResult(condition, context.combatPhase);
        
      case 'item_possessed':
        return this.evaluateItemPossessed(condition, context.inventory);
        
      case 'character_level':
        return this.evaluateCharacterLevel(condition, context.character);
        
      case 'quest_completed':
        // TODO: Implémenter système de quêtes
        this.logger.warn('SCENE_CONDITION_SERVICE', 'Quest system not implemented yet');
        return false;
        
      case 'stat_minimum':
        return this.evaluateStatMinimum(condition, context.character);
        
      case 'time_of_day':
        return this.evaluateTimeOfDay(condition, context.timeOfDay);
        
      case 'scene_visited':
        return this.evaluateSceneVisited(condition, context.visitedScenes);
        
      default:
        this.logger.error('SCENE_CONDITION_SERVICE', 'Unknown condition type', {
          type: condition.type
        });
        return false;
    }
  }

  /**
   * Évaluer les conditions de résultat de combat
   * Logique métier : victory/defeat/active
   */
  private evaluateCombatResult(condition: SceneCondition, combatPhase?: CombatPhase): boolean {
    if (!combatPhase) {
      this.logger.debug('SCENE_CONDITION_SERVICE', 'No combat phase provided for combat_result condition');
      return false;
    }

    const expectedResult = condition.value as string;
    const matches = combatPhase === expectedResult;

    this.logger.debug('SCENE_CONDITION_SERVICE', 'Combat result evaluation', {
      expectedResult,
      actualPhase: combatPhase,
      matches
    });

    return matches;
  }

  /**
   * Évaluer possession d'objet dans l'inventaire
   */
  private evaluateItemPossessed(condition: SceneCondition, inventory?: string[]): boolean {
    if (!inventory) return false;
    
    const itemId = condition.value as string;
    return inventory.includes(itemId);
  }

  /**
   * Évaluer niveau minimum du personnage
   */
  private evaluateCharacterLevel(condition: SceneCondition, character?: Character): boolean {
    if (!character) return false;
    
    const requiredLevel = condition.value as number;
    const operator = condition.operator || 'greater';
    
    switch (operator) {
      case 'equals':
        return character.level === requiredLevel;
      case 'greater':
        return character.level >= requiredLevel;
      case 'less':
        return character.level <= requiredLevel;
      default:
        return false;
    }
  }

  /**
   * Évaluer statistique minimum du personnage
   */
  private evaluateStatMinimum(condition: SceneCondition, character?: Character): boolean {
    if (!character) return false;
    
    const statName = condition.target as keyof Character['stats'];
    const requiredValue = condition.value as number;
    const currentValue = character.stats[statName];
    
    if (typeof currentValue !== 'number') return false;
    
    const operator = condition.operator || 'greater';
    
    switch (operator) {
      case 'equals':
        return currentValue === requiredValue;
      case 'greater':
        return currentValue >= requiredValue;
      case 'less':
        return currentValue <= requiredValue;
      default:
        return false;
    }
  }

  /**
   * Évaluer moment de la journée
   */
  private evaluateTimeOfDay(condition: SceneCondition, timeOfDay?: string): boolean {
    if (!timeOfDay) return false;
    
    const expectedTime = condition.value as string;
    return timeOfDay === expectedTime;
  }

  /**
   * Évaluer si une scène a été visitée
   */
  private evaluateSceneVisited(condition: SceneCondition, visitedScenes?: string[]): boolean {
    if (!visitedScenes) return false;
    
    const sceneId = condition.value as string;
    return visitedScenes.includes(sceneId);
  }

  /**
   * Filtrer les choix disponibles selon leurs conditions
   * Règle #1 : Logique de filtrage dans Domain
   */
  getAvailableChoices(
    choices: SceneChoice[],
    context: {
      combatPhase?: CombatPhase;
      character?: Character;
      inventory?: string[];
      visitedScenes?: string[];
      timeOfDay?: string;
    }
  ): SceneChoice[] {
    return choices.filter(choice => {
      if (!choice.condition) {
        return true; // Choix sans condition, toujours disponible
      }

      const isAvailable = this.evaluateCondition(choice.condition, context);
      
      this.logger.debug('SCENE_CONDITION_SERVICE', 'Choice availability check', {
        choiceId: choice.id,
        conditionType: choice.condition.type,
        isAvailable
      });

      return isAvailable;
    });
  }
}