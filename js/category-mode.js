/* ===== CATEGORY-MODE.JS - MODE CATÉGORIE COMPLÈTE ===== */

/**
 * Mode Catégorie - Parcourir tous les mots d'une catégorie
 */
class CategoryMode extends BaseGameModeWithSave {
    constructor(app, gameEngine) {
        super(app, gameEngine, 'pendu_current_category_game');
        this.name = 'category';
        this.selectedCategory = null;
        this.categoryWords = [];
        this.currentIndex = 0;
        this.wordsFound = 0;
        this.totalWords = 0;
        this.completedWords = new Set();
    }
    
    // ===== MÉTHODES ABSTRAITES IMPLÉMENTÉES ===== //
    
    formatResumeData(gameState) {
        const wordProgress = SaveGameManager.formatWordProgress(gameState.currentWord, gameState.guessedLetters);
        const progress = `${gameState.wordsFound}/${gameState.totalWords} mots`;
        const message = `Catégorie en cours :<br><br><strong>"${wordProgress}"</strong><br><em>${gameState.selectedCategory} (${progress})</em><br><br>Reprendre ?`;
        return { message };
    }
    
    getStartGameParams() {
        return [this.selectedCategory, true]; // categoryName, clearSave
    }
    
    getGameStateForSave() {
        if (!this.gameEngine || !this.gameEngine.gameActive || !this.selectedCategory) {
            return null;
        }
        
        return {
            // État du mot actuel
            currentWord: this.gameEngine.currentWord,
            currentCategory: this.gameEngine.currentCategory,
            guessedLetters: [...this.gameEngine.guessedLetters],
            wrongLetters: [...this.gameEngine.wrongLetters],
            remainingTries: this.gameEngine.remainingTries,
            
            // État de progression dans la catégorie
            selectedCategory: this.selectedCategory,
            currentIndex: this.currentIndex,
            wordsFound: this.wordsFound,
            totalWords: this.totalWords,
            completedWords: Array.from(this.completedWords),
            categoryWords: [...this.categoryWords]
        };
    }
    
    restoreModeSpecificState(gameState) {
        // Restaurer l'état de progression dans la catégorie
        this.selectedCategory = gameState.selectedCategory;
        this.currentIndex = gameState.currentIndex;
        this.wordsFound = gameState.wordsFound;
        this.totalWords = gameState.totalWords;
        this.completedWords = new Set(gameState.completedWords);
        this.categoryWords = [...gameState.categoryWords];
    }
    
    // ===== MÉTHODES SPÉCIFIQUES AU MODE CATÉGORIE ===== //
    
    startGame(categoryName = null, clearSave = true) {
        if (categoryName) {
            this.selectedCategory = categoryName;
        }
        
        // Supprimer la sauvegarde seulement si demandé explicitement
        if (clearSave) {
            this.saveManager.clearSave();
        }
        
        // Vérifier que le gameEngine est prêt
        if (!this.gameEngine || !this.gameEngine.categories || this.gameEngine.categories.length === 0) {
            console.error('❌ GameEngine non prêt pour le mode catégorie');
            setTimeout(() => this.startGame(), 500); // Réessayer dans 500ms
            return;
        }
        
        this.loadCategoryWords();
        
        if (this.categoryWords.length === 0) {
            console.error('❌ Aucun mot dans la catégorie sélectionnée');
            return;
        }
        
        this.currentIndex = 0;
        this.wordsFound = 0;
        this.completedWords.clear();
        
        // Sauvegarder les paramètres
        if (this.app) {
            this.app.setLastGameSettings('category', null);
        }
        
        // Démarrer avec le premier mot
        this.startNextWord();
        this.updateDisplay();
        
        // Créer la première sauvegarde
        setTimeout(() => {
            this.saveGameState();
        }, 100);
    }
    
    loadCategoryWords() {
        // Charger tous les mots de la catégorie sélectionnée
        console.log('🔍 loadCategoryWords() appelé');
        console.log('📊 État:', {
            gameEngine: !!this.gameEngine,
            categories: this.gameEngine ? this.gameEngine.categories?.length : 'N/A',
            selectedCategory: this.selectedCategory
        });
        
        if (this.gameEngine && this.gameEngine.categories) {
            console.log(`🔍 Recherche de la catégorie: "${this.selectedCategory}"`);
            
            const category = this.gameEngine.categories.find(cat => cat.nom === this.selectedCategory);
            if (category) {
                this.categoryWords = [...category.mots];
                this.totalWords = this.categoryWords.length;
            } else {
                console.error(`❌ Catégorie "${this.selectedCategory}" non trouvée`);
            }
        } else {
            console.error('❌ GameEngine ou categories non disponibles');
        }
    }
    
    startNextWord() {
        if (this.currentIndex >= this.categoryWords.length) {
            this.completeCategoryChallenge();
            return;
        }
        
        const word = this.categoryWords[this.currentIndex];
        if (this.gameEngine) {
            this.gameEngine.setSpecificWord(word, this.selectedCategory);
        }
    }
    
    onWordWin(word, category, errorsCount) {
        this.wordsFound++;
        this.completedWords.add(word);
        this.currentIndex++;
        
        // Message de progression
        if (this.app.getUIModule()) {
            const progress = `${this.wordsFound}/${this.totalWords}`;
            let message = `"${word}" trouvé ! (${progress})`;
            if (errorsCount === 0) {
                message += ' 🌟';
            }
            this.app.getUIModule().showToast(message, 'win', 2000);
        }
        
        // Sauvegarder l'état
        this.saveGameState();
        
        // Passer au mot suivant après un délai (méthode commune)
        this.scheduleNextWord(() => {
            this.startNextWord();
            this.updateDisplay();
        }, 2000);
    }
    
    onWordLoss(word) {
        // En mode catégorie, on passe automatiquement au suivant même en cas d'échec
        this.currentIndex++;
        
        // Message d'échec
        if (this.app.getUIModule()) {
            const progress = `${this.wordsFound}/${this.totalWords}`;
            const message = `"${word}" raté... (${progress})`;
            this.app.getUIModule().showToast(message, 'lose', 2000);
        }
        
        // Sauvegarder l'état
        this.saveGameState();
        
        // Passer au mot suivant (méthode commune)
        this.scheduleNextWord(() => {
            this.startNextWord();
            this.updateDisplay();
        }, 2000);
    }
    
    completeCategoryChallenge() {
        const percentage = Math.round((this.wordsFound / this.totalWords) * 100);
        
        let message = `🎊 Catégorie "${this.selectedCategory}" terminée !\n`;
        message += `🎯 Score : ${this.wordsFound}/${this.totalWords} (${percentage}%)`;
        
        if (percentage === 100) {
            message = `🏆 PARFAIT ! Catégorie "${this.selectedCategory}" 100% réussie !`;
        } else if (percentage >= 80) {
            message += `\n🌟 Excellent !`;
        } else if (percentage >= 60) {
            message += `\n👍 Bien joué !`;
        }
        
        if (this.app.getUIModule()) {
            this.app.getUIModule().showToast(message, 'category-complete', 6000);
        }
        
        console.log(`📊 Catégorie terminée : ${percentage}% (${this.wordsFound}/${this.totalWords})`);
    }
    
    setupUI() {
        // Configuration spécifique au mode catégorie
        const timeAttackCard = document.getElementById('timeAttackCard');
        const progressCard = document.getElementById('progressCard');
        const streakCard = document.getElementById('streakCard');
        
        if (timeAttackCard) timeAttackCard.classList.add('hidden');
        if (progressCard) progressCard.classList.remove('hidden');
        if (streakCard) streakCard.classList.add('hidden');
        
        this.updateDisplay();
    }
    
    
    updateDisplay() {
        // Mettre à jour la progression
        const progressDisplay = document.getElementById('wordsProgress');
        if (progressDisplay) {
            progressDisplay.textContent = `${this.wordsFound}/${this.totalWords}`;
        }
        
        // Optionnel : afficher la catégorie actuelle
        const categoryDisplay = document.getElementById('categoryName');
        if (categoryDisplay && this.selectedCategory) {
            categoryDisplay.textContent = this.selectedCategory;
        }
    }
    
    setCategory(categoryName) {
        this.selectedCategory = categoryName;
    }
    
    getSelectedCategory() {
        return this.selectedCategory;
    }
    
    getProgress() {
        return {
            found: this.wordsFound,
            total: this.totalWords,
            percentage: this.totalWords > 0 ? Math.round((this.wordsFound / this.totalWords) * 100) : 0
        };
    }
    
    cleanup() {
        super.cleanup(); // Appel de la méthode de base qui sauvegarde
        
        // Nettoyage spécifique au mode catégorie
        this.selectedCategory = null;
        this.categoryWords = [];
        this.currentIndex = 0;
        this.wordsFound = 0;
        this.totalWords = 0;
        this.completedWords.clear();
    }
}