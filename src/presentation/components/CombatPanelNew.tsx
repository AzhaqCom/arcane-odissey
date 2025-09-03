/**
 * PRESENTATION - CombatPanelNew Component
 * Panel de combat Phoenix avec styles legacy
 * Respecte ARCHITECTURE_GUIDELINES.md - Règle #3 Dumb Presentation
 * ✅ Aucun import Domain direct - Isolation complète
 */

import React from 'react';
import type { UseCombatGameResult } from '../hooks/useCombatGame';

interface CombatPanelNewProps {
  // Interface simplifiée - toute la logique est dans le hook
  combat: UseCombatGameResult;
}

/**
 * COMBAT PANEL SIMPLIFIÉ
 * ✅ Aucune logique métier
 * ✅ Affichage conditionnel selon l'état
 * ✅ AI joue automatiquement (pas de boutons IA)
 * ✅ Interface claire pour le joueur
 */
export const CombatPanelNew: React.FC<CombatPanelNewProps> = ({
  combat
}) => {
  // === RENDU AVANT COMBAT ===
  const renderPreCombat = () => (
    <div className="combat-panel-section">
      <div className="combat-actions-header">
        <h3>🎮 Panneau de Combat</h3>
      </div>
      <div className="combat-phase-info" style={{ padding: '15px', backgroundColor: '#1a1a1a', borderRadius: '4px' }}>
        <p style={{ color: '#ccc', marginBottom: '15px' }}>
          Architecture Phoenix • AI automatique • Performance optimisée
        </p>
        <button
          className="action-button start-button"
          onClick={() => {
            // ✅ ARCHITECTURE PROPRE - Utilise le hook qui gère tout
            combat.initializeCombatFromScene('forest_ambush');
          }}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            width: '100%'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
        >
          🚀 Démarrer Combat
        </button>
      </div>
    </div>
  );

  // ✅ FONCTIONNALITÉ 1.1 - Fonctions de rendu par catégorie
  const renderActionCategory = (title: string, actions: React.ReactNode) => (
    <div className="action-category" style={{ marginBottom: '15px' }}>
      <div className="category-header" style={{ 
        marginBottom: '8px', 
        paddingBottom: '5px', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)' 
      }}>
        <h4 style={{ color: '#60a5fa', margin: 0, fontSize: '14px' }}>{title}</h4>
      </div>
      <div className="category-actions" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {actions}
      </div>
    </div>
  );

  const renderCombatActions = () => {
    if (!combat.currentEntity || combat.playerActionContext.state === 'AWAITING_ATTACK_TARGET') {
      return renderTargetSelection();
    }

    return (
      <>
        <button
          className="action-button combat-button"
          onClick={() => combat.selectAttackAction()}
          disabled={!combat.currentEntity?.actionsRemaining.action}
          style={{
            width: '100%',
            padding: '8px 12px',
            backgroundColor: combat.currentEntity?.actionsRemaining.action ? '#d32f2f' : '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: combat.currentEntity?.actionsRemaining.action ? 'pointer' : 'not-allowed',
            fontSize: '13px'
          }}
        >
          ⚔️ Attaquer
        </button>
        {/* TODO: Ajouter sélection d'armes spécifiques */}
      </>
    );
  };

  const renderMovementActions = () => {
    if (combat.playerActionContext.state === 'AWAITING_MOVEMENT_CONFIRMATION') {
      return (
        <div style={{ color: '#FF9800', fontSize: '12px', textAlign: 'center', padding: '8px' }}>
          🎯 Cliquez sur la grille pour vous déplacer
        </div>
      );
    }

    return (
      <button
        className="action-button movement-button"
        onClick={() => combat.selectMoveAction()}
        disabled={!combat.currentEntity?.actionsRemaining.movement}
        style={{
          width: '100%',
          padding: '8px 12px',
          backgroundColor: combat.currentEntity?.actionsRemaining.movement ? '#FF9800' : '#666',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: combat.currentEntity?.actionsRemaining.movement ? 'pointer' : 'not-allowed',
          fontSize: '13px'
        }}
      >
        🏃 Se déplacer ({combat.currentEntity?.actionsRemaining.movement || 0}m)
      </button>
    );
  };

  const renderSpellActions = () => {
    // TODO: Implémenter sélection de sorts depuis Character
    return (
      <div style={{ color: '#888', fontSize: '12px', textAlign: 'center', padding: '8px' }}>
        Sorts non disponibles
      </div>
    );
  };

  const renderTurnActions = () => (
    <button
      className="action-button end-turn-button"
      onClick={() => combat.endTurn()}
      style={{
        width: '100%',
        padding: '8px 12px',
        backgroundColor: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '13px'
      }}
    >
      ⏭️ Terminer le tour
    </button>
  );

  const renderTargetSelection = () => (
    <div className="target-selection">
      <div style={{ color: '#FF5722', marginBottom: '8px', fontSize: '13px' }}>
        Sélectionnez une cible :
      </div>
      {combat.validTargets.map(target => (
        <button
          key={target.id}
          className="target-button"
          onClick={() => combat.confirmAction(target.id)}
          style={{
            width: '100%',
            padding: '6px 10px',
            marginBottom: '4px',
            backgroundColor: '#d32f2f',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '12px',
            textAlign: 'left'
          }}
        >
          🎯 {target.name} ({target.hitPoints} PV)
        </button>
      ))}
      <button
        onClick={() => combat.cancelCurrentAction()}
        style={{
          width: '100%',
          padding: '6px 10px',
          marginTop: '8px',
          backgroundColor: '#666',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        ❌ Annuler
      </button>
    </div>
  );

  // === RENDU TOUR JOUEUR ===
  const renderPlayerTurn = () => {
    const { currentEntity, availableActions, validTargets } = combat;
    
    return (
      <div className="combat-panel-section">
        <div className="combat-actions-header">
          <h3>🎮 Tour de {currentEntity?.name}</h3>
        </div>
        
        {/* Informations entité */}
        <div className="entity-status-card" style={{ marginBottom: '15px', padding: '10px', backgroundColor: 'rgba(31, 41, 55, 0.8)', borderRadius: '4px' }}>
          <div className="entity-stats" style={{ color: '#ccc', fontSize: '14px' }}>
            ❤️ PV: {currentEntity?.hitPoints}/{currentEntity?.maxHitPoints} | 
            🛡️ CA: {currentEntity?.armorClass} | 
            🏃 Mouvement: {currentEntity?.actionsRemaining.movement}m
          </div>
          <div className="entity-actions-status" style={{ color: '#888', fontSize: '12px', marginTop: '5px' }}>
            Actions: {currentEntity?.actionsRemaining.action ? '⚔️' : '❌'} | 
            Bonus: {currentEntity?.actionsRemaining.bonusAction ? '⚡' : '❌'} | 
            Réaction: {currentEntity?.actionsRemaining.reaction ? '🛡️' : '❌'}
          </div>
        </div>

        {/* ✅ FONCTIONNALITÉ 1.1 - Interface selon mockups action_joueur.png */}
        <div className="action-categories">
          {renderActionCategory('⚔️ Combat', renderCombatActions())}
          {renderActionCategory('🏃 Mouvement', renderMovementActions())}
          {renderActionCategory('✨ Sorts', renderSpellActions())}
          {renderActionCategory('⏭️ Tour', renderTurnActions())}
        </div>
      </div>
    );
  };

  // === RENDU TOUR AI ===
  const renderAITurn = () => {
    const { currentEntity } = combat;
    
    return (
      <div className="combat-panel-section">
        <div className="combat-actions-header">
          <h3 style={{ color: '#FF9800' }}>🤖 Tour de {currentEntity?.name}</h3>
        </div>
        
        <div className="ai-thinking-card" style={{ 
          padding: '15px', 
          backgroundColor: 'rgba(31, 41, 55, 0.8)', 
          borderRadius: '4px',
          marginBottom: '15px',
          textAlign: 'center'
        }}>
          <div style={{ color: '#ccc', marginBottom: '10px' }}>
            ❤️ {currentEntity?.hitPoints}/{currentEntity?.maxHitPoints} PV | 
            🧠 Comportement: {currentEntity?.aiBehavior || 'default'}
          </div>
          <div className="ai-thinking-indicator" style={{ 
            color: '#FF9800', 
            fontSize: '16px',
            animation: 'pulse 1.5s infinite'
          }}>
            🎯 L'IA réfléchit...
          </div>
        </div>
        
        <p style={{ color: '#888', fontSize: '14px' }}>
          L'intelligence artificielle joue automatiquement.<br/>
          Aucune action requise de votre part.
        </p>
      </div>
    );
  };

  // === RENDU FIN DE COMBAT ===
  const renderCombatEnd = () => {
    const { combatState } = combat;
    const isVictory = combatState?.phase === 'victory';
    
    return (
      <div className="combat-panel-section">
        <div className="combat-end-card" style={{ 
          textAlign: 'center', 
          padding: '20px', 
          backgroundColor: isVictory ? 'rgba(27, 94, 32, 0.9)' : 'rgba(183, 28, 28, 0.9)', 
          borderRadius: '4px' 
        }}>
          <h3 style={{ color: 'white', marginBottom: '15px' }}>
            {isVictory ? '🎉 Victoire !' : '💀 Défaite...'}
          </h3>
        <p style={{ color: '#ccc', marginBottom: '20px' }}>
          {isVictory 
            ? 'Félicitations ! Vous avez triomphé de vos ennemis.' 
            : 'Vos héros sont tombés au combat. Réessayez !'}
        </p>
          <button
            className="action-button restart-button"
            onClick={() => window.location.reload()} // Simple pour l'instant
            style={{
              padding: '12px 24px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🔄 Nouveau Combat
          </button>
        </div>
      </div>
    );
  };

  // === RENDU INFORMATIONS COMBAT ===
  const renderCombatInfo = () => {
    const { combatState } = combat;
    if (!combatState) return null;

    return (
      <div style={{ 
        marginTop: '15px', 
        padding: '15px', 
        backgroundColor: '#2a2a2a', 
        borderRadius: '4px' 
      }}>
        <h4 style={{ color: '#4CAF50', margin: '0 0 10px 0' }}>📊 État du Combat</h4>
        
        <div style={{ color: '#ccc', fontSize: '14px', marginBottom: '10px' }}>
          🔄 Round {combatState.round} | 
          👥 Entités: {combatState.entities.length} | 
          🎯 Index: {combatState.currentTurnIndex + 1}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          {combatState.entities.map((entity, index) => (
            <div
              key={entity.id}
              style={{
                padding: '8px',
                backgroundColor: index === combatState.currentTurnIndex ? '#4CAF50' : '#3a3a3a',
                borderRadius: '4px',
                fontSize: '12px',
                color: index === combatState.currentTurnIndex ? 'black' : '#ccc'
              }}
            >
              <div style={{ fontWeight: 'bold' }}>
                {entity.name} ({entity.type})
              </div>
              <div>
                ❤️ {entity.hitPoints}/{entity.maxHitPoints} | 
                🎲 Init: {entity.initiative}
              </div>
              {entity.isDead && <div style={{ color: '#FF5722' }}>💀 Mort</div>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // === RENDU PRINCIPAL ===
  return (
    <div className="combat-panel" style={{ 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: 'rgba(31, 41, 55, 0.95)',
      minHeight: '400px',
      padding: '15px',
      borderRadius: '4px',
      display: 'flex',
      flexDirection: 'column',
      gap: '15px'
    }}>
      {/* CSS pour l'animation */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>

      {!combat.combatState && renderPreCombat()}
      {combat.isEnded && renderCombatEnd()}
      {combat.isPlayerTurn && !combat.isEnded && renderPlayerTurn()}
      {combat.isAITurn && !combat.isEnded && renderAITurn()}
      {combat.isActive && renderCombatInfo()}
    </div>
  );
};