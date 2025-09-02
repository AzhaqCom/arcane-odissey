● ÉTAPE 1 : DIAGNOSTIC COMPLET - ANALYSE DES ERREURS

  Après analyse des deux fichiers build_errors.log, voici la catégorisation par cause racine :

  CATÉGORIES D'ERREURS IDENTIFIÉES

  CATÉGORIE A : Services manquants ou méthodes inexistantes (Critical)

  - rollD20, calculateInitiativeWithModifier introuvables dans les services
  - createCombatStartMessage, createWelcomeMessage manquantes dans GameNarrativeService
  - Méthodes getSpellsByLevel, searchWeapons manquantes dans les repositories
  - Logger et SpellLevel non définis dans de nombreux fichiers

  CATÉGORIE B : Propriétés manquantes sur les entités (Critical)

  - Character.characterClass manquante (utilisée dans GameUI, GameUseCase, SceneUseCase)
  - Character.abilities manquante (utilisée partout pour les modificateurs)
  - InventorySpec.weapons manquante (accès direct aux armes)
  - WeaponDamage.diceCount/diceType vs structure actuelle

  CATÉGORIE C : Erreurs architecturales de services statiques (Major)

  - Classes avec syntaxe #service non supportée par TypeScript
  - Méthodes d'instance appelées sur des classes statiques (ActionPrioritizer.evaluateAction)
  - Confusion instance/statique dans les services du domaine

  CATÉGORIE D : Types et imports manquants (Major)

  - NarrativeMessage non exporté
  - Modules manquants (./domain, WeaponRepository)
  - Types d'export incorrects (LogEntry, EnemyInstanceFactory)

  CATÉGORIE E : Données et configuration (Minor)

  - Enum values incorrectes dans les scènes (gain_gold, lose_hp)
  - Propriétés de sorts mal typées (verbal vs "V")
  - Paramètres unused et problèmes TypeScript mineurs

● ÉTAPE 2 : PLAN DE BATAILLE PRIORISÉ

  Suivant le principe "intérieur vers extérieur" (Domaine → Application → Présentation) :

  PHASE 1 : FONDATIONS DU DOMAINE ⚠️ (Critical)

  1. Corriger Character.ts - Ajouter characterClass et abilities
  2. Fixer les services statiques - Éliminer syntaxe #service
  3. Compléter les services manquants - Ajouter méthodes rollD20, calculateInitiative

  PHASE 2 : COUCHE APPLICATION ⚠️ (Critical)

  4. Corriger les imports/exports - NarrativeMessage, SpellLevel, Logger
  5. Fixer les repositories - Ajouter méthodes manquantes dans les stores

  PHASE 3 : COUCHE PRÉSENTATION ⚙️ (Major)

  6. Corriger les hooks - useCombat, useRepositories
  7. Fixer les composants - GameUI.characterClass, CombatContainer

  PHASE 4 : DONNÉES ET CONFIGURATION 🔧 (Minor)

  8. Nettoyer les types de données - Enums de scènes, propriétés de sorts
  9. Éliminer les variables unused - Nettoyage final

● ---
  RAPPORT FINAL - DIAGNOSTIC COMPLET

  ✅ ANALYSE TERMINÉE

  287+ erreurs TypeScript réparties en 5 catégories principales :

  1. 🔥 Services manquants - Méthodes critiques introuvables
  2. 🔥 Propriétés d'entités - Character incomplet
  3. ⚡ Architecture statique - Syntaxe services incorrecte
  4. 📦 Imports/Types - Modules et exports manquants
  5. 🧹 Configuration - Données et nettoyage

  📋 PLAN DE BATAILLE VALIDÉ

  Ordre de correction domaine → application → présentation pour maximum d'efficacité.

  Prêt pour l'Étape 3 : Peux-tu valider ce plan ? Nous commencerons par la Phase 1 - Character.ts pour    
   fixer les fondations du domaine.