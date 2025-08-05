/* ===== WORD-UTILS.JS - UTILITAIRES POUR L'AFFICHAGE DES MOTS ===== */

/**
 * Utilitaires pour la gestion de l'affichage des mots selon les règles de difficulté
 */
class WordUtils {
    /**
     * Applique les règles de difficulté pour déterminer si un caractère doit être affiché
     * @param {string} letter - Le caractère à tester
     * @param {Array} guessedLetters - Les lettres devinées
     * @param {boolean} accentDifficulty - Option difficulté accents
     * @param {boolean} numberDifficulty - Option difficulté chiffres
     * @returns {boolean} - true si le caractère doit être affiché
     */
    static shouldShowCharacter(letter, guessedLetters, accentDifficulty = false, numberDifficulty = false) {
        if (/[A-Za-zÀ-ÿ]/.test(letter)) {
            // C'est une lettre (avec ou sans accent)
            if (guessedLetters.includes(letter.toUpperCase())) {
                return true;
            } else {
                // Vérifier si c'est un accent et si la difficulté accents est désactivée
                if (!accentDifficulty && /[ÀÂÉÈÊÏÎÔÙÛÇ]/i.test(letter)) {
                    return true; // Afficher les accents automatiquement
                } else {
                    return false; // Cacher la lettre non devinée
                }
            }
        } else if (/[0-9]/.test(letter)) {
            // C'est un chiffre
            if (numberDifficulty && !guessedLetters.includes(letter)) {
                return false; // Cacher le chiffre non deviné
            } else {
                return true; // Afficher le chiffre
            }
        } else {
            // Autres caractères (tirets, apostrophes, etc.) : toujours affichés
            return true;
        }
    }
}