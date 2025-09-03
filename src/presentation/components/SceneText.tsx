/**
 * PRESENTATION COMPONENT - SceneText
 * Composant pour les scènes narratives (text, dialogue, etc.)
 */

import React from 'react';
import { Scene, GameSession } from '../../domain/entities';
import type { SceneAnalysis } from '../../application/usecases/SceneUseCase';
import { logger } from '../../infrastructure/services/Logger';

interface SceneTextProps {
  scene: Scene;
  gameSession: GameSession;
  sceneAnalysis: SceneAnalysis;
  onChoiceSelected: (choiceId: string, targetSceneId: string) => void;
  onSpellCast?: (spellId: string) => void;
}

/**
 * SCENE TEXT - Rendu des scènes narratives
 * Gère le texte, les choix, et les sorts contextuels
 */
export const SceneText: React.FC<SceneTextProps> = ({
  scene,
  gameSession,
  sceneAnalysis,
  onChoiceSelected,
  onSpellCast
}) => {
  const [selectedChoice, setSelectedChoice] = React.useState<string | null>(null);
  const [showContextualSpells, setShowContextualSpells] = React.useState(false);

  // Obtenir le contenu de la scène
  const sceneContent = scene.content as any;
  const speaker = sceneContent?.speaker;
  const sceneText = scene.getText();
  const baseDescription = scene.description


  React.useEffect(() => {
    // logger.ui(`Rendering text scene: ${scene.id}`, {
    //   type: scene.type,
    //   hasChoices: sceneAnalysis.availableChoices.length > 0,
    //   hasContextualSpells: sceneAnalysis.contextualSpells.length > 0
    // });
  }, [scene.id]);

  const handleChoiceClick = (choice: any) => {
    setSelectedChoice(choice.id);
    // logger.ui(`Choice selected: ${choice.id}`, {
    //   text: choice.text,
    //   targetScene: choice.targetSceneId
    // });

    // Délai pour l'animation
    setTimeout(() => {
      onChoiceSelected(choice.id, choice.targetSceneId);
      setSelectedChoice(null);
    }, 200);
  };

  const handleSpellCast = (spellId: string) => {
    // logger.ui(`Contextual spell cast: ${spellId}`);
    onSpellCast?.(spellId);
    setShowContextualSpells(false);
  };

  return (
    <div className="scene-text">
      {/* En-tête de scène */}
      <div className="scene-header">
        <h2 className="scene-title">{scene.title}</h2>

        {/* Indicateurs de contexte */}
        <div className="scene-metadata">
          <span className={`safety-indicator safety-${scene.metadata.safety}`}>
            {scene.metadata.safety === 'safe' && '🟢Lieu Sur'}
            {scene.metadata.safety === 'moderate' && '🟡Lieu'}
            {scene.metadata.safety === 'dangerous' && '🟠Lieu dangereux'}
            {scene.metadata.safety === 'deadly' && '🔴Lieu Très déngereux'}
          </span>

          {scene.metadata.environment && (
            <span className="environment-indicator">
              {scene.metadata.environment === 'indoor' && '🏠En Intérieur'}
              {scene.metadata.environment === 'outdoor' && '🌳En Exterieur'}
              {scene.metadata.environment === 'underground' && '⛰️Sous terre'}
              {scene.metadata.environment === 'water' && '🌊Sous l\'eau'}
              {scene.metadata.environment === 'sky' && '☁️Dans le ciel'}
            </span>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="scene-content">
        {speaker && (
          <div className="scene-speaker">
            <strong>{speaker} :</strong>
          </div>
        )}
      <div className='scene-content-text'>
        {sceneText}
      </div>
        <div className="scene-description">
          
          {baseDescription}
        </div>
      </div>

      {/* Sorts contextuels */}
      {sceneAnalysis.contextualSpells.length > 0 && (
        <div className="contextual-spells">
          <button
            className="contextual-spells-toggle"
            onClick={() => setShowContextualSpells(!showContextualSpells)}
          >
            ✨ Sorts contextuels ({sceneAnalysis.contextualSpells.length})
          </button>

          {showContextualSpells && (
            <div className="contextual-spells-list">
              {sceneAnalysis.contextualSpells.map((spell) => (
                <button
                  key={spell.spellId}
                  className={`contextual-spell priority-${spell.priority}`}
                  onClick={() => handleSpellCast(spell.spellId)}
                  title={spell.reason}
                >
                  <span className="spell-name">{spell.spellId.replace('_', ' ')}</span>
                  <span className="spell-reason">{spell.reason}</span>
                  <span className="spell-priority">
                    {spell.priority === 'high' && '⭐⭐⭐'}
                    {spell.priority === 'medium' && '⭐⭐'}
                    {spell.priority === 'low' && '⭐'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Choix disponibles */}
      {sceneAnalysis.availableChoices.length > 0 && (
        <div className="scene-choices">
          <div className="choices-list">
            {sceneAnalysis.availableChoices.map((choice) => (
              <button
                key={choice.id}
                className={`scene-choice ${selectedChoice === choice.id ? 'selected' : ''}`}
                onClick={() => handleChoiceClick(choice)}
                disabled={selectedChoice !== null}
              >
                <span className="choice-text">{choice.text}</span>
                {choice.conditions && choice.conditions.length > 0 && (
                  <span className="choice-requirements">
                    (Requis: {choice.conditions.length} condition(s))
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};