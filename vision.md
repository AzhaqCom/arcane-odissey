Déjà posons les bases.
Mon jeu est un systeme avec des types de scenes. Je souhaites que chaque scene se ressemble autant que possible, donc meme background, meme style pour les boutons des choix, il pourras bien évidement y avoir des exceptions mais dans l'idee je veux pas que le contenu ou les boutons ne bougent en hautur par exemple d'une scene a l'autre.
Mon jeu étant essentiellement narratif, je souhaite qu'on est un composant GameLog qui sera un vrai plus pour l'immersion, il sera affiché en dessous du rendu des scenes.

C'est la ou est la subtilité et ou je voulais te décrire un peu plus en détail l'ui du Combat.
Le combat sera un peu a part des autres, alors certes il aura le texte d'avant combat, qui sera afficher de la meme maniere qu'une scene textuelle par exemple, mais ensuite, la véritable ui du combat devra occuper au maximum l'ecran pour etre tres visible.

La scene de combat a proprement parlé devra etre comme ceci: 
Le combat grid a gauche qui occupe au moins 60% de large l'ecran.
 A droite, on doit retrouver un combatpanel ou apelle le comme tu veux, C'est ici qu'on affichera :
- Au début du combat on affichera Initiative lancée ! Les jets d'initiative ont été effectués. Prêt à commencer le   combat ? avec un bouton Commencer le combat.
- Puis pendant les tour IA on indiquera le nom de l'entité qui joue exemeple malathor Agit,  gobelin 2 agit.
-puis pendant le tour du joueur, on affichera ici les actions:
btn se déplacer -> si je clique dessus, les cellules de combat grid m'indique sur quel cellule je peut me rendre.
On affichera les armes équipes du joueur sous forme de bouton exemple : Dague Dégâts: 1d4
et enfin si le joueur est un lanceur de sorts, on affichera les sorts sous forme de bouton
exemple : Projectile magique Dégat 1d4+1 rayon de givre Dégat 1d8 
Enfin un bouton Passer le tour tout en bas.


Sous le composant que je viens de te décrire on affichera le Fameux gamelog dont je te parlais, il sert a afficher toute sortes de choses ! aussi bien Hors combat :exemple :Objet obtenu : Arc Du MJ
Sort lancé : Armure du Mage
Arc Du MJ équipé !
Que en Combat ! 

Un combat commence !
Ombre a obtenu 21 en initiative !
Rhingann a obtenu 18 en initiative !
Gobelin a obtenu 17 en initiative !
Elarion a obtenu 11 en initiative !
Ombre utilise l'action Dash
Ombre se déplace vers 5,4
Rhingann lance Bénédiction sur Elarion
Rhingann se déplace vers 7,0
Gobelin manque Elarion avec Arc court (12 vs CA 15)
Gobelin se déplace vers 0,2





   * Présentation : Le rendu, ce que l'utilisateur voit. (Parfait)
   * Application : Le manager qui orchestre tout, il appelle les autres couches pour faire le travail. (Parfait)
   * Domaine : Le cœur des règles métier. Il ne connaît aucune autre couche. Il se fait utiliser par la couche Application.
   * Infrastructure : La data et les implémentations techniques (comme les repositories). Le repository lit la data, construit 
     un objet du Domaine avec, et le retourne à l'Application.


       3. Localisation des fichiers impliqués

  - src/domain/services/CombatStateService.ts - Service de calcul d'initiative
  - src/domain/entities/Combat.ts - Entité Combat avec méthode de délégation
  - src/application/usecases/CombatUseCase.ts - Génération des jets initiaux

  4. Flux d'appels complet

  CombatUseCase.ts:52-54
  │ ↓ (Génération des jets pour chaque entité)
  │ initiativeRoll = Math.random() * 20 + 1
  │ initiative = roll + dexterityModifier
  │
  └─→ Combat.ts:298-300
      │ ↓ (Méthode de délégation)
      │ withCalculatedInitiativeOrder()
      │
      └─→ CombatStateService.ts:37-39
          │ ↓ (Interface publique)
          │ withCalculatedInitiativeOrder(combat)
          │
          └─→ CombatStateService.ts:44-61
              │ (Calcul effectif)
              │ calculateInitiativeOrder_internal()
              │
              ├─ Filtrage: entités.filter(e => e.isActive && !e.isDead)
              ├─ Tri: sort((a,b) => b.initiative - a.initiative || b.dexterity - a.dexterity)
              └─ Retour: nouveau Combat avec ordre d'initiative mis à jour-