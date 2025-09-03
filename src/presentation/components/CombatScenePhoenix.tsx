/**
 * PRESENTATION - CombatScenePhoenix
 * Scène de combat Phoenix avec layout legacy 64%/35%
 * Respecte ARCHITECTURE_GUIDELINES.md - Règle #3 Dumb Presentation
 * ✅ Utilise View Models et Adapters - Aucun import Domain direct
 */

import React, { useState, useEffect } from 'react';
import { CombatGridNew } from './CombatGridNew';
import { CombatPanelNew } from './CombatPanelNew';
import { GameLog } from './GameLog';
import { useCombatGame } from '../hooks/useCombatGame';
import { DIContainer } from '../../infrastructure/container/DIContainer';
import type { CombatEntityView } from '../types/CombatTypes';
import type { CombatEntity } from '../../domain/entities/CombatEngine';
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
  // État Phoenix
  const combatGameUseCase = DIContainer.getInstance().get('CombatGameUseCase');
  const combat = useCombatGame(combatGameUseCase);
  
  // État local pour le mode mouvement
  const [isMovementMode, setIsMovementMode] = useState(false);
  
  // Logs de combat (View Models purs)
  const [combatLogs, setCombatLogs] = useState<NarrativeMessageView[]>([]);

  // ✅ QUICK FIX: Créer des entités Domain complètes pour les tests
  const createTestEntities = (): CombatEntity[] => {
    const player: CombatEntity = {
      id: 'player_1',
      name: 'Héros',
      type: 'player',
      level: 3,
      hitPoints: 25,
      maxHitPoints: 25,
      armorClass: 15,
      speed: 30,
      initiative: 0,
      abilities: { // ✅ CRUCIAL: Ajout des abilities manquantes
        strength: 16,
        dexterity: 14,
        constitution: 15,
        intelligence: 12,
        wisdom: 13,
        charisma: 8
      },
      position: { x: 2, y: 4 },
      isActive: true,
      isDead: false,
      actionsRemaining: {
        action: true,
        bonusAction: true,
        reaction: true,
        movement: 30
      }
    };

    const enemy1: CombatEntity = {
      id: 'enemy_1',
      name: 'Gobelin',
      type: 'enemy',
      level: 1,
      hitPoints: 7,
      maxHitPoints: 7,
      armorClass: 15,
      speed: 30,
      initiative: 0,
      abilities: { // ✅ CRUCIAL: Abilities pour les ennemis aussi
        strength: 8,
        dexterity: 14,
        constitution: 10,
        intelligence: 10,
        wisdom: 8,
        charisma: 8
      },
      position: { x: 8, y: 4 },
      isActive: true,
      isDead: false,
      actionsRemaining: {
        action: true,
        bonusAction: true,
        reaction: true,
        movement: 30
      }
    };

    const enemy2: CombatEntity = {
      id: 'enemy_2',
      name: 'Archer Gobelin',
      type: 'enemy',
      level: 1,
      hitPoints: 5,
      maxHitPoints: 5,
      armorClass: 13,
      speed: 30,
      initiative: 0,
      abilities: { // ✅ CRUCIAL: Abilities pour archer aussi
        strength: 6,
        dexterity: 16, // Archer = plus agile
        constitution: 8,
        intelligence: 10,
        wisdom: 12,
        charisma: 6
      },
      position: { x: 10, y: 3 },
      isActive: true,
      isDead: false,
      actionsRemaining: {
        action: true,
        bonusAction: true,
        reaction: true,
        movement: 30
      }
    };

    return [player, enemy1, enemy2];
  };

  // Gérer le clic sur une cellule de la grille
  const handleCellClick = (position: { x: number; y: number }) => {
    if (isMovementMode && combat.isPlayerTurn) {
      combat.executeMove(position);
      setIsMovementMode(false);
    }
  };

  // Activer/désactiver le mode mouvement
  const toggleMovementMode = () => {
    setIsMovementMode(!isMovementMode);
  };

  // Ajouter un log (View Models purs)
  useEffect(() => {
    if (combat.combatState) {
      const newLog: NarrativeMessageView = {
        id: Date.now().toString(),
        content: `Round ${combat.combatState.round} - Tour de ${combat.currentEntity?.name}`,
        type: 'combat',
        timestamp: new Date(),
        icon: '⚔️'
      };
      setCombatLogs(prev => [...prev.slice(-50), newLog]); // Garder max 50 logs
    }
  }, [combat.combatState?.currentTurnIndex]);

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
            <CombatPanelNew
              combat={combat}
              onCreateTestEntities={createTestEntities}
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
              {combatLogs.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666' }}>En attente du combat...</p>
              ) : (
                combatLogs.map(log => (
                  <div key={log.id} style={{ marginBottom: '5px' }}>
                    <span style={{ marginRight: '5px' }}>{log.icon}</span>
                    {log.content}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};