/**
 * Contient les règles de progression globales du jeu.
 * Ces données sont utilisées par le domaine pour calculer les statistiques dérivées.
 */

/**
 * Le total d'XP nécessaire pour atteindre chaque niveau.
 * L'index du tableau correspond au niveau. xpForLevel[5] est le seuil pour passer au niveau 5.
 */
export const XP_FOR_LEVEL: readonly number[] = [
  0,      // Niveau 0 (n'existe pas)
  0,      // Niveau 1
  300,    // Niveau 2
  900,    // Niveau 3
  2700,   // Niveau 4
  6500,   // Niveau 5
  14000,  // Niveau 6
  23000,  // Niveau 7
  34000,  // Niveau 8
  48000,  // Niveau 9
  64000,  // Niveau 10
  85000,  // Niveau 11
  100000, // Niveau 12
  120000, // Niveau 13
  140000, // Niveau 14
  165000, // Niveau 15
  195000, // Niveau 16
  225000, // Niveau 17
  265000, // Niveau 18
  305000, // Niveau 19
  355000, // Niveau 20
];

/**
 * Le bonus de maîtrise à chaque niveau.
 * L'index du tableau correspond au niveau.
 */
export const PROFICIENCY_BONUS_PER_LEVEL: readonly number[] = [
  0,      // Niveau 0
  2, 2, 2, 2, // Niveaux 1-4
  3, 3, 3, 3, // Niveaux 5-8
  4, 4, 4, 4, // Niveaux 9-12
  5, 5, 5, 5, // Niveaux 13-16
  6, 6, 6, 6, // Niveaux 17-20
];
