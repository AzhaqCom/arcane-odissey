/**
 * DOMAIN INTERFACE - Weapon Repository
 * Interface pure pour l'accès aux armes
 * Respecte la Règle #1 : Pureté du Domaine Absolue
 */

import type { Weapon } from '../entities/Weapon';

export interface IWeaponRepository {
  /**
   * Obtenir une arme par son ID
   */
  getWeapon(weaponId: string): Weapon | null;

  /**
   * Obtenir plusieurs armes par leurs IDs
   * Utilisé pour résoudre l'équipement des entités de combat
   */
  getWeaponsByIds(weaponIds: readonly string[]): Weapon[];
}