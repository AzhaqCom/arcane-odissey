 Plan d'Audit de Qualité Architecturale

  Phase 1 : Audit de Pureté du Domaine (Le Test de l'Hexagone)

  C'est la phase la plus critique. Le domaine doit être un sanctuaire.

   1. Parcours systématiquement chaque fichier du répertoire src/domain/.
   2. Pour chaque fichier, analyse méticuleusement toutes ses déclarations import.
   3. Garantis et certifie qu'aucun import ne provient d'une autre couche. Les seuls imports autorisés doivent pointer vers
      d'autres fichiers de src/domain/.
   4. Liste de manière exhaustive toute violation trouvée, même mineure. Un import vers infrastructure, application, ou
      presentation est une violation critique.

  Phase 2 : Audit du Flux de Données et de la Cohérence des Entités

  Le parcours de la donnée doit être limpide et prédictible.

   1. Prends notre entité principale, Character, comme fil conducteur.
   2. Trace son cycle de vie complet, en partant de sa source de données brute dans src/infrastructure/data/.
   3. Suis-la à travers le Repository, en validant sa transformation en entité de domaine (Character.ts).
   4. Analyse son passage dans la couche Application. Assure-toi que toute conversion vers un objet destiné à l'UI (parfois
      appelé DTO ou ViewModel) est gérée par des mappers explicites situés dans cette couche Application.
   5. Confirme qu'il n'y a plus aucune logique de conversion ou de mapping en dehors de ces mappers dédiés.

  Phase 3 : Audit des "Code Smells" et des Bonnes Pratiques

  Nous traquons maintenant toute imperfection restante.

   1. Scanne l'ensemble du projet à la recherche de toute logique mutable qui aurait pu survivre au refactoring.
   2. Inspecte la couche Presentation (components, hooks, containers). Toute logique métier (calcul de portée, conditions de jeu,
       etc.) doit être supprimée de cette couche. Les composants React doivent être aussi "stupides" que possible et se contenter
       d'afficher les données et de relayer les intentions de l'utilisateur aux use cases.
   3. Identifie toute fonction ou composant qui te semble encore trop complexe ou qui a plusieurs responsabilités.
   4. Assure-toi que tous les console.log de débogage ont été supprimés.

  Phase 4 : Rapport Final et Feu Vert

   1. Compile tes découvertes des phases 1, 2 et 3 dans un rapport final structuré, tu le nommeras rapport_final.md. 
   2. Pour chaque problème identifié, propose un plan de correction qui respecte impérativement les principes que nous avons
      établis (Immutabilité, Architecture Hexagonale, séparation des couches).
   3. Si, et seulement si, aucun problème majeur n'est trouvé, tu donneras le "feu vert" officiel. Ce feu vert signifiera que tu
      certifies que la base de code est une fondation stable et fiable pour le développement des prochaines fonctionnalités.

  ---

  Standard de Qualité pour l'Avenir :

  Ceci définit notre standard. À partir de maintenant, toutes tes analyses et propositions de code devront se conformer à ce
  niveau d'exigence. Les "solutions de facilité", les "rustines" ou les contournements qui compromettent l'architecture ne
  sont plus acceptables. Nous visons l'excellence et la pérennité.