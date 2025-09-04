# PLAN D'AMÉLIORATIONS SYSTÈME DE COMBAT
**Date** : 04/01/2025
**Objectif** : Corriger les bugs et améliorer l'expérience de combat

---

## PROBLÈME 1 : CALCUL PORTÉE ARMES INCORRECTE
**Bug** : Les ennemis hors de portée sont marqués comme ciblables
**Cause probable** : Mauvais calcul de distance ou mauvaise récupération de portée

### ÉTAPE 1.1 - Débugger le calcul de portée
**Fichier** : `src/domain/services/PlayerWeaponService.ts`
```typescript
// LIGNE ACTUELLE (ligne 98-99) :
const distance = calculateDistance(attacker.position, entity.position);
return distance <= range;

// VÉRIFIER :
// 1. La fonction calculateDistance est-elle correcte ?
// 2. La valeur de range est-elle correcte ?
// 3. Ajouter des logs pour debug
```

### ÉTAPE 1.2 - Vérifier la récupération de portée
**Fichier** : `src/domain/entities/Weapon.ts`
```typescript
// Vérifier getAttackRange() retourne les bonnes valeurs
// Dague = 1 case (mêlée)
// Arc court = 16 cases (80 pieds / 5)
```

---

## PROBLÈME 2 : MESSAGE "avec false" DANS LE JOURNAL
**Bug** : Message affiche "attaque avec false" au lieu du nom de l'arme
**Cause** : weaponName n'est pas passé correctement

### ÉTAPE 2.1 - Tracer l'origine du "false"
**Fichier** : `src/domain/entities/CombatEngine.ts` (ligne ~1511)
```typescript
// Vérifier generateMissNarrative()
// Le paramètre weapon.name est probablement undefined
```

### ÉTAPE 2.2 - Corriger le passage du nom d'arme
**Fichier** : `src/domain/entities/CombatEngine.ts`
```typescript
// Dans applyWeaponAttack() et resolveAttackWithWeapon()
// S'assurer que weapon.name est bien passé
```

---

## PROBLÈME 3 : SKIP TOUR ENNEMIS MORTS
**Bug** : Les ennemis morts ont toujours leur tour
**Solution** : Filtrer les entités mortes dans la gestion des tours

### ÉTAPE 3.1 - Modifier withAdvancedTurn()
**Fichier** : `src/domain/entities/CombatEngine.ts`
```typescript
withAdvancedTurn(): CombatEngine {
  let nextIndex = this.currentTurnIndex;
  let attempts = 0;
  
  // Chercher la prochaine entité vivante
  do {
    nextIndex = (nextIndex + 1) % this.entities.length;
    attempts++;
    
    // Éviter boucle infinie si tous morts
    if (attempts > this.entities.length) {
      return this.withEndedCombat();
    }
  } while (this.entities[nextIndex].isDead);
  
  // Continuer avec l'entité vivante trouvée...
}
```

---

## PROBLÈME 4 : BOUTON "PASSER SON TOUR"
**Feature** : Permettre au joueur de passer son tour sans action

### ÉTAPE 4.1 - Ajouter bouton dans PlayerActionPanel
**Fichier** : `src/presentation/components/PlayerActionPanel.tsx`
```typescript
interface PlayerActionPanelProps {
  // ... existant ...
  onEndTurn: () => void; // NOUVEAU
}

// Dans le JSX :
<button 
  className="action-button end-turn"
  onClick={onEndTurn}
>
  <span>⏭️</span> Passer le tour
</button>
```

### ÉTAPE 4.2 - Connecter dans CombatScenePhoenix
**Fichier** : `src/presentation/components/CombatScenePhoenix.tsx`
```typescript
<PlayerActionPanel
  // ... existant ...
  onEndTurn={combat.endTurn}
/>
```

---

## PROBLÈME 5 : RELANCER COMBAT APRÈS DÉFAITE
**Feature** : Bouton "Nouvelle tentative" après défaite

### ÉTAPE 5.1 - Détecter fin de combat
**Fichier** : `src/presentation/components/CombatScenePhoenix.tsx`
```typescript
// Ajouter une vérification
if (combat.isEnded) {
  const playerLost = !combat.combatState?.entities.find(
    e => e.type === 'player' && !e.isDead
  );
  
  if (playerLost) {
    return <DefeatScreen onRestart={() => combat.initializeCombatFromScene('forest_ambush')} />;
  }
}
```

### ÉTAPE 5.2 - Créer composant DefeatScreen
**Fichier** : `src/presentation/components/DefeatScreen.tsx` (NOUVEAU)
```typescript
interface DefeatScreenProps {
  onRestart: () => void;
}

export function DefeatScreen({ onRestart }: DefeatScreenProps) {
  return (
    <div className="defeat-screen">
      <h2>☠️ Défaite !</h2>
      <p>Vous avez été vaincu au combat...</p>
      <button onClick={onRestart}>
        ⚔️ Nouvelle tentative
      </button>
    </div>
  );
}
```

---

## ORDRE D'IMPLÉMENTATION RECOMMANDÉ

### Phase 1 - Corrections critiques (URGENT)
1. **PROBLÈME 1** - Calcul portée (empêche gameplay correct)
2. **PROBLÈME 2** - Message "avec false" (affichage cassé)
3. **PROBLÈME 3** - Skip ennemis morts (améliore fluidité)

### Phase 2 - Améliorations UX
4. **PROBLÈME 4** - Bouton passer tour
5. **PROBLÈME 5** - Relancer après défaite

---

## TESTS À EFFECTUER

### Test Portée
1. Placer joueur à côté d'un ennemi
2. Sélectionner Dague (portée 1)
3. ✅ Seul l'ennemi adjacent doit être ciblable
4. Sélectionner Arc court
5. ✅ Tous les ennemis à 16 cases doivent être ciblables

### Test Messages
1. Attaquer avec Dague
2. ✅ Message : "Elarion attaque X avec Dague"
3. Manquer une attaque
4. ✅ Message : "Elarion attaque X avec Dague - Manqué !"

### Test Tours
1. Tuer un ennemi
2. ✅ Son tour doit être sauté automatiquement
3. Passer son tour
4. ✅ Le tour suivant commence

### Test Défaite
1. Se faire tuer
2. ✅ Écran de défaite apparaît
3. Cliquer "Nouvelle tentative"
4. ✅ Combat redémarre