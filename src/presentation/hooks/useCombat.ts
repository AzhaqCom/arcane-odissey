/**
 * PRESENTATION HOOK - useCombat
 * Hook React pur pour la gestion d'état du combat
 * Responsabilité : État React + Délégation pure vers CombatOrchestrationService
 * AUCUNE LOGIQUE MÉTIER - Seulement orchestration et mise à jour d'état
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { DIContainer } from '../../infrastructure/container/DIContainer';
import { CombatOrchestrationService } from '../../application/services/CombatOrchestrationService';
import type { Combat } from '../../domain/entities/Combat';
import type { Position } from '../../domain/entities/Combat';
import type { EnemyEncounter } from '../../application/usecases/CombatUseCase';
import type { CombatSceneContent } from '../../infrastructure/data/types/SceneData';
import type { LogEntry } from '../components/GameLog';
import type { CombatUseCase } from '../../application/usecases/CombatUseCase';
import type { SpellLevel } from '../../domain/entities/Spell';

export const useCombat = (sceneContent: CombatSceneContent) => {
  // État React pur - Aucune logique métier
  const [combat, setCombat] = useState<Combat | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Services injectés - Pattern Dependency Injection
  const combatUseCase: CombatUseCase = DIContainer.getInstance().get('CombatUseCase');
  const orchestrationService = useMemo(() => new CombatOrchestrationService(), []);

  // Initialisation via le CombatUseCase (conserver la logique existante d'initialisation)
  useEffect(() => {
    const initializeCombat = async () => {
      setIsLoading(true);
      try {
        const playerIds = ['Elarion']; // IDs des joueurs actifs
        
        const enemyEncounters: EnemyEncounter[] = sceneContent.enemies.map(enemyDef => {
          const positions: Position[] = [enemyDef.position];
          if (enemyDef.alternativePositions) {
            positions.push(...enemyDef.alternativePositions);
          }
          return {
            templateId: enemyDef.templateId,
            count: enemyDef.count || 1,
            positions: positions
          };
        });

        const initialPositions: Record<string, Position> = {
          'Elarion': sceneContent.combat?.playerStartPosition || { x: 2, y: 6 }
        };

        // Utiliser le CombatUseCase existant pour l'initialisation
        const result = await combatUseCase.initiateCombat(
          playerIds,
          enemyEncounters,
          initialPositions
        );
        
        if (result.success && result.combat) {
          setCombat(result.combat);
          addLog('success', `Combat initialisé avec ${result.combat.entities.size} entités`);
        } else {
          throw new Error(result.error || 'Erreur lors de l\'initialisation du combat');
        }
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'initialisation du combat';
        setError(errorMessage);
        addLog('error', errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    initializeCombat();
  }, [sceneContent, combatUseCase]);

  // === FONCTIONS D'ACTION - DÉLÉGATION PURE VERS LE SERVICE ===

  /**
   * Exécuter une attaque d'arme - DÉLÉGATION PURE
   */
  const performWeaponAttack = useCallback(async (attackerId: string, weaponId: string, targetId: string) => {
    if (!combat) return;
    
    try {
      const result = orchestrationService.performWeaponAttack(combat, attackerId, weaponId, targetId);
      
      // Mise à jour de l'état React
      setCombat(result.newCombat);
      
      // Log de l'action
      addLog(result.success ? 'success' : 'error', result.message);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'attaque';
      addLog('error', errorMessage);
      setError(errorMessage);
    }
  }, [combat, orchestrationService]);

  /**
   * Lancer un sort - DÉLÉGATION PURE  
   */
  const castSpell = useCallback(async (casterId: string, spellId: string, level: SpellLevel, targetId?: string) => {
    if (!combat) return;
    
    try {
      const result = orchestrationService.castSpellAction(combat, casterId, spellId, level, targetId);
      
      // Mise à jour de l'état React
      setCombat(result.newCombat);
      
      // Log de l'action
      addLog(result.success ? 'success' : 'error', result.message);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du lancement du sort';
      addLog('error', errorMessage);
      setError(errorMessage);
    }
  }, [combat, orchestrationService]);

  /**
   * Déplacer une entité - DÉLÉGATION PURE
   */
  const moveEntity = useCallback(async (entityId: string, newPosition: Position) => {
    if (!combat) return;
    
    try {
      const result = orchestrationService.executeMovement(combat, entityId, newPosition);
      
      // Mise à jour de l'état React
      setCombat(result.newCombat);
      
      // Log de l'action
      addLog(result.success ? 'info' : 'error', result.message);
      
      // Gestion des attaques d'opportunité si présentes
      if (result.opportunityAttacks && result.opportunityAttacks.length > 0) {
        addLog('warning', `Attaques d'opportunité provoquées par: ${result.opportunityAttacks.join(', ')}`);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du mouvement';
      addLog('error', errorMessage);
      setError(errorMessage);
    }
  }, [combat, orchestrationService]);

  /**
   * Avancer au tour suivant - DÉLÉGATION PURE
   */
  const advanceToNextEntity = useCallback(async () => {
    if (!combat) return;
    
    try {
      const result = orchestrationService.executeTurnAdvancement(combat);
      
      // Mise à jour de l'état React
      setCombat(result.newCombat);
      
      // Log de l'action
      addLog('info', result.message);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'avancement du tour';
      addLog('error', errorMessage);
      setError(errorMessage);
    }
  }, [combat, orchestrationService]);

  /**
   * Exécuter un tour d'IA - DÉLÉGATION VERS LE DOMAINE
   */
  const executeAITurn = useCallback(async () => {
    if (!combat) return null;
    
    try {
      // Utilisation directe de l'API immutable du domaine pour l'IA
      const aiResult = combat.executeAITurn();
      
      if (aiResult) {
        // L'IA a modifié le combat directement (méthode mutable legacy)
        // Nous devrons gérer cela différemment après le nettoyage complet
        addLog(aiResult.valid ? 'success' : 'warning', 
               `Tour IA ${aiResult.valid ? 'exécuté' : 'échoué'}${aiResult.damage ? ` (${aiResult.damage} dégâts)` : ''}${aiResult.healing ? ` (${aiResult.healing} soins)` : ''}`);
        
        // Forcer la mise à jour de l'état
        setCombat(combat => combat ? { ...combat } : null);
      }
      
      return aiResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du tour IA';
      addLog('error', errorMessage);
      setError(errorMessage);
    }
  }, [combat]);

  // === FONCTIONS UTILITAIRES PURES ===

  /**
   * Ajouter une entrée au log - Fonction utilitaire pure
   */
  const addLog = useCallback((type: 'info' | 'success' | 'warning' | 'error', message: string) => {
    setLogs(prevLogs => [...prevLogs, {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date()
    }]);
  }, []);

  /**
   * Effacer les logs
   */
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  /**
   * Réinitialiser l'erreur
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // === GETTERS D'ÉTAT DÉRIVÉ - COMPUTED VALUES ===

  /**
   * Obtenir l'entité courante (computed value)
   */
  const currentEntity = useMemo(() => {
    return combat ? combat.getCurrentEntity() : null;
  }, [combat]);

  /**
   * Vérifier si le combat est terminé (computed value)
   */
  const isCombatEnded = useMemo(() => {
    if (!combat) return false;
    return combat.phase === 'victory' || combat.phase === 'defeat';
  }, [combat]);

  /**
   * Obtenir le statut du combat pour l'UI (computed value)
   */
  const combatStatus = useMemo(() => {
    if (isLoading) return 'loading';
    if (error) return 'error';
    if (!combat) return 'not_initialized';
    if (isCombatEnded) return 'ended';
    return 'active';
  }, [isLoading, error, combat, isCombatEnded]);

  // === INTERFACE PUBLIQUE DU HOOK ===

  return {
    // État principal
    combat,
    logs,
    error,
    isLoading,
    
    // État dérivé
    currentEntity,
    isCombatEnded,
    combatStatus,
    
    // Actions d'orchestration - TOUTES déléguées au service
    performWeaponAttack,
    castSpell,
    moveEntity,
    advanceToNextEntity,
    executeAITurn,
    
    // Utilitaires
    addLog,
    clearLogs,
    clearError
  };
};