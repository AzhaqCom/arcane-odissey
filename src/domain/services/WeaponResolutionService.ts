/**
 * DOMAIN SERVICE - WeaponResolutionService
 * Service pur pour résoudre les armes des entités de combat
 * Respecte la Règle #3 : Logique Métier dans le Domaine
 * Respecte la Règle #5 : L'Injection est la Loi
 */

import type { IWeaponRepository } from '../repositories/IWeaponRepository';
import type { Weapon } from '../entities/Weapon';
import type { CombatEntity } from '../entities/CombatEngine';

export class WeaponResolutionService {
  constructor(
    private readonly weaponRepository: IWeaponRepository
  ) {}

  /**
   * Résoudre l'arme principale d'une entité de combat
   * Règle #3 : Logique métier pure dans Domain
   */
  resolveWeaponForEntity(entity: CombatEntity): Weapon | null {
    // Pour les ennemis : utiliser la première arme de leur équipement
    if (entity.type === 'enemy') {
      return this.resolveEnemyWeapon(entity);
    }

    // Pour les joueurs : arme équipée (à implémenter quand système d'inventaire sera prêt)
    if (entity.type === 'player') {
      return this.resolvePlayerWeapon(entity);
    }

    // Pour les alliés : même logique que les joueurs
    if (entity.type === 'ally') {
      return this.resolvePlayerWeapon(entity);
    }

    return null; // Pas d'arme = attaque à mains nues
  }

  /**
   * Résoudre la meilleure arme selon la distance à la cible
   * Règle #3 : Logique métier tactique dans Domain
   */
  resolveBestWeaponForDistance(entity: CombatEntity, distanceToTarget: number): Weapon | null {
    if (entity.type !== 'enemy') {
      // Pour joueurs/alliés, utiliser la logique standard pour l'instant
      return this.resolveWeaponForEntity(entity);
    }

    const availableWeapons = this.resolveAllWeaponsForEntity(entity);
    if (availableWeapons.length === 0) {
      return null; // Pas d'arme = attaque à mains nues
    }

    // Si une seule arme disponible, l'utiliser
    if (availableWeapons.length === 1) {
      return availableWeapons[0];
    }

    // Sélection tactique intelligente
    return this.selectBestWeaponForDistance(availableWeapons, distanceToTarget);
  }

  /**
   * Résoudre toutes les armes disponibles pour une entité
   */
  resolveAllWeaponsForEntity(entity: CombatEntity): Weapon[] {
    if (entity.type === 'enemy') {
      if (entity.equipment?.weapons) {
        return this.weaponRepository.getWeaponsByIds(entity.equipment.weapons);
      }
    }

    // Pour joueurs/alliés : retourner l'arme équipée ou armes d'inventaire
    const mainWeapon = this.resolveWeaponForEntity(entity);
    return mainWeapon ? [mainWeapon] : [];
  }

  /**
   * Récupérer une arme par son ID
   * Méthode publique pour accès depuis CombatEngine
   */
  getWeapon(weaponId: string): Weapon | null {
    return this.weaponRepository.getWeapon(weaponId);
  }

  /**
   * Vérifier si une entité peut utiliser une arme spécifique
   */
  canEntityUseWeapon(entity: CombatEntity, weapon: Weapon): boolean {
    // Règles de base D&D 5E pour l'utilisation d'armes
    
    // Vérifier les propriétés spéciales de l'arme
    if (weapon.hasProperty('heavy')) {
      // Les créatures de petite taille ont du mal avec les armes lourdes
      // (simplification : on considère que toutes nos entités sont de taille moyenne)
    }

    if (weapon.hasProperty('two-handed')) {
      // Vérifier que l'entité peut utiliser ses deux mains
      // (simplification : on considère que c'est toujours possible)
    }

    return true; // Par défaut, toute entité peut utiliser n'importe quelle arme
  }

  // MÉTHODES PRIVÉES

  /**
   * Sélectionner la meilleure arme selon la distance tactique
   * Règle #3 : Logique métier tactique D&D 5E
   */
  private selectBestWeaponForDistance(availableWeapons: Weapon[], distanceToTarget: number): Weapon {
    // Séparer armes par catégorie
    const meleeWeapons = availableWeapons.filter(w => w.category === 'melee');
    const rangedWeapons = availableWeapons.filter(w => w.category === 'ranged');

    // Logique tactique D&D 5E :
    // 1. Si à portée de mêlée (1-2 cases) : privilégier mêlée
    // 2. Si à distance (3+ cases) : privilégier armes à distance
    // 3. Si pas d'arme appropriée : prendre la meilleure disponible

    if (distanceToTarget <= 2) {
      // Combat rapproché : privilégier mêlée
      if (meleeWeapons.length > 0) {
        // Choisir la meilleure arme de mêlée (plus de dégâts)
        return this.selectBestDamageWeapon(meleeWeapons);
      }
      // Pas d'arme de mêlée : utiliser arme à distance (avec désavantage)
      return rangedWeapons[0] || availableWeapons[0];
    } else {
      // Combat à distance : privilégier armes à distance
      if (rangedWeapons.length > 0) {
        // Choisir l'arme à distance avec la meilleure portée
        return this.selectBestRangedWeapon(rangedWeapons, distanceToTarget);
      }
      // Pas d'arme à distance : impossible d'attaquer (retourner null serait mieux)
      return meleeWeapons[0] || availableWeapons[0];
    }
  }

  /**
   * Sélectionner l'arme avec les meilleurs dégâts
   */
  private selectBestDamageWeapon(weapons: Weapon[]): Weapon {
    return weapons.reduce((best, current) => {
      const bestAvgDamage = this.calculateAverageDamage(best);
      const currentAvgDamage = this.calculateAverageDamage(current);
      return currentAvgDamage > bestAvgDamage ? current : best;
    });
  }

  /**
   * Sélectionner la meilleure arme à distance selon la portée
   */
  private selectBestRangedWeapon(weapons: Weapon[], distanceToTarget: number): Weapon {
    // Filtrer les armes qui peuvent atteindre la cible
    const inRangeWeapons = weapons.filter(w => w.getAttackRange() >= distanceToTarget);
    
    if (inRangeWeapons.length > 0) {
      // Parmi celles à portée, choisir celle avec les meilleurs dégâts
      return this.selectBestDamageWeapon(inRangeWeapons);
    }
    
    // Aucune à portée : choisir celle avec la plus grande portée
    return weapons.reduce((best, current) => 
      current.getAttackRange() > best.getAttackRange() ? current : best
    );
  }

  /**
   * Calculer les dégâts moyens d'une arme (approximation)
   */
  private calculateAverageDamage(weapon: Weapon): number {
    const diceString = weapon.damage.dice;
    const [diceCount, diceType] = this.parseDice(diceString);
    const avgDiceRoll = (diceType + 1) / 2;
    return (diceCount * avgDiceRoll) + weapon.damage.bonus;
  }

  /**
   * Parser une chaîne de dés (ex: "1d8" -> [1, 8])
   */
  private parseDice(diceString: string): [number, number] {
    const match = diceString.match(/(\d+)d(\d+)/);
    if (!match) return [1, 4]; // Valeur par défaut
    return [parseInt(match[1]), parseInt(match[2])];
  }

  private resolveEnemyWeapon(entity: CombatEntity): Weapon | null {
    if (!entity.equipment?.weapons || entity.equipment.weapons.length === 0) {
      return null;
    }

    // Prendre la première arme de l'équipement
    const weaponId = entity.equipment.weapons[0];
    return this.weaponRepository.getWeapon(weaponId);
  }

  private resolvePlayerWeapon(entity: CombatEntity): Weapon | null {
    // LIGNE 1: Utiliser équipement si défini (même logique que ennemis)
    if (entity.equipment?.weapons && entity.equipment.weapons.length > 0) {
      const weaponId = entity.equipment.weapons[0];
      return this.weaponRepository.getWeapon(weaponId);
    }
    
    // LIGNE 2: Retourner null pour attaque à mains nues
    return null;
  }
}