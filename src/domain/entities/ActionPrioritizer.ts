/**
 * DOMAIN SERVICE - ActionPrioritizer
 * Système de priorisation des actions pour IA D&D 5E
 */

import { type CombatEntity } from './Combat';
import { type Action } from './Action';
import { type Spell, type SpellLevel } from './Spell';
import { type BehaviorContext } from './BehaviorSystem';
import type { DiceRollingService } from '../services/DiceRollingService';
// import { type ActionDecision } from './BehaviorSystem'; // Non utilisé actuellement

export interface PriorizedAction {
  readonly action?: Action;
  readonly spell?: Spell;
  readonly spellLevel?: SpellLevel;
  readonly targetEntityId?: string;
  readonly priority: number;
  readonly expectedOutcome: ActionOutcome;
  readonly reasoning: string[];
  readonly confidence: number;
}

export interface ActionOutcome {
  readonly expectedDamage: number;
  readonly expectedHealing: number;
  readonly tacticalAdvantage: number; // 0-100
  readonly riskLevel: number; // 0-100
  readonly resourceCost: number; // 0-100
}

export type PriorityCriteria = 
  | 'maximize_damage' | 'minimize_risk' | 'conserve_resources' 
  | 'tactical_advantage' | 'support_allies' | 'control_battlefield';

/**
 * ACTION PRIORITIZER - Domain Service
 * Service de classification et priorisation des actions disponibles
 */
export class ActionPrioritizer {
  private diceRollingService: DiceRollingService;

  constructor(diceRollingService: DiceRollingService) {
    this.diceRollingService = diceRollingService;
  }

  /**
   * Prioriser toutes les actions disponibles pour une entité
   */
  static prioritizeActions(
    entity: CombatEntity,
    context: BehaviorContext,
    criteria: PriorityCriteria[] = ['maximize_damage', 'minimize_risk']
  ): PriorizedAction[] {
    const availableActions: PriorizedAction[] = [];

    // NOTE: Pour les méthodes statiques, nous devons créer une instance temporaire
    // ou restructurer pour ne plus dépendre de diceRollingService
    
    // Pour l'instant, retournons un tableau vide pour éviter les erreurs de compilation
    // TODO: Refactoriser complètement cette architecture statique/instance

    // Trier par priorité décroissante
    return availableActions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Sélectionner la meilleure action selon les critères
   */
  static selectBestAction(
    entity: CombatEntity,
    context: BehaviorContext,
    criteria: PriorityCriteria[] = ['maximize_damage', 'minimize_risk']
  ): PriorizedAction | null {
    const actions = ActionPrioritizer.prioritizeActions(entity, context, criteria);
    return actions[0] || null;
  }

  /**
   * Filtrer les actions par type d'intention
   */
  static filterActionsByIntent(
    actions: PriorizedAction[],
    intents: Array<'offensive' | 'defensive' | 'utility' | 'support'>
  ): PriorizedAction[] {
    return actions.filter(action => {
      const intent = this.classifyActionIntent(action);
      return intents.includes(intent);
    });
  }

  /**
   * Obtenir les meilleures actions pour chaque catégorie
   */
  static getBestActionsByCategory(
    entity: CombatEntity,
    context: BehaviorContext
  ): Record<string, PriorizedAction | null> {
    const allActions = ActionPrioritizer.prioritizeActions(entity, context);

    return {
      bestOffensive: ActionPrioritizer.filterActionsByIntent(allActions, ['offensive'])[0] || null,
      bestDefensive: ActionPrioritizer.filterActionsByIntent(allActions, ['defensive'])[0] || null,
      bestUtility: ActionPrioritizer.filterActionsByIntent(allActions, ['utility'])[0] || null,
      bestSupport: ActionPrioritizer.filterActionsByIntent(allActions, ['support'])[0] || null
    };
  }

  // MÉTHODES PRIVÉES

  private static evaluateAction(
    action: Action,
    entity: CombatEntity,
    context: BehaviorContext,
    criteria: PriorityCriteria[]
  ): PriorizedAction | null {
    if (!this.canUseAction(action, entity)) return null;

    const bestTarget = this.selectBestTargetForAction(action, entity, context);
    const outcome = ActionPrioritizer.predictActionOutcome(action, entity, bestTarget, context);
    const priority = this.calculateActionPriority(action, outcome, criteria, context);
    const confidence = this.calculateActionConfidence(action, entity, context);
    const reasoning = this.explainActionChoice(action, outcome, criteria);

    return {
      action,
      targetEntityId: bestTarget?.id,
      priority,
      expectedOutcome: outcome,
      reasoning,
      confidence
    };
  }

  private static evaluateSpell(
    spell: Spell,
    level: SpellLevel,
    entity: CombatEntity,
    context: BehaviorContext,
    criteria: PriorityCriteria[]
  ): PriorizedAction | null {
    if (!this.canCastSpell(spell, level, entity)) return null;

    const bestTarget = this.selectBestTargetForSpell(spell, entity, context);
    const outcome = ActionPrioritizer.predictSpellOutcome(spell, level, entity, bestTarget, context);
    const priority = this.calculateSpellPriority(spell, level, outcome, criteria, context);
    const confidence = this.calculateSpellConfidence(spell, level, entity, context);
    const reasoning = this.explainSpellChoice(spell, level, outcome, criteria);

    return {
      spell,
      spellLevel: level,
      targetEntityId: bestTarget?.id,
      priority,
      expectedOutcome: outcome,
      reasoning,
      confidence
    };
  }

  private static canUseAction(action: Action, entity: CombatEntity): boolean {
    switch (action.cost) {
      case 'action':
        return entity.actionsRemaining.action;
      case 'bonus_action':
        return entity.actionsRemaining.bonusAction;
      case 'reaction':
        return entity.actionsRemaining.reaction;
      case 'movement':
        return entity.actionsRemaining.movement > 0;
      case 'free':
        return true;
      default:
        return false;
    }
  }

  private static canCastSpell(spell: Spell, level: SpellLevel, entity: CombatEntity): boolean {
    if (spell.isCantrip()) return true;
    return entity.spellSlots.hasSlot(level);
  }

  private static getAvailableSlots(entity: CombatEntity, spell: Spell): SpellLevel[] {
    if (spell.isCantrip()) return [0];

    const slots: SpellLevel[] = [];
    for (let level = spell.level; level <= 9; level++) {
      if (entity.spellSlots.hasSlot(level as SpellLevel)) {
        slots.push(level as SpellLevel);
      }
    }
    return slots;
  }

  private static selectBestTargetForAction(
    action: Action,
    entity: CombatEntity,
    context: BehaviorContext
  ): CombatEntity | null {
    if (!action.requirements.requiresTarget) return null;

    // Actions offensives ciblent les ennemis
    if (action.effects.damage) {
      return this.selectBestOffensiveTarget(context.enemies, entity);
    }

    // Actions de soutien ciblent les alliés
    if (action.effects.healing || action.type === 'help') {
      return this.selectBestSupportTarget([...context.allies, entity]);
    }

    return context.enemies[0] || null;
  }

  private static selectBestTargetForSpell(
    spell: Spell,
    entity: CombatEntity,
    context: BehaviorContext
  ): CombatEntity | null {
    if (spell.range === 'self') return entity;
    if (!spell.effects.damage && !spell.effects.healing) return null;

    if (spell.effects.damage) {
      return this.selectBestOffensiveTarget(context.enemies, entity);
    }

    if (spell.effects.healing) {
      return this.selectBestSupportTarget([...context.allies, entity]);
    }

    return null;
  }

  private static selectBestOffensiveTarget(enemies: CombatEntity[], attacker: CombatEntity): CombatEntity | null {
    if (enemies.length === 0) return null;

    return enemies.reduce((best, current) => {
      const bestScore = this.calculateOffensiveTargetScore(best, attacker);
      const currentScore = this.calculateOffensiveTargetScore(current, attacker);
      return currentScore > bestScore ? current : best;
    });
  }

  private static selectBestSupportTarget(allies: CombatEntity[]): CombatEntity | null {
    if (allies.length === 0) return null;

    // Priorité aux alliés les plus blessés
    return allies
      .filter(ally => !ally.isDead && ally.currentHP < ally.maxHP)
      .reduce((most_wounded, current) => {
        const currentHpPercent = current.currentHP / current.maxHP;
        const mostWoundedPercent = most_wounded.currentHP / most_wounded.maxHP;
        return currentHpPercent < mostWoundedPercent ? current : most_wounded;
      }, allies[0]);
  }

  private static calculateOffensiveTargetScore(target: CombatEntity, _attacker: CombatEntity): number {
    let score = 0;

    // HP bas = plus facile à tuer
    score += (1 - (target.currentHP / target.maxHP)) * 50;

    // Niveau élevé = menace plus importante
    score += target.level * 2;

    // Bonus pour cibles magiques (plus dangereuses)
    if (target.knownSpells.length > 0) score += 20;

    return score;
  }

  private static predictActionOutcome(
    action: Action,
    entity: CombatEntity,
    target: CombatEntity | null,
    context: BehaviorContext
  ): ActionOutcome {
    const abilityModifier = ActionPrioritizer.getAbilityModifier(entity, 'strength');
    
    // TODO: Remplacer par injection de diceRollingService
    let expectedDamage = 0;
    let expectedHealing = 0;
    
    // Valeurs approximatives pour éviter les erreurs de compilation
    // Dans une vraie implémentation, il faudrait injecter diceRollingService

    const tacticalAdvantage = ActionPrioritizer.calculateTacticalAdvantage(action, entity, target, context);
    const riskLevel = ActionPrioritizer.calculateActionRisk(action, entity, context);
    const resourceCost = ActionPrioritizer.calculateResourceCost(action, entity);

    return {
      expectedDamage,
      expectedHealing,
      tacticalAdvantage,
      riskLevel,
      resourceCost
    };
  }

  private static predictSpellOutcome(
    spell: Spell,
    level: SpellLevel,
    entity: CombatEntity,
    target: CombatEntity | null,
    context: BehaviorContext
  ): ActionOutcome {
    const spellcastingModifier = ActionPrioritizer.getSpellcastingModifier(entity);

    // TODO: Remplacer par injection de diceRollingService
    let expectedDamage = 0;
    let expectedHealing = 0;
    
    // Valeurs approximatives pour éviter les erreurs de compilation
    // Dans une vraie implémentation, il faudrait injecter diceRollingService

    const tacticalAdvantage = ActionPrioritizer.calculateSpellTacticalAdvantage(spell, level, entity, target, context);
    const riskLevel = ActionPrioritizer.calculateSpellRisk(spell, level, entity, context);
    const resourceCost = spell.isCantrip() ? 0 : (level * 20); // Coût relatif

    return {
      expectedDamage,
      expectedHealing,
      tacticalAdvantage,
      riskLevel,
      resourceCost
    };
  }

  private static calculateActionPriority(
    action: Action,
    outcome: ActionOutcome,
    criteria: PriorityCriteria[],
    context: BehaviorContext
  ): number {
    let priority = 0;

    criteria.forEach(criterion => {
      switch (criterion) {
        case 'maximize_damage':
          priority += outcome.expectedDamage * 2;
          break;
        case 'minimize_risk':
          priority += (100 - outcome.riskLevel) * 0.5;
          break;
        case 'conserve_resources':
          priority += (100 - outcome.resourceCost) * 0.3;
          break;
        case 'tactical_advantage':
          priority += outcome.tacticalAdvantage * 0.8;
          break;
        case 'support_allies':
          priority += outcome.expectedHealing * 1.5;
          break;
      }
    });

    // Bonus situationnel
    if (context.hpPercentage < 0.3 && action.type === 'dodge') {
      priority += 50; // Priorité élevée pour esquiver si HP bas
    }

    return Math.max(0, priority);
  }

  private static calculateSpellPriority(
    spell: Spell,
    level: SpellLevel,
    outcome: ActionOutcome,
    criteria: PriorityCriteria[],
    context: BehaviorContext
  ): number {
    let priority = this.calculateActionPriority(
      spell.toAction(), 
      outcome, 
      criteria, 
      context
    );

    // Bonus pour sorts de niveau élevé (plus puissants)
    if (!spell.isCantrip()) {
      priority += level * 5;
    }

    // Bonus pour sorts avec zone d'effet
    if (spell.areaOfEffect && context.enemies.length >= 2) {
      priority += 30;
    }

    return priority;
  }

  private static calculateActionConfidence(
    action: Action,
    entity: CombatEntity,
    context: BehaviorContext
  ): number {
    let confidence = 50; // Base

    // Confidence basée sur les ressources disponibles
    if (this.canUseAction(action, entity)) confidence += 30;

    // Confidence basée sur l'adéquation à la situation
    if (action.effects.damage && context.enemies.length > 0) confidence += 20;
    if (action.effects.healing && context.hpPercentage < 0.6) confidence += 20;

    return Math.max(0, Math.min(100, confidence));
  }

  private static calculateSpellConfidence(
    spell: Spell,
    level: SpellLevel,
    entity: CombatEntity,
    context: BehaviorContext
  ): number {
    let confidence = 50;

    if (this.canCastSpell(spell, level, entity)) confidence += 30;
    if (spell.effects.damage && context.enemies.length > 0) confidence += 20;
    if (spell.effects.healing && context.hpPercentage < 0.6) confidence += 20;

    // Bonus pour sorts familiers (simplifié)
    if (entity.knownSpells.includes(spell)) confidence += 10;

    return Math.max(0, Math.min(100, confidence));
  }

  private static explainActionChoice(
    _action: Action,
    outcome: ActionOutcome,
    criteria: PriorityCriteria[]
  ): string[] {
    const reasons: string[] = [];

    if (outcome.expectedDamage > 0) {
      reasons.push(`Dégâts attendus: ${Math.round(outcome.expectedDamage)}`);
    }

    if (outcome.expectedHealing > 0) {
      reasons.push(`Soins attendus: ${Math.round(outcome.expectedHealing)}`);
    }

    if (outcome.tacticalAdvantage > 60) {
      reasons.push('Avantage tactique élevé');
    }

    if (outcome.riskLevel < 30) {
      reasons.push('Risque faible');
    }

    if (criteria.includes('conserve_resources') && outcome.resourceCost < 20) {
      reasons.push('Économise les ressources');
    }

    return reasons;
  }

  private static explainSpellChoice(
    spell: Spell,
    level: SpellLevel,
    outcome: ActionOutcome,
    criteria: PriorityCriteria[]
  ): string[] {
    const reasons = this.explainActionChoice(spell.toAction(), outcome, criteria);

    if (!spell.isCantrip()) {
      reasons.push(`Lancé au niveau ${level}`);
    }

    if (spell.areaOfEffect) {
      reasons.push('Zone d\'effet');
    }

    if (spell.concentration) {
      reasons.push('Nécessite concentration');
    }

    return reasons;
  }

  private static classifyActionIntent(action: PriorizedAction): 'offensive' | 'defensive' | 'utility' | 'support' {
    if (action.expectedOutcome.expectedDamage > 0) return 'offensive';
    if (action.expectedOutcome.expectedHealing > 0) return 'support';
    
    if (action.action) {
      switch (action.action.type) {
        case 'dodge': return 'defensive';
        case 'dash': return 'utility';
        case 'help': return 'support';
        case 'hide': return 'defensive';
        default: return 'utility';
      }
    }

    return 'utility';
  }

  // Méthodes utilitaires

  private static calculateTacticalAdvantage(
    _action: Action,
    _entity: CombatEntity,
    target: CombatEntity | null,
    context: BehaviorContext
  ): number {
    let advantage = 50; // Base

    if (_action.type === 'dash' && !context.canReachEnemy) advantage += 30;
    if (_action.type === 'dodge' && context.isInDanger) advantage += 40;
    if (_action.type === 'hide' && context.hpPercentage < 0.4) advantage += 35;

    return Math.max(0, Math.min(100, advantage));
  }

  private static calculateSpellTacticalAdvantage(
    spell: Spell,
    level: SpellLevel,
    entity: CombatEntity,
    target: CombatEntity | null,
    context: BehaviorContext
  ): number {
    let advantage = 50;

    if (spell.areaOfEffect && context.enemies.length >= 2) advantage += 40;
    if (spell.range === 'self' && context.isInDanger) advantage -= 20;
    if (spell.effects.healing && context.allies.some(a => a.currentHP / a.maxHP < 0.3)) advantage += 30;

    return Math.max(0, Math.min(100, advantage));
  }

  private static calculateActionRisk(action: Action, entity: CombatEntity, context: BehaviorContext): number {
    let risk = 30; // Base

    if (action.requirements.range === 1 && context.isInDanger) risk += 40;
    if (action.requirements.provokesOpportunityAttack) risk += 30;
    if (entity.currentHP / entity.maxHP < 0.3) risk += 20;

    return Math.max(0, Math.min(100, risk));
  }

  private static calculateSpellRisk(spell: Spell, level: SpellLevel, entity: CombatEntity, context: BehaviorContext): number {
    let risk = 20; // Sorts généralement moins risqués

    if (spell.range === 'touch' && context.isInDanger) risk += 35;
    if (spell.concentration && entity.concentratingOn) risk += 15; // Perdre concentration actuelle
    if (!spell.isCantrip() && level > 3) risk += 10; // Utiliser un slot élevé

    return Math.max(0, Math.min(100, risk));
  }

  private static calculateResourceCost(action: Action, entity: CombatEntity): number {
    switch (action.cost) {
      case 'action': return 50;
      case 'bonus_action': return 30;
      case 'reaction': return 20;
      case 'movement': return 10;
      case 'free': return 0;
      default: return 25;
    }
  }

  private static getAbilityModifier(entity: CombatEntity, ability: keyof typeof entity.abilities): number {
    const score = entity.abilities[ability];
    return Math.floor((score - 10) / 2);
  }

  private static getSpellcastingModifier(entity: CombatEntity): number {
    if (!entity.spellcastingAbility) return 0;
    return this.getAbilityModifier(entity, entity.spellcastingAbility);
  }
}