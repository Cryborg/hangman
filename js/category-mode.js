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
        this.failedWords = new Set(); // Mots ratés définitivement éliminés
        this.isSecondPass = false; // Pour savoir si on refait les mots réussis
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
        // Montrer le bouton "Passer" dès le début en mode catégorie
        this.app.showNextWordButton();
        
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
        this.failedWords.clear();
        this.isSecondPass = false;
        
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
        
        if (this.gameEngine && this.gameEngine.categories) {
            
            const category = this.gameEngine.categories.find(cat => cat.name === this.selectedCategory);
            if (category) {
                this.categoryWords = [...category.words];
                this.totalWords = this.categoryWords.length;
            } else {
                console.error(`❌ Catégorie "${this.selectedCategory}" non trouvée`);
            }
        } else {
            console.error('❌ GameEngine ou categories non disponibles');
        }
    }
    
    startNextWord() {
        // Si on a terminé tous les mots de la liste actuelle
        if (this.currentIndex >= this.categoryWords.length) {
            if (!this.isSecondPass && this.completedWords.size > 0) {
                // Première fois qu'on termine : reprendre les mots réussis
                this.startSecondPass();
                return;
            } else {
                // Vraiment terminé (soit pas de mots réussis, soit 2ème passage terminé)
                this.completeCategoryChallenge();
                return;
            }
        }
        
        const word = this.categoryWords[this.currentIndex];
        if (this.gameEngine) {
            this.gameEngine.setSpecificWord(word, this.selectedCategory);
        }
    }
    
    startSecondPass() {
        // Reprendre seulement les mots réussis (pas les ratés)
        this.categoryWords = Array.from(this.completedWords);
        this.currentIndex = 0;
        this.isSecondPass = true;
        
        
        if (this.app.getUIModule()) {
            this.app.getUIModule().showToast(
                '🔄 Recommençons avec les mots trouvés !', 
                'info', 
                3000
            );
        }
        
        // Démarrer le premier mot du 2ème passage
        this.startNextWord();
    }
    
    onWordWin(word, category, errorsCount) {
        if (!this.isSecondPass) {
            // Premier passage : compter et ajouter aux mots réussis
            this.wordsFound++;
            this.completedWords.add(word);
        }
        this.currentIndex++;
        
        // Message de progression
        if (this.app.getUIModule()) {
            let progress, message;
            if (this.isSecondPass) {
                progress = `Révision ${this.currentIndex}/${this.categoryWords.length}`;
                message = `"${word}" retrouvé ! (${progress})`;
            } else {
                progress = `${this.wordsFound}/${this.totalWords}`;
                message = `"${word}" trouvé ! (${progress})`;
            }
            if (errorsCount === 0) {
                message += ' 🌟';
            }
            this.app.getUIModule().showToast(message, 'win', 2000);
        }
        
        // Afficher le bouton "Mot suivant"
        this.app.showNextWordButton();
        
        // Sauvegarder l'état
        this.saveGameState();
        
        // Passer au mot suivant après un délai (méthode commune)
        this.scheduleNextWord(() => {
            // this.app.hideNextWordButton(); // Garder le bouton visible
            this.startNextWord();
            this.updateDisplay();
        }, 2000);
    }
    
    onWordLoss(word) {
        // En mode catégorie, on passe automatiquement au suivant même en cas d'échec
        if (!this.isSecondPass) {
            // Premier passage : marquer comme raté définitivement
            this.failedWords.add(word);
        }
        this.currentIndex++;
        
        // Message d'échec
        if (this.app.getUIModule()) {
            let progress, message;
            if (this.isSecondPass) {
                progress = `Révision ${this.currentIndex}/${this.categoryWords.length}`;
                message = `"${word}" raté en révision... (${progress})`;
            } else {
                progress = `${this.wordsFound}/${this.totalWords}`;
                message = `"${word}" raté... (${progress})`;
            }
            this.app.getUIModule().showToast(message, 'lose', 2000);
        }
        
        // Afficher le bouton "Mot suivant"
        this.app.showNextWordButton();
        
        // Sauvegarder l'état
        this.saveGameState();
        
        // Passer au mot suivant (méthode commune)
        this.scheduleNextWord(() => {
            // this.app.hideNextWordButton(); // Garder le bouton visible
            this.startNextWord();
            this.updateDisplay();
        }, 2000);
    }
    
    goToNextWord() {
        // Ne pas cacher le bouton en mode catégorie, on veut qu'il reste visible
        // this.app.hideNextWordButton(); // Commenté volontairement
        
        // Afficher un toast pour indiquer que le mot a été passé
        this.app.uiModule.showToast('Mot passé ! (reviendra plus tard)', 'info', 2000);
        
        // Passer au mot suivant en mode catégorie
        this.startNextWord();
        this.updateDisplay();
    }
    
    completeCategoryChallenge() {
        const percentage = Math.round((this.wordsFound / this.totalWords) * 100);
        
        let message = `🎊 Catégorie "${this.selectedCategory}" terminée !\n`;
        message += `🎯 Score : ${this.wordsFound}/${this.totalWords} (${percentage}%)`;
        
        if (this.isSecondPass) {
            message = `🏁 Révision de "${this.selectedCategory}" terminée !`;
        } else if (percentage === 100) {
            message = `🏆 PARFAIT ! Catégorie "${this.selectedCategory}" 100% réussie !`;
        } else if (percentage >= 80) {
            message += `\n🌟 Excellent !`;
        } else if (percentage >= 60) {
            message += `\n👍 Bien joué !`;
        }
        
        if (this.app.getUIModule()) {
            this.app.getUIModule().showToast(message, 'category-complete', 6000);
        }
        
    }
    
    setupUI() {
        // Configuration spécifique au mode catégorie
        const timeAttackCard = window.domManager.getById('timeAttackCard');
        const progressCard = window.domManager.getById('progressCard');
        const streakCard = window.domManager.getById('streakCard');
        
        if (timeAttackCard) timeAttackCard.classList.add('hidden');
        if (progressCard) progressCard.classList.remove('hidden');
        if (streakCard) streakCard.classList.add('hidden');
        
        this.updateDisplay();
    }
    
    
    updateDisplay() {
        // Mettre à jour la progression
        const progressDisplay = window.domManager.getById('wordsProgress');
        if (progressDisplay) {
            progressDisplay.textContent = `${this.wordsFound}/${this.totalWords}`;
        }
        
        // Optionnel : afficher la catégorie actuelle
        const categoryDisplay = window.domManager.getById('categoryName');
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