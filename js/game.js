/* ===== GAME.JS - LOGIQUE DU JEU DU PENDU ===== */

class PenduGame {
    constructor(app) {
        this.app = app;
        
        // État du jeu
        this.categories = [];
        this.currentWord = '';
        this.currentCategory = '';
        this.guessedLetters = [];
        this.wrongLetters = [];
        this.remainingTries = 6;
        this.gameActive = false;
        this.sessionWords = new Set(); // Mots vus dans cette session
        this.totalWords = 0;
        this.gameMode = 'standard'; // 'standard' ou 'timeattack'
        
        // Références DOM
        this.wordDisplay = null;
        this.wrongLettersDisplay = null;
        this.triesLeftDisplay = null;
        this.progressDisplay = null;
        this.keyboard = null;
        this.newGameBtn = null;
        this.restartGameBtn = null;
        this.categoryDisplay = null;
        this.streakDisplay = null;
        
        this.initializeDOMReferences();
        this.initializeEventListeners();
        this.updateButtonsVisibility();
    }
    
    initializeDOMReferences() {
        this.wordDisplay = document.getElementById('wordDisplay');
        this.wrongLettersDisplay = document.getElementById('wrongLetters');
        this.triesLeftDisplay = document.getElementById('triesLeft');
        this.progressDisplay = document.getElementById('wordsProgress');
        this.keyboard = document.getElementById('keyboard');
        this.newGameBtn = document.getElementById('newGameBtn');
        this.restartGameBtn = document.getElementById('restartGameBtn');
        this.categoryDisplay = document.getElementById('categoryName');
        this.streakDisplay = document.getElementById('streakDisplay');
    }
    
    initializeEventListeners() {
        // Bouton nouvelle partie
        if (this.newGameBtn) {
            this.newGameBtn.addEventListener('click', () => this.startNewGame());
        }
        
        // Bouton redémarrage rapide
        if (this.restartGameBtn) {
            this.restartGameBtn.addEventListener('click', () => {
                if (this.app) {
                    this.app.restartWithSameSettings();
                }
            });
        }
        
        // Clavier physique
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Clavier virtuel (délégation d'événements)
        if (this.keyboard) {
            this.keyboard.addEventListener('click', (e) => {
                if (e.target.tagName === 'BUTTON' && e.target.textContent) {
                    this.handleGuess(e.target.textContent);
                }
            });
        }
    }
    
    async initGame() {
        try {
            await this.loadWords();
            this.updateProgressDisplay();
            this.updateStreakDisplay();
            
            // Créer le clavier virtuel
            if (this.app.getUIModule()) {
                this.app.getUIModule().createVirtualKeyboard();
            }
            
            // Démarrer automatiquement une partie
            this.startNewGame();
            
            console.log('🎮 Jeu initialisé avec succès');
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation du jeu:', error);
            this.showErrorMessage();
        }
    }
    
    async loadWords() {
        try {
            const response = await fetch('words.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.categories = data.categories;
            
            // Calculer le nombre total de mots
            this.totalWords = this.categories.reduce((total, category) => total + category.mots.length, 0);
            
            // Transmettre le total au module stats
            if (this.app.getStatsModule()) {
                this.app.getStatsModule().setTotalWords(this.totalWords);
            }
            
            console.log(`📚 ${this.categories.length} catégories chargées`);
            console.log(`📖 ${this.totalWords} mots disponibles`);
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement des mots:', error);
            throw error;
        }
    }
    
    startNewGame() {
        if (this.categories.length === 0) {
            console.error('Aucune catégorie chargée');
            return;
        }
        
        // Statistiques
        if (this.app.getStatsModule()) {
            this.app.getStatsModule().onGameStart();
        }
        
        // Sélectionner un mot qui n'a pas été vu dans cette session
        this.selectNewWord();
        
        // Réinitialiser l'état du jeu
        this.guessedLetters = [];
        this.wrongLetters = [];
        this.remainingTries = 6;
        this.gameActive = true;
        
        // Réinitialiser l'interface
        this.resetUI();
        this.updateDisplay();
        
        console.log(`🎯 Nouveau mot: ${this.currentWord} (${this.currentCategory})`);
    }
    
    selectNewWord() {
        const maxAttempts = 100;
        let attempts = 0;
        
        do {
            const randomCategory = this.categories[Math.floor(Math.random() * this.categories.length)];
            this.currentCategory = randomCategory.nom;
            this.currentWord = randomCategory.mots[Math.floor(Math.random() * randomCategory.mots.length)];
            attempts++;
        } while (this.sessionWords.has(this.currentWord) && attempts < maxAttempts);
        
        // Ajouter le mot à la session
        this.sessionWords.add(this.currentWord);
        
        // Afficher la catégorie
        if (this.categoryDisplay) {
            this.categoryDisplay.textContent = this.currentCategory;
        }
    }
    
    resetUI() {
        // Réinitialiser le hangman
        if (this.app.getUIModule()) {
            this.app.getUIModule().resetHangman();
            this.app.getUIModule().resetKeyboard();
            this.app.getUIModule().clearGameMessage();
        }
        
        // Rendre visible la structure de base du hangman
        const baseParts = document.querySelectorAll('.part:not(.body-part)');
        baseParts.forEach(part => {
            part.classList.add('visible');
        });
        
        // Réinitialiser l'apparence du mot
        const wordDisplay = document.getElementById('wordDisplay');
        if (wordDisplay) {
            wordDisplay.style.color = '';
            wordDisplay.style.animation = '';
        }
    }
    
    updateDisplay() {
        // Mettre à jour l'affichage du mot
        if (this.app.getUIModule()) {
            this.app.getUIModule().updateWordDisplay(this.currentWord, this.guessedLetters);
            this.app.getUIModule().updateGameStats(this.remainingTries, this.wrongLetters);
        }
        
        this.updateProgressDisplay();
        this.updateStreakDisplay();
    }
    
    updateProgressDisplay() {
        if (!this.app.getStatsModule()) return;
        
        const stats = this.app.getStatsModule().getStats();
        
        if (this.app.getUIModule()) {
            this.app.getUIModule().updateProgress(stats.foundWords, stats.totalWords);
        }
    }
    
    updateStreakDisplay() {
        if (!this.app.getStatsModule()) return;
        
        const stats = this.app.getStatsModule().getStats();
        
        if (this.streakDisplay) {
            this.streakDisplay.textContent = stats.currentStreak;
        }
    }
    
    handleKeyPress(e) {
        if (!this.gameActive) return;
        
        const letter = e.key.toUpperCase();
        
        // Vérifier que c'est une lettre
        if (letter.length === 1 && letter >= 'A' && letter <= 'Z') {
            this.handleGuess(letter);
        }
    }
    
    handleGuess(letter) {
        if (!this.gameActive) return;
        
        letter = letter.toUpperCase();
        
        // Vérifier si la lettre a déjà été essayée
        if (this.guessedLetters.includes(letter) || this.wrongLetters.includes(letter)) {
            if (this.app.getUIModule()) {
                this.app.getUIModule().showToast('Lettre déjà essayée !', 'warning', 2000);
            }
            return;
        }
        
        // Vérifier si la lettre est dans le mot
        if (this.currentWord.toUpperCase().includes(letter)) {
            this.guessedLetters.push(letter);
            
            // Mettre à jour le clavier
            if (this.app.getUIModule()) {
                this.app.getUIModule().updateKeyboardButton(letter, 'correct');
            }
            
            // Vérifier si le mot est complètement trouvé
            if (this.isWordComplete()) {
                this.handleWin();
            }
        } else {
            this.wrongLetters.push(letter);
            this.remainingTries--;
            
            // Mettre à jour le clavier
            if (this.app.getUIModule()) {
                this.app.getUIModule().updateKeyboardButton(letter, 'wrong');
                this.app.getUIModule().showHangmanPart(6 - this.remainingTries - 1);
            }
            
            // Vérifier si le jeu est perdu
            if (this.remainingTries === 0) {
                this.handleLoss();
            }
        }
        
        this.updateDisplay();
    }
    
    isWordComplete() {
        return this.currentWord.toUpperCase().split('').every(letter => {
            // Ignorer les espaces et caractères spéciaux
            if (letter === ' ' || !/[A-Z]/.test(letter)) {
                return true;
            }
            return this.guessedLetters.includes(letter);
        });
    }
    
    handleWin() {
        this.gameActive = false;
        
        // Calculer le nombre d'erreurs
        const errorsCount = this.wrongLetters.length;
        
        // Mode Time Attack : traitement spécial
        if (this.gameMode === 'timeattack' && this.app.getTimeAttackModule()) {
            this.app.getTimeAttackModule().onWordFound(this.currentWord);
            
            // En Time Attack, on passe rapidement au mot suivant
            if (this.app.getTimeAttackModule().isTimeAttackActive()) {
                setTimeout(() => {
                    this.startNewGame();
                }, 800);
                return;
            }
        }
        
        // Mode Standard : traitement normal
        let newAchievements = [];
        if (this.app.getStatsModule() && this.gameMode === 'standard') {
            newAchievements = this.app.getStatsModule().onGameWin(
                this.currentWord, 
                this.currentCategory, 
                errorsCount
            );
        }
        
        // Effets visuels
        if (this.app.getUIModule()) {
            this.app.getUIModule().celebrateWin();
            
            let message = `🎉 Bravo ! "${this.currentWord}" trouvé !`;
            if (errorsCount === 0 && this.gameMode === 'standard') {
                message += ' (Parfait !)';
            }
            
            // Toast plus court en Time Attack
            const duration = this.gameMode === 'timeattack' ? 1500 : 4000;
            this.app.getUIModule().showToast(message, 'win', duration);
        }
        
        // Afficher les nouveaux achievements
        if (newAchievements.length > 0) {
            setTimeout(() => {
                newAchievements.forEach((achievement, index) => {
                    setTimeout(() => {
                        if (this.app.getStatsModule()) {
                            this.app.getStatsModule().showAchievementToast(achievement);
                        }
                    }, index * 1000);
                });
            }, 1500);
        }
        
        // Mettre à jour les affichages
        this.updateProgressDisplay();
        this.updateStreakDisplay();
        
        // Proposer une nouvelle partie après un délai
        setTimeout(() => {
            if (this.app.getUIModule()) {
                this.app.getUIModule().showToast('Prêt pour un nouveau défi ?', 'info', 3000);
            }
        }, 3000);
        
        console.log(`✅ Victoire ! Mot: ${this.currentWord}, Erreurs: ${errorsCount}`);
    }
    
    handleLoss() {
        this.gameActive = false;
        
        // Révéler le mot complet avant tout traitement
        this.revealCompleteWord();
        
        // Mode Time Attack : traitement spécial
        if (this.gameMode === 'timeattack' && this.app.getTimeAttackModule()) {
            this.app.getTimeAttackModule().onWordFailed();
            
            // En Time Attack, on passe rapidement au mot suivant
            if (this.app.getTimeAttackModule().isTimeAttackActive()) {
                if (this.app.getUIModule()) {
                    this.app.getUIModule().showToast(`❌ "${this.currentWord}"`, 'lose', 1000);
                }
                return; // Le Time Attack gérera le prochain mot
            }
        }
        
        // Mode Standard : traitement normal
        if (this.app.getStatsModule() && this.gameMode === 'standard') {
            this.app.getStatsModule().onGameLoss();
        }
        
        // Afficher le message de défaite
        if (this.app.getUIModule()) {
            const message = `😞 Perdu ! Le mot était "${this.currentWord}"`;
            const duration = this.gameMode === 'timeattack' ? 2000 : 5000;
            this.app.getUIModule().showToast(message, 'lose', duration);
        }
        
        // Mettre à jour les affichages
        if (this.gameMode === 'standard') {
            this.updateStreakDisplay();
        }
        
        console.log(`❌ Défaite ! Mot: ${this.currentWord}`);
    }
    
    revealCompleteWord() {
        // Révéler toutes les lettres manquantes
        const allLetters = this.currentWord.toUpperCase().split('').filter(letter => /[A-Z]/.test(letter));
        const uniqueLetters = [...new Set(allLetters)];
        
        // Ajouter toutes les lettres manquantes à guessedLetters
        uniqueLetters.forEach(letter => {
            if (!this.guessedLetters.includes(letter)) {
                this.guessedLetters.push(letter);
            }
        });
        
        // Mettre à jour l'affichage avec une animation
        if (this.app.getUIModule()) {
            this.app.getUIModule().updateWordDisplay(this.currentWord, this.guessedLetters);
            
            // Animation spéciale pour les lettres révélées
            setTimeout(() => {
                const wordDisplay = document.getElementById('wordDisplay');
                if (wordDisplay) {
                    wordDisplay.style.color = '#ff6b6b'; // Rouge pour montrer l'échec
                    wordDisplay.style.animation = 'shake 0.5s ease';
                }
            }, 100);
        }
    }
    
    showErrorMessage() {
        const container = document.querySelector('.container');
        if (container) {
            container.innerHTML = `
                <div style="
                    text-align: center;
                    padding: 2rem;
                    color: var(--error-color);
                    font-size: 1.2rem;
                ">
                    <h2>⚠️ Erreur de chargement</h2>
                    <p>Impossible de charger les mots du jeu.</p>
                    <p>Veuillez vérifier votre connexion et actualiser la page.</p>
                    <button onclick="location.reload()" style="
                        margin-top: 1rem;
                        padding: 0.8rem 2rem;
                        font-size: 1rem;
                        background: var(--primary-color);
                        color: white;
                        border: none;
                        border-radius: 25px;
                        cursor: pointer;
                    ">Actualiser</button>
                </div>
            `;
        }
    }
    
    // ===== MÉTHODES PUBLIQUES POUR LES AUTRES MODULES ===== //
    
    getCurrentWord() {
        return this.currentWord;
    }
    
    getCurrentCategory() {
        return this.currentCategory;
    }
    
    isGameActive() {
        return this.gameActive;
    }
    
    getGameState() {
        return {
            word: this.currentWord,
            category: this.currentCategory,
            guessedLetters: [...this.guessedLetters],
            wrongLetters: [...this.wrongLetters],
            remainingTries: this.remainingTries,
            gameActive: this.gameActive
        };
    }
    
    // ===== MÉTHODES POUR LE MODE TIME ATTACK ===== //
    
    setGameMode(mode) {
        this.gameMode = mode;
        this.updateButtonsVisibility();
        console.log(`🎮 Mode de jeu: ${mode}`);
    }
    
    updateButtonsVisibility() {
        if (this.restartGameBtn) {
            if (this.gameMode === 'timeattack') {
                this.restartGameBtn.style.display = 'inline-block';
            } else {
                this.restartGameBtn.style.display = 'none';
            }
        }
    }
    
    getGameMode() {
        return this.gameMode;
    }
    
    endGame() {
        this.gameActive = false;
        if (this.app.getUIModule()) {
            this.app.getUIModule().clearGameMessage();
        }
    }
    
    // Méthode pour débugger (à supprimer en production)
    revealWord() {
        if (this.gameActive) {
            console.log(`🔍 Mot actuel: ${this.currentWord}`);
        }
    }
}