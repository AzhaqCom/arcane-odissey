/**
 * INFRASTRUCTURE - Characters Data Index
 * Point d'entrée centralisé pour tous les personnages
 */

import { PLAYERS_DATA } from './players';
import { COMPANIONS_DATA } from './companions';
import { ENEMY_TEMPLATES, EnemyInstanceFactory } from './enemies';
import type { CharacterData } from '../types/CharacterData';

// Export des données par catégorie
export { PLAYERS_DATA } from './players';
export { COMPANIONS_DATA } from './companions';
export { ENEMY_TEMPLATES, EnemyInstanceFactory } from './enemies';

// Export consolidé - TOUTES les données comme avant pour compatibilité
export const CHARACTERS_DATA: readonly CharacterData[] = [
  ...PLAYERS_DATA,
  ...COMPANIONS_DATA,
  // Note: Les enemies ne sont plus inclus directement
  // Ils sont générés dynamiquement via EnemyInstanceFactory
];

/**
 * Utilitaires pour récupérer les personnages par type
 */
export const CharacterUtils = {
  /**
   * Obtenir tous les joueurs
   */
  getPlayers: (): readonly CharacterData[] => PLAYERS_DATA,
  
  /**
   * Obtenir tous les compagnons
   */
  getCompanions: (): readonly CharacterData[] => COMPANIONS_DATA,
  
  /**
   * Obtenir les templates d'ennemis
   */
  getEnemyTemplates: (): readonly CharacterData[] => ENEMY_TEMPLATES,
  
  /**
   * Créer des instances d'ennemis pour un combat
   * Exemple: createEnemyInstances([{ templateId: 'goblin_template', count: 2 }])
   */
  createEnemyInstances: (encounters: Array<{
    templateId: string;
    count: number;
    positions?: Array<{ x: number; y: number }>;
    options?: any;
  }>): CharacterData[] => {
    return EnemyInstanceFactory.createCombatGroup(encounters);
  },
  
  /**
   * Obtenir un personnage par ID (toutes catégories)
   */
  getCharacterById: (id: string): CharacterData | null => {
    // Chercher dans les joueurs
    const player = PLAYERS_DATA.find(c => c.id === id);
    if (player) return player;
    
    // Chercher dans les compagnons
    const companion = COMPANIONS_DATA.find(c => c.id === id);
    if (companion) return companion;
    
    // Chercher dans les templates d'ennemis
    const enemyTemplate = ENEMY_TEMPLATES.find(c => c.id === id);
    if (enemyTemplate) return enemyTemplate;
    
    return null;
  },
  
  /**
   * Statistiques des données
   */
  getStats: () => ({
    players: PLAYERS_DATA.length,
    companions: COMPANIONS_DATA.length,
    enemyTemplates: ENEMY_TEMPLATES.length,
    total: PLAYERS_DATA.length + COMPANIONS_DATA.length + ENEMY_TEMPLATES.length
  })
};

export default CHARACTERS_DATA;