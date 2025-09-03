/**
 * INFRASTRUCTURE - Class Data Types
 * Définit les règles et la progression pour chaque classe de personnage.
 */

import type { Stats } from './CharacterData';

export interface ClassFeature {
  readonly level: number;
  readonly name: string;
  readonly description: string;
}

export interface ClassData {
  readonly id: string; // "warrior", "mage"
  readonly name: string; // "Guerrier", "Magicien"
  readonly hitDie: 6 | 8 | 10 | 12;
  readonly proficiencies: {
    readonly savingThrows: ReadonlyArray<keyof Stats>;
    readonly armor: readonly string[]; // ex: "light", "medium"
    readonly weapons: readonly string[]; // ex: "simple", "martial"
  };
  readonly features: readonly ClassFeature[];

  /** Décrit comment cette classe utilise la magie. Undefined si pas un lanceur de sorts. */
  readonly spellcasting?: {
    readonly ability: 'intelligence' | 'wisdom' | 'charisma';
    readonly slotProgression: 'full' | 'half' | 'third' | 'pact';
    readonly preparationType: 'book' | 'divine' | 'known';
    readonly spellListId: string; // ex: "wizard_spell_list"
  };
}
