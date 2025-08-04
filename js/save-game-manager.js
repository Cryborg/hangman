/* ===== SAVE-GAME-MANAGER.JS - GESTION CENTRALISÉE DES SAUVEGARDES ===== */

/**
 * Gestionnaire centralisé des sauvegardes de partie
 * Extrait la logique commune entre StandardMode et CategoryMode
 */
class SaveGameManager {
    constructor(mode, saveKey) {
        this.mode = mode;
        this.saveKey = saveKey;
    }
    
    /**
     * Sauvegarde l'état actuel de la partie
     */
    saveGameState(gameState) {
        if (!gameState || !this.mode.gameEngine || !this.mode.gameEngine.gameActive) {
            // Pas de partie en cours, supprimer la sauvegarde
            this.clearSave();
            return;
        }
        
        const stateWithTimestamp = {
            ...gameState,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem(this.saveKey, JSON.stringify(stateWithTimestamp));
            console.log('💾 Partie sauvegardée', stateWithTimestamp);
        } catch (error) {
            console.warn('⚠️ Impossible de sauvegarder la partie:', error.message);
        }
    }
    
    /**
     * Vérifie s'il existe une sauvegarde et propose de la reprendre
     */
    checkForSavedGame() {
        const savedData = localStorage.getItem(this.saveKey);
        if (!savedData) return;
        
        try {
            const gameState = JSON.parse(savedData);
            
            // Vérifier que la sauvegarde n'est pas trop ancienne (24h max)
            const maxAge = 24 * 60 * 60 * 1000; // 24 heures en millisecondes
            if (Date.now() - gameState.timestamp > maxAge) {
                this.clearSave();
                return;
            }
            
            // Vérifier si on a déjà proposé la reprise dans cette session
            const sessionKey = `${this.saveKey}_offered_${gameState.timestamp}`;
            if (sessionStorage.getItem(sessionKey)) {
                console.log('Reprise déjà proposée dans cette session');
                return;
            }
            
            // Marquer qu'on a proposé la reprise pour cette sauvegarde spécifique
            sessionStorage.setItem(sessionKey, 'true');
            
            // Proposer de reprendre la partie
            this.showResumeGameOption(gameState);
            
        } catch (error) {
            console.error('Erreur lors du chargement de la partie sauvegardée:', error);
            this.clearSave();
        }
    }
    
    /**
     * Affiche l'option de reprise de partie
     */
    showResumeGameOption(gameState) {
        if (!this.mode.app.getUIModule()) return;
        
        const resumeData = this.mode.formatResumeData(gameState);
        const toast = this.createResumeToast(resumeData.message, gameState);
        
        document.body.appendChild(toast);
    }
    
    /**
     * Crée le toast de reprise avec les boutons
     */
    createResumeToast(message, gameState) {
        const toast = document.createElement('div');
        toast.className = 'toast toast-resume toast-show';
        toast.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translate(-50%, 0);
            background: var(--bg-secondary);
            border: 2px solid var(--primary-color);
            border-radius: var(--radius-lg);
            padding: var(--spacing-lg);
            z-index: 1001;
            backdrop-filter: blur(10px);
            min-width: 320px;
            text-align: center;
        `;
        
        toast.innerHTML = `
            <div style="margin-bottom: var(--spacing-md); color: var(--text-primary); font-size: 1.1rem; line-height: 1.8; text-align: center;">
                ${message}
            </div>
            <div style="display: flex; gap: var(--spacing-md); justify-content: center;">
                <button class="resume-btn btn btn-primary" style="padding: 0.6rem 1.2rem; font-size: 0.9rem;">
                    ▶️ Reprendre
                </button>
                <button class="new-game-btn btn btn-secondary" style="padding: 0.6rem 1.2rem; font-size: 0.9rem;">
                    🆕 Nouvelle partie
                </button>
            </div>
        `;
        
        // Gestionnaires d'événements
        toast.querySelector('.resume-btn').addEventListener('click', () => {
            this.mode.resumeGame(gameState);
            document.body.removeChild(toast);
        });
        
        toast.querySelector('.new-game-btn').addEventListener('click', () => {
            this.clearSave();
            const params = this.mode.getStartGameParams();
            if (Array.isArray(params)) {
                this.mode.startGame(...params.slice(0, -1), false); // Remplacer le dernier param par false
            } else {
                this.mode.startGame(false);
            }
            document.body.removeChild(toast);
        });
        
        return toast;
    }
    
    /**
     * Supprime la sauvegarde
     */
    clearSave() {
        try {
            localStorage.removeItem(this.saveKey);
        } catch (error) {
            console.warn('⚠️ Impossible de supprimer la sauvegarde:', error.message);
        }
    }
    
    /**
     * Formate la progression d'un mot pour l'affichage
     */
    static formatWordProgress(word, guessedLetters) {
        return word.split('').map(letter => 
            guessedLetters.includes(letter.toUpperCase()) ? letter : '_'
        ).join(' ');
    }
}

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
    
    initialize() {
        console.log(`🎲 Initialisation du mode ${this.name}`);
        this.setupUI();
        this.saveManager.checkForSavedGame();
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