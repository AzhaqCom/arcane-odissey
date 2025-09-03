/**
 * DOMAIN SERVICE - DamageCalculationService
 * Service de calcul des dégâts d'armes selon les règles D&D 5E
 * PHASE 3 - ACTION 3.1.3: Injection DiceRollingService selon Gemini #3
 */

import { Character } from '../entities/Character';
import { Weapon } from '../entities/Weapon';
import { AbilityCalculationService } from './AbilityCalculationService';
import { DiceRollingService } from './DiceRollingService';

export class DamageCalculationService {
  private readonly _diceRollingService: DiceRollingService;

  constructor(diceRollingService: DiceRollingService) {
    this._diceRollingService = diceRollingService;
  }
  /**
   * PHASE 3 - ACTION 3.1.3: Calcule les dégâts d'une arme - injection pure
   * @param weapon - Arme utilisée
   * @param attacker - Personnage qui attaque
   * @returns Dégâts calculés (minimum 1)
   */
  calculateWeaponDamage(weapon: Weapon, attacker: Character): number {
    // Jet de dégâts de base de l'arme
    const baseDamage = this._diceRollingService.rollDamage(weapon.damage.diceCount, weapon.damage.diceType);
    
    // Modificateur de caractéristique approprié
    const abilityModifier = DamageCalculationService.getRelevantAbilityModifier(weapon, attacker);
    
    // Dégâts totaux (minimum 1)
    return Math.max(1, baseDamage + abilityModifier);
  }

  /**
   * Détermine le modificateur de caractéristique approprié pour une arme
   * 
   * @param weapon - Arme utilisée
   * @param attacker - Personnage qui attaque
   * @returns Modificateur de Force ou Dextérité selon l'arme
   */
  private static getRelevantAbilityModifier(weapon: Weapon, attacker: Character): number {
    // Armes à distance utilisent Dextérité
    if (weapon.category === 'ranged') {
      return AbilityCalculationService.calculateModifier(attacker.stats.dexterity);
    }
    
    // Armes de finesse peuvent utiliser Dex ou Str (on prend le meilleur)
    if (weapon.properties.includes('finesse')) {
      const strMod = AbilityCalculationService.calculateModifier(attacker.stats.strength);
      const dexMod = AbilityCalculationService.calculateModifier(attacker.stats.dexterity);
      return Math.max(strMod, dexMod);
    }
    
    // Armes de mêlée utilisent Force par défaut
    return AbilityCalculationService.calculateModifier(attacker.stats.strength);
  }

  /**
   * PHASE 3 - ACTION 3.1.3: Calcule les dégâts critiques - injection pure
   * @param weapon - Arme utilisée
   * @param attacker - Personnage qui attaque
   * @returns Dégâts critiques calculés
   */
  calculateCriticalDamage(weapon: Weapon, attacker: Character): number {
    // Double jet de dégâts pour le critique
    const criticalBaseDamage = this._diceRollingService.rollDamage(weapon.damage.diceCount * 2, weapon.damage.diceType);
    
    // Un seul modificateur (pas doublé)
    const abilityModifier = DamageCalculationService.getRelevantAbilityModifier(weapon, attacker);
    
    return Math.max(1, criticalBaseDamage + abilityModifier);
  }
}