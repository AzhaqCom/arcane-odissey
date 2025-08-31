  🎯 Action à Réaliser

  Phase 1 - Action 1.1.1 : Implémenter withNewScene(sceneId: string): GameSession dans GameSession.ts

  📋 Plan d'Implémentation Détaillé

  1. Problème Identifié

  Fichier : src/domain/entities/GameSession.tsLigne : 183Code problématique :
  this._sceneHistory.push(this._currentSceneId);
  Violation : Règle #2 des ARCHITECTURE_GUIDELINES.md - "Les méthodes qui modifient l'état doivent retourner une nouvelle instance de l'objet"

  2. Solution Architecturale Proposée

  A) Ajouter la méthode immutable withNewScene()

  /**
   * Retourne une nouvelle GameSession avec une nouvelle scène
   * Respecte le principe d'immutabilité - Règle #2 ARCHITECTURE_GUIDELINES.md
   */
  public withNewScene(sceneId: string): GameSession {
    // Créer un nouvel historique sans mutation
    const newSceneHistory = [...this._sceneHistory, this._currentSceneId];

    // Créer une nouvelle instance avec les nouvelles valeurs
    return new GameSession({
      sessionId: this._sessionId,
      playerCharacterId: this._playerCharacterId,
      currentSceneId: sceneId, // ← Nouvelle scène
      currentPhase: this._currentPhase,
      sceneHistory: newSceneHistory, // ← Historique immutable
      flags: new Map(this._flags),
      companions: [...this._companions],
      gameTime: this._gameTime,
      difficulty: this._difficulty
    });
  }

  B) Remplacer l'usage de la mutation

  Localiser et remplacer dans le même fichier :
  // AVANT (mutation - violation Règle #2)
  this._sceneHistory.push(this._currentSceneId);

  // APRÈS (immutable - conforme Règle #2)
  return this.withNewScene(newSceneId);

  3. Conformité aux Guidelines

  ✅ Règle #2 - Immutabilité : Nouvelle instance créée, aucune mutation✅ Règle #1 - Pureté Domain : Reste dans la couche Domain✅ Pattern with...()     
  : Respect de la convention architecturale

  4. Critères de Validation

  - Aucune assignation this._sceneHistory.push() dans GameSession.ts
  - Méthode withNewScene() retourne une nouvelle instance
  - npx tsc --noEmit compile sans erreurs
  - L'objet GameSession original reste inchangé après appel

  ❓ Demande de Validation

  Confirmez-vous cette approche avant implémentation ?
  - La solution respecte-t-elle parfaitement les ARCHITECTURE_GUIDELINES.md ?
  - L'implémentation proposée vous convient-elle ?
  - Dois-je procéder à cette modification précise ?

  J'attends votre validation explicite avant d'apporter le moindre changement au code. 🎯