/**
 * PRESENTATION - Combat Grid Phoenix
 * Grille tactique utilisant View Models avec styles legacy
 * Respecte ARCHITECTURE_GUIDELINES.md - Règle #3 Dumb Presentation
 * ✅ Aucun import Domain direct - Isolation complète
 */

import React, { useMemo } from 'react';
import type { CombatEntityView } from '../types/CombatTypes';

// Types locaux pour la grille
type Position = { x: number; y: number };
type HealthDisplay = { 
  current: number; 
  max: number; 
  percentage: number;
  color: string;
  displayText: string;
};

interface CombatGridNewProps {
  // Props pures - View Models uniquement
  entities: CombatEntityView[];
  currentEntity: CombatEntityView | null;
  isMovementMode: boolean;
  onCellClick: (position: Position) => void;
  gridDimensions?: { width: number; height: number };
}

/**
 * GRILLE PHOENIX AVEC STYLES LEGACY
 * Reprend exactement le CSS de l'ancien CombatGrid
 */
export const CombatGridNew: React.FC<CombatGridNewProps> = ({
  entities,
  currentEntity,
  isMovementMode,
  onCellClick,
  gridDimensions = { width: 12, height: 8 }
}) => {
  // Créer une map des entités par position
  const entitiesByPosition = useMemo(() => {
    const map = new Map<string, CombatEntity>();
    entities.forEach(entity => {
      if (!entity.isDead && entity.position) {
        const key = `${entity.position.x},${entity.position.y}`;
        map.set(key, entity);
      }
    });
    return map;
  }, [entities]);

  // Calculer les cellules atteignables pour le mouvement
  const reachableCells = useMemo(() => {
    const cells = new Set<string>();
    if (isMovementMode && currentEntity?.position && currentEntity.actionsRemaining?.movement) {
      const movement = currentEntity.actionsRemaining.movement;
      const { x: cx, y: cy } = currentEntity.position;
      
      // Calculer les cellules dans le rayon de mouvement
      for (let y = 0; y < gridDimensions.height; y++) {
        for (let x = 0; x < gridDimensions.width; x++) {
          const distance = Math.abs(x - cx) + Math.abs(y - cy);
          if (distance <= movement / 5 && distance > 0) { // 5 feet par cellule
            const key = `${x},${y}`;
            if (!entitiesByPosition.has(key)) {
              cells.add(key);
            }
          }
        }
      }
    }
    return cells;
  }, [isMovementMode, currentEntity, entitiesByPosition, gridDimensions]);

  // Calculer l'affichage des points de vie
  const getHealthDisplay = (entity: CombatEntityView): HealthDisplay => {
    const percentage = entity.healthPercentage;
    let color = '#4CAF50'; // Vert
    
    if (percentage <= 25) {
      color = '#f44336'; // Rouge
    } else if (percentage <= 50) {
      color = '#ff9800'; // Orange
    } else if (percentage <= 75) {
      color = '#ffeb3b'; // Jaune
    }
    
    return {
      current: entity.hitPoints,
      max: entity.maxHitPoints,
      percentage,
      color,
      displayText: `${entity.hitPoints}/${entity.maxHitPoints}`
    };
  };

  // Obtenir le contenu d'une cellule
  const getCellContent = (x: number, y: number): React.ReactNode => {
    const key = `${x},${y}`;
    const entity = entitiesByPosition.get(key);
    const isReachable = reachableCells.has(key);

    if (entity) {
      const healthDisplay = getHealthDisplay(entity);
      
      return (
        <div className="grid-entity-card">
          <div className="entity-name">{entity.name}</div>
          <div className="entity-hp-bar">
            <div 
              className="entity-hp-fill"
              style={{ 
                width: `${healthDisplay.percentage}%`,
                backgroundColor: healthDisplay.color
              }} 
            />
          </div>
          <div className="entity-hp-text">{healthDisplay.displayText}</div>
        </div>
      );
    }

    if (isMovementMode && isReachable) {
      return '🎯'; // Icône de mouvement possible
    }

    return '';
  };

  // Obtenir le style d'une cellule
  const getCellStyle = (x: number, y: number): React.CSSProperties => {
    const key = `${x},${y}`;
    const entity = entitiesByPosition.get(key);
    const isReachable = reachableCells.has(key);

    let backgroundColor = 'transparent';
    let border = '1px solid #dee2e6';
    let cursor = 'default';

    // Cellule avec entité
    if (entity) {
      if (entity.type === 'player') {
        backgroundColor = entity.id === currentEntity?.id ? '#cce5ff' : '#e8f5e8';
      } else {
        backgroundColor = entity.id === currentEntity?.id ? '#ffe5cc' : '#ffe8e8';
      }

      if (entity.isDead) {
        backgroundColor = '#d0d0d0';
      }
    }

    // Mode mouvement - surbrillance des cellules atteignables
    if (isMovementMode && isReachable && !entity) {
      backgroundColor = '#352941';
      border = '1px solid #8962b1ff';
      cursor = 'pointer';
    }

    return {
      flex: 1,
      border,
      backgroundColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '11px',
      fontWeight: 'bold',
      position: 'relative',
      cursor,
      transition: 'all 0.2s ease',
      userSelect: 'none',
      color: 'black'
    };
  };

  // Gérer le clic sur une cellule
  const handleCellClick = (x: number, y: number) => {
    const key = `${x},${y}`;
    if (isMovementMode && reachableCells.has(key) && !entitiesByPosition.has(key)) {
      onCellClick({ x, y });
    }
  };

  // Rendu de la grille
  const renderGrid = () => {
    const rows = [];

    for (let y = 0; y < gridDimensions.height; y++) {
      const row = (
        <div key={y} style={{ flex: 1, display: 'flex' }}>
          {Array.from({ length: gridDimensions.width }, (_, x) => (
            <div
              key={x}
              style={getCellStyle(x, y)}
              title={`Position (${x}, ${y})`}
              onClick={() => handleCellClick(x, y)}
            >
              {getCellContent(x, y)}
            </div>
          ))}
        </div>
      );
      rows.push(row);
    }

    return rows;
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        flex: '1',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        overflow: 'auto'
      }}>
        <div className='combat-grid' style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: '800px',
          aspectRatio: '3/2',
          border: '2px solid #333',
          backgroundColor: 'rgba(15, 23, 42, 0.3)',
          borderRadius: '4px',
          padding: '4px'
        }}>
          {renderGrid()}
        </div>
      </div>
    </div>
  );
};

/* STYLES CSS À AJOUTER DANS LE FICHIER CSS PRINCIPAL */
/*
.combat-grid {
  display: flex;
  flex-direction: column;
}

.grid-entity-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 10px;
  padding: 2px;
  width: 100%;
}

.entity-name {
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.entity-hp-bar {
  width: 80%;
  height: 4px;
  background-color: #ccc;
  border-radius: 2px;
  overflow: hidden;
  margin: 2px 0;
}

.entity-hp-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.entity-hp-text {
  font-size: 9px;
  color: #666;
}
*/