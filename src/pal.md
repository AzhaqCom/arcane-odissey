● 🎯 PLAN UNIFIÉ : Système d'Armes pour Attaques IA

  Respectant scrupuleusement les 6 Règles d'Or

  ---
  📋 ÉTAPE 1 : Entité Domain Pure (Règle #1, #2, #4)

  // domain/entities/Weapon.ts
  export class Weapon {
    constructor(
      public readonly id: string,
      public readonly name: string,
      public readonly attackStat: keyof Stats, // 'strength' | 'dexterity'
      public readonly damage: { dice: string; bonus: number },
      public readonly category: 'melee' | 'ranged',
      public readonly range?: { normal: number; max: number }
    ) {}

    // ✅ RÈGLE #3 : Logique métier dans le Domain
    calculateAttackBonus(stats: Stats): number {
      return Math.floor((stats[this.attackStat] - 10) / 2);
    }

    rollDamage(stats: Stats, diceService: DiceService): number {
      const baseDamage = diceService.roll(this.damage.dice);
      const statModifier = this.calculateAttackBonus(stats);
      return Math.max(1, baseDamage + this.damage.bonus + statModifier);
    }

    isRanged(): boolean {
      return this.category === 'ranged';
    }

    getEffectiveRange(): number {
      return this.isRanged() ? (this.range?.normal || 6) : 1;
    }
  }

  ---
  📋 ÉTAPE 2 : Interface Repository Domain (Règle #1)

  // domain/interfaces/WeaponRepository.ts
  import { Weapon } from '../entities/Weapon'; // ✅ Import interne Domain

  export interface WeaponRepository {
    getWeaponById(weaponId: string): Weapon | null;
    getWeaponsForEntity(entityEquipment: readonly string[]): Weapon[];
  }

  ---
  📋 ÉTAPE 3 : Service Domain avec DI (Règle #5)

  // domain/services/WeaponResolutionService.ts
  import { Weapon } from '../entities/Weapon';
  import { WeaponRepository } from '../interfaces/WeaponRepository';
  import { CombatEntity } from '../entities/CombatEngine';

  export class WeaponResolutionService {
    constructor(
      private readonly weaponRepository: WeaponRepository // ✅ DI via constructeur
    ) {}

    // ✅ RÈGLE #3 : Logique métier pure dans Domain
    resolveWeaponForEntity(entity: CombatEntity): Weapon | null {
      // Pour ennemis : premier weapon de l'equipment
      if (entity.type === 'enemy' && entity.equipment?.weapons?.[0]) {
        return this.weaponRepository.getWeaponById(entity.equipment.weapons[0]);
      }

      // Pour joueurs : weapon équipé (TODO: quand inventaire implémenté)
      // return this.weaponRepository.getWeaponById(entity.equippedWeapon);

      return null; // Pas d'arme = attaque à mains nues
    }
  }

  ---
  📋 ÉTAPE 4 : CombatEngine Enrichi (Règle #2, #4)

  // domain/entities/CombatEngine.ts (ajouts)
  export class CombatEngine {
    constructor(
      // ... existant
      private readonly weaponResolutionService: WeaponResolutionService // ✅ DI
    ) {}

    // ✅ RÈGLE #3 : Logique métier dans Domain
    // ✅ RÈGLE #4 : Méthode pure, retourne nouvelle instance
    private resolveAttack(
      attacker: CombatEntity,
      target: CombatEntity
    ): { hit: boolean; damage: number; weapon: string; attackRoll: number } {
      const weapon = this.weaponResolutionService.resolveWeaponForEntity(attacker);

      // Attaque à mains nues si pas d'arme
      if (!weapon) {
        const attackRoll = this.dependencies.diceRollingService.roll('1d20') +
                          Math.floor((attacker.stats.strength - 10) / 2);

        if (attackRoll >= target.armorClass) {
          const damage = Math.max(1, 1 + Math.floor((attacker.stats.strength - 10) / 2));
          return { hit: true, damage, weapon: 'Mains nues', attackRoll };
        }
        return { hit: false, damage: 0, weapon: 'Mains nues', attackRoll };
      }

      // Attaque avec arme
      const attackRoll = this.dependencies.diceRollingService.roll('1d20') +
                        weapon.calculateAttackBonus(attacker.stats);

      if (attackRoll >= target.armorClass) {
        const damage = weapon.rollDamage(attacker.stats, this.dependencies.diceRollingService);
        return { hit: true, damage, weapon: weapon.name, attackRoll };
      }

      return { hit: false, damage: 0, weapon: weapon.name, attackRoll };
    }

    // ✅ Remplace TOUTES les méthodes d'attaque existantes par une seule
    private applyAttackActionUnified(
      entities: CombatEntity[],
      action: CombatAction,
      currentEntity: CombatEntity
    ): { entities: CombatEntity[], narratives: NarrativeMessage[] } {
      if (!action.targetId) return { entities, narratives: [] };

      const attacker = entities.find(e => e.id === action.entityId);
      const target = entities.find(e => e.id === action.targetId);

      if (!attacker || !target) return { entities, narratives: [] };

      // ✅ Une seule résolution d'attaque
      const result = this.resolveAttack(attacker, target);

      // Appliquer les changements (immutable)
      let updatedEntities = entities;

      if (result.hit) {
        const newTargetHP = Math.max(0, target.hitPoints - result.damage);
        updatedEntities = entities.map(e => {
          if (e.id === target.id) {
            return { ...e, hitPoints: newTargetHP, isDead: newTargetHP === 0 };
          }
          if (e.id === attacker.id) {
            return { ...e, actionsRemaining: { ...e.actionsRemaining, action: false } };
          }
          return e;
        });
      } else {
        updatedEntities = entities.map(e =>
          e.id === attacker.id
            ? { ...e, actionsRemaining: { ...e.actionsRemaining, action: false } }
            : e
        );
      }

      // Générer narratif
      const narrative = this.generateAttackNarrative(attacker, target, result.attackRoll, result.hit ? result.damage : undefined);

      return { entities: updatedEntities, narratives: [narrative] };
    }
  }

  ---
  📋 ÉTAPE 5 : SimpleAIService Intelligent (Règle #3)

  // domain/services/SimpleAIService.ts (modifications)
  export class SimpleAIService {
    constructor(
      private readonly weaponResolutionService: WeaponResolutionService, // ✅ DI
      private readonly logger: Logger
    ) {}

    // ✅ RÈGLE #3 : Logique métier dans Domain
    private getAttackRange(entity: CombatEntity): number {
      const weapon = this.weaponResolutionService.resolveWeaponForEntity(entity);
      return weapon ? weapon.getEffectiveRange() : 1; // Mains nues = 1 case
    }
  }

  ---
  📋 ÉTAPE 6 : Infrastructure et Mappers (Règle #5)

  // infrastructure/repositories/WeaponRepositoryImpl.ts
  import { WeaponRepository } from '../../domain/interfaces/WeaponRepository';
  import { Weapon } from '../../domain/entities/Weapon';
  import { WEAPONS_DATA } from '../data/weapons';

  export class WeaponRepositoryImpl implements WeaponRepository {

    // ✅ RÈGLE #5 : Mapping explicite Infrastructure → Domain
    getWeaponById(weaponId: string): Weapon | null {
      const weaponData = WEAPONS_DATA.find(w => w.id === weaponId);
      if (!weaponData) return null;

      return new Weapon(
        weaponData.id,
        weaponData.name,
        weaponData.stat,
        weaponData.damage,
        weaponData.category,
        weaponData.range
      );
    }

    getWeaponsForEntity(entityEquipment: readonly string[]): Weapon[] {
      return entityEquipment
        .map(weaponId => this.getWeaponById(weaponId))
        .filter((weapon): weapon is Weapon => weapon !== null);
    }
  }

  ---
  📋 ÉTAPE 7 : DI Container (Règle #5)

  // infrastructure/di/DIContainer.ts (ajouts)
  container.register('weaponRepository', () => new WeaponRepositoryImpl());
  container.register('weaponResolutionService', () =>
    new WeaponResolutionService(container.get('weaponRepository'))
  );

  ---
  🎯 GARANTIES ARCHITECTURALES :

  - ✅ Règle #1 : Domain ne dépend que de ses interfaces
  - ✅ Règle #2 : Logique métier exclusivement dans Domain
  - ✅ Règle #3 : Une seule méthode d'attaque unifiée
  - ✅ Règle #4 : Immutabilité avec with...() pattern
  - ✅ Règle #5 : DI via constructeurs partout
  - ✅ Règle #6 : Mapping explicite Infrastructure → Domain

  Ce plan unifie les attaques IA/joueur avec un système d'armes complet et architecturalement pur.