/**
 * DOMAIN ENTITY - Entity Component System (ECS)
 * Architecture modulaire pour tous les combattants
 */

import type { Weapon } from './Weapon';
import type { Spell, SpellSlots } from './Spell';
import type { Action } from './Action';
import type { Position, AbilityScores, ActionsRemaining } from '../types';

// Types de base ECS
export type EntityId = string;
export type ComponentType = string;

// Interface de base pour tous les composants
export interface Component {
  readonly type: ComponentType;
}

// ====== COMPOSANTS CORE ======

/**
 * Composant Statistiques - Données de base de l'entité
 */
export interface StatsComponent extends Component {
  readonly type: 'stats';
  readonly name: string;
  readonly level: number;
  readonly maxHP: number;
  readonly currentHP: number;
  readonly baseAC: number;
  readonly baseSpeed: number;
  readonly proficiencyBonus: number;
  readonly abilities: AbilityScores;
  readonly spellcastingAbility?: 'intelligence' | 'wisdom' | 'charisma';
}

/**
 * Composant Position - Emplacement tactique
 */
export interface PositionComponent extends Component {
  readonly type: 'position';
  readonly position: Position;
  readonly initiative: number;
}

/**
 * Composant Actions - Actions disponibles ce tour
 */
export interface ActionsComponent extends Component {
  readonly type: 'actions';
  readonly actionsRemaining: ActionsRemaining;
  readonly availableActions: Action[];
}

/**
 * Composant Statut - État de l'entité
 */
export interface StatusComponent extends Component {
  readonly type: 'status';
  readonly entityType: 'player' | 'ally' | 'enemy';
  readonly isActive: boolean;
  readonly isDead: boolean;
  readonly conditions: string[];
  readonly concentratingOn?: string;
}

// ====== COMPOSANTS ÉQUIPEMENT ======

/**
 * Composant Armes - Arsenal de combat
 */
export interface WeaponsComponent extends Component {
  readonly type: 'weapons';
  readonly weapons: Weapon[];
  readonly equippedWeaponIds: string[];
}

/**
 * Composant Sorts - Capacités magiques
 */
export interface SpellsComponent extends Component {
  readonly type: 'spells';
  readonly knownSpells: Spell[];
  readonly preparedSpells: string[];
  readonly spellSlots: SpellSlots;
}

// ====== COMPOSANTS IA ======

/**
 * Composant IA - Comportement intelligent
 */
export interface AIComponent extends Component {
  readonly type: 'ai';
  readonly behavior: 'aggressive' | 'defensive' | 'tactical' | 'cowardly';
  readonly preferredRange: 'melee' | 'ranged' | 'mixed';
  readonly aggroRadius: number;
  readonly currentTarget?: EntityId;
}

/**
 * Composant Joueur - Contrôle humain
 */
export interface PlayerComponent extends Component {
  readonly type: 'player';
  readonly isMainCharacter: boolean;
  readonly playerId: string;
}

// ====== ENTITÉ ECS ======

/**
 * Entité ECS - Collection de composants
 */
export interface ECSEntity {
  readonly id: EntityId;
  readonly components: ReadonlyMap<ComponentType, Component>;
}

/**
 * Utilitaires ECS
 */
export class ECSUtils {
  /**
   * Vérifier si une entité possède un composant
   */
  static hasComponent<T extends Component>(
    entity: ECSEntity, 
    componentType: ComponentType
  ): boolean {
    return entity.components.has(componentType);
  }

  /**
   * Récupérer un composant d'une entité
   */
  static getComponent<T extends Component>(
    entity: ECSEntity, 
    componentType: ComponentType
  ): T | null {
    return (entity.components.get(componentType) as T) || null;
  }

  /**
   * Créer une nouvelle entité avec des composants modifiés
   */
  static withComponent(
    entity: ECSEntity, 
    component: Component
  ): ECSEntity {
    const newComponents = new Map(entity.components);
    newComponents.set(component.type, component);
    
    return {
      ...entity,
      components: newComponents
    };
  }

  /**
   * Créer une nouvelle entité sans un composant
   */
  static withoutComponent(
    entity: ECSEntity, 
    componentType: ComponentType
  ): ECSEntity {
    const newComponents = new Map(entity.components);
    newComponents.delete(componentType);
    
    return {
      ...entity,
      components: newComponents
    };
  }
}

// ====== FACTORY PATTERNS ======

/**
 * Builder pour créer des entités ECS
 */
export class ECSEntityBuilder {
  private id: EntityId;
  private components: Map<ComponentType, Component> = new Map();

  constructor(id: EntityId) {
    this.id = id;
  }

  withStats(stats: Omit<StatsComponent, 'type'>): this {
    this.components.set('stats', { type: 'stats', ...stats });
    return this;
  }

  withPosition(position: Omit<PositionComponent, 'type'>): this {
    this.components.set('position', { type: 'position', ...position });
    return this;
  }

  withActions(actions: Omit<ActionsComponent, 'type'>): this {
    this.components.set('actions', { type: 'actions', ...actions });
    return this;
  }

  withStatus(status: Omit<StatusComponent, 'type'>): this {
    this.components.set('status', { type: 'status', ...status });
    return this;
  }

  withWeapons(weapons: Omit<WeaponsComponent, 'type'>): this {
    this.components.set('weapons', { type: 'weapons', ...weapons });
    return this;
  }

  withSpells(spells: Omit<SpellsComponent, 'type'>): this {
    this.components.set('spells', { type: 'spells', ...spells });
    return this;
  }

  withAI(ai: Omit<AIComponent, 'type'>): this {
    this.components.set('ai', { type: 'ai', ...ai });
    return this;
  }

  withPlayer(player: Omit<PlayerComponent, 'type'>): this {
    this.components.set('player', { type: 'player', ...player });
    return this;
  }

  build(): ECSEntity {
    return {
      id: this.id,
      components: new Map(this.components)
    };
  }
}