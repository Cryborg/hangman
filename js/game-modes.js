/* ===== GAME-MODES.JS - INDEX DES MODES DE JEU ===== */

/**
 * Fichier d'index pour tous les modes de jeu
 * Toutes les classes sont maintenant dans leur propre fichier
 * 
 * Structure modulaire :
 * - base-game-mode.js → BaseGameMode (classe abstraite)
 * - base-game-mode-with-save.js → BaseGameModeWithSave (classe abstraite avec sauvegarde)
 * - standard-mode.js → StandardMode (jeu classique)
 * - timeattack-mode.js → TimeAttackGameMode (course contre la montre)
 * - category-mode.js → CategoryMode (tous les mots d'une catégorie)
 */

// Note: En ES5/navigateur, on ne peut pas utiliser import/export
// Les classes sont chargées via <script> dans index.html dans l'ordre de dépendance

