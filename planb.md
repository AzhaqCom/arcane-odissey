# 📋 PLAN B - MIGRATION PHOENIX AVEC UI LEGACY
*Adapter le système Phoenix pour utiliser le CSS et la mise en forme de l'ancien système*

## 🎯 OBJECTIF
Migrer vers le système Phoenix immutable tout en conservant 100% de l'interface utilisateur existante.

## 📅 DÉBUT: 03/09/2025 - 18:00

## ✅ STATUT GLOBAL: EN COURS (4/6 étapes)

---

## 📊 PROGRESSION DÉTAILLÉE

### ✅ Phase 0: Analyse préliminaire [TERMINÉ - 18:00]
- ✅ Analyse de CombatPanel.tsx, CombatGrid.tsx, CombatScene.tsx
- ✅ Identification des éléments CSS critiques
- ✅ Mappage des fonctionnalités vers Phoenix
- ✅ Documentation du plan complet

### ✅ Phase 1: CombatGridNew.tsx [TERMINÉ - 18:15]
**Objectif**: Créer une nouvelle grille utilisant CombatEngine avec l'ancien CSS

**Tâches**:
- ✅ Créer le fichier CombatGridNew.tsx
- ✅ Importer les types de CombatEngine
- ✅ Reprendre la structure HTML/CSS de CombatGrid.tsx
- ✅ Adapter la logique pour utiliser CombatState
- ✅ Implémenter le mode mouvement avec surbrillance
- ✅ Gérer les clics pour déplacement

**Éléments CSS à conserver**:
```css
.combat-grid { display: flex; flex-wrap: wrap; }
.grid-cell { flex: 1 0 12.5%; aspect-ratio: 1; }
.grid-entity-card { font-size: 10px; }
.entity-hp-bar { height: 4px; border-radius: 2px; }
.reachable-cell { background: #352941; border-color: #8962b1ff; }
```

### ⏳ Phase 2: CombatPanelNew adaptation [À FAIRE]
**Objectif**: Adapter CombatPanelNew avec les classes CSS legacy

**Tâches**:
- [ ] Ajouter les classes CSS de l'ancien panel
- [ ] Restructurer le HTML pour matcher l'ancien
- [ ] Conserver les codes couleur des actions
- [ ] Implémenter le mode targeting
- [ ] Adapter l'affichage par phase

### ⏳ Phase 3: CombatScenePhoenix [À FAIRE]
**Objectif**: Créer la scène principale avec layout 64%/35%

**Tâches**:
- [ ] Créer CombatScenePhoenix.tsx
- [ ] Implémenter le layout battlefield/panel
- [ ] Intégrer GameLog existant
- [ ] Gérer l'état avec useCombatGame
- [ ] Appliquer les styles scene-combat

### ⏳ Phase 4: Migration des styles [À FAIRE]
**Objectif**: Centraliser tous les styles CSS

**Tâches**:
- [ ] Créer CombatPhoenix.scss
- [ ] Copier styles de l'ancien système
- [ ] Vérifier les variables CSS
- [ ] Tester les animations/transitions

### ⏳ Phase 5: Tests d'intégration [À FAIRE]
**Objectif**: Valider le système complet

**Tests à effectuer**:
- [ ] Démarrage du combat
- [ ] Tours joueur/IA
- [ ] Actions (mouvement, attaque)
- [ ] Affichage grille et entités
- [ ] Logs et messages
- [ ] Fin de combat

### ⏳ Phase 6: Nettoyage [À FAIRE]
**Objectif**: Supprimer l'ancien système

**Fichiers à supprimer**:
- [ ] CombatPanel.tsx (ancien)
- [ ] CombatGrid.tsx (ancien)
- [ ] CombatContainer.tsx
- [ ] Renommer *New.tsx → *.tsx

---

## 📝 NOTES DE DÉVELOPPEMENT

### 18:05 - Début Phase 1
Création de CombatGridNew.tsx en cours...

---

## 🐛 PROBLÈMES RENCONTRÉS

*Aucun problème pour le moment*

---

## 💡 DÉCISIONS TECHNIQUES

1. **Préservation CSS**: Copie exacte des classes pour éviter les régressions
2. **Props immutables**: Passage de CombatState complet aux composants
3. **Callbacks purs**: Toute la logique dans useCombatGame

---

## 📈 MÉTRIQUES

- **Lignes de code ajoutées**: ~1200
- **Lignes de code modifiées**: ~300
- **Composants créés**: 3/3 (GridNew, PanelNew adapté, ScenePhoenix)
- **Fichiers CSS**: 1 (420 lignes)
- **Tests passés**: N/A (en attente de test utilisateur)

---

## ✅ PROCHAINES ÉTAPES

### Phase 5: Tests d'intégration [À FAIRE]
1. Lancer l'application avec `npm run dev`
2. Naviguer vers une scène de combat
3. Vérifier le bouton "Démarrer Combat"
4. Tester les actions joueur
5. Observer les tours IA automatiques
6. Valider la fin de combat

### Phase 6: Nettoyage final [À FAIRE]
- Supprimer les composants legacy après validation
- Renommer les composants *New en retirant "New"
- Nettoyer les imports inutilisés

---

*Dernière mise à jour: 03/09/2025 - 18:30*