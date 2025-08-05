/* ===== GAME-MANAGER.JS - GESTIONNAIRE PRINCIPAL DES MODES DE JEU ===== */

/**
 * Gestionnaire principal qui coordonne le moteur de jeu et les différents modes
 * Remplace l'ancienne classe PenduGame monolithique
 */
class PenduGameManager {
    constructor(app) {
        this.app = app;
        
        // Moteur de jeu (logique core)
        this.gameEngine = null;
        
        // Modes de jeu disponibles
        this.gameModes = {
            standard: null,
            timeattack: null,
            category: null
        };
        
        // Mode actuel
        this.currentMode = null;
        
        // Paramètres de la dernière partie
        this.lastGameSettings = {
            mode: 'standard',
            timeAttackDuration: 1,
            categoryName: null
        };
        
        // L'initialisation sera lancée explicitement par l'app
        this.isInitialized = false;
    }
    
    async initialize() {
        console.log('🚀 Initialisation du Game Manager');
        
        // Créer le moteur de jeu
        this.gameEngine = new PenduGameEngine(this.app);
        
        // Charger les catégories
        const success = await this.gameEngine.loadCategories();
        if (!success) {
            console.error('❌ Échec du chargement des catégories');
            return;
        }
        
        // Initialiser les modes de jeu
        this.initializeGameModes();
        
        // Définir le mode standard par défaut
        this.setGameMode('standard');
        
        this.isInitialized = true;
        console.log('✅ Game Manager initialisé');
    }
    
    initializeGameModes() {
        // Créer les instances des modes de jeu
        this.gameModes.standard = new StandardMode(this.app, this.gameEngine);
        this.gameModes.timeattack = new TimeAttackGameMode(this.app, this.gameEngine);
        this.gameModes.category = new CategoryMode(this.app, this.gameEngine);
        
        console.log('🎮 Modes de jeu créés:', Object.keys(this.gameModes));
    }
    
    // ===== GESTION DES MODES ===== //
    
    setGameMode(modeName, options = {}) {
        if (!this.gameModes[modeName]) {
            console.error(`❌ Mode de jeu inconnu: ${modeName}`);
            return false;
        }
        
        // Sauvegarder les paramètres
        this.lastGameSettings.mode = modeName;
        if (options.timeAttackDuration) {
            this.lastGameSettings.timeAttackDuration = options.timeAttackDuration;
        }
        if (options.categoryName) {
            this.lastGameSettings.categoryName = options.categoryName;
        }
        
        // Changer de mode
        this.currentMode = this.gameModes[modeName];
        this.gameEngine.setGameMode(this.currentMode);
        
        // Configurer les options spécifiques
        if (modeName === 'timeattack' && options.timeAttackDuration) {
            this.currentMode.setDuration(options.timeAttackDuration);
        }
        
        if (modeName === 'category' && options.categoryName) {
            this.currentMode.setCategory(options.categoryName);
        }
        
        console.log(`🎯 Mode de jeu activé: ${modeName}`, options);
        return true;
    }
    
    getCurrentMode() {
        return this.currentMode;
    }
    
    getCurrentGameMode() {
        return this.currentMode;
    }
    
    getCurrentModeName() {
        return this.currentMode ? this.currentMode.getName() : null;
    }
    
    // ===== DÉMARRAGE DES PARTIES ===== //
    
    startStandardGame() {
        return this.setGameMode('standard') && this.startGame();
    }
    
    startTimeAttackGame(duration = 1) {
        return this.setGameMode('timeattack', { timeAttackDuration: duration }) && this.startGame();
    }
    
    startCategoryGame(categoryName) {
        if (!categoryName) {
            console.error('❌ Nom de catégorie requis pour le mode catégorie');
            return false;
        }
        return this.setGameMode('category', { categoryName }) && this.startGame();
    }
    
    startGame() {
        if (!this.currentMode) {
            console.error('❌ Aucun mode de jeu sélectionné');
            return false;
        }
        
        // Démarrer le jeu via le mode actuel
        this.currentMode.startGame();
        return true;
    }
    
    // ===== REDÉMARRAGE ===== //
    
    restartWithSameSettings() {
        const settings = this.lastGameSettings;
        
        // Redémarrage manuel : supprimer la sauvegarde du mode actuel seulement
        this.clearCurrentModeSave(settings.mode);
        
        switch (settings.mode) {
            case 'standard':
                this.setGameMode('standard');
                if (this.currentMode) {
                    this.currentMode.startGame(true); // clearSave = true
                }
                return true;
            
            case 'timeattack':
                this.setGameMode('timeattack', { timeAttackDuration: settings.timeAttackDuration });
                if (this.currentMode) {
                    this.currentMode.startGame(true); // clearSave = true
                }
                return true;
            
            case 'category':
                if (settings.categoryName) {
                    this.setGameMode('category', { categoryName: settings.categoryName });
                    if (this.currentMode) {
                        this.currentMode.startGame(true); // clearSave = true
                    }
                    return true;
                }
                break;
        }
        
        console.warn('⚠️ Impossible de redémarrer avec les derniers paramètres');
        // Fallback mode standard avec clearSave = true
        this.clearCurrentModeSave('standard');
        this.setGameMode('standard');
        if (this.currentMode) {
            this.currentMode.startGame(true);
        }
        return true;
    }
    
    // Nouvelle méthode pour supprimer seulement la sauvegarde du mode spécifié
    clearCurrentModeSave(modeName) {
        const saveKeys = {
            'standard': 'pendu_current_game',
            'category': 'pendu_current_category_game'
            // timeattack n'a pas de sauvegarde
        };
        
        const saveKey = saveKeys[modeName];
        if (saveKey) {
            try {
                localStorage.removeItem(saveKey);
                console.log(`🗑️ Sauvegarde du mode ${modeName} supprimée pour redémarrage manuel`);
            } catch (error) {
                console.warn(`⚠️ Erreur lors de la suppression de la sauvegarde ${modeName}:`, error.message);
            }
        }
    }
    
    // ===== INFORMATIONS ===== //
    
    getAvailableCategories() {
        return this.gameEngine ? this.gameEngine.getEnabledCategories() : [];
    }
    
    getAllCategories() {
        // Méthode pour récupérer TOUTES les catégories (pour les paramètres)
        return this.gameEngine ? this.gameEngine.getCategories() : [];
    }
    
    getGameState() {
        return this.gameEngine ? this.gameEngine.getGameState() : null;
    }
    
    getLastGameSettings() {
        return { ...this.lastGameSettings };
    }
    
    // ===== DÉLÉGATION AU MOTEUR ===== //
    
    guessLetter(letter) {
        return this.gameEngine ? this.gameEngine.guessLetter(letter) : false;
    }
    
    isGameActive() {
        return this.gameEngine ? this.gameEngine.isGameActive() : false;
    }
    
    getCurrentWord() {
        return this.gameEngine ? this.gameEngine.getCurrentWord() : '';
    }
    
    getCurrentCategory() {
        return this.gameEngine ? this.gameEngine.getCurrentCategory() : '';
    }
    
    // ===== NETTOYAGE ===== //
    
    cleanup() {
        if (this.currentMode) {
            this.currentMode.cleanup();
        }
        
        Object.values(this.gameModes).forEach(mode => {
            if (mode && typeof mode.cleanup === 'function') {
                mode.cleanup();
            }
        });
        
        console.log('🧹 Game Manager nettoyé');
    }
    
    // ===== MÉTHODES DE COMPATIBILITÉ ===== //
    // Pour maintenir la compatibilité avec l'ancien code
    
    startNewGame() {
        return this.startGame();
    }
    
    setGameMode_Legacy(mode) {
        // Ancienne méthode pour compatibilité
        return this.setGameMode(mode);
    }
    
    getGameMode() {
        return this.getCurrentModeName();
    }
    
    updateButtonsVisibility() {
        if (this.currentMode && typeof this.currentMode.updateButtonsVisibility === 'function') {
            this.currentMode.updateButtonsVisibility();
        }
    }
    
    updateStreakDisplay() {
        if (this.gameEngine) {
            this.gameEngine.updateStreakDisplay();
        }
    }
    
    endGame() {
        if (this.gameEngine) {
            this.gameEngine.endGame();
        }
    }
    
    revealWord() {
        return this.gameEngine ? this.gameEngine.revealWord() : null;
    }
}