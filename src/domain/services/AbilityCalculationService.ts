/**
 * DOMAIN SERVICE - AbilityCalculationService
 * Service de calcul des modificateurs de caractéristiques D&D 5E
 * Respecte la Règle #3 - Logique Métier dans Domain
 */

export class AbilityCalculationService {
  /**
   * Calcule le modificateur d'une caractéristique selon les règles D&D 5E
   * Formule officielle : Math.floor((score - 10) / 2)
   * 
   * @param score - Score de caractéristique (1-30)
   * @returns Modificateur (-5 à +10)
   */
  static calculateModifier(score: number): number {
    if (score < 1 || score > 30) {
      throw new Error(`Invalid ability score: ${score}. Must be between 1 and 30.`);
    }
    
    return Math.floor((score - 10) / 2);
  }

  /**
   * Calcule tous les modificateurs d'un personnage
   * 
   * @param abilities - Scores de caractéristiques
   * @returns Objeto avec tous les modificateurs
   */
  static calculateAllModifiers(abilities: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  }): {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  } {
    return {
      strength: this.calculateModifier(abilities.strength),
      dexterity: this.calculateModifier(abilities.dexterity),
      constitution: this.calculateModifier(abilities.constitution),
      intelligence: this.calculateModifier(abilities.intelligence),
      wisdom: this.calculateModifier(abilities.wisdom),
      charisma: this.calculateModifier(abilities.charisma)
    };
  }

  /**
   * Vérifie si un score de caractéristique est valide
   * 
   * @param score - Score à vérifier
   * @returns true si valide
   */
  static isValidAbilityScore(score: number): boolean {
    return Number.isInteger(score) && score >= 1 && score <= 30;
  }
}