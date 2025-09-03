/**
 * PRESENTATION COMPONENT - GameUI
 * Interface utilisateur permanente (repos, menu, inventaire, statut)
 */

import React from 'react';
import type { GameAction, GameStateSnapshot } from '../../application/usecases/GameUseCase';
import { TimeDisplay } from './TimeDisplay';
import { logger } from '../../infrastructure/services/Logger';
import { useUIState } from '../hooks/useUIState';

interface GameUIProps {
  gameState: GameStateSnapshot;
  onAction: (actionId: string) => void;
  onRest: (restType: 'short' | 'long') => void;
  onSave: () => void;
  onInventory: () => void;
  onCharacterSheet: () => void;
}

/**
 * GAME UI - Interface permanente du jeu
 * Affichage constant par-dessus les scènes
 */
export const GameUI: React.FC<GameUIProps> = ({
  gameState,
  onAction,
  onRest,
  onSave,
  onInventory,
  onCharacterSheet
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const [showCharacterSummary, setShowCharacterSummary] = React.useState(false);
  
  // CONSTITUTION #3 - UI utilise les hooks, pas directement les UseCases
  const { getHealthDisplayData } = useUIState();
  
  const session = gameState.session;
  const player = session.playerCharacter;

  React.useEffect(() => {
    // logger.ui('GameUI rendered', {
    //   phase: session.currentPhase,
    //   sceneId: session.currentSceneId,
    //   actionsCount: gameState.availableActions.length
    // });
  }, [session.currentPhase, session.currentSceneId]);

  const handleActionClick = (action: GameAction) => {
    logger.ui(`GameUI action clicked: ${action.id}`, { 
      type: action.type,
      enabled: action.enabled 
    });
    
    if (!action.enabled) return;
    
    switch (action.type) {
      case 'rest':
        // Ouvrir le menu de repos
        break;
      case 'inventory':
        onInventory();
        break;
      case 'save_game':
        onSave();
        break;
      default:
        onAction(action.id);
    }
    
    setShowMenu(false);
  };

  const getPhaseDisplay = () => {
    switch (session.currentPhase) {
      case 'scene_navigation': return 'Navigation';
      case 'combat': return 'Combat';
      case 'dialogue': return 'Dialogue';
      case 'inventory': return 'Inventaire';
      case 'rest': return 'Repos';
      case 'game_over': return 'Fin de partie';
      default: return session.currentPhase;
    }
  };

  // CONSTITUTION #3 - Données d'affichage via hook
  const healthDisplayData = getHealthDisplayData(player);

  return (
    <div className="game-ui">
      {/* Barre de statut en haut */}
      <div className="status-bar">
        <div className="status-left">
          <button 
            className="character-summary"
            onClick={() => setShowCharacterSummary(!showCharacterSummary)}
          >
            <span className="character-name">{player.name}</span>
            <span className="character-level">Niv. {player.level}</span>
            <span className="character-class">{player.characterClass}</span>
          </button>
          
          {/* Barre de vie */}
          <div className="health-bar">
            <div className="health-label">PV</div>
            <div className="health-bar-container">
              <div 
                className="health-bar-fill"
                style={{ 
                  width: `${healthDisplayData.percentage}%`,
                  backgroundColor: healthDisplayData.color,
                  height:'3px'
                }}
              />
              <span className="health-text">
                {player.currentHP}/{player.maxHP}
              </span>
            </div>
          </div>
        </div>

        <div className="status-center">
          <TimeDisplay gameTime={session.gameTime} />
          <span className="phase-indicator">{getPhaseDisplay()}</span>
        </div>

        <div className="status-right">
          <button 
            className="menu-button"
            onClick={() => setShowMenu(!showMenu)}
          >
            ☰ Menu
          </button>
        </div>
      </div>

      {/* Menu déroulant */}
      {showMenu && (
        <div className="game-menu">
          <div className="menu-content">
            <h3>Actions disponibles</h3>
            
            <div className="menu-actions">
              {gameState.availableActions.map((action) => (
                <button
                  key={action.id}
                  className={`menu-action ${!action.enabled ? 'disabled' : ''}`}
                  onClick={() => handleActionClick(action)}
                  disabled={!action.enabled}
                  title={action.description}
                >
                  <span className="action-label">{action.label}</span>
                  <span className="action-description">{action.description}</span>
                  {action.requirements && action.requirements.length > 0 && (
                    <div className="action-requirements">
                      {action.requirements.map((req, index) => (
                        <small key={index}>{req}</small>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            <div className="menu-quick-actions">
              <button onClick={() => onCharacterSheet()}>
                📊 Feuille de personnage
              </button>
              <button onClick={() => onInventory()}>
                🎒 Inventaire
              </button>
              <button 
                onClick={() => onSave()}
                className={session.needsSaving() ? 'needs-save' : ''}
              >
                💾 {session.needsSaving() ? 'Sauvegarder*' : 'Sauvegarder'}
              </button>
            </div>
          </div>
          
          <button 
            className="menu-close"
            onClick={() => setShowMenu(false)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Résumé du personnage */}
      {showCharacterSummary && (
        <div className="character-summary-panel">
          <div className="summary-content">
            <h4>{player.name}</h4>
            <div className="character-stats">
              <div className="stat">
                <span className="stat-label">Classe :</span>
                <span className="stat-value">{player.characterClass}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Niveau :</span>
                <span className="stat-value">{player.level}</span>
              </div>
              <div className="stat">
                <span className="stat-label">PV :</span>
                <span className="stat-value">{player.currentHP}/{player.maxHP}</span>
              </div>
              {/* TODO: Ajouter d'autres stats selon la structure de Character */}
            </div>
            
            <div className="party-summary">
              <h5>Groupe ({session.companions.length + 1})</h5>
              <div className="party-members">
                <div className="party-member player">
                  <span>{player.name} (Vous)</span>
                  <span className={player.isAlive ? 'alive' : 'dead'}>
                    {player.isAlive ? '💚' : '💀'}
                  </span>
                </div>
                {session.companions.map((companion) => (
                  <div key={companion.id} className="party-member companion">
                    <span>{companion.name}</span>
                    <span className={companion.isAlive ? 'alive' : 'dead'}>
                      {companion.isAlive ? '💚' : '💀'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <button 
            className="summary-close"
            onClick={() => setShowCharacterSummary(false)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Indicateur de sauvegarde nécessaire */}
      {session.needsSaving() && (
        <div className="save-indicator">
          <button onClick={onSave} title="Progression non sauvegardée">
            💾 *
          </button>
        </div>
      )}

      {/* Raccourcis clavier (info) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="keyboard-shortcuts">
          <details>
            <summary>Raccourcis</summary>
            <div className="shortcuts-list">
              <div><kbd>M</kbd> - Menu</div>
              <div><kbd>I</kbd> - Inventaire</div>
              <div><kbd>C</kbd> - Personnage</div>
              <div><kbd>S</kbd> - Sauvegarder</div>
              <div><kbd>R</kbd> - Repos</div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

// Hook pour les raccourcis clavier
export const useGameUIKeyboard = (
  onInventory: () => void,
  onCharacterSheet: () => void,
  onSave: () => void,
  onMenu: () => void
) => {
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignorer si on tape dans un input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      switch (e.key.toLowerCase()) {
        case 'm':
          onMenu();
          break;
        case 'i':
          onInventory();
          break;
        case 'c':
          onCharacterSheet();
          break;
        case 's':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onSave();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [onInventory, onCharacterSheet, onSave, onMenu]);
};