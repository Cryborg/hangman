/* ===== TIMEATTACK-MODE.JS - MODE COURSE CONTRE LA MONTRE ===== */

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
            this.app.getUIModule().showToast(`"${word}"`, 'win', 800);
        }
        
        // Passer au mot suivant rapidement (méthode commune)
        this.scheduleNextWord(() => {
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
            this.app.getUIModule().showToast(`"${word}"`, 'lose', 1000);
        }
        
        // Passer au mot suivant
        setTimeout(() => {
            if (this.isActive && this.gameEngine) {
                this.gameEngine.startNewGame();
            }
        }, 1000);
    }
    
    setupUI() {
        // Masquer le bouton "Mot suivant" (pas utilisé en Time Attack)
        this.app.hideNextWordButton();
        
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
    }
}