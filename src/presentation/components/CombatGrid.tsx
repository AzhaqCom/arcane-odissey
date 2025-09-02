/**
 * PRESENTATION - Interactive Combat Grid
 * Grille tactique interactive avec surbrillance et 60% de largeur
 */

import React, { useState, useMemo } from 'react';
import { type CombatEntity, type Position } from '../../domain/entities/Combat';
import type { HealthDisplay } from '../../domain/entities/Combat';

interface CombatGridProps {
  // PHASE 2 - ACTION 2.2.1: Props pures depuis useCombat
  entities: CombatEntity[];
  healthDisplays: Map<string, HealthDisplay>;
  reachableCells: Set<string>;
  isMovementMode: boolean;
  onCellClick: (position: Position) => void;
  onMovementCancel: () => void;
  // Dimensions pour rendu grille
  gridDimensions: { width: number; height: number };
}

export const CombatGrid: React.FC<CombatGridProps> = ({
  entities,
  healthDisplays,
  reachableCells,
  isMovementMode,
  gridDimensions,
  onCellClick,
  onMovementCancel
}) => {
  // PHASE 2 - ACTION 2.2.1: Composant 100% stupide - props pures uniquement
  
  // Créer une map des entités par position (pure rendering logic)
  const entitiesByPosition = new Map<string, CombatEntity>();
  entities.forEach(entity => {
    const key = `${entity.position.x},${entity.position.y}`;
    entitiesByPosition.set(key, entity);
  });

  const getCellContent = (x: number, y: number): React.ReactNode => {
    const key = `${x},${y}`;
    const entity = entitiesByPosition.get(key);
    const isReachable = reachableCells.has(key);

    if (entity) {
      // PHASE 2 - ACTION 2.2.1: Utiliser healthDisplay depuis props
      const healthDisplay = healthDisplays.get(entity.id);
      
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

    if (isMovementMode && isReachable && !entity) {
      return '🎯'; // Icône de mouvement possible
    }

    return '';
  };

  const getCellStyle = (x: number, y: number): React.CSSProperties => {
    const key = `${x},${y}`;
    const entity = entitiesByPosition.get(key);
    const isReachable = reachableCells.has(key);

    let backgroundColor = 'transparent';
    let border = '1px solid #dee2e6';
    let cursor = 'default';

    // Cellule avec entité
    // if (entity) {
    //   if (entity.type === 'player') {
    //     backgroundColor = entity.id === currentEntity?.id ? '#cce5ff' : '#e8f5e8';
    //   } else {
    //     backgroundColor = entity.id === currentEntity?.id ? '#ffe5cc' : '#ffe8e8';
    //   }

    //   if (entity.isDead) {
    //     backgroundColor = '#d0d0d0';
    //   }
    // }

    // Mode mouvement - surbrillance des cellules atteignables
    if (isMovementMode && isReachable && !entity) {
      backgroundColor = '#352941';
     border = '1px solid #8962b1ff';
      cursor = 'pointer';
    }

    // Survol interactif
    const baseStyle: React.CSSProperties = {
      flex:1,
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
      color:'Black'
    };

    return baseStyle;
  };

  const handleCellClick = (x: number, y: number) => {
    if (isMovementMode && reachableCells.has(`${x},${y}`) && !entitiesByPosition.get(`${x},${y}`)) {
      onCellClick({ x, y });
    }
  };

  const renderGrid = () => {
    const rows = [];

    // Header avec coordonnées X
    // const headerRow = (
    //   <div key="header" style={{ display: 'flex' }}>
    //     <div style={{ flex:0.5, display: 'flex',}}></div>
    //     {Array.from({ length: dimensions.width }, (_, x) => (
    //       <div key={x} style={{ flex:1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
    //         {x}
    //       </div>
    //     ))}
    //   </div>
    // );
    // rows.push(headerRow);

    // Grille avec coordonnées Y
    for (let y = 0; y < gridDimensions.height; y++) {
      const row = (
        <div key={y} style={{ flex:1,display: 'flex' }}>
          {/* Coordonnée Y */}
          {/* <div style={{ flex:0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
            {y}
          </div> */}
          {/* Cellules */}
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
        <div className='combat-grid'>
          {renderGrid()}
        </div>
      </div>


    </div>
  );
};