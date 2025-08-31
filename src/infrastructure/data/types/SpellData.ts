/**
 * INFRASTRUCTURE - Spell Data Types
 * Définit la structure d'un sort de manière statique.
 */

export interface SpellData {
  readonly id: string; // "fireball", "magic_missile"
  readonly name: string; // "Boule de feu"
  readonly level: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  readonly school: 'abjuration' | 'conjuration' | 'divination' | 'enchantment' | 'evocation' | 'illusion' | 'necromancy' | 'transmutation';
  readonly castingTime: string; // "1 action", "1 action bonus"
  readonly range: string; // "Contact", "90 pieds"
  readonly components: readonly ('V' | 'S' | 'M')[];
  readonly materialComponents?: string;
  readonly duration: string; // "Instantané", "Concentration, jusqu'à 1 minute"
  readonly description: string;
  readonly higherLevelDescription?: string;
  readonly isRitual: boolean;
  readonly requiresConcentration: boolean;

  /** Effets structurés pour le moteur de jeu. */
  readonly effects?: {
    readonly damage?: { readonly dice: string; readonly bonus: number; readonly type: string; };
    readonly healing?: { readonly dice: string; readonly bonus: number; };
    readonly areaOfEffect?: { readonly shape: 'sphere' | 'cone' | 'line' | 'cube'; readonly size: number; };
    // ... autres effets possibles
  };
}
