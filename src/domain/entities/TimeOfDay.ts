/**
 * DOMAIN ENTITY - TimeOfDay
 * Entity pour la gestion des périodes temporelles dans le monde du jeu
 * Responsabilité: Logique métier pure pour les périodes de la journée
 */

export type TimeOfDayPeriod = 'dawn' | 'day' | 'dusk' | 'night';

export interface TimeOfDayDisplay {
  readonly period: TimeOfDayPeriod;
  readonly icon: string;
  readonly label: string;
  readonly description: string;
}

export class TimeOfDay {
  
  /**
   * Déterminer la période de la journée à partir d'une heure
   * Règles métier : Aube (5-7h), Jour (8-17h), Crépuscule (18-20h), Nuit (21-4h)
   * @param hour L'heure (0-23)
   * @returns La période correspondante
   */
  static fromHour(hour: number): TimeOfDayPeriod {
    if (hour >= 5 && hour < 8) return 'dawn';
    if (hour >= 8 && hour < 18) return 'day';
    if (hour >= 18 && hour < 21) return 'dusk';
    return 'night';
  }

  /**
   * Obtenir toutes les informations d'affichage pour une période
   * @param period La période de la journée
   * @returns Données complètes pour l'UI
   */
  static getDisplayData(period: TimeOfDayPeriod): TimeOfDayDisplay {
    switch (period) {
      case 'dawn':
        return {
          period: 'dawn',
          icon: '🌅',
          label: 'Aube',
          description: 'Les premiers rayons du soleil percent l\'horizon'
        };
      case 'day':
        return {
          period: 'day',
          icon: '☀️',
          label: 'Jour',
          description: 'Le soleil brille haut dans le ciel'
        };
      case 'dusk':
        return {
          period: 'dusk',
          icon: '🌆',
          label: 'Crépuscule',
          description: 'Les dernières lueurs du jour s\'estompent'
        };
      case 'night':
        return {
          period: 'night',
          icon: '🌙',
          label: 'Nuit',
          description: 'L\'obscurité enveloppe le monde'
        };
    }
  }

  /**
   * Obtenir les données d'affichage directement depuis une heure
   * @param hour L'heure (0-23)
   * @returns Données complètes pour l'UI
   */
  static getDisplayDataFromHour(hour: number): TimeOfDayDisplay {
    const period = this.fromHour(hour);
    return this.getDisplayData(period);
  }

  /**
   * Vérifier si une période est considérée comme "dangereuse" (règles D&D)
   * @param period La période
   * @returns true si la période augmente les risques de rencontres
   */
  static isDangerousPeriod(period: TimeOfDayPeriod): boolean {
    return period === 'night' || period === 'dusk';
  }

  /**
   * Obtenir le modificateur de visibilité pour les règles de combat
   * @param period La période
   * @returns Modificateur (-2 à +0) pour les jets de perception
   */
  static getVisibilityModifier(period: TimeOfDayPeriod): number {
    switch (period) {
      case 'dawn':
      case 'dusk':
        return -1; // Lumière tamisée
      case 'night':
        return -2; // Obscurité
      case 'day':
        return 0; // Lumière normale
    }
  }
}