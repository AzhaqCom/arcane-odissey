/**
 * INFRASTRUCTURE - GameDataStore
 * Lecteur centralisé pour toutes les données statiques du jeu
 */
import { WEAPONS_DATA } from '../data/weapons';
import { SPELLS_DATA } from '../data/spells';
import { PLAYERS_DATA } from '../data/characters/players';
import { COMPANIONS_DATA } from '../data/characters/companions';
import { ENEMY_TEMPLATES, type EnemyTemplate } from '../data/characters/enemies';
import { SCENES_DATA } from '../data/scenes';
import { CLASSES_DATA } from '../data/classes';

import type { WeaponData } from '../data/types/WeaponData';
import type { SpellData } from '../data/types/SpellData';
import type { AnyCharacterDataSource } from '../data/types/CharacterData';
import type { SceneData } from '../data/types/SceneData';
import type { ClassData } from '../data/types/ClassData';

export class GameDataStore {
  
  // --- CHARACTERS & CLASSES ---

  getCharacterDataSource(id: string): AnyCharacterDataSource | null {
    const allCharacters = [...PLAYERS_DATA, ...COMPANIONS_DATA];
    return allCharacters.find(character => character.id === id) || null;
  }

  getAllCharacterDataSources(): readonly AnyCharacterDataSource[] {
    return [...PLAYERS_DATA, ...COMPANIONS_DATA];
  }

  getEnemyTemplate(id: string): EnemyTemplate | null {
    return ENEMY_TEMPLATES.find(template => template.id === id) || null;
  }

  getClassData(id: string): ClassData | null {
    return CLASSES_DATA.find(c => c.id === id) || null;
  }

  // --- WEAPONS, SPELLS, SCENES ---
  
  getAllWeapons = (): readonly WeaponData[] => WEAPONS_DATA;
  getWeapon = (id: string): WeaponData | null => WEAPONS_DATA.find(w => w.id === id) || null;
  getWeaponsByIds = (ids: string[]): WeaponData[] => {
    return ids.map(id => this.getWeapon(id)).filter((weapon): weapon is WeaponData => weapon !== null);
  };
  
  getAllSpells = (): readonly SpellData[] => SPELLS_DATA;
  getSpell = (id: string): SpellData | null => SPELLS_DATA.find(s => s.id === id) || null;
  getSpellsByIds = (ids: string[]): SpellData[] => {
    return ids.map(id => this.getSpell(id)).filter((spell): spell is SpellData => spell !== null);
  };

  getAllScenes = (): readonly SceneData[] => SCENES_DATA;
  getScene = (id: string): SceneData | null => SCENES_DATA.find(s => s.id === id) || null;

  /**
   * Stats du store pour debug
   */
  getStoreStats() {
    return {
      weapons: WEAPONS_DATA.length,
      spells: SPELLS_DATA.length,
      players: PLAYERS_DATA.length,
      companions: COMPANIONS_DATA.length,
      enemyTemplates: ENEMY_TEMPLATES.length,
      scenes: SCENES_DATA.length,
      classes: CLASSES_DATA.length,
    };
  }
}