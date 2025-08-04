/* ===== TIMEATTACK.JS - GESTION DU MODE TIME ATTACK ===== */

class TimeAttackMode {
    constructor(app) {
        this.app = app;
        
        // État du mode Time Attack
        this.isActive = false;
        this.duration = 60; // Durée en secondes (par défaut 1 minute)
        this.timeRemaining = 0;
        this.score = 0;
        this.wordsFound = [];
        this.timer = null;
        this.selectedTime = 1; // Durée sélectionnée en minutes
        
        // Highscores par durée
        this.highscores = this.loadHighscores();
        
        // Références DOM
        this.modal = null;
        this.timerDisplay = null;
        this.scoreDisplay = null;
        this.currentHighscoreDisplay = null;
        this.timeButtons = null;
        
        this.initializeDOMReferences();
        this.initializeEventListeners();
    }
    
    initializeDOMReferences() {
        this.modal = document.getElementById('gameModeModal');
        this.timerDisplay = document.getElementById('timerDisplay');
        this.scoreDisplay = document.getElementById('scoreDisplay');
        this.currentHighscoreDisplay = document.getElementById('currentHighscore');
        this.timeButtons = document.querySelectorAll('.time-btn');
        
        // Cards
        this.progressCard = document.getElementById('progressCard');
        this.streakCard = document.getElementById('streakCard');
        this.timeAttackCard = document.getElementById('timeAttackCard');
    }
    
    initializeEventListeners() {
        // Boutons de sélection du temps
        this.timeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectTime(parseInt(e.target.dataset.time));
            });
        });
        
        // Boutons de sélection du mode
        const selectModeBtns = document.querySelectorAll('.select-mode-btn');
        selectModeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                this.selectGameMode(mode);
            });
        });
        
        // Bouton de fermeture de la modal
        const closeModalBtn = document.querySelector('.close-modal-btn');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.closeModal());
        }
        
        // Clic en dehors de la modal
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.closeModal();
                }
            });
        }
    }
    
    // ===== GESTION DE LA MODAL ===== //
    
    showModal() {
        if (this.modal) {
            this.modal.classList.add('active');
            this.updateHighscorePreview();
        }
    }
    
    closeModal() {
        if (this.modal) {
            this.modal.classList.remove('active');
        }
    }
    
    selectTime(minutes) {
        this.selectedTime = minutes;
        this.duration = minutes * 60;
        
        // Mettre à jour l'UI
        this.timeButtons.forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.dataset.time) === minutes) {
                btn.classList.add('active');
            }
        });
        
        // Mettre à jour l'affichage du highscore
        this.updateHighscorePreview();
    }
    
    updateHighscorePreview() {
        const highscoreDisplay = document.getElementById('timeAttackHighscore');
        if (highscoreDisplay) {
            const highscore = this.highscores[`${this.selectedTime}min`] || 0;
            highscoreDisplay.textContent = highscore > 0 ? `${highscore} mots` : 'Aucun';
        }
    }
    
    selectGameMode(mode) {
        this.closeModal();
        
        if (mode === 'timeattack') {
            // Enregistrer les paramètres Time Attack
            if (this.app) {
                this.app.setLastGameSettings('timeattack', this.selectedTime);
            }
            this.startTimeAttack();
        } else {
            // Enregistrer les paramètres Standard
            if (this.app) {
                this.app.setLastGameSettings('standard');
            }
            this.startStandardMode();
        }
        
        // Naviguer vers la vue jeu
        if (this.app) {
            this.app.showView('game');
        }
    }
    
    // ===== MODE TIME ATTACK ===== //
    
    startTimeAttack() {
        this.isActive = true;
        this.score = 0;
        this.wordsFound = [];
        this.timeRemaining = this.duration;
        
        // Configurer l'interface
        this.setupTimeAttackUI();
        
        // Démarrer le timer
        this.startTimer();
        
        // Notifier le module de jeu
        if (this.app.getGameModule()) {
            this.app.getGameModule().setGameMode('timeattack');
        }
        
        console.log(`⏱️ Time Attack démarré : ${this.selectedTime} minute(s)`);
    }
    
    startStandardMode() {
        this.isActive = false;
        
        // Réinitialiser l'interface
        this.setupStandardUI();
        
        // Notifier le module de jeu
        if (this.app.getGameModule()) {
            this.app.getGameModule().setGameMode('standard');
        }
        
        console.log('🎲 Mode Standard activé');
    }
    
    setupTimeAttackUI() {
        // Masquer progression et série, afficher Time Attack
        if (this.progressCard) this.progressCard.classList.add('hidden');
        if (this.streakCard) this.streakCard.classList.add('hidden');
        if (this.timeAttackCard) this.timeAttackCard.classList.remove('hidden');
        
        // Mettre à jour les affichages
        this.updateDisplay();
        
        // Afficher le highscore actuel
        const highscore = this.highscores[`${this.selectedTime}min`] || 0;
        if (this.currentHighscoreDisplay) {
            this.currentHighscoreDisplay.textContent = highscore;
        }
    }
    
    setupStandardUI() {
        // Afficher progression et série, masquer Time Attack
        if (this.progressCard) this.progressCard.classList.remove('hidden');
        if (this.streakCard) this.streakCard.classList.remove('hidden');
        if (this.timeAttackCard) this.timeAttackCard.classList.add('hidden');
    }
    
    // ===== GESTION DU TIMER ===== //
    
    startTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        this.timer = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();
            
            // Avertissement dernières 10 secondes
            if (this.timeRemaining <= 10 && this.timeRemaining > 0) {
                if (this.timerDisplay) {
                    this.timerDisplay.classList.add('warning');
                }
                
                // Son d'avertissement (optionnel)
                if (this.timeRemaining === 10) {
                    if (this.app.getUIModule()) {
                        this.app.getUIModule().showToast('⚠️ Plus que 10 secondes !', 'warning', 2000);
                    }
                }
            }
            
            // Fin du temps
            if (this.timeRemaining <= 0) {
                this.endTimeAttack();
            }
        }, 1000);
    }
    
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    
    updateTimerDisplay() {
        if (this.timerDisplay) {
            const minutes = Math.floor(this.timeRemaining / 60);
            const seconds = this.timeRemaining % 60;
            this.timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    // ===== GESTION DU SCORE ===== //
    
    addScore(word) {
        if (!this.isActive) return;
        
        // Éviter les doublons
        if (this.wordsFound.includes(word)) return;
        
        this.wordsFound.push(word);
        this.score++;
        this.updateDisplay();
        
        // Bonus pour les mots longs
        const bonusPoints = word.length > 8 ? 2 : 1;
        
        // Animation de score
        if (this.app.getUIModule()) {
            this.app.getUIModule().showToast(`+${bonusPoints} point${bonusPoints > 1 ? 's' : ''} !`, 'success', 1500);
        }
    }
    
    updateDisplay() {
        if (this.scoreDisplay) {
            this.scoreDisplay.textContent = this.score;
        }
    }
    
    // ===== FIN DU TIME ATTACK ===== //
    
    endTimeAttack() {
        this.stopTimer();
        this.isActive = false;
        
        // Vérifier si c'est un nouveau record
        const isNewRecord = this.checkAndSaveHighscore();
        
        // Afficher les résultats
        this.showResults(isNewRecord);
        
        // Désactiver le jeu
        if (this.app.getGameModule()) {
            this.app.getGameModule().endGame();
        }
    }
    
    checkAndSaveHighscore() {
        const key = `${this.selectedTime}min`;
        const previousHighscore = this.highscores[key] || 0;
        
        if (this.score > previousHighscore) {
            this.highscores[key] = this.score;
            this.saveHighscores();
            return true;
        }
        
        return false;
    }
    
    showResults(isNewRecord) {
        let message = `⏱️ Time Attack terminé !\n`;
        message += `Score : ${this.score} mot${this.score > 1 ? 's' : ''}`;
        
        if (isNewRecord) {
            message += `\n🏆 NOUVEAU RECORD !`;
            
            if (this.app.getUIModule()) {
                // Confettis ou animation spéciale
                this.app.getUIModule().celebrateWin();
            }
        }
        
        // Afficher le toast de résultat
        if (this.app.getUIModule()) {
            this.app.getUIModule().showToast(message, isNewRecord ? 'win' : 'info', 5000);
        }
        
        // Proposer de rejouer ou retourner au menu
        setTimeout(() => {
            if (this.app.getUIModule()) {
                this.app.getUIModule().showToast('Voulez-vous rejouer ?', 'info', 3000);
            }
        }, 3000);
    }
    
    // ===== GESTION DES HIGHSCORES ===== //
    
    loadHighscores() {
        const saved = localStorage.getItem('pendu_timeattack_highscores');
        return saved ? JSON.parse(saved) : {
            '1min': 0,
            '2min': 0,
            '3min': 0,
            '5min': 0
        };
    }
    
    saveHighscores() {
        localStorage.setItem('pendu_timeattack_highscores', JSON.stringify(this.highscores));
    }
    
    getHighscore(duration) {
        return this.highscores[`${duration}min`] || 0;
    }
    
    // ===== MÉTHODES PUBLIQUES ===== //
    
    isTimeAttackActive() {
        return this.isActive;
    }
    
    onWordFound(word) {
        if (this.isActive) {
            this.addScore(word);
        }
    }
    
    onWordFailed() {
        // En Time Attack, on passe directement au mot suivant
        if (this.isActive && this.app.getGameModule()) {
            // Petit délai avant le prochain mot
            setTimeout(() => {
                this.app.getGameModule().startNewGame();
            }, 1000);
        }
    }
    
    reset() {
        this.stopTimer();
        this.isActive = false;
        this.score = 0;
        this.wordsFound = [];
        this.timeRemaining = 0;
        
        if (this.timerDisplay) {
            this.timerDisplay.classList.remove('warning');
        }
    }
    
    // Reset des highscores (pour debug)
    resetHighscores() {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les records Time Attack ?')) {
            this.highscores = {
                '1min': 0,
                '2min': 0,
                '3min': 0,
                '5min': 0
            };
            this.saveHighscores();
            console.log('🗑️ Records Time Attack réinitialisés');
        }
    }
}