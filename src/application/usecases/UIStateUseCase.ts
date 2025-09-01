/**
 * APPLICATION USE CASE - UIStateUseCase
 * Gestion des données d'affichage pour la couche Présentation
 * Respecte la Règle #4 - Présentation "Stupide"
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
   * Calcule les données d'affichage pour la santé d'un personnage
   * Centralise la logique d'affichage hors de la couche Présentation
   * 
   * @param character - Personnage dont afficher la santé
   * @returns Données formatées pour l'affichage UI
   */
  static getHealthDisplayData(character: Character): HealthDisplayData {
    const currentHP = character.currentHP;
    const maxHP = character.maxHP;
    
    // Calcul du pourcentage de santé
    const percentage = Math.max(0, Math.min(100, (currentHP / maxHP) * 100));
    
    // Détermination du statut de santé
    let status: HealthDisplayData['status'];
    if (currentHP <= 0) {
      status = 'unconscious';
    } else if (percentage <= 25) {
      status = 'critical';
    } else if (percentage <= 50) {
      status = 'wounded';
    } else {
      status = 'healthy';
    }
    
    // Couleur selon le pourcentage de santé
    let color: string;
    if (percentage > 75) {
      color = '#4ade80'; // Vert
    } else if (percentage > 50) {
      color = '#fbbf24'; // Jaune
    } else if (percentage > 25) {
      color = '#f97316'; // Orange
    } else {
      color = '#ef4444'; // Rouge
    }
    
    return {
      percentage,
      color,
      currentHP,
      maxHP,
      status
    };
  }

  /**
   * Formate l'affichage textuel de la santé
   * 
   * @param character - Personnage dont formater la santé
   * @returns Texte formaté "XX/YY HP"
   */
  static formatHealthText(character: Character): string {
    return `${character.currentHP}/${character.maxHP} HP`;
  }

  /**
   * Détermine si un personnage a besoin de soins urgents
   * 
   * @param character - Personnage à évaluer
   * @returns true si soins urgents nécessaires
   */
  static needsUrgentHealing(character: Character): boolean {
    const healthData = this.getHealthDisplayData(character);
    return healthData.status === 'critical' || healthData.status === 'unconscious';
  }

  /**
   * Calcule les données d'affichage pour une liste de personnages
   * 
   * @param characters - Liste des personnages
   * @returns Données d'affichage pour chaque personnage
   */
  static getPartyHealthDisplayData(characters: Character[]): HealthDisplayData[] {
    return characters.map(character => this.getHealthDisplayData(character));
  }
}