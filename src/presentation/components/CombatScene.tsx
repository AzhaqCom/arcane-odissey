/**
 * PRESENTATION COMPONENT - CombatScene
 * Scène de combat avec layout full width et interface tactique
 */

import React from 'react';
import { Scene, GameSession } from '../../domain/entities';
import { Combat, type CombatEntity, type Position } from '../../domain/entities/Combat';
import type { SceneAnalysis } from '../../application/usecases/SceneUseCase';
// CombatPhase type not exported from useCombat - removing unused import
import { CombatPanel } from './CombatPanel';
import { CombatGrid } from './CombatGrid';
import { GameLog, useGameLog } from './GameLog';

interface CombatSceneProps {
  scene: Scene;
  gameSession: GameSession;
  sceneAnalysis: SceneAnalysis;
  onChoiceSelected: (choiceId: string, targetSceneId: string) => void;
  onCombatAction?: (action: any) => void;
  onSpellCast?: (spellId: string) => void;
  
  // Props du combat (du Container)
  combat: Combat | null;
  entities: CombatEntity[];
  currentEntity: CombatEntity | null;
  phase: CombatPhase;
  isMovementMode: boolean;
  isLoading: boolean;
  
  // PHASE 2 - ACTION 2.2.1: Nouvelles props Domain centralisées
  healthDisplays: Map<string, any>;
  reachableCells: Set<string>;
  gridDimensions: { width: number; height: number };
  
  // Actions de grille
  onCellClick: (position: Position) => void;
  onMovementCancel: () => void;
  
  // Props pour CombatPanel
  combatPanelProps: any;
  
  // GameLog entries from combat
  gameLogs?: any[];
}

/**
 * COMBAT SCENE - Interface de combat full width
 * Layout adapté pour l'affichage tactique du combat
 */
export const CombatScene: React.FC<CombatSceneProps> = ({
  scene,
  gameSession,
  sceneAnalysis,
  onChoiceSelected,
  onCombatAction,
  onSpellCast,
  combat,
  entities,
  currentEntity,
  phase,
  isMovementMode,
  isLoading,
  healthDisplays,
  reachableCells,
  gridDimensions,
  onCellClick,
  onMovementCancel,
  combatPanelProps,
  gameLogs
}) => {
  const sceneContent = scene.content as any;
  
  // Utiliser les logs du combat plutôt que le hook local
  const displayLogs = gameLogs || [];

  return (
    <div className="scene-content scene-combat">
      {/* En-tête de combat */}
      <div className="combat-header">
        <div className="combat-title">
          <h1 className="scene-title">{scene.title}</h1>
          {scene.description && (
            <p className="scene-description">{scene.description}</p>
          )}
        </div>
        
        {/* Informations tactiques */}
        <div className="combat-info">
          <div className="combat-round">
            <span className="info-label">Round</span>
            <span className="info-value">{combat?.round || 1}</span>
          </div>
          <div className={`combat-initiative ${phase === 'player_turn' ? 'player-turn' : phase === 'ai_turn' ? 'ai-turn' : ''}`}>
            <span className="info-label">Tour actuel</span>
            <span className="info-value">
              {phase === 'player_turn' ? '🎮' : phase === 'ai_turn' ? '🤖' : '⏳'} 
              {currentEntity?.name || 'En attente'}
            </span>
          </div>
          <div className="combat-phase">
            <span className="info-label">Phase</span>
            <span className="info-value">{phase}</span>
          </div>
        </div>
      </div>

      {/* Zone de combat principale */}
      <div className="combat-main">
        {/* Grille tactique interactive */}
        <div className="combat-battlefield">
          {combat ? (
            <CombatGrid
              entities={entities}
              healthDisplays={healthDisplays}
              reachableCells={reachableCells}
              isMovementMode={isMovementMode}
              gridDimensions={gridDimensions}
              onCellClick={onCellClick}
              onMovementCancel={onMovementCancel}
            />
          ) : (
            <div className="battlefield-loading">
              <div className="loading-content">
                <div className="loading-spinner"></div>
                <p>Initialisation du combat...</p>
              </div>
            </div>
          )}
        </div>

        {/* Panel droit - Actions + GameLog */}
        <div className="combat-right-panel">
          {/* Panel d'actions de combat */}
          <div className="combat-actions">
            <CombatPanel {...combatPanelProps} />
          </div>
          
          {/* GameLog intégré en combat */}
          <div className="combat-game-log">
            <GameLog entries={displayLogs} inCombat={true} />
          </div>
        </div>
      </div>

      {/* Choix post-combat */}
      {!combat && sceneAnalysis.availableChoices.length > 0 && (
        <div className="combat-choices">
          <h3>Actions disponibles :</h3>
          <div className="scene-choices">
            {sceneAnalysis.availableChoices.map((choice) => (
              <button
                key={choice.id}
                className="scene-choice combat-choice"
                onClick={() => onChoiceSelected(choice.id, choice.targetSceneId)}
              >
                {choice.text}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};