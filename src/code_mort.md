  Plan d'Audit du Code Mort

   1. Rechercher les fonctions explicitement dépréciées :
       * La première étape simple est de faire une recherche globale sur tout le projet pour le tag @deprecated. Cela nous
         donnera la liste de tout ce qui est déjà identifié comme obsolète.

   2. Utiliser l'analyse statique (Linting) pour le code inutilisé :
       * Votre projet utilise ESLint (eslint.config.js). Nous pouvons configurer et/ou exécuter ESLint pour qu'il nous signale
         spécifiquement les variables, fonctions, classes et imports qui ne sont jamais utilisés. C'est la méthode la plus
         fiable pour le code au sein d'un même fichier.

   3. Identifier les fichiers orphelins :
       * C'est l'étape la plus complexe. Pour chaque fichier (surtout les services, composants, etc.), nous pouvons rechercher
         si son nom de classe ou de fichier est importé quelque part ailleurs dans le projet. Si un fichier n'est importé nulle
         part (en dehors de son propre index.ts ou d'un conteneur DI), il est probablement mort.