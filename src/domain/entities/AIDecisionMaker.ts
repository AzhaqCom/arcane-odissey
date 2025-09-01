/**
 * DOMAIN SERVICE - AIDecisionMaker
 * Moteur de décision IA pour combat D&D 5E
 */

import { type CombatEntity, Combat } from './Combat';
import { type Action } from './Action';
import { type Spell, type SpellLevel } from './Spell';
import { type GridPosition, TacticalGrid } from './TacticalGrid';
import { 
  BehaviorPattern, 
  type BehaviorContext, 
  type ActionDecision, 
  type ActionIntent,
  BehaviorPatternFactory 
} from './BehaviorSystem';

export interface ThreatInfo {
  readonly entityId: string;
  readonly threatLevel: number; // 0-100
  readonly distance: number;
  readonly damage: number;
  readonly priority: number;
}

export interface PositionalAdvantage {
  readonly position: GridPosition;
  readonly score: number;
  readonly reasoning: string[];
  readonly coverLevel: 'none' | 'half' | 'three_quarters' | 'full';
  readonly distanceToEnemies: number[];
  readonly distanceToAllies: number[];
}

/**
 * AI DECISION MAKER - Domain Service
 * PHASE 3 - ACTION 3.2.1: Service stateless selon Gemini #3
 */
export class AIDecisionMaker {
  
  /**
   * PHASE 3 - ACTION 3.2.1: Décider de l'action optimale - stateless
   * @param combat - Instance de combat à analyser
   * @param entityId - ID de l'entité IA
   * @returns Décision d'action optimale
   */
  decideAction(combat: Combat, entityId: string): ActionDecision | null {
    const entity = combat.entities.get(entityId);
    if (!entity || entity.type === 'player') return null;

    const context = this.buildContext(combat, entity);
    const behaviorPattern = this.getBehaviorPattern(entity);

    // 1. Évaluer toutes les intentions possibles
    const intentions = this.generateAllIntentions(context);

    // 2. Scorer chaque intention selon le comportement
    const scoredIntentions = intentions.map(intent => ({
      ...intent,
      priority: behaviorPattern.evaluateIntentPriority(intent.intent, context),
      confidence: this.calculateConfidence(intent, context)
    }));

    // 3. Filtrer les intentions non-réalisables
    const viableIntentions = scoredIntentions.filter(decision => 
      this.isDecisionViable(decision, context)
    );

    if (viableIntentions.length === 0) {
      return this.createFallbackDecision(context);
    }

    // 4. Sélectionner la meilleure intention
    const bestDecision = viableIntentions.reduce((best, current) => 
      (current.priority * current.confidence) > (best.priority * best.confidence) ? current : best
    );

    // 5. Enrichir avec les détails d'exécution
    return this.enrichDecision(bestDecision, context);
  }

  /**
   * Évaluer toutes les menaces pour une entité
   */
  assessThreats(combat: Combat, entityId: string): ThreatInfo[] {
    const entity = combat.entities.get(entityId);
    if (!entity) return [];

    const enemies = Array.from(combat.entities.values())
      .filter(e => this.isEnemyOf(entity, e) && !e.isDead);

    return enemies.map(enemy => {
      const distance = combat.tacticalGrid.calculateDistance(
        { x: entity.position.x, y: entity.position.y },
        { x: enemy.position.x, y: enemy.position.y }
      );

      const damage = this.estimateEntityDamage(enemy);
      const threatLevel = this.calculateThreatLevel(enemy, distance, damage);
      const priority = this.calculateThreatPriority(enemy, entity, distance);

      return {
        entityId: enemy.id,
        threatLevel,
        distance,
        damage,
        priority
      };
    }).sort((a, b) => b.priority - a.priority);
  }

  /**
   * Évaluer les positions tactiques avantageuses
   */
  evaluatePositions(combat: Combat, entityId: string, maxRange: number = 3): PositionalAdvantage[] {
    const entity = combat.entities.get(entityId);
    if (!entity) return [];

    const currentPos = { x: entity.position.x, y: entity.position.y };
    const possiblePositions = combat.tacticalGrid.getPositionsInRadius(currentPos, maxRange);

    return possiblePositions
      .filter(pos => combat.tacticalGrid.isCellFree(pos))
      .map(pos => this.evaluatePosition(combat, pos, entity))
      .sort((a, b) => b.score - a.score);
  }

  // MÉTHODES PRIVÉES

  private buildContext(combat: Combat, entity: CombatEntity): BehaviorContext {
    const allEntities = Array.from(combat.entities.values()).filter(e => !e.isDead);
    const allies = allEntities.filter(e => this.isAllyOf(entity, e));
    const enemies = allEntities.filter(e => this.isEnemyOf(entity, e));

    const entityPos = { x: entity.position.x, y: entity.position.y };
    
    const distanceToNearestEnemy = enemies.length > 0 ? 
      Math.min(...enemies.map(e => combat.tacticalGrid.calculateDistance(entityPos, { x: e.position.x, y: e.position.y }))) : 
      Infinity;

    const distanceToNearestAlly = allies.length > 0 ?
      Math.min(...allies.map(e => combat.tacticalGrid.calculateDistance(entityPos, { x: e.position.x, y: e.position.y }))) :
      Infinity;

    const hpPercentage = entity.currentHP / entity.maxHP;

    return {
      combat,
      entity,
      allEntities,
      allies,
      enemies,
      currentHP: entity.currentHP,
      maxHP: entity.maxHP,
      hpPercentage,
      distanceToNearestEnemy,
      distanceToNearestAlly,
      isInDanger: this.isEntityInDanger(combat, entity, enemies),
      canReachEnemy: distanceToNearestEnemy <= entity.baseSpeed + 1,
      hasRangedOptions: this.hasRangedOptions(entity),
      hasSpells: entity.knownSpells.length > 0,
      isLastAlly: allies.length <= 1
    };
  }

  private getBehaviorPattern(entity: CombatEntity): BehaviorPattern {
    // Pour l'instant, on utilise le nom de l'entité pour déterminer le comportement
    // Dans une vraie implémentation, ce serait un attribut de l'entité
    return BehaviorPatternFactory.createForEntityType(entity.name);
  }

  private generateAllIntentions(context: BehaviorContext): ActionDecision[] {
    const intentions: ActionDecision[] = [];

    // Intentions d'attaque
    if (context.enemies.length > 0) {
      intentions.push({ intent: 'attack_melee', priority: 0, confidence: 0, reasoning: 'Attaque au corps à corps' });
      intentions.push({ intent: 'attack_ranged', priority: 0, confidence: 0, reasoning: 'Attaque à distance' });
      intentions.push({ intent: 'cast_damage', priority: 0, confidence: 0, reasoning: 'Sort offensif' });
    }

    // Intentions de mouvement
    intentions.push({ intent: 'move_closer', priority: 0, confidence: 0, reasoning: 'Se rapprocher des ennemis' });
    intentions.push({ intent: 'move_away', priority: 0, confidence: 0, reasoning: 'S\'éloigner du danger' });
    intentions.push({ intent: 'take_cover', priority: 0, confidence: 0, reasoning: 'Chercher une couverture' });
    
    if (context.allies.length > 0) {
      intentions.push({ intent: 'protect_ally', priority: 0, confidence: 0, reasoning: 'Protéger un allié' });
    }

    // Intentions de soutien
    if (context.hpPercentage < 0.7 || context.allies.some(a => a.currentHP / a.maxHP < 0.5)) {
      intentions.push({ intent: 'cast_heal', priority: 0, confidence: 0, reasoning: 'Soigner' });
    }

    // Intentions tactiques
    intentions.push({ intent: 'dash', priority: 0, confidence: 0, reasoning: 'Course' });
    intentions.push({ intent: 'dodge', priority: 0, confidence: 0, reasoning: 'Esquive' });
    intentions.push({ intent: 'hide', priority: 0, confidence: 0, reasoning: 'Se cacher' });
    
    if (context.allies.length > 0) {
      intentions.push({ intent: 'help', priority: 0, confidence: 0, reasoning: 'Aider un allié' });
    }

    return intentions;
  }

  private calculateConfidence(decision: ActionDecision, context: BehaviorContext): number {
    let confidence = 50; // Base

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
        confidence += context.entity.spellSlots.getHighestAvailableSlotLevel() !== null ? 20 : -30;
        break;

      case 'cast_heal':
        confidence += context.hasSpells ? 30 : -50;
        confidence += (context.hpPercentage < 0.5 || context.allies.some(a => a.currentHP / a.maxHP < 0.3)) ? 40 : -20;
        break;

      case 'move_closer':
        confidence += !context.canReachEnemy ? 30 : -10;
        confidence += context.isInDanger ? -30 : 10;
        break;

      case 'move_away':
        confidence += context.isInDanger ? 40 : -20;
        confidence += context.hpPercentage < 0.4 ? 30 : -10;
        break;

      case 'dodge':
        confidence += context.isInDanger ? 35 : -15;
        confidence += !context.entity.actionsRemaining.action ? -40 : 0;
        break;
    }

    return Math.max(0, Math.min(100, confidence));
  }

  private isDecisionViable(decision: ActionDecision, context: BehaviorContext): boolean {
    const entity = context.entity;

    switch (decision.intent) {
      case 'attack_melee':
      case 'attack_ranged':
        return entity.actionsRemaining.action && context.enemies.length > 0;

      case 'cast_damage':
      case 'cast_heal':
        return entity.actionsRemaining.action && 
               context.hasSpells && 
               entity.spellSlots.getHighestAvailableSlotLevel() !== null;

      case 'move_closer':
      case 'move_away':
      case 'take_cover':
        return entity.actionsRemaining.movement > 0;

      case 'dash':
        return entity.actionsRemaining.action;

      case 'dodge':
        return entity.actionsRemaining.action;

      case 'hide':
        return entity.actionsRemaining.action;

      case 'help':
        return entity.actionsRemaining.action && context.allies.length > 0;

      default:
        return true;
    }
  }

  private enrichDecision(decision: ActionDecision, context: BehaviorContext): ActionDecision {
    const entity = context.entity;

    switch (decision.intent) {
      case 'attack_melee':
      case 'attack_ranged':
        const target = this.selectBestTarget(context);
        return {
          ...decision,
          action: entity.availableActions.find(a => a.type === 'attack'),
          targetEntityId: target?.id,
          reasoning: `Attaquer ${target?.name || 'ennemi'}`
        };

      case 'cast_damage':
        const damageTarget = this.selectBestTarget(context);
        const damageSpell = this.selectBestDamageSpell(context.combat, entity);
        return {
          ...decision,
          spell: damageSpell?.spell,
          spellLevel: damageSpell?.level,
          targetEntityId: damageTarget?.id,
          reasoning: `Lancer ${damageSpell?.spell.name || 'sort'} sur ${damageTarget?.name || 'ennemi'}`
        };

      case 'cast_heal':
        const healTarget = this.selectBestHealTarget(context);
        const healSpell = this.selectBestHealSpell(context.combat, entity);
        return {
          ...decision,
          spell: healSpell?.spell,
          spellLevel: healSpell?.level,
          targetEntityId: healTarget?.id,
          reasoning: `Soigner ${healTarget?.name || 'allié'}`
        };

      case 'move_closer':
        const moveTarget = this.selectBestTarget(context);
        const movePos = this.findBestMovePosition(context.combat, entity, moveTarget, 'closer');
        return {
          ...decision,
          targetPosition: movePos || undefined,
          reasoning: `Se rapprocher de ${moveTarget?.name || 'ennemi'}`
        };

      case 'move_away':
        const fleePos = this.findBestMovePosition(context.combat, entity, null, 'away');
        return {
          ...decision,
          targetPosition: fleePos || undefined,
          reasoning: 'Fuir le danger'
        };

      default:
        return {
          ...decision,
          action: entity.availableActions.find(a => a.id === decision.intent.replace('_', ''))
        };
    }
  }

  private createFallbackDecision(context: BehaviorContext): ActionDecision {
    // En dernier recours, essayer de faire quelque chose d'utile
    if (context.entity.actionsRemaining.action) {
      return {
        intent: 'dodge',
        action: context.entity.availableActions.find(a => a.type === 'dodge'),
        priority: 10,
        confidence: 30,
        reasoning: 'Action de secours - esquive'
      };
    }

    return {
      intent: 'move_away',
      priority: 5,
      confidence: 20,
      reasoning: 'Aucune action viable - attendre'
    };
  }

  // Méthodes utilitaires

  private isEnemyOf(entity1: CombatEntity, entity2: CombatEntity): boolean {
    if (entity1.type === 'enemy') {
      return entity2.type === 'player' || entity2.type === 'ally';
    }
    return entity2.type === 'enemy';
  }

  private isAllyOf(entity1: CombatEntity, entity2: CombatEntity): boolean {
    if (entity1.type === 'enemy') {
      return entity2.type === 'enemy';
    }
    return entity2.type === 'player' || entity2.type === 'ally';
  }

  private isEntityInDanger(combat: Combat, entity: CombatEntity, enemies: CombatEntity[]): boolean {
    const entityPos = { x: entity.position.x, y: entity.position.y };
    
    return enemies.some(enemy => {
      const distance = combat.tacticalGrid.calculateDistance(
        entityPos, 
        { x: enemy.position.x, y: enemy.position.y }
      );
      return distance <= 2; // Danger si ennemi à portée de mêlée étendue
    });
  }

  private hasRangedOptions(entity: CombatEntity): boolean {
    return entity.availableActions.some(action => 
      action.requirements.range && action.requirements.range > 1
    ) || entity.knownSpells.some(spell => 
      spell.getRangeInCells() > 1
    );
  }

  private selectBestTarget(context: BehaviorContext): CombatEntity | null {
    if (context.enemies.length === 0) return null;

    // Priorité : HP bas, proche, dangereux
    return context.enemies.reduce((best, current) => {
      const bestScore = this.calculateTargetScore(context.combat, best, context.entity);
      const currentScore = this.calculateTargetScore(context.combat, current, context.entity);
      return currentScore > bestScore ? current : best;
    });
  }

  private calculateTargetScore(combat: Combat, target: CombatEntity, attacker: CombatEntity): number {
    const distance = combat.tacticalGrid.calculateDistance(
      { x: attacker.position.x, y: attacker.position.y },
      { x: target.position.x, y: target.position.y }
    );

    let score = 0;
    
    // HP bas = priorité haute
    score += (1 - (target.currentHP / target.maxHP)) * 50;
    
    // Proximité = priorité haute
    score += Math.max(0, 10 - distance) * 5;
    
    // Bonus pour cibles fragiles
    if (target.currentHP < target.maxHP * 0.3) score += 30;
    
    return score;
  }

  private selectBestDamageSpell(combat: Combat, entity: CombatEntity): { spell: Spell; level: SpellLevel } | null {
    const availableSpells = combat.getAvailableSpells(entity.id);
    const damageSpells = availableSpells.filter(item => 
      item.spell.effects.damage && item.availableLevels.length > 0
    );

    if (damageSpells.length === 0) return null;

    const bestSpell = damageSpells[0]; // Simplifié pour l'instant
    return {
      spell: bestSpell.spell,
      level: bestSpell.availableLevels[bestSpell.availableLevels.length - 1] // Plus haut niveau
    };
  }

  private selectBestHealSpell(combat: Combat, entity: CombatEntity): { spell: Spell; level: SpellLevel } | null {
    const availableSpells = combat.getAvailableSpells(entity.id);
    const healSpells = availableSpells.filter(item => 
      item.spell.effects.healing && item.availableLevels.length > 0
    );

    if (healSpells.length === 0) return null;

    const bestSpell = healSpells[0];
    return {
      spell: bestSpell.spell,
      level: bestSpell.availableLevels[0] // Plus bas niveau pour économiser les slots
    };
  }

  private selectBestHealTarget(context: BehaviorContext): CombatEntity | null {
    const needHealing = [...context.allies, context.entity]
      .filter(e => !e.isDead && e.currentHP < e.maxHP)
      .sort((a, b) => (a.currentHP / a.maxHP) - (b.currentHP / b.maxHP));

    return needHealing[0] || null;
  }

  private findBestMovePosition(
    combat: Combat,
    entity: CombatEntity, 
    target: CombatEntity | null, 
    intent: 'closer' | 'away'
  ): GridPosition | null {
    const currentPos = { x: entity.position.x, y: entity.position.y };
    const moveRange = Math.min(entity.actionsRemaining.movement, entity.baseSpeed);
    
    const possiblePositions = combat.tacticalGrid.getPositionsInRadius(currentPos, moveRange)
      .filter(pos => combat.tacticalGrid.isCellFree(pos));

    if (possiblePositions.length === 0) return null;

    if (!target) {
      // Mouvement défensif - chercher la position la plus sûre
      return possiblePositions.reduce((best, pos) => {
        const bestScore = this.evaluatePosition(combat, best, entity).score;
        const currentScore = this.evaluatePosition(combat, pos, entity).score;
        return currentScore > bestScore ? pos : best;
      });
    }

    const targetPos = { x: target.position.x, y: target.position.y };

    if (intent === 'closer') {
      return possiblePositions.reduce((best, pos) => {
        const bestDistance = combat.tacticalGrid.calculateDistance(best, targetPos);
        const currentDistance = combat.tacticalGrid.calculateDistance(pos, targetPos);
        return currentDistance < bestDistance ? pos : best;
      });
    } else {
      return possiblePositions.reduce((best, pos) => {
        const bestDistance = combat.tacticalGrid.calculateDistance(best, targetPos);
        const currentDistance = combat.tacticalGrid.calculateDistance(pos, targetPos);
        return currentDistance > bestDistance ? pos : best;
      });
    }
  }

  private evaluatePosition(combat: Combat, pos: GridPosition, entity: CombatEntity): PositionalAdvantage {
    const enemies = Array.from(combat.entities.values())
      .filter(e => this.isEnemyOf(entity, e) && !e.isDead);
    
    const allies = Array.from(combat.entities.values())
      .filter(e => this.isAllyOf(entity, e) && !e.isDead);

    const distanceToEnemies = enemies.map(e => 
      combat.tacticalGrid.calculateDistance(pos, { x: e.position.x, y: e.position.y })
    );
    
    const distanceToAllies = allies.map(e =>
      combat.tacticalGrid.calculateDistance(pos, { x: e.position.x, y: e.position.y })
    );

    let score = 50; // Base
    const reasoning: string[] = [];

    // Évaluer la sécurité
    const nearbyEnemies = distanceToEnemies.filter(d => d <= 2).length;
    if (nearbyEnemies === 0) {
      score += 20;
      reasoning.push('Position sûre');
    } else {
      score -= nearbyEnemies * 15;
      reasoning.push(`${nearbyEnemies} ennemis proches`);
    }

    // Évaluer le soutien allié
    const nearbyAllies = distanceToAllies.filter(d => d <= 3).length;
    score += nearbyAllies * 10;
    if (nearbyAllies > 0) {
      reasoning.push(`${nearbyAllies} alliés à proximité`);
    }

    return {
      position: pos,
      score: Math.max(0, Math.min(100, score)),
      reasoning,
      coverLevel: 'none', // Simplifié pour l'instant
      distanceToEnemies,
      distanceToAllies
    };
  }

  private calculateThreatLevel(enemy: CombatEntity, distance: number, damage: number): number {
    let threat = damage * 2; // Base sur les dégâts

    // Proximité augmente la menace
    if (distance <= 1) threat *= 2;
    else if (distance <= 3) threat *= 1.5;

    // HP élevés = plus menaçant
    threat *= (enemy.currentHP / enemy.maxHP);

    return Math.min(100, threat);
  }

  private calculateThreatPriority(enemy: CombatEntity, entity: CombatEntity, distance: number): number {
    let priority = this.calculateThreatLevel(enemy, distance, this.estimateEntityDamage(enemy));

    // Priorité plus haute pour ennemis blessés (plus faciles à finir)
    if (enemy.currentHP < enemy.maxHP * 0.3) priority += 30;

    // Priorité plus haute pour ennemis proches
    priority += Math.max(0, 20 - distance * 3);

    return priority;
  }

  private estimateEntityDamage(entity: CombatEntity): number {
    // Estimation basique des dégâts potentiels
    // Dans une vraie implémentation, analyser les actions/sorts disponibles
    return 8 + Math.floor(entity.level * 1.5);
  }
}