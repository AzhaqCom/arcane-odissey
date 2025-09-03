[21:27:27] GAME: Transitioning to scene: forest_ambush {from: 'forest_entrance', choiceId: 'take_main_path'}
Logger.ts:199 [21:27:27] SCENE: Scene transition requested: forest_ambush {from: 'forest_entrance', choiceId: 'take_main_path'}
Logger.ts:196 [21:27:27] REPO: Scene requested: forest_ambush {found: true}
Logger.ts:199 [21:27:27] GAME: Scene access check: forest_ambush {valid: true, failedConditions: 0, warnings: 0}
Logger.ts:196 [21:27:27] REPO: Scene requested: forest_entrance {found: true}
Logger.ts:199 [21:27:27] GAME: Applying scene effects: forest_entrance {effectsCount: 0}
Logger.ts:199 [21:27:27] GAME: Applying scene effects: forest_ambush {effectsCount: 0}
Logger.ts:199 [21:27:27] SCENE: Scene transition successful: forest_ambush {appliedEffects: 0, warnings: 0}
Logger.ts:199 [21:27:27] GAME: GameSession created: session_mf4dcv4i_c5rh31 {playerId: 'Elarion', difficulty: 'normal', startingScene: 'forest_ambush'}
Logger.ts:199 [21:27:27] GAME: GameSession created: session_mf4dcv4i_c5rh31 {playerId: 'Elarion', difficulty: 'normal', startingScene: 'forest_ambush'}
Logger.ts:199 [21:27:27] GAME: Scene transition successful {newScene: 'forest_ambush', effectsApplied: 0}
Logger.ts:199 [21:27:27] SCENE: Analyzing scene: forest_ambush {sessionId: 'session_mf4dcv4i_c5rh31', currentPhase: 'combat'}
Logger.ts:196 [21:27:27] REPO: Scene requested: forest_ambush {found: true}
Logger.ts:199 [21:27:27] GAME: Contextual spells calculated: forest_ambush {spells: Array(3)}
Logger.ts:199 [21:27:27] SCENE_RENDERER: Loading Phoenix Combat System {sceneId: 'forest_ambush'}
Logger.ts:196 [21:27:27] REPO: Scene requested: forest_ambush {found: true}
Logger.ts:199 [21:27:27] CHARACTER_REPO: Current character: Elarion {id: 'Elarion', level: 3, hp: '18/20'}
Logger.ts:199 [21:27:27] COMBAT_GAME_USECASE: Combat data gathered {sceneId: 'forest_ambush', playerName: 'Elarion', playerHP: '18/20', enemyTemplatesCount: 1, enemySpecsCount: 1, …}
Logger.ts:196 [21:27:27] COMBAT_ENGINE: Entity added {entityId: 'Elarion', entityName: 'Elarion', totalEntities: 1}
Logger.ts:196 [21:27:27] COMBAT_ENGINE: Entity added {entityId: 'goblin_1', entityName: 'Gobelin 1', totalEntities: 2}
Logger.ts:196 [21:27:27] COMBAT_ENGINE: Entity added {entityId: 'goblin_2', entityName: 'Gobelin 2', totalEntities: 3}
Logger.ts:199 [21:27:27] COMBAT_ENGINE: Initiative rolled {initiativeOrder: Array(3)}
Logger.ts:199 [21:27:27] SCENE_RENDERER: Loading Phoenix Combat System {sceneId: 'forest_ambush'}
Logger.ts:196 [21:27:29] COMBAT_GAME_USECASE: Processing AI turn {entityName: 'Gobelin 1', entityType: 'enemy', behavior: 'aggressive', hitPoints: '15/15'}
Logger.ts:196 [21:27:29] SIMPLE_AI: Calculating AI action {entityId: 'goblin_1', entityName: 'Gobelin 1', behavior: 'aggressive', hasAction: true, hitPoints: 15}
Logger.ts:199 [21:27:29] COMBAT_GAME_USECASE: AI action calculated {entityName: 'Gobelin 1', actionType: 'move', targetId: undefined, position: {…}}
Logger.ts:196 [21:27:29] COMBAT_ENGINE: Action applied {actionType: 'move', entityId: 'goblin_1', targetId: undefined, narrativesGenerated: 1}
Logger.ts:196 [21:27:29] REPO: Auto-saving session: undefined undefined
Logger.ts:205 [21:27:29] AUTO_SAVE: Auto-save failed {error: TypeError: Cannot read properties of undefined (reading 'toISOString')
    at GameSessionRepository…}
outputToConsole @ Logger.ts:205
log @ Logger.ts:173
error @ Logger.ts:65
autoSave @ GameSessionRepository.ts:195
saveCombatState @ CombatGameUseCase.ts:369
processAITurn @ CombatGameUseCase.ts:192
(anonymous) @ useCombatGame.ts:271
setTimeout
(anonymous) @ useCombatGame.ts:269
react_stack_bottom_frame @ react-dom_client.js?v=62be33da:17484
runWithFiberInDEV @ react-dom_client.js?v=62be33da:1483
commitHookEffectListMount @ react-dom_client.js?v=62be33da:8458
commitHookPassiveMountEffects @ react-dom_client.js?v=62be33da:8516
commitPassiveMountOnFiber @ react-dom_client.js?v=62be33da:9885
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=62be33da:9866
commitPassiveMountOnFiber @ react-dom_client.js?v=62be33da:9879
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=62be33da:9866
commitPassiveMountOnFiber @ react-dom_client.js?v=62be33da:9982
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=62be33da:9866
commitPassiveMountOnFiber @ react-dom_client.js?v=62be33da:9982
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=62be33da:9866
commitPassiveMountOnFiber @ react-dom_client.js?v=62be33da:9982
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=62be33da:9866
commitPassiveMountOnFiber @ react-dom_client.js?v=62be33da:9879
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=62be33da:9866
commitPassiveMountOnFiber @ react-dom_client.js?v=62be33da:9897
flushPassiveEffects @ react-dom_client.js?v=62be33da:11300
(anonymous) @ react-dom_client.js?v=62be33da:11058
performWorkUntilDeadline @ react-dom_client.js?v=62be33da:34
<CombatScenePhoenix>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=62be33da:248
SceneRenderer @ SceneRenderer.tsx:63
react_stack_bottom_frame @ react-dom_client.js?v=62be33da:17422
renderWithHooks @ react-dom_client.js?v=62be33da:4204
updateFunctionComponent @ react-dom_client.js?v=62be33da:6617
beginWork @ react-dom_client.js?v=62be33da:7652
runWithFiberInDEV @ react-dom_client.js?v=62be33da:1483
performUnitOfWork @ react-dom_client.js?v=62be33da:10866
workLoopSync @ react-dom_client.js?v=62be33da:10726
renderRootSync @ react-dom_client.js?v=62be33da:10709
performWorkOnRoot @ react-dom_client.js?v=62be33da:10328
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=62be33da:11621
performWorkUntilDeadline @ react-dom_client.js?v=62be33da:34
<SceneRenderer>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=62be33da:248
GameApp @ GameApp.tsx:112
react_stack_bottom_frame @ react-dom_client.js?v=62be33da:17422
renderWithHooks @ react-dom_client.js?v=62be33da:4204
updateFunctionComponent @ react-dom_client.js?v=62be33da:6617
beginWork @ react-dom_client.js?v=62be33da:7652
runWithFiberInDEV @ react-dom_client.js?v=62be33da:1483
performUnitOfWork @ react-dom_client.js?v=62be33da:10866
workLoopSync @ react-dom_client.js?v=62be33da:10726
renderRootSync @ react-dom_client.js?v=62be33da:10709
performWorkOnRoot @ react-dom_client.js?v=62be33da:10328
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=62be33da:11621
performWorkUntilDeadline @ react-dom_client.js?v=62be33da:34
<GameApp>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=62be33da:248
(anonymous) @ main.tsx:7Understand this error
Logger.ts:196 [21:27:29] COMBAT_GAME_USECASE: Combat state saved {round: 1, currentTurn: 1, phase: 'active'}
Logger.ts:196 [21:27:30] COMBAT_GAME_USECASE: Processing AI turn {entityName: 'Gobelin 2', entityType: 'enemy', behavior: 'aggressive', hitPoints: '15/15'}
Logger.ts:196 [21:27:30] SIMPLE_AI: Calculating AI action {entityId: 'goblin_2', entityName: 'Gobelin 2', behavior: 'aggressive', hasAction: true, hitPoints: 15}
Logger.ts:199 [21:27:30] COMBAT_GAME_USECASE: AI action calculated {entityName: 'Gobelin 2', actionType: 'move', targetId: undefined, position: {…}}
Logger.ts:196 [21:27:30] COMBAT_ENGINE: Action applied {actionType: 'move', entityId: 'goblin_2', targetId: undefined, narrativesGenerated: 1}
Logger.ts:196 [21:27:30] REPO: Auto-saving session: undefined undefined
Logger.ts:205 [21:27:30] AUTO_SAVE: Auto-save failed {error: TypeError: Cannot read properties of undefined (reading 'toISOString')
    at GameSessionRepository…}
outputToConsole @ Logger.ts:205
log @ Logger.ts:173
error @ Logger.ts:65
autoSave @ GameSessionRepository.ts:195
saveCombatState @ CombatGameUseCase.ts:369
processAITurn @ CombatGameUseCase.ts:192
(anonymous) @ useCombatGame.ts:271
setTimeout
(anonymous) @ useCombatGame.ts:269
react_stack_bottom_frame @ react-dom_client.js?v=62be33da:17484
runWithFiberInDEV @ react-dom_client.js?v=62be33da:1483
commitHookEffectListMount @ react-dom_client.js?v=62be33da:8458
commitHookPassiveMountEffects @ react-dom_client.js?v=62be33da:8516
commitPassiveMountOnFiber @ react-dom_client.js?v=62be33da:9885
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=62be33da:9866
commitPassiveMountOnFiber @ react-dom_client.js?v=62be33da:9879
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=62be33da:9866
commitPassiveMountOnFiber @ react-dom_client.js?v=62be33da:9982
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=62be33da:9866
commitPassiveMountOnFiber @ react-dom_client.js?v=62be33da:9982
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=62be33da:9866
commitPassiveMountOnFiber @ react-dom_client.js?v=62be33da:9982
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=62be33da:9866
commitPassiveMountOnFiber @ react-dom_client.js?v=62be33da:9879
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=62be33da:9866
commitPassiveMountOnFiber @ react-dom_client.js?v=62be33da:9897
flushPassiveEffects @ react-dom_client.js?v=62be33da:11300
(anonymous) @ react-dom_client.js?v=62be33da:11058
performWorkUntilDeadline @ react-dom_client.js?v=62be33da:34
<CombatScenePhoenix>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=62be33da:248
SceneRenderer @ SceneRenderer.tsx:63
react_stack_bottom_frame @ react-dom_client.js?v=62be33da:17422
renderWithHooks @ react-dom_client.js?v=62be33da:4204
updateFunctionComponent @ react-dom_client.js?v=62be33da:6617
beginWork @ react-dom_client.js?v=62be33da:7652
runWithFiberInDEV @ react-dom_client.js?v=62be33da:1483
performUnitOfWork @ react-dom_client.js?v=62be33da:10866
workLoopSync @ react-dom_client.js?v=62be33da:10726
renderRootSync @ react-dom_client.js?v=62be33da:10709
performWorkOnRoot @ react-dom_client.js?v=62be33da:10328
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=62be33da:11621
performWorkUntilDeadline @ react-dom_client.js?v=62be33da:34
<SceneRenderer>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=62be33da:248
GameApp @ GameApp.tsx:112
react_stack_bottom_frame @ react-dom_client.js?v=62be33da:17422
renderWithHooks @ react-dom_client.js?v=62be33da:4204
updateFunctionComponent @ react-dom_client.js?v=62be33da:6617
beginWork @ react-dom_client.js?v=62be33da:7652
runWithFiberInDEV @ react-dom_client.js?v=62be33da:1483
performUnitOfWork @ react-dom_client.js?v=62be33da:10866
workLoopSync @ react-dom_client.js?v=62be33da:10726
renderRootSync @ react-dom_client.js?v=62be33da:10709
performWorkOnRoot @ react-dom_client.js?v=62be33da:10328
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=62be33da:11621
performWorkUntilDeadline @ react-dom_client.js?v=62be33da:34
<GameApp>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=62be33da:248
(anonymous) @ main.tsx:7Understand this error
Logger.ts:196 [21:27:30] COMBAT_GAME_USECASE: Combat state saved {round: 1, currentTurn: 2, phase: 'active'}