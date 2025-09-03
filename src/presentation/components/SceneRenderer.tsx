/**
 * PRESENTATION COMPONENT - SceneRenderer
 * Composant délégateur qui rend le bon type de scène
 */

import React from 'react';
import { Scene, GameSession } from '../../domain/entities';
import type { SceneAnalysis } from '../../application/usecases/SceneUseCase';
import { SceneText } from './SceneText';
// import { CombatContainer } from '../containers/CombatContainer'; // ✅ ANCIEN SYSTÈME
// import { CombatTestPage } from './CombatTestPage'; // ✅ Version test
import { CombatScenePhoenix } from './CombatScenePhoenix'; // ✅ SYSTÈME PHOENIX FINAL
import { logger } from '../../infrastructure/services/Logger';

interface SceneRendererProps {
  scene: Scene;
  gameSession: GameSession;
  sceneAnalysis: SceneAnalysis;
  onChoiceSelected: (choiceId: string, targetSceneId: string) => void;
  onCombatAction?: (action: any) => void;
  onSpellCast?: (spellId: string) => void;
}

/**
 * SCENE RENDERER - Délégue le rendu selon le type de scène
 * Point d'entrée unique pour tous les types de scènes
 */
export const SceneRenderer: React.FC<SceneRendererProps> = ({
  scene,
  gameSession,
  sceneAnalysis,
  onChoiceSelected,
  onCombatAction,
  onSpellCast
}) => {
  React.useEffect(() => {
    logger.ui(`Rendering scene: ${scene.id}`, {
      type: scene.type,
      title: scene.title,
      choicesCount: sceneAnalysis.availableChoices.length
    });
  }, [scene.id, scene.type, sceneAnalysis.availableChoices.length]);

  // Déléguer le rendu selon le type de scène
  switch (scene.type) {
    case 'text':
    case 'dialogue':
    case 'investigation':
    case 'merchant':
      return (
        <SceneText
          scene={scene}
          gameSession={gameSession}
          sceneAnalysis={sceneAnalysis}
          onChoiceSelected={onChoiceSelected}
          onSpellCast={onSpellCast}
        />
      );

    case 'combat':
      logger.info('SCENE_RENDERER', 'Loading Phoenix Combat System', { sceneId: scene.id });
      return (
        <CombatScenePhoenix 
          sceneTitle={scene.title}
          sceneDescription={scene.description}
        />
      );

    case 'crafting':
      return (
        <div className="scene-crafting">
          <div className="scene-header">
            <h2>{scene.title}</h2>
            <p className="scene-description">{scene.description}</p>
          </div>
          
          <div className="crafting-interface">
            <p>🛠️ Interface de crafting à implémenter</p>
            {/* TODO: Implémenter CraftingInterface */}
          </div>
          
          {sceneAnalysis.availableChoices.length > 0 && (
            <div className="scene-choices">
              {sceneAnalysis.availableChoices.map((choice) => (
                <button
                  key={choice.id}
                  className="choice-button"
                  onClick={() => onChoiceSelected(choice.id, choice.targetSceneId)}
                >
                  {choice.text}
                </button>
              ))}
            </div>
          )}
        </div>
      );

    case 'puzzle':
      return (
        <div className="scene-puzzle">
          <div className="scene-header">
            <h2>{scene.title}</h2>
            <p className="scene-description">{scene.description}</p>
          </div>
          
          <div className="puzzle-interface">
            <p>🧩 Interface de puzzle à implémenter</p>
            {/* TODO: Implémenter PuzzleInterface */}
          </div>
          
          {sceneAnalysis.availableChoices.length > 0 && (
            <div className="scene-choices">
              {sceneAnalysis.availableChoices.map((choice) => (
                <button
                  key={choice.id}
                  className="choice-button"
                  onClick={() => onChoiceSelected(choice.id, choice.targetSceneId)}
                >
                  {choice.text}
                </button>
              ))}
            </div>
          )}
        </div>
      );

    case 'dungeon':
      return (
        <div className="scene-dungeon">
          <div className="scene-header">
            <h2>{scene.title}</h2>
            <p className="scene-description">{scene.description}</p>
          </div>
          
          <div className="dungeon-interface">
            <p>🏰 Interface de donjon à implémenter</p>
            {/* TODO: Implémenter DungeonInterface */}
            
            <div className="dungeon-progress">
              <p>Progression du donjon : Salle 1/5</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '20%' }}></div>
              </div>
            </div>
          </div>
          
          {sceneAnalysis.availableChoices.length > 0 && (
            <div className="scene-choices">
              {sceneAnalysis.availableChoices.map((choice) => (
                <button
                  key={choice.id}
                  className="choice-button"
                  onClick={() => onChoiceSelected(choice.id, choice.targetSceneId)}
                >
                  {choice.text}
                </button>
              ))}
            </div>
          )}
        </div>
      );

    default:
      logger.ui(`Unknown scene type: ${scene.type}`, { sceneId: scene.id });
      return (
        <div className="scene-error">
          <h2>Erreur</h2>
          <p>Type de scène non reconnu : {scene.type}</p>
          <p>Scène : {scene.title}</p>
          
          {sceneAnalysis.availableChoices.length > 0 && (
            <div className="scene-choices">
              <h3>Choix disponibles :</h3>
              {sceneAnalysis.availableChoices.map((choice) => (
                <button
                  key={choice.id}
                  className="choice-button"
                  onClick={() => onChoiceSelected(choice.id, choice.targetSceneId)}
                >
                  {choice.text}
                </button>
              ))}
            </div>
          )}
        </div>
      );
  }
};