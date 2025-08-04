/* ===== GAME-MODES.JS - ARCHITECTURE MODULAIRE DES MODES DE JEU ===== */

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
}

/**
 * Mode Standard - Jeu classique sans limite de temps
 */
class StandardMode extends BaseGameMode {
    constructor(app, gameEngine) {
        super(app, gameEngine);
        this.name = 'standard';
    }
    
    initialize() {
        console.log('🎲 Initialisation du mode Standard');
        this.setupUI();
    }
    
    startGame() {
        // Démarrer une partie normale
        if (this.gameEngine) {
            this.gameEngine.startNewGame();
        }
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
            
            let message = `🎉 Bravo ! "${word}" trouvé !`;
            if (errorsCount === 0) {
                message += ' (Parfait !)';
            }
            
            this.app.getUIModule().showToast(message, 'win', 4000);
        }
        
        // Afficher les nouveaux achievements
        if (newAchievements.length > 0 && this.app.getUIModule()) {
            setTimeout(() => {
                newAchievements.forEach((achievement, index) => {
                    setTimeout(() => {
                        this.app.getUIModule().showToast(
                            `🏆 ${achievement.title} débloqué !`,
                            'achievement',
                            3000
                        );
                    }, index * 1000);
                });
            }, 2000);
        }
        
        this.updateDisplay();
    }
    
    onWordLoss(word) {
        // Traitement classique des statistiques
        if (this.app.getStatsModule()) {
            this.app.getStatsModule().onGameLoss();
        }
        
        // Message de défaite
        if (this.app.getUIModule()) {
            const message = `😞 Perdu ! Le mot était "${word}"`;
            this.app.getUIModule().showToast(message, 'lose', 5000);
        }
        
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
        
        // Configurer la visibilité des boutons
        this.updateButtonsVisibility();
    }
    
    updateButtonsVisibility() {
        const restartBtn = document.getElementById('restartGameBtn');
        if (restartBtn) {
            restartBtn.style.display = 'none';
        }
    }
    
    updateDisplay() {
        // Mettre à jour l'affichage de la série
        if (this.gameEngine) {
            this.gameEngine.updateStreakDisplay();
        }
    }
    
    cleanup() {
        console.log('🧹 Nettoyage du mode Standard');
    }
}

/**
 * Mode Time Attack - Course contre la montre
 */
class TimeAttackGameMode extends BaseGameMode {
    constructor(app, gameEngine) {
        super(app, gameEngine);
        this.name = 'timeattack';
        this.score = 0;
        this.timeRemaining = 0;
        this.selectedDuration = 1; // minutes
        this.timer = null;
        this.isActive = false;
    }
    
    initialize() {
        console.log('⏱️ Initialisation du mode Time Attack');
        this.setupUI();
    }
    
    startGame() {
        this.score = 0;
        this.timeRemaining = this.selectedDuration * 60; // convertir en secondes
        this.isActive = true;
        
        // Sauvegarder les paramètres
        if (this.app) {
            this.app.setLastGameSettings('timeattack', this.selectedDuration);
        }
        
        // Démarrer le timer
        this.startTimer();
        
        // Démarrer la première partie
        if (this.gameEngine) {
            this.gameEngine.startNewGame();
        }
        
        this.updateDisplay();
    }
    
    onWordWin(word, category, errorsCount) {
        if (!this.isActive) return;
        
        // Augmenter le score
        this.score++;
        
        // Message rapide
        if (this.app.getUIModule()) {
            this.app.getUIModule().showToast(`✅ "${word}"`, 'win', 800);
        }
        
        // Passer au mot suivant rapidement
        setTimeout(() => {
            if (this.isActive && this.gameEngine) {
                this.gameEngine.startNewGame();
            }
        }, 800);
        
        this.updateDisplay();
    }
    
    onWordLoss(word) {
        if (!this.isActive) return;
        
        // Message rapide d'échec
        if (this.app.getUIModule()) {
            this.app.getUIModule().showToast(`❌ "${word}"`, 'lose', 1000);
        }
        
        // Passer au mot suivant
        setTimeout(() => {
            if (this.isActive && this.gameEngine) {
                this.gameEngine.startNewGame();
            }
        }, 1000);
    }
    
    setupUI() {
        // Afficher la carte Time Attack
        const timeAttackCard = document.getElementById('timeAttackCard');
        if (timeAttackCard) {
            timeAttackCard.classList.remove('hidden');
        }
        
        // Masquer les autres cartes
        const progressCard = document.getElementById('progressCard');
        const streakCard = document.getElementById('streakCard');
        
        if (progressCard) progressCard.classList.add('hidden');
        if (streakCard) streakCard.classList.add('hidden');
        
        this.updateButtonsVisibility();
        this.updateDisplay();
    }
    
    updateButtonsVisibility() {
        const restartBtn = document.getElementById('restartGameBtn');
        if (restartBtn) {
            restartBtn.style.display = 'inline-block';
        }
    }
    
    startTimer() {
        this.timer = setInterval(() => {
            this.timeRemaining--;
            this.updateDisplay();
            
            if (this.timeRemaining <= 0) {
                this.endTimeAttack();
            }
        }, 1000);
    }
    
    endTimeAttack() {
        this.isActive = false;
        
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        // Arrêter le jeu
        if (this.gameEngine) {
            this.gameEngine.endGame();
        }
        
        // Sauvegarder le score
        this.saveHighscore();
        
        // Afficher le résultat final
        this.showFinalResults();
    }
    
    saveHighscore() {
        const key = `timeattack_highscore_${this.selectedDuration}min`;
        const currentBest = parseInt(localStorage.getItem(key) || '0');
        
        if (this.score > currentBest) {
            localStorage.setItem(key, this.score.toString());
            console.log(`🏆 Nouveau record ${this.selectedDuration}min : ${this.score} mots !`);
        }
    }
    
    showFinalResults() {
        const key = `timeattack_highscore_${this.selectedDuration}min`;
        const highscore = parseInt(localStorage.getItem(key) || '0');
        
        let message = `⏰ Temps écoulé !\n🎯 Score: ${this.score} mots\n🏆 Record: ${highscore} mots`;
        
        if (this.score === highscore && this.score > 0) {
            message = `🎉 NOUVEAU RECORD !\n🎯 Score: ${this.score} mots`;
        }
        
        if (this.app.getUIModule()) {
            this.app.getUIModule().showToast(message, 'timeattack-end', 6000);
        }
    }
    
    updateDisplay() {
        // Mettre à jour le timer
        const timerDisplay = document.getElementById('timerDisplay');
        if (timerDisplay) {
            const minutes = Math.floor(this.timeRemaining / 60);
            const seconds = this.timeRemaining % 60;
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // Mettre à jour le score
        const scoreDisplay = document.getElementById('scoreDisplay');
        if (scoreDisplay) {
            scoreDisplay.textContent = this.score;
        }
        
        // Mettre à jour le record
        const highscoreDisplay = document.getElementById('currentHighscore');
        if (highscoreDisplay) {
            const key = `timeattack_highscore_${this.selectedDuration}min`;
            const highscore = localStorage.getItem(key) || '0';
            highscoreDisplay.textContent = highscore;
        }
    }
    
    setDuration(minutes) {
        this.selectedDuration = minutes;
    }
    
    getDuration() {
        return this.selectedDuration;
    }
    
    isTimeAttackActive() {
        return this.isActive;
    }
    
    cleanup() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.isActive = false;
        console.log('🧹 Nettoyage du mode Time Attack');
    }
}

/**
 * Mode Catégorie - Parcourir tous les mots d'une catégorie
 */
class CategoryMode extends BaseGameMode {
    constructor(app, gameEngine) {
        super(app, gameEngine);
        this.name = 'category';
        this.selectedCategory = null;
        this.categoryWords = [];
        this.currentIndex = 0;
        this.wordsFound = 0;
        this.totalWords = 0;
        this.completedWords = new Set();
    }
    
    initialize() {
        console.log('📚 Initialisation du mode Catégorie');
        this.setupUI();
    }
    
    startGame(categoryName = null) {
        if (categoryName) {
            this.selectedCategory = categoryName;
            this.loadCategoryWords();
        }
        
        if (this.categoryWords.length === 0) {
            console.error('Aucun mot dans la catégorie sélectionnée');
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
    }
    
    loadCategoryWords() {
        // Charger tous les mots de la catégorie sélectionnée
        if (this.gameEngine && this.gameEngine.categories) {
            console.log(`🔍 Recherche de la catégorie: "${this.selectedCategory}"`);
            console.log('📋 Catégories disponibles:', this.gameEngine.categories.map(cat => cat.nom));
            
            const category = this.gameEngine.categories.find(cat => cat.nom === this.selectedCategory);
            if (category) {
                this.categoryWords = [...category.mots];
                this.totalWords = this.categoryWords.length;
                console.log(`📚 Catégorie "${this.selectedCategory}" : ${this.totalWords} mots`);
            } else {
                console.error(`❌ Catégorie "${this.selectedCategory}" non trouvée`);
            }
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
            let message = `✅ "${word}" trouvé ! (${progress})`;
            if (errorsCount === 0) {
                message += ' 🌟';
            }
            this.app.getUIModule().showToast(message, 'win', 2000);
        }
        
        // Passer au mot suivant après un délai
        setTimeout(() => {
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
            const message = `❌ "${word}" raté... (${progress})`;
            this.app.getUIModule().showToast(message, 'lose', 2000);
        }
        
        // Passer au mot suivant
        setTimeout(() => {
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
        
        this.updateButtonsVisibility();
        this.updateDisplay();
    }
    
    updateButtonsVisibility() {
        const restartBtn = document.getElementById('restartGameBtn');
        if (restartBtn) {
            restartBtn.style.display = 'inline-block';
        }
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
        this.selectedCategory = null;
        this.categoryWords = [];
        this.currentIndex = 0;
        this.wordsFound = 0;
        this.totalWords = 0;
        this.completedWords.clear();
        console.log('🧹 Nettoyage du mode Catégorie');
    }
}