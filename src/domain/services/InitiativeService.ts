/**
 * DOMAIN SERVICE - InitiativeService
 * Service de calcul d'initiative selon les règles D&D 5E
 * PHASE 3 - ACTION 3.1.3: Injection DiceRollingService selon Gemini #3
 */

import { Character } from '../entities/Character';
import { AbilityCalculationService } from './AbilityCalculationService';
import { DiceRollingService } from './DiceRollingService';

export class InitiativeService {
  private readonly _diceRollingService: DiceRollingService;

  constructor(diceRollingService: DiceRollingService) {
    this._diceRollingService = diceRollingService;
  }
  /**
   * PHASE 3 - ACTION 3.1.3: Calcule l'initiative - injection pure
   * @param character - Personnage pour lequel calculer l'initiative
   * @returns Résultat d'initiative
   */
  calculateInitiative(character: Character): number {
    const dexterityModifier = AbilityCalculationService.calculateModifier(character.stats.dexterity);
    const roll = this._diceRollingService.rollD20();
    
    return roll + dexterityModifier;
  }

  /**
   * PHASE 3 - ACTION 3.1.3: Calcule l'initiative avec modificateur - injection pure
   * @param dexterityModifier - Modificateur de Dextérité précalculé
   * @returns Résultat d'initiative
   */
  calculateInitiativeWithModifier(dexterityModifier: number): number {
    const roll = this._diceRollingService.rollD20();
    return roll + dexterityModifier;
  }

  /**
   * Trie une liste de personnages par ordre d'initiative décroissant
   * 
   * @param characters - Liste des personnages avec leur initiative
   * @returns Liste triée par initiative (plus haute en premier)
   */
  static sortByInitiative(characters: Array<{ character: Character; initiative: number }>): Array<{ character: Character; initiative: number }> {
    return [...characters].sort((a, b) => {
      // Ordre décroissant d'initiative
      if (b.initiative !== a.initiative) {
        return b.initiative - a.initiative;
      }
      
      // En cas d'égalité, plus haute Dextérité l'emporte
      const aDexMod = AbilityCalculationService.calculateModifier(a.character.stats.dexterity);
      const bDexMod = AbilityCalculationService.calculateModifier(b.character.stats.dexterity);
      
      return bDexMod - aDexMod;
    });
  }

  /**
   * Vérifie si un personnage agit en premier dans un combat
   * 
   * @param character - Personnage à vérifier
   * @param otherCharacters - Autres personnages du combat
   * @returns true si le personnage a la plus haute initiative
   */
  static hasHighestInitiative(character: Character, otherCharacters: Character[]): boolean {
    const characterInitiative = this.calculateInitiative(character);
    
    return otherCharacters.every(other => {
      const otherInitiative = this.calculateInitiative(other);
      return characterInitiative >= otherInitiative;
    });
  }
}