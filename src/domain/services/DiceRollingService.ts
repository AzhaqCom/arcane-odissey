/**
 * DOMAIN SERVICE - DiceRollingService
 * Service de jets de dés selon les règles D&D 5E
 * PHASE 3 - ACTION 3.1.2: Refactorisé non-statique avec injection selon Gemini #3
 */

import type { IRandomNumberGenerator } from '../interfaces/IRandomNumberGenerator';

export class DiceRollingService {
  private readonly _randomGenerator: IRandomNumberGenerator;

  constructor(randomGenerator: IRandomNumberGenerator) {
    this._randomGenerator = randomGenerator;
  }
  /**
   * PHASE 3 - ACTION 3.1.2: Lance un dé à 20 faces (d20) - injection pure
   * @returns Résultat entre 1 et 20
   */
  rollD20(): number {
    return Math.floor(this._randomGenerator.random() * 20) + 1;
  }

  /**
   * PHASE 3 - ACTION 3.1.2: Lance un dé à 6 faces (d6) - injection pure
   * @returns Résultat entre 1 et 6
   */
  rollD6(): number {
    return Math.floor(this._randomGenerator.random() * 6) + 1;
  }

  /**
   * Lance des dés selon une notation standard (ex: "1d20", "2d6", "3d8+2")
   * @param notation - Notation de dés (ex: "1d20", "2d6+3")
   * @returns Résultat du jet
   */
  roll(notation: string): number {
    // Parse la notation (ex: "2d6+3" -> 2 dés de 6 + 3)
    const match = notation.match(/^(\d+)d(\d+)([+-]\d+)?$/);
    if (!match) {
      throw new Error(`Invalid dice notation: ${notation}`);
    }

    const diceCount = parseInt(match[1]);
    const diceType = parseInt(match[2]);
    const modifier = match[3] ? parseInt(match[3]) : 0;

    if (![4, 6, 8, 10, 12, 20, 100].includes(diceType)) {
      throw new Error(`Invalid dice type: d${diceType}`);
    }

    let total = 0;
    for (let i = 0; i < diceCount; i++) {
      total += Math.floor(this._randomGenerator.random() * diceType) + 1;
    }
    
    return total + modifier;
  }

  /**
   * PHASE 3 - ACTION 3.1.2: Lance plusieurs dés - injection pure
   * @param diceCount - Nombre de dés à lancer
   * @param diceType - Type de dé (4, 6, 8, 10, 12, 20)
   * @returns Somme des jets de dés
   */
  rollDamage(diceCount: number, diceType: number): number {
    if (diceCount < 1 || !Number.isInteger(diceCount)) {
      throw new Error(`Invalid dice count: ${diceCount}. Must be a positive integer.`);
    }

    if (![4, 6, 8, 10, 12, 20].includes(diceType)) {
      throw new Error(`Invalid dice type: d${diceType}. Must be d4, d6, d8, d10, d12, or d20.`);
    }

    let total = 0;
    for (let i = 0; i < diceCount; i++) {
      total += Math.floor(this._randomGenerator.random() * diceType) + 1;
    }
    
    return total;
  }

  /**
   * PHASE 3 - ACTION 3.1.2: Lance un jet d'attaque - injection pure
   * @param attackModifier - Modificateur d'attaque
   * @returns Résultat du jet d'attaque
   */
  rollAttack(attackModifier: number = 0): number {
    return this.rollD20() + attackModifier;
  }

  /**
   * PHASE 3 - ACTION 3.1.2: Lance un jet de sauvegarde - injection pure
   * @param saveModifier - Modificateur de sauvegarde
   * @returns Résultat du jet de sauvegarde
   */
  rollSavingThrow(saveModifier: number = 0): number {
    return this.rollD20() + saveModifier;
  }

  /**
   * Vérifie si un jet est un critique naturel (20)
   * @param roll - Résultat du d20 brut (sans modificateurs)
   * @returns true si critique naturel
   */
  isCriticalHit(roll: number): boolean {
    return roll === 20;
  }

  /**
   * Vérifie si un jet est un échec critique (1)
   * @param roll - Résultat du d20 brut (sans modificateurs)
   * @returns true si échec critique
   */
  isCriticalMiss(roll: number): boolean {
    return roll === 1;
  }
}