/**
 * PRESENTATION COMPONENT - StatusCorner
 * Affiche HP, Gold et Time centrés en haut de l'écran
 */

import React from 'react';
import type { GameStateSnapshot } from '../../application/usecases/GameUseCase';

interface StatusCornerProps {
  gameState: GameStateSnapshot;
}

export const StatusCorner: React.FC<StatusCornerProps> = ({ gameState }) => {
  return (
    <div className="status-corner">
      <div className="status-corner-content">
        <div className="status-item">
          <span className="status-icon">❤️</span>
          <span className="status-value">
            {gameState.session.playerCharacter.currentHP}/{gameState.session.playerCharacter.maxHP}
          </span>
        </div>
        <div className="status-item">
          <span className="status-icon">💰</span>
          <span className="status-value">
            {gameState.session.playerCharacter.gold}
          </span>
        </div>
        <div className="status-item">
          <span className="status-icon">⏰</span>
          <span className="status-value">
            {gameState.session.getFormattedTime()}
          </span>
        </div>
      </div>
    </div>
  );
};