/**
 * PRESENTATION - useRepositories Hook
 * Hook pour accéder facilement aux repositories depuis les composants
 */

import { useMemo } from 'react';
import { DIContainer, TOKENS } from '../../infrastructure/container/DIContainer';
import type { WeaponRepository } from '../../infrastructure/repositories/WeaponRepository';
import type { SpellRepository } from '../../infrastructure/repositories/SpellRepository';
import type { CharacterRepository } from '../../infrastructure/repositories/CharacterRepository';
import type { SceneRepository } from '../../infrastructure/repositories/SceneRepository';
import type { GameSessionRepository } from '../../infrastructure/repositories/GameSessionRepository';
import type { GameDataStore } from '../../infrastructure/stores/GameDataStore';
import type { SaveGameStore } from '../../infrastructure/stores/SaveGameStore';
import type { SceneUseCase } from '../../application/usecases/SceneUseCase';
import type { GameUseCase } from '../../application/usecases/GameUseCase';
// import type { CombatUseCase } from '../../application/usecases/CombatUseCase'; // ✅ SUPPRIMÉ - Remplacé par CombatGameUseCase

/**
 * Hook pour accéder aux repositories de manière typée
 */
// ✅ OPTIMISATION: Créer une seule fois les références aux services
let repositoriesCache: ReturnType<typeof createRepositories> | null = null;

const createRepositories = () => {
  const container = DIContainer.getInstance();
  
  return {
    // Stores
    gameDataStore: container.get<GameDataStore>(TOKENS.GameDataStore),
    saveGameStore: container.get<SaveGameStore>(TOKENS.SaveGameStore),
    
    // Repositories
    weaponRepository: container.get<WeaponRepository>(TOKENS.WeaponRepository),
    spellRepository: container.get<SpellRepository>(TOKENS.SpellRepository),
    characterRepository: container.get<CharacterRepository>(TOKENS.CharacterRepository),
    sceneRepository: container.get<SceneRepository>(TOKENS.SceneRepository),
    gameSessionRepository: container.get<GameSessionRepository>(TOKENS.GameSessionRepository),
    
    // Use Cases
    sceneUseCase: container.get<SceneUseCase>(TOKENS.SceneUseCase),
    gameUseCase: container.get<GameUseCase>(TOKENS.GameUseCase),
    // combatUseCase: SUPPRIMÉ - Utilisez CombatGameUseCase via useCombatGame() à la place
  };
};

export const useRepositories = () => {
  return useMemo(() => {
    if (!repositoriesCache) {
      repositoriesCache = createRepositories();
    }
    return repositoriesCache;
  }, []);
};

/**
 * Hook pour accéder spécifiquement au WeaponRepository
 */
export const useWeaponRepository = () => {
  const { weaponRepository } = useRepositories();
  return weaponRepository;
};

/**
 * Hook pour accéder spécifiquement au SpellRepository
 */
export const useSpellRepository = () => {
  const { spellRepository } = useRepositories();
  return spellRepository;
};

/**
 * Hook pour accéder spécifiquement au CharacterRepository
 */
export const useCharacterRepository = () => {
  const { characterRepository } = useRepositories();
  return characterRepository;
};

/**
 * Hook pour accéder aux données du jeu
 */
export const useGameData = () => {
  const { gameDataStore, saveGameStore } = useRepositories();
  
  return useMemo(() => ({
    // Stats générales
    getStats: () => gameDataStore.getStoreStats(),
    
    // Recherche globale
    searchWeapons: (query: string) => gameDataStore.searchWeapons(query),
    searchSpells: (query: string) => gameDataStore.searchSpells(query),
    searchCharacters: (query: string) => gameDataStore.searchCharacters(query),
    
    // Validation
    validateWeaponIds: (ids: string[]) => gameDataStore.validateWeaponIds(ids),
    validateSpellIds: (ids: string[]) => gameDataStore.validateSpellIds(ids),
    
    // Sauvegarde
    hasSaveGame: () => saveGameStore.hasSaveGame(),
    getSaveInfo: () => saveGameStore.getSaveInfo(),
    
  }), [gameDataStore, saveGameStore]);
};