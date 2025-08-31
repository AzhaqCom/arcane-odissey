/**
 * PRESENTATION COMPONENT - GameApp
 * Composant de présentation pur pour l'application principale
 * Responsabilité : Affichage conditionnel uniquement
 */

import React from 'react';
import { SceneRenderer } from './SceneRenderer';
import { StatusCorner } from './StatusCorner';
import { GameHotbar } from './GameHotbar';
import { GameLog, useGameLog } from './GameLog';
import { useGameSession } from '../hooks/useGameSession';

/**
 * GAME APP - Composant de présentation pur
 * Toute la logique d'orchestration a été déplacée vers GameSessionUseCase
 */
export const GameApp: React.FC = () => {
  // Hook principal pour la gestion de session (délégation complète)
  const { sessionState, initializeSession, handleSceneTransition, handleRest, handleSave } = useGameSession();
  
  // Hook pour le GameLog (API refactorisée)
  const { messages, addMessages } = useGameLog();
  
  // État UI local (logique de présentation uniquement)
  const [showInventory, setShowInventory] = React.useState(false);
  const [showCharacterSheet, setShowCharacterSheet] = React.useState(false);

  // Synchroniser les messages narratifs de la session avec le GameLog
  React.useEffect(() => {
    if (sessionState.narrativeMessages.length > 0) {
      addMessages(sessionState.narrativeMessages);
    }
  }, [sessionState.narrativeMessages, addMessages]);

  // Actions simplifiées (délégation pure)
  const handleCombatAction = async (_action: any) => {
    // TODO: Intégrer avec CombatUseCase via useGameSession
  };

  const handleSpellCast = async (_spellId: string) => {
    // TODO: Intégrer avec SpellUseCase via useGameSession  
  };

  // Raccourcis clavier (logique UI pure)
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'i' && !e.ctrlKey && !e.altKey) setShowInventory(true);
      if (e.key === 'c' && !e.ctrlKey && !e.altKey) setShowCharacterSheet(true);
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleSave]);

  // === RENDU CONDITIONNEL PUR ===

  if (sessionState.loading) {
    return (
      <div className="game-loading">
        <div className="loading-content">
          <h2>🎲 Chargement...</h2>
          <div className="loading-spinner"></div>
          <p>Initialisation du monde D&D</p>
        </div>
      </div>
    );
  }

  if (sessionState.error) {
    return (
      <div className="game-error">
        <div className="error-content">
          <h2>⚠️ Erreur</h2>
          <p>{sessionState.error}</p>
          <button onClick={initializeSession}>🔄 Réessayer</button>
        </div>
      </div>
    );
  }

  if (!sessionState.gameState || !sessionState.currentScene || !sessionState.sceneAnalysis) {
    return (
      <div className="game-error">
        <div className="error-content">
          <h2>⚠️ État invalide</h2>
          <p>L'état du jeu n'est pas correctement chargé.</p>
          <button onClick={initializeSession}>🔄 Redémarrer</button>
        </div>
      </div>
    );
  }

  const isCombatScene = sessionState.currentScene.type === 'combat';

  return (
    <div className={`game-app ${isCombatScene ? 'combat-mode' : ''}`}>
      <StatusCorner gameState={sessionState.gameState} />
      
      <GameHotbar
        onCharacterSheet={() => setShowCharacterSheet(true)}
        onInventory={() => setShowInventory(true)}
        onSave={handleSave}
      />

      <main className="main-content">
        <div className="scene-container">
          <SceneRenderer
            scene={sessionState.currentScene}
            gameSession={sessionState.gameState.session}
            sceneAnalysis={sessionState.sceneAnalysis}
            onChoiceSelected={handleSceneTransition}
            onCombatAction={handleCombatAction}
            onSpellCast={handleSpellCast}
          />
        </div>

        {!isCombatScene && <GameLog messages={messages} />}
      </main>

      {/* Modales - Logique UI pure */}
      {showInventory && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>📦 Inventaire</h2>
            <p>Interface d'inventaire à implémenter</p>
            <button onClick={() => setShowInventory(false)}>Fermer</button>
          </div>
        </div>
      )}

      {showCharacterSheet && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>📊 Feuille de personnage</h2>
            <p>Feuille de personnage à implémenter</p>
            <button onClick={() => setShowCharacterSheet(false)}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
};