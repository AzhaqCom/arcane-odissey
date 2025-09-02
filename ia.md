# 🎯 PLAN D'ACTION COMPLET - COMBAT ENTIÈREMENT JOUABLE

## CONTEXTE

Nous avons résolu avec succès le problème de désynchronisation en implémentant le "Plan E" (Combat Session Pattern). Notre base est maintenant saine et robuste. L'objectif est de rendre le combat entièrement jouable en s'appuyant sur le code existant et en respectant la Constitution Architecturale.

---

# 📊 ANALYSE PRÉLIMINAIRE - ÉTAT ACTUEL DU SYSTÈME

## 🏗️ **ARCHITECTURE ACTUELLE - POINTS FORTS**

### **1. Domain Services Solides et Réutilisables**

- **`DiceRollingService`** : Service d'injection pure pour jets de dés D&D ✅
- **`DamageCalculationService`** : Calculs de dégâts avec injection de dépendances ✅  
- **`AbilityCalculationService`** : Modificateurs de caractéristiques D&D 5E ✅
- **`InitiativeService`** : Gestion ordre de tour ✅
- **`TacticalCalculationService`** : Distance, ligne de vue, couverture ✅

### **2. Entités Domain Riches**

- **`Combat`** : Aggregate Root avec 1200+ lignes de logique métier pure
  - Attaques avec jets to-hit et dégâts ✅
  - Sorts avec emplacements et concentration ✅  
  - Mouvement tactique avec attaques d'opportunité ✅
  - API immutable via `with...()` methods ✅

- **`CombatSession`** : Pattern Aggregate pour état complet ✅
  - Métadonnées de session (durée, actions, tours) ✅
  - Contrôle d'état (active/paused/ended) ✅
  - Exécution IA automatique ✅

- **`TacticalGrid`** : Grille tactique complète
  - Distance Chebyshev (règles D&D) ✅
  - Terrain difficile, couverture, ligne de vue ✅
  - Occupation immutable des cases ✅

### **3. Intelligence Artificielle Avancée**

- **`ECSAIDecisionMaker`** : IA comportementale sophistiquée
  - 11 patterns comportementaux (aggressive, defensive, tactical, etc.) ✅
  - Analyse contextuelle complète (HP, distance, menaces) ✅
  - Scoring intelligent selon comportement ✅
  - Sélection d'armes par type et portée ✅

- **`BehaviorSystem`** : Système de comportements D&D
  - Seuils dynamiques (retreat, healing, defensive) ✅
  - Évaluation multi-critères ✅
  - Factory pour types d'ennemis ✅

## ⚠️ **VIOLATIONS ARCHITECTURALES À CORRIGER**

### **Méthodes Deprecated Non Nettoyées**

1. **`CombatUseCase.executeAITurn()`** (ligne 217)
   - **Violation** : Logique métier complexe dans Application Layer
   - **Problème** : Ne respecte pas le pattern "3 lignes"
   - **Action** : Supprimer complètement (remplacée par `executeAutomaticAITurnSession()`)

2. **`useCombat.executeAITurn()`** (ligne 248)
   - **Violation** : Méthode marquée deprecated mais exposée publiquement
   - **Action** : Supprimer de l'interface publique

### **Dépendances Circulaires Critiques**

1. **`Combat.ts`** - Services non injectés
   ```typescript
   // VIOLATION - ligne 19-24
   private _queryService = new CombatQueryService();
   private _aiService = new CombatAIService(); 
   // ❌ Instanciation directe = couplage fort
   ```
   **Action** : Injecter via constructeur selon Règle #5

2. **API Mutables vs Immutables**
   ```typescript
   // INCOHÉRENT - Combat.ts
   actionsRemaining: ActionsRemaining;  // ❌ Mutable
   readonly position: Position;         // ✅ Immutable
   ```

## 🔧 **MÉCANISMES EXISTANTS FONCTIONNELS**

### **Système d'Attaque Complet** (`Combat.performWeaponAttack()` - ligne 746)
1. Validation arme et cible ✅
2. Jets d'attaque avec modificateurs ✅
3. Calcul AC vs jet total ✅
4. Application dégâts via API immutable ✅
5. Messages narratifs générés ✅

### **Système de Mouvement** (`Combat.executeMovement()` - ligne 979)
1. Validation mouvement disponible ✅
2. Vérification attaques d'opportunité ✅
3. Mise à jour position immutable ✅
4. Gestion terrain difficile ✅

### **Système de Sorts** (`Combat.castSpell()` - ligne 846)
1. Validation emplacements ✅
2. Calcul dégâts/soins selon niveau ✅
3. Gestion concentration ✅
4. Effets de zone possibles ✅

---

# 🎯 PHASE 1 : RENDRE LE TOUR DE L'IA FONCTIONNEL

## **OBJECTIF**

Perfectionner le système IA pour qu'il fonctionne de manière autonome et intelligente avec des mécanismes d'attaque D&D 5E complets.

## **TÂCHES PRIORITAIRES**

### **1.1 - NETTOYAGE ARCHITECTURAL (2h)**

#### **Supprimer Méthodes Deprecated**
```typescript
// ❌ À SUPPRIMER - CombatUseCase.ts ligne 217-226
@deprecated executeAITurn(): Promise<...> {
  // Logique complexe violant Règle #2
}

// ❌ À SUPPRIMER - useCombat.ts ligne 248-271  
@deprecated executeAITurn = useCallback(async () => {
  // Interface publique deprecated
}, [combat]);
```

#### **Corriger Injection de Dépendances**
```typescript
// ✅ NOUVEAU - Combat.ts constructor modification
export class Combat {
  constructor(
    // ... params existants
    private readonly queryService: CombatQueryService,      // ✅ Injecté
    private readonly aiService: CombatAIService,           // ✅ Injecté
    private readonly stateService: CombatStateService      // ✅ Injecté
  ) {
    // Supprimer instanciations directes
    // ❌ private _queryService = new CombatQueryService();
  }
}
```

### **1.2 - FINALISER MÉCANISMES D'ATTAQUE IA (3h)**

#### **Corriger Intégration Armes Réelles**
```typescript
// PROBLÈME IDENTIFIÉ - Combat.ts ligne 300-312
// Validation arme simplifiée = fausse sécurité
weaponExists = attacker.inventory?.weapons?.includes(weaponId);

// ✅ SOLUTION - Intégrer WeaponRepository
validateWeaponAttack(attacker: CombatEntity, weaponId: string, target: CombatEntity): ValidationResult {
  const weapon = this.weaponRepository.getById(weaponId);
  if (!weapon) return { valid: false, reasons: ['Weapon not found'] };
  
  const hasWeapon = attacker.inventory?.weapons?.includes(weaponId);
  if (!hasWeapon) return { valid: false, reasons: ['Attacker does not have weapon'] };
  
  const inRange = this.tacticalCalculationService.isInWeaponRange(
    attacker.position, target.position, weapon.range
  );
  if (!inRange) return { valid: false, reasons: ['Target out of range'] };
  
  return { valid: true };
}
```

#### **Améliorer Calculs de Dégâts**
```typescript
// ✅ NOUVEAU - CombatSession.ts
executeAIAttackAction(targetId: string): CombatSession {
  const result = this.combat.performWeaponAttack(
    this.getCurrentEntity().id,
    this.selectBestWeapon(), // ✅ Sélection intelligente
    targetId
  );
  
  return new CombatSession(
    this.id,
    result.newCombat,
    this.determineSessionState(result.newCombat),
    this.metadata.withActionExecuted(result.damage || 0)
  );
}

private selectBestWeapon(): string {
  const entity = this.getCurrentEntity();
  const weapons = entity.inventory?.weapons || [];
  
  // Logique de sélection basée sur distance et type d'ennemi
  return this.aiDecisionMaker.selectOptimalWeapon(entity, this.combat);
}
```

### **1.3 - OPTIMISER INTELLIGENCE ARTIFICIELLE (2h)**

#### **Compléter Sélection d'Armes Intelligente**
```typescript
// ✅ AMÉLIORATION - ECSAIDecisionMaker.ts
selectOptimalWeapon(entity: ECSEntity, combat: Combat): string {
  const weapons = entity.weapons?.weapons || [];
  const enemies = this.getEnemies(combat, entity);
  const nearestEnemy = this.findNearestEnemy(entity, enemies);
  
  if (!nearestEnemy) return weapons[0]; // Fallback
  
  const distance = this.calculateDistance(entity.position, nearestEnemy.position);
  
  // Prioriser selon distance et comportement
  if (distance <= 1 && this.hasMeleeWeapon(weapons)) {
    return this.getBestMeleeWeapon(weapons);
  } else if (distance > 1 && this.hasRangedWeapon(weapons)) {
    return this.getBestRangedWeapon(weapons);
  }
  
  return weapons[0]; // Fallback sur première arme disponible
}
```

#### **Améliorer Positionnement Tactique**
```typescript
// ✅ AMÉLIORATION - Combat.ts ligne 535-587
private calculateBestAIPosition(entityId: string): Position | null {
  const entity = this.entities.get(entityId);
  const enemies = this.getEnemiesOf(entity);
  const allies = this.getAlliesOf(entity);
  
  const availablePositions = this.getReachableCells(entityId);
  let bestScore = -Infinity;
  let bestPosition: Position | null = null;

  for (const position of availablePositions) {
    let score = 0;
    
    // Facteurs tactiques multiples
    score += this.calculateCoverScore(position, enemies);        // Couverture
    score += this.calculateFlankingScore(position, enemies);     // Flanquement  
    score += this.calculateGroupingScore(position, allies);      // Formation
    score += this.calculateRangeScore(position, enemies, entity);// Distance optimale
    score += this.calculateSafetyScore(position, enemies);      // Sécurité
    
    if (score > bestScore) {
      bestScore = score;
      bestPosition = position;
    }
  }
  
  return bestPosition;
}
```

## **NOUVELLES MÉTHODES DOMAIN À CRÉER**

### **CombatSession.ts - Extensions**
```typescript
// ✅ Actions IA spécialisées
executeAIMovementAction(targetPosition: Position): CombatSession
executeAIAttackAction(targetId: string): CombatSession  
executeAISpellAction(spellId: string, targetId?: string): CombatSession
executeAIDefensiveAction(): CombatSession // Dodge/Dash/Disengage

// ✅ Séquencement intelligent
determineOptimalActionSequence(): AIActionSequence
canExecuteAction(actionType: AIActionType): boolean
getRemainingActionEconomy(): ActionEconomy
```

### **Combat.ts - Validations Renforcées**
```typescript
// ✅ Validations métier renforcées  
validateWeaponAttack(attackerId: string, weaponId: string, targetId: string): ValidationResult
validateSpellCasting(casterId: string, spellId: string, level: SpellLevel): ValidationResult
validateMovement(entityId: string, targetPosition: Position): ValidationResult

// ✅ Calculs tactiques
calculateOptimalAttackPosition(attackerId: string, targetId: string): Position[]
calculateSpellEffectArea(spellId: string, centerPosition: Position): Position[]
calculateOpportunityAttacks(entityId: string, path: Position[]): OpportunityAttack[]
```

## **MÉTRIQUES DE RÉUSSITE PHASE 1**

- ✅ IA attaque automatiquement avec vraies armes (pas de simulation)
- ✅ Jets d'attaque D&D 5E complets (to-hit + damage + AC)
- ✅ Mouvement tactique intelligent (couverture + flanquement)
- ✅ Séquencement actions optimal (mouvement → attaque ou attaque → mouvement)
- ✅ Messages de combat narratifs précis
- ✅ Aucune méthode deprecated dans la codebase

---

# 🎮 PHASE 2 : ACTIVER LES ACTIONS DU JOUEUR

## **OBJECTIF**

Permettre au joueur d'effectuer les mêmes actions de base que l'IA avec une interface tactique intuitive.

## **TÂCHES PRIORITAIRES**

### **2.1 - EXTENSION COMBATUSECACE (2h)**

#### **Nouvelles Méthodes Application Layer**
```typescript
// ✅ NOUVEAU - CombatUseCase.ts
/**
 * Action joueur : Mouvement tactique
 * Respecte Règle #2 : Pattern "3 lignes"
 */
async performPlayerMovement(entityId: string, targetPosition: Position): Promise<{
  success: boolean; session?: CombatSession; error?: string;
}> {
  const session = await this.combatRepo.getActiveSession();           // 1. Récupération
  const newSession = session.executePlayerMovement(entityId, targetPosition); // 2. Domain  
  await this.combatRepo.saveSession(newSession);                      // 3. Sauvegarde
  return { success: true, session: newSession };
}

/**
 * Action joueur : Attaque avec arme
 * Respecte Règle #2 : Pattern "3 lignes"  
 */
async performPlayerAttack(attackerId: string, weaponId: string, targetId: string): Promise<{
  success: boolean; session?: CombatSession; attackResult?: AttackResult; error?: string;
}> {
  const session = await this.combatRepo.getActiveSession();           // 1. Récupération
  const result = session.executePlayerAttack(attackerId, weaponId, targetId); // 2. Domain
  await this.combatRepo.saveSession(result.session);                 // 3. Sauvegarde
  return { success: true, session: result.session, attackResult: result.attackResult };
}

/**
 * Action joueur : Lancement de sort
 * Respecte Règle #2 : Pattern "3 lignes"
 */
async performPlayerSpell(casterId: string, spellId: string, level: SpellLevel, targetId?: string): Promise<{
  success: boolean; session?: CombatSession; spellResult?: SpellResult; error?: string;  
}> {
  const session = await this.combatRepo.getActiveSession();           // 1. Récupération
  const result = session.executePlayerSpell(casterId, spellId, level, targetId); // 2. Domain
  await this.combatRepo.saveSession(result.session);                 // 3. Sauvegarde
  return { success: true, session: result.session, spellResult: result.spellResult };
}

/**
 * Terminer le tour du joueur
 */
async endPlayerTurn(): Promise<{ success: boolean; session?: CombatSession }> {
  const session = await this.combatRepo.getActiveSession();           // 1. Récupération  
  const newSession = session.advanceToNextTurn();                     // 2. Domain
  await this.combatRepo.saveSession(newSession);                      // 3. Sauvegarde
  return { success: true, session: newSession };
}
```

### **2.2 - EXTENSION USECOMBAT HOOK (1h)**

#### **Nouvelles Fonctions Hook React**
```typescript
// ✅ NOUVEAU - useCombat.ts  
/**
 * Actions joueur exposées au Presentation Layer
 * Respecte Règle #3 : Présentation via Hook uniquement
 */

// Mouvement tactique
const performPlayerMovement = useCallback(async (entityId: string, position: Position) => {
  const result = await combatUseCase.performPlayerMovement(entityId, position);
  if (result.session) setCombat(result.session.combat);
  addLog(result.success ? 'success' : 'error', `Mouvement ${result.success ? 'réussi' : 'échoué'}`);
  return result;
}, [combatUseCase]);

// Attaque avec arme  
const performPlayerAttack = useCallback(async (attackerId: string, weaponId: string, targetId: string) => {
  const result = await combatUseCase.performPlayerAttack(attackerId, weaponId, targetId);
  if (result.session) setCombat(result.session.combat);
  
  const damage = result.attackResult?.damage ? ` (${result.attackResult.damage} dégâts)` : '';
  addLog(result.success ? 'success' : 'error', `Attaque${damage}`);
  return result;
}, [combatUseCase]);

// Lancement de sort
const performPlayerSpell = useCallback(async (casterId: string, spellId: string, level: SpellLevel, targetId?: string) => {
  const result = await combatUseCase.performPlayerSpell(casterId, spellId, level, targetId);
  if (result.session) setCombat(result.session.combat);
  
  const effect = result.spellResult?.damage ? ` (${result.spellResult.damage} dégâts)` : 
                 result.spellResult?.healing ? ` (+${result.spellResult.healing} HP)` : '';
  addLog(result.success ? 'success' : 'error', `Sort lancé${effect}`);
  return result;
}, [combatUseCase]);

// Fin de tour
const endPlayerTurn = useCallback(async () => {
  const result = await combatUseCase.endPlayerTurn();
  if (result.session) setCombat(result.session.combat);
  addLog('info', 'Tour terminé');
  return result;
}, [combatUseCase]);

// Interface publique étendue
return {
  // ... état existant
  
  // ✅ Nouvelles actions joueur
  performPlayerMovement,
  performPlayerAttack, 
  performPlayerSpell,
  endPlayerTurn,
  
  // ✅ Helpers UI  
  canMoveToPosition: (entityId: string, position: Position) => 
    combat?.canExecuteMovement(entityId, position) ?? false,
  canAttackTarget: (attackerId: string, targetId: string) =>
    combat?.canAttackEntity(attackerId, targetId) ?? false,
  getAvailableSpells: (casterId: string) =>
    combat?.getAvailableSpells(casterId) ?? []
};
```

### **2.3 - EXTENSIONS COMBATSESSION (3h)**

#### **Actions Joueur dans Domain**
```typescript  
// ✅ NOUVEAU - CombatSession.ts
/**
 * Actions joueur - Domain Logic Pure
 * Respecte Règle #1 : Domain-Centric
 */

executePlayerMovement(entityId: string, targetPosition: Position): CombatSession {
  if (this.sessionState !== 'active') {
    throw new Error('Cannot execute movement on inactive session');
  }
  
  const movementResult = this.combat.executeMovement(entityId, targetPosition);
  
  return new CombatSession(
    this.id,
    movementResult.newCombat,
    this.sessionState,
    this.metadata.withActionExecuted()
  );
}

executePlayerAttack(attackerId: string, weaponId: string, targetId: string): {
  session: CombatSession; attackResult: AttackResult;
} {
  if (this.sessionState !== 'active') {
    throw new Error('Cannot execute attack on inactive session');
  }
  
  const attackResult = this.combat.performWeaponAttack(attackerId, weaponId, targetId);
  
  return {
    session: new CombatSession(
      this.id,
      attackResult.newCombat,  
      this.determineSessionState(attackResult.newCombat),
      this.metadata.withActionExecuted(attackResult.damage || 0)
    ),
    attackResult
  };
}

executePlayerSpell(casterId: string, spellId: string, level: SpellLevel, targetId?: string): {
  session: CombatSession; spellResult: SpellResult;
} {
  if (this.sessionState !== 'active') {
    throw new Error('Cannot cast spell on inactive session');
  }
  
  const spellResult = this.combat.castSpell(casterId, spellId, level, targetId);
  
  return {
    session: new CombatSession(
      this.id,
      spellResult.newCombat,
      this.determineSessionState(spellResult.newCombat), 
      this.metadata.withActionExecuted()
    ),
    spellResult
  };
}

// ✅ Helpers métier pour UI
canExecutePlayerAction(entityId: string, actionType: PlayerActionType): boolean {
  const entity = this.combat.entities.get(entityId);
  if (!entity || entity.type !== 'player') return false;
  
  switch (actionType) {
    case 'movement':
      return entity.actionsRemaining.movement > 0;
    case 'attack':
      return entity.actionsRemaining.action && this.hasUsableWeapons(entity);
    case 'spell':
      return entity.actionsRemaining.action && this.hasAvailableSpells(entity);
    default:
      return false;
  }
}
```

### **2.4 - INTERFACE UTILISATEUR TACTIQUE (4h)**

#### **Extensions CombatPanel.tsx**
```typescript
// ✅ AMÉLIORATIONS - Interface tactique complète

// Mode sélection d'action
const [selectedAction, setSelectedAction] = useState<'move' | 'attack' | 'spell' | null>(null);
const [selectedEntity, setSelectedEntity] = useState<string | null>(null);

// Rendu actions joueur
const renderPlayerActions = () => {
  if (!isPlayerTurn || !currentEntity) return null;
  
  return (
    <div className="player-actions">
      <h4>Actions Disponibles</h4>
      
      {/* Mouvement */}
      <button 
        disabled={!canMoveToPosition(currentEntity.id, currentEntity.position)}
        onClick={() => setSelectedAction('move')}
        className={selectedAction === 'move' ? 'selected' : ''}
      >
        🚶 Mouvement ({currentEntity.actionsRemaining.movement}m restant)
      </button>
      
      {/* Attaque */}
      <button 
        disabled={!currentEntity.actionsRemaining.action}
        onClick={() => setSelectedAction('attack')}  
        className={selectedAction === 'attack' ? 'selected' : ''}
      >
        ⚔️ Attaque
      </button>
      
      {/* Sorts */}
      {availableSpells.length > 0 && (
        <button
          disabled={!currentEntity.actionsRemaining.action}
          onClick={() => setSelectedAction('spell')}
          className={selectedAction === 'spell' ? 'selected' : ''}
        >
          ✨ Sorts ({availableSpells.length})
        </button>
      )}
      
      {/* Fin de tour */}
      <button onClick={onEndPlayerTurn} className="end-turn">
        ⏭️ Terminer le Tour
      </button>
    </div>
  );
};
```

#### **Extensions CombatGrid.tsx**
```typescript
// ✅ AMÉLIORATIONS - Grille tactique interactive

// Gestion clics grille
const handleGridClick = (position: Position) => {
  if (!selectedAction || !selectedEntity) return;
  
  switch (selectedAction) {
    case 'move':
      if (canMoveToPosition(selectedEntity, position)) {
        onPerformPlayerMovement(selectedEntity, position);
        setSelectedAction(null);
      }
      break;
      
    case 'attack':
      const targetEntity = getEntityAtPosition(position);
      if (targetEntity && canAttackTarget(selectedEntity, targetEntity.id)) {
        // Ouvrir sélecteur d'arme
        openWeaponSelector(selectedEntity, targetEntity.id);
      }
      break;
      
    case 'spell':
      // Ouvrir sélecteur de sort avec position cible
      openSpellSelector(selectedEntity, position);
      break;
  }
};

// Highlighting positions valides
const getPositionClasses = (position: Position) => {
  let classes = 'grid-cell';
  
  if (selectedAction === 'move' && canMoveToPosition(selectedEntity, position)) {
    classes += ' valid-move';
  }
  
  if (selectedAction === 'attack') {
    const target = getEntityAtPosition(position);
    if (target && canAttackTarget(selectedEntity, target.id)) {
      classes += ' valid-target';
    }
  }
  
  return classes;
};
```

## **FLUX D'INTERACTION COMPLET**

### **Séquence Type : "Joueur Attaque Ennemi"**

```
1. CombatPanel.tsx
   └─ Joueur clique "⚔️ Attaque" 
   └─ setSelectedAction('attack')

2. CombatGrid.tsx  
   └─ Joueur clique sur ennemi
   └─ handleGridClick(enemyPosition)
   └─ openWeaponSelector(playerId, enemyId)

3. WeaponSelector.tsx (nouveau)
   └─ Joueur sélectionne arme
   └─ onPerformPlayerAttack(playerId, weaponId, enemyId)

4. useCombat.ts
   └─ performPlayerAttack(playerId, weaponId, enemyId)
   └─ await combatUseCase.performPlayerAttack(...)

5. CombatUseCase.ts  
   └─ session = await combatRepo.getActiveSession()           // 1. Récup
   └─ result = session.executePlayerAttack(...)               // 2. Domain
   └─ await combatRepo.saveSession(result.session)           // 3. Sauvegarde

6. CombatSession.ts
   └─ attackResult = this.combat.performWeaponAttack(...)     // Domain Logic
   └─ return new CombatSession(...)                           // Immutable

7. Combat.ts
   └─ validateWeaponAttack(...)                               // Validation  
   └─ rollToHit(...)                                          // Jet d'attaque
   └─ calculateDamage(...)                                    // Dégâts
   └─ this.withDamageApplied(...)                            // État immutable
```

## **MÉTRIQUES DE RÉUSSITE PHASE 2**

- ✅ Joueur peut déplacer ses unités sur grille tactique
- ✅ Joueur peut attaquer ennemis avec sélection d'arme
- ✅ Joueur peut lancer sorts avec sélection de cible  
- ✅ Interface intuitive avec feedback visuel (positions valides)
- ✅ Messages de combat détaillés pour actions joueur
- ✅ Fin de tour automatique avec transition vers IA

---

# 📋 PLAN D'EXÉCUTION CHRONOLOGIQUE

## **JOUR 1 (8h)**

**Matin (4h) - Nettoyage Architectural**
- 1h : Supprimer méthodes deprecated
- 2h : Corriger injections de dépendances Combat.ts
- 1h : Tests validation corrections

**Après-midi (4h) - IA Perfectionnement**  
- 2h : Finaliser intégration armes réelles
- 2h : Optimiser calculs tactiques IA

## **JOUR 2 (8h)**

**Matin (4h) - Actions Joueur Backend**
- 2h : Extensions CombatUseCase (performPlayerMovement, performPlayerAttack, etc.)
- 2h : Extensions CombatSession (executePlayerMovement, executePlayerAttack, etc.)

**Après-midi (4h) - Actions Joueur Frontend**
- 2h : Extensions useCombat hook
- 2h : Tests intégration complète

## **JOUR 3 (6h)**

**Matin (3h) - Interface Utilisateur**
- 2h : Extensions CombatPanel (actions joueur)
- 1h : Extensions CombatGrid (interactions tactiques)

**Après-midi (3h) - Polish et Tests**
- 1h : Composants sélecteurs (armes/sorts)  
- 1h : Messages et feedback utilisateur
- 1h : Tests utilisateur complets

---

# 🎯 MÉTRIQUES GLOBALES DE RÉUSSITE

## **Fonctionnelles**

- ✅ IA joue automatiquement avec tactiques D&D 5E
- ✅ Joueur contrôle entièrement ses unités  
- ✅ Combat respecte règles D&D (jets, AC, dégâts)
- ✅ Grille tactique interactive et intuitive
- ✅ Messages narratifs immersifs

## **Techniques**

- ✅ Architecture respecte Constitution 100%
- ✅ Aucune méthode deprecated dans codebase
- ✅ Injection dépendances complète
- ✅ API Domain immutable partout
- ✅ Tests validation réussissent

## **Utilisateur**

- ✅ Interface intuitive sans apprentissage
- ✅ Feedback visuel clair (positions, cibles)
- ✅ Pas de bugs ni comportements inattendus
- ✅ Performance fluide même avec +10 entités
- ✅ Combat amusant et engageant

---

**Ce plan d'action transformera le système de combat en une expérience de jeu complète, tactique et respectueuse des règles D&D 5E, tout en maintenant une architecture exemplaire selon la Constitution établie.**