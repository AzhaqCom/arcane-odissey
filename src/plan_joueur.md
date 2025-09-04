# PLAN COMPLET - CŒUR DU GAMEPLAY JOUEUR

## CONTEXTE ET OBJECTIFS

### **PROBLÉMATIQUE IDENTIFIÉE**
- ❌ L'UI actuelle (CombatPanel) est "dégueulasse" et ne représente pas les vraies actions D&D
- ❌ Le joueur attaque avec des "armes génériques" au lieu de ses vraies armes équipées
- ❌ Pas de choix d'armes pour le joueur - manque le cœur du gameplay D&D
- ✅ Le mouvement fonctionne déjà correctement

### **OBJECTIF CIBLE** 
Interface authentique D&D 5E basée sur `action_joueur.png` :
- **Action ⭕ Mouvement ⭕** (états mutuellement exclusifs)
- **Mouvement** : Bouton "Se déplacer" simple
- **Attaques** : Liste des vraies armes avec stats ("Dague - Dégâts: 1d4")
- **Sorts** : À implémenter en Phase 2

### **WORKFLOW JOUEUR SOUHAITÉ**
1. Joueur clique "Dague" → Mode attaque avec dague activé
2. Grille highlight ennemis à portée de dague (1-2 cases)
3. Joueur clique ennemi → Attaque avec dague exécutée
4. Feedback : "Elarion attaque Gobelin avec Dague - 3 dégâts !"

---

## ARCHITECTURE TECHNIQUE

### **DONNÉES UI NÉCESSAIRES**
```typescript
interface PlayerWeaponChoice {
  weaponId: string;        // 'dagger'  
  weaponName: string;      // 'Dague'
  damageDisplay: string;   // '1d4'
  range: number;           // 1 (cases)
  isAvailable: boolean;    // true si peut être utilisée
}
```

### **RESPECT ARCHITECTURE_GUIDELINES.md**
- ✅ **Règle #1** : Logique métier PlayerWeaponService dans Domain  
- ✅ **Règle #2** : UseCases en 3 lignes (appel/save/return)
- ✅ **Règle #3** : UI stupide, hook intelligent 
- ✅ **Règle #4** : Immutabilité préservée
- ✅ **Règle #5** : Injection dependencies

---

## PHASE 1 - BACKEND (Fondations Domain/Application)

### **ÉTAPE 1.1 - Character.toCombatEntity() + Équipement**
**Fichier** : `src/domain/entities/Character.ts`
**Problème** : Character.toCombatEntity() ne inclut PAS l'équipement du joueur
**Solution** :
```typescript
toCombatEntity(): CombatEntity {
  return {
    // ... propriétés existantes ...
    equipment: {
      weapons: this.getEquippedWeapons(), // ['dagger', 'shortbow']
      armor: this.getEquippedArmor()
    }
  };
}

private getEquippedWeapons(): string[] {
  const weapons: string[] = [];
  if (this.inventory?.equipped?.mainHand) weapons.push(this.inventory.equipped.mainHand);
  if (this.inventory?.equipped?.rangedWeapon) weapons.push(this.inventory.equipped.rangedWeapon);
  return weapons;
}

private getEquippedArmor(): string[] {
  const armor: string[] = [];
  if (this.inventory?.equipped?.armor) armor.push(this.inventory.equipped.armor);
  return armor;
}
```

### **ÉTAPE 1.2 - PlayerWeaponService (Domain)**
**Fichier** : `src/domain/services/PlayerWeaponService.ts` (NOUVEAU)
**Rôle** : Service pur pour logique d'armes joueur
```typescript
export class PlayerWeaponService {
  constructor(private weaponRepository: IWeaponRepository) {}
  
  // RÈGLE #1 : Logique métier dans Domain
  getAvailableWeaponsForPlayer(entity: CombatEntity): PlayerWeaponChoice[] {
    if (!entity.equipment?.weapons) return [];
    
    return entity.equipment.weapons.map(weaponId => {
      const weapon = this.weaponRepository.getWeapon(weaponId);
      if (!weapon) return null;
      
      return {
        weaponId,
        weaponName: weapon.name,
        damageDisplay: weapon.getDamageDisplay(), // '1d4', '1d6+1'  
        range: weapon.getAttackRange(),
        isAvailable: true // TODO: Vérifier munitions, sorts, etc.
      };
    }).filter(Boolean);
  }
  
  // Calculer targets valides pour une arme spécifique
  getValidTargetsForWeapon(
    attacker: CombatEntity, 
    weaponId: string, 
    allEntities: CombatEntity[]
  ): CombatEntity[] {
    const weapon = this.weaponRepository.getWeapon(weaponId);
    if (!weapon) return [];
    
    const range = weapon.getAttackRange();
    
    return allEntities.filter(entity => {
      if (entity.id === attacker.id || entity.isDead) return false;
      if (entity.type === attacker.type) return false; // Pas d'attaque entre alliés
      
      const distance = calculateDistance(attacker.position, entity.position);
      return distance <= range;
    });
  }
}
```

### **ÉTAPE 1.3 - CombatGameUseCase (Application)**
**Fichier** : `src/application/usecases/CombatGameUseCase.ts`
**Action** : Ajouter nouvelles méthodes orchestration
```typescript
export class CombatGameUseCase {
  
  // Récupérer les armes du joueur pour l'UI
  getPlayerWeaponChoices(combat: CombatEngine): PlayerWeaponChoice[] {
    const currentEntity = combat.getCurrentEntity();
    if (!currentEntity || currentEntity.type !== 'player') return [];
    
    // LIGNE 1: Appel au Domain
    const choices = this.playerWeaponService.getAvailableWeaponsForPlayer(currentEntity);
    
    // LIGNE 2: Pas de sauvegarde (lecture seule)
    // LIGNE 3: Retour
    return choices;
  }
  
  // Récupérer les cibles valides pour une arme
  getValidTargetsForPlayerWeapon(combat: CombatEngine, weaponId: string): CombatEntity[] {
    const currentEntity = combat.getCurrentEntity();
    if (!currentEntity || currentEntity.type !== 'player') return [];
    
    // LIGNE 1: Appel au Domain  
    const targets = this.playerWeaponService.getValidTargetsForWeapon(
      currentEntity, weaponId, combat.entities
    );
    
    // LIGNE 2: Pas de sauvegarde
    // LIGNE 3: Retour
    return targets;
  }
  
  // Exécuter attaque avec arme choisie
  async executePlayerWeaponAttack(
    combat: CombatEngine, 
    weaponId: string, 
    targetId: string
  ): Promise<CombatEngine> {
    // LIGNE 1: Créer action spécifique à l'arme
    const action: CombatAction = {
      type: 'attack',
      entityId: combat.getCurrentEntity()!.id,
      targetId,
      weaponId // NOUVEAU: Spécifier l'arme
    };
    
    // LIGNE 2: Traitement et sauvegarde
    const updatedCombat = combat.withAppliedWeaponAttack(action, weaponId);
    await this.saveCombatState(updatedCombat);
    
    // LIGNE 3: Retour avec avancement tour
    return updatedCombat.withAdvancedTurn();
  }
}
```

### **ÉTAPE 1.4 - CombatEngine (Domain)**
**Fichier** : `src/domain/entities/CombatEngine.ts`
**Action** : Nouvelle méthode pour attaques avec arme forcée
```typescript
// Résolution attaque avec arme spécifiquement choisie par le joueur
withAppliedWeaponAttack(action: CombatAction, weaponId: string): CombatEngine {
  // Valider l'action
  const currentEntity = this.getCurrentEntity();
  if (!currentEntity || currentEntity.id !== action.entityId) {
    return this; // Retourne instance inchangée si action invalide
  }

  // Résoudre l'attaque avec l'arme spécifiée
  const { entities: updatedEntities, narratives } = this.applyWeaponAttack(
    this.entities, action, currentEntity, weaponId
  );
  
  return new CombatEngine(
    updatedEntities,
    this.currentTurnIndex,
    this.round,
    this.phase,
    [...this.narratives, ...narratives],
    this.dependencies
  );
}

private applyWeaponAttack(
  entities: CombatEntity[], 
  action: CombatAction,
  currentEntity: CombatEntity,
  weaponId: string
): { entities: CombatEntity[], narratives: NarrativeMessage[] } {
  if (!action.targetId) return { entities, narratives: [] };

  const attacker = entities.find(e => e.id === action.entityId);
  const target = entities.find(e => e.id === action.targetId);

  if (!attacker || !target) return { entities, narratives: [] };

  // Forcer l'utilisation de l'arme choisie par le joueur
  const weapon = this.dependencies.weaponResolutionService
    .getWeaponRepository().getWeapon(weaponId);
  
  const result = this.resolveAttackWithWeapon(attacker, target, weapon);
  // ... reste de la logique d'attaque
}
```

---

## PHASE 2 - FRONTEND (UI Authentique D&D)

### **ÉTAPE 2.1 - Hook useCombatGame**
**Fichier** : `src/presentation/hooks/useCombatGame.ts`
**Action** : Ajouter nouvelles fonctions pour armes joueur
```typescript
// NOUVELLES FONCTIONS HOOK
const getPlayerWeapons = useCallback(() => {
  if (!combatEngine || !isPlayerTurn) return [];
  return combatGameUseCase.getPlayerWeaponChoices(combatEngine);
}, [combatEngine, isPlayerTurn]);

const selectWeaponAttack = useCallback((weaponId: string) => {
  if (!combatEngine || !isPlayerTurn) return;
  
  const validTargets = combatGameUseCase.getValidTargetsForPlayerWeapon(combatEngine, weaponId);
  
  setPlayerActionContext({
    state: 'AWAITING_WEAPON_TARGET',
    selectedWeapon: weaponId,
    validTargets: validTargets.map(t => t.id)
  });
}, [combatEngine, isPlayerTurn, combatGameUseCase]);

const executeWeaponAttack = useCallback(async (targetId: string) => {
  if (!combatEngine || !playerActionContext.selectedWeapon) return;
  
  try {
    const newCombat = await combatGameUseCase.executePlayerWeaponAttack(
      combatEngine, 
      playerActionContext.selectedWeapon, 
      targetId
    );
    setCombatEngine(newCombat);
    setPlayerActionContext({ state: 'IDLE' });
  } catch (error) {
    console.error('Weapon attack failed:', error);
  }
}, [combatEngine, playerActionContext, combatGameUseCase]);

// AJOUTER AU RETOUR DU HOOK
return {
  // ... propriétés existantes ...
  
  // NOUVELLES FONCTIONS ARMES
  getPlayerWeapons,
  selectWeaponAttack,
  executeWeaponAttack
};
```

### **ÉTAPE 2.2 - Composant PlayerActionPanel (NOUVEAU)**
**Fichier** : `src/presentation/components/PlayerActionPanel.tsx` (NOUVEAU)
**Rôle** : Remplace le vieux CombatPanel avec vraie interface D&D
```typescript
interface PlayerActionPanelProps {
  isPlayerTurn: boolean;
  playerWeapons: PlayerWeaponChoice[];
  onSelectWeapon: (weaponId: string) => void;
  onSelectMovement: () => void;
  currentAction: 'action' | 'movement' | null;
}

export function PlayerActionPanel({ 
  isPlayerTurn, 
  playerWeapons, 
  onSelectWeapon, 
  onSelectMovement,
  currentAction 
}: PlayerActionPanelProps) {
  if (!isPlayerTurn) return null;

  return (
    <div className="player-actions">
      <div className="action-header">
        <h3>⚔️ Actions de Elarion</h3>
        <ActionToggle 
          currentAction={currentAction}
          availableMovement={6} // cases restantes
        />
      </div>
      
      <div className="action-sections">
        {/* MOUVEMENT - Simple et clair */}
        <ActionSection title="Mouvement">
          <ActionButton 
            icon="🏃" 
            label="Se déplacer"
            onClick={onSelectMovement}
            available={currentAction !== 'action'}
          />
        </ActionSection>
        
        {/* ATTAQUES - Vraies armes avec stats */}
        <ActionSection title="Attaques">
          {playerWeapons.map(weapon => (
            <WeaponButton
              key={weapon.weaponId}
              icon="⚔️"
              name={weapon.weaponName}      // "Dague"
              damage={weapon.damageDisplay} // "Dégâts: 1d4"  
              available={weapon.isAvailable && currentAction !== 'movement'}
              onClick={() => onSelectWeapon(weapon.weaponId)}
            />
          ))}
        </ActionSection>
        
        {/* TODO PHASE 2: SORTS */}
        <ActionSection title="Sorts">
          <div className="coming-soon">Phase 2</div>
        </ActionSection>
      </div>
      
      <div className="action-footer">
        <button className="end-turn-btn">Passer le tour</button>
      </div>
    </div>
  );
}
```

### **ÉTAPE 2.3 - Composants UI Atomiques**
**Fichiers** : Composants réutilisables pour l'interface
```typescript
// ActionToggle.tsx - Radio buttons Action/Mouvement
export function ActionToggle({ currentAction, availableMovement }: ActionToggleProps) {
  return (
    <div className="action-toggle">
      <label>
        <input type="radio" checked={currentAction === 'action'} />
        ❌ Action
      </label>
      <label>
        <input type="radio" checked={currentAction === 'movement'} />
        ⭕ Mouvement ({availableMovement} cases)
      </label>
    </div>
  );
}

// WeaponButton.tsx - Bouton d'arme avec stats
export function WeaponButton({ 
  icon, name, damage, available, onClick 
}: WeaponButtonProps) {
  return (
    <button 
      className={`weapon-btn ${available ? 'available' : 'disabled'}`}
      onClick={available ? onClick : undefined}
      disabled={!available}
    >
      <span className="weapon-icon">{icon}</span>
      <div className="weapon-info">
        <div className="weapon-name">{name}</div>
        <div className="weapon-damage">{damage}</div>
      </div>
    </button>
  );
}
```

### **ÉTAPE 2.4 - Grid Highlighting**
**Fichier** : `src/presentation/components/CombatGrid.tsx`
**Action** : Highlight ennemis à portée quand arme sélectionnée
```typescript
// Modifier CombatGrid pour gérer le highlighting des cibles valides
const getCellClass = useCallback((x: number, y: number) => {
  // ... logique existante ...
  
  // NOUVEAU: Highlight cibles valides pour l'arme sélectionnée
  if (playerActionContext.state === 'AWAITING_WEAPON_TARGET') {
    const isValidTarget = playerActionContext.validTargets?.some(targetId => {
      const entity = entities.find(e => e.id === targetId);
      return entity && entity.position.x === x && entity.position.y === y;
    });
    
    if (isValidTarget) {
      classes.push('valid-weapon-target');
    }
  }
  
  return classes.join(' ');
}, [entities, playerActionContext]);
```

---

## RÉSULTAT FINAL ATTENDU

### **🎯 EXPÉRIENCE JOUEUR**
1. **Interface claire** : "Dague - Dégâts: 1d4", "Arc court - Dégâts: 1d6"
2. **Choix tactique** : Joueur voit portée et choisit consciemment son arme
3. **Feedback authentique** : "Elarion attaque avec Dague - 4 dégâts !"
4. **Gameplay D&D** : Actions/Mouvement comme dans le vrai D&D 5E

### **🎮 WORKFLOW COMPLET**
```
1. Tour d'Elarion commence
   ↓
2. Interface montre: "Dague - Dégâts: 1d4" et "Arc court - Dégâts: 1d6"  
   ↓
3. Joueur clique "Dague" → State: AWAITING_WEAPON_TARGET
   ↓
4. Grid highlight ennemis à portée 1 de la dague
   ↓
5. Joueur clique Gobelin → executeWeaponAttack('dagger', 'goblin_1')
   ↓
6. Backend: resolveAttackWithWeapon(Elarion, Gobelin, dague)
   ↓  
7. Narratif: "💥Elarion attaque Gobelin avec Dague - Touché ! 3 dégâts"
   ↓
8. Tour avance → Tour du Gobelin
```

### **📊 DONNÉES EXEMPLE**
```typescript
// Pour Elarion level 3 avec équipement
const playerWeapons = [
  {
    weaponId: 'dagger',
    weaponName: 'Dague', 
    damageDisplay: 'Dégâts: 1d4',
    range: 1,
    isAvailable: true
  },
  {
    weaponId: 'shortbow',
    weaponName: 'Arc court',
    damageDisplay: 'Dégâts: 1d6', 
    range: 16,
    isAvailable: true // Si munitions disponibles
  }
];
```

---

## VALIDATION FINALE

### **✅ ARCHITECTURE RESPECTÉE**
- **Domain-Centric** : Logique métier PlayerWeaponService dans Domain
- **Thin Application** : UseCases en pattern 3 lignes
- **Dumb Presentation** : UI via hooks, pas de logique métier
- **Immutabilité** : Nouvelles instances CombatEngine
- **Injection** : Services injectés via constructeur

### **✅ GAMEPLAY AUTHENTIC**
- Interface basée sur `action_joueur.png` - Actions D&D authentiques
- Choix d'armes explicite avec stats visibles
- Targeting visuel avec highlighting de portée
- Feedback narratif immersif

### **✅ ROBUSTESSE TECHNIQUE**  
- Backwards compatible avec système existant
- Migration incrémentale par phases
- Tests possibles à chaque étape
- Rollback facile si problèmes

---

**Ce plan livre le cœur du gameplay D&D que vous souhaitez tout en respectant scrupuleusement l'architecture du projet.**