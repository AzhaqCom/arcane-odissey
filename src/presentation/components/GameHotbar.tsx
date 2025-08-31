/**
 * PRESENTATION COMPONENT - GameHotbar
 * Barre d'outils verticale à droite avec boutons principaux
 */

import React from 'react';

interface GameHotbarProps {
  onCharacterSheet: () => void;
  onInventory: () => void;
  onSave: () => void;
}

export const GameHotbar: React.FC<GameHotbarProps> = ({
  onCharacterSheet,
  onInventory,
  onSave
}) => {
  return (
    <div className="game-hotbar">
      <div className="hotbar-buttons">
        <button 
          className="hotbar-button"
          onClick={onCharacterSheet}
          title="Feuille de personnage"
        >
          📊
        </button>
        <button 
          className="hotbar-button"
          onClick={onInventory}
          title="Inventaire"
        >
          🎒
        </button>
        <button 
          className="hotbar-button"
          onClick={onSave}
          title="Sauvegarder"
        >
          💾
        </button>
      </div>
    </div>
  );
};