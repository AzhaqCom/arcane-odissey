/**
 * DOMAIN ENTITY - Effects
 * Pure business logic, no dependencies
 */

export interface StatModifier {
  stat: 'force' | 'dexterite' | 'constitution' | 'intelligence' | 'sagesse' | 'charisme';
  modifier: number;
}

export interface CombatModifier {
  type: 'ac' | 'speed' | 'attackBonus' | 'damageBonus';
  value: number;
}

export interface EffectDuration {
  type: 'permanent' | 'combat' | 'timed' | 'scenes';
  value?: number; // Pour timed (minutes) ou scenes (nombre)
}

/**
 * EFFECT - Value Object
 */
export class Effect {
  readonly id: string;
  readonly sourceId: string; // ID du sort/item qui a créé l'effet
  readonly targetId: string;
  readonly name: string;
  readonly description: string;
  readonly duration: EffectDuration;
  readonly statModifiers: StatModifier[];
  readonly combatModifiers: CombatModifier[];
  readonly conditions: string[]; // paralysé, empoisonné, etc.
  
  private _remainingDuration: number;
  private _isActive: boolean = true;

  constructor(data: {
    id: string;
    sourceId: string;
    targetId: string;
    name: string;
    description: string;
    duration: EffectDuration;
    statModifiers?: StatModifier[];
    combatModifiers?: CombatModifier[];
    conditions?: string[];
  }) {
    this.id = data.id;
    this.sourceId = data.sourceId;
    this.targetId = data.targetId;
    this.name = data.name;
    this.description = data.description;
    this.duration = data.duration;
    this.statModifiers = data.statModifiers || [];
    this.combatModifiers = data.combatModifiers || [];
    this.conditions = data.conditions || [];
    
    this._remainingDuration = data.duration.value || 0;
  }

  // GETTERS
  get remainingDuration(): number { return this._remainingDuration; }
  get isActive(): boolean { return this._isActive; }
  get isExpired(): boolean { 
    return !this._isActive || (this.duration.type === 'timed' && this._remainingDuration <= 0);
  }

  /**
   * Faire avancer la durée de l'effet
   */
  advanceTime(minutes: number): void {
    if (this.duration.type === 'timed' && this._isActive) {
      this._remainingDuration -= minutes;
      if (this._remainingDuration <= 0) {
        this._isActive = false;
      }
    }
  }

  /**
   * Faire avancer d'une scène
   */
  advanceScene(): void {
    if (this.duration.type === 'scenes' && this._isActive) {
      this._remainingDuration--;
      if (this._remainingDuration <= 0) {
        this._isActive = false;
      }
    }
  }

  /**
   * Terminer le combat (pour effets de durée combat)
   */
  endCombat(): void {
    if (this.duration.type === 'combat') {
      this._isActive = false;
    }
  }

  /**
   * Forcer l'expiration de l'effet
   */
  expire(): void {
    this._isActive = false;
  }
}

/**
 * EFFECTS MANAGER - Aggregate Root
 * Gère tous les effets actifs
 */
export class EffectsManager {
  private _activeEffects = new Map<string, Effect>();
  private _effectsByTarget = new Map<string, Set<string>>();

  // GETTERS
  get allEffects(): ReadonlyMap<string, Effect> { return this._activeEffects; }

  /**
   * Ajouter un effet
   */
  addEffect(effect: Effect): void {
    this._activeEffects.set(effect.id, effect);
    
    // Indexer par cible
    if (!this._effectsByTarget.has(effect.targetId)) {
      this._effectsByTarget.set(effect.targetId, new Set());
    }
    this._effectsByTarget.get(effect.targetId)!.add(effect.id);
  }

  /**
   * Supprimer un effet
   */
  removeEffect(effectId: string): boolean {
    const effect = this._activeEffects.get(effectId);
    if (!effect) return false;

    this._activeEffects.delete(effectId);
    
    // Nettoyer l'index par cible
    const targetEffects = this._effectsByTarget.get(effect.targetId);
    if (targetEffects) {
      targetEffects.delete(effectId);
      if (targetEffects.size === 0) {
        this._effectsByTarget.delete(effect.targetId);
      }
    }

    return true;
  }

  /**
   * Obtenir tous les effets d'une cible
   */
  getEffectsForTarget(targetId: string): Effect[] {
    const effectIds = this._effectsByTarget.get(targetId);
    if (!effectIds) return [];

    return Array.from(effectIds)
      .map(id => this._activeEffects.get(id))
      .filter((effect): effect is Effect => effect !== undefined && effect.isActive);
  }

  /**
   * Calculer les modificateurs totaux pour une cible
   */
  getTotalModifiersForTarget(targetId: string): {
    statModifiers: Map<string, number>;
    combatModifiers: Map<string, number>;
    conditions: Set<string>;
  } {
    const effects = this.getEffectsForTarget(targetId);
    
    const statModifiers = new Map<string, number>();
    const combatModifiers = new Map<string, number>();
    const conditions = new Set<string>();

    effects.forEach(effect => {
      // Accumuler modificateurs de stats
      effect.statModifiers.forEach(mod => {
        const current = statModifiers.get(mod.stat) || 0;
        statModifiers.set(mod.stat, current + mod.modifier);
      });

      // Accumuler modificateurs de combat  
      effect.combatModifiers.forEach(mod => {
        const current = combatModifiers.get(mod.type) || 0;
        combatModifiers.set(mod.type, current + mod.value);
      });

      // Accumuler conditions
      effect.conditions.forEach(condition => {
        conditions.add(condition);
      });
    });

    return { statModifiers, combatModifiers, conditions };
  }

  /**
   * Faire avancer le temps pour tous les effets
   */
  advanceTime(minutes: number): string[] {
    let expiredEffects: string[] = [];

    this._activeEffects.forEach(effect => {
      effect.advanceTime(minutes);
      if (effect.isExpired) {
        expiredEffects = [...expiredEffects, effect.id];
      }
    });

    // Nettoyer les effets expirés
    expiredEffects.forEach(id => this.removeEffect(id));

    return expiredEffects;
  }

  /**
   * Faire avancer d'une scène pour tous les effets
   */
  advanceScene(): string[] {
    const expiredEffects: string[] = [];

    this._activeEffects.forEach(effect => {
      effect.advanceScene();
      if (effect.isExpired) {
        expiredEffects.push(effect.id);
      }
    });

    // Nettoyer les effets expirés
    expiredEffects.forEach(id => this.removeEffect(id));

    return expiredEffects;
  }

  /**
   * Terminer un combat (expire les effets de durée combat)
   */
  endCombat(): string[] {
    const expiredEffects: string[] = [];

    this._activeEffects.forEach(effect => {
      effect.endCombat();
      if (effect.isExpired) {
        expiredEffects.push(effect.id);
      }
    });

    // Nettoyer les effets expirés
    expiredEffects.forEach(id => this.removeEffect(id));

    return expiredEffects;
  }

  /**
   * Vérifier si une cible a une condition spécifique
   */
  hasCondition(targetId: string, condition: string): boolean {
    const modifiers = this.getTotalModifiersForTarget(targetId);
    return modifiers.conditions.has(condition);
  }

  /**
   * Nettoyer tous les effets expirés
   */
  cleanup(): string[] {
    const expiredEffects: string[] = [];

    this._activeEffects.forEach((effect, id) => {
      if (effect.isExpired) {
        expiredEffects.push(id);
      }
    });

    expiredEffects.forEach(id => this.removeEffect(id));

    return expiredEffects;
  }
}