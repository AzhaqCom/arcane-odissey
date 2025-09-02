/**
 * PRESENTATION HOOK - useCombat
 * Hook React pur pour la gestion d'état du combat
 * Responsabilité : État React + Délégation pure vers CombatOrchestrationService
 * AUCUNE LOGIQUE MÉTIER - Seulement orchestration et mise à jour d'état
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { DIContainer } from '../../infrastructure/container/DIContainer';
import type { Combat } from '../../domain/entities/Combat';
import type { Position } from '../../domain/entities/Combat';
// Removed unused import EnemyEncounter
import type { CombatSceneContent } from '../../infrastructure/data/types/SceneData';
import { EncounterMapper } from '../../application/mappers/EncounterMapper';
// Temporary LogEntry interface for compilation
interface LogEntry {
  message: string;
  type: string;
}
import type { CombatUseCase } from '../../application/usecases/CombatUseCase';
import type { SpellLevel } from '../../domain/entities/Spell';
import { CombatSession } from '../../domain/entities/CombatSession';
import type { ICombatRepository } from '../../domain/repositories';

export const useCombat = (sceneContent: CombatSceneContent) => {
  // PHASE 3 - Services depuis DIContainer
  const combatUseCase = DIContainer.getInstance().get<CombatUseCase>('CombatUseCase');
  
  // État React pur - Aucune logique métier
  const [combat, setCombat] = useState<Combat | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // PHASE 2 - ACTION 2.1.1: Getters Domain dans useCombat
  // Centraliser TOUS les accès Domain pour Presentation stupide
  const healthDisplays = useMemo(() => {
    if (!combat) return new Map();
    
    const displays = new Map();
    Array.from(combat.entities.values()).forEach(entity => {
      displays.set(entity.id, combat.getEntityHealthDisplay(entity.id));
    });
    return displays;
  }, [combat]);

  const reachableCells = useMemo(() => {
    if (!combat) return new Set<string>();
    
    const currentEntity = combat.getCurrentEntity();
    if (!currentEntity) return new Set<string>();
    
    const positions = combat.getReachableCells(currentEntity.id);
    return new Set(positions.map(pos => `${pos.x},${pos.y}`));
  }, [combat]);

  // PHASE 2 - ACTION 2.1.2: Helpers formatage dans useCombat
  // Centraliser validations et formatages pour Presentation stupide
  const spellValidations = useMemo(() => {
    if (!combat) return new Map();
    
    const currentEntity = combat.getCurrentEntity();
    if (!currentEntity) return new Map();
    
    const validations = new Map();
    currentEntity.knownSpells.forEach(spell => {
      validations.set(spell.id, combat.canCastSpell(currentEntity.id, spell.id));
    });
    return validations;
  }, [combat]);

  const weaponData = useMemo(() => {
    if (!combat) return new Map();
    
    const currentEntity = combat.getCurrentEntity();
    if (!currentEntity) return new Map();
    
    const data = new Map();
    currentEntity.inventory?.weapons?.forEach((weaponId: string) => {
      // weaponId est un string, pas un objet Weapon
      data.set(weaponId, {
        canAttack: (targetPos: Position) => combat.canAttackPosition(currentEntity.id, targetPos, weaponId),
        range: 5 // Default range, should be retrieved from weapon repository
      });
    });
    return data;
  }, [combat]);

  // PHASE 2 - ACTION 2.1.2 (suite): Formatage dégâts sorts
  const formattedDamages = useMemo(() => {
    if (!combat) return new Map();
    
    const currentEntity = combat.getCurrentEntity();
    if (!currentEntity) return new Map();
    
    const damages = new Map();
    currentEntity.knownSpells.forEach(spell => {
      if (spell.effects.damage && spell.effects.damage.length > 0) {
        // spell.effects.damage est un DamageRoll[]
        const firstDamage = spell.effects.damage[0];
        const formatted = `${firstDamage.diceCount}d${firstDamage.diceType}${firstDamage.modifier > 0 ? `+${firstDamage.modifier}` : firstDamage.modifier < 0 ? firstDamage.modifier : ''}`;
        damages.set(spell.id, formatted);
      }
    });
    return damages;
  }, [combat]);

  // Initialisation via le CombatUseCase (conserver la logique existante d'initialisation)
  useEffect(() => {
    const initializeCombat = async () => {
      setIsLoading(true);
      try {
        const playerIds = ['Elarion']; // IDs des joueurs actifs
        
        // Déléguer transformation données au Mapper Application
        const enemyEncounters = EncounterMapper.sceneContentToEnemyEncounters(sceneContent);
        const initialPositions = EncounterMapper.getPlayerInitialPositions(sceneContent);
        
        // Utiliser le CombatUseCase existant pour l'initialisation (legacy)
        const result = await combatUseCase.initiateCombat(
          playerIds,
          enemyEncounters,
          initialPositions
        );
        
        if (result.success && result.combat) {
          setCombat(result.combat);
          addLog('success', `Combat initialisé avec ${result.combat.entities.size} entités`);
          
          // MIGRATION : Créer une session pour le nouveau système
          console.log('🔄 useCombat: Creating session from existing combat');
          try {
            const session = CombatSession.create(result.combat);
            const repo = DIContainer.getInstance().get<ICombatRepository>('CombatRepository');
            await repo.saveSession(session);
            console.log('✅ useCombat: Session created and saved');
          } catch (sessionError) {
            console.error('❌ useCombat: Failed to create session', sessionError);
          }
          
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
      const result = await combatUseCase.performWeaponAttack(attackerId, weaponId, targetId);
      
      // Mise à jour de l'état React
      if (result.combat) setCombat(result.combat);
      
      // Log de l'action
      addLog(result.success ? 'success' : 'error', result.error || 'Action réussie');
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'attaque';
      addLog('error', errorMessage);
      setError(errorMessage);
    }
  }, [combatUseCase]);

  /**
   * Lancer un sort - DÉLÉGATION PURE  
   */
  const castSpell = useCallback(async (casterId: string, spellId: string, level: SpellLevel, targetId?: string) => {
    if (!combat) return;
    
    try {
      const result = await combatUseCase.castSpell(casterId, spellId, level, targetId);
      
      // Mise à jour de l'état React
      if (result.combat) setCombat(result.combat);
      
      // Log de l'action
      addLog(result.success ? 'success' : 'error', result.error || 'Sort lancé');
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du lancement du sort';
      addLog('error', errorMessage);
      setError(errorMessage);
    }
  }, [combatUseCase]);

  /**
   * Déplacer une entité - DÉLÉGATION PURE
   */
  const moveEntity = useCallback(async (entityId: string, newPosition: Position) => {
    if (!combat) return;
    
    try {
      const result = await combatUseCase.moveEntity(entityId, newPosition);
      
      // Mise à jour de l'état React
      if (result.combat) setCombat(result.combat);
      
      // Log de l'action
      addLog(result.success ? 'info' : 'error', result.error || 'Mouvement effectué');
      
      // Les attaques d'opportunité sont gérées dans Combat.executeMovement
      // Pas besoin de log séparé ici
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du mouvement';
      addLog('error', errorMessage);
      setError(errorMessage);
    }
  }, [combatUseCase]);

  /**
   * Avancer au tour suivant - DÉLÉGATION PURE
   */
  const advanceToNextEntity = useCallback(async () => {
    if (!combat) return;
    
    try {
      // Utiliser l'API immutable du domaine pour avancer le tour
      const newCombat = combat.withAdvancedTurn();
      const currentEntity = newCombat.getCurrentEntity();
      
      // Mise à jour de l'état React
      setCombat(newCombat);
      
      // Log de l'action
      const message = `Tour passé à ${currentEntity?.name || 'Entité inconnue'} (Round ${newCombat.round})`;
      addLog('info', message);
      
      const result = { newCombat, message: 'Turn advanced' };
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'avancement du tour';
      addLog('error', errorMessage);
      setError(errorMessage);
    }
  }, [combat]);

  /**
   * @deprecated Utiliser triggerAutomaticAITurn() à la place
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
        
        // Forcer la mise à jour de l'état (trigger re-render)
        setCombat(prevCombat => prevCombat);
      }
      
      return aiResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du tour IA';
      addLog('error', errorMessage);
      setError(errorMessage);
    }
  }, [combat]);

  /**
   * Déclencher un tour IA complet automatique (mouvement + attaque)
   * Respecte la Constitution Architecturale - Règle #3 : Présentation via Hook
   * Version Session Pattern (nouvelle)
   */
  const triggerAutomaticAITurn = useCallback(async () => {
    if (!combat) {
      console.log('❌ useCombat: No combat available for AI turn');
      return null;
    }
    
    const currentBeforeCall = combat.getCurrentEntity();
    console.log('🎯 useCombat: triggerAutomaticAITurn called for', currentBeforeCall?.name, 'type:', currentBeforeCall?.type);
    
    try {
      // Utiliser la nouvelle méthode Session Pattern
      const result = await combatUseCase.executeAutomaticAITurnSession();
      console.log('📊 useCombat: AI turn session result', result);
      
      // Mise à jour de l'état React depuis la session
      if (result.session) {
        setCombat(result.session.combat);
      }
      
      // Log de l'action avec détails
      const logType = result.success ? 'success' : 'error';
      const message = result.error || 'Tour IA automatique terminé (Session Pattern)';
      
      addLog(logType, message);
      
      return result;
    } catch (err) {
      console.error('❌ useCombat: Error in triggerAutomaticAITurn', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du tour IA automatique';
      addLog('error', errorMessage);
      setError(errorMessage);
    }
  }, [combat, combatUseCase]);

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
    
    // PHASE 2 - Données Domain centralisées (Action 2.1.1-2.1.2)
    healthDisplays,
    reachableCells,
    spellValidations,
    weaponData,
    formattedDamages,
    
    // Actions d'orchestration - TOUTES déléguées au service
    performWeaponAttack,
    castSpell,
    moveEntity,
    advanceToNextEntity,
    executeAITurn, // @deprecated
    triggerAutomaticAITurn,
    
    // Utilitaires
    addLog,
    clearLogs,
    clearError
  };
};