/**
 * DOMAIN SERVICE - ECS AI Decision Maker
 * Version ECS du moteur de décision IA
 */

import { 
  type ECSEntity,
  type StatsComponent,
  type PositionComponent,
  type ActionsComponent,
  type StatusComponent,
  type WeaponsComponent,
  type SpellsComponent,
  type AIComponent,
  ECSUtils
} from './ECS';
import { ECSCombatSystem } from '../systems/ECSCombatSystem';
import { type ActionDecision, type ActionIntent } from './BehaviorSystem';

export interface ECSAIContext {
  readonly entity: ECSEntity;
  readonly allEntities: readonly ECSEntity[];
  readonly allies: readonly ECSEntity[];
  readonly enemies: readonly ECSEntity[];
  readonly currentHP: number;
  readonly maxHP: number;
  readonly hpPercentage: number;
  readonly distanceToNearestEnemy: number;
  readonly distanceToNearestAlly: number;
  readonly isInDanger: boolean;
  readonly canReachEnemy: boolean;
  readonly hasRangedOptions: boolean;
  readonly hasSpells: boolean;
  readonly isLastAlly: boolean;
}

/**
 * AI Decision Maker pour ECS
 */
export class ECSAIDecisionMaker {
  
  /**
   * Décider de l'action optimale pour une entité ECS
   */
  decideAction(combatSystem: ECSCombatSystem, entityId: string): ActionDecision | null {
    const entity = combatSystem.getEntity(entityId);
    if (!entity) return null;

    // Vérifier que c'est une entité IA
    const aiComponent = ECSUtils.getComponent<AIComponent>(entity, 'ai');
    if (!aiComponent) return null;

    const context = this.buildECSAIContext(combatSystem, entity);

    // 1. Générer toutes les intentions possibles
    const intentions = this.generateAllIntentions(context);

    // 2. Scorer selon le comportement
    const scoredIntentions = intentions.map(intent => ({
      ...intent,
      priority: this.evaluateIntentPriority(intent.intent, context, aiComponent.behavior),
      confidence: this.calculateConfidence(intent, context)
    }));

    // 3. Filtrer les intentions viables
    const viableIntentions = scoredIntentions.filter(decision => 
      this.isDecisionViableECS(decision, context)
    );

    if (viableIntentions.length === 0) {
      return this.createFallbackDecision(context);
    }

    // 4. Sélectionner la meilleure
    const bestDecision = viableIntentions.reduce((best, current) => 
      (current.priority * current.confidence) > (best.priority * best.confidence) ? current : best
    );

    // 5. Enrichir avec détails d'exécution
    return this.enrichDecisionECS(bestDecision, context);
  }

  /**
   * Construire le contexte IA depuis les composants ECS
   */
  private buildECSAIContext(combatSystem: ECSCombatSystem, entity: ECSEntity): ECSAIContext {
    const stats = ECSUtils.getComponent<StatsComponent>(entity, 'stats')!;
    const position = ECSUtils.getComponent<PositionComponent>(entity, 'position')!;
    
    const allEntities = combatSystem.getLivingEntities();
    const allies = combatSystem.getAlliesOf(entity.id);
    const enemies = combatSystem.getEnemiesOf(entity.id);

    const entityPos = position.position;
    
    const distanceToNearestEnemy = enemies.length > 0 ? 
      Math.min(...enemies.map(e => {
        const ePos = ECSUtils.getComponent<PositionComponent>(e, 'position')!;
        return Math.abs(entityPos.x - ePos.position.x) + Math.abs(entityPos.y - ePos.position.y);
      })) : Infinity;

    const distanceToNearestAlly = allies.length > 0 ?
      Math.min(...allies.map(e => {
        const ePos = ECSUtils.getComponent<PositionComponent>(e, 'position')!;
        return Math.abs(entityPos.x - ePos.position.x) + Math.abs(entityPos.y - ePos.position.y);
      })) : Infinity;

    const hpPercentage = stats.currentHP / stats.maxHP;

    return Object.freeze({
      entity,
      allEntities: Object.freeze(allEntities),
      allies: Object.freeze(allies),
      enemies: Object.freeze(enemies),
      currentHP: stats.currentHP,
      maxHP: stats.maxHP,
      hpPercentage,
      distanceToNearestEnemy,
      distanceToNearestAlly,
      isInDanger: this.isEntityInDangerECS(entity, enemies, distanceToNearestEnemy),
      canReachEnemy: distanceToNearestEnemy <= stats.baseSpeed + 1,
      hasRangedOptions: this.hasRangedOptionsECS(entity),
      hasSpells: this.hasSpellsECS(entity),
      isLastAlly: allies.length <= 1
    });
  }

  /**
   * Générer toutes les intentions possibles
   */
  private generateAllIntentions(context: ECSAIContext): ActionDecision[] {
    const intentions: ActionDecision[] = [];

    // Intentions d'attaque
    if (context.enemies.length > 0) {
      intentions.push({ intent: 'attack_melee', priority: 0, confidence: 0, reasoning: 'Attaquer au corps à corps' });
      intentions.push({ intent: 'attack_ranged', priority: 0, confidence: 0, reasoning: 'Attaquer à distance' });
    }

    // Intentions de sorts
    if (context.hasSpells) {
      intentions.push({ intent: 'cast_damage', priority: 0, confidence: 0, reasoning: 'Lancer sort de dégâts' });
      if (context.hpPercentage < 0.7 || context.allies.some(a => {
        const stats = ECSUtils.getComponent<StatsComponent>(a, 'stats')!;
        return stats.currentHP / stats.maxHP < 0.5;
      })) {
        intentions.push({ intent: 'cast_heal', priority: 0, confidence: 0, reasoning: 'Lancer sort de soin' });
      }
    }

    // Intentions de mouvement
    intentions.push({ intent: 'move_closer', priority: 0, confidence: 0, reasoning: 'Se rapprocher' });
    intentions.push({ intent: 'move_away', priority: 0, confidence: 0, reasoning: 'S\'éloigner' });
    
    // Actions universelles (toujours disponibles)
    intentions.push({ intent: 'dodge', priority: 0, confidence: 0, reasoning: 'Esquiver' });
    intentions.push({ intent: 'dash', priority: 0, confidence: 0, reasoning: 'Se précipiter' });

    if (context.allies.length > 0) {
      intentions.push({ intent: 'help', priority: 0, confidence: 0, reasoning: 'Aider un allié' });
    }

    return intentions;
  }

  /**
   * Évaluer la priorité d'une intention selon le comportement
   */
  private evaluateIntentPriority(
    intent: ActionIntent, 
    context: ECSAIContext,
    behavior: 'aggressive' | 'defensive' | 'tactical' | 'cowardly'
  ): number {
    let priority = 50; // Base

    switch (behavior) {
      case 'aggressive':
        if (intent === 'attack_melee' || intent === 'attack_ranged') priority += 30;
        if (intent === 'move_closer') priority += 20;
        if (intent === 'dodge' || intent === 'move_away') priority -= 20;
        break;

      case 'defensive':
        if (intent === 'dodge' || intent === 'cast_heal') priority += 20;
        if (intent === 'attack_melee' || intent === 'move_closer') priority -= 10;
        break;

      case 'tactical':
        if (intent === 'attack_ranged' || intent === 'cast_damage') priority += 15;
        if (context.isInDanger && (intent === 'move_away' || intent === 'dodge')) priority += 25;
        break;

      case 'cowardly':
        if (intent === 'move_away' || intent === 'dodge') priority += 40;
        if (intent === 'attack_melee') priority -= 30;
        break;
    }

    return Math.max(0, Math.min(100, priority));
  }

  /**
   * Calculer la confiance dans une décision
   */
  private calculateConfidence(decision: ActionDecision, context: ECSAIContext): number {
    let confidence = 50;

    switch (decision.intent) {
      case 'attack_melee':
        confidence += context.canReachEnemy ? 30 : -40;
        confidence += context.isInDanger ? -20 : 10;
        break;

      case 'attack_ranged':
        confidence += context.hasRangedOptions ? 30 : -50;
        confidence += context.distanceToNearestEnemy > 2 ? 20 : -10;
        break;

      case 'cast_damage':
        confidence += context.hasSpells ? 40 : -60;
        break;

      case 'move_closer':
        confidence += !context.canReachEnemy ? 30 : -10;
        break;

      case 'move_away':
        confidence += context.isInDanger ? 40 : -20;
        break;

      case 'dodge':
        confidence += context.isInDanger ? 35 : -15;
        break;
    }

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Vérifier si une décision est viable avec ECS
   */
  private isDecisionViableECS(decision: ActionDecision, context: ECSAIContext): boolean {
    const actions = ECSUtils.getComponent<ActionsComponent>(context.entity, 'actions')!;

    switch (decision.intent) {
      case 'attack_melee':
      case 'attack_ranged':
        return actions.actionsRemaining.action && context.enemies.length > 0;

      case 'cast_damage':
      case 'cast_heal':
        return actions.actionsRemaining.action && context.hasSpells;

      case 'move_closer':
      case 'move_away':
        return actions.actionsRemaining.movement > 0;

      case 'dash':
      case 'dodge':
        return actions.actionsRemaining.action;

      case 'help':
        return actions.actionsRemaining.action && context.allies.length > 0;

      default:
        return false;
    }
  }

  /**
   * Enrichir la décision avec détails d'exécution
   */
  private enrichDecisionECS(decision: ActionDecision, context: ECSAIContext): ActionDecision {
    switch (decision.intent) {
      case 'attack_melee':
      case 'attack_ranged':
        // Choisir la cible la plus proche
        const nearestEnemy = context.enemies.reduce((nearest, current) => {
          const nearestPos = ECSUtils.getComponent<PositionComponent>(nearest, 'position')!;
          const currentPos = ECSUtils.getComponent<PositionComponent>(current, 'position')!;
          const entityPos = ECSUtils.getComponent<PositionComponent>(context.entity, 'position')!;
          
          const nearestDist = Math.abs(entityPos.position.x - nearestPos.position.x) + 
                            Math.abs(entityPos.position.y - nearestPos.position.y);
          const currentDist = Math.abs(entityPos.position.x - currentPos.position.x) + 
                            Math.abs(entityPos.position.y - currentPos.position.y);
          
          return currentDist < nearestDist ? current : nearest;
        });
        
        // Sélectionner la meilleure arme pour cette intention
        const weaponId = this.selectBestWeapon(context.entity, decision.intent);
        
        return {
          ...decision,
          targetEntityId: nearestEnemy.id,
          weaponId: weaponId
        };

      case 'dodge':
      case 'dash':
        // Actions universelles : pas d'arme ni de cible
        return {
          ...decision,
          weaponId: null
        };

      default:
        return decision;
    }
  }

  /**
   * Créer une décision de fallback
   */
  private createFallbackDecision(context: ECSAIContext): ActionDecision {
    const actions = ECSUtils.getComponent<ActionsComponent>(context.entity, 'actions')!;
    
    if (actions.actionsRemaining.action) {
      return {
        intent: 'dodge',
        priority: 10,
        confidence: 30,
        reasoning: 'Action de secours - esquive'
      };
    }

    return {
      intent: 'move_away',
      priority: 5,
      confidence: 20,
      reasoning: 'Mouvement de secours'
    };
  }

  // ====== MÉTHODES UTILITAIRES ECS ======

  private isEntityInDangerECS(entity: ECSEntity, enemies: readonly ECSEntity[], distanceToNearestEnemy: number): boolean {
    return distanceToNearestEnemy <= 2;
  }

  private hasRangedOptionsECS(entity: ECSEntity): boolean {
    const weapons = ECSUtils.getComponent<WeaponsComponent>(entity, 'weapons');
    return weapons?.weapons.some(weapon => weapon.category === 'ranged') || false;
  }

  /**
   * Sélectionner la meilleure arme selon l'intention
   */
  private selectBestWeapon(entity: ECSEntity, intent: ActionIntent): string | null {
    const weapons = ECSUtils.getComponent<WeaponsComponent>(entity, 'weapons');
    if (!weapons || weapons.weapons.length === 0) return null;

    switch (intent) {
      case 'attack_melee':
        // Chercher arme corps à corps la plus puissante
        const meleeWeapons = weapons.weapons.filter(w => w.category === 'melee');
        if (meleeWeapons.length === 0) return null;
        
        return meleeWeapons.reduce((best, current) => {
          const bestDamage = this.calculateWeaponDamageAverage(best);
          const currentDamage = this.calculateWeaponDamageAverage(current);
          return currentDamage > bestDamage ? current : best;
        }).id;

      case 'attack_ranged':
        // Chercher arme à distance avec meilleure portée
        const rangedWeapons = weapons.weapons.filter(w => w.category === 'ranged');
        if (rangedWeapons.length === 0) return null;
        
        return rangedWeapons.reduce((best, current) => {
          const bestRange = best.range?.normal || 0;
          const currentRange = current.range?.normal || 0;
          // Prioriser portée, puis dégâts en cas d'égalité
          if (currentRange > bestRange) return current;
          if (currentRange === bestRange) {
            const bestDamage = this.calculateWeaponDamageAverage(best);
            const currentDamage = this.calculateWeaponDamageAverage(current);
            return currentDamage > bestDamage ? current : best;
          }
          return best;
        }).id;

      default:
        // Pour actions universelles, pas d'arme nécessaire
        return null;
    }
  }

  /**
   * Calculer les dégâts moyens d'une arme
   */
  private calculateWeaponDamageAverage(weapon: any): number {
    // Parse dice string (ex: "1d8" -> 1 * (8+1)/2 = 4.5)
    const diceMatch = weapon.damage?.dice?.match(/(\d+)d(\d+)/);
    if (!diceMatch) return 1;
    
    const diceCount = parseInt(diceMatch[1]);
    const diceType = parseInt(diceMatch[2]);
    const averagePerDice = (diceType + 1) / 2;
    
    return diceCount * averagePerDice + (weapon.damage?.bonus || 0);
  }

  private hasSpellsECS(entity: ECSEntity): boolean {
    const spells = ECSUtils.getComponent<SpellsComponent>(entity, 'spells');
    return spells?.knownSpells.length > 0 || false;
  }
}