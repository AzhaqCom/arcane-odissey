/**
 * PRESENTATION - CombatPanel Component
 * Panel contextuel pour les actions de combat
 */

import React from 'react';
import { type CombatEntity } from '../../domain/entities/Combat';
import { type Weapon } from '../../domain/entities/Weapon';
import { type Spell } from '../../domain/entities/Spell';

import type { UICombatPhase } from '../../types/combat';

type CombatPhase = UICombatPhase;

interface CombatPanelProps {
  phase: CombatPhase;
  currentEntity: CombatEntity | null;
  isPlayerTurn: boolean;
  isLoading: boolean;
  isMovementMode?: boolean;
  targetingWeapon?: string | null;  // weaponId when targeting for attack
  targetingSpell?: string | null;   // spellId when targeting for spell
  weapons: Weapon[];
  spells: Spell[];
  onStartCombat: () => void;
  onAdvanceTurn: () => void;
  onExecuteAITurn: () => void;
  onMoveEntity: () => void;
  onAttackWithWeapon: (weaponId: string) => void;
  onCastSpell: (spellId: string) => void;
  onCancelTargeting?: () => void;   // Callback to cancel targeting mode
}

export const CombatPanel: React.FC<CombatPanelProps> = ({
  phase,
  currentEntity,
  isPlayerTurn,
  isLoading,
  isMovementMode = false,
  targetingWeapon = null,
  targetingSpell = null,
  weapons,
  spells,
  onStartCombat,
  onAdvanceTurn,
  onExecuteAITurn,
  onMoveEntity,
  onAttackWithWeapon,
  onCastSpell,
  onCancelTargeting
}) => {
  
  const renderPreCombat = () => (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h3>⚡ Préparation du Combat</h3>
      <p>Positionnez vos personnages et préparez-vous à l'affrontement.</p>
      <button
        onClick={onStartCombat}
        disabled={isLoading}
        style={{
          marginTop: '20px',
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isLoading ? 'wait' : 'pointer'
        }}
      >
        {isLoading ? 'Préparation...' : '⚔️ Démarrer le Combat'}
      </button>
    </div>
  );

  const renderInitiative = () => (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h3>🎲 Initiative lancée !</h3>
      <p>Les jets d'initiative ont été effectués.</p>
      <p><strong>Prêt à commencer le combat ?</strong></p>
      <button
        onClick={onAdvanceTurn}
        disabled={isLoading}
        style={{
          marginTop: '15px',
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isLoading ? 'wait' : 'pointer'
        }}
      >
        {isLoading ? 'Démarrage...' : '▶️ Commencer le combat'}
      </button>
    </div>
  );

  const renderPlayerTurn = () => {
    // Determine what is currently being targeted
    const targetingWeaponData = targetingWeapon ? weapons.find(w => w.id === targetingWeapon) : null;
    const targetingSpellData = targetingSpell ? spells.find(s => s.id === targetingSpell) : null;
    
    return (
      <div style={{ padding: '15px' }}>
        <h3 style={{ marginBottom: '15px' }}>
          🎮 Tour de {currentEntity?.name}
        </h3>
        
        {/* Display targeting status */}
        {(targetingWeaponData || targetingSpellData) && (
          <div style={{ 
            marginBottom: '15px', 
            padding: '10px', 
            backgroundColor: '#2c3e50', 
            borderRadius: '4px',
            color: '#ecf0f1' 
          }}>
            {targetingWeaponData && (
              <span>{targetingWeaponData.name} sélectionné (0/1 cibles)</span>
            )}
            {targetingSpellData && (
              <span>{targetingSpellData.name} sélectionné (0/{targetingSpellData.targetCount || 1} cibles)</span>
            )}
          </div>
        )}
      
      {/* Actions de base */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ marginBottom: '10px', color: '#555' }}>Actions</h4>
        
        <button
          onClick={onMoveEntity}
          disabled={isLoading || !currentEntity?.actionsRemaining.movement}
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '8px',
            fontSize: '14px',
            backgroundColor: isMovementMode ? '#4CAF50' : (currentEntity?.actionsRemaining.movement ? '#FF9800' : '#ccc'),
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'wait' : 'pointer',
            boxShadow: isMovementMode ? '0 0 8px rgba(76, 175, 80, 0.5)' : 'none'
          }}
        >
          {isMovementMode ? '❌ Annuler mouvement' : `🚶 Se déplacer (${currentEntity?.actionsRemaining.movement || 0}m restants)`}
        </button>
      </div>

      {/* Armes */}
      {weapons.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ marginBottom: '10px', color: '#555' }}>⚔️ Armes</h4>
          {weapons.map(weapon => (
            <button
              key={weapon.id}
              onClick={() => onAttackWithWeapon(weapon.id)}
              disabled={isLoading || !currentEntity?.actionsRemaining.action}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '6px',
                fontSize: '14px',
                backgroundColor: currentEntity?.actionsRemaining.action ? '#d32f2f' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoading ? 'wait' : 'pointer',
                textAlign: 'left'
              }}
            >
              <div>
                <strong>{weapon.name}</strong>
              </div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>
                Dégâts: {weapon.getDamageDisplay()}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Sorts */}
      {spells.length > 0 && currentEntity?.spellSlots && (
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ marginBottom: '10px', color: '#555' }}>✨ Sorts</h4>
          {spells.map(spell => {
            const canCast = currentEntity.spellSlots.hasSlot(spell.level);
            const actionCost = spell.castingTime === 'bonus_action' ? 'bonusAction' : 'action';
            const hasAction = currentEntity.actionsRemaining[actionCost as keyof typeof currentEntity.actionsRemaining];
            
            return (
              <button
                key={spell.id}
                onClick={() => onCastSpell(spell.id)}
                disabled={isLoading || !canCast || !hasAction}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginBottom: '6px',
                  fontSize: '14px',
                  backgroundColor: (canCast && hasAction) ? '#7b1fa2' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isLoading ? 'wait' : 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div><strong>{spell.name}</strong></div>
                    {spell.effects.damage && (
                      <div style={{ fontSize: '12px', opacity: 0.9 }}>
                        Dégâts: {spell.effects.damage[0]?.diceCount}d{spell.effects.damage[0]?.diceType}
                        {spell.effects.damage[0]?.modifier ? `+${spell.effects.damage[0].modifier}` : ''}
                        {spell.combatProperties.projectiles && ` (${spell.combatProperties.projectiles} projectiles)`}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '10px', opacity: 0.8 }}>
                    Niv.{spell.level}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
      
      {/* Cancel and Pass turn buttons at the bottom */}
      <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
        {/* Show Cancel button only when targeting */}
        {(targetingWeapon || targetingSpell) && onCancelTargeting && (
          <button
            onClick={onCancelTargeting}
            style={{
              padding: '10px 16px',
              fontSize: '14px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Annuler
          </button>
        )}
        
        <button
          onClick={onAdvanceTurn}
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '10px',
            fontSize: '14px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'wait' : 'pointer'
          }}
        >
          Passer le tour
        </button>
      </div>
    </div>
    );
  };

  const renderAITurn = () => (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h3>🤖 Tour de {currentEntity?.name}</h3>
      <p>L'IA réfléchit à sa prochaine action...</p>
      
      <button
        onClick={onExecuteAITurn}
        disabled={isLoading}
        style={{
          marginTop: '15px',
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: '#FF5722',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isLoading ? 'wait' : 'pointer'
        }}
      >
        {isLoading ? 'IA réfléchit...' : '🎯 Exécuter action IA'}
      </button>
      
      <div style={{ marginTop: '15px' }}>
        <button
          onClick={onAdvanceTurn}
          disabled={isLoading}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'wait' : 'pointer'
          }}
        >
          ⏭️ Passer ce tour
        </button>
      </div>
    </div>
  );

  const renderVictory = () => (
    <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#d4edda', borderRadius: '8px' }}>
      <h3 style={{ color: '#155724', marginBottom: '10px' }}>🎉 Victoire !</h3>
      <p>Tous les ennemis ont été vaincus.</p>
      <p style={{ fontSize: '14px', marginTop: '10px', color: '#155724' }}>
        Le combat est terminé avec succès !
      </p>
    </div>
  );

  const renderDefeat = () => (
    <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f8d7da', borderRadius: '8px' }}>
      <h3 style={{ color: '#721c24', marginBottom: '10px' }}>💀 Défaite</h3>
      <p>Tous les alliés sont morts.</p>
      <p style={{ fontSize: '14px', marginTop: '10px', color: '#721c24' }}>
        Le combat est terminé...
      </p>
    </div>
  );

  const renderPhase = () => {
    switch (phase) {
      case 'pre_combat':
        return renderPreCombat();
      case 'initiative':
        return renderInitiative();
      case 'player_turn':
        return renderPlayerTurn();
      case 'ai_turn':
        return renderAITurn();
      case 'victory':
        return renderVictory();
      case 'defeat':
        return renderDefeat();
      default:
        return <div>Phase inconnue</div>;
    }
  };

  return (
    <div style={{
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        padding: '12px 15px',
        borderBottom: '1px solid #dee2e6',
        backgroundColor: '#e9ecef',
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px'
      }}>
        <h2 style={{ margin: 0, fontSize: '18px', color: '#495057' }}>
          🎮 Panneau de Combat
        </h2>
      </div>
      
      <div style={{ flex: 1, overflow: 'auto' }}>
        {renderPhase()}
      </div>
    </div>
  );
};