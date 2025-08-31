/**
 * INFRASTRUCTURE - Inventory Data Types
 * Interfaces pour les données d'inventaire typées (5 catégories)
 */

export interface ArmorData {
  readonly id: string;
  readonly name: string;
  readonly type: 'light' | 'medium' | 'heavy' | 'shield';
  readonly armorClass: number;
  readonly maxDexBonus?: number; // null = unlimited dex bonus
  readonly strengthRequirement?: number;
  readonly stealthDisadvantage: boolean;
  readonly description: string;
  readonly rarity: 'Commun' | 'Peu commun' | 'Rare' | 'Très rare' | 'Légendaire' | 'Artefact';
  readonly weight: number;
}

export interface JewelryData {
  readonly id: string;
  readonly name: string;
  readonly type: 'ring' | 'necklace' | 'bracelet' | 'earring' | 'talisman';
  readonly effects: Array<{
    readonly type: 'stat_bonus' | 'resistance' | 'spell_slot' | 'special';
    readonly target: string; // 'strength', 'fire', 'level1', etc.
    readonly value: number;
    readonly description: string;
  }>;
  readonly description: string;
  readonly rarity: 'Commun' | 'Peu commun' | 'Rare' | 'Très rare' | 'Légendaire' | 'Artefact';
  readonly weight: number;
  readonly requiresAttunement: boolean;
}

export interface ConsumableData {
  readonly id: string;
  readonly name: string;
  readonly type: 'potion' | 'scroll' | 'food' | 'ammunition' | 'tool';
  readonly effects: Array<{
    readonly type: 'healing' | 'buff' | 'damage' | 'utility';
    readonly value: number;
    readonly duration?: number; // en tours
    readonly description: string;
  }>;
  readonly description: string;
  readonly rarity: 'Commun' | 'Peu commun' | 'Rare' | 'Très rare' | 'Légendaire' | 'Artefact';
  readonly weight: number;
  readonly stackable: boolean;
  readonly maxStack: number;
}

export interface ResourceData {
  readonly id: string;
  readonly name: string;
  readonly type: 'metal' | 'wood' | 'cloth' | 'leather' | 'gem' | 'herb' | 'component';
  readonly tier: 1 | 2 | 3 | 4 | 5; // Qualité/rareté de la ressource
  readonly craftingValue: number; // Points de crafting que ça apporte
  readonly description: string;
  readonly weight: number;
  readonly stackable: boolean;
  readonly maxStack: number;
}

export interface CraftingRecipeData {
  readonly id: string;
  readonly name: string;
  readonly resultType: 'weapon' | 'armor' | 'jewelry' | 'consumable';
  readonly resultId: string;
  readonly resultQuantity: number;
  readonly requirements: Array<{
    readonly resourceId: string;
    readonly quantity: number;
  }>;
  readonly craftingTime: number; // en minutes
  readonly skillRequired: number; // Niveau de skill required
  readonly description: string;
}