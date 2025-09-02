/**
 * APPLICATION USE CASE - UIStateUseCase
 * PURIFIÉ - Délègue la logique métier au domaine Character
 * Ne conserve que le mapping de présentation pure
 */

import { Character } from '../../domain/entities/Character';

export interface HealthDisplayData {
  readonly percentage: number;
  readonly color: string;
  readonly currentHP: number;
  readonly maxHP: number;
  readonly status: 'healthy' | 'wounded' | 'critical' | 'unconscious';
}

export class UIStateUseCase {
  /**
   * CONSTITUTION #1 - Délégation au Domaine
   * Combine les données métier du Character avec le mapping couleurs UI
   * 
   * @param character - Personnage dont afficher la santé
   * @returns Données formatées pour l'affichage UI
   */
  static getHealthDisplayData(character: Character): HealthDisplayData {
    // DÉLÉGATION: Logique métier dans le domaine
    const percentage = character.getHealthPercentage();
    const status = character.getHealthStatus();
    
    // PRÉSENTATION PURE: Mapping couleurs UI
    const color = this.getHealthColor(percentage);
    
    return {
      percentage,
      color,
      currentHP: character.currentHP,
      maxHP: character.maxHP,
      status
    };
  }

  /**
   * Mapping couleurs - logique de présentation pure
   */
  private static getHealthColor(percentage: number): string {
    if (percentage > 75) {
      return '#4ade80'; // Vert
    } else if (percentage > 50) {
      return '#fbbf24'; // Jaune
    } else if (percentage > 25) {
      return '#f97316'; // Orange
    } else {
      return '#ef4444'; // Rouge
    }
  }

  /**
   * DÉLÉGATION: Formate l'affichage textuel de la santé
   */
  static formatHealthText(character: Character): string {
    return character.formatHealthText();
  }

  /**
   * DÉLÉGATION: Détermine si un personnage a besoin de soins urgents
   */
  static needsUrgentHealing(character: Character): boolean {
    return character.needsUrgentHealing();
  }

  /**
   * Calcule les données d'affichage pour une liste de personnages
   */
  static getPartyHealthDisplayData(characters: Character[]): HealthDisplayData[] {
    return characters.map(character => this.getHealthDisplayData(character));
  }
}