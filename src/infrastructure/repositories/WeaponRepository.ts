/**
 * INFRASTRUCTURE - Weapon Repository
 * Repository pour l'accès aux données d'armes
 */

import { Weapon } from '../../domain/entities/Weapon';
import type { IWeaponRepository } from '../../domain/repositories/IWeaponRepository';
import { GameDataStore } from '../stores/GameDataStore';
import { logger } from '../services/Logger';
import type { WeaponData } from '../data/types/WeaponData';

/**
 * Repository des armes
 * Convertit les WeaponData en entités Weapon du domain
 */
export class WeaponRepository implements IWeaponRepository {
  private gameDataStore: GameDataStore;
  
  constructor(gameDataStore: GameDataStore) {
    this.gameDataStore = gameDataStore;
  }
  
  /**
   * Obtenir une arme par ID
   */
  getWeapon(id: string): Weapon | null {
    logger.debug('WEAPON_REPO', `Getting weapon: ${id}`);
    
    const weaponData = this.gameDataStore.getWeapon(id);
    if (!weaponData) {
      logger.warn('WEAPON_REPO', `Weapon not found: ${id}`);
      return null;
    }
    
    return this.convertToWeapon(weaponData);
  }
  
  /**
   * Obtenir toutes les armes
   */
  getAllWeapons(): Weapon[] {
    logger.debug('WEAPON_REPO', 'Getting all weapons');
    
    const weaponsData = this.gameDataStore.getAllWeapons();
    return weaponsData.map(data => this.convertToWeapon(data));
  }
  
  /**
   * Obtenir des armes par IDs
   */
  getWeaponsByIds(ids: string[]): Weapon[] {
    logger.debug('WEAPON_REPO', `Getting weapons by IDs: ${ids.join(', ')}`);
    
    const weaponsData = this.gameDataStore.getWeaponsByIds(ids);
    const weapons = weaponsData.map(data => this.convertToWeapon(data));
    
    // Log des armes manquantes
    const foundIds = weaponsData.map(w => w.id);
    const missingIds = ids.filter(id => !foundIds.includes(id));
    if (missingIds.length > 0) {
      logger.warn('WEAPON_REPO', `Weapons not found: ${missingIds.join(', ')}`);
    }
    
    return weapons;
  }
  
  /**
   * Obtenir des armes par catégorie
   */
  getWeaponsByCategory(category: 'melee' | 'ranged'): Weapon[] {
    logger.debug('WEAPON_REPO', `Getting weapons by category: ${category}`);
    
    const weaponsData = this.gameDataStore.getWeaponsByCategory(category);
    return weaponsData.map(data => this.convertToWeapon(data));
  }
  
  /**
   * Obtenir des armes par rareté
   */
  getWeaponsByRarity(rarity: string): Weapon[] {
    logger.debug('WEAPON_REPO', `Getting weapons by rarity: ${rarity}`);
    
    const weaponsData = this.gameDataStore.getWeaponsByRarity(rarity as WeaponData['rarity']);
    return weaponsData.map(data => this.convertToWeapon(data));
  }
  
  /**
   * Rechercher des armes
   */
  searchWeapons(query: string): Weapon[] {
    logger.debug('WEAPON_REPO', `Searching weapons: ${query}`);
    
    const weaponsData = this.gameDataStore.searchWeapons(query);
    return weaponsData.map(data => this.convertToWeapon(data));
  }
  
  // MÉTHODES PRIVÉES
  
  /**
   * Convertir WeaponData vers entité Weapon du domain
   */
  private convertToWeapon(data: WeaponData): Weapon {
    // Convertir le range de mètres/cases vers le format attendu par Weapon
    const range = data.range ? {
      normal: data.range.normal,
      max: data.range.max
    } : null;
    
    return new Weapon(
      data.id,
      data.name,
      data.category,
      {
        dice: data.damage.dice,
        bonus: data.damage.bonus,
        type: data.stat  // Le type d'ability score est le stat utilisé
      },
      data.damageType,
      data.properties as any[], // Cast nécessaire car les types sont légèrement différents
      data.stat,
      data.description,
      data.rarity,
      data.weight,
      range
    );
  }
}