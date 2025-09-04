/**
 * PRESENTATION COMPONENT - PlayerActionPanel
 * Interface authentique D&D pour les actions du joueur
 * Remplace l'ancienne UI "dégueulasse" par une vraie interface de combat
 * Respecte ARCHITECTURE_GUIDELINES.md - Règle #2 UI découplée
 */

import React from 'react';
import type { PlayerWeaponChoice } from '../../domain/services/PlayerWeaponService';

interface PlayerActionPanelProps {
  isPlayerTurn: boolean;
  playerWeapons: PlayerWeaponChoice[];
  onSelectWeapon: (weaponId: string) => void;
  onSelectMovement: () => void;
  selectedWeapon?: string;
  currentEntityName?: string; // Pour afficher qui joue
  className?: string;
  // Nouvelles props pour fin de combat
  combatPhase?: 'setup' | 'active' | 'victory' | 'defeat';
  postCombatChoices?: Array<{
    id: string;
    text: string;
    targetSceneId: string;
  }>;
  onPostCombatChoice?: (choiceId: string, targetSceneId: string) => void;
}

export function PlayerActionPanel({ 
  isPlayerTurn, 
  playerWeapons, 
  onSelectWeapon, 
  onSelectMovement,
  selectedWeapon,
  currentEntityName = 'Inconnu',
  className = '',
  combatPhase = 'active',
  postCombatChoices = [],
  onPostCombatChoice
}: PlayerActionPanelProps) {
  
  // ✅ AFFICHAGE FIN DE COMBAT (VICTORY/DEFEAT)
  if (combatPhase === 'victory' || combatPhase === 'defeat') {
    return (
      <div className={`player-action-panel post-combat ${combatPhase} ${className}`}>
        <div className="panel-header">
          <h3>{combatPhase === 'victory' ? '🏆 Victoire !' : '💀 Défaite...'}</h3>
          <div className={`turn-indicator ${combatPhase}`}>
            <span>{combatPhase === 'victory' ? '🎉 Combat gagné !' : '⚰️ Combat perdu'}</span>
          </div>
        </div>
        
        <div className="post-combat-section">
          <div className="combat-result">
            <p>
              {combatPhase === 'victory' 
                ? 'Félicitations ! Vous avez triomphé de vos ennemis.'
                : 'Vous avez été vaincu. Que souhaitez-vous faire ?'
              }
            </p>
          </div>
          
          <div className="post-combat-choices">
            {postCombatChoices.map(choice => (
              <button
                key={choice.id}
                className={`post-combat-button ${combatPhase === 'victory' ? 'victory-button' : 'defeat-button'}`}
                onClick={() => onPostCombatChoice?.(choice.id, choice.targetSceneId)}
              >
                {choice.text}
              </button>
            ))}
            
            {/* Bouton Rejouer toujours présent en cas de défaite */}
            {combatPhase === 'defeat' && (
              <button
                className="post-combat-button replay-button"
                onClick={() => window.location.reload()}
              >
                🔄 Rejouer le combat
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Affichage différent selon qui joue
  if (!isPlayerTurn) {
    return (
      <div className={`player-action-panel inactive ${className}`}>
        <div className="panel-header">
          <h3>⚔️ Actions de Combat</h3>
          <div className="turn-indicator enemy-turn">
            <span>⏳ {currentEntityName} agit...</span>
          </div>
        </div>
        
        <div className="enemy-turn-info">
          <div className="enemy-action-display">
            <div className="loading-spinner">🔄</div>
            <p>{currentEntityName} réfléchit à son action...</p>
          </div>
          <div className="wait-message">
            <span>Votre tour arrive bientôt !</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`player-action-panel active ${className}`}>
      {/* En-tête du panneau */}
      <div className="panel-header">
        <h3>⚔️ Actions de Combat</h3>
        <div className="turn-indicator current">
          <span>🎯 Votre tour</span>
        </div>
      </div>

      {/* Section Mouvement */}
      <div className="action-section movement-section">
        <h4>🏃 Mouvement</h4>
        <button 
          className="action-button movement"
          onClick={onSelectMovement}
          disabled={!isPlayerTurn}
        >
          <span className="button-icon">🏃</span>
          <div className="button-content">
            <div className="button-title">Se déplacer</div>
            <div className="button-desc">Choisir une nouvelle position</div>
          </div>
        </button>
      </div>

      {/* Section Armes */}
      <div className="action-section weapons-section">
        <h4>⚔️ Attaques</h4>
        <div className="weapons-grid">
          {playerWeapons.map(weapon => (
            <button
              key={weapon.weaponId}
              className={`weapon-button ${!weapon.isAvailable ? 'disabled' : ''} ${selectedWeapon === weapon.weaponId ? 'selected' : ''}`}
              onClick={() => weapon.isAvailable && onSelectWeapon(weapon.weaponId)}
              disabled={!weapon.isAvailable || !isPlayerTurn}
              title={`Portée: ${weapon.range} cases`}
            >
              <div className="weapon-icon">⚔️</div>
              <div className="weapon-info">
                <div className="weapon-name">{weapon.weaponName}</div>
                <div className="weapon-damage">{weapon.damageDisplay}</div>
                <div className="weapon-range">Portée: {weapon.range}</div>
              </div>
            </button>
          ))}
          
          {/* Attaque à mains nues toujours disponible */}
          <button
            className="weapon-button unarmed"
            onClick={() => onSelectWeapon('unarmed')}
            disabled={!isPlayerTurn}
            title="Attaque à mains nues"
          >
            <div className="weapon-icon">👊</div>
            <div className="weapon-info">
              <div className="weapon-name">Mains nues</div>
              <div className="weapon-damage">Dégâts: 1 + mod.</div>
              <div className="weapon-range">Portée: 1</div>
            </div>
          </button>
        </div>
      </div>

      {/* Instructions contextuelles */}
      <div className="instructions">
        {selectedWeapon && (
          <div className="instruction active">
            <span>🎯</span> Cliquez sur un ennemi pour attaquer avec {playerWeapons.find(w => w.weaponId === selectedWeapon)?.weaponName}
          </div>
        )}
        {!selectedWeapon && (
          <div className="instruction">
            <span>⚡</span> Choisissez une arme pour attaquer
          </div>
        )}
      </div>
    </div>
  );
}