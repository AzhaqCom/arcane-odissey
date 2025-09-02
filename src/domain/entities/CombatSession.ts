/**
 * DOMAIN ENTITY - CombatSession (Aggregate Root)
 * Encapsule tout l'état et la logique d'une session de combat
 * Implémente l'Aggregate Pattern du Domain-Driven Design
 */

import { Combat, type CombatResult } from './Combat';
import { type Position } from '../types';

export interface CombatMetadata {
  readonly startedAt: Date;
  readonly totalTurns: number;
  readonly totalActions: number;
  readonly lastActionAt: Date;
}

export type CombatSessionState = 'active' | 'paused' | 'ended';

/**
 * CombatSession - Aggregate Root pour l'état complet d'un combat
 * Respecte la Constitution Architecturale - Règle #1 : Domain-Centric
 */
export class CombatSession {
  constructor(
    public readonly id: string,
    public readonly combat: Combat,
    public readonly sessionState: CombatSessionState,
    public readonly metadata: CombatMetadata
  ) {}

  /**
   * Factory method pour créer une nouvelle session
   */
  static create(combat: Combat): CombatSession {
    return new CombatSession(
      `session_${Date.now()}`,
      combat,
      'active',
      {
        startedAt: new Date(),
        totalTurns: 0,
        totalActions: 0,
        lastActionAt: new Date()
      }
    );
  }

  /**
   * Exécuter une action joueur - Domain Logic
   */
  executePlayerAction(action: (combat: Combat) => CombatResult): CombatSession {
    if (this.sessionState !== 'active') {
      throw new Error('Cannot execute action on inactive combat session');
    }

    const result = action(this.combat);
    
    return new CombatSession(
      this.id,
      result.newCombat,
      this.sessionState,
      this.updateMetadata()
    );
  }

  /**
   * Exécuter tour IA automatique - Domain Logic  
   */
  executeAutomaticAITurn(): CombatSession {
    if (this.sessionState !== 'active') {
      throw new Error('Cannot execute AI turn on inactive combat session');
    }

    const currentEntity = this.combat.getCurrentEntity();
    if (!currentEntity || currentEntity.type !== 'enemy') {
      return this; // Pas d'IA à jouer
    }

    const result = this.combat.executeCompleteAITurn();
    if (!result || !result.success) {
      // Si l'IA échoue, on avance quand même le tour pour éviter les blocages
      const advancedCombat = this.combat.withAdvancedTurn().withCheckedCombatEnd();
      return new CombatSession(
        this.id,
        advancedCombat,
        advancedCombat.phase === 'victory' || advancedCombat.phase === 'defeat' ? 'ended' : this.sessionState,
        this.updateMetadata()
      );
    }

    const newSessionState = this.determineSessionState(result.newCombat);

    return new CombatSession(
      this.id,
      result.newCombat,
      newSessionState,
      this.updateMetadata()
    );
  }

  /**
   * Avancer au tour suivant - Domain Logic
   */
  advanceToNextTurn(): CombatSession {
    if (this.sessionState !== 'active') {
      throw new Error('Cannot advance turn on inactive combat session');
    }

    const newCombat = this.combat.withAdvancedTurn().withCheckedCombatEnd();
    const newSessionState = this.determineSessionState(newCombat);

    return new CombatSession(
      this.id,
      newCombat,
      newSessionState,
      this.updateMetadataForTurnAdvance()
    );
  }

  /**
   * Effectuer un mouvement - Domain Logic
   */
  executeMovement(entityId: string, newPosition: Position): CombatSession {
    if (this.sessionState !== 'active') {
      throw new Error('Cannot execute movement on inactive combat session');
    }

    const result = this.combat.executeMovement(entityId, newPosition);
    
    return new CombatSession(
      this.id,
      result.newCombat,
      this.sessionState,
      this.updateMetadata()
    );
  }

  /**
   * Terminer la session manuellement
   */
  endSession(): CombatSession {
    return new CombatSession(
      this.id,
      this.combat,
      'ended',
      this.metadata
    );
  }

  /**
   * Vérifier si la session peut être jouée
   */
  canExecuteActions(): boolean {
    return this.sessionState === 'active';
  }

  /**
   * Obtenir l'entité courante via delegation au Combat
   */
  getCurrentEntity() {
    return this.combat.getCurrentEntity();
  }

  /**
   * Vérifier si c'est un tour IA
   */
  isAITurn(): boolean {
    const current = this.getCurrentEntity();
    return current?.type === 'enemy';
  }

  // ====== MÉTHODES PRIVÉES ======

  private updateMetadata(): CombatMetadata {
    return {
      ...this.metadata,
      totalActions: this.metadata.totalActions + 1,
      lastActionAt: new Date()
    };
  }

  private updateMetadataForTurnAdvance(): CombatMetadata {
    return {
      ...this.metadata,
      totalTurns: this.metadata.totalTurns + 1,
      totalActions: this.metadata.totalActions + 1,
      lastActionAt: new Date()
    };
  }

  private determineSessionState(combat: Combat): CombatSessionState {
    if (combat.phase === 'victory' || combat.phase === 'defeat') {
      return 'ended';
    }
    return this.sessionState;
  }
}