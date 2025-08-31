/**
 * INFRASTRUCTURE - Scene Data Types
 * Interfaces pour les données de scènes typées
 */

export interface SceneData {
  readonly id: string;
  readonly type: 'text' | 'dialogue' | 'combat' | 'investigation' | 'merchant' | 'crafting' | 'puzzle' | 'dungeon';
  readonly title: string;
  readonly description: string;
  readonly metadata: {
    readonly environment?: 'indoor' | 'outdoor' | 'underground' | 'water' | 'sky';
    readonly timeOfDay?: 'dawn' | 'day' | 'dusk' | 'night';
    readonly safety: 'safe' | 'moderate' | 'dangerous' | 'deadly';
    readonly lighting: 'bright' | 'dim' | 'dark';
    readonly weather?: 'clear' | 'rain' | 'snow' | 'storm' | 'fog';
  };
  readonly content: TextSceneContent | DialogueSceneContent | CombatSceneContent | InvestigationSceneContent | MerchantSceneContent | CraftingSceneContent | PuzzleSceneContent | DungeonSceneContent;
  readonly choices: SceneChoice[];
  readonly conditions?: SceneCondition[]; // Conditions pour accéder à cette scène
  readonly effects?: SceneEffect[];       // Effets appliqués en entrant dans la scène
}

// Content spécialisés par type de scène
export interface TextSceneContent {
  readonly text: string;
  readonly contextualSpells?: string[]; // IDs des sorts suggérés selon le contexte
}

export interface DialogueSceneContent {
  readonly npcId: string;
  readonly dialogue: Array<{
    readonly speaker: 'npc' | 'player';
    readonly text: string;
    readonly emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'fearful';
  }>;
}

export interface CombatSceneContent {
  // Support nouvelle structure enrichie d'ennemis  
  readonly enemies: Array<{
    readonly templateId: string;
    readonly customName?: string;
    readonly level?: number;
    readonly count?: number; // Nombre d'instances à créer (défaut: 1)
    readonly position: { x: number; y: number };
    readonly alternativePositions?: Array<{ x: number; y: number }>; // Pour count > 1
  }>;
  readonly allies?: string[];  // IDs des alliés
  
  // Configuration tactique enrichie
  readonly combat?: {
    readonly gridSize: { width: number; height: number };
    readonly playerStartPosition: { x: number; y: number };
    readonly initiativeBonus?: number;
    readonly surpriseRound?: boolean;
    readonly environment?: string;
  };
  
  // Terrain tactique enrichi
  readonly terrain?: Array<{
    readonly x: number;
    readonly y: number;
    readonly type: 'normal' | 'difficult' | 'impassable' | 'water' | 'pit';
    readonly cover?: 'none' | 'half' | 'three_quarters' | 'full';
    readonly description?: string;
    readonly movementCost?: number;
  }>;
  
  // Conditions de combat
  readonly objectives?: {
    readonly victory: 'defeat_all_enemies' | 'escape' | 'survive_rounds' | 'reach_location';
    readonly defeat: 'player_death' | 'party_wipe' | 'time_limit';
    readonly special?: Array<{
      readonly type: string;
      readonly condition: string;
      readonly description: string;
    }>;
  };
  
  // Récompenses
  readonly rewards?: {
    readonly xp: number;
    readonly gold: number;
    readonly items: string[];
    readonly reputation?: {
      readonly faction: string;
      readonly points: number;
    };
  };
  
  // Effets d'ambiance
  readonly ambiance?: {
    readonly backgroundMusic?: string;
    readonly soundEffects?: string[];
    readonly lighting?: string;
    readonly weather?: string;
  };
}

export interface InvestigationSceneContent {
  readonly clues: Array<{
    readonly id: string;
    readonly text: string;
    readonly difficulty: number; // DC pour découvrir
    readonly found: boolean;
  }>;
  readonly skillChecks: Array<{
    readonly skill: string;
    readonly dc: number;
    readonly successText: string;
    readonly failureText: string;
  }>;
}

export interface MerchantSceneContent {
  readonly merchantId: string;
  readonly inventory: Array<{
    readonly itemId: string;
    readonly itemType: 'weapon' | 'armor' | 'jewelry' | 'consumable' | 'resource';
    readonly price: number;
    readonly quantity: number;
  }>;
  readonly buyback: boolean; // Le marchand rachète-t-il les objets ?
  readonly reputation?: number; // Relation avec le marchand
}

export interface CraftingSceneContent {
  readonly availableRecipes: string[]; // IDs des recettes disponibles
  readonly workbenchType: 'basic' | 'advanced' | 'magical';
  readonly bonuses?: Array<{
    readonly type: 'speed' | 'quality' | 'success_chance';
    readonly value: number;
  }>;
}

export interface PuzzleSceneContent {
  readonly puzzleType: 'riddle' | 'mechanism' | 'pattern' | 'logic';
  readonly description: string;
  readonly solution: string;
  readonly hints: string[];
  readonly attempts: number;
  readonly maxAttempts: number;
  readonly solved: boolean;
}

export interface DungeonSceneContent {
  readonly rooms: number;
  readonly difficulty: 1 | 2 | 3 | 4 | 5;
  readonly enemyPool: string[]; // IDs des ennemis possibles
  readonly lootTables: Array<{
    readonly rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
    readonly dropChance: number;
    readonly items: string[];
  }>;
  readonly completed: boolean;
  readonly currentRoom: number;
}

// Choix de transition entre scènes
export interface SceneChoice {
  readonly id: string;
  readonly text: string;
  readonly targetSceneId: string;
  readonly conditions?: SceneCondition[];
  readonly effects?: SceneEffect[];
  readonly hidden?: boolean; // Choix caché jusqu'à ce qu'une condition soit remplie
}

// Conditions pour débloquer scènes ou choix
export interface SceneCondition {
  readonly type: 'item_possessed' | 'character_level' | 'quest_completed' | 'stat_minimum' | 'time_of_day' | 'scene_visited';
  readonly target: string;
  readonly value: number | string | boolean;
  readonly operator: 'equals' | 'greater' | 'less' | 'contains';
}

// Effets appliqués lors de transitions
export interface SceneEffect {
  readonly type: 'add_item' | 'remove_item' | 'gain_xp' | 'change_hp' | 'add_buff' | 'advance_time';
  readonly target: string;
  readonly value: number | string;
  readonly duration?: number; // Pour les buffs temporaires
}