/**
 * DOMAIN INTERFACE - IRandomNumberGenerator
 * Interface pour injection de dépendances des nombres aléatoires
 * Permet Domain pur et testabilité selon Gemini #3
 */

export interface IRandomNumberGenerator {
  /**
   * Générer un nombre aléatoire entre 0 et 1 (exclus)
   * @returns number entre 0 et 1
   */
  random(): number;
}

/**
 * Implémentation production utilisant Math.random()
 */
export class ProductionRandomNumberGenerator implements IRandomNumberGenerator {
  random(): number {
    return Math.random();
  }
}

/**
 * Implémentation mock pour tests déterministes
 */
export class MockRandomNumberGenerator implements IRandomNumberGenerator {
  private _values: number[] = [];
  private _index: number = 0;

  constructor(predefinedValues: number[] = [0.5]) {
    this._values = predefinedValues;
  }

  random(): number {
    const value = this._values[this._index % this._values.length];
    this._index++;
    return value;
  }

  /**
   * Réinitialiser la séquence de valeurs
   */
  reset(): void {
    this._index = 0;
  }

  /**
   * Définir nouvelles valeurs de test
   */
  setValues(values: number[]): void {
    this._values = values;
    this._index = 0;
  }
}