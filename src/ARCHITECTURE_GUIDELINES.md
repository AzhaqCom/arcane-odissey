# PRINCIPES DIRECTEURS D'ARCHITECTURE DU PROJET D&D

Ce document est la source de vérité unique pour toutes les décisions d'architecture et de développement sur ce projet.  
Il doit être lu et respecté scrupuleusement à chaque interaction.

---

## 1. PHILOSOPHIE

Nous construisons une application robuste, maintenable et testable en suivant les principes stricts de l'**Architecture Hexagonale** (ou Clean Architecture) et de l'**Immutabilité**.  
La séparation des couches n'est pas une suggestion, c'est une règle absolue.

---

## 2. LES RÈGLES D'OR (NON NÉGOCIABLES)

1. **Pureté du Domaine Absolue :**  
   Le dossier `src/domain` est un sanctuaire. Aucun fichier dans ce dossier ne doit importer de modules depuis `src/infrastructure`, `src/application`, ou `src/presentation`. Toutes les dépendances pointent vers l'intérieur.

2. **Immutabilité Stricte :**  
   Toutes les entités et objets de valeur du domaine sont immuables. Les méthodes qui modifient l'état doivent retourner une **nouvelle instance** de l'objet (en utilisant le pattern `with...`) et ne jamais muter l'instance actuelle.

3. **Logique Métier dans le Domaine :**  
   Toute la logique métier (règles du jeu, calculs, conditions de victoire, etc.) doit résider **exclusivement** dans la couche `Domain`.

4. **Présentation "Stupide" :**  
   La couche `Presentation` (hooks et composants React) se contente d'afficher les données et de relayer les intentions de l'utilisateur aux `Use Cases` de la couche `Application`.  
   Elle ne contient **aucune logique métier**.

5. **Mappers Explicites :**  
   Toute conversion de données entre les couches (par exemple, `Infrastructure Data` → `Domain Entity`) doit être gérée par des `Mappers` dédiés et situés dans la couche `Application`.

6. **Zéro `console.log` :**  
   Le code de production ne doit contenir aucun `console.log`. Utiliser le service de `Logger` fourni par l'infrastructure.

---

## 3. WORKFLOW OBLIGATOIRE

Pour toute demande de modification ou d'ajout de fonctionnalité, le workflow suivant est requis :

1. **Analyse et Planification :**  
   Présenter une analyse du problème et un plan d'action détaillé.

2. **Validation :**  
   Attendre ma validation explicite du plan avant de commencer l'implémentation.

3. **Implémentation :**  
   Écrire le code en respectant scrupuleusement les Règles d'Or.

4. **Vérification :**  
   Proposer une méthode pour vérifier que la modification fonctionne et n'a pas introduit de régression (tests, compilation, etc.).
