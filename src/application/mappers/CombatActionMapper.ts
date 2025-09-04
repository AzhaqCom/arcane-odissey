/**
 * APPLICATION MAPPER - CombatActionMapper
 * Conversion entre types d'actions de combat
 * Respecte ARCHITECTURE_GUIDELINES.md - Règle #4 Mappers explicites
 */

import type { CombatAction } from '../../domain/entities/CombatEngine';
import type { CombatTurnAction } from '../../domain/types/CombatContext';

/**
 * MAPPER POUR ACTIONS DE COMBAT
 * ✅ Respecte la Règle #4 - Mappers explicites pour conversion entre couches
 * ✅ Conversion bidirectionnelle entre ancien et nouveau système d'actions
 * ✅ Logique de mapping centralisée et réutilisable
 */
export class CombatActionMapper {
  /**
   * Convertir action legacy vers action unifiée
   * Mapping des anciens types d'actions vers le nouveau système unifié
   */
  static convertLegacyToUnified(legacyAction: CombatAction): CombatTurnAction | null {
    const baseAction: CombatTurnAction = {
      type: 'execute_turn',
      entityId: legacyAction.entityId
    };

    switch (legacyAction.type) {
      case 'move':
        // Action de mouvement seul
        return {
          ...baseAction,
          movement: legacyAction.position
        };

      case 'attack':
        // Action d'attaque seule
        return {
          ...baseAction,
          attackTarget: legacyAction.targetId
        };

      case 'move_and_attack':
        // Action combinée mouvement + attaque
        return {
          ...baseAction,
          movement: legacyAction.position,
          attackTarget: legacyAction.targetId
        };

      case 'defend':
        // Action défensive
        return {
          ...baseAction,
          defendPosition: true
        };

      case 'cast_spell':
        // Action de sort (mappé vers capacité spéciale)
        return {
          ...baseAction,
          useAbility: legacyAction.spellId,
          attackTarget: legacyAction.targetId // Sort offensif
        };

      case 'end_turn':
        // Action de fin de tour - retourner null car gérée séparément
        return null;

      default:
        // Type d'action non reconnu
        return null;
    }
  }

  /**
   * Convertir action unifiée vers action legacy
   * Conversion inverse pour compatibilité avec l'ancien système
   */
  static convertUnifiedToLegacy(unifiedAction: CombatTurnAction): CombatAction[] {
    const actions: CombatAction[] = [];
    const baseFields = {
      entityId: unifiedAction.entityId
    };

    // Décomposer l'action unifiée en actions legacy séparées
    
    // Mouvement d'abord
    if (unifiedAction.movement) {
      actions.push({
        ...baseFields,
        type: 'move',
        position: unifiedAction.movement
      });
    }

    // Puis attaque
    if (unifiedAction.attackTarget) {
      actions.push({
        ...baseFields,
        type: 'attack',
        targetId: unifiedAction.attackTarget
      });
    }

    // Ou capacité spéciale
    if (unifiedAction.useAbility) {
      actions.push({
        ...baseFields,
        type: 'cast_spell',
        spellId: unifiedAction.useAbility,
        targetId: unifiedAction.attackTarget
      });
    }

    // Ou position défensive
    if (unifiedAction.defendPosition) {
      actions.push({
        ...baseFields,
        type: 'defend'
      });
    }

    // Si aucune action spécifique, considérer comme fin de tour
    if (actions.length === 0) {
      actions.push({
        ...baseFields,
        type: 'end_turn'
      });
    }

    return actions;
  }

  /**
   * Détecter si une action legacy peut être combinée
   * Utilitaire pour optimiser les conversions
   */
  static canBeCombined(action1: CombatAction, action2: CombatAction): boolean {
    // Vérifier que c'est la même entité
    if (action1.entityId !== action2.entityId) {
      return false;
    }

    // Combinaisons valides : move + attack
    const isMoveAndAttack = 
      (action1.type === 'move' && action2.type === 'attack') ||
      (action1.type === 'attack' && action2.type === 'move');

    return isMoveAndAttack;
  }

  /**
   * Combiner deux actions legacy en une action unifiée
   * Pour optimiser les séquences d'actions du joueur
   */
  static combineActions(moveAction: CombatAction, attackAction: CombatAction): CombatTurnAction {
    if (moveAction.type !== 'move' || attackAction.type !== 'attack') {
      throw new Error('Can only combine move and attack actions');
    }

    if (moveAction.entityId !== attackAction.entityId) {
      throw new Error('Cannot combine actions from different entities');
    }

    return {
      type: 'execute_turn',
      entityId: moveAction.entityId,
      movement: moveAction.position,
      attackTarget: attackAction.targetId
    };
  }

  /**
   * Valider qu'une action legacy est bien formée
   * Contrôles de cohérence avant conversion
   */
  static validateLegacyAction(action: CombatAction): boolean {
    // Vérifications de base
    if (!action.entityId || !action.type) {
      return false;
    }

    // Vérifications spécifiques par type
    switch (action.type) {
      case 'move':
        return !!action.position;
      
      case 'attack':
        return !!action.targetId;
      
      case 'move_and_attack':
        return !!(action.position && action.targetId);
      
      case 'cast_spell':
        return !!action.spellId;
      
      case 'defend':
      case 'end_turn':
        return true; // Pas de paramètres requis
      
      default:
        return false;
    }
  }

  /**
   * Valider qu'une action unifiée est bien formée
   * Contrôles de cohérence avant utilisation
   */
  static validateUnifiedAction(action: CombatTurnAction): boolean {
    // Vérifications de base
    if (action.type !== 'execute_turn' || !action.entityId) {
      return false;
    }

    // Au moins une action doit être spécifiée
    const hasAnyAction = !!(
      action.movement || 
      action.attackTarget || 
      action.useAbility || 
      action.defendPosition
    );

    return hasAnyAction;
  }

  /**
   * Créer une action legacy de fin de tour
   * Utilitaire pour les cas où aucune action n'est possible
   */
  static createEndTurnAction(entityId: string): CombatAction {
    return {
      type: 'end_turn',
      entityId
    };
  }

  /**
   * Créer une action unifiée vide
   * Utilitaire pour les cas où l'entité ne fait rien
   */
  static createEmptyUnifiedAction(entityId: string): CombatTurnAction {
    return {
      type: 'execute_turn',
      entityId
    };
  }
}