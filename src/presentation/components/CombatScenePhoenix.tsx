/**
 * PRESENTATION - CombatScenePhoenix
 * Scène de combat Phoenix avec layout legacy 64%/35%
 * Respecte ARCHITECTURE_GUIDELINES.md - Règle #3 Dumb Presentation
 * ✅ Utilise View Models et Adapters - Aucun import Domain direct
 */

import React, { useState, useEffect } from 'react';
import { CombatGridNew } from './CombatGridNew';
import { PlayerActionPanel } from './PlayerActionPanel';
import { GameLog } from './GameLog';
import { useCombatGame } from '../hooks/useCombatGame';
// ✅ ÉTAPE 2.7 - Supprimé import DIContainer direct (violation architecturale)
import type { CombatEntityView } from '../types/CombatTypes';
// ✅ ÉTAPE 2.7 - Supprimé import Domain direct
import { CombatViewAdapter } from '../adapters/CombatViewAdapter';
import type { NarrativeMessageView } from '../types/NarrativeTypes';

interface CombatScenePhoenixProps {
  // Props optionnelles pour intégration
  sceneTitle?: string;
  sceneDescription?: string;
}

/**
 * SCÈNE DE COMBAT PHOENIX
 * Utilise le layout 64%/35% de l'ancien système
 * Intègre Grid, Panel et Log avec styles legacy
 */
export const CombatScenePhoenix: React.FC<CombatScenePhoenixProps> = ({
  sceneTitle = "Combat Phoenix",
  sceneDescription = "Système de combat nouvelle génération"
}) => {
  // ✅ ÉTAPE 2.7 - Hook pur sans accès direct au DIContainer
  const combat = useCombatGame();
  
  // État local pour le mode mouvement
  const [isMovementMode, setIsMovementMode] = useState(false);
  
  // État local pour les choix post-combat
  const [postCombatChoices, setPostCombatChoices] = useState<Array<{
    id: string;
    text: string;
    targetSceneId: string;
  }>>([]);
  
  // ✅ ÉTAPE 2.7 - Auto-initialisation du combat depuis la scène
  useEffect(() => {
    if (!combat.combatState) {
      combat.initializeCombatFromScene('forest_ambush');
    }
  }, []);

  // ✅ NOUVELLE FONCTIONNALITÉ - Charger choix post-combat quand combat terminé
  useEffect(() => {
    const loadPostCombatChoices = async () => {
      if (combat.isEnded && (combat.combatState?.phase === 'victory' || combat.combatState?.phase === 'defeat')) {
        try {
          const choices = await combat.getPostCombatChoices();
          setPostCombatChoices(choices);
        } catch (error) {
          console.error('Failed to load post-combat choices:', error);
        }
      }
    };

    loadPostCombatChoices();
  }, [combat.isEnded, combat.combatState?.phase]);

  
  // ✅ FONCTIONNALITÉ 3 - Utilisation des narratifs du Domain via useCombatGame

  // ✅ ÉTAPE 2.7 - VIOLATION ARCHITECTURALE SUPPRIMÉE
  // Ancienne fonction createTestEntities() supprimée 
  // Le combat utilise maintenant les vraies données via CombatFactory

  // ✅ FONCTIONNALITÉ 1.2 - Gérer interactions grille selon contexte
  const handleCellClick = (position: { x: number; y: number }) => {
    if (isMovementMode && combat.isPlayerTurn) {
      combat.executeMove(position);
      setIsMovementMode(false);
    }
  };

  const handleCellInteraction = (position: { x: number; y: number }, interactionType: 'move' | 'target') => {
    if (interactionType === 'move') {
      combat.confirmAction(position);
    } else if (interactionType === 'target') {
      // Position.x contient l'ID de l'entité dans ce cas
      const targetId = position.x as string;
      
      // ✅ PHASE 2 - Gestion spécifique pour attaques avec arme
      if (combat.playerActionContext.state === 'AWAITING_WEAPON_TARGET') {
        combat.executeWeaponAttack(targetId);
      } else {
        combat.confirmAction(targetId);
      }
    }
  };

  // Activer/désactiver le mode mouvement
  const toggleMovementMode = () => {
    setIsMovementMode(!isMovementMode);
  };

  // ✅ FONCTIONNALITÉ 3 - Les logs sont maintenant automatiquement générés par le Domain

  // Calculer les informations de combat
  const combatInfo = combat.combatState ? {
    round: combat.combatState.round,
    phase: combat.combatState.phase,
    currentEntity: combat.currentEntity?.name || 'Aucun',
    entitiesAlive: combat.combatState.entities.filter(e => !e.isDead).length,
    totalEntities: combat.combatState.entities.length
  } : null;

  return (
    <div className="scene-combat" style={{
      width: '100%',
      height: '100vh',
      backgroundColor: 'linear-gradient(135deg, #1a1a2e, #2c1810)',
      background: 'linear-gradient(135deg, #1a1a2e, #2c1810)',
      padding: 0,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header de combat */}
      <div className="combat-header" style={{
        padding: '10px 20px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderBottom: '2px solid #333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div className="scene-info">
          <h2 style={{ color: '#4CAF50', margin: 0 }}>🔥 {sceneTitle}</h2>
          <p style={{ color: '#ccc', margin: '5px 0 0 0', fontSize: '14px' }}>{sceneDescription}</p>
        </div>
        
        {combatInfo && (
          <div className="combat-info" style={{
            display: 'flex',
            gap: '20px',
            color: '#ccc',
            fontSize: '14px'
          }}>
            <span>🔄 Round {combatInfo.round}</span>
            <span>👤 {combatInfo.currentEntity}</span>
            <span>⚔️ {combatInfo.entitiesAlive}/{combatInfo.totalEntities}</span>
            <span>📍 {combatInfo.phase}</span>
          </div>
        )}
      </div>

      {/* Layout principal 64%/35% */}
      <div className="combat-main" style={{
        flex: 1,
        display: 'flex',
        gap: '20px',
        padding: '20px',
        height: 'calc(100vh - 80px)',
        overflow: 'hidden'
      }}>
        {/* Zone battlefield - 64% */}
        <div className="combat-battlefield" style={{
          flex: '0 0 64%',
          backgroundColor: 'rgba(15, 23, 42, 0.3)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '15px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div className="battlefield-header" style={{
            marginBottom: '10px',
            paddingBottom: '10px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ color: '#60a5fa', margin: 0 }}>⚔️ Champ de Bataille</h3>
          </div>
          
          <div style={{ flex: 1, overflow: 'auto' }}>
            <CombatGridNew
              entities={combat.combatState?.entities.map(entity => CombatViewAdapter.entityToView(entity)) || []}
              currentEntity={combat.currentEntity ? CombatViewAdapter.entityToView(combat.currentEntity) : null}
              isMovementMode={isMovementMode}
              onCellClick={handleCellClick}
              gridDimensions={{ width: 12, height: 8 }}
              
              // ✅ FONCTIONNALITÉ 1.2 - Nouvelles props pour micro-états
              playerActionContext={combat.playerActionContext}
              onCellInteraction={handleCellInteraction}
            />
          </div>
        </div>

        {/* Panel droit - 35% */}
        <div className="combat-right-panel" style={{
          flex: '0 0 35%',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          minWidth: '300px'
        }}>
          {/* Panel d'actions */}
          <div style={{ 
            maxHeight: '50%',
            overflowY: 'auto',
            overflowX: 'hidden'
          }}>
            <PlayerActionPanel
              isPlayerTurn={combat.isPlayerTurn}
              playerWeapons={combat.getPlayerWeapons()}
              onSelectWeapon={combat.selectWeaponAttack}
              onSelectMovement={combat.selectMoveAction}
              selectedWeapon={combat.playerActionContext.selectedWeapon}
              currentEntityName={combat.currentEntity?.name}
              combatPhase={combat.combatState?.phase}
              postCombatChoices={postCombatChoices}
              onPostCombatChoice={async (choiceId, targetSceneId) => {
                await combat.executePostCombatChoice(choiceId, targetSceneId);
              }}
            />
          </div>

          {/* Logs de combat */}
          <div className="combat-logs-container" style={{
            flex: 1,
            backgroundColor: 'rgba(31, 41, 55, 0.95)',
            borderRadius: '4px',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '200px'
          }}>
            <div className="logs-header" style={{
              marginBottom: '10px',
              paddingBottom: '5px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h4 style={{ color: '#60a5fa', margin: 0, fontSize: '14px' }}>📜 Journal de Combat</h4>
            </div>
            
            <div style={{ 
              flex: 1, 
              overflowY: 'auto',
              fontSize: '12px',
              color: '#ccc'
            }}>
              <GameLog 
                messages={combat.narratives} 
                height="100%" 
                maxMessages={20}
                autoScroll={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};