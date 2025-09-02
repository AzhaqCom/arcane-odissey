# 🚀 PLAN D'ACTION - ARCANE ODYSSEY
## Feuille de route pour l'implémentation des attaques réelles

---

## ✅ ACCOMPLI
- [x] Architecture ECS complète implémentée
- [x] Correction des 4 bugs critiques de gameplay
- [x] AI Decision Maker ECS fonctionnel
- [x] Migration hybride Combat → ECS opérationnelle

---

## 🎯 PHASE 1 : SYSTÈME D'ATTAQUES RÉELLES (2-3 jours)

### ÉTAPE 1.1 : Mise à jour données ennemis (30min)
- [x] **Action** : Modifier `src/infrastructure/data/characters/enemies.ts`
  - Remplacer `actions: ['shortbow_attack', 'dagger_attack']`
  - Par `equipment: { weapons: ['shortbow', 'dagger'] }`
  - Ajouter `specialAbilities` pour capacités uniques si besoin
  - Ajouter `combatModifiers` pour bonus d'attaque spécifiques
  - Ajouter `aiProfile` avec comportements IA
  - Étendre avec 4 types d'ennemis (goblin_scout, goblin, orc_warrior, skeleton_archer)
  - Ajouter armes manquantes dans weapons.ts (scimitar, battleaxe, handaxe)

### ÉTAPE 1.2 : Factory ECS avec armes réelles (45min)
- [ ] **Action** : Modifier `src/domain/factories/ECSEntityFactory.ts`
  - Intégrer `WeaponRepository` dans la factory
  - Méthode `resolveEnemyWeapons(templateId)` pour charger armes depuis equipment
  - Remplacer `weapons: []` par armes réelles dans `WeaponsComponent`
  - Mettre à jour `availableActions` avec actions d'armes

### ÉTAPE 1.3 : AI Selection d'armes intelligente (1h)
- [ ] **Action** : Améliorer `src/domain/entities/ECSAIDecisionMaker.ts`
  - Méthode `selectBestWeapon(entity, intent)` 
    - Si `attack_melee` → chercher arme `type: 'melee'`
    - Si `attack_ranged` → chercher arme `type: 'ranged'`
  - Enrichir `enrichDecisionECS()` avec `weaponId` choisi
  - Gérer actions universelles (dodge, dash) sans arme

### ÉTAPE 1.4 : Exécution attaques réelles IA (30min) 
- [ ] **Action** : Modifier `src/domain/adapters/CombatECSAdapter.ts`
  - Dans `executeAITurnECS()` : utiliser `combat.performWeaponAttack()`
  - Passer `weaponId` depuis la décision IA
  - Supprimer simulation `Math.random() * 8 + 1`
  - Retourner vrais résultats de combat

### ÉTAPE 1.5 : Actions joueur avec armes inventaire (1h)
- [ ] **Action** : Modifier `src/presentation/components/CombatPanel.tsx`
  - Remplacer section armes simulée
  - Charger armes depuis `currentEntity.inventory.weapons`
  - Boutons d'attaque avec noms d'armes réels
  - Connecter à `onAttackWithWeapon(weaponId)`

### ÉTAPE 1.6 : Tests et validation (30min)
- [ ] **Action** : Vérifier fonctionnement complet
  - IA choisit armes appropriées selon comportement
  - Attaques joueur avec vrais dégâts d'armes
  - Jets d'attaque vs AC fonctionnels
  - Messages de combat précis

---

## 🎮 PHASE 2 : EXPANSION CONTENU COMBAT (1 semaine)

### ÉTAPE 2.1 : Bibliothèque d'armes étendue (2h)
- [ ] **Action** : Étendre `src/infrastructure/data/equipment/weapons.ts`
  - Ajouter 15-20 nouvelles armes D&D classiques
  - Arcs, épées, haches, dagues, masses, etc.
  - Propriétés spéciales (finesse, portée, polyvalent)
  - Validation cohérence type/range/damage

### ÉTAPE 2.2 : Templates ennemis diversifiés (3h)
- [ ] **Action** : Créer 10-15 nouveaux ennemis dans `enemies.ts`
  - **Mêlée** : Orcs, Gobelins élites, Squelettes
  - **Distance** : Archers, Kobolds, Éclaireurs
  - **Hybride** : Rangers, Capitaines, Druides
  - **Spéciaux** : Dragons (breath weapon), Sorciers (sorts)
  - Profils IA variés : aggressive, defensive, tactical, cowardly

### ÉTAPE 2.3 : Système capacités spéciales (2h)
- [ ] **Action** : Implémenter `specialAbilities` 
  - Interface `SpecialAbility` avec exécution
  - Capacités de base : breath_weapon, regeneration, pack_tactics
  - Intégration dans ECSAIDecisionMaker
  - UI pour capacités spéciales ennemies

### ÉTAPE 2.4 : Modificateurs de combat (1h)
- [ ] **Action** : Système `combatModifiers`
  - Bonus d'attaque/dégâts spécifiques par ennemi
  - Résistances et vulnérabilités 
  - Application dans calculs de combat
  - Affichage dans interface

---

## ⚡ PHASE 3 : MÉCANIQUES AVANCÉES (3-4 jours)

### ÉTAPE 3.1 : Conditions de combat (2h)
- [ ] **Action** : Système d'états (empoisonné, paralysé, etc.)
  - Interface `CombatCondition` 
  - Application/suppression par tours
  - Effets sur jets d'attaque/dégâts/mouvement
  - UI indicators pour conditions

### ÉTAPE 3.2 : Attaques d'opportunité (1h) 
- [ ] **Action** : Mécaniques tactiques avancées
  - Détection mouvement hors de portée
  - Calcul et exécution attaques d'opportunité
  - IA prend en compte dans décisions mouvement

### ÉTAPE 3.3 : Sorts et ciblage (2h)
- [ ] **Action** : Système de sorts fonctionnel
  - Sélection et ciblage sorts joueur
  - IA utilise sorts selon classe/niveau
  - Calculs dégâts/effets magiques
  - Gestion emplacements de sorts

### ÉTAPE 3.4 : Combat de zone (1h)
- [ ] **Action** : Sorts et effets multi-cibles
  - Sélection zones d'effet
  - Calculs splash damage
  - AI évite/utilise effets de zone

---

## 🎨 PHASE 4 : POLISH & UX (3-4 jours)

### ÉTAPE 4.1 : Interface combat améliorée (2h)
- [ ] **Action** : Améliorer `CombatPanel` et `CombatGrid`
  - Animations attaques/dégâts
  - Indicateurs visuels portée/mouvement
  - Tooltips détaillés armes/sorts
  - Feedback actions (succès/échec/critique)

### ÉTAPE 4.2 : Système de logs enrichi (1h)
- [ ] **Action** : Messages combat détaillés
  - Descriptions attaques avec arme/dégâts
  - Messages critique/échec critique
  - Historique actions avec couleurs
  - Export/sauvegarde logs

### ÉTAPE 4.3 : Balance et tuning (2h) 
- [ ] **Action** : Équilibrage gameplay
  - Ajustement HP/AC/dégâts ennemis
  - Tests comportements IA
  - Validation progression difficulté
  - Métriques combat (durée, létalité)

### ÉTAPE 4.4 : Tests utilisateur (1h)
- [ ] **Action** : Validation gameplay complet
  - Scénarios combat variés
  - Performance avec nombreux ennemis
  - UX joueur (intuitivité, fun factor)
  - Documentation finale

---

## 📊 MÉTRIQUES DE RÉUSSITE

**PHASE 1 :** 
- ✅ IA attaque avec vraies armes (pas simulation)
- ✅ Joueur peut attaquer avec inventaire
- ✅ Calculs dégâts D&D précis

**PHASE 2 :**
- ✅ 15+ ennemis différents opérationnels
- ✅ 20+ armes fonctionnelles
- ✅ Capacités spéciales actives

**PHASE 3 :**
- ✅ Conditions et mécaniques avancées
- ✅ IA tactiquement compétente
- ✅ Sorts joueur/IA fonctionnels

**PHASE 4 :**
- ✅ Interface intuitive et réactive
- ✅ Gameplay équilibré et amusant
- ✅ Performance stable

---

*Dernière mise à jour : Septembre 2025*
*Status : Prêt pour PHASE 1*