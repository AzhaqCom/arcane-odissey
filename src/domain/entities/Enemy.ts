/**
 * DOMAIN ENTITY - Enemy
 * Logique métier pure pour un ennemi, sans dépendances infrastructure.
 * Respecte ARCHITECTURE_GUIDELINES.md - Règle #2 Immutabilité
 */
import type { Stats, Position, DamageType } from '../types/core';
import type { DomainEnemyTemplate } from '../types/Enemy';
import type { CombatEntity } from './CombatEngine';
import type { AIProfile } from '../types/AIProfile';

/**
 * Classe Enemy immutable suivant le pattern de Character
 * Permet de créer plusieurs instances avec des IDs différents depuis un même template
 */
export class Enemy {
  public readonly id: string;
  public readonly name: string;
  public readonly templateId: string;
  public readonly level: number;
  public readonly stats: Stats;
  public readonly currentHP: number;
  public readonly maxHP: number;
  public readonly armorClass: number;
  public readonly speed: number;
  public readonly position?: Position;
  
  // Propriétés optionnelles
  public readonly challengeRating?: number;
  public readonly xpReward?: number;
  public readonly proficiencyBonus: number;
  public readonly resistances?: readonly DamageType[];
  public readonly vulnerabilities?: readonly DamageType[];
  public readonly immunities?: readonly DamageType[];
  
  // Équipement
  public readonly equipment?: {
    readonly weapons?: readonly string[];
    readonly armor?: readonly string[];
  };

  // IA et comportement - Nouveau système enrichi
  public readonly aiProfile: AIProfile;

  /**
   * Constructeur qui crée un Enemy depuis un template
   * @param id - ID unique pour cette instance d'ennemi (ex: "goblin_1", "goblin_2")
   * @param template - Template de base depuis les données
   * @param currentHP - HP actuels (optionnel, par défaut = maxHP)
   * @param position - Position sur la grille (optionnel)
   */
  constructor(
    id: string,
    template: DomainEnemyTemplate,
    currentHP?: number,
    position?: Position
  ) {
    this.id = id;
    this.name = template.name;
    this.templateId = template.id;
    this.level = template.level;
    this.stats = template.baseAbilities;
    this.maxHP = template.maxHp;
    this.currentHP = currentHP ?? template.maxHp;
    this.armorClass = template.armorClass;
    this.speed = template.speed;
    this.position = position;
    
    this.challengeRating = template.challengeRating;
    this.xpReward = template.xpReward;
    this.proficiencyBonus = template.proficiencyBonus ?? this.calculateProficiencyBonus();
    this.resistances = template.resistances;
    this.vulnerabilities = template.vulnerabilities;
    this.immunities = template.immunities;
    this.equipment = template.equipment;
    this.aiProfile = template.aiProfile;
  }

  /**
   * Calcul du bonus de maîtrise basé sur le CR ou level
   */
  private calculateProficiencyBonus(): number {
    const cr = this.challengeRating ?? this.level;
    if (cr <= 4) return 2;
    if (cr <= 8) return 3;
    if (cr <= 12) return 4;
    if (cr <= 16) return 5;
    if (cr <= 20) return 6;
    if (cr <= 24) return 7;
    if (cr <= 28) return 8;
    return 9;
  }

  /**
   * Calcul des modificateurs de stats (comme Character)
   */
  public getStatModifiers(): Record<keyof Stats, number> {
    const modifiers = {} as Record<keyof Stats, number>;
    for (const key in this.stats) {
      const statKey = key as keyof Stats;
      modifiers[statKey] = Math.floor((this.stats[statKey] - 10) / 2);
    }
    return modifiers;
  }

  // === MÉTHODES IMMUTABLES (PATTERN WITH...) ===

  /**
   * Met à jour les HP (retourne nouvelle instance)
   */
  withHP(newCurrentHP: number): Enemy {
    const clampedHP = Math.max(0, Math.min(this.maxHP, newCurrentHP));
    return new Enemy(
      this.id,
      this.toTemplate(),
      clampedHP,
      this.position
    );
  }

  /**
   * Met à jour la position (retourne nouvelle instance)
   */
  withPosition(newPosition: Position): Enemy {
    return new Enemy(
      this.id,
      this.toTemplate(),
      this.currentHP,
      newPosition
    );
  }

  /**
   * Inflige des dégâts (retourne nouvelle instance)
   */
  takeDamage(damage: number, damageType?: DamageType): Enemy {
    let finalDamage = damage;
    
    // Appliquer résistances/vulnérabilités si type de dégât spécifié
    if (damageType) {
      if (this.immunities?.includes(damageType)) {
        finalDamage = 0;
      } else if (this.resistances?.includes(damageType)) {
        finalDamage = Math.floor(damage / 2);
      } else if (this.vulnerabilities?.includes(damageType)) {
        finalDamage = damage * 2;
      }
    }
    
    return this.withHP(this.currentHP - finalDamage);
  }

  /**
   * Soigne l'ennemi (retourne nouvelle instance)
   */
  heal(healAmount: number): Enemy {
    return this.withHP(this.currentHP + healAmount);
  }

  // === GETTERS PURS ===

  get isAlive(): boolean {
    return this.currentHP > 0;
  }

  get isDead(): boolean {
    return this.currentHP <= 0;
  }

  getHealthPercentage(): number {
    return Math.max(0, Math.min(100, (this.currentHP / this.maxHP) * 100));
  }

  getHealthStatus(): 'healthy' | 'wounded' | 'critical' | 'dead' {
    if (this.currentHP <= 0) return 'dead';
    const percentage = this.getHealthPercentage();
    if (percentage <= 25) return 'critical';
    if (percentage <= 50) return 'wounded';
    return 'healthy';
  }

  // === CONVERSION VERS COMBATENTITY ===

  /**
   * ÉTAPE 1.3 - Conversion Enemy vers CombatEntity
   * Permet d'intégrer l'ennemi dans le système de combat
   */
  toCombatEntity(): CombatEntity {
    return {
      id: this.id,
      name: this.name,
      type: 'enemy',
      level: this.level,
      hitPoints: this.currentHP,
      maxHitPoints: this.maxHP,
      armorClass: this.armorClass,
      speed: this.speed,
      initiative: 0, // Sera calculé au début du combat
      stats: this.stats,
      position: this.position || { x: 0, y: 0 },
      isActive: true,
      isDead: this.isDead,
      actionsRemaining: {
        action: true,
        bonusAction: true,
        reaction: true,
        movement: this.speed * 5, // Convertir cases → pieds D&D (1 case = 5 pieds)
        movementUsed: false
      },
      aiProfile: this.aiProfile, // ✅ Nouveau système AIProfile complet
      equipment: this.equipment
    };
  }

  /**
   * Convertit l'Enemy en template (pour sauvegarde/persistance)
   */
  private toTemplate(): DomainEnemyTemplate {
    return {
      id: this.templateId,
      name: this.name,
      level: this.level,
      baseAbilities: this.stats,
      maxHp: this.maxHP,
      armorClass: this.armorClass,
      speed: this.speed,
      challengeRating: this.challengeRating,
      xpReward: this.xpReward,
      proficiencyBonus: this.proficiencyBonus,
      resistances: this.resistances,
      vulnerabilities: this.vulnerabilities,
      immunities: this.immunities,
      aiProfile: this.aiProfile
    };
  }

  /**
   * Factory statique pour créer plusieurs ennemis depuis un template
   * Ex: Enemy.createMultiple('goblin', goblinTemplate, 3) => [goblin_1, goblin_2, goblin_3]
   */
  static createMultiple(
    baseId: string,
    template: DomainEnemyTemplate,
    count: number,
    positions?: Position[]
  ): Enemy[] {
    const enemies: Enemy[] = [];
    for (let i = 1; i <= count; i++) {
      const id = `${baseId}_${i}`;
      const position = positions?.[i - 1];
      enemies.push(new Enemy(id, template, template.maxHp, position));
    }
    return enemies;
  }
  
  /**
   * Calcule l'XP total d'un groupe d'ennemis
   * Utile pour calculer les récompenses de combat
   */
  static calculateTotalXP(enemies: Enemy[]): number {
    return enemies.reduce((total, enemy) => {
      return total + (enemy.xpReward ?? 0);
    }, 0);
  }
  
  /**
   * Retourne l'XP avec bonus de groupe (règle D&D optionnelle)
   * Plus il y a d'ennemis, plus l'XP est multiplié
   */
  static calculateGroupXP(enemies: Enemy[]): number {
    const baseXP = this.calculateTotalXP(enemies);
    const count = enemies.length;
    
    // Multiplicateurs D&D 5e pour groupes
    let multiplier = 1;
    if (count === 2) multiplier = 1.5;
    else if (count >= 3 && count <= 6) multiplier = 2;
    else if (count >= 7 && count <= 10) multiplier = 2.5;
    else if (count >= 11 && count <= 14) multiplier = 3;
    else if (count >= 15) multiplier = 4;
    
    return Math.floor(baseXP * multiplier);
  }
}