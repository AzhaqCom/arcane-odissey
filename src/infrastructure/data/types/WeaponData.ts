/**
 * INFRASTRUCTURE - Weapon Data Types
 * Interfaces pour les données d'armes typées
 */

export interface WeaponData {
  readonly id: string;
  readonly name: string;
  readonly category: 'melee' | 'ranged';
  readonly damage: {
    readonly dice: string;
    readonly bonus: number;
    readonly type: 'strength' | 'dexterity' | 'intelligence';
  };
  readonly damageType: 'piercing' | 'slashing' | 'bludgeoning' | 'fire' | 'cold' | 'lightning' | 'acid' | 'poison' | 'radiant' | 'necrotic' | 'psychic' | 'thunder' | 'force';
  readonly properties: string[];
  readonly range?: {
    readonly normal: number;
    readonly max: number;
  };
  readonly stat: 'strength' | 'dexterity' | 'intelligence';
  readonly description: string;
  readonly rarity: 'Commun' | 'Peu commun' | 'Rare' | 'Très rare' | 'Légendaire' | 'Artefact';
  readonly weight: number;
}