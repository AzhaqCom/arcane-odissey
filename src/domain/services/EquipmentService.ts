/**
 * DOMAIN - EquipmentService
 * Service de domaine pour la gestion de l'équipement des personnages
 * Responsabilité: Logique métier pure pour l'équipement et l'inventaire
 */

import type { Character } from '../entities/Character';
import type { Weapon } from '../entities/Weapon';
import type { WeaponRepository } from '../repositories/WeaponRepository';

export class EquipmentService {
  private weaponRepository: WeaponRepository;
  
  constructor(weaponRepository: WeaponRepository) {
    this.weaponRepository = weaponRepository;
  }

  /**
   * Obtenir toutes les armes équipées d'un personnage
   * Logique métier: déterminer quelles armes sont effectivement équipées et utilisables
   * @param character Le personnage
   * @returns Liste des armes équipées et utilisables
   */
  getEquippedWeapons(character: Character): Weapon[] {
    // Vérifier que l'inventaire existe
    if (!character.inventory || !character.inventory.equipped) {
      // Fallback : armes par défaut pour tests/développement
      return this.weaponRepository.getWeaponsByIds(['dagger', 'shortbow']);
    }

    const equippedWeaponIds: string[] = [];
    
    // Parcourir tous les slots d'équipement pour identifier les armes
    Object.values(character.inventory.equipped).forEach(itemId => {
      // Vérifier si l'item est une arme valide
      const weapons = this.weaponRepository.getWeaponsByIds([itemId]);
      if (weapons.length > 0) {
        equippedWeaponIds.push(itemId);
      }
    });

    return this.weaponRepository.getWeaponsByIds(equippedWeaponIds);
  }

  /**
   * Vérifier si une arme spécifique est équipée
   * @param character Le personnage
   * @param weaponId L'ID de l'arme à vérifier
   * @returns true si l'arme est équipée
   */
  isWeaponEquipped(character: Character, weaponId: string): boolean {
    if (!character.inventory || !character.inventory.equipped) {
      return false;
    }

    return Object.values(character.inventory.equipped).includes(weaponId);
  }

  /**
   * Obtenir l'arme principale équipée (main droite)
   * @param character Le personnage
   * @returns L'arme principale ou null
   */
  getMainHandWeapon(character: Character): Weapon | null {
    if (!character.inventory || !character.inventory.equipped.mainHand) {
      return null;
    }

    const weapons = this.weaponRepository.getWeaponsByIds([character.inventory.equipped.mainHand]);
    return weapons.length > 0 ? weapons[0] : null;
  }

  /**
   * Obtenir l'arme à distance équipée
   * @param character Le personnage
   * @returns L'arme à distance ou null
   */
  getRangedWeapon(character: Character): Weapon | null {
    if (!character.inventory || !character.inventory.equipped.rangedWeapon) {
      return null;
    }

    const weapons = this.weaponRepository.getWeaponsByIds([character.inventory.equipped.rangedWeapon]);
    return weapons.length > 0 ? weapons[0] : null;
  }
}