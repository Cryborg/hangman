/* ===== BASE-GAME-MODE-WITH-SAVE.JS - CLASSE DE BASE POUR LES MODES AVEC SAUVEGARDE ===== */

/**
 * Classe de base pour les modes de jeu avec sauvegarde
 * Factorise la logique commune entre StandardMode et CategoryMode
 */
class BaseGameModeWithSave extends BaseGameMode {
    constructor(app, gameEngine, saveKey) {
        super(app, gameEngine);
        this.saveKey = saveKey;
        this.saveManager = new SaveGameManager(this, saveKey);
    }
    
    initialize(skipSaveCheck = false) {
        console.log(`🎲 Initialisation du mode ${this.name}`);
        this.setupUI();
        if (!skipSaveCheck) {
            this.saveManager.checkForSavedGame();
        }
    }
    
    /**
     * Méthodes abstraites à implémenter dans les sous-classes
     */
    formatResumeData(gameState) {
        throw new Error('formatResumeData() doit être implémentée dans la sous-classe');
    }
    
    getStartGameParams() {
        throw new Error('getStartGameParams() doit être implémentée dans la sous-classe');
    }
    
    getGameStateForSave() {
        throw new Error('getGameStateForSave() doit être implémentée dans la sous-classe');
    }
    
    /**
     * Sauvegarde l'état actuel
     */
    saveGameState() {
        const gameState = this.getGameStateForSave();
        this.saveManager.saveGameState(gameState);
    }
    
    /**
     * Reprend une partie sauvegardée
     */
    resumeGame(gameState) {
        if (!this.gameEngine) return;
        
        // Restaurer l'état du jeu (partie commune)
        this.gameEngine.currentWord = gameState.currentWord;
        this.gameEngine.currentCategory = gameState.currentCategory;
        this.gameEngine.guessedLetters = [...gameState.guessedLetters];
        this.gameEngine.wrongLetters = [...gameState.wrongLetters];
        this.gameEngine.remainingTries = gameState.remainingTries;
        this.gameEngine.gameActive = true;
        
        // Restaurer l'état spécifique du mode (à implémenter dans sous-classes)
        this.restoreModeSpecificState(gameState);
        
        // Mettre à jour l'affichage
        this.gameEngine.updateDisplay();
        this.updateDisplay();
        
        // Redessiner le hangman avec les erreurs déjà commises
        this.gameEngine.refreshHangman();
        
        console.log('🔄 Partie reprise', gameState);
        
        // Toast de confirmation simple
        if (this.app.getUIModule()) {
            this.app.getUIModule().showToast('Partie reprise !', 'success', 3000);
        }
    }
    
    /**
     * Restaure l'état spécifique au mode (à surcharger)
     */
    restoreModeSpecificState(gameState) {
        // Par défaut, rien à faire - à surcharger dans les sous-classes
    }
    
    cleanup() {
        console.log(`🧹 Nettoyage du mode ${this.name}`);
        // Sauvegarder avant de nettoyer
        this.saveGameState();
    }
}