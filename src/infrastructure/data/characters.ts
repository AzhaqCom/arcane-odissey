/**
 * INFRASTRUCTURE - Characters Data (Redirect)
 * Point d'entrée principal - redirige vers la nouvelle architecture modulaire
 */

// Redirection vers la nouvelle architecture modulaire
export { 
  CHARACTERS_DATA,
  PLAYERS_DATA,
  COMPANIONS_DATA, 
  ENEMY_TEMPLATES,
  EnemyInstanceFactory,
  CharacterUtils
} from './characters/index';

// Export par défaut pour compatibilité
export { default } from './characters/index';