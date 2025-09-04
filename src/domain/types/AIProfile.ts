/**
 * DOMAIN TYPE - AIProfile
 * Système de profils d'IA enrichi pour comportements complexes et variés
 * Respecte ARCHITECTURE_GUIDELINES.md - Types purs sans dépendance
 */

/**
 * Profil d'IA complet avec traits de personnalité et préférences tactiques
 * Permet de créer des comportements émergents uniques pour chaque entité
 */
export interface AIProfile {
  /**
   * Traits de personnalité (0-100)
   * Ces valeurs influencent les décisions tactiques de l'IA
   */
  readonly aggression: number;      // 0 = Pacifique, 100 = Berserk
  readonly intelligence: number;    // 0 = Stupide, 100 = Génie tactique  
  readonly courage: number;         // 0 = Lâche, 100 = Sans peur
  readonly discipline: number;      // 0 = Chaotique, 100 = Méthodique
  readonly teamwork: number;        // 0 = Solitaire, 100 = Coordonné
  
  /**
   * Préférences tactiques de combat
   * Définit le style de combat préféré de l'entité
   */
  readonly combatStyle: {
    readonly preferredRange: 'contact' | 'close' | 'medium' | 'far';
    readonly mobilityPreference: 'static' | 'mobile' | 'flanking';
    readonly targetPriority: 'weakest' | 'strongest' | 'closest' | 'isolated' | 'dangerous';
  };
  
  /**
   * Seuils de comportement
   * Points de bascule pour changements de comportement
   */
  readonly thresholds: {
    readonly fleeHealth: number;      // % HP pour commencer à fuir (0-100)
    readonly rageHealth: number;      // % HP pour devenir enragé (0-100)
    readonly panicAlliesDown: number; // Nombre d'alliés morts pour paniquer
  };
  
  /**
   * Modificateurs contextuels optionnels
   * Réponses spécifiques à des situations particulières
   */
  readonly contextModifiers?: {
    readonly outnumberedResponse: 'flee' | 'defensive' | 'aggressive';
    readonly winningResponse: 'finish' | 'toy' | 'capture';
    readonly allyDownResponse: 'revenge' | 'retreat' | 'protect';
  };
}

/**
 * Type pour la distance de combat en cases
 */
export type CombatRange = 'contact' | 'close' | 'medium' | 'far';

/**
 * Helper pour convertir distance en cases vers CombatRange
 */
export function distanceToCombatRange(distance: number): CombatRange {
  if (distance <= 1) return 'contact';
  if (distance <= 3) return 'close';
  if (distance <= 6) return 'medium';
  return 'far';
}

/**
 * Helper pour obtenir la distance préférée en cases
 */
export function getPreferredDistanceInSquares(range: CombatRange): number {
  switch (range) {
    case 'contact': return 1;
    case 'close': return 2;
    case 'medium': return 4;
    case 'far': return 8;
  }
}

/**
 * Profil par défaut pour entités sans profil spécifique
 */
export const DEFAULT_AI_PROFILE: AIProfile = {
  aggression: 50,
  intelligence: 50,
  courage: 50,
  discipline: 50,
  teamwork: 50,
  combatStyle: {
    preferredRange: 'close',
    mobilityPreference: 'mobile',
    targetPriority: 'closest'
  },
  thresholds: {
    fleeHealth: 20,
    rageHealth: 30,
    panicAlliesDown: 3
  }
};

/**
 * Factory pour créer des profils d'IA prédéfinis
 */
export class AIProfileFactory {
  /**
   * Crée un profil de gobelin lâche et sournois
   */
  static createGoblinProfile(): AIProfile {
    return {
      aggression: 40,
      intelligence: 60,
      courage: 20,
      discipline: 30,
      teamwork: 70,
      combatStyle: {
        preferredRange: 'medium',
        mobilityPreference: 'flanking',
        targetPriority: 'weakest'
      },
      thresholds: {
        fleeHealth: 40,
        rageHealth: 0,
        panicAlliesDown: 2
      },
      contextModifiers: {
        outnumberedResponse: 'flee',
        winningResponse: 'toy',
        allyDownResponse: 'retreat'
      }
    };
  }
  
  /**
   * Crée un profil d'orc guerrier brutal et direct
   */
  static createOrcWarriorProfile(): AIProfile {
    return {
      aggression: 85,
      intelligence: 30,
      courage: 80,
      discipline: 50,
      teamwork: 40,
      combatStyle: {
        preferredRange: 'contact',
        mobilityPreference: 'mobile',
        targetPriority: 'closest'
      },
      thresholds: {
        fleeHealth: 10,
        rageHealth: 30,
        panicAlliesDown: 5
      },
      contextModifiers: {
        outnumberedResponse: 'aggressive',
        winningResponse: 'finish',
        allyDownResponse: 'revenge'
      }
    };
  }
  
  /**
   * Crée un profil d'archer squelette méthodique et distant
   */
  static createSkeletonArcherProfile(): AIProfile {
    return {
      aggression: 30,
      intelligence: 40,
      courage: 100, // Sans peur car mort-vivant
      discipline: 80,
      teamwork: 20,
      combatStyle: {
        preferredRange: 'far',
        mobilityPreference: 'static',
        targetPriority: 'dangerous'
      },
      thresholds: {
        fleeHealth: 0, // Ne fuit jamais
        rageHealth: 0, // Pas d'émotions
        panicAlliesDown: 99 // Ne panique jamais
      },
      contextModifiers: {
        outnumberedResponse: 'defensive',
        winningResponse: 'finish',
        allyDownResponse: 'protect'
      }
    };
  }
}