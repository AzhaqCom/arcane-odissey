/**
 * DOMAIN SERVICE - PlayerWeaponService  
 * Service pur pour la gestion des armes du joueur en combat
 * Respecte ARCHITECTURE_GUIDELINES.md - Règle #1 Domain-First
 */

import type { CombatEntity } from '../entities/CombatEngine';
import type { IWeaponRepository } from '../repositories/IWeaponRepository';
import type { Weapon } from '../entities/Weapon';

/**
 * Interface pour les choix d'armes du joueur dans l'UI
 */
export interface PlayerWeaponChoice {
  weaponId: string;        // 'dagger'  
  weaponName: string;      // 'Dague'
  damageDisplay: string;   // 'Dégâts: 1d4'
  range: number;           // 1 (cases)
  isAvailable: boolean;    // true si peut être utilisée
}

/**
 * Utilitaire pour calculer la distance Chebyshev entre deux positions
 * Distance tactique D&D : diagonales comptent comme 1 case
 */
function calculateDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
  return Math.max(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y - pos2.y));
}

/**
 * SERVICE DU DOMAINE - Logique métier pour les armes du joueur
 * ✅ Règle #1 : Toute logique métier dans Domain
 * ✅ Règle #4 : Service pur, pas d'effets de bord
 * ✅ Règle #5 : Dépendances injectées via constructeur
 */
export class PlayerWeaponService {
  constructor(private readonly weaponRepository: IWeaponRepository) {}

  /**
   * Récupère les armes disponibles du joueur pour affichage UI
   * Règle #1 : Logique métier dans Domain
   */
  getAvailableWeaponsForPlayer(entity: CombatEntity): PlayerWeaponChoice[] {
    if (entity.type !== 'player' || !entity.equipment?.weapons) {
      return [];
    }

    const weaponChoices: PlayerWeaponChoice[] = [];

    for (const weaponId of entity.equipment.weapons) {
      const weapon = this.weaponRepository.getWeapon(weaponId);
      if (!weapon) {
        continue; // Arme introuvable, ignorer
      }

      weaponChoices.push({
        weaponId,
        weaponName: weapon.name,
        damageDisplay: `Dégâts: ${weapon.getDamageDisplay()}`, // 'Dégâts: 1d4'
        range: weapon.getAttackRange(),
        isAvailable: this.isWeaponAvailable(entity, weapon)
      });
    }

    return weaponChoices;
  }

  /**
   * Calcule les cibles valides pour une arme spécifique du joueur
   * Règle #1 : Logique métier dans Domain
   */
  getValidTargetsForWeapon(
    attacker: CombatEntity, 
    weaponId: string, 
    allEntities: readonly CombatEntity[]
  ): CombatEntity[] {
    if (attacker.type !== 'player') {
      return [];
    }

    const weapon = this.weaponRepository.getWeapon(weaponId);
    if (!weapon) {
      return [];
    }

    const range = weapon.getAttackRange();

    return allEntities.filter(entity => {
      // Ne pas se cibler soi-même
      if (entity.id === attacker.id) return false;
      
      // Ne pas cibler les morts
      if (entity.isDead) return false;
      
      // Ne pas attaquer les alliés
      if (entity.type === 'player' || entity.type === 'ally') return false;
      
      // Vérifier la portée
      const distance = calculateDistance(attacker.position, entity.position);
      return distance <= range;
    });
  }

  /**
   * Vérifie si une arme est disponible pour utilisation
   * TODO: Ajouter vérifications munitions, sorts, etc.
   * Règle #1 : Logique métier dans Domain
   */
  private isWeaponAvailable(entity: CombatEntity, weapon: Weapon): boolean {
    // Pour l'instant, toutes les armes équipées sont disponibles
    // TODO Phase 3: Vérifier munitions pour arcs, composants pour sorts, etc.
    return true;
  }

  /**
   * Vérifie si le joueur possède une arme spécifique
   * Règle #1 : Logique métier dans Domain
   */
  hasWeapon(entity: CombatEntity, weaponId: string): boolean {
    if (entity.type !== 'player' || !entity.equipment?.weapons) {
      return false;
    }
    return entity.equipment.weapons.includes(weaponId);
  }

  /**
   * Récupère l'objet Weapon depuis son ID si le joueur la possède
   * Règle #1 : Logique métier dans Domain
   */
  getPlayerWeapon(entity: CombatEntity, weaponId: string): Weapon | null {
    if (!this.hasWeapon(entity, weaponId)) {
      return null;
    }
    return this.weaponRepository.getWeapon(weaponId);
  }
}