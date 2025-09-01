/**
 * DOMAIN SERVICE - ThreatAssessment
 * Système d'évaluation des menaces pour IA D&D 5E
 */

import { type CombatEntity, Combat } from './Combat';
import { type Action } from './Action';
import { type Spell } from './Spell';
import { type GridPosition, TacticalGrid } from './TacticalGrid';

export interface ThreatAnalysis {
  readonly entityId: string;
  readonly entityName: string;
  readonly overallThreat: number; // 0-100, score global de menace
  readonly immediateThreat: number; // 0-100, menace pour ce tour
  readonly potentialThreat: number; // 0-100, menace sur plusieurs tours
  readonly components: ThreatComponent[];
  readonly recommendations: string[];
}

export interface ThreatComponent {
  readonly type: 'damage' | 'position' | 'abilities' | 'resources' | 'support';
  readonly value: number;
  readonly weight: number;
  readonly description: string;
}

export interface AreaThreat {
  readonly position: GridPosition;
  readonly threatLevel: number;
  readonly sources: Array<{
    entityId: string;
    contribution: number;
    reason: string;
  }>;
  readonly safetyScore: number; // 0-100, 0 = très dangereux, 100 = très sûr
}

export interface DefensiveAssessment {
  readonly entityId: string;
  readonly currentDefenses: {
    ac: number;
    hp: number;
    hpPercentage: number;
    cover: 'none' | 'half' | 'three_quarters' | 'full';
    conditions: string[];
  };
  readonly weaknesses: string[];
  readonly strengths: string[];
  readonly vulnerability: number; // 0-100
  readonly survivalChance: number; // 0-100
}

/**
 * THREAT ASSESSMENT - Domain Service
 * Analyse complète des menaces pour prise de décision tactique
 */
export class ThreatAssessment {

  /**
   * Analyser toutes les menaces pour une entité
   */
  analyzeThreat(combat: Combat, entityId: string, targetId: string): ThreatAnalysis {
    const entity = combat.entities.get(entityId);
    const target = combat.entities.get(targetId);
    
    if (!entity || !target) {
      return this.createEmptyThreatAnalysis(targetId);
    }

    const components = this.assessThreatComponents(combat, entity, target);
    const overallThreat = this.calculateOverallThreat(components);
    const immediateThreat = this.calculateImmediateThreat(combat, entity, target, components);
    const potentialThreat = this.calculatePotentialThreat(combat, entity, target, components);
    const recommendations = this.generateThreatRecommendations(combat, entity, target, components);

    return {
      entityId: targetId,
      entityName: target.name,
      overallThreat,
      immediateThreat,
      potentialThreat,
      components,
      recommendations
    };
  }

  /**
   * Évaluer les menaces dans une zone
   */
  assessAreaThreats(combat: Combat, centerPos: GridPosition, radius: number, perspective: CombatEntity): AreaThreat[] {
    const positions = combat.tacticalGrid.getPositionsInRadius(centerPos, radius);
    const enemies = Array.from(combat.entities.values())
      .filter(e => this.isEnemyOf(perspective, e) && !e.isDead);

    return positions.map(pos => {
      const threats = enemies.map(enemy => {
        const distance = combat.tacticalGrid.calculateDistance(
          pos,
          { x: enemy.position.x, y: enemy.position.y }
        );
        
        const contribution = this.calculatePositionalThreat(enemy, distance);
        const reason = this.describePositionalThreat(enemy, distance);

        return {
          entityId: enemy.id,
          contribution,
          reason
        };
      });

      const totalThreat = threats.reduce((sum, t) => sum + t.contribution, 0);
      const safetyScore = Math.max(0, 100 - totalThreat);

      return {
        position: pos,
        threatLevel: Math.min(100, totalThreat),
        sources: threats.filter(t => t.contribution > 0),
        safetyScore
      };
    }).sort((a, b) => b.threatLevel - a.threatLevel);
  }

  /**
   * Évaluer les défenses d'une entité
   */
  assessDefenses(combat: Combat, entityId: string): DefensiveAssessment {
    const entity = combat.entities.get(entityId);
    if (!entity) {
      return this.createEmptyDefensiveAssessment(entityId);
    }

    const enemies = Array.from(combat.entities.values())
      .filter(e => this.isEnemyOf(entity, e) && !e.isDead);

    const currentDefenses = {
      ac: entity.baseAC,
      hp: entity.currentHP,
      hpPercentage: entity.currentHP / entity.maxHP,
      cover: this.assessCoverLevel(combat, entity, enemies),
      conditions: [...entity.conditions]
    };

    const weaknesses = this.identifyWeaknesses(combat, entity, enemies);
    const strengths = this.identifyStrengths(combat, entity, enemies);
    const vulnerability = this.calculateVulnerability(combat, entity, enemies, currentDefenses);
    const survivalChance = this.calculateSurvivalChance(entity, enemies, vulnerability);

    return {
      entityId,
      currentDefenses,
      weaknesses,
      strengths,
      vulnerability,
      survivalChance
    };
  }

  /**
   * Identifier les cibles prioritaires
   */
  identifyPriorityTargets(combat: Combat, attackerId: string): Array<{ entityId: string; priority: number; reasoning: string[] }> {
    const attacker = combat.entities.get(attackerId);
    if (!attacker) return [];

    const enemies = Array.from(combat.entities.values())
      .filter(e => this.isEnemyOf(attacker, e) && !e.isDead);

    return enemies.map(enemy => {
      const priority = this.calculateTargetPriority(combat, attacker, enemy);
      const reasoning = this.explainTargetPriority(combat, attacker, enemy);

      return {
        entityId: enemy.id,
        priority,
        reasoning
      };
    }).sort((a, b) => b.priority - a.priority);
  }

  // MÉTHODES PRIVÉES

  private assessThreatComponents(combat: Combat, threat: CombatEntity, target: CombatEntity): ThreatComponent[] {
    const components: ThreatComponent[] = [];

    // Composant dégâts
    const damageComponent = this.assessDamageComponent(combat, threat, target);
    components.push(damageComponent);

    // Composant position
    const positionComponent = this.assessPositionComponent(combat, threat, target);
    components.push(positionComponent);

    // Composant capacités
    const abilitiesComponent = this.assessAbilitiesComponent(combat, threat, target);
    components.push(abilitiesComponent);

    // Composant ressources
    const resourcesComponent = this.assessResourcesComponent(combat, threat, target);
    components.push(resourcesComponent);

    // Composant soutien
    const supportComponent = this.assessSupportComponent(combat, threat, target);
    components.push(supportComponent);

    return components;
  }

  private assessDamageComponent(combat: Combat, threat: CombatEntity, target: CombatEntity): ThreatComponent {
    let damageScore = 0;

    // Évaluer dégâts potentiels des actions
    const damageActions = threat.availableActions.filter(action => action.effects.damage);
    if (damageActions.length > 0) {
      const maxDamage = Math.max(...damageActions.map(action => 
        action.calculateDamage(this.getAbilityModifier(threat, 'strength'), threat.proficiencyBonus)
      ));
      damageScore += Math.min(50, maxDamage);
    }

    // Évaluer dégâts potentiels des sorts
    const damageSpells = threat.knownSpells.filter(spell => spell.effects.damage);
    if (damageSpells.length > 0) {
      const highestSlot = threat.spellSlots.getHighestAvailableSlotLevel();
      if (highestSlot !== null && highestSlot > 0) {
        const maxSpellDamage = Math.max(...damageSpells.map(spell =>
          spell.calculateDamage(highestSlot, this.getSpellcastingModifier(threat), threat.proficiencyBonus)
        ));
        damageScore += Math.min(40, maxSpellDamage);
      }
    }

    return {
      type: 'damage',
      value: Math.min(100, damageScore),
      weight: 0.4, // 40% du score total
      description: `Potentiel de dégâts: ${damageScore}`
    };
  }

  private assessPositionComponent(combat: Combat, threat: CombatEntity, target: CombatEntity): ThreatComponent {
    const distance = combat.tacticalGrid.calculateDistance(
      { x: threat.position.x, y: threat.position.y },
      { x: target.position.x, y: target.position.y }
    );

    let positionScore = 0;

    // Plus proche = plus menaçant
    if (distance <= 1) positionScore += 30;
    else if (distance <= 3) positionScore += 20;
    else if (distance <= 5) positionScore += 10;

    // Vérifier ligne de vue
    if (combat.tacticalGrid.hasLineOfSight(
      { x: threat.position.x, y: threat.position.y },
      { x: target.position.x, y: target.position.y }
    )) {
      positionScore += 15;
    }

    // Flanquement ou avantage tactique
    if (this.hasFlankingAdvantage(combat, threat, target)) {
      positionScore += 25;
    }

    return {
      type: 'position',
      value: Math.min(100, positionScore),
      weight: 0.25,
      description: `Position tactique (distance: ${distance})`
    };
  }

  private assessAbilitiesComponent(threat: CombatEntity, target: CombatEntity): ThreatComponent {
    let abilitiesScore = 0;

    // Score basé sur le niveau
    abilitiesScore += threat.level * 5;

    // Bonus pour capacités spéciales (approximation)
    if (threat.knownSpells.length > 0) abilitiesScore += 20;
    if (threat.availableActions.length > 4) abilitiesScore += 15;

    // Conditions avantageuses
    const advantageousConditions = ['invisible', 'hasted', 'blessed'];
    threat.conditions.forEach(condition => {
      if (advantageousConditions.some(adv => condition.includes(adv))) {
        abilitiesScore += 10;
      }
    });

    return {
      type: 'abilities',
      value: Math.min(100, abilitiesScore),
      weight: 0.2,
      description: `Capacités et niveau (niveau ${threat.level})`
    };
  }

  private assessResourcesComponent(threat: CombatEntity, target: CombatEntity): ThreatComponent {
    let resourcesScore = 0;

    // HP restants
    resourcesScore += (threat.currentHP / threat.maxHP) * 30;

    // Actions disponibles
    if (threat.actionsRemaining.action) resourcesScore += 15;
    if (threat.actionsRemaining.bonusAction) resourcesScore += 10;
    if (threat.actionsRemaining.reaction) resourcesScore += 5;
    if (threat.actionsRemaining.movement > 0) resourcesScore += 10;

    // Emplacements de sorts
    const availableSlots = threat.spellSlots.getHighestAvailableSlotLevel();
    if (availableSlots !== null && availableSlots > 0) {
      resourcesScore += availableSlots * 5;
    }

    return {
      type: 'resources',
      value: Math.min(100, resourcesScore),
      weight: 0.1,
      description: `Ressources disponibles (HP: ${Math.round((threat.currentHP / threat.maxHP) * 100)}%)`
    };
  }

  private assessSupportComponent(combat: Combat, threat: CombatEntity, target: CombatEntity): ThreatComponent {
    let supportScore = 0;

    // Alliés à proximité qui peuvent aider
    const allies = Array.from(combat.entities.values())
      .filter(e => this.isAllyOf(threat, e) && !e.isDead);

    const nearbyAllies = allies.filter(ally => {
      const distance = combat.tacticalGrid.calculateDistance(
        { x: threat.position.x, y: threat.position.y },
        { x: ally.position.x, y: ally.position.y }
      );
      return distance <= 5;
    });

    supportScore += nearbyAllies.length * 15;

    // Bonus si des alliés peuvent flanquer
    const flankingAllies = nearbyAllies.filter(ally => 
      this.couldFlankWith(combat, threat, ally, target)
    );
    supportScore += flankingAllies.length * 10;

    return {
      type: 'support',
      value: Math.min(100, supportScore),
      weight: 0.05,
      description: `Soutien allié (${nearbyAllies.length} alliés proches)`
    };
  }

  private calculateOverallThreat(components: ThreatComponent[]): number {
    return components.reduce((total, component) => 
      total + (component.value * component.weight), 0
    );
  }

  private calculateImmediateThreat(combat: Combat, threat: CombatEntity, target: CombatEntity, components: ThreatComponent[]): number {
    const baseScore = this.calculateOverallThreat(components);
    
    // Facteur de distance pour menace immédiate
    const distance = combat.tacticalGrid.calculateDistance(
      { x: threat.position.x, y: threat.position.y },
      { x: target.position.x, y: target.position.y }
    );

    let immediateFactor = 1;
    if (distance <= 1) immediateFactor = 1.5;
    else if (distance <= 3) immediateFactor = 1.2;
    else if (distance > 10) immediateFactor = 0.3;

    return Math.min(100, baseScore * immediateFactor);
  }

  private calculatePotentialThreat(combat: Combat, threat: CombatEntity, target: CombatEntity, components: ThreatComponent[]): number {
    const baseScore = this.calculateOverallThreat(components);
    
    // Facteur de mobilité et ressources
    let potentialFactor = 1;
    
    if (threat.baseSpeed >= 6) potentialFactor += 0.2;
    if (threat.knownSpells.length > 3) potentialFactor += 0.3;
    if (threat.currentHP > threat.maxHP * 0.8) potentialFactor += 0.2;

    return Math.min(100, baseScore * potentialFactor);
  }

  private generateThreatRecommendations(combat: Combat, threat: CombatEntity, target: CombatEntity, components: ThreatComponent[]): string[] {
    const recommendations: string[] = [];

    const damageComponent = components.find(c => c.type === 'damage');
    const positionComponent = components.find(c => c.type === 'position');

    if (damageComponent && damageComponent.value > 70) {
      recommendations.push('Menace de dégâts élevée - priorité de neutralisation');
    }

    if (positionComponent && positionComponent.value > 60) {
      recommendations.push('Position tactique avantageuse - considérer repositionnement');
    }

    const distance = combat.tacticalGrid.calculateDistance(
      { x: threat.position.x, y: threat.position.y },
      { x: target.position.x, y: target.position.y }
    );

    if (distance <= 1) {
      recommendations.push('Contact immédiat - risque d\'attaques d\'opportunité');
    }

    if (threat.knownSpells.length > 0 && distance > 5) {
      recommendations.push('Lanceur de sorts à distance - approche ou couverture recommandée');
    }

    return recommendations;
  }

  // Méthodes utilitaires

  private createEmptyThreatAnalysis(entityId: string): ThreatAnalysis {
    return {
      entityId,
      entityName: 'Unknown',
      overallThreat: 0,
      immediateThreat: 0,
      potentialThreat: 0,
      components: [],
      recommendations: ['Entité non trouvée']
    };
  }

  private createEmptyDefensiveAssessment(entityId: string): DefensiveAssessment {
    return {
      entityId,
      currentDefenses: {
        ac: 10,
        hp: 0,
        hpPercentage: 0,
        cover: 'none',
        conditions: []
      },
      weaknesses: ['Entité non trouvée'],
      strengths: [],
      vulnerability: 100,
      survivalChance: 0
    };
  }

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

  private getAbilityModifier(entity: CombatEntity, ability: keyof typeof entity.abilities): number {
    const score = entity.abilities[ability];
    return Math.floor((score - 10) / 2);
  }

  private getSpellcastingModifier(entity: CombatEntity): number {
    if (!entity.spellcastingAbility) return 0;
    return this.getAbilityModifier(entity, entity.spellcastingAbility);
  }

  private assessCoverLevel(combat: Combat, entity: CombatEntity, enemies: CombatEntity[]): 'none' | 'half' | 'three_quarters' | 'full' {
    // Vérifier la couverture contre l'ennemi le plus proche
    if (enemies.length === 0) return 'none';

    const entityPos = { x: entity.position.x, y: entity.position.y };
    const closestEnemy = enemies.reduce((closest, enemy) => {
      const distance = combat.tacticalGrid.calculateDistance(
        entityPos, 
        { x: enemy.position.x, y: enemy.position.y }
      );
      const closestDistance = combat.tacticalGrid.calculateDistance(
        entityPos,
        { x: closest.position.x, y: closest.position.y }
      );
      return distance < closestDistance ? enemy : closest;
    });

    return combat.tacticalGrid.calculateCover(
      entityPos,
      { x: closestEnemy.position.x, y: closestEnemy.position.y }
    );
  }

  private identifyWeaknesses(combat: Combat, entity: CombatEntity, enemies: CombatEntity[]): string[] {
    const weaknesses: string[] = [];

    if (entity.currentHP < entity.maxHP * 0.3) {
      weaknesses.push('HP critique');
    }

    if (!entity.actionsRemaining.action && !entity.actionsRemaining.bonusAction) {
      weaknesses.push('Actions épuisées');
    }

    if (entity.conditions.some(c => c.includes('prone') || c.includes('stunned'))) {
      weaknesses.push('Conditions défavorables');
    }

    const surrounded = enemies.filter(enemy => {
      const distance = combat.tacticalGrid.calculateDistance(
        { x: entity.position.x, y: entity.position.y },
        { x: enemy.position.x, y: enemy.position.y }
      );
      return distance <= 2;
    }).length;

    if (surrounded >= 3) {
      weaknesses.push('Encerclé');
    }

    return weaknesses;
  }

  private identifyStrengths(combat: Combat, entity: CombatEntity, enemies: CombatEntity[]): string[] {
    const strengths: string[] = [];

    if (entity.currentHP > entity.maxHP * 0.8) {
      strengths.push('Pleine santé');
    }

    if (entity.knownSpells.length > 3) {
      strengths.push('Arsenal magique');
    }

    const cover = this.assessCoverLevel(entity, enemies);
    if (cover !== 'none') {
      strengths.push(`Couverture ${cover}`);
    }

    return strengths;
  }

  private calculateVulnerability(combat: Combat, entity: CombatEntity, enemies: CombatEntity[], defenses: any): number {
    let vulnerability = 50; // Base

    // HP bas augmente vulnérabilité
    vulnerability += (1 - defenses.hpPercentage) * 30;

    // Nombre d'ennemis proches
    const nearbyEnemies = enemies.filter(enemy => {
      const distance = combat.tacticalGrid.calculateDistance(
        { x: entity.position.x, y: entity.position.y },
        { x: enemy.position.x, y: enemy.position.y }
      );
      return distance <= 3;
    }).length;

    vulnerability += nearbyEnemies * 15;

    // Couverture réduit vulnérabilité
    switch (defenses.cover) {
      case 'half': vulnerability -= 10; break;
      case 'three_quarters': vulnerability -= 20; break;
      case 'full': vulnerability -= 40; break;
    }

    return Math.max(0, Math.min(100, vulnerability));
  }

  private calculateSurvivalChance(entity: CombatEntity, enemies: CombatEntity[], vulnerability: number): number {
    return Math.max(0, 100 - vulnerability);
  }

  private calculateTargetPriority(combat: Combat, attacker: CombatEntity, target: CombatEntity): number {
    let priority = 50;

    // HP bas = priorité haute (plus facile à tuer)
    priority += (1 - (target.currentHP / target.maxHP)) * 30;

    // Distance - plus proche = plus prioritaire
    const distance = combat.tacticalGrid.calculateDistance(
      { x: attacker.position.x, y: attacker.position.y },
      { x: target.position.x, y: target.position.y }
    );
    priority += Math.max(0, 20 - distance * 2);

    // Menace - plus dangereux = plus prioritaire
    const threatAnalysis = this.analyzeThreat(target.id, attacker.id);
    priority += threatAnalysis.overallThreat * 0.3;

    return Math.max(0, Math.min(100, priority));
  }

  private explainTargetPriority(combat: Combat, attacker: CombatEntity, target: CombatEntity): string[] {
    const reasons: string[] = [];

    const hpPercentage = target.currentHP / target.maxHP;
    if (hpPercentage < 0.3) reasons.push('Gravement blessé');
    else if (hpPercentage < 0.6) reasons.push('Blessé');

    const distance = combat.tacticalGrid.calculateDistance(
      { x: attacker.position.x, y: attacker.position.y },
      { x: target.position.x, y: target.position.y }
    );
    if (distance <= 2) reasons.push('À portée');
    else if (distance > 8) reasons.push('Éloigné');

    if (target.knownSpells.length > 0) reasons.push('Lanceur de sorts');
    if (target.level > attacker.level) reasons.push('Niveau supérieur');

    return reasons;
  }

  private calculatePositionalThreat(enemy: CombatEntity, distance: number): number {
    let threat = 0;

    // Menace basée sur proximité
    if (distance <= 1) threat += 40;
    else if (distance <= 2) threat += 25;
    else if (distance <= 5) threat += 10;

    // Menace basée sur capacités
    threat += this.estimateEntityDamage(enemy) * 0.5;

    return Math.min(100, threat);
  }

  private describePositionalThreat(enemy: CombatEntity, distance: number): string {
    if (distance <= 1) return `${enemy.name} au contact`;
    if (distance <= 2) return `${enemy.name} très proche`;
    if (distance <= 5) return `${enemy.name} à portée`;
    return `${enemy.name} distant`;
  }

  private hasFlankingAdvantage(combat: Combat, attacker: CombatEntity, target: CombatEntity): boolean {
    // Implémentation simplifiée - vérifie s'il y a un allié de l'autre côté
    const allies = Array.from(combat.entities.values())
      .filter(e => this.isAllyOf(attacker, e) && !e.isDead);

    const attackerPos = { x: attacker.position.x, y: attacker.position.y };
    const targetPos = { x: target.position.x, y: target.position.y };

    return allies.some(ally => {
      const allyPos = { x: ally.position.x, y: ally.position.y };
      const allyDistance = combat.tacticalGrid.calculateDistance(allyPos, targetPos);
      
      // L'allié doit être adjacent à la cible
      if (allyDistance > 1) return false;

      // Vérifier si l'attaquant et l'allié sont sur des côtés opposés
      const dx1 = attackerPos.x - targetPos.x;
      const dy1 = attackerPos.y - targetPos.y;
      const dx2 = allyPos.x - targetPos.x;
      const dy2 = allyPos.y - targetPos.y;

      // Si les directions sont opposées (produit scalaire négatif)
      return (dx1 * dx2 + dy1 * dy2) < 0;
    });
  }

  private couldFlankWith(combat: Combat, entity1: CombatEntity, entity2: CombatEntity, target: CombatEntity): boolean {
    const pos1 = { x: entity1.position.x, y: entity1.position.y };
    const pos2 = { x: entity2.position.x, y: entity2.position.y };
    const targetPos = { x: target.position.x, y: target.position.y };

    const distance1 = combat.tacticalGrid.calculateDistance(pos1, targetPos);
    const distance2 = combat.tacticalGrid.calculateDistance(pos2, targetPos);

    // Les deux doivent pouvoir atteindre la cible
    if (distance1 > entity1.baseSpeed + 1 || distance2 > entity2.baseSpeed + 1) {
      return false;
    }

    // Vérifier flanquement potentiel
    const dx1 = pos1.x - targetPos.x;
    const dy1 = pos1.y - targetPos.y;
    const dx2 = pos2.x - targetPos.x;
    const dy2 = pos2.y - targetPos.y;

    return (dx1 * dx2 + dy1 * dy2) < 0;
  }

  private estimateEntityDamage(entity: CombatEntity): number {
    // Estimation basique des dégâts moyens
    let damage = 4 + entity.level; // Base

    // Bonus pour actions de dégâts
    const damageActions = entity.availableActions.filter(a => a.effects.damage);
    if (damageActions.length > 0) {
      damage += damageActions.length * 2;
    }

    // Bonus pour sorts de dégâts
    const damageSpells = entity.knownSpells.filter(s => s.effects.damage);
    if (damageSpells.length > 0) {
      damage += damageSpells.length * 3;
    }

    return damage;
  }
}