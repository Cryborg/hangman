/* ===== BASE-GAME-MODE.JS - CLASSE ABSTRAITE POUR TOUS LES MODES ===== */

/**
 * Classe abstraite définissant l'interface commune de tous les modes de jeu
 */
class BaseGameMode {
    constructor(app, gameEngine) {
        this.app = app;
        this.gameEngine = gameEngine;
        this.name = 'base';
    }
    
    // ===== MÉTHODES ABSTRAITES (À IMPLÉMENTER DANS LES SOUS-CLASSES) ===== //
    
    /**
     * Initialise le mode de jeu
     */
    initialize() {
        throw new Error('initialize() doit être implémentée dans la sous-classe');
    }
    
    /**
     * Démarre une nouvelle partie
     */
    startGame() {
        throw new Error('startGame() doit être implémentée dans la sous-classe');
    }
    
    /**
     * Gère la victoire sur un mot
     */
    onWordWin(word, category, errorsCount) {
        throw new Error('onWordWin() doit être implémentée dans la sous-classe');
    }
    
    /**
     * Gère l'échec sur un mot  
     */
    onWordLoss(word) {
        throw new Error('onWordLoss() doit être implémentée dans la sous-classe');
    }
    
    /**
     * Configure l'interface utilisateur pour ce mode
     */
    setupUI() {
        throw new Error('setupUI() doit être implémentée dans la sous-classe');
    }
    
    /**
     * Nettoie les ressources du mode
     */
    cleanup() {
        throw new Error('cleanup() doit être implémentée dans la sous-classe');
    }
    
    // ===== MÉTHODES COMMUNES ===== //
    
    getName() {
        return this.name;
    }
    
    getApp() {
        return this.app;
    }
    
    getGameEngine() {
        return this.gameEngine;
    }
    
    /**
     * Méthode commune pour gérer le passage automatique au mot suivant
     * @param {Function} nextWordCallback - Fonction à appeler pour passer au mot suivant
     * @param {number} delay - Délai en millisecondes avant le passage (défaut: 3000)
     */
    scheduleNextWord(nextWordCallback, delay = 3000) {
        if (typeof nextWordCallback !== 'function') {
            console.warn('⚠️ scheduleNextWord: callback invalide');
            return;
        }
        
        // Programmer le passage au mot suivant
        setTimeout(() => {
            try {
                nextWordCallback();
            } catch (error) {
                console.error('❌ Erreur lors du passage au mot suivant:', error);
            }
        }, delay);
    }
    
    /**
     * Méthode pour passer manuellement au mot suivant (bouton)
     * À surcharger dans les sous-classes si nécessaire
     */
    goToNextWord() {
        // Masquer le bouton immédiatement
        this.app.hideNextWordButton();
        
        if (this.gameEngine) {
            this.gameEngine.startNewGame();
        }
    }
}