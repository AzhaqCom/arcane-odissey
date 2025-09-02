/**
 * DOMAIN ENTITY - BehaviorSystem
 * Pure business logic pour IA comportementale D&D 5E
 */

import { type CombatEntity, type Combat } from './Combat';
import { type Action } from './Action';
import { type Spell, type SpellLevel } from './Spell';
import { type GridPosition } from './TacticalGrid';

export type BehaviorType = 
  | 'aggressive' | 'defensive' | 'tactical' | 'support' | 'coward'
  | 'berserker' | 'archer' | 'caster' | 'tank' | 'rogue' | 'healer';

export type ActionIntent = 
  | 'attack_melee' | 'attack_ranged' | 'cast_damage' | 'cast_heal' | 'cast_buff'
  | 'move_closer' | 'move_away' | 'take_cover' | 'flank' | 'protect_ally'
  | 'dash' | 'dodge' | 'hide' | 'help' | 'ready_action';

export interface BehaviorContext {
  readonly combat: Combat;
  readonly entity: CombatEntity;
  readonly allEntities: CombatEntity[];
  readonly allies: CombatEntity[];
  readonly enemies: CombatEntity[];
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

export interface ActionDecision {
  readonly intent: ActionIntent;
  readonly action?: Action;
  readonly spell?: Spell;
  readonly spellLevel?: SpellLevel;
  readonly targetEntityId?: string;
  readonly targetPosition?: GridPosition;
  readonly weaponId?: string | null; // ID de l'arme à utiliser pour les attaques
  readonly priority: number;
  readonly confidence: number;
  readonly reasoning: string;
}

/**
 * BEHAVIOR PATTERN - Value Object
 * Définit un pattern de comportement spécifique
 */
export class BehaviorPattern {
  private readonly _type: BehaviorType;
  private readonly _name: string;
  private readonly _description: string;
  private readonly _aggressiveness: number; // 0-10, 0 = très passif, 10 = très agressif
  private readonly _riskTolerance: number; // 0-10, 0 = très prudent, 10 = téméraire
  private readonly _teamwork: number; // 0-10, 0 = individualiste, 10 = très coopératif
  private readonly _preferredRange: 'melee' | 'ranged' | 'mixed';
  private readonly _hpThresholds: {
    retreat: number; // % HP pour fuir
    defensive: number; // % HP pour devenir défensif
    healing: number; // % HP pour chercher des soins
  };

  constructor(
    type: BehaviorType,
    name: string,
    description: string,
    aggressiveness: number,
    riskTolerance: number,
    teamwork: number,
    preferredRange: 'melee' | 'ranged' | 'mixed',
    hpThresholds = { retreat: 0.25, defensive: 0.5, healing: 0.6 }
  ) {
    this._type = type;
    this._name = name;
    this._description = description;
    this._aggressiveness = Math.max(0, Math.min(10, aggressiveness));
    this._riskTolerance = Math.max(0, Math.min(10, riskTolerance));
    this._teamwork = Math.max(0, Math.min(10, teamwork));
    this._preferredRange = preferredRange;
    this._hpThresholds = hpThresholds;
  }

  // GETTERS
  get type(): BehaviorType { return this._type; }
  get name(): string { return this._name; }
  get description(): string { return this._description; }
  get aggressiveness(): number { return this._aggressiveness; }
  get riskTolerance(): number { return this._riskTolerance; }
  get teamwork(): number { return this._teamwork; }
  get preferredRange(): 'melee' | 'ranged' | 'mixed' { return this._preferredRange; }
  get hpThresholds() { return { ...this._hpThresholds }; }

  // BUSINESS RULES

  /**
   * Évaluer la priorité d'une intention selon ce comportement
   */
  evaluateIntentPriority(intent: ActionIntent, context: BehaviorContext): number {
    let priority = 0;

    switch (intent) {
      case 'attack_melee':
        priority = this._aggressiveness * 10;
        if (this._preferredRange === 'melee') priority += 30;
        if (this._preferredRange === 'ranged') priority -= 20;
        if (context.hpPercentage < this._hpThresholds.defensive) priority -= 30;
        break;

      case 'attack_ranged':
        priority = this._aggressiveness * 8;
        if (this._preferredRange === 'ranged') priority += 30;
        if (this._preferredRange === 'melee') priority -= 10;
        break;

      case 'cast_damage':
        priority = this._aggressiveness * 9;
        if (context.hasSpells) priority += 20;
        break;

      case 'cast_heal':
        priority = (10 - this._aggressiveness) * 5;
        if (context.hpPercentage < this._hpThresholds.healing) priority += 50;
        if (this._teamwork > 6) priority += 20;
        break;

      case 'move_closer':
        priority = this._aggressiveness * 6;
        if (this._preferredRange === 'melee') priority += 25;
        if (context.distanceToNearestEnemy > 3) priority += 20;
        break;

      case 'move_away':
        priority = (10 - this._riskTolerance) * 8;
        if (context.hpPercentage < this._hpThresholds.defensive) priority += 40;
        if (this._preferredRange === 'ranged') priority += 15;
        break;

      case 'take_cover':
        priority = (10 - this._riskTolerance) * 6;
        if (context.isInDanger) priority += 30;
        break;

      case 'protect_ally':
        priority = this._teamwork * 8;
        if (context.isLastAlly) priority -= 50;
        break;

      case 'dash':
        priority = this._aggressiveness * 4;
        if (!context.canReachEnemy) priority += 25;
        break;

      case 'dodge':
        priority = (10 - this._riskTolerance) * 7;
        if (context.isInDanger) priority += 25;
        break;

      case 'hide':
        priority = (10 - this._aggressiveness) * 5;
        if (context.hpPercentage < this._hpThresholds.retreat) priority += 40;
        break;
    }

    return Math.max(0, Math.min(100, priority));
  }

  /**
   * Vérifier si ce comportement recommande la retraite
   */
  shouldRetreat(context: BehaviorContext): boolean {
    if (context.hpPercentage <= this._hpThresholds.retreat) {
      return this._riskTolerance < 8; // Les téméraires ne fuient presque jamais
    }

    if (context.isLastAlly && this._teamwork < 3) {
      return true; // Les individualistes fuient s'ils sont seuls
    }

    return false;
  }

  /**
   * Déterminer si l'entité devrait chercher des soins
   */
  needsHealing(context: BehaviorContext): boolean {
    return context.hpPercentage <= this._hpThresholds.healing;
  }

  /**
   * Déterminer si l'entité devrait adopter une posture défensive
   */
  shouldBeDefensive(context: BehaviorContext): boolean {
    return context.hpPercentage <= this._hpThresholds.defensive || 
           (context.isInDanger && this._riskTolerance < 6);
  }
}

/**
 * BEHAVIOR FACTORY - Création des patterns prédéfinis D&D
 */
export class BehaviorPatternFactory {

  static createAggressive(): BehaviorPattern {
    return new BehaviorPattern(
      'aggressive',
      'Agressif',
      'Attaque constamment, prend des risques pour infliger des dégâts',
      9, 8, 4, 'melee',
      { retreat: 0.15, defensive: 0.30, healing: 0.40 }
    );
  }

  static createDefensive(): BehaviorPattern {
    return new BehaviorPattern(
      'defensive',
      'Défensif',
      'Privilégie la survie, utilise couverture et sorts défensifs',
      3, 2, 7, 'ranged',
      { retreat: 0.40, defensive: 0.70, healing: 0.80 }
    );
  }

  static createTactical(): BehaviorPattern {
    return new BehaviorPattern(
      'tactical',
      'Tactique',
      'Équilibre attaque/défense, utilise positionnement et terrain',
      6, 5, 8, 'mixed',
      { retreat: 0.25, defensive: 0.50, healing: 0.65 }
    );
  }

  static createBerserker(): BehaviorPattern {
    return new BehaviorPattern(
      'berserker',
      'Berserker',
      'Attaque férocement au corps à corps, ignore la douleur',
      10, 10, 2, 'melee',
      { retreat: 0.05, defensive: 0.20, healing: 0.30 }
    );
  }

  static createArcher(): BehaviorPattern {
    return new BehaviorPattern(
      'archer',
      'Archer',
      'Maintient la distance, utilise attaques à distance',
      7, 4, 5, 'ranged',
      { retreat: 0.35, defensive: 0.60, healing: 0.70 }
    );
  }

  static createCaster(): BehaviorPattern {
    return new BehaviorPattern(
      'caster',
      'Lanceur de sorts',
      'Privilégie les sorts, évite le combat rapproché',
      6, 3, 6, 'ranged',
      { retreat: 0.40, defensive: 0.65, healing: 0.75 }
    );
  }

  static createTank(): BehaviorPattern {
    return new BehaviorPattern(
      'tank',
      'Tank',
      'Protège les alliés, absorbe les dégâts, contrôle le champ de bataille',
      5, 6, 9, 'melee',
      { retreat: 0.20, defensive: 0.40, healing: 0.60 }
    );
  }

  static createHealer(): BehaviorPattern {
    return new BehaviorPattern(
      'healer',
      'Soigneur',
      'Se concentre sur le soin et le soutien des alliés',
      2, 2, 10, 'ranged',
      { retreat: 0.50, defensive: 0.80, healing: 0.90 }
    );
  }

  static createRogue(): BehaviorPattern {
    return new BehaviorPattern(
      'rogue',
      'Voleur',
      'Utilise furtivité et attaques sournoises, évite combat direct',
      7, 5, 3, 'melee',
      { retreat: 0.30, defensive: 0.55, healing: 0.65 }
    );
  }

  static createCoward(): BehaviorPattern {
    return new BehaviorPattern(
      'coward',
      'Lâche',
      'Évite le combat, fuit au premier signe de danger',
      1, 1, 2, 'ranged',
      { retreat: 0.60, defensive: 0.85, healing: 0.95 }
    );
  }

  static createSupport(): BehaviorPattern {
    return new BehaviorPattern(
      'support',
      'Soutien',
      'Aide les alliés avec buffs et contrôle, évite combat direct',
      3, 3, 9, 'ranged',
      { retreat: 0.45, defensive: 0.70, healing: 0.80 }
    );
  }

  /**
   * Obtenir tous les patterns de comportement disponibles
   */
  static getAllBehaviorPatterns(): BehaviorPattern[] {
    return [
      this.createAggressive(),
      this.createDefensive(),
      this.createTactical(),
      this.createBerserker(),
      this.createArcher(),
      this.createCaster(),
      this.createTank(),
      this.createHealer(),
      this.createRogue(),
      this.createCoward(),
      this.createSupport()
    ];
  }

  /**
   * Créer un pattern adapté au type d'entité
   */
  static createForEntityType(entityType: string): BehaviorPattern {
    const lowerType = entityType.toLowerCase();

    if (lowerType.includes('gobelin') || lowerType.includes('goblin')) {
      return this.createAggressive();
    }
    if (lowerType.includes('archer') || lowerType.includes('bowman')) {
      return this.createArcher();
    }
    if (lowerType.includes('wizard') || lowerType.includes('mage')) {
      return this.createCaster();
    }
    if (lowerType.includes('cleric') || lowerType.includes('priest')) {
      return this.createHealer();
    }
    if (lowerType.includes('fighter') || lowerType.includes('warrior')) {
      return this.createTactical();
    }
    if (lowerType.includes('rogue') || lowerType.includes('assassin')) {
      return this.createRogue();
    }
    if (lowerType.includes('barbarian') || lowerType.includes('berserker')) {
      return this.createBerserker();
    }
    if (lowerType.includes('paladin') || lowerType.includes('guardian')) {
      return this.createTank();
    }

    // Par défaut, comportement tactique
    return this.createTactical();
  }
}