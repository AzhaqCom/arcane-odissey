/**
 * PRESENTATION HOOK - useUIState
 * CONSTITUTION #3 - UI passe par les hooks, jamais direct aux UseCases
 * Encapsule UIStateUseCase pour respecter la séparation des couches
 */

import { Character } from '../../domain/entities/Character';
import { UIStateUseCase, type HealthDisplayData } from '../../application/usecases/UIStateUseCase';

export const useUIState = () => {
  /**
   * Récupère les données d'affichage de santé pour un personnage
   * CONSTITUTION #5 - Injection via le UseCase (DI configuré là-bas)
   */
  const getHealthDisplayData = (character: Character): HealthDisplayData => {
    return UIStateUseCase.getHealthDisplayData(character);
  };

  /**
   * Formate le texte de santé d'un personnage
   */
  const formatHealthText = (character: Character): string => {
    return UIStateUseCase.formatHealthText(character);
  };

  /**
   * Détermine si un personnage a besoin de soins urgents
   */
  const needsUrgentHealing = (character: Character): boolean => {
    return UIStateUseCase.needsUrgentHealing(character);
  };

  /**
   * Récupère les données d'affichage pour un groupe de personnages
   */
  const getPartyHealthDisplayData = (characters: Character[]): HealthDisplayData[] => {
    return UIStateUseCase.getPartyHealthDisplayData(characters);
  };

  // Interface publique du hook
  return {
    getHealthDisplayData,
    formatHealthText,
    needsUrgentHealing,
    getPartyHealthDisplayData
  };
};