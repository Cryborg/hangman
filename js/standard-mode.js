/* ===== STANDARD-MODE.JS - MODE DE JEU CLASSIQUE ===== */

/**
 * Mode Standard - Jeu classique sans limite de temps
 */
class StandardMode extends BaseGameModeWithSave {
    constructor(app, gameEngine) {
        super(app, gameEngine, 'pendu_current_game');
        this.name = 'standard';
    }
    
    // ===== MÉTHODES ABSTRAITES IMPLÉMENTÉES ===== //
    
    formatResumeData(gameState) {
        const wordProgress = SaveGameManager.formatWordProgress(
            gameState.currentWord, 
            gameState.guessedLetters,
            gameState.difficultyOptions || {}
        );
        const message = `Une partie est en cours :<br><br><strong>"${wordProgress}"</strong><br><em>${gameState.currentCategory}</em><br><br>Reprendre ?`;
        return { message };
    }
    
    getStartGameParams() {
        return true; // clearSave par défaut
    }
    
    getGameStateForSave() {
        if (!this.gameEngine || !this.gameEngine.gameActive) {
            return null;
        }
        
        return {
            currentWord: this.gameEngine.currentWord,
            currentCategory: this.gameEngine.currentCategory,
            guessedLetters: [...this.gameEngine.guessedLetters],
            wrongLetters: [...this.gameEngine.wrongLetters],
            remainingTries: this.gameEngine.remainingTries,
            // Sauvegarder les options de difficulté
            difficultyOptions: {
                accents: document.getElementById('accentDifficulty')?.checked || false,
                numbers: document.getElementById('numberDifficulty')?.checked || false
            }
        };
    }
    
    restoreModeSpecificState(gameState) {
        // Restaurer les options de difficulté si elles sont sauvegardées
        if (gameState.difficultyOptions) {
            const accentCheckbox = document.getElementById('accentDifficulty');
            const numberCheckbox = document.getElementById('numberDifficulty');
            
            if (accentCheckbox) {
                accentCheckbox.checked = gameState.difficultyOptions.accents;
            }
            if (numberCheckbox) {
                numberCheckbox.checked = gameState.difficultyOptions.numbers;
            }
            
        }
    }
    
    // ===== MÉTHODES SPÉCIFIQUES AU MODE STANDARD ===== //
    
    startGame(clearSave = true) {
        // Montrer le bouton "Passer" dès le début en mode standard
        this.app.showNextWordButton();
        
        // Supprimer la sauvegarde seulement si demandé explicitement
        if (clearSave) {
            this.saveManager.clearSave();
        }
        if (this.gameEngine) {
            this.gameEngine.startNewGame();
        }
        // La sauvegarde sera créée lors de la première tentitative
    }
    
    onWordWin(word, category, errorsCount) {
        // Traitement classique des statistiques
        let newAchievements = [];
        if (this.app.getStatsModule()) {
            newAchievements = this.app.getStatsModule().onGameWin(
                word, category, errorsCount
            );
        }
        
        // Animation de victoire
        if (this.app.getUIModule()) {
            this.app.getUIModule().celebrateWin();
            
            let message = `Bravo ! "${word}" trouvé !`;
            if (errorsCount === 0) {
                message += ' (Parfait !)';
            }
            
            this.app.getUIModule().showToast(message, 'win', 2500);
        }
        
        // Afficher les nouveaux achievements
        if (newAchievements.length > 0 && this.app.getUIModule()) {
            setTimeout(() => {
                newAchievements.forEach((achievement, index) => {
                    setTimeout(() => {
                        this.app.getUIModule().showToast(
                            `${achievement.title} débloqué !`,
                            'achievement',
                            3000
                        );
                    }, index * 1000);
                });
            }, 2000);
        }
        
        // Afficher le bouton "Mot suivant"
        this.app.showNextWordButton();
        
        // Passer au mot suivant automatiquement (méthode commune)
        this.scheduleNextWord(() => {
            // this.app.hideNextWordButton(); // Garder le bouton visible
            if (this.gameEngine) {
                this.gameEngine.startNewGame();
            }
        }, 3000);
        
        this.updateDisplay();
    }
    
    onWordLoss(word) {
        // Traitement classique des statistiques
        if (this.app.getStatsModule()) {
            this.app.getStatsModule().onGameLoss();
        }
        
        // Message de défaite
        if (this.app.getUIModule()) {
            const message = `Perdu ! Le mot était "${word}"`;
            this.app.getUIModule().showToast(message, 'lose', 5000);
        }
        
        // Afficher le bouton "Mot suivant"
        this.app.showNextWordButton();
        
        // Passer au mot suivant automatiquement après un échec aussi
        this.scheduleNextWord(() => {
            // this.app.hideNextWordButton(); // Garder le bouton visible
            if (this.gameEngine) {
                this.gameEngine.startNewGame();
            }
        }, 5000); // 5 secondes pour laisser le temps de voir le mot
        
        this.updateDisplay();
    }
    
    setupUI() {
        // Masquer les éléments spécifiques aux autres modes
        const timeAttackCard = document.getElementById('timeAttackCard');
        if (timeAttackCard) {
            timeAttackCard.classList.add('hidden');
        }
        
        // Afficher les éléments du mode standard
        const progressCard = document.getElementById('progressCard');
        const streakCard = document.getElementById('streakCard');
        
        if (progressCard) progressCard.classList.remove('hidden');
        if (streakCard) streakCard.classList.remove('hidden');
        
    }
    
    
    updateDisplay() {
        // Mettre à jour l'affichage de la série
        if (this.gameEngine) {
            this.gameEngine.updateStreakDisplay();
        }
    }

    // ===== MÉTHODE POUR PASSER UN MOT ===== //
    
    goToNextWord() {
        // Ne pas cacher le bouton en mode standard, on veut qu'il reste visible
        // this.app.hideNextWordButton(); // Commenté volontairement
        
        // Passer au mot suivant sans compter comme défaite
        if (this.gameEngine) {
            this.app.uiModule.showToast('Mot passé !', 'info', 1500);
            this.gameEngine.startNewGame();
            // Sauvegarder le nouvel état
            this.saveGameState();
        }
    }
}