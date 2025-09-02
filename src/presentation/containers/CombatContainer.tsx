import React from 'react';
import { Scene, GameSession } from '../../domain/entities';
import type { SceneAnalysis } from '../../application/usecases/SceneUseCase';
import type { CombatSceneContent } from '../../infrastructure/data/types/SceneData';
import type { DomainCombatPhase, UICombatPhase } from '../../types/combat';
import { CombatScene } from '../components/CombatScene';
import { useCombat } from '../hooks/useCombat';
import { useRepositories } from '../hooks/useRepositories'; // Pour weaponRepository, spellRepository
import { logger } from '../../infrastructure/services/Logger';

interface CombatContainerProps {
  scene: Scene;
  gameSession: GameSession;
  sceneAnalysis: SceneAnalysis;
  onChoiceSelected: (choiceId: string, targetSceneId: string) => void;
  onCombatComplete: () => void;
}

export const CombatContainer: React.FC<CombatContainerProps> = ({
  scene,
  gameSession,
  sceneAnalysis,
  onChoiceSelected,
  onCombatComplete
}) => {
  // États locaux pour les interactions
  const [isMovementMode, setIsMovementMode] = React.useState(false);
  const [targetingWeapon, setTargetingWeapon] = React.useState<string | null>(null); // weaponId when targeting
  const [targetingSpell, setTargetingSpell] = React.useState<string | null>(null);   // spellId when targeting

  // Le hook useCombat retourne maintenant l'état du combat ET les méthodes d'action
  const {
    combat,
    logs,
    error,
    isLoading,
    // PHASE 2 - Nouvelles données Domain centralisées
    healthDisplays,
    reachableCells,
    spellValidations,
    weaponData,
    formattedDamages,
    // Méthodes exposées par le hook
    executeAITurn, // @deprecated
    triggerAutomaticAITurn,
    moveEntity,
    performWeaponAttack,
    castSpell,
    advanceToNextEntity
  } = useCombat(scene.content as CombatSceneContent);

  // Récupération des autres services (pour les props du CombatPanel)
  const { weaponRepository, spellRepository } = useRepositories();
  
  // PHASE 2 - ACTION 2.2.3: Supprimé EquipmentService - tout via useCombat

  
  // Détecter fin de combat
  React.useEffect(() => {
    if (combat && (combat.phase === 'victory' || combat.phase === 'defeat')) {
      logger.ui('Combat ended', { 
        phase: combat.phase,
        victory: combat.phase === 'victory'
      });
      setTimeout(() => {
        onCombatComplete();
      }, 3000);
    }
  }, [combat?.phase, onCombatComplete]);

  /**
   * Gérer les actions de combat depuis l'UI
   */
  const handleCombatAction = async (action: any) => {
    
    logger.ui('Combat action from UI', { action });
    
    try {
      switch (action.type) {
        case 'start_combat':
          
          // initiateCombat est déjà appelé par useEffect du hook
          // Si on veut un bouton "Redémarrer combat", il faudrait une méthode spécifique
          break;
        case 'advance_turn':
          
          await advanceToNextEntity();
          
          break;
        case 'execute_ai_turn':
          
          await executeAITurn();
          
          break;
        case 'move_entity':
          
          // moveEntity est déjà exposé par le hook
          // Si startMovement/cancelMovement sont nécessaires, il faut les ajouter au hook
          break;
        case 'attack_weapon':
          
          await performWeaponAttack(action.attackerId, action.weaponId, action.targetId);
          break;
        case 'cast_spell':
          
          await castSpell(action.casterId, action.spellId, 1, action.targetId);
          break;
        default:
          
          logger.ui('Unknown combat action', { action });
      }
    } catch (error) {
  
      logger.error('❌ Error in handleCombatAction:', error instanceof Error ? error.message : String(error));
      logger.ui('Error in combat action', { action, error });
    }
  };

  /**
   * Mapper les phases du domaine vers les phases UI
   */
  const mapDomainPhaseToUI = (combat: any): UICombatPhase => {
    const domainPhase = combat.phase as DomainCombatPhase;
    
    switch(domainPhase) {
      case 'setup': 
        return 'pre_combat';
      case 'combat': {
        const currentEntity = combat.getCurrentEntity();
        return currentEntity?.type === 'player' ? 'player_turn' : 'ai_turn';
      }
      case 'victory': 
        return 'victory';
      case 'defeat': 
        return 'defeat';
      default: 
        return 'pre_combat';
    }
  };

  /**
   * Convertir données de combat pour CombatPanel
   */
  const getCombatPanelProps = () => {
   
    if (!combat) return {}; // Protection si combat n'est pas encore chargé

    const currentEntity = combat.getCurrentEntity();
    const uiPhase = mapDomainPhaseToUI(combat);
    const isPlayerTurn = uiPhase === 'player_turn';
    
    
    
    // PHASE 2 - ACTION 2.2.3: Récupération armes via weaponData du hook
    const weapons = isPlayerTurn && currentEntity ? 
      (currentEntity.inventory?.weapons || []) : [];
    const spellIds = isPlayerTurn && gameSession.playerCharacter ? 
      [...new Set([...gameSession.playerCharacter.knownSpells, ...gameSession.playerCharacter.preparedSpells])] : [];
    const spells = spellIds.length > 0 ? spellRepository.getSpellsByIds(spellIds) : [];
    
    return {
      phase: uiPhase,
      currentEntity,
      isPlayerTurn,
      isLoading: isLoading, // Utilise l'état de chargement du hook
      isMovementMode: isMovementMode,
      targetingWeapon: targetingWeapon,
      targetingSpell: targetingSpell,
      weapons,
      spells,
      // PHASE 2 - ACTION 2.2.2: Données pré-calculées depuis useCombat
      spellValidations,
      formattedDamages,
      onStartCombat: () => {
        
        handleCombatAction({ type: 'start_combat' });
      },
      onAdvanceTurn: () => {
        
        handleCombatAction({ type: 'advance_turn' });
      },
      onExecuteAITurn: () => { // @deprecated
        
        handleCombatAction({ type: 'execute_ai_turn' });
      },
      onTriggerAutomaticAITurn: () => {
        triggerAutomaticAITurn();
      },
      onMoveEntity: () => {
        
        setIsMovementMode(!isMovementMode);
      },
      onAttackWithWeapon: (weaponId: string) => {
        
        setTargetingWeapon(weaponId);
        // Clear other targeting modes
        setTargetingSpell(null);
        setIsMovementMode(false);
      },
      onCastSpell: (spellId: string) => {
        
        setTargetingSpell(spellId);
        // Clear other targeting modes  
        setTargetingWeapon(null);
        setIsMovementMode(false);
      },
      onCancelTargeting: () => {
        
        setTargetingWeapon(null);
        setTargetingSpell(null);
      }
    };
  };

  // --- Gestion des états de chargement et d'erreur ---
  if (isLoading) {
    return <div>Chargement du combat...</div>;
  }

  if (error) {
    return (
      <div className="scene-content">
        <div className="combat-error">
          <h2>⚠️ Erreur de Combat</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            🔄 Recharger la page
          </button>
        </div>
      </div>
    );
  }

  if (!combat) { // Si pas d'erreur mais pas de combat (cas inattendu)
    return <div>Erreur inattendue lors du chargement du combat.</div>;
  }

  // --- Rendu de la scène de combat ---
  return (
    <CombatScene
      scene={scene}
      gameSession={gameSession}
      sceneAnalysis={sceneAnalysis}
      onChoiceSelected={onChoiceSelected}
      onCombatAction={handleCombatAction}
      onSpellCast={(spellId) => {
        const currentEntity = combat.getCurrentEntity();
        if (currentEntity) {
          // Pour l'instant, on peut passer un targetId par défaut ou demander à l'utilisateur de sélectionner
          handleCombatAction({ type: 'cast_spell', casterId: currentEntity.id, spellId, targetId: 'default' });
        }
      }}
      
      // Props spécifiques au combat (directement depuis l'entité combat)
      combat={combat}
      entities={Array.from(combat.entities.values())}
      currentEntity={combat.getCurrentEntity()}
      phase={mapDomainPhaseToUI(combat)}
      isMovementMode={isMovementMode}
      isLoading={isLoading}
      
      // PHASE 2 - Props Domain centralisées depuis useCombat
      healthDisplays={healthDisplays}
      reachableCells={reachableCells}
      gridDimensions={combat.tacticalGrid.dimensions}
      
      // Actions de grille
      onCellClick={(position) => {
        if (!combat) return;
        
        if (isMovementMode) {
          
          const currentEntity = combat.getCurrentEntity();
          if (currentEntity) {
            moveEntity(currentEntity.id, position);
            setIsMovementMode(false); // Désactiver le mode mouvement après déplacement
          }
        } else if (targetingWeapon || targetingSpell) {
          
          
          // Find enemy at this position
          const targetEnemy = Array.from(combat.entities.values()).find(
            entity => entity.type === 'enemy' && 
                     entity.position.x === position.x && 
                     entity.position.y === position.y &&
                     entity.isActive && !entity.isDead
          );
          
          if (targetEnemy) {
            const currentEntity = combat.getCurrentEntity();
            if (currentEntity) {
              if (targetingWeapon) {
                // Déléguer validation de portée au Use Case
                const weapon = weaponRepository.getWeapon(targetingWeapon);
                if (weapon) {
                  if (combat.canAttackPosition(currentEntity.id, position, weapon.id)) {
                    
                    handleCombatAction({ 
                      type: 'attack_weapon', 
                      attackerId: currentEntity.id, 
                      weaponId: targetingWeapon, 
                      targetId: targetEnemy.id 
                    });
                    setTargetingWeapon(null); // Clear targeting mode
                  } else {
                    
                  }
                }
              } else if (targetingSpell) {
                // For spells, check spell range (implement later)
                
                handleCombatAction({ 
                  type: 'cast_spell', 
                  casterId: currentEntity.id, 
                  spellId: targetingSpell, 
                  targetId: targetEnemy.id 
                });
                setTargetingSpell(null); // Clear targeting mode
              }
            }
          } else {
            
          }
        }
      }}
      onMovementCancel={() => {
        
        setIsMovementMode(false);
      }}
      
      // Props pour CombatPanel
      combatPanelProps={getCombatPanelProps()}
      
      // GameLog
      gameLogs={logs}
    />
  );
};
