# [Arcane Odyssey] – RPG D&D-Like Solo

Un jeu de rôle solo inspiré de Dungeons & Dragons, avec combat tactique, progression de personnage, donjons procéduraux et gestion d’inventaire complexe. Conçu en TypeScript avec une architecture hexagonale pour une extensibilité maximale.  

---

## Table des matières

- [Présentation](#présentation)  
- [Fonctionnalités](#fonctionnalités)  
- [Architecture](#architecture)  
- [Installation](#installation)  
- [Usage](#usage)  
- [Roadmap](#roadmap)  
- [Contributions](#contributions)  
- [Licence](#licence)  

---

## Présentation

Ce projet est un RPG solo inspiré de D&D/Héros & Dragons, conçu pour explorer des mécaniques de jeu complexes dans un environnement web. Le joueur incarne un personnage (magicien, guerrier, rôdeur…) et progresse à travers :

- Des **combats tactiques au tour par tour** sur grille avec IA adaptative  
- Des **donjons générés procéduralement** avec séquences de combats et loot  
- Un **système d’inventaire et de crafting** complet  
- Une **progression de personnage** avec XP, niveaux et spécialisations  
- Un **système de sorts complexe**, en combat et hors combat  
- Une **gestion temporelle** jour/nuit et repos à la demande  

---

## Fonctionnalités

### Core Systems

- Types de scènes : Dialogue, Combat, Investigation, Donjon procédural  
- Progression : XP, niveaux, spécialisations D&D  
- Inventaire : Armes, Armures, Bijoux/Talismans, Consommables, Ressources + Crafting  
- Temporalité : Jour/Nuit, repos courts/longs selon sécurité de la zone  

### Combat Tactique

- Grille tactique avec distance Chebyshev  
- Déplacement et actions libres dans n’importe quel ordre  
- Attaques d’opportunité et actions bonus par classe  
- IA comportementale pour ennemis et compagnons  

### Sorts Complexes

- En combat : projectiles multiples, AOE, buffs et soins  
- Hors combat : buffs persistants, sorts utilitaires (lumière, main de mage…)  
- Contextuels : suggestions de sorts selon scène (ex : obscurité → option Lumière)  

### Donjons Procéduraux

- Génération de X salles = X combats enchaînés  
- Ennemis adaptés à la difficulté  
- Loots distribués à la fin du donjon avec chances paramétrables  

### Repos à la Demande

- UI permanente avec bouton de repos  
- Repos court ou long selon sécurité de la zone  
- Effets et buffs mis à jour automatiquement  

---

## Architecture

L’architecture du projet suit le modèle **hexagonal** pour assurer modularité et testabilité :

