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
    // Méthodes exposées par le hook
    initiateCombat,
    advanceTurn,
    executeAITurn,
    moveEntity,
    performWeaponAttack,
    performSpellCast,
    // ... autres méthodes si nécessaires
  } = useCombat(scene.content as CombatSceneContent);

  // Récupération des autres services (pour les props du CombatPanel)
  const { weaponRepository, spellRepository } = useRepositories();

  
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
          
          const advanceResult = await advanceTurn();
          
          break;
        case 'execute_ai_turn':
          
          const aiResult = await executeAITurn();
          
          break;
        case 'move_entity':
          
          // moveEntity est déjà exposé par le hook
          // Si startMovement/cancelMovement sont nécessaires, il faut les ajouter au hook
          break;
        case 'attack_weapon':
          
          await performWeaponAttack(action.attackerId, action.weaponId, action.targetId);
          break;
        case 'cast_spell':
          
          await performSpellCast(action.casterId, action.spellId, action.targetId);
          break;
        default:
          
          logger.ui('Unknown combat action', { action });
      }
    } catch (error) {
      console.error('❌ Error in handleCombatAction:', error);
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
    
    
    
    // Armes et sorts - récupérer depuis l'équipement du personnage (avec fallback temporaire)
    const weapons = isPlayerTurn && gameSession.playerCharacter ? (() => {
      const character = gameSession.playerCharacter;
      
      
      
      
      
      // TEMPORAIRE: Fallback vers l'ancien système si l'inventory n'existe pas
      if (!character.inventory || !character.inventory.equipped) {
        console.warn('⚠️ Using fallback weapons (dagger, shortbow) - inventory not found');
        return weaponRepository.getWeaponsByIds(['dagger', 'shortbow']);
      }
      
      const equippedWeaponIds: string[] = [];
      
      // Récupérer toutes les armes équipées (mainHand, offHand, rangedWeapon, etc.)
      Object.values(character.inventory.equipped).forEach(itemId => {
        // Vérifier si c'est une arme (en essayant de la récupérer du weaponRepository)
        const weapons = weaponRepository.getWeaponsByIds([itemId]);
        if (weapons.length > 0) {
          equippedWeaponIds.push(itemId);
        }
      });
      
      
      return weaponRepository.getWeaponsByIds(equippedWeaponIds);
    })() : [];
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
      onStartCombat: () => {
        
        handleCombatAction({ type: 'start_combat' });
      },
      onAdvanceTurn: () => {
        
        handleCombatAction({ type: 'advance_turn' });
      },
      onExecuteAITurn: () => {
        
        handleCombatAction({ type: 'execute_ai_turn' });
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
                // Check weapon range
                const weapon = weaponRepository.getById(targetingWeapon);
                if (weapon) {
                  const distance = Math.abs(currentEntity.position.x - position.x) + 
                                  Math.abs(currentEntity.position.y - position.y);
                  const weaponRange = weapon.type === 'melee' ? 1 : (weapon.rangeNormal || weapon.range || 1);
                  
                  if (distance <= weaponRange) {
                    
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
