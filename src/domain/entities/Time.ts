/**
 * DOMAIN ENTITY - Time  
 * Pure business logic, no dependencies
 */

export interface GameTime {
  readonly day: number;
  readonly hour: number; // 0-23
  readonly minute: number; // 0-59
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night' | 'dawn';
export type RestType = 'short' | 'long';

/**
 * TIME - Aggregate Root
 * Gère le temps de jeu et les règles de repos
 */
export class Time {
  private _currentTime: GameTime;
  private _sceneCount: number = 0;

  constructor(startTime: GameTime = { day: 1, hour: 6, minute: 0 }) {
    this._currentTime = { ...startTime };
  }

  // GETTERS (Pure)
  get currentTime(): GameTime { return { ...this._currentTime }; }
  get sceneCount(): number { return this._sceneCount; }

  // BUSINESS RULES (Pure Logic)

  /**
   * Obtenir la période de la journée
   */
  getTimeOfDay(): TimeOfDay {
    const hour = this._currentTime.hour;
    
    if (hour >= 5 && hour < 8) return 'dawn';
    if (hour >= 8 && hour < 12) return 'morning';  
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Vérifier si c'est la nuit (pour les contraintes de repos)
   */
  isNightTime(): boolean {
    const hour = this._currentTime.hour;
    return hour >= 21 || hour < 6;
  }

  /**
   * Faire progresser le temps (par scène)
   */
  advanceByScene(): void {
    this._sceneCount++;
    
    // Chaque scène = ~30 minutes
    this.advanceTime(0, 30);
  }

  /**
   * Faire progresser le temps (par repos)
   */
  advanceByRest(restType: RestType): void {
    if (restType === 'short') {
      this.advanceTime(1, 0); // 1 heure
    } else {
      // Repos long : aller au matin suivant (6h)
      const nextDay = this._currentTime.day + (this._currentTime.hour >= 6 ? 1 : 0);
      this._currentTime = { day: nextDay, hour: 6, minute: 0 };
    }
  }

  /**
   * Vérifier si un repos long est possible selon l'heure
   */
  canTakeLongRest(): boolean {
    // Repos long possible seulement entre 19h et 6h
    const hour = this._currentTime.hour;
    return hour >= 19 || hour < 6;
  }

  /**
   * Calculer le temps jusqu'au prochain matin
   */
  getTimeUntilMorning(): { hours: number; minutes: number } {
    const currentMinutes = this._currentTime.hour * 60 + this._currentTime.minute;
    const morningMinutes = 6 * 60; // 6h00
    
    let minutesUntilMorning;
    if (currentMinutes < morningMinutes) {
      minutesUntilMorning = morningMinutes - currentMinutes;
    } else {
      minutesUntilMorning = (24 * 60) - currentMinutes + morningMinutes;
    }
    
    return {
      hours: Math.floor(minutesUntilMorning / 60),
      minutes: minutesUntilMorning % 60
    };
  }

  /**
   * Faire progresser le temps de X heures et Y minutes
   */
  private advanceTime(hours: number, minutes: number): void {
    let newMinutes = this._currentTime.minute + minutes;
    let newHours = this._currentTime.hour + hours;
    let newDay = this._currentTime.day;

    if (newMinutes >= 60) {
      newHours += Math.floor(newMinutes / 60);
      newMinutes = newMinutes % 60;
    }

    if (newHours >= 24) {
      newDay += Math.floor(newHours / 24);
      newHours = newHours % 24;
    }

    this._currentTime = {
      day: newDay,
      hour: newHours,
      minute: newMinutes
    };
  }

  /**
   * Obtenir une description textuelle du temps
   */
  getTimeDescription(): string {
    const timeOfDay = this.getTimeOfDay();
    const hour = this._currentTime.hour.toString().padStart(2, '0');
    const minute = this._currentTime.minute.toString().padStart(2, '0');
    
    return `Jour ${this._currentTime.day} - ${hour}:${minute} (${timeOfDay})`;
  }
}